import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import { bootstrapFirstSystemAdmin } from "../../src/lib/bootstrap/first-system-admin.ts"
import {
  applyEsaoAdminConfiguration,
  PILOT_ESAO_ORGANIZATION_ID,
} from "../../src/lib/authorization/esao-admin.ts"
import {
  approveSchoolAccountRequest,
  submitSchoolAccountRequest,
} from "../../src/lib/onboarding/finance-officer-request.ts"
import {
  assignSchoolDirector,
  assignMembershipSchool,
  approveCredentialRecovery,
  consumeCredentialOperation,
  createSubstituteDirectorAuthority,
  grantSchoolAdmin,
  issueActivationCredential,
  issueRecoveryCredential,
  listDirectorAuthorityState,
  removeMembership,
  revokeSchoolAdmin,
  revokeSchoolDirector,
  suspendMembership,
  transitionSubstituteDirectorAuthority,
} from "../../src/lib/organization/lifecycle.ts"
import { authenticateCredentials } from "../../src/lib/auth/credentials.ts"
import { resolveEffectiveDirectorAuthority } from "../../src/lib/authorization/school-authorization.ts"

const hash = "a".repeat(64)

function actor(identity: { id: string; accountIdentifier: string; authorizationVersion: number }, membership: { id: string; authorizationVersion: number }, now: Date) {
  return {
    identityId: identity.id,
    membershipId: membership.id,
    accountIdentifier: identity.accountIdentifier,
    authorizationVersion: identity.authorizationVersion,
    membershipAuthorizationVersion: membership.authorizationVersion,
    authenticatedAt: now.getTime(),
  }
}

