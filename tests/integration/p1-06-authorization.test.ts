import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  authorizeSchoolCommand,
  resolveEffectiveDirectorAuthority,
  type AuthorizationSession,
} from "../../src/lib/authorization/school-authorization.ts"
import { bootstrapFirstSystemAdmin } from "../../src/lib/bootstrap/first-system-admin.ts"

const now = new Date("2026-10-20T08:00:00.000Z")
const effectiveFrom = new Date("2026-10-01T00:00:00.000Z")
const effectiveTo = new Date("2027-10-01T00:00:00.000Z")
const digest = "a".repeat(64)

type DatabaseClient = ReturnType<typeof createDatabaseClient>["client"]
type SchoolRole = "FINANCE_OFFICER" | "SCHOOL_ADMIN" | "SCHOOL_DIRECTOR"

function sessionFor(identity: {
  id: string
  accountIdentifier: string
  authorizationVersion: number
}): AuthorizationSession {
  return {
    user: {
      id: identity.id,
      accountIdentifier: identity.accountIdentifier,
      authorizationVersion: identity.authorizationVersion,
      authenticatedAt: now.getTime(),
    },
  }
}

async function createSchool(client: DatabaseClient, suffix: string) {
  const esao = await client.organization.create({
    data: { type: "ESAO", nameTh: `P1-06 ESAO ${suffix}` },
  })
  const organization = await client.organization.create({
    data: {
      type: "SCHOOL",
      nameTh: `P1-06 School ${suffix}`,
      parentOrganizationId: esao.id,
    },
  })

  return client.school.create({
    data: {
      organizationId: organization.id,
      smisCode: `P106-SMIS-${suffix}`,
      moeCode: `P106-MOE-${suffix}`,
    },
  })
}

async function createIdentity(client: DatabaseClient, suffix: string) {
  return client.authenticatedIdentity.create({
    data: {
      accountIdentifier: `p106-${suffix}@synthetic.test`,
      displayName: `P1-06 ${suffix}`,
      accountStatus: "ACTIVE",
    },
  })
}

async function addRole(
  client: DatabaseClient,
  identityId: string,
  schoolId: string,
  role: SchoolRole,
  suffix: string,
) {
  const membership = await client.approvedMembership.create({
    data: {
      identityId,
      organizationId: schoolId,
      effectiveFrom,
      effectiveTo,
    },
  })
  const assignment = await client.schoolRoleAssignment.create({
    data: {
      membershipId: membership.id,
      schoolId,
      role,
      effectiveFrom,
      effectiveTo,
      grantReason: `P1-06 synthetic ${suffix}`,
    },
  })

  return { assignment, membership }
}

async function createAuthority(
  client: DatabaseClient,
  input: {
    schoolId: string
    variant: "ACTING_DIRECTOR" | "TEMPORARY"
    appointingIdentityId: string
    subjectRoleAssignmentId: string
    availabilityId?: string
    expiresAt?: Date
    temporaryBasis?: string
    actingReasonCode?: "MEDICAL_LEAVE" | "OFFICIAL_TRAVEL" | "PERSONAL_LEAVE" | "OTHER"
  },
) {
  const authority = await client.substituteDirectorAuthority.create({
    data: {
      schoolId: input.schoolId,
      variant: input.variant,
      status: "IN_FORCE",
      appointingIdentityId: input.appointingIdentityId,
      subjectRoleAssignmentId: input.subjectRoleAssignmentId,
      availabilityId: input.availabilityId,
      actingReasonCode: input.actingReasonCode,
      temporaryBasis: input.temporaryBasis,
      commandScope: ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"],
      effectiveFrom,
      expiresAt: input.expiresAt,
      integrityDigest: digest,
      evidenceContentHash: digest,
    },
  })
  await client.substituteDirectorAuthorityLifecycle.create({
    data: {
      authorityId: authority.id,
      revision: authority.recordVersion,
      status: "IN_FORCE",
      occurredAt: effectiveFrom,
      actorIdentityId: input.appointingIdentityId,
      reason: "P1-06 synthetic authority lifecycle",
      integrityDigest: digest,
    },
  })

  return authority
}

