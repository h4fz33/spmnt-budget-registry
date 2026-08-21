import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import { bootstrapFirstSystemAdmin } from "../../src/lib/bootstrap/first-system-admin.ts"
import {
  ESAO_ADMIN_ROLE,
  EsaoAdminApprovalRecordError,
  EsaoAdminFreshAuthenticationRequiredError,
  EsaoAdminReplayError,
  PILOT_ESAO_ORGANIZATION_ID,
  applyEsaoAdminConfiguration,
  resolveActiveEsaoAdmin,
  revokeEsaoAdminConfiguration,
} from "../../src/lib/authorization/esao-admin.ts"

function syntheticEvidence(recordId: string, action: "appoint" | "revoke") {
  const reference = `synthetic://p1-18/${recordId}/${action}`
  return {
    externalApprovalRecordId: recordId,
    approvalAuthorityLabel: "Private Business / Product Owner" as const,
    approvalAuthorityIdentity: "synthetic-product-owner@synthetic.test",
    approvalEvidenceReference: reference,
    approvalEvidenceHash: createHash("sha256").update(reference, "utf8").digest("hex"),
  }
}

test("P1-18 applies and revokes only exact synthetic ESAO Admin configuration", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)
  const now = new Date()

  try {
    let systemAdmin = await client.systemAdminBootstrap.findUnique({
      where: { id: "p1-17" },
      include: { identity: true, membership: true },
    })
    if (!systemAdmin) {
      await bootstrapFirstSystemAdmin(client, {
        accountIdentifier: `p118-system-admin-${suffix}@synthetic.test`,
        password: "Synthetic-P1-18-System-Admin",
      })
      systemAdmin = await client.systemAdminBootstrap.findUniqueOrThrow({
        where: { id: "p1-17" },
        include: { identity: true, membership: true },
      })
    }
    const actor = {
      identityId: systemAdmin.identityId,
      membershipId: systemAdmin.membershipId,
      accountIdentifier: systemAdmin.identity.accountIdentifier,
      authorizationVersion: systemAdmin.identity.authorizationVersion,
      membershipAuthorizationVersion: systemAdmin.membership.authorizationVersion,
      authenticatedAt: Date.now(),
    }
    const schools = await client.school.findMany({
      where: {
        directoryIsActive: true,
        organization: {
          parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
          type: "SCHOOL",
          status: "ACTIVE",
        },
      },
      orderBy: { organizationId: "asc" },
      select: { organizationId: true },
    })
    assert.equal(schools.length, 17)

    const subject = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p118-esao-admin-${suffix}@synthetic.test`,
        displayName: "P1-18 Synthetic ESAO Admin",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: {
          create: {
            organizationId: PILOT_ESAO_ORGANIZATION_ID,
            status: "ACTIVE",
            effectiveFrom: now,
          },
        },
      },
      include: { memberships: true },
    })
    const subjectRecord = {
      subjectIdentityId: subject.id,
      subjectAccountIdentifier: subject.accountIdentifier,
      subjectPersonName: subject.displayName,
      subjectRoleCode: ESAO_ADMIN_ROLE,
      subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
      schoolIds: schools.map((school) => school.organizationId),
    }
    const appointmentEvidence = syntheticEvidence(`PO-P1-18-${suffix}-APPOINT`, "appoint")
    const ordinarySchoolUser = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p118-ordinary-school-user-${suffix}@synthetic.test`,
        displayName: "P1-18 Ordinary School User",
        accountStatus: "ACTIVE",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        passwordChangedAt: now,
        memberships: {
          create: [
            {
              organizationId: PILOT_ESAO_ORGANIZATION_ID,
              status: "ACTIVE",
              effectiveFrom: now,
            },
            {
              organizationId: schools[0]!.organizationId,
              status: "ACTIVE",
              effectiveFrom: now,
            },
          ],
        },
      },
    })
    const ordinarySchoolMembership = await client.approvedMembership.findFirstOrThrow({
      where: {
        identityId: ordinarySchoolUser.id,
        organizationId: schools[0]!.organizationId,
      },
      select: { id: true },
    })
    await client.schoolRoleAssignment.create({
      data: {
        membershipId: ordinarySchoolMembership.id,
        schoolId: schools[0]!.organizationId,
        role: "FINANCE_OFFICER",
        grantReason: "P1-18 ordinary School-role rejection fixture",
      },
    })
    const ordinarySchoolRecord = {
      ...subjectRecord,
      subjectIdentityId: ordinarySchoolUser.id,
      subjectAccountIdentifier: ordinarySchoolUser.accountIdentifier,
      subjectPersonName: ordinarySchoolUser.displayName,
    }

    await assert.rejects(
      () =>
        applyEsaoAdminConfiguration(client, {
          actor,
          evidence: appointmentEvidence,
          subject: { ...subjectRecord, subjectIdentityId: actor.identityId },
      }),
      (error: unknown) => error instanceof EsaoAdminApprovalRecordError,
    )
    await assert.rejects(
      () =>
        applyEsaoAdminConfiguration(client, {
          actor,
          evidence: syntheticEvidence(`PO-P1-18-${suffix}-ORDINARY`, "appoint"),
          subject: ordinarySchoolRecord,
        }),
      (error: unknown) => error instanceof EsaoAdminApprovalRecordError,
    )
    await assert.rejects(
      () =>
        applyEsaoAdminConfiguration(client, {
          actor,
          evidence: { ...appointmentEvidence, approvalEvidenceHash: "missing" },
          subject: subjectRecord,
        }),
      (error: unknown) => error instanceof EsaoAdminApprovalRecordError,
    )
    await assert.rejects(
      () =>
        applyEsaoAdminConfiguration(client, {
          actor,
          evidence: appointmentEvidence,
          subject: { ...subjectRecord, subjectRoleCode: "SESAO_AUDITOR" },
        }),
      (error: unknown) => error instanceof EsaoAdminApprovalRecordError,
    )

    const appointment = await applyEsaoAdminConfiguration(client, {
      actor,
      evidence: appointmentEvidence,
      subject: subjectRecord,
    })
    const activeIdentity = await client.authenticatedIdentity.findUniqueOrThrow({
      where: { id: subject.id },
      select: { authorizationVersion: true },
    })
    const resolved = await resolveActiveEsaoAdmin(client, {
      identityId: subject.id,
      authorizationVersion: activeIdentity.authorizationVersion,
    })
    assert.equal(resolved?.configurationId, appointment.configurationId)
    assert.equal(resolved?.roleCode, ESAO_ADMIN_ROLE)
    assert.deepEqual(resolved?.schoolIds, schools.map((school) => school.organizationId))
    assert.equal(await client.schoolRoleAssignment.count({ where: { membershipId: subject.memberships[0]!.id } }), 0)

    await assert.rejects(
      () => applyEsaoAdminConfiguration(client, { actor, evidence: appointmentEvidence, subject: subjectRecord }),
      (error: unknown) => error instanceof EsaoAdminReplayError,
    )
    await assert.rejects(
      () => applyEsaoAdminConfiguration(client, {
        actor: { ...actor, authenticatedAt: Date.now() - 6 * 60 * 1000 },
        evidence: syntheticEvidence(`PO-P1-18-${suffix}-STALE`, "appoint"),
        subject: subjectRecord,
      }),
      (error: unknown) => error instanceof EsaoAdminFreshAuthenticationRequiredError,
    )

    const revoked = await revokeEsaoAdminConfiguration(client, {
      actor: { ...actor, authenticatedAt: Date.now() },
      configurationId: appointment.configurationId,
      evidence: syntheticEvidence(`PO-P1-18-${suffix}-REVOKE`, "revoke"),
      subject: subjectRecord,
    })
    assert.equal(revoked.configurationId, appointment.configurationId)
    const revokedIdentity = await client.authenticatedIdentity.findUniqueOrThrow({
      where: { id: subject.id },
      select: { authorizationVersion: true, memberships: { select: { authorizationVersion: true } } },
    })
    assert.equal(await resolveActiveEsaoAdmin(client, {
      identityId: subject.id,
      authorizationVersion: activeIdentity.authorizationVersion,
    }), null)
    assert.equal(revokedIdentity.authorizationVersion, activeIdentity.authorizationVersion + 1)
    assert.equal(revokedIdentity.memberships[0]!.authorizationVersion, subject.memberships[0]!.authorizationVersion + 1)
    const provenance = await client.esaoAdminProvenance.findMany({
      where: { configurationId: appointment.configurationId },
      orderBy: { action: "asc" },
    })
    assert.deepEqual(provenance.map((record) => record.action), ["APPOINT", "REVOKE"])
    assert.equal(provenance[0]!.approvalAuthorityLabel, "Private Business / Product Owner")
    assert.equal(provenance[0]!.technicalExecutorIdentityId, systemAdmin.identityId)
    await assert.rejects(
      () => client.$executeRaw`UPDATE "EsaoAdminConfiguration" SET "effectiveFrom" = "effectiveFrom" + INTERVAL '1 second' WHERE "id" = ${appointment.configurationId}`,
      (error: unknown) => error instanceof Error,
    )
    await assert.rejects(
      () => client.$executeRaw`UPDATE "EsaoAdminSchoolScope" SET "schoolId" = "schoolId" WHERE "configurationId" = ${appointment.configurationId}`,
      (error: unknown) => error instanceof Error,
    )
    await assert.rejects(
      () => client.$executeRaw`UPDATE "EsaoAdminProvenance" SET "executedAt" = "executedAt" WHERE "id" = ${provenance[0]!.id}`,
      (error: unknown) => error instanceof Error,
    )
  } finally {
    await client.$disconnect()
  }
})
