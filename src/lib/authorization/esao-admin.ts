import type { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { randomUUID } from "node:crypto"
import { z } from "zod"

import { requireFreshAuthentication } from "../auth/session.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"

export const ESAO_ADMIN_ROLE = "ESAO_ADMIN"
export const PILOT_ESAO_ORGANIZATION_ID = "10009600-0001-5000-8000-000000000001"
export const PILOT_ESAO_CODE = "1000960001"
export const PRIVATE_PRODUCT_OWNER_LABEL = "Private Business / Product Owner"
export const ESAO_ADMIN_CONFIGURATION_COMMAND = "AUTH-06"

const uuid = z.string().uuid()
const hash = z.string().regex(/^[0-9a-f]{64}$/)
const syntheticAccountIdentifier = z
  .string()
  .trim()
  .email()
  .max(320)
  .refine((value) => value.endsWith("@synthetic.test"))
const actorSchema = z
  .object({
    identityId: uuid,
    membershipId: uuid,
    accountIdentifier: z.string().min(1).max(320),
    authorizationVersion: z.number().int().positive(),
    membershipAuthorizationVersion: z.number().int().positive(),
    authenticatedAt: z.number().int().nonnegative(),
  })
  .strict()
const evidenceSchema = z
  .object({
    externalApprovalRecordId: z.string().trim().min(1).max(128),
    approvalAuthorityLabel: z.literal(PRIVATE_PRODUCT_OWNER_LABEL),
    approvalAuthorityIdentity: z.string().trim().min(1).max(320),
    approvalEvidenceReference: z.string().trim().min(1).max(512),
    approvalEvidenceHash: hash,
  })
  .strict()
const subjectSchema = z
  .object({
    subjectIdentityId: uuid,
    subjectAccountIdentifier: syntheticAccountIdentifier,
    subjectPersonName: z.string().trim().min(1).max(200),
    subjectRoleCode: z.literal(ESAO_ADMIN_ROLE),
    subjectEsaoOrganizationId: z.literal(PILOT_ESAO_ORGANIZATION_ID),
    schoolIds: z.array(uuid).length(17),
  })
  .strict()
const appointmentSchema = z.object({ actor: actorSchema, evidence: evidenceSchema, subject: subjectSchema }).strict()
const revokeSchema = z.object({ actor: actorSchema, configurationId: uuid, evidence: evidenceSchema, subject: subjectSchema }).strict()

export class EsaoAdminAuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EsaoAdminAuthorizationError"
  }
}

export class EsaoAdminFreshAuthenticationRequiredError extends EsaoAdminAuthorizationError {}
export class EsaoAdminApprovalRecordError extends EsaoAdminAuthorizationError {}
export class EsaoAdminReplayError extends EsaoAdminAuthorizationError {}

type Transaction = Prisma.TransactionClient
type ExecutionActor = z.infer<typeof actorSchema>

function parseActorAndFresh(actor: ExecutionActor, now: Date) {
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
    throw new EsaoAdminFreshAuthenticationRequiredError("Fresh System Admin authentication is required")
  }
}

async function requireSystemAdmin(transaction: Transaction, actor: ExecutionActor, now: Date) {
  parseActorAndFresh(actor, now)
  const bootstrap = await transaction.systemAdminBootstrap.findUnique({
    where: { id: "p1-17" },
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
    bootstrap.identity.accountStatus !== "ACTIVE" ||
    bootstrap.identity.authorizationVersion !== actor.authorizationVersion ||
    bootstrap.identity.accountIdentifier !== actor.accountIdentifier ||
    bootstrap.membership.identityId !== actor.identityId ||
    bootstrap.membership.authorizationVersion !== actor.membershipAuthorizationVersion ||
    bootstrap.membership.status !== "ACTIVE" ||
    bootstrap.membership.effectiveFrom > now ||
    (bootstrap.membership.effectiveTo !== null && bootstrap.membership.effectiveTo <= now) ||
    bootstrap.membership.organization.type !== "PLATFORM" ||
    bootstrap.membership.organization.status !== "ACTIVE"
  ) {
    throw new EsaoAdminAuthorizationError("Only the active System Admin may apply ESAO Admin configuration")
  }
  return bootstrap
}

async function exactPilotSchoolIds(transaction: Transaction) {
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
    throw new EsaoAdminApprovalRecordError("The approved ESAO Admin scope must resolve to exactly 17 active pilot Schools")
  }
  return schools.map((school) => school.organizationId)
}

