import type { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { randomUUID } from "node:crypto"
import { z } from "zod"

import {
  MINIMUM_PASSWORD_LENGTH,
  PASSWORD_COST,
  normalizeAccountIdentifier,
} from "../auth/credentials.ts"
import { requireFreshAuthentication } from "../auth/session.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"
import { PILOT_ESAO_ORGANIZATION_ID } from "../authorization/esao-admin.ts"

export const SCHOOL_ACCOUNT_REQUEST_COMMAND = "AUTH-01"
export const ESAO_ACCOUNT_REQUEST_COMMAND = "AUTH-03"
export const FINANCE_OFFICER_ROLE = "FINANCE_OFFICER" as const
export const REQUEST_RATE_LIMIT_MAX_ATTEMPTS = 5
export const REQUEST_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const FINANCE_OFFICER_PASSWORD_COST = PASSWORD_COST
export const FINANCE_OFFICER_MINIMUM_PASSWORD_LENGTH = MINIMUM_PASSWORD_LENGTH

const uuid = z.string().uuid()
const reasonCode = z.string().trim().regex(/^[A-Z][A-Z0-9._:-]{1,63}$/)
const reasonDetail = z.string().trim().min(1).max(2000)
const reference = z.string().trim().min(1).max(512)
const syntheticAccountIdentifier = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform(normalizeAccountIdentifier)
  .refine((value) => value.endsWith("@synthetic.test"), "Only synthetic account identifiers are permitted")

const actorSchema = z
  .object({
    identityId: uuid,
    membershipId: uuid,
    accountIdentifier: z.string().trim().min(1).max(320),
    authorizationVersion: z.number().int().positive(),
    membershipAuthorizationVersion: z.number().int().positive(),
    authenticatedAt: z.number().int().nonnegative(),
  })
  .strict()

const structuredReasonSchema = z.preprocess(
  (input) => {
    if (typeof input !== "object" || input === null) return input
    const value = input as Record<string, unknown>
    return {
      code: value.code ?? value.reasonCode,
      detail: value.detail ?? value.reasonDetail,
    }
  },
  z.object({ code: reasonCode, detail: reasonDetail }).strict(),
)

const targetSchema = z
  .object({
    accountIdentifier: syntheticAccountIdentifier,
    displayName: z.string().trim().min(1).max(200),
  })
  .strict()

const submitSchema = z
  .object({
    actor: actorSchema,
    schoolId: uuid,
    target: targetSchema,
    requestedRole: z.literal(FINANCE_OFFICER_ROLE).default(FINANCE_OFFICER_ROLE),
    reason: structuredReasonSchema,
  })
  .strict()

const requesterTransitionSchema = z
  .object({
    actor: actorSchema,
    requestId: uuid,
    reason: structuredReasonSchema,
    targetDisplayName: z.string().trim().min(1).max(200).optional(),
  })
  .strict()

const verificationSchema = z
  .object({
    outcome: z.enum(["VERIFIED", "NEEDS_CORRECTION", "NOT_VERIFIED"]),
    reference,
  })
  .strict()

const esaoTransitionSchema = z
  .object({
    actor: actorSchema,
    requestId: uuid,
    reason: structuredReasonSchema,
    verification: verificationSchema,
  })
  .strict()

type Transaction = Prisma.TransactionClient
type Actor = z.infer<typeof actorSchema>
type Reason = { code: string; detail: string }
type Verification = z.infer<typeof verificationSchema>

export type SchoolAccountRequestResult = Readonly<{
  requestId: string
  status: string
  revision: number
  targetIdentityId: string
  membershipId?: string
  roleAssignmentId?: string
  auditEventIds: readonly string[]
  historyIds: readonly string[]
}>

export type SchoolAccountRequestView = Readonly<{
  id: string
  status: string
  revision: number
  schoolId: string
  requesterIdentityId: string
  targetIdentityId: string
  targetAccountIdentifier: string
  targetDisplayName: string
  requestedRole: typeof FINANCE_OFFICER_ROLE
  verificationOutcome: string | null
  verificationReference: string | null
  submittedAt: Date
  pendingReviewAt: Date | null
  terminalAt: Date | null
}>

export class SchoolAccountRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SchoolAccountRequestError"
  }
}