test("P1-06 authorizes current School roles and rejects stale or cross-School sessions", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)

  try {
    const firstSchool = await createSchool(client, `${suffix}a`)
    const secondSchool = await createSchool(client, `${suffix}b`)
    const director = await createIdentity(client, `${suffix}-director`)
    const financeOfficer = await createIdentity(client, `${suffix}-finance`)
    const schoolAdmin = await createIdentity(client, `${suffix}-admin`)
    const directorRole = await addRole(
      client,
      director.id,
      firstSchool.organizationId,
      "SCHOOL_DIRECTOR",
      `${suffix}-director`,
    )
    await addRole(
      client,
      financeOfficer.id,
      firstSchool.organizationId,
      "FINANCE_OFFICER",
      `${suffix}-finance`,
    )
    const schoolAdminRole = await addRole(
      client,
      schoolAdmin.id,
      firstSchool.organizationId,
      "SCHOOL_ADMIN",
      `${suffix}-admin`,
    )

    const directorSession = sessionFor(director)
    const financeSession = sessionFor(financeOfficer)
    const adminSession = sessionFor(schoolAdmin)

    const directorAssignment = await authorizeSchoolCommand(client, directorSession, {
      command: "AUTH-09",
      schoolId: firstSchool.organizationId,
      now,
    })
    assert.equal(directorAssignment.allowed, true)
    assert.equal(directorAssignment.authorityKind, "ACTIVE_DIRECTOR")
    assert.equal(directorAssignment.roleAssignmentId, directorRole.assignment.id)

    const financePayment = await authorizeSchoolCommand(client, financeSession, {
      command: "AUTH-11",
      schoolId: firstSchool.organizationId,
      now,
    })
    assert.equal(financePayment.allowed, true)
    assert.equal(financePayment.matchedRole, "FINANCE_OFFICER")

    const directorPaymentApproval = await authorizeSchoolCommand(client, directorSession, {
      command: "AUTH-11",
      intent: "APPROVAL",
      schoolId: firstSchool.organizationId,
      now,
    })
    assert.equal(directorPaymentApproval.allowed, true)
    assert.equal(directorPaymentApproval.authorityKind, "ACTIVE_DIRECTOR")

    const financeVerifierAssignment = await authorizeSchoolCommand(client, financeSession, {
      command: "AUTH-09",
      schoolId: firstSchool.organizationId,
      now,
    })
    assert.equal(financeVerifierAssignment.allowed, false)
    assert.equal(financeVerifierAssignment.reason, "ACTOR_IS_NOT_EFFECTIVE_HOLDER")

    const crossSchool = await authorizeSchoolCommand(client, financeSession, {
      command: "AUTH-11",
      schoolId: secondSchool.organizationId,
      now,
    })
    assert.equal(crossSchool.allowed, false)
    assert.equal(crossSchool.reason, "INVALID_SCHOOL_SCOPE")

    await client.approvedMembership.update({
      where: { id: schoolAdminRole.membership.id },
      data: { status: "SUSPENDED" },
    })
    const staleMembership = await authorizeSchoolCommand(client, adminSession, {
      command: "AUTH-01",
      schoolId: firstSchool.organizationId,
      now,
    })
    assert.equal(staleMembership.allowed, false)
    assert.equal(staleMembership.reason, "INVALID_SCHOOL_SCOPE")

    await client.authenticatedIdentity.update({
      where: { id: financeOfficer.id },
      data: { authorizationVersion: { increment: 1 } },
    })
    const staleToken = await authorizeSchoolCommand(client, financeSession, {
      command: "AUTH-11",
      schoolId: firstSchool.organizationId,
      now,
    })
    assert.equal(staleToken.allowed, false)
    assert.equal(staleToken.reason, "STALE_SESSION")
  } finally {
    await client.$disconnect()
  }
})