function assertExactScope(expected: readonly string[], supplied: readonly string[]) {
  const left = [...expected].sort()
  const right = [...new Set(supplied)].sort()
  if (right.length !== 17 || left.some((value, index) => value !== right[index])) {
    throw new EsaoAdminApprovalRecordError("Approved ESAO Admin scope is not the immutable 17-school pilot scope")
  }
}

function digest(value: object) {
  return calculateJsonIntegrityDigest(value as never)
}

function hasOnlyActiveEsaoMembership(
  memberships: readonly {
    organizationId: string
    status: string
    effectiveFrom: Date
    effectiveTo: Date | null
    organization: { type: string; status: string }
    roleAssignments: readonly unknown[]
  }[],
  now: Date,
) {
  return (
    memberships.length === 1 &&
    memberships[0]!.organizationId === PILOT_ESAO_ORGANIZATION_ID &&
    memberships[0]!.status === "ACTIVE" &&
    memberships[0]!.effectiveFrom <= now &&
    (memberships[0]!.effectiveTo === null || memberships[0]!.effectiveTo! > now) &&
    memberships[0]!.organization.type === "ESAO" &&
    memberships[0]!.organization.status === "ACTIVE" &&
    memberships[0]!.roleAssignments.length === 0
  )
}

async function requireExactSubject(
  transaction: Transaction,
  subjectInput: z.infer<typeof subjectSchema>,
  executorIdentityId: string,
  now: Date,
) {
  if (subjectInput.subjectIdentityId === executorIdentityId) {
    throw new EsaoAdminApprovalRecordError("System Admin cannot self-configure as ESAO Admin")
  }
  const subject = await transaction.authenticatedIdentity.findUnique({
    where: { id: subjectInput.subjectIdentityId },
    select: {
      id: true,
      accountIdentifier: true,
      displayName: true,
      accountStatus: true,
      memberships: {
        select: {
          organizationId: true,
          status: true,
          effectiveFrom: true,
          effectiveTo: true,
          organization: { select: { type: true, status: true } },
          roleAssignments: { select: { id: true } },
        },
      },
    },
  })
  if (
    !subject ||
    subject.accountStatus !== "ACTIVE" ||
    subject.accountIdentifier !== subjectInput.subjectAccountIdentifier ||
    subject.displayName !== subjectInput.subjectPersonName ||
    !hasOnlyActiveEsaoMembership(subject.memberships, now)
  ) {
    throw new EsaoAdminApprovalRecordError(
      "Approved ESAO Admin subject must be an active synthetic identity with only one active ESAO membership and no School role",
    )
  }
  return subject
}

export type EsaoAdminCommandResult = Readonly<{
  configurationId: string
  provenanceId: string
  auditEventId: string
}>

export async function applyEsaoAdminConfiguration(
  database: PrismaClient,
  input: unknown,
  now = new Date(),
): Promise<EsaoAdminCommandResult> {
  const parsed = appointmentSchema.safeParse(input)
  if (!parsed.success) {
    throw new EsaoAdminApprovalRecordError("ESAO Admin configuration record is invalid")
  }
  const value = parsed.data

  return withSerializableRetry(
    () =>
      database.$transaction(async (transaction) => {
        const executor = await requireSystemAdmin(transaction, value.actor, now)
        const expectedSchools = await exactPilotSchoolIds(transaction)
        assertExactScope(expectedSchools, value.subject.schoolIds)
        const subject = await requireExactSubject(transaction, value.subject, executor.identityId, now)
        const priorEvidence = await transaction.esaoAdminProvenance.findFirst({
          where: { externalApprovalRecordId: value.evidence.externalApprovalRecordId },
          select: { id: true },
        })
        if (priorEvidence) {
          throw new EsaoAdminReplayError("ESAO Admin approval record has already been applied")
        }
        const active = await transaction.esaoAdminConfiguration.findFirst({
          where: { identityId: subject.id, status: "ACTIVE" },
          select: { id: true },
        })
        if (active) {
          throw new EsaoAdminReplayError("ESAO Admin subject already has an active configuration")
        }

        const configurationId = randomUUID()
        const integrityDigest = digest({
          version: 1,
          configurationId,
          identityId: subject.id,
          personName: value.subject.subjectPersonName,
          roleCode: ESAO_ADMIN_ROLE,
          esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
          schoolIds: expectedSchools,
          source: "APPROVED_APPOINTMENT",
          approval: value.evidence,
        })
        await transaction.esaoAdminConfiguration.create({
          data: {
            id: configurationId,
            identityId: subject.id,
            personNameSnapshot: value.subject.subjectPersonName,
            roleCode: ESAO_ADMIN_ROLE,
            esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
            configurationSource: "APPROVED_APPOINTMENT",
            integrityDigest,
            schoolScopes: { create: expectedSchools.map((schoolId) => ({ schoolId })) },
          },
        })
        const provenanceId = randomUUID()
        const provenanceIntegrityDigest = digest({
          version: 1,
          provenanceId,
          configurationId,
          action: "APPOINT",
          evidence: value.evidence,
          subject: value.subject,
          technicalExecutorIdentityId: executor.identityId,
          technicalExecutorMembershipId: executor.membershipId,
          executedAt: now.toISOString(),
        })
        await transaction.esaoAdminProvenance.create({
          data: {
            id: provenanceId,
            configurationId,
            action: "APPOINT",
            ...value.evidence,
            subjectIdentityId: subject.id,
            subjectAccountIdentifier: value.subject.subjectAccountIdentifier,
            subjectPersonName: value.subject.subjectPersonName,
            subjectRoleCode: ESAO_ADMIN_ROLE,
            subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
            technicalExecutorIdentityId: executor.identityId,
            technicalExecutorMembershipId: executor.membershipId,
            executedAt: now,
            integrityDigest: provenanceIntegrityDigest,
          },
        })
        const audit = await recordAuditEventInTransaction(transaction, {
          actorIdentityId: executor.identityId,
          actorMembershipId: executor.membershipId,
          scope: { kind: "PLATFORM" },
          commandCode: ESAO_ADMIN_CONFIGURATION_COMMAND,
          targetType: "EsaoAdminConfiguration",
          targetId: configurationId,
          outcome: "SUCCESS",
          reasonCode: "ESAO_ADMIN_CONFIGURATION_APPLIED",
          correlationId: value.evidence.externalApprovalRecordId,
          occurredAt: now,
        })
        return Object.freeze({ configurationId, provenanceId, auditEventId: audit.id })
      }, { isolationLevel: "Serializable" }),
    { operationKey: "P1-18-ESAO-ADMIN-CONFIGURATION" },
  )
}

