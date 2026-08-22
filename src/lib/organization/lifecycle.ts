import type { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { createHash, randomBytes, randomUUID } from "node:crypto"
import { z } from "zod"

import { hashPassword, normalizeAccountIdentifier } from "../auth/credentials.ts"
import { requireFreshAuthentication } from "../auth/session.ts"
import { recordAuditEvent, recordAuditEventInTransaction } from "../audit/core.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"
import { PILOT_ESAO_ORGANIZATION_ID } from "../authorization/esao-admin.ts"
import { SYSTEM_ADMIN_BOOTSTRAP_ID } from "../bootstrap/constants.ts"

export const MEMBERSHIP_COMMAND = "AUTH-04"
export const DIRECTOR_COMMAND = "AUTH-05"
export const CREDENTIAL_COMMAND = "AUTH-02"
export const SUBSTITUTE_COMMAND = "AUTH-14"
export const SUBSTITUTE_COMMAND_SCOPE = ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"] as const
export const ACTIVATION_TTL_MS = 24 * 60 * 60 * 1000

const uuid = z.string().uuid()
const hash = z.string().regex(/^[0-9a-fA-F]{64}$/)
const reasonSchema = z.object({
  code: z.string().trim().regex(/^[A-Z][A-Z0-9._:-]{1,63}$/),
  detail: z.string().trim().min(1).max(2000),
}).strict()
const actorSchema = z.object({
  identityId: uuid,
  membershipId: uuid,
  accountIdentifier: z.string().trim().min(1).max(320),
  authorizationVersion: z.number().int().positive(),
  membershipAuthorizationVersion: z.number().int().positive(),
  authenticatedAt: z.number().int().nonnegative(),
}).strict()
const evidenceSchema = z.object({
  reference: z.string().trim().min(1).max(512),
  contentHash: hash.optional(),
}).strict()
const membershipSchema = z.object({ actor: actorSchema, membershipId: uuid, reason: reasonSchema }).strict()
const roleSchema = z.object({ actor: actorSchema, schoolId: uuid, targetIdentityId: uuid, reason: reasonSchema, evidence: evidenceSchema.optional() }).strict()
const directorSchema = z.object({ actor: actorSchema, schoolId: uuid, targetIdentityId: uuid, reason: reasonSchema, appointmentEvidence: evidenceSchema }).strict()
const revokeDirectorSchema = z.object({ actor: actorSchema, schoolId: uuid, roleAssignmentId: uuid, reason: reasonSchema, evidence: evidenceSchema }).strict()
const transferSchema = z.object({ actor: actorSchema, identityId: uuid, fromMembershipId: uuid, toSchoolId: uuid, reason: reasonSchema, evidence: evidenceSchema.optional() }).strict()
const recoveryApprovalSchema = z.object({ actor: actorSchema, targetIdentityId: uuid, reason: reasonSchema, approvalReference: z.string().trim().min(1).max(512) }).strict()
const issueActivationSchema = z.object({ actor: actorSchema, requestId: uuid, reason: reasonSchema }).strict()
const issueRecoverySchema = z.object({ actor: actorSchema, approvalId: uuid, reason: reasonSchema }).strict()
const consumeCredentialSchema = z.object({ accountIdentifier: z.string().trim().min(1).max(320), token: z.string().trim().min(32).max(256), password: z.string().min(8).max(128) }).strict()
const authoritySchema = z.object({
  actor: actorSchema,
  schoolId: uuid,
  targetRoleAssignmentId: uuid,
  variant: z.enum(["ACTING_DIRECTOR", "ACTING_ESAO", "TEMPORARY"]),
  reason: reasonSchema,
  effectiveFrom: z.coerce.date(),
  expiresAt: z.coerce.date().nullable().optional(),
  temporaryBasis: z.string().trim().min(1).max(2000).optional(),
  evidence: evidenceSchema.optional(),
  supersedesAuthorityId: uuid.optional(),
}).strict()
const authorityTransitionSchema = z.object({ actor: actorSchema, authorityId: uuid, reason: reasonSchema }).strict()

type Transaction = Prisma.TransactionClient
type Actor = z.infer<typeof actorSchema>
type Reason = z.infer<typeof reasonSchema>
export type LifecycleActor = Actor

export class OrganizationLifecycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OrganizationLifecycleError"
  }
}
export class OrganizationLifecycleValidationError extends OrganizationLifecycleError {}
export class OrganizationLifecycleAuthorizationError extends OrganizationLifecycleError {}
export class OrganizationLifecycleFreshAuthenticationRequiredError extends OrganizationLifecycleAuthorizationError {}
export class OrganizationLifecycleConflictError extends OrganizationLifecycleError {}
export class OrganizationLifecycleCredentialError extends OrganizationLifecycleError {}

type LifecycleResult = Readonly<{ id: string; auditEventId: string }>
export type OrganizationLifecycleSnapshot = Readonly<{
  memberships: readonly unknown[]
  roles: readonly unknown[]
  authorities: readonly unknown[]
  credentials: readonly unknown[]
}>
export type TechnicalCredentialSnapshot = Readonly<{
  approvedRequests: readonly unknown[]
  recoveryApprovals: readonly unknown[]
  credentials: readonly unknown[]
}>
export type DirectorAuthoritySnapshot = Readonly<{
  school: Readonly<{ id: string; nameTh: string; smisCode: string }>
  subjects: readonly Readonly<{
    roleAssignmentId: string
    role: "FINANCE_OFFICER" | "SCHOOL_ADMIN"
    identity: Readonly<{ displayName: string; accountIdentifier: string }>
  }>[]
  authorities: readonly Readonly<{
    id: string
    variant: "ACTING_DIRECTOR" | "ACTING_ESAO" | "TEMPORARY"
    status: "SCHEDULED" | "IN_FORCE" | "REVOKED" | "EXPIRED" | "SUPERSEDED" | "INVALIDATED" | "ENDED_ON_RETURN" | "CONVERTED"
    effectiveFrom: Date
    expiresAt: Date | null
    actingReasonCode: "MEDICAL_LEAVE" | "OFFICIAL_TRAVEL" | "PERSONAL_LEAVE" | "OTHER" | null
    reasonDetail: string | null
  }>[]
}>

function parse<S extends z.ZodTypeAny>(schema: S, input: unknown, message: string): z.infer<S> {
  const result = schema.safeParse(input)
  if (!result.success) throw new OrganizationLifecycleValidationError(message)
  return result.data
}

function assertNow(now: Date) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new OrganizationLifecycleValidationError("A valid transition time is required")
}

function closeDate(effectiveFrom: Date, now: Date) {
  return now > effectiveFrom ? now : new Date(effectiveFrom.getTime() + 1)
}

function digest(value: object) {
  return calculateJsonIntegrityDigest(value as never)
}

function tokenHash(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

function fixedActingReason(code: string): "MEDICAL_LEAVE" | "OFFICIAL_TRAVEL" | "PERSONAL_LEAVE" | "OTHER" {
  if (code === "MEDICAL_LEAVE" || code === "OFFICIAL_TRAVEL" || code === "PERSONAL_LEAVE" || code === "OTHER") return code
  throw new OrganizationLifecycleValidationError("Acting authority reason must be one of the approved fixed reason codes")
}

function requireFresh(actor: Actor, now: Date) {
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
    throw new OrganizationLifecycleFreshAuthenticationRequiredError("Fresh authentication is required for this state-changing action")
  }
}

