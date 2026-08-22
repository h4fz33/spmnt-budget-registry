import type { PrismaClient } from "../../../generated/prisma/client"
import { randomUUID } from "node:crypto"

import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"
import { SYSTEM_ADMIN_BOOTSTRAP_ID } from "../bootstrap/constants.ts"

import {
  ACTIVE_DIRECTOR_ONLY_COMMANDS,
  P0_04_AUTHORIZATION_MATRIX,
  SUBSTITUTE_DIRECTOR_COMMANDS,
  isAuthorizationCommand,
  isSubstituteDirectorCommand,
  type AuthorizationCommand,
  type SubstituteDirectorCommand,
} from "./matrix.ts"

export type AuthorizationSession = Readonly<{
  user: Readonly<{
    id: string
    accountIdentifier: string
    authorizationVersion: number
    authenticatedAt: number
  }>
}>

export type AuthorizationIntent = "COMMAND" | "APPROVAL"

export type AuthorizationRequest = Readonly<{
  command: string
  schoolId: string
  intent?: AuthorizationIntent
  now?: Date
}>

export type EffectiveDirectorAuthorityKind = "ACTIVE_DIRECTOR" | "ACTING" | "TEMPORARY"

export type AuthorizationDecisionReason =
  | "ALLOWED"
  | "INVALID_REQUEST"
  | "UNLISTED_COMMAND"
  | "UNSUPPORTED_AUTHORIZATION_INTENT"
  | "NO_ACTIVE_SESSION"
  | "STALE_SESSION"
  | "INVALID_SCHOOL_SCOPE"
  | "AMBIGUOUS_MEMBERSHIP"
  | "MISSING_REQUIRED_ROLE"
  | "DEFERRED_CONTEXTUAL_GRANT"
  | "ACTOR_IS_NOT_EFFECTIVE_HOLDER"
  | "NO_ACTIVE_DIRECTOR"
  | "AMBIGUOUS_ACTIVE_DIRECTOR"
  | "AMBIGUOUS_DIRECTOR_AVAILABILITY"
  | "INVALID_DIRECTOR_AVAILABILITY"
  | "AMBIGUOUS_ACTING_AUTHORITY"
  | "AMBIGUOUS_TEMPORARY_AUTHORITY"
  | "INVALID_ACTING_AUTHORITY"
  | "INVALID_TEMPORARY_AUTHORITY"
  | "NO_EFFECTIVE_DIRECTOR_AUTHORITY"

export type AuthorizationDecision = Readonly<{
  allowed: boolean
  command: string
  schoolId: string
  reason: AuthorizationDecisionReason
  authorityKind?: EffectiveDirectorAuthorityKind
  authorityRecordId?: string
  roleAssignmentId?: string
  matchedRole?: "FINANCE_OFFICER" | "SCHOOL_ADMIN" | "SCHOOL_DIRECTOR"
}>

type PrincipalContext = Readonly<{
  identityId: string
  membershipId: string
  roles: readonly ("FINANCE_OFFICER" | "SCHOOL_ADMIN" | "SCHOOL_DIRECTOR")[]
}>

type DirectorAssignment = Readonly<{
  id: string
  membership: Readonly<{
    identityId: string
  }>
}>

type DirectorAvailability = Readonly<{
  id: string
  schoolId: string
  directorRoleAssignmentId: string
  status: "UNAVAILABLE" | "RESUMED" | "DIRECTOR_ASSIGNMENT_ENDED"
  unavailableFrom: Date
}>

