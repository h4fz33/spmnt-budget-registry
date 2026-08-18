import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"

const effectiveFrom = new Date("2026-10-01T00:00:00.000Z")
const effectiveTo = new Date("2027-10-01T00:00:00.000Z")
const authorityFrom = new Date("2026-10-15T00:00:00.000Z")
const digest = "a".repeat(64)

async function expectDatabaseRejection(action: () => Promise<unknown>) {
  await assert.rejects(action, (error: unknown) => error instanceof Error)
}

async function createIdentity(client: ReturnType<typeof createDatabaseClient>["client"], suffix: string) {
  return client.authenticatedIdentity.create({
    data: {
      accountIdentifier: `${suffix}@synthetic.test`,
      displayName: suffix,
      accountStatus: "ACTIVE",
    },
  })
}

async function createSchool(client: ReturnType<typeof createDatabaseClient>["client"], suffix: string) {
  const esao = await client.organization.create({
    data: {
      type: "ESAO",
      nameTh: `ESAO ${suffix}`,
    },
  })
  const organization = await client.organization.create({
    data: {
      type: "SCHOOL",
      nameTh: `School ${suffix}`,
      parentOrganizationId: esao.id,
    },
  })

  return client.school.create({
    data: {
      organizationId: organization.id,
      smisCode: `SMIS-${suffix}`,
      moeCode: `MOE-${suffix}`,
    },
  })
}

async function createMembership(
  client: ReturnType<typeof createDatabaseClient>["client"],
  identityId: string,
  schoolId: string,
) {
  return client.approvedMembership.create({
    data: {
      identityId,
      organizationId: schoolId,
      effectiveFrom,
    },
  })
}

async function assignRole(
  client: ReturnType<typeof createDatabaseClient>["client"],
  membershipId: string,
  schoolId: string,
  role: "FINANCE_OFFICER" | "SCHOOL_ADMIN" | "SCHOOL_DIRECTOR",
  suffix: string,
) {
  return client.schoolRoleAssignment.create({
    data: {
      membershipId,
      schoolId,
      role,
      effectiveFrom,
      effectiveTo,
      grantReason: `P1-04 synthetic ${suffix}`,
    },
  })
}