async function exactPilotSchools(transaction: Transaction) {
  const schools = await transaction.school.findMany({
    where: { directoryIsActive: true, organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" } },
    select: { organizationId: true },
    orderBy: { organizationId: "asc" },
  })
  if (schools.length !== 17) throw new OrganizationLifecycleAuthorizationError("The active ESAO Admin scope must contain exactly 17 pilot Schools")
  return schools.map((school) => school.organizationId)
}

async function requireSystemAdmin(transaction: Transaction, actor: Actor, now: Date) {
  requireFresh(actor, now)
  const bootstrap = await transaction.systemAdminBootstrap.findUnique({
    where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
    select: {
      identityId: true,
      membershipId: true,
      identity: { select: { accountIdentifier: true, accountStatus: true, authorizationVersion: true } },
      membership: { select: { identityId: true, organizationId: true, status: true, authorizationVersion: true, effectiveFrom: true, effectiveTo: true, organization: { select: { type: true, status: true } } } },
    },
  })
  if (
    !bootstrap || bootstrap.identityId !== actor.identityId || bootstrap.membershipId !== actor.membershipId ||
    bootstrap.identity.accountIdentifier !== normalizeAccountIdentifier(actor.accountIdentifier) ||
    bootstrap.identity.accountStatus !== "ACTIVE" || bootstrap.identity.authorizationVersion !== actor.authorizationVersion ||
    bootstrap.membership.identityId !== actor.identityId || bootstrap.membership.authorizationVersion !== actor.membershipAuthorizationVersion ||
    bootstrap.membership.status !== "ACTIVE" || bootstrap.membership.effectiveFrom > now ||
    bootstrap.membership.effectiveTo !== null && bootstrap.membership.effectiveTo <= now ||
    bootstrap.membership.organizationId === PILOT_ESAO_ORGANIZATION_ID || bootstrap.membership.organization.type !== "PLATFORM" ||
    bootstrap.membership.organization.status !== "ACTIVE"
  ) throw new OrganizationLifecycleAuthorizationError("Only the active System Admin may execute this technical lifecycle action")
  return bootstrap
}

async function requireEsaoAdmin(transaction: Transaction, actor: Actor, schoolId: string | undefined, now: Date) {
  requireFresh(actor, now)
  const expectedSchools = await exactPilotSchools(transaction)
  if (schoolId && !expectedSchools.includes(schoolId)) {
    throw new OrganizationLifecycleAuthorizationError("Organization lifecycle actions are limited to the exact 17-School pilot scope")
  }
  const config = await transaction.esaoAdminConfiguration.findFirst({
    where: {
      identityId: actor.identityId,
      esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
      roleCode: "ESAO_ADMIN",
      configurationSource: "APPROVED_APPOINTMENT",
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      revokedAt: null,
      ...(schoolId ? { schoolScopes: { some: { schoolId } } } : {}),
    },
    include: { schoolScopes: { select: { schoolId: true }, orderBy: { schoolId: "asc" } }, identity: { select: { accountIdentifier: true, accountStatus: true, authorizationVersion: true } } },
  })
  const membership = await transaction.approvedMembership.findFirst({
    where: {
      id: actor.membershipId,
      identityId: actor.identityId,
      organizationId: PILOT_ESAO_ORGANIZATION_ID,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      authorizationVersion: actor.membershipAuthorizationVersion,
      organization: { type: "ESAO", status: "ACTIVE" },
      roleAssignments: { none: {} },
    },
    select: { id: true },
  })
  const scopeMatches = config?.schoolScopes.length === 17 && config.schoolScopes.every((entry, index) => entry.schoolId === expectedSchools[index])
  if (!config || !membership || !scopeMatches || config.identity.accountStatus !== "ACTIVE" || config.identity.authorizationVersion !== actor.authorizationVersion || config.identity.accountIdentifier !== normalizeAccountIdentifier(actor.accountIdentifier)) {
    throw new OrganizationLifecycleAuthorizationError("Only the active ESAO Admin may decide organization membership and authority")
  }
  return { configuration: config, membership }
}

async function requirePilotSchool(transaction: Transaction, schoolId: string) {
  const school = await transaction.school.findUnique({
    where: { organizationId: schoolId },
    select: {
      directoryIsActive: true,
      organization: { select: { parentOrganizationId: true, type: true, status: true } },
    },
  })
  if (
    !school ||
    !school.directoryIsActive ||
    school.organization.parentOrganizationId !== PILOT_ESAO_ORGANIZATION_ID ||
    school.organization.type !== "SCHOOL" ||
    school.organization.status !== "ACTIVE"
  ) {
    throw new OrganizationLifecycleAuthorizationError("Organization lifecycle actions require an active School in the exact 17-School pilot scope")
  }
}

async function audit(transaction: Transaction, actor: Actor, scope: { kind: "PLATFORM" } | { kind: "ORGANIZATION"; organizationId: string } | { kind: "SCHOOL"; organizationId: string; schoolId: string }, commandCode: string, targetType: string, targetId: string, reasonCode: string, correlationId: string | null, now: Date, outcome: "SUCCESS" | "DENIED" | "FAILED" = "SUCCESS") {
  return recordAuditEventInTransaction(transaction, {
    actorIdentityId: actor.identityId,
    actorMembershipId: actor.membershipId,
    scope,
    commandCode,
    targetType,
    targetId,
    outcome,
    reasonCode,
    correlationId,
    occurredAt: now,
  })
}

export async function recordOrganizationLifecycleDenial(database: PrismaClient, input: Readonly<{ actor: Actor; scope: { kind: "PLATFORM" } | { kind: "ORGANIZATION"; organizationId: string } | { kind: "SCHOOL"; organizationId: string; schoolId: string }; commandCode: string; targetType: string; targetId: string; reasonCode: string; occurredAt?: Date }>) {
  const now = input.occurredAt ?? new Date()
  assertNow(now)
  return recordAuditEvent(database, {
    actorIdentityId: input.actor.identityId,
    actorMembershipId: input.actor.membershipId,
    scope: input.scope,
    commandCode: input.commandCode,
    targetType: input.targetType,
    targetId: input.targetId,
    outcome: "DENIED",
    reasonCode: input.reasonCode,
    correlationId: input.targetId,
    occurredAt: now,
  })
}

async function runLifecycleCommand<T>(
  database: PrismaClient,
  actor: Actor,
  scope: { kind: "PLATFORM" } | { kind: "ORGANIZATION"; organizationId: string } | { kind: "SCHOOL"; organizationId: string; schoolId: string },
  commandCode: string,
  targetType: string,
  targetId: string,
  now: Date,
  operation: () => Promise<T>,
) {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof OrganizationLifecycleError) {
      const membership = await database.approvedMembership.findUnique({ where: { id: actor.membershipId }, select: { organizationId: true, organization: { select: { type: true } } } }).catch(() => null)
      const auditScope = membership?.organization.type === "SCHOOL"
        ? { kind: "SCHOOL" as const, organizationId: membership.organizationId, schoolId: membership.organizationId }
        : scope
      await recordOrganizationLifecycleDenial(database, {
        actor,
        scope: auditScope,
        commandCode,
        targetType,
        targetId,
        reasonCode: error.name === "OrganizationLifecycleFreshAuthenticationRequiredError" ? "FRESH_AUTHENTICATION_REQUIRED" : error.name.toUpperCase(),
        occurredAt: now,
      })
    }
    throw error
  }
}

async function bumpAuthorization(transaction: Transaction, identityId: string, membershipId: string) {
  await transaction.authenticatedIdentity.update({ where: { id: identityId }, data: { authorizationVersion: { increment: 1 } } })
  await transaction.approvedMembership.update({ where: { id: membershipId }, data: { authorizationVersion: { increment: 1 } } })
}

async function activeSchoolMembership(transaction: Transaction, identityId: string, schoolId: string, now: Date) {
  return transaction.approvedMembership.findFirst({
    where: {
      identityId,
      organizationId: schoolId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      organization: { type: "SCHOOL", status: "ACTIVE", school: { directoryIsActive: true } },
      identity: { accountStatus: "ACTIVE" },
    },
    include: { roleAssignments: { where: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] }, orderBy: { createdAt: "asc" } } },
  })
}

async function requireCurrentActor(transaction: Transaction, actor: Actor, now: Date) {
  const identity = await transaction.authenticatedIdentity.findUnique({
    where: { id: actor.identityId },
    select: { accountIdentifier: true, accountStatus: true, authorizationVersion: true },
  })
  const membership = await transaction.approvedMembership.findUnique({
    where: { id: actor.membershipId },
    select: { identityId: true, organizationId: true, status: true, effectiveFrom: true, effectiveTo: true, authorizationVersion: true },
  })
  if (
    !identity || identity.accountStatus !== "ACTIVE" ||
    identity.accountIdentifier !== normalizeAccountIdentifier(actor.accountIdentifier) ||
    identity.authorizationVersion !== actor.authorizationVersion ||
    !membership || membership.identityId !== actor.identityId || membership.status !== "ACTIVE" ||
    membership.authorizationVersion !== actor.membershipAuthorizationVersion ||
    membership.effectiveFrom > now || membership.effectiveTo !== null && membership.effectiveTo <= now
  ) {
    throw new OrganizationLifecycleAuthorizationError("The authenticated actor is stale or no longer active")
  }
  return membership
}