export async function revokeEsaoAdminConfiguration(
  database: PrismaClient,
  input: unknown,
  now = new Date(),
): Promise<EsaoAdminCommandResult> {
  const parsed = revokeSchema.safeParse(input)
  if (!parsed.success) {
    throw new EsaoAdminApprovalRecordError("ESAO Admin revocation record is invalid")
  }
  const value = parsed.data

  return withSerializableRetry(
    () =>
      database.$transaction(async (transaction) => {
        const executor = await requireSystemAdmin(transaction, value.actor, now)
        const expectedSchools = await exactPilotSchoolIds(transaction)
        assertExactScope(expectedSchools, value.subject.schoolIds)
        const subject = await requireExactSubject(transaction, value.subject, executor.identityId, now)
        const priorEvidence = await transaction.esaoAdminProvenance.findFirst({
          where: { externalApprovalRecordId: value.evidence.externalApprovalRecordId },
          select: { id: true },
        })
        if (priorEvidence) {
          throw new EsaoAdminReplayError("ESAO Admin approval record has already been applied")
        }
        const configuration = await transaction.esaoAdminConfiguration.findUnique({
          where: { id: value.configurationId },
          include: {
            identity: { select: { accountIdentifier: true } },
            schoolScopes: { select: { schoolId: true } },
          },
        })
        if (
          !configuration ||
          configuration.status !== "ACTIVE" ||
          configuration.effectiveFrom > now ||
          configuration.identityId !== subject.id ||
          configuration.identity.accountIdentifier !== value.subject.subjectAccountIdentifier ||
          configuration.personNameSnapshot !== value.subject.subjectPersonName ||
          configuration.roleCode !== ESAO_ADMIN_ROLE ||
          configuration.esaoOrganizationId !== PILOT_ESAO_ORGANIZATION_ID
        ) {
          throw new EsaoAdminApprovalRecordError("ESAO Admin revocation does not match the active configuration")
        }
        assertExactScope(expectedSchools, configuration.schoolScopes.map((scope) => scope.schoolId))

        await transaction.$executeRaw`SELECT set_config('p1_18.allow_revoke', '1', true)`
        await transaction.esaoAdminConfiguration.update({
          where: { id: configuration.id },
          data: { status: "REVOKED", revokedAt: now },
        })
        await transaction.authenticatedIdentity.update({
          where: { id: configuration.identityId },
          data: { authorizationVersion: { increment: 1 } },
        })
        await transaction.approvedMembership.updateMany({
          where: {
            identityId: configuration.identityId,
            organizationId: PILOT_ESAO_ORGANIZATION_ID,
            status: "ACTIVE",
          },
          data: { authorizationVersion: { increment: 1 } },
        })
        const provenanceId = randomUUID()
        const provenanceIntegrityDigest = digest({
          version: 1,
          provenanceId,
          configurationId: configuration.id,
          action: "REVOKE",
          evidence: value.evidence,
          subject: value.subject,
          technicalExecutorIdentityId: executor.identityId,
          technicalExecutorMembershipId: executor.membershipId,
          executedAt: now.toISOString(),
        })
        await transaction.esaoAdminProvenance.create({
          data: {
            id: provenanceId,
            configurationId: configuration.id,
            action: "REVOKE",
            ...value.evidence,
            subjectIdentityId: configuration.identityId,
            subjectAccountIdentifier: value.subject.subjectAccountIdentifier,
            subjectPersonName: value.subject.subjectPersonName,
            subjectRoleCode: ESAO_ADMIN_ROLE,
            subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
            technicalExecutorIdentityId: executor.identityId,
            technicalExecutorMembershipId: executor.membershipId,
            executedAt: now,
            integrityDigest: provenanceIntegrityDigest,
          },
        })
        const audit = await recordAuditEventInTransaction(transaction, {
          actorIdentityId: executor.identityId,
          actorMembershipId: executor.membershipId,
          scope: { kind: "PLATFORM" },
          commandCode: ESAO_ADMIN_CONFIGURATION_COMMAND,
          targetType: "EsaoAdminConfiguration",
          targetId: configuration.id,
          outcome: "SUCCESS",
          reasonCode: "ESAO_ADMIN_CONFIGURATION_REVOKED",
          correlationId: value.evidence.externalApprovalRecordId,
          occurredAt: now,
        })
        return Object.freeze({ configurationId: configuration.id, provenanceId, auditEventId: audit.id })
      }, { isolationLevel: "Serializable" }),
    { operationKey: "P1-18-ESAO-ADMIN-REVOCATION" },
  )
}

