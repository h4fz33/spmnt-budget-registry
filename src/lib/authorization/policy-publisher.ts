import type { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { randomUUID } from "node:crypto"
import { z } from "zod"

import { requireFreshAuthentication } from "../auth/session.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"
import { SYSTEM_ADMIN_BOOTSTRAP_ID } from "../bootstrap/constants.ts"
import { PILOT_ESAO_ORGANIZATION_ID, PRIVATE_PRODUCT_OWNER_LABEL } from "../bootstrap/sesao-auditor.ts"

export const POLICY_PUBLISHER_DESIGNATION_COMMAND = "AUTH-08"
export const POLICY_PUBLISHER_CURRENT_STATUS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const OFFICIAL_SESAO_HOST = "www.sesaonara.go.th"
const uuid = z.string().uuid()
const hash = z.string().regex(/^[0-9a-f]{64}$/)

const actorSchema = z.object({
  identityId: uuid,
  membershipId: uuid,
  accountIdentifier: z.string().trim().min(1).max(320),
  authorizationVersion: z.number().int().positive(),
  membershipAuthorizationVersion: z.number().int().positive(),
  authenticatedAt: z.number().int().nonnegative(),
}).strict()

const approvalSchema = z.object({
  externalApprovalRecordId: z.string().trim().min(1).max(128),
  approvalAuthorityLabel: z.string().trim().min(1).max(128),
  approvalAuthorityIdentity: z.string().trim().min(1).max(320),
  approvalEvidenceReference: z.string().trim().min(1).max(512),
  approvalEvidenceHash: hash,
  scopeEvidenceReference: z.string().trim().min(1).max(512),
  scopeEvidenceHash: hash,
}).strict()

const currentStatusEvidenceSchema = z.object({
  officialPageUrl: z.string().url().max(2_000),
  retrievedAt: z.date(),
  namedPersonResult: z.string().trim().min(1).max(2_000),
  conflictOutcome: z.string().trim().min(1).max(512),
  evidenceReference: z.string().trim().min(1).max(512),
  evidenceHash: hash,
}).strict()

const subjectSchema = z.object({
  identityId: uuid,
  accountIdentifier: z.string().trim().min(1).max(320),
  personName: z.string().trim().min(1).max(200),
  currentStatusEvidence: currentStatusEvidenceSchema,
}).strict()

const commandSchema = z.object({
  action: z.enum(["DESIGNATE", "REPLACE"]),
  actor: actorSchema,
  approval: approvalSchema,
  current: subjectSchema,
  standby: subjectSchema,
  effectiveFrom: z.date(),
}).strict()

export class PolicyPublisherDesignationError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = "PolicyPublisherDesignationError"
    this.code = code
  }
}

export class PolicyPublisherFreshAuthenticationRequiredError extends PolicyPublisherDesignationError {
  constructor() { super("FRESH_SYSTEM_ADMIN_AUTHENTICATION_REQUIRED") }
}

export class PolicyPublisherReplayError extends PolicyPublisherDesignationError {
  constructor() { super("POLICY_PUBLISHER_DESIGNATION_REPLAY") }
}

type Transaction = Prisma.TransactionClient
type ExecutionActor = z.infer<typeof actorSchema>
type Subject = z.infer<typeof subjectSchema>
type Command = z.infer<typeof commandSchema>

function immutableDigest(value: object) {
  return calculateJsonIntegrityDigest(value as never)
}

function assertFreshSystemAdminSession(actor: ExecutionActor, now: Date) {
  const session = {
    expires: new Date(now.getTime() + 60_000).toISOString(),
    user: {
      id: actor.identityId,
      accountIdentifier: actor.accountIdentifier,
      authorizationVersion: actor.authorizationVersion,
      authenticatedAt: actor.authenticatedAt,
    },
  }
  if (!requireFreshAuthentication(session, now.getTime())) {
    throw new PolicyPublisherFreshAuthenticationRequiredError()
  }
}