export class SchoolAccountRequestValidationError extends SchoolAccountRequestError {}
export class SchoolAccountRequestAuthorizationError extends SchoolAccountRequestError {}
export class SchoolAccountRequestFreshAuthenticationRequiredError extends SchoolAccountRequestAuthorizationError {}
export class SchoolAccountRequestDuplicateError extends SchoolAccountRequestError {}
export class SchoolAccountRequestTransitionError extends SchoolAccountRequestError {}
export class SchoolAccountRequestDecisionError extends SchoolAccountRequestAuthorizationError {}
export class SchoolAccountRequestRateLimitedError extends SchoolAccountRequestError {}

type RateLimitResult = Readonly<{ rateLimited: true; auditEventId: string }>

function parse<S extends z.ZodTypeAny>(schema: S, input: unknown, message: string): z.infer<S> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new SchoolAccountRequestValidationError(message)
  }
  return result.data
}

function assertNow(now: Date) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new SchoolAccountRequestValidationError("A valid transition time is required")
  }
}

function requireFreshActor(actor: Actor, now: Date) {
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
    throw new SchoolAccountRequestFreshAuthenticationRequiredError("Fresh authentication is required for this account-request action")
  }
}

function digest(value: object) {
  return calculateJsonIntegrityDigest(value as never)
}

function terminal(status: string) {
  return status === "APPROVED" || status === "REJECTED" || status === "WITHDRAWN"
}

async function requireSchoolAdmin(
  transaction: Transaction,
  actor: Actor,
  schoolId: string,
  now: Date,
) {
  requireFreshActor(actor, now)
  const membership = await transaction.approvedMembership.findFirst({
    where: {
      id: actor.membershipId,
      identityId: actor.identityId,
      organizationId: schoolId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      identity: {
        accountStatus: "ACTIVE",
        accountIdentifier: normalizeAccountIdentifier(actor.accountIdentifier),
        authorizationVersion: actor.authorizationVersion,
      },
      organization: {
        type: "SCHOOL",
        status: "ACTIVE",
        parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
        school: { directoryIsActive: true },
      },
      roleAssignments: {
        some: {
          schoolId,
          role: "SCHOOL_ADMIN",
          status: "ACTIVE",
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
      },
    },
    select: { id: true, identityId: true, organizationId: true, authorizationVersion: true },
  })
  if (!membership || membership.authorizationVersion !== actor.membershipAuthorizationVersion) {
    throw new SchoolAccountRequestAuthorizationError("Only an active same-School School Admin may submit or change this request")
  }
  return membership
}

async function exactPilotSchools(transaction: Transaction) {
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
    throw new SchoolAccountRequestDecisionError("The active ESAO Admin scope must contain exactly 17 pilot Schools")
  }
  return schools.map((school) => school.organizationId)
}

async function requireEsaoAdmin(transaction: Transaction, actor: Actor, schoolId: string, now: Date) {
  requireFreshActor(actor, now)
  const expectedSchools = await exactPilotSchools(transaction)
  const configuration = await transaction.esaoAdminConfiguration.findFirst({
    where: {
      identityId: actor.identityId,
      esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
      roleCode: "ESAO_ADMIN",
      configurationSource: "APPROVED_APPOINTMENT",
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      identity: {
        accountStatus: "ACTIVE",
        accountIdentifier: normalizeAccountIdentifier(actor.accountIdentifier),
        authorizationVersion: actor.authorizationVersion,
      },
      schoolScopes: { some: { schoolId } },
    },
    include: {
      schoolScopes: { select: { schoolId: true }, orderBy: { schoolId: "asc" } },
    },
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
      roleAssignments: { none: {} },
      organization: { type: "ESAO", status: "ACTIVE" },
    },
    select: { id: true },
  })
  if (
    !configuration ||
    !membership ||
    configuration.schoolScopes.length !== 17 ||
    configuration.schoolScopes.some((scope, index) => scope.schoolId !== expectedSchools[index])
  ) {
    throw new SchoolAccountRequestDecisionError("Only an active ESAO Admin may decide across the exact 17-School pilot scope")
  }
  return { configuration, membership }
}

