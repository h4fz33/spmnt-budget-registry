import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import { bootstrapFirstSystemAdmin } from "../../src/lib/bootstrap/first-system-admin.ts"
import {
  applyEsaoAdminConfiguration,
  ESAO_ADMIN_ROLE,
  PILOT_ESAO_ORGANIZATION_ID,
} from "../../src/lib/authorization/esao-admin.ts"
import {
  calculateSchoolAdminManifestDigest,
  SchoolAdminBootstrapApprovalError,
  SchoolAdminBootstrapFreshAuthenticationRequiredError,
  SchoolAdminBootstrapReplayError,
  executeSchoolAdminBootstrap,
} from "../../src/lib/bootstrap/school-admin.ts"

const passwordHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

function evidence(suffix: string) {
  const reference = `synthetic://p1-21/${suffix}`
  return {
    externalApprovalRecordId: `PO-P1-21-${suffix}`,
    approvalAuthorityLabel: "ESAO Admin" as const,
    approvalAuthorityIdentity: `p121-esao-admin-${suffix}@synthetic.test`,
    approvalEvidenceReference: reference,
    approvalEvidenceHash: createHash("sha256").update(reference).digest("hex"),
  }
}

test("P1-21 executes one exact password-free School Admin row per pilot School and seals replay", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)
  const now = new Date()
  try {
    let systemAdmin = await client.systemAdminBootstrap.findUnique({ where: { id: "p1-17" }, include: { identity: true, membership: true } })
    if (!systemAdmin) {
      await bootstrapFirstSystemAdmin(client, { accountIdentifier: `p121-system-admin-${suffix}@synthetic.test`, password: "P1-21-System-Admin-Password" })
      systemAdmin = await client.systemAdminBootstrap.findUniqueOrThrow({ where: { id: "p1-17" }, include: { identity: true, membership: true } })
    }
    const schools = await client.school.findMany({
      where: { directoryIsActive: true, organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" } },
      orderBy: { organizationId: "asc" },
      select: { organizationId: true },
    })
    assert.equal(schools.length, 17)

    const esaoIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p121-esao-admin-${suffix}@synthetic.test`,
        displayName: "P1-21 Synthetic ESAO Admin",
        accountStatus: "ACTIVE",
        passwordHash,
        passwordChangedAt: now,
        memberships: { create: { organizationId: PILOT_ESAO_ORGANIZATION_ID, status: "ACTIVE", effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    const systemActor = {
      identityId: systemAdmin.identityId,
      membershipId: systemAdmin.membershipId,
      accountIdentifier: systemAdmin.identity.accountIdentifier,
      authorizationVersion: systemAdmin.identity.authorizationVersion,
      membershipAuthorizationVersion: systemAdmin.membership.authorizationVersion,
      authenticatedAt: now.getTime(),
    }
    const esaoActor = {
      identityId: esaoIdentity.id,
      membershipId: esaoIdentity.memberships[0]!.id,
      accountIdentifier: esaoIdentity.accountIdentifier,
      authorizationVersion: esaoIdentity.authorizationVersion,
      membershipAuthorizationVersion: esaoIdentity.memberships[0]!.authorizationVersion,
      authenticatedAt: now.getTime(),
    }
    const esaoConfig = await applyEsaoAdminConfiguration(client, {
      actor: systemActor,
      evidence: {
        externalApprovalRecordId: `PO-P1-21-ESAO-${suffix}`,
        approvalAuthorityLabel: "Private Business / Product Owner",
        approvalAuthorityIdentity: "synthetic-product-owner@synthetic.test",
        approvalEvidenceReference: `synthetic://p1-21/esao/${suffix}`,
        approvalEvidenceHash: "a".repeat(64),
      },
      subject: {
        subjectIdentityId: esaoIdentity.id,
        subjectAccountIdentifier: esaoIdentity.accountIdentifier,
        subjectPersonName: esaoIdentity.displayName,
        subjectRoleCode: ESAO_ADMIN_ROLE,
        subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
        schoolIds: schools.map((school) => school.organizationId),
      },
    })
    const manifest = schools.map((school, index) => ({
      schoolId: school.organizationId,
      accountIdentifier: `p121-school-admin-${index + 1}-${suffix}@synthetic.test`,
      personName: `P1-21 School Admin ${index + 1}`,
      roleCode: "SCHOOL_ADMIN" as const,
    }))
    const approval = { ...evidence(suffix), manifestDigest: calculateSchoolAdminManifestDigest(PILOT_ESAO_ORGANIZATION_ID, manifest), configurationId: esaoConfig.configurationId, actor: esaoActor }

    await assert.rejects(
      () => executeSchoolAdminBootstrap(client, { actor: { ...systemActor, authenticatedAt: now.getTime() - 6 * 60 * 1000 }, approval, manifest }),
      (error: unknown) => error instanceof SchoolAdminBootstrapFreshAuthenticationRequiredError,
    )
    await assert.rejects(
      () => executeSchoolAdminBootstrap(client, { actor: systemActor, approval: { ...approval, manifestDigest: "0".repeat(64) }, manifest }),
      (error: unknown) => error instanceof SchoolAdminBootstrapApprovalError,
    )

    const result = await executeSchoolAdminBootstrap(client, { actor: systemActor, approval, manifest }, new Date())
    assert.equal(result.identityIds.length, 17)
    assert.equal(await client.schoolAdminBootstrapManifestRow.count({ where: { bootstrapId: "p1-21" } }), 17)
    assert.equal(await client.schoolRoleAssignment.count({ where: { role: { not: "SCHOOL_ADMIN" }, id: { in: [...result.roleAssignmentIds] } } }), 0)
    const identities = await client.authenticatedIdentity.findMany({ where: { id: { in: [...result.identityIds] } }, select: { passwordHash: true, accountStatus: true } })
    assert.equal(identities.every((identity) => identity.accountStatus === "ACTIVE" && identity.passwordHash === null), true)

    await assert.rejects(
      () => executeSchoolAdminBootstrap(client, { actor: systemActor, approval, manifest }, new Date(now.getTime() + 1_000)),
      (error: unknown) => error instanceof SchoolAdminBootstrapReplayError,
    )
    await assert.rejects(
      () => client.$executeRaw`UPDATE "SchoolAdminBootstrapManifestRow" SET "personName" = 'altered' WHERE "bootstrapId" = 'p1-21'`,
      (error: unknown) => error instanceof Error,
    )
    const audits = await client.auditLog.findMany({ where: { commandCode: "AUTH-09", targetType: "SchoolAdminBootstrap", targetId: "p1-21", outcome: "SUCCESS" }, orderBy: { sequence: "asc" } })
    assert.deepEqual(audits.map((audit) => audit.reasonCode), ["SCHOOL_ADMIN_BOOTSTRAP_APPROVED", "SCHOOL_ADMIN_BOOTSTRAP_EXECUTED"])
  } finally {
    await client.$disconnect()
  }
})