async function activeSubjectRole(transaction: Transaction, roleAssignmentId: string, schoolId: string, now: Date) {
  const role = await transaction.schoolRoleAssignment.findUnique({
    where: { id: roleAssignmentId },
    include: { membership: { include: { identity: true } } },
  })
  if (!role || role.schoolId !== schoolId || role.status !== "ACTIVE" || !["FINANCE_OFFICER", "SCHOOL_ADMIN"].includes(role.role) || role.effectiveFrom > now || role.effectiveTo !== null && role.effectiveTo <= now || role.membership.status !== "ACTIVE" || role.membership.effectiveFrom > now || role.membership.effectiveTo !== null && role.membership.effectiveTo <= now || role.membership.identity.accountStatus !== "ACTIVE") {
    throw new OrganizationLifecycleAuthorizationError("The subject must hold an active same-School Finance Officer or School Admin role")
  }
  return role
}

async function invalidateSubjectAuthorities(transaction: Transaction, roleAssignmentIds: readonly string[], now: Date, reason: string) {
  if (roleAssignmentIds.length === 0) return
  const authorities = await transaction.substituteDirectorAuthority.findMany({
    where: { status: { in: ["SCHEDULED", "IN_FORCE"] }, subjectRoleAssignmentId: { in: [...roleAssignmentIds] } },
    select: { id: true, recordVersion: true, status: true, effectiveFrom: true, availabilityId: true, availability: { select: { status: true, unavailableFrom: true } } },
  })
  for (const authority of authorities) {
    await transaction.substituteDirectorAuthority.update({ where: { id: authority.id }, data: { status: "INVALIDATED", recordVersion: authority.recordVersion + 1 } })
    await resumePreStartAvailability(transaction, authority, now)
    await appendAuthorityLifecycle(transaction, authority.id, authority.recordVersion + 1, "INVALIDATED", null, { code: "ELIGIBILITY_LOST", detail: reason }, now)
  }
}

async function resumePreStartAvailability(
  transaction: Transaction,
  authority: {
    id: string
    status: string
    effectiveFrom: Date
    availabilityId: string | null
    availability: { status: string; unavailableFrom: Date } | null
  },
  now: Date,
) {
  if (authority.status !== "SCHEDULED" || authority.effectiveFrom <= now || !authority.availabilityId || authority.availability?.status !== "UNAVAILABLE") return
  const otherLiveReference = await transaction.substituteDirectorAuthority.findFirst({
    where: { id: { not: authority.id }, availabilityId: authority.availabilityId, status: { in: ["SCHEDULED", "IN_FORCE"] } },
    select: { id: true },
  })
  if (otherLiveReference) return
  const resumedAt = new Date(Math.max(now.getTime(), authority.availability.unavailableFrom.getTime()) + 1)
  await transaction.activeDirectorAvailability.updateMany({
    where: { id: authority.availabilityId, status: "UNAVAILABLE" },
    data: { status: "RESUMED", resumedAt, updatedAt: now },
  })
}

async function endDirectorAssignmentAuthority(transaction: Transaction, directorRoleAssignmentId: string, now: Date, reason: string) {
  const availability = await transaction.activeDirectorAvailability.findFirst({ where: { directorRoleAssignmentId, status: "UNAVAILABLE" } })
  if (!availability) return
  await transaction.activeDirectorAvailability.update({ where: { id: availability.id }, data: { status: "DIRECTOR_ASSIGNMENT_ENDED", resumedAt: null, updatedAt: now } })
  const authorities = await transaction.substituteDirectorAuthority.findMany({ where: { availabilityId: availability.id, status: { in: ["SCHEDULED", "IN_FORCE"] } }, select: { id: true, recordVersion: true } })
  for (const authority of authorities) {
    await transaction.substituteDirectorAuthority.update({ where: { id: authority.id }, data: { status: "INVALIDATED", recordVersion: authority.recordVersion + 1 } })
    await appendAuthorityLifecycle(transaction, authority.id, authority.recordVersion + 1, "INVALIDATED", null, { code: "DIRECTOR_ASSIGNMENT_ENDED", detail: reason }, now)
  }
}

export async function listOrganizationLifecycleState(database: PrismaClient, input: unknown, now = new Date()): Promise<OrganizationLifecycleSnapshot> {
  const value = parse(z.object({ actor: actorSchema, schoolId: uuid }).strict(), input, "Organization lifecycle query input is invalid")
  assertNow(now)
  return database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, value.schoolId, now)
    const school = await transaction.school.findUnique({ where: { organizationId: value.schoolId }, select: { directoryIsActive: true, organization: { select: { parentOrganizationId: true, type: true, status: true } } } })
    if (!school || !school.directoryIsActive || school.organization.parentOrganizationId !== PILOT_ESAO_ORGANIZATION_ID || school.organization.type !== "SCHOOL" || school.organization.status !== "ACTIVE") throw new OrganizationLifecycleAuthorizationError("Active pilot School scope is required")
    const [memberships, roles, authorities, credentials] = await Promise.all([
      transaction.approvedMembership.findMany({ where: { organizationId: value.schoolId }, select: { id: true, identityId: true, status: true, effectiveFrom: true, effectiveTo: true, identity: { select: { accountIdentifier: true, displayName: true, accountStatus: true } }, roleAssignments: { select: { id: true, role: true, status: true } } }, orderBy: { createdAt: "asc" } }),
      transaction.schoolRoleAssignment.findMany({ where: { schoolId: value.schoolId }, select: { id: true, membershipId: true, role: true, status: true, effectiveFrom: true, effectiveTo: true, membership: { select: { identity: { select: { displayName: true, accountIdentifier: true } } } } }, orderBy: { createdAt: "asc" } }),
      transaction.substituteDirectorAuthority.findMany({ where: { schoolId: value.schoolId }, select: { id: true, variant: true, status: true, effectiveFrom: true, expiresAt: true, subjectRoleAssignmentId: true, actingReasonCode: true, temporaryBasis: true }, orderBy: { createdAt: "desc" } }),
      transaction.credentialOperation.findMany({ where: { identity: { memberships: { some: { organizationId: value.schoolId } } } }, select: { id: true, operationType: true, status: true, expiresAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    ])
    return { memberships, roles, authorities, credentials }
  }, { isolationLevel: "Serializable" })
}