export type ActiveEsaoAdmin = Readonly<{
  configurationId: string
  identityId: string
  accountIdentifier: string
  personName: string
  roleCode: typeof ESAO_ADMIN_ROLE
  esaoOrganizationId: string
  schoolIds: readonly string[]
  authorizationVersion: number
}>

export async function resolveActiveEsaoAdmin(
  database: PrismaClient,
  input: Readonly<{ identityId: string; authorizationVersion: number; now?: Date }>,
): Promise<ActiveEsaoAdmin | null> {
  const now = input.now ?? new Date()
  if (
    !uuid.safeParse(input.identityId).success ||
    !Number.isSafeInteger(input.authorizationVersion) ||
    input.authorizationVersion < 1 ||
    !Number.isFinite(now.getTime())
  ) {
    return null
  }

  const configuration = await database.esaoAdminConfiguration.findFirst({
    where: {
      identityId: input.identityId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
      identity: {
        accountStatus: "ACTIVE",
        authorizationVersion: input.authorizationVersion,
      },
    },
    include: {
      identity: {
        select: {
          accountIdentifier: true,
          authorizationVersion: true,
          memberships: {
            select: {
              organizationId: true,
              status: true,
              effectiveFrom: true,
              effectiveTo: true,
              organization: { select: { type: true, status: true } },
              roleAssignments: { select: { id: true } },
            },
          },
        },
      },
      schoolScopes: { select: { schoolId: true }, orderBy: { schoolId: "asc" } },
      esaoOrganization: { select: { type: true, status: true } },
    },
  })
  const expectedSchools = await database.school.findMany({
    where: {
      directoryIsActive: true,
      organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" },
    },
    select: { organizationId: true },
    orderBy: { organizationId: "asc" },
  })
  const exactScope = expectedSchools.length === 17 && configuration?.schoolScopes.length === 17 && expectedSchools.every((school, index) => school.organizationId === configuration.schoolScopes[index]?.schoolId)
  if (
    !configuration ||
    configuration.roleCode !== ESAO_ADMIN_ROLE ||
    configuration.configurationSource !== "APPROVED_APPOINTMENT" ||
    !exactScope ||
    configuration.esaoOrganization.type !== "ESAO" ||
    configuration.esaoOrganization.status !== "ACTIVE" ||
    !hasOnlyActiveEsaoMembership(configuration.identity.memberships, now)
  ) {
    return null
  }

  return Object.freeze({
    configurationId: configuration.id,
    identityId: configuration.identityId,
    accountIdentifier: configuration.identity.accountIdentifier,
    personName: configuration.personNameSnapshot,
    roleCode: ESAO_ADMIN_ROLE,
    esaoOrganizationId: configuration.esaoOrganizationId,
    schoolIds: configuration.schoolScopes.map((scope) => scope.schoolId),
    authorizationVersion: configuration.identity.authorizationVersion,
  })
}
