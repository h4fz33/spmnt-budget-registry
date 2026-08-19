import type { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { randomUUID } from "node:crypto"
import { z } from "zod"

import { requireFreshAuthentication } from "../auth/session.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"
import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"
import {
  PILOT_ESAO_ORGANIZATION_ID,
  PRIVATE_PRODUCT_OWNER_LABEL,
  SESA0_AUDITOR_ROLE,
} from "../bootstrap/sesao-auditor.ts"

const uuid = z.string().uuid()
const hash = z.string().regex(/^[0-9a-f]{64}$/)
const actorSchema = z.object({
  identityId: uuid,
  membershipId: uuid,
  accountIdentifier: z.string().min(1).max(320),
  authorizationVersion: z.number().int().positive(),
  membershipAuthorizationVersion: z.number().int().positive(),
  authenticatedAt: z.number().int().nonnegative(),
}).strict()
const evidenceSchema = z.object({
  externalApprovalRecordId: z.string().trim().min(1).max(128),
  approvalAuthorityLabel: z.string().trim().min(1).max(128),
  approvalAuthorityIdentity: z.string().trim().min(1).max(320),
  approvalEvidenceReference: z.string().trim().min(1).max(512),
  approvalEvidenceHash: hash,
}).strict()
const subjectSchema = z.object({
  subjectIdentityId: uuid,
  subjectAccountIdentifier: z.string().trim().min(1).max(320),
  subjectPersonName: z.string().trim().min(1).max(200),
  subjectRoleCode: z.literal(SESA0_AUDITOR_ROLE),
  subjectEsaoOrganizationId: z.literal(PILOT_ESAO_ORGANIZATION_ID),
  schoolIds: z.array(uuid).length(17),
}).strict()
const appointmentSchema = z.object({ actor: actorSchema, evidence: evidenceSchema, subject: subjectSchema }).strict()
const revokeSchema = z.object({ actor: actorSchema, configurationId: uuid, evidence: evidenceSchema, subject: subjectSchema }).strict()

export class SesaoAuditorAuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SesaoAuditorAuthorizationError"
  }
}
export class SesaoAuditorFreshAuthenticationRequiredError extends SesaoAuditorAuthorizationError {}
export class SesaoAuditorApprovalRecordError extends SesaoAuditorAuthorizationError {}
export class SesaoAuditorReplayError extends SesaoAuditorAuthorizationError {}

type Transaction = Prisma.TransactionClient
type ExecutionActor = z.infer<typeof actorSchema>

function parseActorAndFresh(actor: ExecutionActor, now: Date) {
  const session = { expires: new Date(now.getTime() + 60_000).toISOString(), user: { id: actor.identityId, accountIdentifier: actor.accountIdentifier, authorizationVersion: actor.authorizationVersion, authenticatedAt: actor.authenticatedAt } }
  if (!requireFreshAuthentication(session, now.getTime())) throw new SesaoAuditorFreshAuthenticationRequiredError("Fresh System Admin authentication is required")
}

async function requireSystemAdmin(transaction: Transaction, actor: ExecutionActor, now: Date) {
  parseActorAndFresh(actor, now)
  const bootstrap = await transaction.systemAdminBootstrap.findUnique({
    where: { id: "p1-17" },
    select: {
      identityId: true, membershipId: true,
      identity: { select: { accountIdentifier: true, accountStatus: true, authorizationVersion: true } },
      membership: { select: { identityId: true, organizationId: true, status: true, authorizationVersion: true, effectiveFrom: true, effectiveTo: true, organization: { select: { type: true, status: true } } } },
    },
  })
  if (!bootstrap || bootstrap.identityId !== actor.identityId || bootstrap.membershipId !== actor.membershipId || bootstrap.identity.accountStatus !== "ACTIVE" || bootstrap.identity.authorizationVersion !== actor.authorizationVersion || bootstrap.identity.accountIdentifier !== actor.accountIdentifier || bootstrap.membership.identityId !== actor.identityId || bootstrap.membership.authorizationVersion !== actor.membershipAuthorizationVersion || bootstrap.membership.status !== "ACTIVE" || bootstrap.membership.effectiveFrom > now || (bootstrap.membership.effectiveTo !== null && bootstrap.membership.effectiveTo <= now) || bootstrap.membership.organization.type !== "PLATFORM" || bootstrap.membership.organization.status !== "ACTIVE") {
    throw new SesaoAuditorAuthorizationError("Only the active System Admin may apply Auditor configuration")
  }
  return bootstrap
}