type InForceAuthority = Readonly<{
  id: string
  schoolId: string
  variant: "ACTING_DIRECTOR" | "ACTING_ESAO" | "TEMPORARY"
  status: "SCHEDULED" | "IN_FORCE"
  subjectRoleAssignmentId: string
  availabilityId: string | null
  actingReasonCode: "MEDICAL_LEAVE" | "OFFICIAL_TRAVEL" | "PERSONAL_LEAVE" | "OTHER" | null
  reasonDetail: string | null
  temporaryBasis: string | null
  commandScope: readonly string[]
  effectiveFrom: Date
  expiresAt: Date | null
  recordVersion: number
  integrityDigest: string
  evidenceContentHash: string | null
  subjectRoleAssignment: Readonly<{
    id: string
    schoolId: string
    role: "FINANCE_OFFICER" | "SCHOOL_ADMIN" | "SCHOOL_DIRECTOR"
    status: "SCHEDULED" | "ACTIVE" | "REVOKED" | "SUPERSEDED" | "INVALIDATED"
    effectiveFrom: Date
    effectiveTo: Date | null
    membership: Readonly<{
      identityId: string
      status: "ACTIVE" | "SUSPENDED" | "REVOKED"
      effectiveFrom: Date
      effectiveTo: Date | null
      identity: Readonly<{
        accountStatus: "PENDING" | "ACTIVE" | "DISABLED"
      }>
    }>
  }>
  availability: DirectorAvailability | null
  lifecycleEvents: readonly Readonly<{
    revision: number
    status:
      | "SCHEDULED"
      | "IN_FORCE"
      | "REVOKED"
      | "EXPIRED"
      | "SUPERSEDED"
      | "INVALIDATED"
      | "ENDED_ON_RETURN"
      | "CONVERTED"
    occurredAt: Date
    integrityDigest: string
  }>[]
}>

type AuthorityValidation =
  | Readonly<{ valid: true; authority: InForceAuthority; kind: "ACTING" | "TEMPORARY" }>
  | Readonly<{ valid: false; reason: "INVALID_ACTING_AUTHORITY" | "INVALID_TEMPORARY_AUTHORITY" }>

const hashPattern = /^[0-9a-f]{64}$/i

const currentRoleCommands: Readonly<
  Partial<Record<AuthorizationCommand, readonly ("FINANCE_OFFICER" | "SCHOOL_ADMIN")[]>>
> = {
  "AUTH-01": ["SCHOOL_ADMIN"],
  "AUTH-10": ["FINANCE_OFFICER"],
  "AUTH-11": ["FINANCE_OFFICER"],
  "AUTH-12": ["FINANCE_OFFICER"],
  "AUTH-13": ["FINANCE_OFFICER"],
  "AUTH-16": ["FINANCE_OFFICER"],
}

function decision(
  command: string,
  schoolId: string,
  reason: AuthorizationDecisionReason,
  details: Omit<AuthorizationDecision, "allowed" | "command" | "schoolId" | "reason"> = {},
): AuthorizationDecision {
  return {
    allowed: reason === "ALLOWED",
    command,
    schoolId,
    reason,
    ...details,
  }
}

function isValidSession(session: AuthorizationSession | null | undefined): session is AuthorizationSession {
  const user = session?.user
  return Boolean(
    user &&
      typeof user.id === "string" &&
      user.id.length > 0 &&
      typeof user.accountIdentifier === "string" &&
      user.accountIdentifier.length > 0 &&
      Number.isSafeInteger(user.authorizationVersion) &&
      user.authorizationVersion > 0 &&
      Number.isSafeInteger(user.authenticatedAt),
  )
}

function isValidNow(value: Date) {
  return Number.isFinite(value.getTime())
}

function isEffective(from: Date, to: Date | null, now: Date) {
  return from <= now && (to === null || to > now)
}

function hasExactSubstituteScope(scope: readonly string[]) {
  return (
    scope.length === SUBSTITUTE_DIRECTOR_COMMANDS.length &&
    new Set(scope).size === SUBSTITUTE_DIRECTOR_COMMANDS.length &&
    SUBSTITUTE_DIRECTOR_COMMANDS.every((command) => scope.includes(command))
  )
}

function isDirectorOnlyCommand(command: string) {
  return (ACTIVE_DIRECTOR_ONLY_COMMANDS as readonly string[]).includes(command)
}