test("P1-16 keeps technical credentials separate from ESAO membership and authority lifecycle", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)
  let now = new Date()

  try {
    let systemAdmin = await client.systemAdminBootstrap.findUnique({ where: { id: "p1-17" }, include: { identity: true, membership: true } })
    if (!systemAdmin) {
      await bootstrapFirstSystemAdmin(client, { accountIdentifier: `p116-system-${suffix}@synthetic.test`, password: "P1-16-System-Password" })
      systemAdmin = await client.systemAdminBootstrap.findUniqueOrThrow({ where: { id: "p1-17" }, include: { identity: true, membership: true } })
    }
    now = new Date()
    const systemActor = actor(systemAdmin.identity, systemAdmin.membership, now)
    const schools = await client.school.findMany({
      where: { directoryIsActive: true, organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" } },
      orderBy: { organizationId: "asc" },
      select: { organizationId: true },
    })
    assert.equal(schools.length, 17)
    const schoolId = schools[0]!.organizationId

    const esaoIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-esao-${suffix}@synthetic.test`,
        displayName: "P1-16 ESAO Admin",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: { create: { organizationId: PILOT_ESAO_ORGANIZATION_ID, effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    const esaoApproval = {
      externalApprovalRecordId: `PO-P1-16-${suffix}`,
      approvalAuthorityLabel: "Private Business / Product Owner" as const,
      approvalAuthorityIdentity: "synthetic-product-owner@synthetic.test",
      approvalEvidenceReference: `synthetic://p1-16/${suffix}/esao`,
      approvalEvidenceHash: hash,
    }
    const esaoConfiguration = await applyEsaoAdminConfiguration(client, {
      actor: systemActor,
      evidence: esaoApproval,
      subject: {
        subjectIdentityId: esaoIdentity.id,
        subjectAccountIdentifier: esaoIdentity.accountIdentifier,
        subjectPersonName: esaoIdentity.displayName,
        subjectRoleCode: "ESAO_ADMIN",
        subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
        schoolIds: schools.map((school) => school.organizationId),
      },
    }, now)
    now = new Date()
    const esaoMembership = esaoIdentity.memberships[0]!
    const esaoActor = actor(esaoIdentity, esaoMembership, now)

    const requesterIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-requester-${suffix}@synthetic.test`,
        displayName: "P1-16 School Admin",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: { create: { organizationId: schoolId, effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    const requesterMembership = requesterIdentity.memberships[0]!
    await client.schoolRoleAssignment.create({
      data: { membershipId: requesterMembership.id, schoolId, role: "SCHOOL_ADMIN", status: "ACTIVE", effectiveFrom: now, grantReason: "P1-16 fixture" },
    })
    const request = await submitSchoolAccountRequest(client, {
      actor: actor(requesterIdentity, requesterMembership, now),
      schoolId,
      target: { accountIdentifier: `p116-finance-${suffix}@synthetic.test`, displayName: "P1-16 Finance Officer" },
      reason: { code: "P1_16_FIXTURE", detail: "Synthetic P1-16 request" },
    }, now)
    const approved = await approveSchoolAccountRequest(client, {
      actor: esaoActor,
      requestId: request.requestId,
      reason: { code: "P1_16_APPROVE", detail: "Exact synthetic request approved" },
      verification: { outcome: "VERIFIED", reference: `synthetic://p1-16/${suffix}/request` },
    }, now)
    const activation = await issueActivationCredential(client, { actor: systemActor, requestId: approved.requestId, reason: { code: "P1_16_ACTIVATION", detail: "Exact approved request" } }, now)
    await assert.rejects(() => issueActivationCredential(client, { actor: systemActor, requestId: approved.requestId, reason: { code: "P1_16_REPLAY", detail: "Replay is denied" } }, now))
    await consumeCredentialOperation(client, { accountIdentifier: `p116-finance-${suffix}@synthetic.test`, token: activation.token, password: "P1-16-Finance-Password" }, now)
    await assert.rejects(() => consumeCredentialOperation(client, { accountIdentifier: `p116-finance-${suffix}@synthetic.test`, token: activation.token, password: "P1-16-Finance-Password" }, now))
    assert.ok(await client.auditLog.findFirst({ where: { targetId: activation.operationId, outcome: "DENIED", reasonCode: "CREDENTIAL_CONSUMPTION_DENIED" } }))
    const finance = await client.authenticatedIdentity.findUniqueOrThrow({ where: { accountIdentifier: `p116-finance-${suffix}@synthetic.test` }, include: { memberships: { include: { roleAssignments: true } } } })
    assert.equal((await authenticateCredentials(client, { accountIdentifier: finance.accountIdentifier, password: "P1-16-Finance-Password" }, now))?.id, finance.id)
    const financeMembership = finance.memberships[0]!
    const financeRole = financeMembership.roleAssignments.find((role) => role.role === "FINANCE_OFFICER")!

    const grant = await grantSchoolAdmin(client, { actor: esaoActor, schoolId, targetIdentityId: finance.id, reason: { code: "P1_16_GRANT", detail: "Additive School Admin role" } }, now)
    await revokeSchoolAdmin(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetIdentityId: finance.id, reason: { code: "P1_16_REVOKE", detail: "Remove additive School Admin role" } }, now)
    assert.equal((await client.schoolRoleAssignment.findUniqueOrThrow({ where: { id: grant.id } })).status, "REVOKED")

    const director = await assignSchoolDirector(client, { actor: esaoActor, schoolId, targetIdentityId: finance.id, reason: { code: "P1_16_DIRECTOR", detail: "Assign application authorization state" }, appointmentEvidence: { reference: `synthetic://p1-16/${suffix}/director`, contentHash: hash } }, now)
    const currentDirectorIdentity = await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: finance.id }, include: { memberships: true } })
    const currentDirectorMembership = currentDirectorIdentity.memberships.find((membership) => membership.organizationId === schoolId)!
    const actingSubject = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-acting-${suffix}@synthetic.test`,
        displayName: "P1-16 Acting Subject",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: { create: { organizationId: schoolId, effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    const actingMembership = actingSubject.memberships[0]!
    const actingRole = await client.schoolRoleAssignment.create({
      data: { membershipId: actingMembership.id, schoolId, role: "FINANCE_OFFICER", status: "ACTIVE", effectiveFrom: now, grantReason: "P1-16 acting fixture" },
    })
    const directorState = await listDirectorAuthorityState(client, { actor: actor(currentDirectorIdentity, currentDirectorMembership, now), schoolId }, now)
    assert.equal(directorState.school.id, schoolId)
    assert.ok(directorState.subjects.some((subject) => subject.roleAssignmentId === actingRole.id && subject.role === "FINANCE_OFFICER"))
    assert.equal(directorState.subjects.some((subject) => subject.roleAssignmentId === director.id), false)
    const directorActing = await createSubstituteDirectorAuthority(client, {
      actor: actor(currentDirectorIdentity, currentDirectorMembership, now),
      schoolId,
      targetRoleAssignmentId: actingRole.id,
      variant: "ACTING_DIRECTOR",
      reason: { code: "MEDICAL_LEAVE", detail: "Active Director self-service appointment" },
      effectiveFrom: now,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    }, now)
    const directorActingState = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: directorActing.id } })
    assert.equal(directorActingState.variant, "ACTING_DIRECTOR")
    assert.equal(directorActingState.status, "IN_FORCE")
    const resumedAt = now
    await transitionSubstituteDirectorAuthority(client, {
      actor: actor(currentDirectorIdentity, currentDirectorMembership, now),
      authorityId: directorActing.id,
      reason: { code: "RETURN", detail: "Active Director resumes duties" },
    }, resumedAt)
    const resumedDirectorActingState = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: directorActing.id } })
    assert.equal(resumedDirectorActingState.status, "ENDED_ON_RETURN")
    const resumedDirectorAvailability = await client.activeDirectorAvailability.findFirst({ where: { id: directorActingState.availabilityId! } })
    assert.equal(resumedDirectorAvailability?.status, "RESUMED")
    assert.ok(resumedDirectorAvailability?.resumedAt && resumedDirectorAvailability.resumedAt > resumedDirectorAvailability.unavailableFrom)
    await assert.rejects(
      () => createSubstituteDirectorAuthority(client, {
        actor: actor(currentDirectorIdentity, currentDirectorMembership, now),
        schoolId: schools[1]!.organizationId,
        targetRoleAssignmentId: actingRole.id,
        variant: "ACTING_DIRECTOR",
        reason: { code: "MEDICAL_LEAVE", detail: "Cross-School self-service must be denied" },
        effectiveFrom: now,
        expiresAt: null,
      }, now),
      /current active Director membership/,
    )
    await assert.rejects(
      () => createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: financeRole.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "The active Director cannot be the Acting subject" }, effectiveFrom: now, expiresAt: null }, now),
      /must differ from the active School Director/,
    )
    const currentDirector = await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: finance.id }, select: { authorizationVersion: true, accountIdentifier: true } })
    const futureCancellationStart = new Date(now.getTime() + 5 * 60 * 1000)
    const futureCancellation = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: actingRole.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Scheduled authority cancelled before start" }, effectiveFrom: futureCancellationStart, expiresAt: null }, now)
    const futureCancellationState = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: futureCancellation.id } })
    const cancellationAt = new Date(now.getTime() + 60 * 1000)
    await transitionSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: cancellationAt.getTime() }, authorityId: futureCancellation.id, reason: { code: "REVOKE", detail: "Cancel future authority before it becomes effective" } }, cancellationAt)
    const cancelledFuture = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: futureCancellation.id } })
    assert.equal(cancelledFuture.status, "REVOKED")
    assert.equal(cancelledFuture.recordVersion, 2)
    const resumedFutureAvailability = await client.activeDirectorAvailability.findUniqueOrThrow({ where: { id: futureCancellationState.availabilityId! } })
    assert.equal(resumedFutureAvailability.status, "RESUMED")
    assert.ok(resumedFutureAvailability.resumedAt && resumedFutureAvailability.resumedAt > resumedFutureAvailability.unavailableFrom)
    const afterCancelledStart = await resolveEffectiveDirectorAuthority(client, { user: { id: finance.id, accountIdentifier: currentDirector.accountIdentifier, authorizationVersion: currentDirector.authorizationVersion, authenticatedAt: futureCancellationStart.getTime() } }, { command: "AUTH-09", schoolId, now: futureCancellationStart })
    assert.equal(afterCancelledStart.allowed, true)
    assert.equal(afterCancelledStart.authorityKind, "ACTIVE_DIRECTOR")

    const requesterRole = await client.schoolRoleAssignment.findFirst({ where: { membershipId: requesterMembership.id, role: "SCHOOL_ADMIN", status: "ACTIVE" } })
    assert.ok(requesterRole)
    const futureInvalidationStart = new Date(now.getTime() + 7 * 60 * 1000)
    const futureInvalidation = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: requesterRole.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Scheduled authority invalidated before start" }, effectiveFrom: futureInvalidationStart, expiresAt: null }, now)
    const futureInvalidationState = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: futureInvalidation.id } })
    await suspendMembership(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, membershipId: requesterMembership.id, reason: { code: "P1_16_SCHEDULED_SUBJECT_SUSPEND", detail: "Invalidate future authority before its start" } }, now)
    const invalidatedFuture = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: futureInvalidation.id } })
    assert.equal(invalidatedFuture.status, "INVALIDATED")
    const resumedInvalidationAvailability = await client.activeDirectorAvailability.findUniqueOrThrow({ where: { id: futureInvalidationState.availabilityId! } })
    assert.equal(resumedInvalidationAvailability.status, "RESUMED")
    assert.ok(resumedInvalidationAvailability.resumedAt && resumedInvalidationAvailability.resumedAt > resumedInvalidationAvailability.unavailableFrom)

    const predecessorStart = new Date(now.getTime() + 10 * 60 * 1000)
    const predecessorExpiry = new Date(predecessorStart.getTime() + 60 * 1000)
    const predecessor = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: actingRole.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Scheduled authority superseded before start" }, effectiveFrom: predecessorStart, expiresAt: predecessorExpiry }, now)
    const predecessorState = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: predecessor.id } })
    const scheduledStart = new Date(now.getTime() + 12 * 60 * 1000)
    const scheduledExpiry = new Date(scheduledStart.getTime() + 60 * 1000)
    const scheduled = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: actingRole.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Scheduled synthetic acting reason" }, effectiveFrom: scheduledStart, expiresAt: scheduledExpiry, supersedesAuthorityId: predecessor.id }, now)
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: predecessor.id } })).status, "SUPERSEDED")
    const resumedSupersededAvailability = await client.activeDirectorAvailability.findUniqueOrThrow({ where: { id: predecessorState.availabilityId! } })
    assert.equal(resumedSupersededAvailability.status, "RESUMED")
    assert.ok(resumedSupersededAvailability.resumedAt && resumedSupersededAvailability.resumedAt > resumedSupersededAvailability.unavailableFrom)
    await assert.rejects(
      () => client.substituteDirectorAuthority.update({ where: { id: scheduled.id }, data: { status: "REVOKED" } }),
      /must advance recordVersion with a status change/,
    )
    await assert.rejects(
      () => client.substituteDirectorAuthority.update({ where: { id: scheduled.id }, data: { recordVersion: 2 } }),
      /must advance recordVersion with a status change/,
    )
    const beforeStart = await resolveEffectiveDirectorAuthority(client, { user: { id: finance.id, accountIdentifier: currentDirector.accountIdentifier, authorizationVersion: currentDirector.authorizationVersion, authenticatedAt: now.getTime() } }, { command: "AUTH-09", schoolId, now })
    assert.equal(beforeStart.authorityKind, "ACTIVE_DIRECTOR")
    const actingPrincipal = await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: actingSubject.id }, select: { authorizationVersion: true, accountIdentifier: true } })
    const afterStart = await resolveEffectiveDirectorAuthority(client, { user: { id: actingSubject.id, accountIdentifier: actingPrincipal.accountIdentifier, authorizationVersion: actingPrincipal.authorizationVersion, authenticatedAt: scheduledStart.getTime() } }, { command: "AUTH-09", schoolId, now: scheduledStart })
    assert.equal(afterStart.authorityKind, "ACTING")
    const effectiveScheduled = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: scheduled.id } })
    assert.equal(effectiveScheduled.status, "IN_FORCE")
    assert.equal(effectiveScheduled.recordVersion, 2)
    assert.ok(await client.auditLog.findFirst({ where: { targetId: scheduled.id, commandCode: "AUTH-14", reasonCode: "SYSTEM_EFFECTIVE", outcome: "SUCCESS" } }))
    await resolveEffectiveDirectorAuthority(client, { user: { id: finance.id, accountIdentifier: currentDirector.accountIdentifier, authorizationVersion: currentDirector.authorizationVersion, authenticatedAt: scheduledExpiry.getTime() } }, { command: "AUTH-09", schoolId, now: scheduledExpiry })
    const expiredScheduled = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: scheduled.id } })
    assert.equal(expiredScheduled.status, "EXPIRED")
    assert.equal(expiredScheduled.recordVersion, 3)
    assert.ok(await client.auditLog.findFirst({ where: { targetId: scheduled.id, commandCode: "AUTH-14", reasonCode: "SYSTEM_EXPIRY", outcome: "SUCCESS" } }))
    assert.equal((await client.activeDirectorAvailability.findUniqueOrThrow({ where: { id: expiredScheduled.availabilityId! } })).status, "UNAVAILABLE")
    await assert.rejects(() => createSubstituteDirectorAuthority(client, { actor: { ...actor(finance, financeMembership, now), authenticatedAt: scheduledStart.getTime() }, schoolId, targetRoleAssignmentId: actingRole.id, variant: "ACTING_DIRECTOR", reason: { code: "MEDICAL_LEAVE", detail: "Stale Director session" }, effectiveFrom: scheduledStart, expiresAt: null }, scheduledStart))
    const acting = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: actingRole.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Synthetic acting reason" }, effectiveFrom: now, expiresAt: null }, now)
    await transitionSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, authorityId: acting.id, reason: { code: "REVOKE", detail: "Synthetic authority end" } }, now)
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: acting.id } })).recordVersion, 2)
    await revokeSchoolDirector(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, roleAssignmentId: director.id, reason: { code: "P1_16_DIRECTOR_REVOKE", detail: "Leave no active Director" }, evidence: { reference: `synthetic://p1-16/${suffix}/director-revoke`, contentHash: hash } }, now)
    const temporary = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: actingRole.id, variant: "TEMPORARY", reason: { code: "TEMPORARY_UNAVAILABILITY", detail: "Synthetic temporary basis" }, temporaryBasis: "No active Director remains", effectiveFrom: now, expiresAt: new Date(now.getTime() + 60 * 60 * 1000) }, now)
    await assert.rejects(() => transitionSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, authorityId: temporary.id, reason: { code: "EXPIRE", detail: "Cannot expire before configured expiry" } }, now), /before its configured expiry/)
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: temporary.id } })).status, "IN_FORCE")
    await transitionSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, authorityId: temporary.id, reason: { code: "REVOKE", detail: "Synthetic temporary authority end" } }, now)

    const invalidatedTemporary = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId, targetRoleAssignmentId: actingRole.id, variant: "TEMPORARY", reason: { code: "TEMPORARY_UNAVAILABILITY", detail: "Synthetic eligibility-loss basis" }, temporaryBasis: "The eligible subject will be suspended", effectiveFrom: now, expiresAt: new Date(now.getTime() + 60 * 60 * 1000) }, now)
    await suspendMembership(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, membershipId: actingMembership.id, reason: { code: "P1_16_SUBJECT_SUSPEND", detail: "Invalidate active substitute on subject suspension" } }, now)
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: invalidatedTemporary.id } })).status, "INVALIDATED")

    const createDirectorAuthorityFixture = async (targetSchoolId: string, label: string) => {
      const directorIdentity = await client.authenticatedIdentity.create({
        data: {
          accountIdentifier: `p116-${label}-director-${suffix}@synthetic.test`,
          displayName: `P1-16 ${label} Director`,
          accountStatus: "ACTIVE",
          passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
          passwordChangedAt: now,
          memberships: { create: { organizationId: targetSchoolId, effectiveFrom: now } },
        },
        include: { memberships: true },
      })
      const directorMembership = directorIdentity.memberships[0]!
      const directorAssignment = await assignSchoolDirector(client, {
        actor: { ...esaoActor, authenticatedAt: now.getTime() },
        schoolId: targetSchoolId,
        targetIdentityId: directorIdentity.id,
        reason: { code: `P1_16_${label.toUpperCase()}_DIRECTOR`, detail: `${label} active Director fixture` },
        appointmentEvidence: { reference: `synthetic://p1-16/${suffix}/${label}/director`, contentHash: hash },
      }, now)
      const subjectIdentity = await client.authenticatedIdentity.create({
        data: {
          accountIdentifier: `p116-${label}-subject-${suffix}@synthetic.test`,
          displayName: `P1-16 ${label} Substitute Subject`,
          accountStatus: "ACTIVE",
          passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
          passwordChangedAt: now,
          memberships: { create: { organizationId: targetSchoolId, effectiveFrom: now } },
        },
        include: { memberships: true },
      })
      const subjectRole = await client.schoolRoleAssignment.create({
        data: { membershipId: subjectIdentity.memberships[0]!.id, schoolId: targetSchoolId, role: "FINANCE_OFFICER", status: "ACTIVE", effectiveFrom: now, grantReason: `P1-16 ${label} authority fixture` },
      })
      const authority = await createSubstituteDirectorAuthority(client, {
        actor: { ...esaoActor, authenticatedAt: now.getTime() },
        schoolId: targetSchoolId,
        targetRoleAssignmentId: subjectRole.id,
        variant: "ACTING_ESAO",
        reason: { code: "MEDICAL_LEAVE", detail: `${label} active Director membership terminal-path fixture` },
        effectiveFrom: now,
        expiresAt: null,
      }, now)
      const authorityState = await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: authority.id }, select: { availabilityId: true } })
      return { directorMembershipId: directorMembership.id, directorRoleId: directorAssignment.id, subjectRoleId: subjectRole.id, authorityId: authority.id, availabilityId: authorityState.availabilityId! }
    }

    const suspendedDirector = await createDirectorAuthorityFixture(schools[1]!.organizationId, "suspended")
    await suspendMembership(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, membershipId: suspendedDirector.directorMembershipId, reason: { code: "P1_16_DIRECTOR_SUSPEND", detail: "Terminate active Director authority with membership suspension" } }, now)
    assert.equal((await client.schoolRoleAssignment.findUniqueOrThrow({ where: { id: suspendedDirector.directorRoleId } })).status, "INVALIDATED")
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: suspendedDirector.authorityId } })).status, "INVALIDATED")
    assert.equal((await client.activeDirectorAvailability.findUniqueOrThrow({ where: { id: suspendedDirector.availabilityId } })).status, "DIRECTOR_ASSIGNMENT_ENDED")
    const suspendedDirectorTemporary = await createSubstituteDirectorAuthority(client, {
      actor: { ...esaoActor, authenticatedAt: now.getTime() },
      schoolId: schools[1]!.organizationId,
      targetRoleAssignmentId: suspendedDirector.subjectRoleId,
      variant: "TEMPORARY",
      reason: { code: "TEMPORARY_UNAVAILABILITY", detail: "Recover after active Director membership suspension" },
      temporaryBasis: "Active Director membership was suspended and Acting authority was invalidated",
      effectiveFrom: now,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    }, now)
    await transitionSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, authorityId: suspendedDirectorTemporary.id, reason: { code: "REVOKE", detail: "End suspension recovery fixture" } }, now)

    const removedDirector = await createDirectorAuthorityFixture(schools[2]!.organizationId, "removed")
    await removeMembership(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, membershipId: removedDirector.directorMembershipId, reason: { code: "P1_16_DIRECTOR_REMOVE", detail: "Terminate active Director authority with membership removal" } }, now)
    assert.equal((await client.schoolRoleAssignment.findUniqueOrThrow({ where: { id: removedDirector.directorRoleId } })).status, "REVOKED")
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: removedDirector.authorityId } })).status, "INVALIDATED")
    assert.equal((await client.activeDirectorAvailability.findUniqueOrThrow({ where: { id: removedDirector.availabilityId } })).status, "DIRECTOR_ASSIGNMENT_ENDED")

    const sharedSubject = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-shared-subject-${suffix}@synthetic.test`,
        displayName: "P1-16 Shared-School Subject",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: {
          create: [
            { organizationId: schools[3]!.organizationId, effectiveFrom: now },
            { organizationId: schools[4]!.organizationId, effectiveFrom: now },
          ],
        },
      },
      include: { memberships: true },
    })
    const sharedMembership3 = sharedSubject.memberships.find((membership) => membership.organizationId === schools[3]!.organizationId)!
    const sharedMembership4 = sharedSubject.memberships.find((membership) => membership.organizationId === schools[4]!.organizationId)!
    const sharedRole3 = await client.schoolRoleAssignment.create({ data: { membershipId: sharedMembership3.id, schoolId: schools[3]!.organizationId, role: "FINANCE_OFFICER", status: "ACTIVE", effectiveFrom: now, grantReason: "P1-16 shared-school fixture" } })
    const sharedRole4 = await client.schoolRoleAssignment.create({ data: { membershipId: sharedMembership4.id, schoolId: schools[4]!.organizationId, role: "FINANCE_OFFICER", status: "ACTIVE", effectiveFrom: now, grantReason: "P1-16 shared-school fixture" } })
    const sharedDirector3 = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-shared-director-3-${suffix}@synthetic.test`,
        displayName: "P1-16 Shared School 3 Director",
        accountStatus: "ACTIVE",
          passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: { create: { organizationId: schools[3]!.organizationId, effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    const sharedDirector4 = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-shared-director-4-${suffix}@synthetic.test`,
        displayName: "P1-16 Shared School 4 Director",
        accountStatus: "ACTIVE",
          passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: { create: { organizationId: schools[4]!.organizationId, effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    await assignSchoolDirector(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[3]!.organizationId, targetIdentityId: sharedDirector3.id, reason: { code: "P1_16_SHARED_DIRECTOR_3", detail: "Create shared-school isolation fixture" }, appointmentEvidence: { reference: `synthetic://p1-16/${suffix}/shared-3`, contentHash: hash } }, now)
    await assignSchoolDirector(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[4]!.organizationId, targetIdentityId: sharedDirector4.id, reason: { code: "P1_16_SHARED_DIRECTOR_4", detail: "Create shared-school isolation fixture" }, appointmentEvidence: { reference: `synthetic://p1-16/${suffix}/shared-4`, contentHash: hash } }, now)
    const sharedAuthority3 = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[3]!.organizationId, targetRoleAssignmentId: sharedRole3.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Shared-school authority isolation fixture" }, effectiveFrom: now, expiresAt: null }, now)
    const sharedAuthority4 = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[4]!.organizationId, targetRoleAssignmentId: sharedRole4.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Shared-school authority isolation fixture" }, effectiveFrom: now, expiresAt: null }, now)

    const transferSubject = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-transfer-subject-${suffix}@synthetic.test`,
        displayName: "P1-16 Transfer Subject",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: {
          create: [
            { organizationId: schools[5]!.organizationId, effectiveFrom: now },
            { organizationId: schools[7]!.organizationId, effectiveFrom: now },
          ],
        },
      },
      include: { memberships: true },
    })
    const transferMembership3 = transferSubject.memberships.find((membership) => membership.organizationId === schools[5]!.organizationId)!
    const transferMembership4 = transferSubject.memberships.find((membership) => membership.organizationId === schools[7]!.organizationId)!
    const transferRole3 = await client.schoolRoleAssignment.create({ data: { membershipId: transferMembership3.id, schoolId: schools[5]!.organizationId, role: "FINANCE_OFFICER", status: "ACTIVE", effectiveFrom: now, grantReason: "P1-16 membership-transfer fixture" } })
    const transferRole4 = await client.schoolRoleAssignment.create({ data: { membershipId: transferMembership4.id, schoolId: schools[7]!.organizationId, role: "FINANCE_OFFICER", status: "ACTIVE", effectiveFrom: now, grantReason: "P1-16 membership-transfer fixture" } })
    const transferDirector = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-transfer-director-${suffix}@synthetic.test`,
        displayName: "P1-16 Transfer School Director",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: { create: { organizationId: schools[5]!.organizationId, effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    await assignSchoolDirector(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[5]!.organizationId, targetIdentityId: transferDirector.id, reason: { code: "P1_16_TRANSFER_DIRECTOR", detail: "Transfer authority fixture Director" }, appointmentEvidence: { reference: `synthetic://p1-16/${suffix}/transfer-director`, contentHash: hash } }, now)
    const unaffectedDirector = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p116-unaffected-director-${suffix}@synthetic.test`,
        displayName: "P1-16 Unaffected School Director",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: { create: { organizationId: schools[7]!.organizationId, effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    await assignSchoolDirector(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[7]!.organizationId, targetIdentityId: unaffectedDirector.id, reason: { code: "P1_16_UNAFFECTED_DIRECTOR", detail: "Unaffected authority fixture Director" }, appointmentEvidence: { reference: `synthetic://p1-16/${suffix}/unaffected-director`, contentHash: hash } }, now)
    const transferAuthority3 = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[5]!.organizationId, targetRoleAssignmentId: transferRole3.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Transfer source authority isolation fixture" }, effectiveFrom: now, expiresAt: null }, now)
    const transferAuthority4 = await createSubstituteDirectorAuthority(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, schoolId: schools[7]!.organizationId, targetRoleAssignmentId: transferRole4.id, variant: "ACTING_ESAO", reason: { code: "MEDICAL_LEAVE", detail: "Transfer unaffected authority isolation fixture" }, effectiveFrom: now, expiresAt: null }, now)
    const transferredMembership = await assignMembershipSchool(client, {
      actor: { ...esaoActor, authenticatedAt: now.getTime() },
      identityId: transferSubject.id,
      fromMembershipId: transferMembership3.id,
      toSchoolId: schools[6]!.organizationId,
      reason: { code: "P1_16_ASSIGN_SCHOOL", detail: "Transfer one School membership without invalidating another" },
      evidence: { reference: `synthetic://p1-16/${suffix}/membership-transfer`, contentHash: hash },
    }, now)
    assert.equal((await client.approvedMembership.findUniqueOrThrow({ where: { id: transferMembership3.id } })).status, "REVOKED")
    assert.equal((await client.schoolRoleAssignment.findUniqueOrThrow({ where: { id: transferRole3.id } })).status, "SUPERSEDED")
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: transferAuthority3.id } })).status, "INVALIDATED")
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: transferAuthority4.id } })).status, "IN_FORCE")
    const transferredState = await client.approvedMembership.findUniqueOrThrow({ where: { id: transferredMembership.id }, include: { roleAssignments: true } })
    assert.equal(transferredState.organizationId, schools[6]!.organizationId)
    assert.equal(transferredState.status, "ACTIVE")
    assert.deepEqual(transferredState.roleAssignments.map((role) => ({ schoolId: role.schoolId, role: role.role, status: role.status })), [{ schoolId: schools[6]!.organizationId, role: "FINANCE_OFFICER", status: "ACTIVE" }])

    await suspendMembership(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, membershipId: sharedMembership3.id, reason: { code: "P1_16_SHARED_SCHOOL_SUSPEND", detail: "Invalidate only the affected School authority" } }, now)
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: sharedAuthority3.id } })).status, "INVALIDATED")
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: sharedAuthority4.id } })).status, "IN_FORCE")

    const recovery = await approveCredentialRecovery(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, targetIdentityId: finance.id, reason: { code: "P1_16_RECOVERY", detail: "ESAO-verified recovery" }, approvalReference: `synthetic://p1-16/${suffix}/recovery` }, now)
    const recoveryCredential = await issueRecoveryCredential(client, { actor: systemActor, approvalId: recovery.id, reason: { code: "P1_16_RECOVERY_ISSUE", detail: "Exact ESAO recovery approval" } }, now)
    await consumeCredentialOperation(client, { accountIdentifier: finance.accountIdentifier, token: recoveryCredential.token, password: "P1-16-Recovered-Password" }, now)
    const expiredToken = `${randomUUID()}${randomUUID()}`
    const expiredOperation = await client.credentialOperation.create({
      data: {
        identityId: finance.id,
        operationType: "RECOVERY",
        status: "ISSUED",
        tokenHash: createHash("sha256").update(expiredToken, "utf8").digest("hex"),
        issuedByIdentityId: systemAdmin.identity.id,
        recoveryApprovalId: recovery.id,
        createdAt: new Date(now.getTime() - 2_000),
        expiresAt: new Date(now.getTime() - 1_000),
      },
    })
    await assert.rejects(() => consumeCredentialOperation(client, { accountIdentifier: finance.accountIdentifier, token: expiredToken, password: "P1-16-Expired-Password" }, now))
    assert.equal((await client.credentialOperation.findUniqueOrThrow({ where: { id: expiredOperation.id } })).status, "EXPIRED")
    assert.ok(await client.auditLog.findFirst({ where: { targetId: expiredOperation.id, outcome: "DENIED", reasonCode: "CREDENTIAL_EXPIRED" } }))

    await suspendMembership(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, membershipId: financeMembership.id, reason: { code: "P1_16_SUSPEND", detail: "Suspend synthetic membership" } }, now)
    await assert.rejects(() => removeMembership(client, { actor: { ...esaoActor, authenticatedAt: now.getTime() }, membershipId: financeMembership.id, reason: { code: "P1_16_REMOVE", detail: "Remove suspended membership" } }, now))
    const denied = await client.auditLog.findFirst({ where: { targetId: financeMembership.id, outcome: "DENIED" }, orderBy: { sequence: "desc" } })
    assert.ok(denied)
    assert.equal((await client.esaoAdminConfiguration.findUniqueOrThrow({ where: { id: esaoConfiguration.configurationId } })).status, "ACTIVE")
  } finally {
    await client.$disconnect()
  }
})