test("P1-04 persists scoped history and rejects prohibited organization and authority shapes", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = `p104${randomUUID().replaceAll("-", "").slice(0, 12)}`

  try {
    const firstSchool = await createSchool(client, `${suffix}a`)
    const secondSchool = await createSchool(client, `${suffix}b`)

    await client.fiscalYear.create({
      data: {
        schoolId: firstSchool.organizationId,
        buddhistYear: 2569,
        startsOn: new Date("2026-10-01T00:00:00.000Z"),
        endsOn: new Date("2027-09-30T00:00:00.000Z"),
      },
    })

    await expectDatabaseRejection(() =>
      client.fiscalYear.create({
        data: {
          schoolId: firstSchool.organizationId,
          buddhistYear: 2570,
          startsOn: new Date("2027-10-02T00:00:00.000Z"),
          endsOn: new Date("2028-09-30T00:00:00.000Z"),
        },
      }),
    )

    const duplicateIdentifierOrganization = await client.organization.create({
      data: {
        type: "SCHOOL",
        nameTh: `Duplicate ${suffix}`,
        parentOrganizationId: (
          await client.organization.findUniqueOrThrow({ where: { id: firstSchool.organizationId } })
        ).parentOrganizationId!,
      },
    })
    await expectDatabaseRejection(() =>
      client.school.create({
        data: {
          organizationId: duplicateIdentifierOrganization.id,
          smisCode: firstSchool.smisCode,
          moeCode: `MOE-duplicate-${suffix}`,
        },
      }),
    )
    const duplicateMoeOrganization = await client.organization.create({
      data: {
        type: "SCHOOL",
        nameTh: `Duplicate MOE ${suffix}`,
        parentOrganizationId: (
          await client.organization.findUniqueOrThrow({ where: { id: firstSchool.organizationId } })
        ).parentOrganizationId!,
      },
    })
    await expectDatabaseRejection(() =>
      client.school.create({
        data: {
          organizationId: duplicateMoeOrganization.id,
          smisCode: `SMIS-duplicate-${suffix}`,
          moeCode: firstSchool.moeCode,
        },
      }),
    )

    const additiveIdentity = await createIdentity(client, `additive-${suffix}`)
    const firstMembership = await createMembership(client, additiveIdentity.id, firstSchool.organizationId)
    const secondMembership = await createMembership(client, additiveIdentity.id, secondSchool.organizationId)
    const financeRole = await assignRole(
      client,
      firstMembership.id,
      firstSchool.organizationId,
      "FINANCE_OFFICER",
      suffix,
    )
    const schoolAdminRole = await assignRole(
      client,
      firstMembership.id,
      firstSchool.organizationId,
      "SCHOOL_ADMIN",
      suffix,
    )
    assert.equal(financeRole.membershipId, schoolAdminRole.membershipId)
    assert.equal(financeRole.schoolId, schoolAdminRole.schoolId)

    await expectDatabaseRejection(() =>
      assignRole(
        client,
        secondMembership.id,
        secondSchool.organizationId,
        "SCHOOL_ADMIN",
        `${suffix}-cross-membership`,
      ),
    )
    await expectDatabaseRejection(() =>
      assignRole(
        client,
        firstMembership.id,
        secondSchool.organizationId,
        "SCHOOL_ADMIN",
        `${suffix}-cross-school`,
      ),
    )
    await expectDatabaseRejection(() =>
      client.schoolRoleAssignment.update({
        where: { id: financeRole.id },
        data: { grantReason: "A role-history record cannot be rewritten" },
      }),
    )
    await expectDatabaseRejection(() => client.$queryRawUnsafe('SELECT \'ESAO_ADMIN\'::"SchoolRole"'))

    const directorIdentity = await createIdentity(client, `director-${suffix}`)
    const directorMembership = await createMembership(client, directorIdentity.id, firstSchool.organizationId)
    const directorRole = await assignRole(
      client,
      directorMembership.id,
      firstSchool.organizationId,
      "SCHOOL_DIRECTOR",
      suffix,
    )
    const secondDirectorIdentity = await createIdentity(client, `director2-${suffix}`)
    const secondDirectorMembership = await createMembership(client, secondDirectorIdentity.id, firstSchool.organizationId)
    await expectDatabaseRejection(() =>
      assignRole(
        client,
        secondDirectorMembership.id,
        firstSchool.organizationId,
        "SCHOOL_DIRECTOR",
        `${suffix}-duplicate-director`,
      ),
    )

    const availability = await client.activeDirectorAvailability.create({
      data: {
        schoolId: firstSchool.organizationId,
        directorRoleAssignmentId: directorRole.id,
        unavailableFrom: authorityFrom,
        recordedByIdentityId: directorIdentity.id,
      },
    })
    const actingAuthority = await client.substituteDirectorAuthority.create({
      data: {
        schoolId: firstSchool.organizationId,
        variant: "ACTING_DIRECTOR",
        status: "IN_FORCE",
        appointingIdentityId: directorIdentity.id,
        subjectRoleAssignmentId: financeRole.id,
        availabilityId: availability.id,
        actingReasonCode: "MEDICAL_LEAVE",
        commandScope: ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"],
        effectiveFrom: authorityFrom,
        integrityDigest: digest,
        evidenceContentHash: digest,
      },
    })
    await client.substituteDirectorAuthorityLifecycle.create({
      data: {
        authorityId: actingAuthority.id,
        revision: 1,
        status: "IN_FORCE",
        occurredAt: authorityFrom,
        actorIdentityId: directorIdentity.id,
        reason: "P1-04 synthetic Acting authority",
        integrityDigest: digest,
      },
    })
    const persistedAuthority = await client.substituteDirectorAuthority.findUniqueOrThrow({
      where: { id: actingAuthority.id },
      include: { lifecycleEvents: true },
    })
    assert.deepEqual(persistedAuthority.commandScope, ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"])
    assert.equal(persistedAuthority.lifecycleEvents.length, 1)

    const alternateIdentity = await createIdentity(client, `alternate-${suffix}`)
    const alternateMembership = await createMembership(client, alternateIdentity.id, firstSchool.organizationId)
    const alternateFinanceRole = await assignRole(
      client,
      alternateMembership.id,
      firstSchool.organizationId,
      "FINANCE_OFFICER",
      `${suffix}-alternate`,
    )
    const esaoActor = await createIdentity(client, `esao-${suffix}`)
    await expectDatabaseRejection(() =>
      client.substituteDirectorAuthority.create({
        data: {
          schoolId: firstSchool.organizationId,
          variant: "ACTING_ESAO",
          status: "IN_FORCE",
          appointingIdentityId: esaoActor.id,
          subjectRoleAssignmentId: alternateFinanceRole.id,
          availabilityId: availability.id,
          actingReasonCode: "OFFICIAL_TRAVEL",
          commandScope: ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"],
          effectiveFrom: authorityFrom,
          integrityDigest: digest,
        },
      }),
    )

    const temporaryIdentity = await createIdentity(client, `temporary-${suffix}`)
    const temporaryMembership = await createMembership(client, temporaryIdentity.id, secondSchool.organizationId)
    const temporaryFinanceRole = await assignRole(
      client,
      temporaryMembership.id,
      secondSchool.organizationId,
      "FINANCE_OFFICER",
      `${suffix}-temporary`,
    )
    await expectDatabaseRejection(() =>
      client.substituteDirectorAuthority.create({
        data: {
          schoolId: secondSchool.organizationId,
          variant: "TEMPORARY",
          status: "IN_FORCE",
          appointingIdentityId: esaoActor.id,
          subjectRoleAssignmentId: temporaryFinanceRole.id,
          temporaryBasis: "No active School Director in synthetic fixture",
          commandScope: ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"],
          effectiveFrom: authorityFrom,
          integrityDigest: digest,
        },
      }),
    )
    await expectDatabaseRejection(() =>
      client.substituteDirectorAuthority.create({
        data: {
          schoolId: secondSchool.organizationId,
          variant: "TEMPORARY",
          status: "IN_FORCE",
          appointingIdentityId: esaoActor.id,
          subjectRoleAssignmentId: temporaryFinanceRole.id,
          temporaryBasis: "Fixed command scope is required",
          commandScope: ["AUTH-09"],
          effectiveFrom: authorityFrom,
          expiresAt: new Date("2026-11-01T00:00:00.000Z"),
          integrityDigest: digest,
        },
      }),
    )
    await expectDatabaseRejection(() =>
      client.substituteDirectorAuthority.create({
        data: {
          schoolId: secondSchool.organizationId,
          variant: "TEMPORARY",
          status: "IN_FORCE",
          appointingIdentityId: esaoActor.id,
          subjectRoleAssignmentId: financeRole.id,
          temporaryBasis: "Cross-School subject must fail",
          commandScope: ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"],
          effectiveFrom: authorityFrom,
          expiresAt: new Date("2026-11-01T00:00:00.000Z"),
          integrityDigest: digest,
        },
      }),
    )
    await expectDatabaseRejection(() =>
      client.substituteDirectorAuthority.update({
        where: { id: actingAuthority.id },
        data: { reasonDetail: "A history-preserving record cannot be rewritten" },
      }),
    )
    await expectDatabaseRejection(() =>
      client.substituteDirectorAuthority.delete({ where: { id: actingAuthority.id } }),
    )
  } finally {
    await client.$disconnect()
  }
})