async function appendHistory(
  transaction: Transaction,
  request: {
    id: string
    revision: number
    schoolId: string
    targetIdentityId: string
    targetAccountIdentifier: string
    targetDisplayName: string
    requestedRole: "FINANCE_OFFICER"
  },
  transition: {
    action: "SUBMIT" | "PENDING_REVIEW" | "REQUEST_CORRECTION" | "RESUBMIT" | "APPROVE" | "REJECT" | "WITHDRAW"
    commandCode: typeof SCHOOL_ACCOUNT_REQUEST_COMMAND | typeof ESAO_ACCOUNT_REQUEST_COMMAND
    fromStatus: "SUBMITTED" | "PENDING_ESAO_REVIEW" | "NEEDS_CORRECTION" | "RESUBMITTED" | null
    toStatus: "SUBMITTED" | "PENDING_ESAO_REVIEW" | "NEEDS_CORRECTION" | "RESUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN"
    actor: Actor
    reason: Reason
    verification?: Verification | null
    occurredAt: Date
  },
) {
  const correlationId = `${request.id}:${request.revision}`
  const scope = transition.commandCode === SCHOOL_ACCOUNT_REQUEST_COMMAND
    ? { kind: "SCHOOL" as const, organizationId: request.schoolId, schoolId: request.schoolId }
    : { kind: "ORGANIZATION" as const, organizationId: PILOT_ESAO_ORGANIZATION_ID }
  const audit = await recordAuditEventInTransaction(transaction, {
    actorIdentityId: transition.actor.identityId,
    actorMembershipId: transition.actor.membershipId,
    scope,
    commandCode: transition.commandCode,
    targetType: "SchoolAccountRequest",
    targetId: request.id,
    outcome: "SUCCESS",
    reasonCode: transition.reason.code,
    correlationId,
    occurredAt: transition.occurredAt,
  })
  const historyId = randomUUID()
  const integrityDigest = digest({
    version: 1,
    id: historyId,
    requestId: request.id,
    revision: request.revision,
    action: transition.action,
    commandCode: transition.commandCode,
    fromStatus: transition.fromStatus,
    toStatus: transition.toStatus,
    actorIdentityId: transition.actor.identityId,
    actorMembershipId: transition.actor.membershipId,
    schoolId: request.schoolId,
    targetIdentityId: request.targetIdentityId,
    targetAccountIdentifier: request.targetAccountIdentifier,
    targetDisplayName: request.targetDisplayName,
    requestedRole: request.requestedRole,
    reason: transition.reason,
    verification: transition.verification ?? null,
    occurredAt: transition.occurredAt.toISOString(),
  })
  await transaction.schoolAccountRequestHistory.create({
    data: {
      id: historyId,
      requestId: request.id,
      revision: request.revision,
      action: transition.action,
      commandCode: transition.commandCode,
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      actorIdentityId: transition.actor.identityId,
      actorMembershipId: transition.actor.membershipId,
      schoolId: request.schoolId,
      targetIdentityId: request.targetIdentityId,
      targetAccountIdentifier: request.targetAccountIdentifier,
      targetDisplayName: request.targetDisplayName,
      requestedRole: request.requestedRole,
      reasonCode: transition.reason.code,
      reasonDetail: transition.reason.detail,
      verificationOutcome: transition.verification?.outcome ?? null,
      verificationReference: transition.verification?.reference ?? null,
      occurredAt: transition.occurredAt,
      integrityDigest,
    },
  })
  return { auditEventId: audit.id, historyId }
}