async function requireSystemAdmin(transaction: Transaction, actor: ExecutionActor, now: Date) {
  assertFreshSystemAdminSession(actor, now)
  const bootstrap = await transaction.systemAdminBootstrap.findUnique({
    where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
    select: {
      identityId: true,
      membershipId: true,
      identity: { select: { accountIdentifier: true, accountStatus: true, authorizationVersion: true } },
      membership: {
        select: {
          identityId: true,
          organizationId: true,
          status: true,
          authorizationVersion: true,
          effectiveFrom: true,
          effectiveTo: true,
          organization: { select: { type: true, status: true } },
        },
      },
    },
  })

  if (
    !bootstrap ||
    bootstrap.identityId !== actor.identityId ||
    bootstrap.membershipId !== actor.membershipId ||
    bootstrap.identity.accountIdentifier !== actor.accountIdentifier ||
    bootstrap.identity.accountStatus !== "ACTIVE" ||
    bootstrap.identity.authorizationVersion !== actor.authorizationVersion ||
    bootstrap.membership.identityId !== actor.identityId ||
    bootstrap.membership.authorizationVersion !== actor.membershipAuthorizationVersion ||
    bootstrap.membership.status !== "ACTIVE" ||
    bootstrap.membership.effectiveFrom > now ||
    (bootstrap.membership.effectiveTo !== null && bootstrap.membership.effectiveTo <= now) ||
    bootstrap.membership.organization.type !== "PLATFORM" ||
    bootstrap.membership.organization.status !== "ACTIVE"
  ) {
    throw new PolicyPublisherDesignationError("ACTIVE_SYSTEM_ADMIN_REQUIRED")
  }

  return bootstrap
}

async function requireExactPilotScope(transaction: Transaction) {
  const schools = await transaction.school.findMany({
    where: {
      directoryIsActive: true,
      organization: {
        parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
        type: "SCHOOL",
        status: "ACTIVE",
      },
    },
    select: { organizationId: true },
    orderBy: { organizationId: "asc" },
  })
  if (schools.length !== 17) {
    throw new PolicyPublisherDesignationError("IMMUTABLE_17_SCHOOL_SCOPE_REQUIRED")
  }
  return schools.map((school) => school.organizationId)
}

function assertApproval(approval: Command["approval"]) {
  if (approval.approvalAuthorityLabel !== PRIVATE_PRODUCT_OWNER_LABEL) {
    throw new PolicyPublisherDesignationError("PRODUCT_OWNER_APPROVAL_REQUIRED")
  }
}

function assertCurrentStatusEvidence(subject: Subject, now: Date) {
  const evidence = subject.currentStatusEvidence
  let page: URL
  try {
    page = new URL(evidence.officialPageUrl)
  } catch {
    throw new PolicyPublisherDesignationError("OFFICIAL_INTERNAL_AUDIT_PAGE_REQUIRED")
  }
  if (page.protocol !== "https:" || page.hostname !== OFFICIAL_SESAO_HOST) {
    throw new PolicyPublisherDesignationError("OFFICIAL_INTERNAL_AUDIT_PAGE_REQUIRED")
  }
  if (evidence.retrievedAt.getTime() > now.getTime() || now.getTime() - evidence.retrievedAt.getTime() > POLICY_PUBLISHER_CURRENT_STATUS_MAX_AGE_MS) {
    throw new PolicyPublisherDesignationError("STALE_CURRENT_STATUS_EVIDENCE")
  }
  if (!evidence.namedPersonResult.includes(subject.personName)) {
    throw new PolicyPublisherDesignationError("CURRENT_STATUS_NAME_MISMATCH")
  }
  if (evidence.conflictOutcome.trim() !== "NO_CONFLICT") {
    throw new PolicyPublisherDesignationError("CURRENT_STATUS_CONFLICT")
  }
}

