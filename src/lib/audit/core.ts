import type { AuditLog, Prisma, PrismaClient } from "../../../generated/prisma/client"

import { withSerializableRetry } from "../database/with-serializable-retry.ts"

import {
  calculateAuditIntegrityDigest,
  parseAuditEventInput,
  type AuditEventInput,
  type AuditScope,
  type PreparedAuditEvent,
  scopeMatchesRecord,
} from "./contract.ts"

export class AuditAccessDeniedError extends Error {
  constructor() {
    super("Audit Log access requires an active, effective membership in the exact scope")
    this.name = "AuditAccessDeniedError"
  }
}

type DatabaseTransaction = Prisma.TransactionClient

type ActiveAuditActor = Readonly<{
  identityAuthorizationVersion: number
  membershipAuthorizationVersion: number
  membershipOrganizationId: string
  membershipOrganizationType: "PLATFORM" | "ESAO" | "SCHOOL"
}>

function directScopeIsAllowed(actor: ActiveAuditActor, scope: AuditScope) {
  if (scope.kind === "PLATFORM") {
    return actor.membershipOrganizationType === "PLATFORM"
  }

  if (scope.kind === "ORGANIZATION") {
    return actor.membershipOrganizationId === scope.organizationId
  }

  return actor.membershipOrganizationId === scope.organizationId && scope.organizationId === scope.schoolId
}

async function resolveActiveAuditActor(
  transaction: DatabaseTransaction,
  event: AuditEventInput,
  now: Date,
): Promise<ActiveAuditActor> {
  const membership = await transaction.approvedMembership.findFirst({
    where: {
      id: event.actorMembershipId,
      identityId: event.actorIdentityId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      identity: {
        accountStatus: "ACTIVE",
      },
    },
    select: {
      authorizationVersion: true,
      organizationId: true,
      organization: { select: { type: true } },
      identity: { select: { authorizationVersion: true } },
    },
  })

  if (!membership) {
    throw new AuditAccessDeniedError()
  }

  const actor = Object.freeze({
    identityAuthorizationVersion: membership.identity.authorizationVersion,
    membershipAuthorizationVersion: membership.authorizationVersion,
    membershipOrganizationId: membership.organizationId,
    membershipOrganizationType: membership.organization.type,
  })

  if (!directScopeIsAllowed(actor, event.scope)) {
    throw new AuditAccessDeniedError()
  }

  return actor
}

function scopeData(scope: AuditScope) {
  if (scope.kind === "PLATFORM") {
    return { scopeKind: "PLATFORM" as const, scopeOrganizationId: null, scopeSchoolId: null }
  }

  if (scope.kind === "ORGANIZATION") {
    return {
      scopeKind: "ORGANIZATION" as const,
      scopeOrganizationId: scope.organizationId,
      scopeSchoolId: null,
    }
  }

  return {
    scopeKind: "SCHOOL" as const,
    scopeOrganizationId: scope.organizationId,
    scopeSchoolId: scope.schoolId,
  }
}

function preparedAuditEvent(
  event: AuditEventInput,
  actor: ActiveAuditActor,
  sequence: bigint,
  previousIntegrityDigest: string | null,
): PreparedAuditEvent {
  return {
    ...event,
    sequence,
    actorAuthorizationVersion: actor.identityAuthorizationVersion,
    actorMembershipAuthorizationVersion: actor.membershipAuthorizationVersion,
    previousIntegrityDigest,
  }
}

export async function recordAuditEvent(database: PrismaClient, input: unknown): Promise<AuditLog> {
  return withSerializableRetry(
    () =>
      database.$transaction(
        (transaction) => recordAuditEventInTransaction(transaction, input),
        { isolationLevel: "Serializable" },
      ),
    { operationKey: "P1-08-AUDIT-LOG-APPEND" },
  )
}