export async function listDirectorAuthorityState(database: PrismaClient, input: unknown, now = new Date()): Promise<DirectorAuthoritySnapshot> {
  const value = parse(z.object({ actor: actorSchema, schoolId: uuid }).strict(), input, "Director authority query input is invalid")
  assertNow(now)
  return database.$transaction(async (transaction) => {
    await requirePilotSchool(transaction, value.schoolId)
    const membership = await requireCurrentActor(transaction, value.actor, now)
    if (membership.organizationId !== value.schoolId) throw new OrganizationLifecycleAuthorizationError("Director authority access is limited to the current School membership")
    const directorAssignments = await transaction.schoolRoleAssignment.findMany({
      where: {
        schoolId: value.schoolId,
        role: "SCHOOL_DIRECTOR",
        status: "ACTIVE",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        membership: {
          identityId: value.actor.identityId,
          status: "ACTIVE",
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
      },
      select: { id: true },
    })
    if (directorAssignments.length !== 1) throw new OrganizationLifecycleAuthorizationError("An active School Director assignment is required")
    const [school, subjects, authorities] = await Promise.all([
      transaction.school.findUniqueOrThrow({ where: { organizationId: value.schoolId }, select: { organizationId: true, smisCode: true, organization: { select: { nameTh: true } } } }),
      transaction.schoolRoleAssignment.findMany({
        where: {
          schoolId: value.schoolId,
          role: { in: ["FINANCE_OFFICER", "SCHOOL_ADMIN"] },
          status: "ACTIVE",
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
          membership: {
            identityId: { not: value.actor.identityId },
            status: "ACTIVE",
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
            identity: { accountStatus: "ACTIVE" },
          },
        },
        select: { id: true, role: true, membership: { select: { identity: { select: { displayName: true, accountIdentifier: true } } } } },
        orderBy: { createdAt: "asc" },
      }),
      transaction.substituteDirectorAuthority.findMany({
        where: { schoolId: value.schoolId },
        select: { id: true, variant: true, status: true, effectiveFrom: true, expiresAt: true, actingReasonCode: true, reasonDetail: true },
        orderBy: { createdAt: "desc" },
      }),
    ])
    return {
      school: { id: school.organizationId, nameTh: school.organization.nameTh, smisCode: school.smisCode },
      subjects: subjects.flatMap((subject) => subject.role === "FINANCE_OFFICER" || subject.role === "SCHOOL_ADMIN"
        ? [{ roleAssignmentId: subject.id, role: subject.role, identity: subject.membership.identity }]
        : []),
      authorities,
    }
  }, { isolationLevel: "Serializable" })
}

export async function listTechnicalCredentialState(database: PrismaClient, input: unknown, now = new Date()): Promise<TechnicalCredentialSnapshot> {
  const value = parse(z.object({ actor: actorSchema }).strict(), input, "Technical credential query input is invalid")
  assertNow(now)
  return database.$transaction(async (transaction) => {
    await requireSystemAdmin(transaction, value.actor, now)
    const [approvedRequests, recoveryApprovals, credentials] = await Promise.all([
      transaction.schoolAccountRequest.findMany({
        where: {
          status: "APPROVED",
          target: { passwordHash: null },
          school: {
            directoryIsActive: true,
            organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" },
          },
        },
        select: {
          id: true,
          schoolId: true,
          terminalAt: true,
          target: { select: { displayName: true, accountIdentifier: true } },
          school: { select: { smisCode: true, organization: { select: { nameTh: true } } } },
        },
        orderBy: { terminalAt: "asc" },
      }),
      transaction.credentialRecoveryApproval.findMany({
        where: {
          status: "APPROVED",
          identity: {
            accountStatus: "ACTIVE",
            memberships: {
              some: {
                status: "ACTIVE",
                effectiveFrom: { lte: now },
                OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
                organization: {
                  type: "SCHOOL",
                  school: {
                    directoryIsActive: true,
                    organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          createdAt: true,
          reasonCode: true,
          approvalReference: true,
          identity: { select: { displayName: true, accountIdentifier: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      transaction.credentialOperation.findMany({
        select: {
          id: true,
          operationType: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          consumedAt: true,
          identity: { select: { displayName: true, accountIdentifier: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])
    return { approvedRequests, recoveryApprovals, credentials }
  }, { isolationLevel: "Serializable" })
}

export async function suspendMembership(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(membershipSchema, input, "Membership suspension input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "ApprovedMembership", value.membershipId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, undefined, now)
    const membership = await transaction.approvedMembership.findUnique({ where: { id: value.membershipId }, include: { organization: true, identity: true, roleAssignments: { where: { status: { in: ["SCHEDULED", "ACTIVE"] } } } } })
    if (!membership || membership.organization.type !== "SCHOOL" || membership.identityId === value.actor.identityId || membership.status !== "ACTIVE" || membership.effectiveFrom > now || membership.effectiveTo !== null && membership.effectiveTo <= now) throw new OrganizationLifecycleConflictError("Only another active School membership may be suspended")
    await requirePilotSchool(transaction, membership.organizationId)
    const endedAt = closeDate(membership.effectiveFrom, now)
    for (const role of membership.roleAssignments) {
      await transaction.schoolRoleAssignment.update({ where: { id: role.id }, data: { status: "INVALIDATED", effectiveTo: closeDate(role.effectiveFrom, endedAt) } })
      if (role.role === "SCHOOL_DIRECTOR") await endDirectorAssignmentAuthority(transaction, role.id, now, "Active School Director membership was suspended")
    }
    await transaction.approvedMembership.update({ where: { id: membership.id }, data: { status: "SUSPENDED", effectiveTo: endedAt } })
    await invalidateSubjectAuthorities(transaction, membership.roleAssignments.map((role) => role.id), now, value.reason.detail)
    await bumpAuthorization(transaction, membership.identityId, membership.id)
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "ApprovedMembership", membership.id, value.reason.code, membership.id, now)
    return Object.freeze({ id: membership.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-SUSPEND-MEMBERSHIP" }))
}

export async function removeMembership(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(membershipSchema, input, "Membership removal input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "ApprovedMembership", value.membershipId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, undefined, now)
    const membership = await transaction.approvedMembership.findUnique({ where: { id: value.membershipId }, include: { organization: true, identity: true, roleAssignments: { where: { status: { in: ["SCHEDULED", "ACTIVE"] } } } } })
    if (!membership || membership.organization.type !== "SCHOOL" || membership.identityId === value.actor.identityId || membership.status !== "ACTIVE" || membership.effectiveFrom > now || membership.effectiveTo !== null && membership.effectiveTo <= now) throw new OrganizationLifecycleConflictError("Only another active School membership may be removed")
    await requirePilotSchool(transaction, membership.organizationId)
    const endedAt = closeDate(membership.effectiveFrom, now)
    for (const role of membership.roleAssignments) {
      await transaction.schoolRoleAssignment.update({ where: { id: role.id }, data: { status: "REVOKED", effectiveTo: closeDate(role.effectiveFrom, endedAt) } })
      if (role.role === "SCHOOL_DIRECTOR") await endDirectorAssignmentAuthority(transaction, role.id, now, "Active School Director membership was removed")
    }
    await transaction.approvedMembership.update({ where: { id: membership.id }, data: { status: "REVOKED", effectiveTo: endedAt } })
    await invalidateSubjectAuthorities(transaction, membership.roleAssignments.map((role) => role.id), now, value.reason.detail)
    const activeMemberships = await transaction.approvedMembership.count({ where: { identityId: membership.identityId, status: "ACTIVE", id: { not: membership.id }, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] } })
    await transaction.authenticatedIdentity.update({ where: { id: membership.identityId }, data: { accountStatus: activeMemberships === 0 ? "DISABLED" : undefined, authorizationVersion: { increment: 1 } } })
    await transaction.approvedMembership.update({ where: { id: membership.id }, data: { authorizationVersion: { increment: 1 } } })
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "ApprovedMembership", membership.id, value.reason.code, membership.id, now)
    return Object.freeze({ id: membership.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-REMOVE-MEMBERSHIP" }))
}

export async function assignMembershipSchool(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(transferSchema, input, "School assignment input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "ApprovedMembership", value.fromMembershipId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, value.toSchoolId, now)
    const source = await transaction.approvedMembership.findUnique({ where: { id: value.fromMembershipId }, include: { organization: true, identity: true, roleAssignments: { where: { status: { in: ["SCHEDULED", "ACTIVE"] } } } } })
    if (!source || source.identityId !== value.identityId || source.organization.type !== "SCHOOL" || source.status !== "ACTIVE" || source.effectiveFrom > now || source.effectiveTo !== null && source.effectiveTo <= now || source.identity.accountStatus !== "ACTIVE" || source.identityId === value.actor.identityId) throw new OrganizationLifecycleConflictError("The source membership is not an eligible active School membership")
    await requirePilotSchool(transaction, source.organizationId)
    if (source.organizationId === value.toSchoolId) throw new OrganizationLifecycleConflictError("The target School is unchanged")
    if (source.roleAssignments.some((role) => role.role === "SCHOOL_DIRECTOR")) throw new OrganizationLifecycleConflictError("School Director assignment requires a separate external-evidence command")
    const targetSchool = await transaction.school.findUnique({ where: { organizationId: value.toSchoolId }, select: { organizationId: true, directoryIsActive: true, organization: { select: { parentOrganizationId: true, type: true, status: true } } } })
    if (!targetSchool || !targetSchool.directoryIsActive || targetSchool.organization.type !== "SCHOOL" || targetSchool.organization.status !== "ACTIVE" || targetSchool.organization.parentOrganizationId !== PILOT_ESAO_ORGANIZATION_ID) throw new OrganizationLifecycleAuthorizationError("School assignment must target an active pilot School")
    const endedAt = closeDate(source.effectiveFrom, now)
    for (const role of source.roleAssignments) await transaction.schoolRoleAssignment.update({ where: { id: role.id }, data: { status: "SUPERSEDED", effectiveTo: closeDate(role.effectiveFrom, endedAt) } })
    await transaction.approvedMembership.update({ where: { id: source.id }, data: { status: "REVOKED", effectiveTo: endedAt, authorizationVersion: { increment: 1 } } })
    await invalidateSubjectAuthorities(transaction, source.roleAssignments.map((role) => role.id), now, value.reason.detail)
    const target = await transaction.approvedMembership.create({ data: { identityId: source.identityId, organizationId: value.toSchoolId, status: "ACTIVE", effectiveFrom: now, approvedByIdentityId: value.actor.identityId } })
    for (const role of source.roleAssignments) {
      const effectiveFrom = role.effectiveFrom > now ? role.effectiveFrom : now
      await transaction.schoolRoleAssignment.create({ data: { membershipId: target.id, schoolId: value.toSchoolId, role: role.role, status: effectiveFrom > now ? "SCHEDULED" : "ACTIVE", effectiveFrom, grantReason: value.reason.detail, evidenceReference: value.evidence?.reference ?? null, grantedByIdentityId: value.actor.identityId } })
    }
    await transaction.authenticatedIdentity.update({ where: { id: source.identityId }, data: { authorizationVersion: { increment: 1 } } })
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "ApprovedMembership", target.id, value.reason.code, source.id, now)
    return Object.freeze({ id: target.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-ASSIGN-SCHOOL" }))
}

export async function grantSchoolAdmin(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(roleSchema, input, "School Admin grant input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "SchoolRoleAssignment", value.targetIdentityId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, value.schoolId, now)
    if (value.targetIdentityId === value.actor.identityId) throw new OrganizationLifecycleAuthorizationError("ESAO Admin cannot grant a School role to itself")
    const membership = await activeSchoolMembership(transaction, value.targetIdentityId, value.schoolId, now)
    if (!membership) throw new OrganizationLifecycleAuthorizationError("School Admin grant requires an active same-School membership")
    if (membership.roleAssignments.some((role) => role.role === "SCHOOL_ADMIN" && role.status === "ACTIVE")) throw new OrganizationLifecycleConflictError("The identity already has an active School Admin assignment")
    const assignment = await transaction.schoolRoleAssignment.create({ data: { membershipId: membership.id, schoolId: value.schoolId, role: "SCHOOL_ADMIN", status: "ACTIVE", effectiveFrom: now, grantReason: value.reason.detail, evidenceReference: value.evidence?.reference ?? null, grantedByIdentityId: value.actor.identityId } })
    await bumpAuthorization(transaction, membership.identityId, membership.id)
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "SchoolRoleAssignment", assignment.id, value.reason.code, assignment.id, now)
    return Object.freeze({ id: assignment.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-GRANT-SCHOOL-ADMIN" }))
}

export async function revokeSchoolAdmin(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(roleSchema, input, "School Admin revocation input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "SchoolRoleAssignment", value.targetIdentityId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, value.schoolId, now)
    const membership = await activeSchoolMembership(transaction, value.targetIdentityId, value.schoolId, now)
    const assignment = membership?.roleAssignments.find((role) => role.role === "SCHOOL_ADMIN" && role.status === "ACTIVE")
    if (!membership || !assignment || value.targetIdentityId === value.actor.identityId) throw new OrganizationLifecycleConflictError("The target has no revocable School Admin assignment")
    await transaction.schoolRoleAssignment.update({ where: { id: assignment.id }, data: { status: "REVOKED", effectiveTo: closeDate(assignment.effectiveFrom, now) } })
    await invalidateSubjectAuthorities(transaction, [assignment.id], now, value.reason.detail)
    await bumpAuthorization(transaction, membership.identityId, membership.id)
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "SchoolRoleAssignment", assignment.id, value.reason.code, assignment.id, now)
    return Object.freeze({ id: assignment.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-REVOKE-SCHOOL-ADMIN" }))
}

export async function assignSchoolDirector(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(directorSchema, input, "School Director assignment input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, DIRECTOR_COMMAND, "SchoolRoleAssignment", value.targetIdentityId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, value.schoolId, now)
    if (value.targetIdentityId === value.actor.identityId) throw new OrganizationLifecycleAuthorizationError("ESAO Admin cannot assign itself as School Director")
    const target = await activeSchoolMembership(transaction, value.targetIdentityId, value.schoolId, now)
    if (!target) throw new OrganizationLifecycleAuthorizationError("School Director assignment requires an active same-School membership")
    if (target.roleAssignments.some((role) => role.role === "SCHOOL_DIRECTOR" && role.status === "ACTIVE")) throw new OrganizationLifecycleConflictError("The target is already the active School Director")
    const activeDirectors = await transaction.schoolRoleAssignment.findMany({ where: { schoolId: value.schoolId, role: "SCHOOL_DIRECTOR", status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }], membership: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] } }, include: { membership: { select: { identityId: true, id: true } } } })
    for (const previous of activeDirectors) {
      await transaction.schoolRoleAssignment.update({ where: { id: previous.id }, data: { status: "SUPERSEDED", effectiveTo: closeDate(previous.effectiveFrom, now) } })
      await endDirectorAssignmentAuthority(transaction, previous.id, now, "Active School Director assignment was replaced")
      await bumpAuthorization(transaction, previous.membership.identityId, previous.membership.id)
    }
    const assignment = await transaction.schoolRoleAssignment.create({ data: { membershipId: target.id, schoolId: value.schoolId, role: "SCHOOL_DIRECTOR", status: "ACTIVE", effectiveFrom: now, grantReason: value.reason.detail, evidenceReference: value.appointmentEvidence.reference, grantedByIdentityId: value.actor.identityId } })
    await bumpAuthorization(transaction, target.identityId, target.id)
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, DIRECTOR_COMMAND, "SchoolRoleAssignment", assignment.id, value.reason.code, value.schoolId, now)
    return Object.freeze({ id: assignment.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-ASSIGN-DIRECTOR" }))
}

export async function revokeSchoolDirector(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(revokeDirectorSchema, input, "School Director revocation input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, DIRECTOR_COMMAND, "SchoolRoleAssignment", value.roleAssignmentId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, value.schoolId, now)
    const assignment = await transaction.schoolRoleAssignment.findUnique({ where: { id: value.roleAssignmentId }, include: { membership: { select: { identityId: true, id: true, status: true, effectiveFrom: true, effectiveTo: true } } } })
    if (!assignment || assignment.schoolId !== value.schoolId || assignment.role !== "SCHOOL_DIRECTOR" || assignment.status !== "ACTIVE" || assignment.effectiveFrom > now || assignment.effectiveTo !== null && assignment.effectiveTo <= now || assignment.membership.status !== "ACTIVE" || assignment.membership.effectiveFrom > now || assignment.membership.effectiveTo !== null && assignment.membership.effectiveTo <= now || assignment.membership.identityId === value.actor.identityId) throw new OrganizationLifecycleConflictError("Only another active School Director assignment may be revoked")
    await transaction.schoolRoleAssignment.update({ where: { id: assignment.id }, data: { status: "REVOKED", effectiveTo: closeDate(assignment.effectiveFrom, now) } })
    await endDirectorAssignmentAuthority(transaction, assignment.id, now, "Active School Director assignment was revoked")
    await bumpAuthorization(transaction, assignment.membership.identityId, assignment.membership.id)
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, DIRECTOR_COMMAND, "SchoolRoleAssignment", assignment.id, value.reason.code, value.schoolId, now)
    return Object.freeze({ id: assignment.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-REVOKE-DIRECTOR" }))
}

async function createCredentialOperation(transaction: Transaction, actor: Actor, identityId: string, operationType: "ACTIVATION" | "RECOVERY", recoveryApprovalId: string | null, reason: Reason, now: Date) {
  const active = await transaction.credentialOperation.findFirst({ where: { identityId, status: "ISSUED", expiresAt: { gt: now } }, select: { id: true } })
  if (active) throw new OrganizationLifecycleConflictError("The identity already has an unexpired credential operation")
  const token = `p1-16.${randomBytes(32).toString("base64url")}`
  const id = randomUUID()
  const expiresAt = new Date(now.getTime() + ACTIVATION_TTL_MS)
  await transaction.credentialOperation.create({ data: { id, identityId, operationType, status: "ISSUED", tokenHash: tokenHash(token), issuedByIdentityId: actor.identityId, recoveryApprovalId, expiresAt, createdAt: now, updatedAt: now } })
  const event = await audit(transaction, actor, { kind: "PLATFORM" }, CREDENTIAL_COMMAND, "CredentialOperation", id, reason.code, id, now)
  return { id, token, expiresAt, auditEventId: event.id }
}

async function auditCredentialConsumptionDenial(
  transaction: Transaction,
  operation: {
    id: string
    identityId: string
    issuedByIdentityId: string
    identity: {
      accountIdentifier: string
      accountStatus: string
      authorizationVersion: number
      memberships: readonly { id: string; organizationId: string; authorizationVersion: number; status: string; effectiveFrom: Date; effectiveTo: Date | null }[]
    }
  },
  now: Date,
  reasonCode: string,
) {
  const membership = operation.identity.memberships.find((candidate) => candidate.status === "ACTIVE" && candidate.effectiveFrom <= now && (candidate.effectiveTo === null || candidate.effectiveTo > now))
  if (membership && operation.identity.accountStatus === "ACTIVE") {
    const actor: Actor = {
      identityId: operation.identityId,
      membershipId: membership.id,
      accountIdentifier: operation.identity.accountIdentifier,
      authorizationVersion: operation.identity.authorizationVersion,
      membershipAuthorizationVersion: membership.authorizationVersion,
      authenticatedAt: now.getTime(),
    }
    await audit(transaction, actor, { kind: "SCHOOL", organizationId: membership.organizationId, schoolId: membership.organizationId }, CREDENTIAL_COMMAND, "CredentialOperation", operation.id, reasonCode, operation.id, now, "DENIED")
    return
  }

  const issuerMembership = await transaction.approvedMembership.findFirst({
    where: {
      identityId: operation.issuedByIdentityId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      organization: { type: "PLATFORM", status: "ACTIVE" },
      identity: { accountStatus: "ACTIVE" },
    },
    select: {
      id: true,
      authorizationVersion: true,
      identity: { select: { accountIdentifier: true, authorizationVersion: true } },
    },
  })
  if (!issuerMembership) throw new OrganizationLifecycleError("Credential denial could not be attributed to an active technical or target identity")
  const actor: Actor = {
    identityId: operation.issuedByIdentityId,
    membershipId: issuerMembership.id,
    accountIdentifier: issuerMembership.identity.accountIdentifier,
    authorizationVersion: issuerMembership.identity.authorizationVersion,
    membershipAuthorizationVersion: issuerMembership.authorizationVersion,
    authenticatedAt: now.getTime(),
  }
  await audit(transaction, actor, { kind: "PLATFORM" }, CREDENTIAL_COMMAND, "CredentialOperation", operation.id, reasonCode, operation.id, now, "DENIED")
}

export async function approveCredentialRecovery(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(recoveryApprovalSchema, input, "Credential recovery approval input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "CredentialRecoveryApproval", value.targetIdentityId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireEsaoAdmin(transaction, value.actor, undefined, now)
    if (value.targetIdentityId === value.actor.identityId) throw new OrganizationLifecycleAuthorizationError("ESAO Admin cannot approve its own recovery")
    const target = await transaction.authenticatedIdentity.findUnique({ where: { id: value.targetIdentityId }, select: { id: true, accountStatus: true, memberships: { where: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] }, select: { id: true, organizationId: true, organization: { select: { type: true, status: true } } } } } })
    if (!target || target.accountStatus !== "ACTIVE" || target.memberships.length !== 1 || target.memberships[0]!.organizationId === PILOT_ESAO_ORGANIZATION_ID || target.memberships[0]!.organization.type !== "SCHOOL" || target.memberships[0]!.organization.status !== "ACTIVE") throw new OrganizationLifecycleAuthorizationError("Recovery requires one active School membership")
    await requirePilotSchool(transaction, target.memberships[0]!.organizationId)
    const id = randomUUID()
    const integrityDigest = digest({ version: 1, id, identityId: target.id, approvedByIdentityId: value.actor.identityId, approvedByMembershipId: value.actor.membershipId, reason: value.reason, approvalReference: value.approvalReference, approvedAt: now.toISOString() })
    await transaction.credentialRecoveryApproval.create({ data: { id, identityId: target.id, approvedByIdentityId: value.actor.identityId, approvedByMembershipId: value.actor.membershipId, reasonCode: value.reason.code, reasonDetail: value.reason.detail, approvalReference: value.approvalReference, integrityDigest, createdAt: now } })
    const event = await audit(transaction, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, MEMBERSHIP_COMMAND, "CredentialRecoveryApproval", id, value.reason.code, id, now)
    return Object.freeze({ id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-APPROVE-RECOVERY" }))
}

export async function issueActivationCredential(database: PrismaClient, input: unknown, now = new Date()) {
  const value = parse(issueActivationSchema, input, "Activation credential input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "PLATFORM" }, CREDENTIAL_COMMAND, "SchoolAccountRequest", value.requestId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireSystemAdmin(transaction, value.actor, now)
    const request = await transaction.schoolAccountRequest.findUnique({ where: { id: value.requestId }, include: { target: { include: { memberships: { where: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] }, include: { roleAssignments: { where: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] } } } } } } } })
    if (!request || request.status !== "APPROVED" || request.target.accountStatus !== "ACTIVE" || request.target.passwordHash !== null || request.target.memberships.length !== 1 || request.target.memberships[0]!.organizationId !== request.schoolId || !request.target.memberships[0]!.roleAssignments.some((role) => role.role === "FINANCE_OFFICER")) throw new OrganizationLifecycleCredentialError("Activation requires the exact approved Finance Officer request")
    await requirePilotSchool(transaction, request.schoolId)
    const operation = await createCredentialOperation(transaction, value.actor, request.targetIdentityId, "ACTIVATION", null, value.reason, now)
    return Object.freeze({ operationId: operation.id, token: operation.token, expiresAt: operation.expiresAt, auditEventId: operation.auditEventId })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-ISSUE-ACTIVATION" }))
}

export async function issueRecoveryCredential(database: PrismaClient, input: unknown, now = new Date()) {
  const value = parse(issueRecoverySchema, input, "Recovery credential input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "PLATFORM" }, CREDENTIAL_COMMAND, "CredentialRecoveryApproval", value.approvalId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    await requireSystemAdmin(transaction, value.actor, now)
    const approval = await transaction.credentialRecoveryApproval.findUnique({ where: { id: value.approvalId }, include: { identity: { include: { memberships: { where: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] }, include: { organization: true } } } } } })
    if (!approval || approval.status !== "APPROVED" || approval.identity.accountStatus !== "ACTIVE" || approval.identity.memberships.length !== 1 || approval.identity.memberships[0]!.organization.type !== "SCHOOL") throw new OrganizationLifecycleCredentialError("Recovery requires the exact active ESAO-approved recovery record")
    await requirePilotSchool(transaction, approval.identity.memberships[0]!.organizationId)
    const operation = await createCredentialOperation(transaction, value.actor, approval.identityId, "RECOVERY", approval.id, value.reason, now)
    return Object.freeze({ operationId: operation.id, token: operation.token, expiresAt: operation.expiresAt, auditEventId: operation.auditEventId })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-ISSUE-RECOVERY" }))
}

export async function consumeCredentialOperation(database: PrismaClient, input: unknown, now = new Date()) {
  const value = parse(consumeCredentialSchema, input, "Credential activation input is invalid")
  assertNow(now)
  const accountIdentifier = normalizeAccountIdentifier(value.accountIdentifier)
  const result = await withSerializableRetry(() => database.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`SchoolBanchee P1-16 credential:${accountIdentifier}`}, 16))`
    const operation = await transaction.credentialOperation.findUnique({ where: { tokenHash: tokenHash(value.token) }, include: { identity: { include: { memberships: { where: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] } } } }, recoveryApproval: true } })
    if (!operation) throw new OrganizationLifecycleCredentialError("Credential operation is invalid, consumed, or revoked")
    if (operation.identity.accountIdentifier !== accountIdentifier || operation.status !== "ISSUED") {
      await auditCredentialConsumptionDenial(transaction, operation, now, "CREDENTIAL_CONSUMPTION_DENIED")
      return { denied: true as const }
    }
    if (operation.expiresAt <= now) {
      await transaction.credentialOperation.update({ where: { id: operation.id }, data: { status: "EXPIRED" } })
      await auditCredentialConsumptionDenial(transaction, operation, now, "CREDENTIAL_EXPIRED")
      return { expired: true as const }
    }
    if (operation.identity.accountStatus !== "ACTIVE" || operation.identity.memberships.length !== 1) {
      await auditCredentialConsumptionDenial(transaction, operation, now, "CREDENTIAL_TARGET_INACTIVE")
      return { denied: true as const }
    }
    const passwordHash = await hashPassword(value.password)
    await transaction.authenticatedIdentity.update({ where: { id: operation.identityId }, data: { passwordHash, passwordChangedAt: now, authorizationVersion: { increment: 1 } } })
    await transaction.credentialOperation.update({ where: { id: operation.id }, data: { status: "CONSUMED", consumedAt: now } })
    if (operation.recoveryApprovalId) await transaction.credentialRecoveryApproval.update({ where: { id: operation.recoveryApprovalId }, data: { status: "CONSUMED", consumedAt: now } })
    const membership = operation.identity.memberships[0]!
    const actor: Actor = { identityId: operation.identityId, membershipId: membership.id, accountIdentifier, authorizationVersion: operation.identity.authorizationVersion, membershipAuthorizationVersion: membership.authorizationVersion, authenticatedAt: now.getTime() }
    const event = await audit(transaction, actor, { kind: "SCHOOL", organizationId: membership.organizationId, schoolId: membership.organizationId }, CREDENTIAL_COMMAND, "CredentialOperation", operation.id, operation.operationType === "ACTIVATION" ? "CREDENTIAL_ACTIVATED" : "CREDENTIAL_RECOVERED", operation.id, now)
    return Object.freeze({ operationId: operation.id, status: "CONSUMED", auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-CONSUME-CREDENTIAL" })
  if ("expired" in result && result.expired) throw new OrganizationLifecycleCredentialError("Credential operation has expired")
  if ("denied" in result && result.denied) throw new OrganizationLifecycleCredentialError("Credential operation is invalid, consumed, or revoked")
  return result
}

async function createDirectorAvailability(transaction: Transaction, actor: Actor, schoolId: string, directorRoleAssignmentId: string, unavailableFrom: Date, now: Date) {
  const existing = await transaction.activeDirectorAvailability.findFirst({ where: { schoolId, status: "UNAVAILABLE" } })
  if (existing) {
    if (existing.directorRoleAssignmentId !== directorRoleAssignmentId) throw new OrganizationLifecycleConflictError("The active Director availability belongs to a different Director assignment")
    return existing
  }
  return transaction.activeDirectorAvailability.create({ data: { id: randomUUID(), schoolId, directorRoleAssignmentId, status: "UNAVAILABLE", unavailableFrom, recordedByIdentityId: actor.identityId, createdAt: now, updatedAt: now } })
}

async function appendAuthorityLifecycle(transaction: Transaction, authorityId: string, revision: number, status: "SCHEDULED" | "IN_FORCE" | "REVOKED" | "EXPIRED" | "SUPERSEDED" | "INVALIDATED" | "ENDED_ON_RETURN" | "CONVERTED", actorIdentityId: string | null, reason: Reason, occurredAt: Date) {
  const id = randomUUID()
  const latest = await transaction.substituteDirectorAuthorityLifecycle.findFirst({ where: { authorityId }, orderBy: { revision: "desc" }, select: { revision: true } })
  const nextRevision = Math.max(revision, (latest?.revision ?? 0) + 1)
  await transaction.substituteDirectorAuthorityLifecycle.create({ data: { id, authorityId, revision: nextRevision, status, occurredAt, actorIdentityId, reason: `${reason.code}:${reason.detail}`, integrityDigest: digest({ version: 1, id, authorityId, revision: nextRevision, status, actorIdentityId, reason, occurredAt: occurredAt.toISOString() }) } })
  return id
}

export async function createSubstituteDirectorAuthority(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(authoritySchema, input, "Substitute Director Authority input is invalid")
  assertNow(now)
  if (value.variant === "TEMPORARY" && !value.expiresAt) throw new OrganizationLifecycleValidationError("Temporary authority requires a mandatory expiry")
  if (value.variant === "TEMPORARY" && !value.temporaryBasis) throw new OrganizationLifecycleValidationError("Temporary authority requires an unavailability basis")
  if (value.variant !== "TEMPORARY") fixedActingReason(value.reason.code)
  if (value.variant !== "TEMPORARY" && value.temporaryBasis) throw new OrganizationLifecycleValidationError("Acting authority cannot carry a Temporary basis")
  if (value.variant !== "TEMPORARY" && value.reason.code === "OTHER" && !value.reason.detail.trim()) throw new OrganizationLifecycleValidationError("OTHER Acting reason requires an explanation")
  if (value.expiresAt && value.expiresAt <= value.effectiveFrom) throw new OrganizationLifecycleValidationError("Authority expiry must be after its effective start")
  if (value.expiresAt && value.expiresAt <= now) throw new OrganizationLifecycleValidationError("Authority expiry must be in the future")
  const scope = value.variant === "ACTING_DIRECTOR" ? { kind: "SCHOOL" as const, organizationId: value.schoolId, schoolId: value.schoolId } : { kind: "ORGANIZATION" as const, organizationId: PILOT_ESAO_ORGANIZATION_ID }
  return runLifecycleCommand(database, value.actor, scope, SUBSTITUTE_COMMAND, "SubstituteDirectorAuthority", value.targetRoleAssignmentId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    const pilotSchools = await exactPilotSchools(transaction)
    if (!pilotSchools.includes(value.schoolId)) throw new OrganizationLifecycleAuthorizationError("AUTH-14 requires the exact 17-School pilot scope")
    await requirePilotSchool(transaction, value.schoolId)
    const isDirectorVariant = value.variant === "ACTING_DIRECTOR"
    if (isDirectorVariant) {
      requireFresh(value.actor, now)
      await requireCurrentActor(transaction, value.actor, now)
      const actorMembership = await activeSchoolMembership(transaction, value.actor.identityId, value.schoolId, now)
      if (!actorMembership || actorMembership.id !== value.actor.membershipId || actorMembership.authorizationVersion !== value.actor.membershipAuthorizationVersion) throw new OrganizationLifecycleAuthorizationError("AUTH-14/DIRECTOR requires the current active Director membership")
    } else await requireEsaoAdmin(transaction, value.actor, value.schoolId, now)
    const subjectRole = await activeSubjectRole(transaction, value.targetRoleAssignmentId, value.schoolId, now)
    const subjectIdentityId = subjectRole.membership.identityId
    if (subjectIdentityId === value.actor.identityId) throw new OrganizationLifecycleAuthorizationError("Substitute authority cannot appoint its own subject")
    const directors = await transaction.schoolRoleAssignment.findMany({ where: { schoolId: value.schoolId, role: "SCHOOL_DIRECTOR", status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }], membership: { status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] } }, include: { membership: { select: { identityId: true } } } })
    if (directors.some((director) => director.membership.identityId === subjectIdentityId)) throw new OrganizationLifecycleAuthorizationError("Substitute authority subject must differ from the active School Director")
    if (isDirectorVariant && (directors.length !== 1 || directors[0]!.membership.identityId !== value.actor.identityId)) throw new OrganizationLifecycleAuthorizationError("AUTH-14/DIRECTOR requires the active School Director as actor")
    if (value.variant === "ACTING_ESAO" && directors.length !== 1) throw new OrganizationLifecycleConflictError("ESAO-created Acting authority requires one active School Director")
    const currentActing = await transaction.substituteDirectorAuthority.findFirst({ where: { schoolId: value.schoolId, status: "IN_FORCE", variant: { in: ["ACTING_DIRECTOR", "ACTING_ESAO"] }, effectiveFrom: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } })
    if (value.variant === "TEMPORARY" && currentActing) throw new OrganizationLifecycleConflictError("Temporary authority cannot be created while an Acting holder is in force")
    let supersedesId: string | null = null
    if (value.supersedesAuthorityId) {
      const predecessor = await transaction.substituteDirectorAuthority.findUnique({ where: { id: value.supersedesAuthorityId }, include: { availability: true } })
      if (!predecessor || predecessor.schoolId !== value.schoolId || (predecessor.variant === "TEMPORARY") !== (value.variant === "TEMPORARY") || !["SCHEDULED", "IN_FORCE"].includes(predecessor.status)) throw new OrganizationLifecycleConflictError("Superseded authority does not match the requested School and tier")
      await transaction.substituteDirectorAuthority.update({ where: { id: predecessor.id }, data: { status: "SUPERSEDED", recordVersion: predecessor.recordVersion + 1 } })
      await resumePreStartAvailability(transaction, predecessor, now)
      await appendAuthorityLifecycle(transaction, predecessor.id, predecessor.recordVersion + 1, "SUPERSEDED", value.actor.identityId, value.reason, now)
      supersedesId = predecessor.id
    }
    let availabilityId: string | null = null
    if (directors.length === 1) {
      const availability = await createDirectorAvailability(transaction, value.actor, value.schoolId, directors[0]!.id, value.effectiveFrom, now)
      availabilityId = availability.id
    }
    const id = randomUUID()
    const status = value.effectiveFrom > now ? "SCHEDULED" : "IN_FORCE"
    const authorityDigest = digest({ version: 1, id, schoolId: value.schoolId, variant: value.variant, appointingIdentityId: value.actor.identityId, subjectRoleAssignmentId: value.targetRoleAssignmentId, availabilityId, reason: value.reason, temporaryBasis: value.temporaryBasis ?? null, commandScope: SUBSTITUTE_COMMAND_SCOPE, effectiveFrom: value.effectiveFrom.toISOString(), expiresAt: value.expiresAt?.toISOString() ?? null, supersedesId })
    const authority = await transaction.substituteDirectorAuthority.create({ data: { id, schoolId: value.schoolId, variant: value.variant, status, appointingIdentityId: value.actor.identityId, subjectRoleAssignmentId: value.targetRoleAssignmentId, availabilityId, actingReasonCode: value.variant === "TEMPORARY" ? null : fixedActingReason(value.reason.code), reasonDetail: value.variant === "TEMPORARY" ? null : value.reason.detail, temporaryBasis: value.variant === "TEMPORARY" ? value.temporaryBasis : null, commandScope: [...SUBSTITUTE_COMMAND_SCOPE], effectiveFrom: value.effectiveFrom, expiresAt: value.expiresAt ?? null, recordVersion: 1, supersedesId, integrityDigest: authorityDigest, evidenceReference: value.evidence?.reference ?? null, evidenceContentHash: value.evidence?.contentHash ?? null, createdAt: now, updatedAt: now } })
    await appendAuthorityLifecycle(transaction, authority.id, 1, status, value.actor.identityId, value.reason, now)
    const scope = isDirectorVariant ? { kind: "SCHOOL" as const, organizationId: value.schoolId, schoolId: value.schoolId } : { kind: "ORGANIZATION" as const, organizationId: PILOT_ESAO_ORGANIZATION_ID }
    const event = await audit(transaction, value.actor, scope, SUBSTITUTE_COMMAND, "SubstituteDirectorAuthority", authority.id, value.reason.code, authority.id, now)
    return Object.freeze({ id: authority.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-CREATE-SUBSTITUTE-AUTHORITY" }))
}

export async function transitionSubstituteDirectorAuthority(database: PrismaClient, input: unknown, now = new Date()): Promise<LifecycleResult> {
  const value = parse(authorityTransitionSchema, input, "Substitute Director Authority transition input is invalid")
  assertNow(now)
  return runLifecycleCommand(database, value.actor, { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID }, SUBSTITUTE_COMMAND, "SubstituteDirectorAuthority", value.authorityId, now, () => withSerializableRetry(() => database.$transaction(async (transaction) => {
    const authority = await transaction.substituteDirectorAuthority.findUnique({ where: { id: value.authorityId }, include: { subjectRoleAssignment: { include: { membership: true } }, availability: true } })
    if (!authority || !["SCHEDULED", "IN_FORCE"].includes(authority.status)) throw new OrganizationLifecycleConflictError("Only a scheduled or in-force authority may be transitioned")
    const pilotSchools = await exactPilotSchools(transaction)
    if (!pilotSchools.includes(authority.schoolId)) throw new OrganizationLifecycleAuthorizationError("AUTH-14 requires the exact 17-School pilot scope")
    await requirePilotSchool(transaction, authority.schoolId)
    const availabilityDirector = authority.availability
      ? await transaction.schoolRoleAssignment.findUnique({ where: { id: authority.availability.directorRoleAssignmentId }, include: { membership: true } })
      : null
    const isDirectorActor = authority.variant === "ACTING_DIRECTOR" && availabilityDirector?.membership.identityId === value.actor.identityId
    if (isDirectorActor) {
      requireFresh(value.actor, now)
      await requireCurrentActor(transaction, value.actor, now)
      if (value.actor.membershipId !== availabilityDirector!.membershipId || availabilityDirector!.membership.authorizationVersion !== value.actor.membershipAuthorizationVersion) throw new OrganizationLifecycleAuthorizationError("AUTH-14/DIRECTOR requires the current Director membership")
    } else await requireEsaoAdmin(transaction, value.actor, authority.schoolId, now)
    if (value.reason.code === "EXPIRE" && (authority.expiresAt === null || authority.expiresAt > now)) throw new OrganizationLifecycleConflictError("Authority cannot expire before its configured expiry")
    const nextStatus = value.reason.code === "RETURN" ? "ENDED_ON_RETURN" : value.reason.code === "EXPIRE" ? "EXPIRED" : "REVOKED"
    if (nextStatus === "ENDED_ON_RETURN" && authority.effectiveFrom > now) throw new OrganizationLifecycleConflictError("A scheduled authority cannot use the Director return transition")
    if (nextStatus === "ENDED_ON_RETURN" && authority.variant === "TEMPORARY") throw new OrganizationLifecycleValidationError("Temporary authority cannot use the Director return transition")
    await transaction.substituteDirectorAuthority.update({ where: { id: authority.id }, data: { status: nextStatus, recordVersion: authority.recordVersion + 1 } })
    await resumePreStartAvailability(transaction, authority, now)
    if (nextStatus === "ENDED_ON_RETURN" && authority.availabilityId && authority.availability) {
      const resumedAt = new Date(Math.max(now.getTime(), authority.availability.unavailableFrom.getTime()) + 1)
      await transaction.activeDirectorAvailability.update({ where: { id: authority.availabilityId }, data: { status: "RESUMED", resumedAt, updatedAt: now } })
    }
    await appendAuthorityLifecycle(transaction, authority.id, authority.recordVersion + 1, nextStatus, value.actor.identityId, value.reason, now)
    const scope = authority.variant === "ACTING_DIRECTOR" ? { kind: "SCHOOL" as const, organizationId: authority.schoolId, schoolId: authority.schoolId } : { kind: "ORGANIZATION" as const, organizationId: PILOT_ESAO_ORGANIZATION_ID }
    const event = await audit(transaction, value.actor, scope, SUBSTITUTE_COMMAND, "SubstituteDirectorAuthority", authority.id, value.reason.code, authority.id, now)
    return Object.freeze({ id: authority.id, auditEventId: event.id })
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-TRANSITION-SUBSTITUTE-AUTHORITY" }))
}

export const createActingAuthority = createSubstituteDirectorAuthority
export const createTemporaryAuthority = createSubstituteDirectorAuthority
export const revokeSubstituteDirectorAuthority = transitionSubstituteDirectorAuthority
export const consumeActivationCredential = consumeCredentialOperation