async function requireSubject(transaction: Transaction, subject: Subject, now: Date) {
  const identity = await transaction.authenticatedIdentity.findUnique({
    where: { id: subject.identityId },
    select: {
      id: true,
      accountIdentifier: true,
      displayName: true,
      accountStatus: true,
      memberships: {
        where: {
          organizationId: PILOT_ESAO_ORGANIZATION_ID,
          status: "ACTIVE",
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
        select: { id: true },
        take: 2,
      },
    },
  })
  if (
    !identity ||
    identity.accountStatus !== "ACTIVE" ||
    identity.accountIdentifier !== subject.accountIdentifier ||
    identity.displayName !== subject.personName ||
    identity.memberships.length !== 1
  ) {
    throw new PolicyPublisherDesignationError("ELIGIBLE_INTERNAL_AUDIT_SUBJECT_REQUIRED")
  }
  return identity
}

function assertExactPair(command: Command, now: Date) {
  if (command.current.identityId === command.standby.identityId || command.current.accountIdentifier === command.standby.accountIdentifier) {
    throw new PolicyPublisherDesignationError("DISTINCT_CURRENT_AND_STANDBY_REQUIRED")
  }
  if (command.current.identityId === command.actor.identityId || command.standby.identityId === command.actor.identityId) {
    throw new PolicyPublisherDesignationError("SYSTEM_ADMIN_SELF_GRANT_DENIED")
  }
  if (Number.isNaN(command.effectiveFrom.getTime()) || command.effectiveFrom.getTime() > now.getTime()) {
    throw new PolicyPublisherDesignationError("INVALID_DESIGNATION_EFFECTIVE_TIME")
  }
}

export type PolicyPublisherDesignationResult = Readonly<{
  action: "DESIGNATE" | "REPLACE"
  currentDesignationId: string
  standbyDesignationId: string
  provenanceId: string
  auditEventId: string
}>

export async function applyPolicyPublisherDesignation(
  database: PrismaClient,
  input: unknown,
  now = new Date(),
): Promise<PolicyPublisherDesignationResult> {
  const parsed = commandSchema.safeParse(input)
  if (!parsed.success || Number.isNaN(now.getTime())) {
    throw new PolicyPublisherDesignationError("POLICY_PUBLISHER_DESIGNATION_RECORD_INVALID")
  }
  const command = parsed.data
  assertApproval(command.approval)
  assertExactPair(command, now)
  assertCurrentStatusEvidence(command.current, now)
  assertCurrentStatusEvidence(command.standby, now)

  return withSerializableRetry(
    () => database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('SchoolBanchee P1-20 Policy Publisher designation', 8))`
      const executor = await requireSystemAdmin(transaction, command.actor, now)
      const schoolIds = await requireExactPilotScope(transaction)
      const currentSubject = await requireSubject(transaction, command.current, now)
      const standbySubject = await requireSubject(transaction, command.standby, now)

      const active = await transaction.policyPublisherDesignation.findMany({
        where: {
          organizationId: PILOT_ESAO_ORGANIZATION_ID,
          status: { in: ["CURRENT", "STANDBY"] },
        },
        orderBy: { createdAt: "asc" },
      })
      const previousCurrent = active.find((designation) => designation.status === "CURRENT") ?? null
      const previousStandby = active.find((designation) => designation.status === "STANDBY") ?? null
      if (active.length !== (previousCurrent ? 1 : 0) + (previousStandby ? 1 : 0)) {
        throw new PolicyPublisherDesignationError("CONCURRENT_POLICY_PUBLISHER_DESIGNATIONS")
      }
      if (await transaction.policyPublisherDesignationProvenance.findUnique({ where: { externalApprovalRecordId: command.approval.externalApprovalRecordId }, select: { id: true } })) {
        throw new PolicyPublisherReplayError()
      }

      if (command.action === "DESIGNATE") {
        const currentProvenance = previousCurrent && !previousStandby
          ? await transaction.policyPublisherDesignationProvenance.findFirst({
              where: {
                OR: [
                  { currentDesignationId: previousCurrent.id },
                  { standbyDesignationId: previousCurrent.id },
                ],
              },
              select: { id: true },
            })
          : null
        const legacyCurrentOnly = Boolean(previousCurrent && !previousStandby && !currentProvenance)
        if ((previousCurrent || previousStandby) && !legacyCurrentOnly) {
          throw new PolicyPublisherDesignationError("EXISTING_DESIGNATION_REQUIRES_ATOMIC_REPLACEMENT")
        }
        if (previousCurrent) {
          await transaction.policyPublisherDesignation.update({
            where: { id: previousCurrent.id },
            data: { status: "SUPERSEDED", supersededAt: now },
          })
        }
      } else {
        if (!previousCurrent || !previousStandby) {
          throw new PolicyPublisherDesignationError("CURRENT_AND_STANDBY_REQUIRED_FOR_REPLACEMENT")
        }
        if (command.current.identityId !== previousStandby.identityId) {
          throw new PolicyPublisherDesignationError("REPLACEMENT_MUST_ACTIVATE_STANDBY")
        }
        if (command.current.currentStatusEvidence.retrievedAt <= previousStandby.retrievedAt) {
          throw new PolicyPublisherDesignationError("UPDATED_CURRENT_STATUS_EVIDENCE_REQUIRED")
        }
        if (command.standby.identityId === previousCurrent.identityId && command.standby.currentStatusEvidence.retrievedAt <= previousCurrent.retrievedAt) {
          throw new PolicyPublisherDesignationError("UPDATED_CURRENT_STATUS_EVIDENCE_REQUIRED")
        }
        await transaction.policyPublisherDesignation.updateMany({
          where: { id: { in: [previousCurrent.id, previousStandby.id] } },
          data: { status: "SUPERSEDED", supersededAt: now },
        })
      }

      const currentDesignationId = randomUUID()
      const standbyDesignationId = randomUUID()
      await transaction.policyPublisherDesignation.createMany({
        data: [
          {
            id: currentDesignationId,
            organizationId: PILOT_ESAO_ORGANIZATION_ID,
            identityId: currentSubject.id,
            status: "CURRENT",
            officialPageUrl: command.current.currentStatusEvidence.officialPageUrl,
            retrievedAt: command.current.currentStatusEvidence.retrievedAt,
            namedPersonResult: command.current.currentStatusEvidence.namedPersonResult,
            conflictOutcome: command.current.currentStatusEvidence.conflictOutcome,
            evidenceReference: command.current.currentStatusEvidence.evidenceReference,
            evidenceHash: command.current.currentStatusEvidence.evidenceHash,
            effectiveFrom: command.effectiveFrom,
          },
          {
            id: standbyDesignationId,
            organizationId: PILOT_ESAO_ORGANIZATION_ID,
            identityId: standbySubject.id,
            status: "STANDBY",
            officialPageUrl: command.standby.currentStatusEvidence.officialPageUrl,
            retrievedAt: command.standby.currentStatusEvidence.retrievedAt,
            namedPersonResult: command.standby.currentStatusEvidence.namedPersonResult,
            conflictOutcome: command.standby.currentStatusEvidence.conflictOutcome,
            evidenceReference: command.standby.currentStatusEvidence.evidenceReference,
            evidenceHash: command.standby.currentStatusEvidence.evidenceHash,
            effectiveFrom: command.effectiveFrom,
          },
        ],
      })

      const provenanceId = randomUUID()
      const integrityDigest = immutableDigest({
        version: 1,
        provenanceId,
        action: command.action,
        organizationId: PILOT_ESAO_ORGANIZATION_ID,
        currentDesignationId,
        standbyDesignationId,
        currentIdentityId: currentSubject.id,
        standbyIdentityId: standbySubject.id,
        approval: command.approval,
        currentStatusEvidence: command.current.currentStatusEvidence,
        standbyStatusEvidence: command.standby.currentStatusEvidence,
        pilotSchoolIds: schoolIds,
        technicalExecutorIdentityId: executor.identityId,
        technicalExecutorMembershipId: executor.membershipId,
        executedAt: now.toISOString(),
      })
      await transaction.policyPublisherDesignationProvenance.create({
        data: {
          id: provenanceId,
          action: command.action,
          externalApprovalRecordId: command.approval.externalApprovalRecordId,
          approvalAuthorityLabel: command.approval.approvalAuthorityLabel,
          approvalAuthorityIdentity: command.approval.approvalAuthorityIdentity,
          approvalEvidenceReference: command.approval.approvalEvidenceReference,
          approvalEvidenceHash: command.approval.approvalEvidenceHash,
          scopeEvidenceReference: command.approval.scopeEvidenceReference,
          scopeEvidenceHash: command.approval.scopeEvidenceHash,
          organizationId: PILOT_ESAO_ORGANIZATION_ID,
          currentDesignationId,
          standbyDesignationId,
          technicalExecutorIdentityId: executor.identityId,
          technicalExecutorMembershipId: executor.membershipId,
          executedAt: now,
          integrityDigest,
        },
      })
      const audit = await recordAuditEventInTransaction(transaction, {
        actorIdentityId: executor.identityId,
        actorMembershipId: executor.membershipId,
        scope: { kind: "PLATFORM" },
        commandCode: POLICY_PUBLISHER_DESIGNATION_COMMAND,
        targetType: "PolicyPublisherDesignationProvenance",
        targetId: provenanceId,
        outcome: "SUCCESS",
        reasonCode: command.action === "DESIGNATE" ? "POLICY_PUBLISHER_DESIGNATION_APPLIED" : "POLICY_PUBLISHER_ALTERNATE_REPLACED",
        correlationId: command.approval.externalApprovalRecordId,
        occurredAt: now,
      })

      return Object.freeze({
        action: command.action,
        currentDesignationId,
        standbyDesignationId,
        provenanceId,
        auditEventId: audit.id,
      })
    }, { isolationLevel: "Serializable" }),
    { operationKey: `P1-20-POLICY-PUBLISHER-${command.action}` },
  )
}

export type ActivePolicyPublisher = Readonly<{
  designationId: string
  identityId: string
  accountIdentifier: string
  personName: string
  organizationId: string
  authorizationVersion: number
}>

export async function resolveCurrentPolicyPublisher(
  database: PrismaClient,
  input: Readonly<{ identityId: string; authorizationVersion: number; now?: Date }>,
): Promise<ActivePolicyPublisher | null> {
  const now = input.now ?? new Date()
  if (!uuid.safeParse(input.identityId).success || !Number.isSafeInteger(input.authorizationVersion) || input.authorizationVersion < 1 || Number.isNaN(now.getTime())) {
    return null
  }
  const designation = await database.policyPublisherDesignation.findFirst({
    where: {
      organizationId: PILOT_ESAO_ORGANIZATION_ID,
      identityId: input.identityId,
      status: "CURRENT",
      effectiveFrom: { lte: now },
      identity: {
        accountStatus: "ACTIVE",
        authorizationVersion: input.authorizationVersion,
        memberships: {
          some: {
            organizationId: PILOT_ESAO_ORGANIZATION_ID,
            status: "ACTIVE",
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
          },
        },
      },
    },
    select: {
      id: true,
      identityId: true,
      organizationId: true,
      identity: { select: { accountIdentifier: true, displayName: true, authorizationVersion: true } },
    },
  })
  if (!designation) return null
  const provenance = await database.policyPublisherDesignationProvenance.findFirst({
    where: { currentDesignationId: designation.id, organizationId: PILOT_ESAO_ORGANIZATION_ID },
    select: { id: true },
  })
  if (!provenance) return null

  return Object.freeze({
    designationId: designation.id,
    identityId: designation.identityId,
    accountIdentifier: designation.identity.accountIdentifier,
    personName: designation.identity.displayName,
    organizationId: designation.organizationId,
    authorizationVersion: designation.identity.authorizationVersion,
  })
}