async function consumeRateLimit(transaction: Transaction, actor: Actor, schoolId: string, now: Date): Promise<RateLimitResult | null> {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`SchoolBanchee P1-15 rate:${actor.identityId}:${schoolId}`}, 11))
  `
  const key = { requesterIdentityId_schoolId: { requesterIdentityId: actor.identityId, schoolId } }
  const current = await transaction.schoolAccountRequestRateLimit.findUnique({ where: key })
  const windowStart = new Date(now.getTime() - REQUEST_RATE_LIMIT_WINDOW_MS)
  if (!current || current.windowStartedAt <= windowStart) {
    await transaction.schoolAccountRequestRateLimit.upsert({
      where: key,
      create: { requesterIdentityId: actor.identityId, schoolId, windowStartedAt: now, attemptCount: 1 },
      update: { windowStartedAt: now, attemptCount: 1 },
    })
    return null
  }
  if (current.attemptCount >= REQUEST_RATE_LIMIT_MAX_ATTEMPTS) {
    const audit = await recordAuditEventInTransaction(transaction, {
      actorIdentityId: actor.identityId,
      actorMembershipId: actor.membershipId,
      scope: { kind: "SCHOOL", organizationId: schoolId, schoolId },
      commandCode: SCHOOL_ACCOUNT_REQUEST_COMMAND,
      targetType: "SchoolAccountRequestRateLimit",
      targetId: `${actor.identityId}:${schoolId}`,
      outcome: "DENIED",
      reasonCode: "SCHOOL_ACCOUNT_REQUEST_RATE_LIMITED",
      correlationId: null,
      occurredAt: now,
    })
    return { rateLimited: true, auditEventId: audit.id }
  }
  await transaction.schoolAccountRequestRateLimit.update({ where: key, data: { attemptCount: { increment: 1 } } })
  return null
}

function assertRolePolicy(role: string) {
  if (role !== FINANCE_OFFICER_ROLE) {
    throw new SchoolAccountRequestValidationError("Only the Finance Officer role is requestable through this path")
  }
}

function resultFromRequest(
  request: { id: string; status: string; revision: number; targetIdentityId: string },
  evidence: { auditEventId: string; historyId: string },
  extra: { membershipId?: string; roleAssignmentId?: string } = {},
): SchoolAccountRequestResult {
  return Object.freeze({
    requestId: request.id,
    status: request.status,
    revision: request.revision,
    targetIdentityId: request.targetIdentityId,
    ...extra,
    auditEventIds: [evidence.auditEventId],
    historyIds: [evidence.historyId],
  })
}

export async function submitSchoolAccountRequest(database: PrismaClient, input: unknown, now = new Date()): Promise<SchoolAccountRequestResult> {
  const value = parse(submitSchema, input, "School Account Request submission is invalid")
  assertNow(now)
  assertRolePolicy(value.requestedRole)
  const actor = value.actor
  const targetAccountIdentifier = value.target.accountIdentifier
  const result = await withSerializableRetry(
    () => database.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${`SchoolBanchee P1-15 request:${targetAccountIdentifier}`}, 12))
      `
      await requireSchoolAdmin(transaction, actor, value.schoolId, now)
      const rateLimit = await consumeRateLimit(transaction, actor, value.schoolId, now)
      if (rateLimit) return rateLimit

      const existing = await transaction.authenticatedIdentity.findUnique({
        where: { accountIdentifier: targetAccountIdentifier },
        select: { id: true, displayName: true, accountStatus: true, passwordHash: true, passwordChangedAt: true, memberships: { select: { id: true } } },
      })
      if (existing && existing.id === actor.identityId) {
        throw new SchoolAccountRequestAuthorizationError("A School Admin cannot target its own identity")
      }
      if (existing && (existing.accountStatus !== "PENDING" || existing.passwordHash !== null || existing.passwordChangedAt !== null || existing.memberships.length > 0)) {
        throw new SchoolAccountRequestDuplicateError("The synthetic target identity is already active or has organization access")
      }
      const openRequest = await transaction.schoolAccountRequest.findFirst({
        where: { targetAccountIdentifier, status: { notIn: ["APPROVED", "REJECTED", "WITHDRAWN"] } },
        select: { id: true },
      })
      if (openRequest) {
        throw new SchoolAccountRequestDuplicateError("One non-terminal request already exists for this synthetic identity")
      }

      const target = existing ?? await transaction.authenticatedIdentity.create({
        data: {
          accountIdentifier: targetAccountIdentifier,
          displayName: value.target.displayName,
          accountStatus: "PENDING",
        },
        select: { id: true, displayName: true },
      })
      if (existing && existing.displayName !== value.target.displayName) {
        await transaction.authenticatedIdentity.update({ where: { id: existing.id }, data: { displayName: value.target.displayName } })
      }

      const requestId = randomUUID()
      const submitted = await transaction.schoolAccountRequest.create({
        data: {
          id: requestId,
          requesterIdentityId: actor.identityId,
          requesterMembershipId: actor.membershipId,
          targetIdentityId: target.id,
          schoolId: value.schoolId,
          requestedRole: FINANCE_OFFICER_ROLE,
          targetAccountIdentifier,
          targetDisplayName: value.target.displayName,
          submissionReasonCode: value.reason.code,
          submissionReasonDetail: value.reason.detail,
          status: "SUBMITTED",
          revision: 1,
          lastReasonCode: value.reason.code,
          lastReasonDetail: value.reason.detail,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        select: { id: true, revision: true, schoolId: true, targetIdentityId: true, targetAccountIdentifier: true, targetDisplayName: true, requestedRole: true, status: true },
      })
      const first = await appendHistory(transaction, submitted as never, {
        action: "SUBMIT",
        commandCode: SCHOOL_ACCOUNT_REQUEST_COMMAND,
        fromStatus: null,
        toStatus: "SUBMITTED",
        actor,
        reason: value.reason,
        occurredAt: now,
      })
      const pending = await transaction.schoolAccountRequest.update({
        where: { id: requestId },
        data: { status: "PENDING_ESAO_REVIEW", revision: 2, pendingReviewAt: now, updatedAt: now },
        select: { id: true, revision: true, schoolId: true, targetIdentityId: true, targetAccountIdentifier: true, targetDisplayName: true, requestedRole: true, status: true },
      })
      const second = await appendHistory(transaction, pending as never, {
        action: "PENDING_REVIEW",
        commandCode: SCHOOL_ACCOUNT_REQUEST_COMMAND,
        fromStatus: "SUBMITTED",
        toStatus: "PENDING_ESAO_REVIEW",
        actor,
        reason: { code: "SCHOOL_ACCOUNT_REQUEST_PENDING_ESAO_REVIEW", detail: value.reason.detail },
        occurredAt: now,
      })
      return resultFromRequest(pending, { auditEventId: second.auditEventId, historyId: second.historyId })
    }, { isolationLevel: "Serializable" }),
    { operationKey: "P1-15-SCHOOL-ACCOUNT-REQUEST-SUBMIT" },
  )
  if ("rateLimited" in result) {
    throw new SchoolAccountRequestRateLimitedError("School Account Request submission rate limit exceeded")
  }
  return result
}