test("P1-06 resolves Active, Acting, and Temporary authority in order without widening AUTH-21", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)

  try {
    if (!(await client.systemAdminBootstrap.findUnique({ where: { id: "p1-17" }, select: { id: true } }))) {
      await bootstrapFirstSystemAdmin(client, {
        accountIdentifier: `p106-system-${suffix}@synthetic.test`,
        password: "P1-06-System-Admin-Password",
      })
    }
    const actingSchool = await createSchool(client, `${suffix}a`)
    const director = await createIdentity(client, `${suffix}-director`)
    const actingSubject = await createIdentity(client, `${suffix}-acting`)
    const directorRole = await addRole(
      client,
      director.id,
      actingSchool.organizationId,
      "SCHOOL_DIRECTOR",
      `${suffix}-director`,
    )
    const actingRole = await addRole(
      client,
      actingSubject.id,
      actingSchool.organizationId,
      "FINANCE_OFFICER",
      `${suffix}-acting`,
    )
    const availability = await client.activeDirectorAvailability.create({
      data: {
        schoolId: actingSchool.organizationId,
        directorRoleAssignmentId: directorRole.assignment.id,
        unavailableFrom: new Date("2026-10-19T08:00:00.000Z"),
        recordedByIdentityId: director.id,
      },
    })
    const actingAuthority = await createAuthority(client, {
      schoolId: actingSchool.organizationId,
      variant: "ACTING_DIRECTOR",
      appointingIdentityId: director.id,
      subjectRoleAssignmentId: actingRole.assignment.id,
      availabilityId: availability.id,
      actingReasonCode: "MEDICAL_LEAVE",
    })

    const actingApproval = await resolveEffectiveDirectorAuthority(client, sessionFor(actingSubject), {
      command: "AUTH-18",
      schoolId: actingSchool.organizationId,
      now,
    })
    assert.equal(actingApproval.allowed, true)
    assert.equal(actingApproval.authorityKind, "ACTING")
    assert.equal(actingApproval.authorityRecordId, actingAuthority.id)

    const unavailableDirector = await resolveEffectiveDirectorAuthority(client, sessionFor(director), {
      command: "AUTH-18",
      schoolId: actingSchool.organizationId,
      now,
    })
    assert.equal(unavailableDirector.allowed, false)
    assert.equal(unavailableDirector.reason, "ACTOR_IS_NOT_EFFECTIVE_HOLDER")

    const directorCorrection = await resolveEffectiveDirectorAuthority(client, sessionFor(director), {
      command: "AUTH-21",
      schoolId: actingSchool.organizationId,
      now,
    })
    assert.equal(directorCorrection.allowed, true)
    assert.equal(directorCorrection.authorityKind, "ACTIVE_DIRECTOR")

    const actingCorrection = await resolveEffectiveDirectorAuthority(client, sessionFor(actingSubject), {
      command: "AUTH-21",
      schoolId: actingSchool.organizationId,
      now,
    })
    assert.equal(actingCorrection.allowed, false)
    assert.equal(actingCorrection.reason, "ACTOR_IS_NOT_EFFECTIVE_HOLDER")

    const unsupportedSubstituteCommand = await resolveEffectiveDirectorAuthority(client, sessionFor(actingSubject), {
      command: "AUTH-19",
      schoolId: actingSchool.organizationId,
      now,
    })
    assert.equal(unsupportedSubstituteCommand.allowed, false)
    assert.equal(unsupportedSubstituteCommand.reason, "UNLISTED_COMMAND")

    const temporarySchool = await createSchool(client, `${suffix}b`)
    const temporarySubject = await createIdentity(client, `${suffix}-temporary`)
    const temporaryRole = await addRole(
      client,
      temporarySubject.id,
      temporarySchool.organizationId,
      "SCHOOL_ADMIN",
      `${suffix}-temporary`,
    )
    const temporaryAuthority = await createAuthority(client, {
      schoolId: temporarySchool.organizationId,
      variant: "TEMPORARY",
      appointingIdentityId: director.id,
      subjectRoleAssignmentId: temporaryRole.assignment.id,
      temporaryBasis: "No active School Director in the synthetic fixture",
      expiresAt: new Date("2026-11-01T00:00:00.000Z"),
    })

    const temporaryApproval = await resolveEffectiveDirectorAuthority(client, sessionFor(temporarySubject), {
      command: "AUTH-12",
      schoolId: temporarySchool.organizationId,
      now,
    })
    assert.equal(temporaryApproval.allowed, true)
    assert.equal(temporaryApproval.authorityKind, "TEMPORARY")
    assert.equal(temporaryApproval.authorityRecordId, temporaryAuthority.id)

    const temporaryCorrection = await resolveEffectiveDirectorAuthority(client, sessionFor(temporarySubject), {
      command: "AUTH-21",
      schoolId: temporarySchool.organizationId,
      now,
    })
    assert.equal(temporaryCorrection.allowed, false)
    assert.equal(temporaryCorrection.reason, "NO_ACTIVE_DIRECTOR")

    const expiredSchool = await createSchool(client, `${suffix}c`)
    const expiredSubject = await createIdentity(client, `${suffix}-expired`)
    const expiredRole = await addRole(
      client,
      expiredSubject.id,
      expiredSchool.organizationId,
      "FINANCE_OFFICER",
      `${suffix}-expired`,
    )
    const expiredAuthorityRecord = await createAuthority(client, {
      schoolId: expiredSchool.organizationId,
      variant: "TEMPORARY",
      appointingIdentityId: director.id,
      subjectRoleAssignmentId: expiredRole.assignment.id,
      temporaryBasis: "Synthetic temporary authority expired before the request",
      expiresAt: new Date("2026-10-19T00:00:00.000Z"),
    })
    const expiredAuthority = await resolveEffectiveDirectorAuthority(client, sessionFor(expiredSubject), {
      command: "AUTH-12",
      schoolId: expiredSchool.organizationId,
      now,
    })
    assert.equal(expiredAuthority.allowed, false)
    assert.equal(expiredAuthority.reason, "NO_EFFECTIVE_DIRECTOR_AUTHORITY")
    assert.equal((await client.substituteDirectorAuthority.findUniqueOrThrow({ where: { id: expiredAuthorityRecord.id } })).status, "EXPIRED")
  } finally {
    await client.$disconnect()
  }
})