// Commands that change another immutable record use this helper inside their
// existing SERIALIZABLE transaction, keeping that business record and its
// AuditLog append atomically committed or rolled back together.
export async function recordAuditEventInTransaction(
  transaction: DatabaseTransaction,
  input: unknown,
): Promise<AuditLog> {
  const event = parseAuditEventInput(input)
  const actor = await resolveActiveAuditActor(transaction, event, new Date())

  // This lock matches the insert trigger so the predecessor lookup and insert
  // form one globally ordered chain under the caller's transaction boundary.
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended('SchoolBanchee AuditLog chain', 8))
  `

  const predecessor = await transaction.auditLog.findFirst({
    orderBy: { sequence: "desc" },
    select: { sequence: true, integrityDigest: true },
  })
  const sequence = predecessor ? predecessor.sequence + BigInt(1) : BigInt(1)
  const prepared = preparedAuditEvent(event, actor, sequence, predecessor?.integrityDigest ?? null)
  const integrityDigest = calculateAuditIntegrityDigest(prepared)

  return transaction.auditLog.create({
    data: {
      sequence,
      actorIdentityId: prepared.actorIdentityId,
      actorMembershipId: prepared.actorMembershipId,
      actorAuthorizationVersion: prepared.actorAuthorizationVersion,
      actorMembershipAuthorizationVersion: prepared.actorMembershipAuthorizationVersion,
      ...scopeData(prepared.scope),
      commandCode: prepared.commandCode,
      targetType: prepared.targetType,
      targetId: prepared.targetId,
      outcome: prepared.outcome,
      reasonCode: prepared.reasonCode,
      correlationId: prepared.correlationId,
      occurredAt: prepared.occurredAt,
      previousIntegrityDigest: prepared.previousIntegrityDigest,
      integrityDigest,
    },
  })
}

export async function readScopedAuditLog(
  database: PrismaClient,
  input: Readonly<{
    actorIdentityId: string
    actorMembershipId: string
    scope: AuditScope
    purposeCode: string
    occurredAt: Date
  }>,
) {
  const scope = input.scope
  const targetId = scope.kind === "PLATFORM" ? "PLATFORM" : scope.organizationId

  await recordAuditEvent(database, {
    actorIdentityId: input.actorIdentityId,
    actorMembershipId: input.actorMembershipId,
    scope,
    commandCode: "AUDIT-LOG-READ",
    targetType: "AuditLog",
    targetId,
    outcome: "SUCCESS",
    reasonCode: input.purposeCode,
    occurredAt: input.occurredAt,
  })

  const allRecords = await database.auditLog.findMany({ orderBy: { sequence: "asc" } })
  return allRecords.filter((record) => scopeMatchesRecord(scope, record))
}

export function assertAuditLogIntegrity(records: readonly AuditLog[]) {
  let expectedSequence = BigInt(1)
  let previousIntegrityDigest: string | null = null

  for (const record of records) {
    if (record.sequence !== expectedSequence || record.previousIntegrityDigest !== previousIntegrityDigest) {
      throw new Error("Audit Log sequence or predecessor digest is invalid")
    }

    const scope: AuditScope =
      record.scopeKind === "PLATFORM"
        ? { kind: "PLATFORM" }
        : record.scopeKind === "ORGANIZATION" && record.scopeOrganizationId
          ? { kind: "ORGANIZATION", organizationId: record.scopeOrganizationId }
          : record.scopeKind === "SCHOOL" && record.scopeOrganizationId && record.scopeSchoolId
            ? {
                kind: "SCHOOL",
                organizationId: record.scopeOrganizationId,
                schoolId: record.scopeSchoolId,
              }
            : (() => {
                throw new Error("Audit Log scope is malformed")
              })()
    const expectedDigest = calculateAuditIntegrityDigest({
      sequence: record.sequence,
      actorIdentityId: record.actorIdentityId,
      actorMembershipId: record.actorMembershipId,
      actorAuthorizationVersion: record.actorAuthorizationVersion,
      actorMembershipAuthorizationVersion: record.actorMembershipAuthorizationVersion,
      scope,
      commandCode: record.commandCode,
      targetType: record.targetType,
      targetId: record.targetId,
      outcome: record.outcome,
      reasonCode: record.reasonCode,
      correlationId: record.correlationId,
      occurredAt: record.occurredAt,
      previousIntegrityDigest: record.previousIntegrityDigest,
    })

    if (record.integrityDigest !== expectedDigest) {
      throw new Error("Audit Log integrity digest is invalid")
    }

    expectedSequence += BigInt(1)
    previousIntegrityDigest = record.integrityDigest
  }
}