async function requesterTransition(
  database: PrismaClient,
  input: unknown,
  now: Date,
  action: "RESUBMIT" | "WITHDRAW",
): Promise<SchoolAccountRequestResult> {
  const value = parse(requesterTransitionSchema, input, "School Account Request transition is invalid")
  assertNow(now)
  const actor = value.actor
  return withSerializableRetry(
    () => database.$transaction(async (transaction) => {
      const request = await transaction.schoolAccountRequest.findUnique({ where: { id: value.requestId } })
      if (!request) throw new SchoolAccountRequestTransitionError("School Account Request was not found")
      await requireSchoolAdmin(transaction, actor, request.schoolId, now)
      if (request.requesterIdentityId !== actor.identityId || request.requesterMembershipId !== actor.membershipId) {
        throw new SchoolAccountRequestAuthorizationError("Only the submitting School Admin may change this request")
      }
      if (action === "RESUBMIT" && request.status !== "NEEDS_CORRECTION") {
        throw new SchoolAccountRequestTransitionError("Only a Needs Correction request may be resubmitted")
      }
      if (action === "WITHDRAW" && !["PENDING_ESAO_REVIEW", "NEEDS_CORRECTION", "RESUBMITTED"].includes(request.status)) {
        throw new SchoolAccountRequestTransitionError("Only an unapproved request may be withdrawn")
      }
      const targetDisplayName = value.targetDisplayName ?? request.targetDisplayName
      if (action === "RESUBMIT") {
        await transaction.authenticatedIdentity.update({ where: { id: request.targetIdentityId }, data: { displayName: targetDisplayName } })
      }
      const nextStatus = action === "RESUBMIT" ? "RESUBMITTED" : "WITHDRAWN"
      const nextRevision = request.revision + 1
      const updated = await transaction.schoolAccountRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
          revision: nextRevision,
          targetDisplayName,
          lastReasonCode: value.reason.code,
          lastReasonDetail: value.reason.detail,
          verificationOutcome: null,
          verificationReference: null,
          terminalAt: action === "WITHDRAW" ? now : null,
          updatedAt: now,
        },
        select: { id: true, revision: true, schoolId: true, targetIdentityId: true, targetAccountIdentifier: true, targetDisplayName: true, requestedRole: true, status: true },
      })
      const evidence = await appendHistory(transaction, updated as never, {
        action,
        commandCode: SCHOOL_ACCOUNT_REQUEST_COMMAND,
        fromStatus: request.status as "PENDING_ESAO_REVIEW" | "NEEDS_CORRECTION" | "RESUBMITTED",
        toStatus: nextStatus,
        actor,
        reason: value.reason,
        occurredAt: now,
      })
      return resultFromRequest(updated, evidence)
    }, { isolationLevel: "Serializable" }),
    { operationKey: `P1-15-SCHOOL-ACCOUNT-REQUEST-${action}` },
  )
}