async function exactPilotSchoolIds(transaction: Transaction) {
  const schools = await transaction.school.findMany({
    where: { directoryIsActive: true, organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" } },
    select: { organizationId: true }, orderBy: { organizationId: "asc" },
  })
  if (schools.length !== 17) throw new SesaoAuditorApprovalRecordError("The approved Auditor scope must resolve to exactly 17 active pilot Schools")
  return schools.map((school) => school.organizationId)
}

function assertExactScope(expected: readonly string[], supplied: readonly string[]) {
  const left = [...expected].sort()
  const right = [...new Set(supplied)].sort()
  if (right.length !== 17 || left.some((value, index) => value !== right[index])) throw new SesaoAuditorApprovalRecordError("Approved Auditor scope is not the immutable 17-school pilot scope")
}

function digest(value: object) {
  return calculateJsonIntegrityDigest(value as never)
}

export type SesaoAuditorCommandResult = Readonly<{ configurationId: string; provenanceId: string; auditEventId: string }>

export async function applySesaoAuditorAppointment(database: PrismaClient, input: unknown, now = new Date()): Promise<SesaoAuditorCommandResult> {
  const parsed = appointmentSchema.safeParse(input)
  if (!parsed.success) throw new SesaoAuditorApprovalRecordError("Auditor appointment record is invalid")
  const value = parsed.data
  return withSerializableRetry(() => database.$transaction(async (transaction) => {
    const admin = await requireSystemAdmin(transaction, value.actor, now)
    if (value.evidence.approvalAuthorityLabel !== PRIVATE_PRODUCT_OWNER_LABEL) throw new SesaoAuditorApprovalRecordError("Auditor approval must identify the Private Business / Product Owner")
    const expectedSchools = await exactPilotSchoolIds(transaction)
    assertExactScope(expectedSchools, value.subject.schoolIds)
    if (value.subject.subjectIdentityId === value.actor.identityId) throw new SesaoAuditorApprovalRecordError("System Admin cannot self-appoint as Auditor")
    const subject = await transaction.authenticatedIdentity.findUnique({ where: { id: value.subject.subjectIdentityId }, select: { id: true, accountIdentifier: true, displayName: true, accountStatus: true, memberships: { where: { organizationId: PILOT_ESAO_ORGANIZATION_ID, status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] }, select: { id: true }, take: 1 } } })
    if (!subject || subject.accountStatus !== "ACTIVE" || subject.accountIdentifier !== value.subject.subjectAccountIdentifier || subject.displayName !== value.subject.subjectPersonName || subject.memberships.length !== 1) throw new SesaoAuditorApprovalRecordError("Approved Auditor subject identity or ESAO membership does not match")
    const active = await transaction.sesaoAuditorConfiguration.findFirst({ where: { identityId: subject.id, status: "ACTIVE" }, select: { id: true } })
    if (active) throw new SesaoAuditorReplayError("Auditor subject already has an active configuration")
    const configurationId = randomUUID()
    const integrityDigest = digest({ version: 1, configurationId, identityId: subject.id, personName: value.subject.subjectPersonName, roleCode: SESA0_AUDITOR_ROLE, esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, schoolIds: expectedSchools, source: "APPROVED_APPOINTMENT", approval: value.evidence })
    await transaction.sesaoAuditorConfiguration.create({ data: { id: configurationId, identityId: subject.id, personNameSnapshot: value.subject.subjectPersonName, roleCode: SESA0_AUDITOR_ROLE, esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, configurationSource: "APPROVED_APPOINTMENT", integrityDigest, schoolScopes: { create: expectedSchools.map((schoolId) => ({ schoolId })) } } })
    const provenanceId = randomUUID()
    const provenanceIntegrityDigest = digest({ version: 1, provenanceId, configurationId, action: "APPOINT", evidence: value.evidence, subject: value.subject, technicalExecutorIdentityId: admin.identityId, technicalExecutorMembershipId: admin.membershipId, executedAt: now.toISOString() })
    await transaction.sesaoAuditorProvenance.create({ data: { id: provenanceId, configurationId, action: "APPOINT", ...value.evidence, subjectIdentityId: subject.id, subjectAccountIdentifier: value.subject.subjectAccountIdentifier, subjectPersonName: value.subject.subjectPersonName, subjectRoleCode: SESA0_AUDITOR_ROLE, subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, technicalExecutorIdentityId: admin.identityId, technicalExecutorMembershipId: admin.membershipId, executedAt: now, integrityDigest: provenanceIntegrityDigest } })
    const audit = await recordAuditEventInTransaction(transaction, { actorIdentityId: admin.identityId, actorMembershipId: admin.membershipId, scope: { kind: "PLATFORM" }, commandCode: "AUTH-07", targetType: "SesaoAuditorConfiguration", targetId: configurationId, outcome: "SUCCESS", reasonCode: "SESAO_AUDITOR_APPOINTMENT_APPLIED", correlationId: value.evidence.externalApprovalRecordId, occurredAt: now })
    return Object.freeze({ configurationId, provenanceId, auditEventId: audit.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-19-SESAO-AUDITOR-APPOINT" })
}

export async function revokeSesaoAuditor(database: PrismaClient, input: unknown, now = new Date()): Promise<SesaoAuditorCommandResult> {
  const parsed = revokeSchema.safeParse(input)
  if (!parsed.success) throw new SesaoAuditorApprovalRecordError("Auditor revocation record is invalid")
  const value = parsed.data
  return withSerializableRetry(() => database.$transaction(async (transaction) => {
    const admin = await requireSystemAdmin(transaction, value.actor, now)
    if (value.evidence.approvalAuthorityLabel !== PRIVATE_PRODUCT_OWNER_LABEL) throw new SesaoAuditorApprovalRecordError("Auditor approval must identify the Private Business / Product Owner")
    const expectedSchools = await exactPilotSchoolIds(transaction)
    assertExactScope(expectedSchools, value.subject.schoolIds)
    if (value.subject.subjectIdentityId === value.actor.identityId) throw new SesaoAuditorApprovalRecordError("System Admin cannot self-revoke as Auditor")
    const configuration = await transaction.sesaoAuditorConfiguration.findUnique({ where: { id: value.configurationId }, include: { identity: { select: { accountIdentifier: true } }, schoolScopes: { select: { schoolId: true } } } })
    if (!configuration || configuration.status !== "ACTIVE" || configuration.identityId !== value.subject.subjectIdentityId || configuration.identity.accountIdentifier !== value.subject.subjectAccountIdentifier || configuration.personNameSnapshot !== value.subject.subjectPersonName || configuration.roleCode !== SESA0_AUDITOR_ROLE || configuration.esaoOrganizationId !== PILOT_ESAO_ORGANIZATION_ID) throw new SesaoAuditorApprovalRecordError("Auditor revocation does not match the active configuration")
    assertExactScope(expectedSchools, configuration.schoolScopes.map((scope) => scope.schoolId))
    await transaction.$executeRaw`SELECT set_config('p1_19.allow_revoke', '1', true)`
    await transaction.sesaoAuditorConfiguration.update({ where: { id: configuration.id }, data: { status: "REVOKED", revokedAt: now } })
    await transaction.authenticatedIdentity.update({ where: { id: configuration.identityId }, data: { authorizationVersion: { increment: 1 } } })
    await transaction.approvedMembership.updateMany({ where: { identityId: configuration.identityId, organizationId: PILOT_ESAO_ORGANIZATION_ID, status: "ACTIVE" }, data: { authorizationVersion: { increment: 1 } } })
    const provenanceId = randomUUID()
    const provenanceIntegrityDigest = digest({ version: 1, provenanceId, configurationId: configuration.id, action: "REVOKE", evidence: value.evidence, subject: value.subject, technicalExecutorIdentityId: admin.identityId, technicalExecutorMembershipId: admin.membershipId, executedAt: now.toISOString() })
    await transaction.sesaoAuditorProvenance.create({ data: { id: provenanceId, configurationId: configuration.id, action: "REVOKE", ...value.evidence, subjectIdentityId: configuration.identityId, subjectAccountIdentifier: value.subject.subjectAccountIdentifier, subjectPersonName: value.subject.subjectPersonName, subjectRoleCode: SESA0_AUDITOR_ROLE, subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, technicalExecutorIdentityId: admin.identityId, technicalExecutorMembershipId: admin.membershipId, executedAt: now, integrityDigest: provenanceIntegrityDigest } })
    const audit = await recordAuditEventInTransaction(transaction, { actorIdentityId: admin.identityId, actorMembershipId: admin.membershipId, scope: { kind: "PLATFORM" }, commandCode: "AUTH-07", targetType: "SesaoAuditorConfiguration", targetId: configuration.id, outcome: "SUCCESS", reasonCode: "SESAO_AUDITOR_REVOKED", correlationId: value.evidence.externalApprovalRecordId, occurredAt: now })
    return Object.freeze({ configurationId: configuration.id, provenanceId, auditEventId: audit.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-19-SESAO-AUDITOR-REVOKE" })
}

export type ActiveSesaoAuditor = Readonly<{ configurationId: string; identityId: string; accountIdentifier: string; personName: string; roleCode: typeof SESA0_AUDITOR_ROLE; esaoOrganizationId: string; schoolIds: readonly string[]; authorizationVersion: number }>

export async function resolveActiveSesaoAuditor(database: PrismaClient, input: Readonly<{ identityId: string; authorizationVersion: number; now?: Date }>): Promise<ActiveSesaoAuditor | null> {
  const now = input.now ?? new Date()
  if (!uuid.safeParse(input.identityId).success || !Number.isSafeInteger(input.authorizationVersion) || input.authorizationVersion < 1) return null
  const configuration = await database.sesaoAuditorConfiguration.findFirst({ where: { identityId: input.identityId, status: "ACTIVE", effectiveFrom: { lte: now }, identity: { accountStatus: "ACTIVE", authorizationVersion: input.authorizationVersion, memberships: { some: { organizationId: PILOT_ESAO_ORGANIZATION_ID, status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] } } }, esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID }, include: { identity: { select: { accountIdentifier: true, displayName: true, authorizationVersion: true } }, schoolScopes: { select: { schoolId: true }, orderBy: { schoolId: "asc" } }, esaoOrganization: { select: { type: true, status: true } } } })
  if (!configuration || configuration.roleCode !== SESA0_AUDITOR_ROLE || configuration.schoolScopes.length !== 17 || configuration.esaoOrganization.type !== "ESAO" || configuration.esaoOrganization.status !== "ACTIVE") return null
  return Object.freeze({ configurationId: configuration.id, identityId: configuration.identityId, accountIdentifier: configuration.identity.accountIdentifier, personName: configuration.personNameSnapshot, roleCode: SESA0_AUDITOR_ROLE, esaoOrganizationId: configuration.esaoOrganizationId, schoolIds: configuration.schoolScopes.map((scope) => scope.schoolId), authorizationVersion: configuration.identity.authorizationVersion })
}