async function loadCurrentPrincipal(
  database: PrismaClient,
  session: AuthorizationSession | null | undefined,
  schoolId: string,
  now: Date,
): Promise<PrincipalContext | AuthorizationDecisionReason> {
  if (!isValidSession(session)) {
    return "NO_ACTIVE_SESSION"
  }

  const identity = await database.authenticatedIdentity.findUnique({
    where: { id: session.user.id },
    select: {
      accountIdentifier: true,
      accountStatus: true,
      authorizationVersion: true,
      memberships: {
        where: {
          organizationId: schoolId,
          status: "ACTIVE",
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
        select: {
          id: true,
          organization: {
            select: {
              type: true,
              status: true,
              school: { select: { directoryIsActive: true } },
            },
          },
          roleAssignments: {
            where: {
              status: "ACTIVE",
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
            },
            select: { role: true },
          },
        },
      },
    },
  })

  if (
    !identity ||
    identity.accountStatus !== "ACTIVE" ||
    identity.authorizationVersion !== session.user.authorizationVersion ||
    identity.accountIdentifier !== session.user.accountIdentifier
  ) {
    return "STALE_SESSION"
  }

  if (identity.memberships.length !== 1) {
    return identity.memberships.length > 1 ? "AMBIGUOUS_MEMBERSHIP" : "INVALID_SCHOOL_SCOPE"
  }

  const membership = identity.memberships[0]
  if (
    membership.organization.type !== "SCHOOL" ||
    membership.organization.status !== "ACTIVE" ||
    !membership.organization.school?.directoryIsActive
  ) {
    return "INVALID_SCHOOL_SCOPE"
  }

  return {
    identityId: session.user.id,
    membershipId: membership.id,
    roles: membership.roleAssignments.map((assignment) => assignment.role),
  }
}

async function loadActiveDirectors(database: PrismaClient, schoolId: string, now: Date) {
  return database.schoolRoleAssignment.findMany({
    where: {
      schoolId,
      role: "SCHOOL_DIRECTOR",
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      membership: {
        status: "ACTIVE",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        identity: { accountStatus: "ACTIVE" },
      },
    },
    select: {
      id: true,
      membership: { select: { identityId: true } },
    },
  }) as Promise<DirectorAssignment[]>
}

async function synchronizeAuthorityStatuses(database: PrismaClient, schoolId: string, now: Date) {
  await withSerializableRetry(() => database.$transaction(async (transaction) => {
    const bootstrap = await transaction.systemAdminBootstrap.findUnique({
      where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
      select: {
        identityId: true,
        membershipId: true,
        identity: { select: { accountStatus: true } },
        membership: { select: { status: true, effectiveFrom: true, effectiveTo: true, organization: { select: { type: true, status: true } } } },
      },
    })
    if (
      !bootstrap ||
      bootstrap.identity.accountStatus !== "ACTIVE" ||
      bootstrap.membership.status !== "ACTIVE" ||
      bootstrap.membership.effectiveFrom > now ||
      bootstrap.membership.effectiveTo !== null && bootstrap.membership.effectiveTo <= now ||
      bootstrap.membership.organization.type !== "PLATFORM" ||
      bootstrap.membership.organization.status !== "ACTIVE"
    ) return
    const due = await transaction.substituteDirectorAuthority.findMany({
      where: {
        schoolId,
        OR: [
          { status: "SCHEDULED", effectiveFrom: { lte: now } },
          { status: "IN_FORCE", expiresAt: { lte: now } },
        ],
      },
      select: { id: true, status: true, expiresAt: true },
    })
    for (const authority of due) {
      const nextStatus = authority.status === "SCHEDULED" && (authority.expiresAt === null || authority.expiresAt > now) ? "IN_FORCE" : "EXPIRED"
      const latestLifecycle = await transaction.substituteDirectorAuthorityLifecycle.findFirst({
        where: { authorityId: authority.id },
        orderBy: { revision: "desc" },
        select: { revision: true },
      })
      const revision = (latestLifecycle?.revision ?? 0) + 1
      await transaction.substituteDirectorAuthority.update({
        where: { id: authority.id },
        data: { status: nextStatus, recordVersion: revision, updatedAt: now },
      })
      const lifecycleId = randomUUID()
      await transaction.substituteDirectorAuthorityLifecycle.create({
        data: {
          id: lifecycleId,
          authorityId: authority.id,
          revision,
          status: nextStatus,
          occurredAt: now,
          actorIdentityId: null,
          reason: nextStatus === "IN_FORCE" ? "SYSTEM_EFFECTIVE:Future effective start reached" : "SYSTEM_EXPIRY:Authority expiry reached",
          integrityDigest: calculateJsonIntegrityDigest({
            version: 1,
            id: lifecycleId,
            authorityId: authority.id,
            revision,
            status: nextStatus,
            actorIdentityId: null,
            reason: nextStatus === "IN_FORCE" ? { code: "SYSTEM_EFFECTIVE", detail: "Future effective start reached" } : { code: "SYSTEM_EXPIRY", detail: "Authority expiry reached" },
            occurredAt: now.toISOString(),
          }),
        },
      })
      await recordAuditEventInTransaction(transaction, {
        actorIdentityId: bootstrap.identityId,
        actorMembershipId: bootstrap.membershipId,
        scope: { kind: "PLATFORM" },
        commandCode: "AUTH-14",
        targetType: "SubstituteDirectorAuthority",
        targetId: authority.id,
        outcome: "SUCCESS",
        reasonCode: nextStatus === "IN_FORCE" ? "SYSTEM_EFFECTIVE" : "SYSTEM_EXPIRY",
        correlationId: authority.id,
        occurredAt: now,
      })
    }
  }, { isolationLevel: "Serializable" }), { operationKey: "P1-16-SYNCHRONIZE-AUTHORITY-STATUS" })
}

async function loadInForceAuthorities(database: PrismaClient, schoolId: string) {
  return database.substituteDirectorAuthority.findMany({
    where: { schoolId, status: "IN_FORCE" },
    select: {
      id: true,
      schoolId: true,
      variant: true,
      status: true,
      subjectRoleAssignmentId: true,
      availabilityId: true,
      actingReasonCode: true,
      reasonDetail: true,
      temporaryBasis: true,
      commandScope: true,
      effectiveFrom: true,
      expiresAt: true,
      recordVersion: true,
      integrityDigest: true,
      evidenceContentHash: true,
      subjectRoleAssignment: {
        select: {
          id: true,
          schoolId: true,
          role: true,
          status: true,
          effectiveFrom: true,
          effectiveTo: true,
          membership: {
            select: {
              identityId: true,
              status: true,
              effectiveFrom: true,
              effectiveTo: true,
              identity: { select: { accountStatus: true } },
            },
          },
        },
      },
      availability: {
        select: {
          id: true,
          schoolId: true,
          directorRoleAssignmentId: true,
          status: true,
          unavailableFrom: true,
        },
      },
      lifecycleEvents: {
        select: {
          revision: true,
          status: true,
          occurredAt: true,
          integrityDigest: true,
        },
      },
    },
  }) as Promise<InForceAuthority[]>
}

function validateAuthority(
  authority: InForceAuthority,
  command: SubstituteDirectorCommand,
  schoolId: string,
  now: Date,
  activeDirector: DirectorAssignment | undefined,
  currentAvailability: DirectorAvailability | undefined,
): AuthorityValidation {
  const kind = authority.variant === "TEMPORARY" ? "TEMPORARY" : "ACTING"
  const invalid = (): AuthorityValidation => ({
    valid: false,
    reason: kind === "ACTING" ? "INVALID_ACTING_AUTHORITY" : "INVALID_TEMPORARY_AUTHORITY",
  })
  const subject = authority.subjectRoleAssignment
  const membership = subject.membership
  const lifecycle = authority.lifecycleEvents.filter((event) => event.occurredAt <= now).sort((left, right) => right.revision - left.revision).slice(0, 1)

  if (
    authority.schoolId !== schoolId ||
    authority.status !== "IN_FORCE" ||
    authority.effectiveFrom > now ||
    authority.expiresAt !== null && authority.expiresAt <= now ||
    !Number.isSafeInteger(authority.recordVersion) ||
    authority.recordVersion < 1 ||
    !hashPattern.test(authority.integrityDigest) ||
    authority.evidenceContentHash !== null && !hashPattern.test(authority.evidenceContentHash) ||
    !hasExactSubstituteScope(authority.commandScope) ||
    !authority.commandScope.includes(command) ||
    lifecycle.length !== 1 ||
    lifecycle[0].status !== "IN_FORCE" ||
    !hashPattern.test(lifecycle[0].integrityDigest) ||
    subject.id !== authority.subjectRoleAssignmentId ||
    subject.schoolId !== schoolId ||
    (subject.role !== "FINANCE_OFFICER" && subject.role !== "SCHOOL_ADMIN") ||
    subject.status !== "ACTIVE" ||
    !isEffective(subject.effectiveFrom, subject.effectiveTo, now) ||
    membership.status !== "ACTIVE" ||
    !isEffective(membership.effectiveFrom, membership.effectiveTo, now) ||
    membership.identity.accountStatus !== "ACTIVE"
  ) {
    return invalid()
  }

  if (kind === "ACTING") {
    if (
      !activeDirector ||
      !currentAvailability ||
      !authority.availability ||
      authority.availabilityId !== currentAvailability.id ||
      authority.availability.schoolId !== schoolId ||
      authority.availability.directorRoleAssignmentId !== activeDirector.id ||
      authority.availability.status !== "UNAVAILABLE" ||
      authority.availability.unavailableFrom > now ||
      authority.actingReasonCode === null ||
      authority.actingReasonCode === "OTHER" && !authority.reasonDetail?.trim()
    ) {
      return invalid()
    }
  } else {
    const temporaryAvailabilityIsValid = activeDirector
      ? Boolean(
          currentAvailability &&
            authority.availability &&
            authority.availabilityId === currentAvailability.id &&
            authority.availability.schoolId === schoolId &&
            authority.availability.directorRoleAssignmentId === activeDirector.id &&
            authority.availability.status === "UNAVAILABLE" &&
            authority.availability.unavailableFrom <= now,
        )
      : authority.availability === null

    if (
      authority.expiresAt === null ||
      !authority.temporaryBasis?.trim() ||
      !temporaryAvailabilityIsValid
    ) {
      return invalid()
    }
  }

  return { valid: true, authority, kind }
}

async function resolveActiveDirectorOnly(
  database: PrismaClient,
  principal: PrincipalContext,
  command: string,
  schoolId: string,
  now: Date,
) {
  const directors = await loadActiveDirectors(database, schoolId, now)
  if (directors.length === 0) {
    return decision(command, schoolId, "NO_ACTIVE_DIRECTOR")
  }
  if (directors.length > 1) {
    return decision(command, schoolId, "AMBIGUOUS_ACTIVE_DIRECTOR")
  }

  const director = directors[0]
  return director.membership.identityId === principal.identityId
    ? decision(command, schoolId, "ALLOWED", {
        authorityKind: "ACTIVE_DIRECTOR",
        roleAssignmentId: director.id,
        matchedRole: "SCHOOL_DIRECTOR",
      })
    : decision(command, schoolId, "ACTOR_IS_NOT_EFFECTIVE_HOLDER")
}

export async function resolveEffectiveDirectorAuthority(
  database: PrismaClient,
  session: AuthorizationSession | null | undefined,
  request: AuthorizationRequest,
): Promise<AuthorizationDecision> {
  const now = request.now ?? new Date()
  if (!isValidNow(now) || !isSubstituteDirectorCommand(request.command) && request.command !== "AUTH-21") {
    return decision(request.command, request.schoolId, "UNLISTED_COMMAND")
  }
  if (!request.schoolId) {
    return decision(request.command, request.schoolId, "INVALID_REQUEST")
  }

  const principal = await loadCurrentPrincipal(database, session, request.schoolId, now)
  if (typeof principal === "string") {
    return decision(request.command, request.schoolId, principal)
  }

  await synchronizeAuthorityStatuses(database, request.schoolId, now)

  if (request.command === "AUTH-21") {
    return resolveActiveDirectorOnly(database, principal, request.command, request.schoolId, now)
  }

  const directors = await loadActiveDirectors(database, request.schoolId, now)
  if (directors.length > 1) {
    return decision(request.command, request.schoolId, "AMBIGUOUS_ACTIVE_DIRECTOR")
  }
  const activeDirector = directors[0]
  const availability = activeDirector
    ? ((await database.activeDirectorAvailability.findMany({
        where: {
          schoolId: request.schoolId,
          directorRoleAssignmentId: activeDirector.id,
          status: "UNAVAILABLE",
        },
        select: {
          id: true,
          schoolId: true,
          directorRoleAssignmentId: true,
          status: true,
          unavailableFrom: true,
        },
      })) as DirectorAvailability[])
    : []
  const currentAvailability = availability.filter((entry) => entry.unavailableFrom <= now)

  // A future availability record belongs to a scheduled authority. It must
  // not deny the active Director before that authority's effective start.
  if (currentAvailability.length > 1) {
    return decision(request.command, request.schoolId, "AMBIGUOUS_DIRECTOR_AVAILABILITY")
  }
  if (activeDirector && currentAvailability.length === 0) {
    return activeDirector.membership.identityId === principal.identityId
      ? decision(request.command, request.schoolId, "ALLOWED", {
          authorityKind: "ACTIVE_DIRECTOR",
          roleAssignmentId: activeDirector.id,
          matchedRole: "SCHOOL_DIRECTOR",
        })
      : decision(request.command, request.schoolId, "ACTOR_IS_NOT_EFFECTIVE_HOLDER")
  }

  const authorities = await loadInForceAuthorities(database, request.schoolId)
  const acting = authorities.filter((authority) => authority.variant !== "TEMPORARY")
  const temporary = authorities.filter((authority) => authority.variant === "TEMPORARY")

  if (acting.length > 1) {
    return decision(request.command, request.schoolId, "AMBIGUOUS_ACTING_AUTHORITY")
  }
  if (acting.length === 1) {
    const validated = validateAuthority(
      acting[0],
      request.command,
      request.schoolId,
      now,
      activeDirector,
      currentAvailability[0],
    )
    if (!validated.valid) {
      return decision(request.command, request.schoolId, validated.reason)
    }
    return validated.authority.subjectRoleAssignment.membership.identityId === principal.identityId
      ? decision(request.command, request.schoolId, "ALLOWED", {
          authorityKind: "ACTING",
          authorityRecordId: validated.authority.id,
          roleAssignmentId: validated.authority.subjectRoleAssignmentId,
        })
      : decision(request.command, request.schoolId, "ACTOR_IS_NOT_EFFECTIVE_HOLDER")
  }

  if (temporary.length > 1) {
    return decision(request.command, request.schoolId, "AMBIGUOUS_TEMPORARY_AUTHORITY")
  }
  if (temporary.length === 1) {
    const validated = validateAuthority(
      temporary[0],
      request.command,
      request.schoolId,
      now,
      activeDirector,
      currentAvailability[0],
    )
    if (!validated.valid) {
      return decision(request.command, request.schoolId, validated.reason)
    }
    return validated.authority.subjectRoleAssignment.membership.identityId === principal.identityId
      ? decision(request.command, request.schoolId, "ALLOWED", {
          authorityKind: "TEMPORARY",
          authorityRecordId: validated.authority.id,
          roleAssignmentId: validated.authority.subjectRoleAssignmentId,
        })
      : decision(request.command, request.schoolId, "ACTOR_IS_NOT_EFFECTIVE_HOLDER")
  }

  return decision(request.command, request.schoolId, "NO_EFFECTIVE_DIRECTOR_AUTHORITY")
}

export async function authorizeSchoolCommand(
  database: PrismaClient,
  session: AuthorizationSession | null | undefined,
  request: AuthorizationRequest,
): Promise<AuthorizationDecision> {
  const now = request.now ?? new Date()
  if (!isValidNow(now) || !request.schoolId) {
    return decision(request.command, request.schoolId, "INVALID_REQUEST")
  }
  if (!isAuthorizationCommand(request.command)) {
    return decision(request.command, request.schoolId, "UNLISTED_COMMAND")
  }

  const intent = request.intent ?? "COMMAND"
  if (intent === "APPROVAL" && isSubstituteDirectorCommand(request.command)) {
    return resolveEffectiveDirectorAuthority(database, session, { ...request, now })
  }
  if (
    (request.command === "AUTH-09" || request.command === "AUTH-18" || request.command === "AUTH-21") &&
    intent === "COMMAND"
  ) {
    return resolveEffectiveDirectorAuthority(database, session, { ...request, now })
  }
  if (intent === "APPROVAL" && request.command === "AUTH-34") {
    const principal = await loadCurrentPrincipal(database, session, request.schoolId, now)
    return typeof principal === "string"
      ? decision(request.command, request.schoolId, principal)
      : resolveActiveDirectorOnly(database, principal, request.command, request.schoolId, now)
  }
  if (intent === "APPROVAL" || isDirectorOnlyCommand(request.command)) {
    return decision(request.command, request.schoolId, "DEFERRED_CONTEXTUAL_GRANT")
  }

  const requiredRoles = currentRoleCommands[request.command]
  if (!requiredRoles) {
    return P0_04_AUTHORIZATION_MATRIX[request.command].implementation === "DENIED"
      ? decision(request.command, request.schoolId, "UNLISTED_COMMAND")
      : decision(request.command, request.schoolId, "DEFERRED_CONTEXTUAL_GRANT")
  }

  const principal = await loadCurrentPrincipal(database, session, request.schoolId, now)
  if (typeof principal === "string") {
    return decision(request.command, request.schoolId, principal)
  }
  const matchedRole = requiredRoles.find((role) => principal.roles.includes(role))
  return matchedRole
    ? decision(request.command, request.schoolId, "ALLOWED", { matchedRole })
    : decision(request.command, request.schoolId, "MISSING_REQUIRED_ROLE")
}