export async function resubmitSchoolAccountRequest(database: PrismaClient, input: unknown, now = new Date()) {
  return requesterTransition(database, input, now, "RESUBMIT")
}

export async function withdrawSchoolAccountRequest(database: PrismaClient, input: unknown, now = new Date()) {
  return requesterTransition(database, input, now, "WITHDRAW")
}

async function esaoTransition(
  database: PrismaClient,
  input: unknown,
  now: Date,
  action: "REQUEST_CORRECTION" | "APPROVE" | "REJECT",
): Promise<SchoolAccountRequestResult> {
  const value = parse(esaoTransitionSchema, input, "ESAO Account Request decision is invalid")
  assertNow(now)
  const actor = value.actor
  if (action === "APPROVE" && value.verification.outcome !== "VERIFIED") {
    throw new SchoolAccountRequestDecisionError("Approval requires a VERIFIED synthetic roster outcome")
  }
  if (action === "REQUEST_CORRECTION" && !["NEEDS_CORRECTION", "NOT_VERIFIED"].includes(value.verification.outcome)) {
    throw new SchoolAccountRequestDecisionError("Correction requires a NEEDS_CORRECTION or NOT_VERIFIED outcome")
  }
  if (action === "REJECT" && value.verification.outcome !== "NOT_VERIFIED") {
    throw new SchoolAccountRequestDecisionError("Rejection requires a NOT_VERIFIED synthetic roster outcome")
  }
  return withSerializableRetry(
    () => database.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${`SchoolBanchee P1-15 decision:${value.requestId}`}, 13))
      `
      const request = await transaction.schoolAccountRequest.findUnique({ where: { id: value.requestId } })
      if (!request) throw new SchoolAccountRequestTransitionError("School Account Request was not found")
      await requireEsaoAdmin(transaction, actor, request.schoolId, now)
      if (!["PENDING_ESAO_REVIEW", "RESUBMITTED"].includes(request.status)) {
        throw new SchoolAccountRequestTransitionError("Only a pending or resubmitted request may receive an ESAO decision")
      }

      let membershipId: string | undefined
      let roleAssignmentId: string | undefined
      if (action === "APPROVE") {
        const target = await transaction.authenticatedIdentity.findUnique({
          where: { id: request.targetIdentityId },
          select: { id: true, accountIdentifier: true, accountStatus: true, passwordHash: true, passwordChangedAt: true, memberships: { select: { id: true } } },
        })
        if (!target || target.accountIdentifier !== request.targetAccountIdentifier || target.accountStatus !== "PENDING" || target.passwordHash !== null || target.passwordChangedAt !== null || target.memberships.length !== 0) {
          throw new SchoolAccountRequestDecisionError("Approval target must remain a pending credential-free synthetic identity")
        }
        await transaction.authenticatedIdentity.update({ where: { id: target.id }, data: { accountStatus: "ACTIVE", authorizationVersion: { increment: 1 }, updatedAt: now } })
        const membership = await transaction.approvedMembership.create({
          data: {
            identityId: target.id,
            organizationId: request.schoolId,
            status: "ACTIVE",
            effectiveFrom: now,
            approvedByIdentityId: actor.identityId,
          },
          select: { id: true },
        })
        membershipId = membership.id
        const assignment = await transaction.schoolRoleAssignment.create({
          data: {
            membershipId: membership.id,
            schoolId: request.schoolId,
            role: FINANCE_OFFICER_ROLE,
            status: "ACTIVE",
            effectiveFrom: now,
            grantReason: value.reason.detail,
            evidenceReference: value.verification.reference,
            grantedByIdentityId: actor.identityId,
          },
          select: { id: true },
        })
        roleAssignmentId = assignment.id
      }

      const nextStatus = action === "REQUEST_CORRECTION" ? "NEEDS_CORRECTION" : action === "APPROVE" ? "APPROVED" : "REJECTED"
      const updated = await transaction.schoolAccountRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
          revision: request.revision + 1,
          lastReasonCode: value.reason.code,
          lastReasonDetail: value.reason.detail,
          verificationOutcome: value.verification.outcome,
          verificationReference: value.verification.reference,
          terminalAt: terminal(nextStatus) ? now : null,
          updatedAt: now,
        },
        select: { id: true, revision: true, schoolId: true, targetIdentityId: true, targetAccountIdentifier: true, targetDisplayName: true, requestedRole: true, status: true },
      })
      const evidence = await appendHistory(transaction, updated as never, {
        action,
        commandCode: ESAO_ACCOUNT_REQUEST_COMMAND,
        fromStatus: request.status as "PENDING_ESAO_REVIEW" | "RESUBMITTED",
        toStatus: nextStatus,
        actor,
        reason: value.reason,
        verification: value.verification,
        occurredAt: now,
      })
      return resultFromRequest(updated, evidence, { membershipId, roleAssignmentId })
    }, { isolationLevel: "Serializable" }),
    { operationKey: `P1-15-ESAO-ACCOUNT-REQUEST-${action}` },
  )
}

export async function requestSchoolAccountCorrection(database: PrismaClient, input: unknown, now = new Date()) {
  return esaoTransition(database, input, now, "REQUEST_CORRECTION")
}

export async function approveSchoolAccountRequest(database: PrismaClient, input: unknown, now = new Date()) {
  return esaoTransition(database, input, now, "APPROVE")
}

export async function rejectSchoolAccountRequest(database: PrismaClient, input: unknown, now = new Date()) {
  return esaoTransition(database, input, now, "REJECT")
}

export async function listSchoolAccountRequests(
  database: PrismaClient,
  input: Readonly<{ actor: Actor; status?: "PENDING_ESAO_REVIEW" | "NEEDS_CORRECTION" | "RESUBMITTED"; schoolId?: string }>,
  now = new Date(),
): Promise<readonly SchoolAccountRequestView[]> {
  const actor = parse(actorSchema, input.actor, "Queue actor is invalid")
  assertNow(now)
  const schoolId = input.schoolId ?? undefined
  return withSerializableRetry(
    () => database.$transaction(async (transaction) => {
      const expected = schoolId ?? (await exactPilotSchools(transaction))[0]
      await requireEsaoAdmin(transaction, actor, expected, now)
      const rows = await transaction.schoolAccountRequest.findMany({
        where: {
          ...(input.status ? { status: input.status } : { status: { in: ["PENDING_ESAO_REVIEW", "NEEDS_CORRECTION", "RESUBMITTED"] } }),
          ...(schoolId ? { schoolId } : {}),
        },
        orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          status: true,
          revision: true,
          schoolId: true,
          requesterIdentityId: true,
          targetIdentityId: true,
          targetAccountIdentifier: true,
          targetDisplayName: true,
          requestedRole: true,
          verificationOutcome: true,
          verificationReference: true,
          submittedAt: true,
          pendingReviewAt: true,
          terminalAt: true,
        },
      })
      return rows as readonly SchoolAccountRequestView[]
    }, { isolationLevel: "Serializable" }),
    { operationKey: "P1-15-ESAO-ACCOUNT-REQUEST-QUEUE" },
  )
}

// Explicit aliases keep the policy vocabulary available to API/form callers.
export const submitFinanceOfficerRequest = submitSchoolAccountRequest
export const requestFinanceOfficerCorrection = requestSchoolAccountCorrection
export const resubmitFinanceOfficerRequest = resubmitSchoolAccountRequest
export const withdrawFinanceOfficerRequest = withdrawSchoolAccountRequest
export const approveFinanceOfficerRequest = approveSchoolAccountRequest
export const rejectFinanceOfficerRequest = rejectSchoolAccountRequest

export function validateFinanceOfficerPasswordPolicy(password: unknown) {
  return typeof password === "string" && password.length >= FINANCE_OFFICER_MINIMUM_PASSWORD_LENGTH && password.length <= 128
}
