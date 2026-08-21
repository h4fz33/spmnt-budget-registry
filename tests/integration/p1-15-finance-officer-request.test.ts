import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import { bootstrapFirstSystemAdmin } from "../../src/lib/bootstrap/first-system-admin.ts"
import { applyEsaoAdminConfiguration, PILOT_ESAO_ORGANIZATION_ID } from "../../src/lib/authorization/esao-admin.ts"
import {
  approveSchoolAccountRequest,
  requestSchoolAccountCorrection,
  resubmitSchoolAccountRequest,
  SchoolAccountRequestRateLimitedError,
  submitSchoolAccountRequest,
  withdrawSchoolAccountRequest,
} from "../../src/lib/onboarding/finance-officer-request.ts"

const passwordHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

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

test("P1-15 keeps requests membership-free until ESAO approval and preserves lifecycle evidence", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)
  const now = new Date()
  try {
    let systemAdmin = await client.systemAdminBootstrap.findUnique({ where: { id: "p1-17" }, include: { identity: true, membership: true } })
    if (!systemAdmin) {
      await bootstrapFirstSystemAdmin(client, { accountIdentifier: `p115-system-${suffix}@synthetic.test`, password: "P1-15-System-Admin" })
      systemAdmin = await client.systemAdminBootstrap.findUniqueOrThrow({ where: { id: "p1-17" }, include: { identity: true, membership: true } })
    }
    const schools = await client.school.findMany({
      where: { directoryIsActive: true, organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" } },
      orderBy: { organizationId: "asc" },
      select: { organizationId: true },
    })
    assert.equal(schools.length, 17)
    const schoolId = schools[0]!.organizationId
    const schoolAdmin = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p115-school-admin-${suffix}@synthetic.test`,
        displayName: "P1-15 School Admin",
        accountStatus: "ACTIVE",
        passwordHash,
        passwordChangedAt: now,
        memberships: { create: { organizationId: schoolId, status: "ACTIVE", effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    const schoolMembership = schoolAdmin.memberships[0]!
    await client.schoolRoleAssignment.create({
      data: {
        membershipId: schoolMembership.id,
        schoolId,
        role: "SCHOOL_ADMIN",
        status: "ACTIVE",
        effectiveFrom: now,
        grantReason: "P1-15 integration fixture",
      },
    })

    const esaoIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p115-esao-admin-${suffix}@synthetic.test`,
        displayName: "P1-15 ESAO Admin",
        accountStatus: "ACTIVE",
        passwordHash,
        passwordChangedAt: now,
        memberships: { create: { organizationId: PILOT_ESAO_ORGANIZATION_ID, status: "ACTIVE", effectiveFrom: now } },
      },
      include: { memberships: true },
    })
    const systemActor = actor(systemAdmin.identity, systemAdmin.membership, now)
    const esaoMembership = esaoIdentity.memberships[0]!
    const esaoConfiguration = await applyEsaoAdminConfiguration(client, {
      actor: systemActor,
      evidence: {
        externalApprovalRecordId: `PO-P1-15-${suffix}`,
        approvalAuthorityLabel: "Private Business / Product Owner",
        approvalAuthorityIdentity: "synthetic-owner@synthetic.test",
        approvalEvidenceReference: `synthetic://p1-15/${suffix}`,
        approvalEvidenceHash: createHash("sha256").update(suffix).digest("hex"),
      },
      subject: {
        subjectIdentityId: esaoIdentity.id,
        subjectAccountIdentifier: esaoIdentity.accountIdentifier,
        subjectPersonName: esaoIdentity.displayName,
        subjectRoleCode: "ESAO_ADMIN",
        subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
        schoolIds: schools.map((school) => school.organizationId),
      },
    })
    const esaoActor = actor(esaoIdentity, esaoMembership, now)
    const targetAccountIdentifier = `p115-finance-${suffix}@synthetic.test`
    const submitted = await submitSchoolAccountRequest(client, {
      actor: actor(schoolAdmin, schoolMembership, now),
      schoolId,
      target: { accountIdentifier: targetAccountIdentifier.toUpperCase(), displayName: "P1-15 Finance Officer" },
      requestedRole: "FINANCE_OFFICER",
      reason: { code: "STAFF_ONBOARDING", detail: "Synthetic pilot Finance Officer request" },
    }, now)
    assert.equal(submitted.status, "PENDING_ESAO_REVIEW")
    const pendingTarget = await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: submitted.targetIdentityId }, include: { memberships: true } })
    assert.equal(pendingTarget.accountStatus, "PENDING")
    assert.equal(pendingTarget.passwordHash, null)
    assert.equal(pendingTarget.memberships.length, 0)
    assert.equal(await client.schoolAccountRequestHistory.count({ where: { requestId: submitted.requestId } }), 2)

    const correction = await requestSchoolAccountCorrection(client, {
      actor: esaoActor,
      requestId: submitted.requestId,
      reason: { code: "ROSTER_REFERENCE_REQUIRED", detail: "Confirm the synthetic roster reference" },
      verification: { outcome: "NEEDS_CORRECTION", reference: "synthetic://roster/p1-15/needs-correction" },
    }, new Date(now.getTime() + 1_000))
    assert.equal(correction.status, "NEEDS_CORRECTION")
    const resubmitted = await resubmitSchoolAccountRequest(client, {
      actor: actor(schoolAdmin, schoolMembership, new Date(now.getTime() + 2_000)),
      requestId: submitted.requestId,
      targetDisplayName: "P1-15 Corrected Finance Officer",
      reason: { code: "ROSTER_REFERENCE_ADDED", detail: "Synthetic roster reference is now supplied" },
    }, new Date(now.getTime() + 2_000))
    assert.equal(resubmitted.status, "RESUBMITTED")

    const approved = await approveSchoolAccountRequest(client, {
      actor: actor(esaoIdentity, esaoMembership, new Date(now.getTime() + 3_000)),
      requestId: submitted.requestId,
      reason: { code: "ROSTER_VERIFIED", detail: "Synthetic roster identity verified" },
      verification: { outcome: "VERIFIED", reference: "synthetic://roster/p1-15/verified" },
    }, new Date(now.getTime() + 3_000))
    assert.equal(approved.status, "APPROVED")
    assert.ok(approved.membershipId)
    assert.ok(approved.roleAssignmentId)
    const activeTarget = await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: submitted.targetIdentityId }, include: { memberships: { include: { roleAssignments: true } } } })
    assert.equal(activeTarget.accountStatus, "ACTIVE")
    assert.equal(activeTarget.memberships.length, 1)
    assert.equal(activeTarget.memberships[0]!.organizationId, schoolId)
    assert.deepEqual(activeTarget.memberships[0]!.roleAssignments.map((assignment) => assignment.role), ["FINANCE_OFFICER"])
    assert.equal(await client.schoolAccountRequestHistory.count({ where: { requestId: submitted.requestId } }), 5)

    const withdrawnTarget = `p115-withdraw-${suffix}@synthetic.test`
    const second = await submitSchoolAccountRequest(client, {
      actor: actor(schoolAdmin, schoolMembership, new Date(now.getTime() + 4_000)),
      schoolId,
      target: { accountIdentifier: withdrawnTarget, displayName: "P1-15 Withdrawn" },
      reason: { code: "STAFF_ONBOARDING", detail: "Second synthetic request" },
    }, new Date(now.getTime() + 4_000))
    await requestSchoolAccountCorrection(client, {
      actor: actor(esaoIdentity, esaoMembership, new Date(now.getTime() + 4_500)),
      requestId: second.requestId,
      reason: { code: "ROSTER_REFERENCE_REQUIRED", detail: "Synthetic correction before withdrawal" },
      verification: { outcome: "NEEDS_CORRECTION", reference: "synthetic://roster/p1-15/withdraw-correction" },
    }, new Date(now.getTime() + 4_500))
    const withdrawn = await withdrawSchoolAccountRequest(client, {
      actor: actor(schoolAdmin, schoolMembership, new Date(now.getTime() + 5_000)),
      requestId: second.requestId,
      reason: { code: "REQUEST_CANCELLED", detail: "Synthetic fixture cancellation" },
    }, new Date(now.getTime() + 5_000))
    assert.equal(withdrawn.status, "WITHDRAWN")
    assert.equal((await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: second.targetIdentityId } })).accountStatus, "PENDING")

    for (let index = 0; index < 3; index += 1) {
      await submitSchoolAccountRequest(client, {
        actor: actor(schoolAdmin, schoolMembership, new Date(now.getTime() + (6 + index) * 1_000)),
        schoolId,
        target: { accountIdentifier: `p115-rate-${index}-${suffix}@synthetic.test`, displayName: `P1-15 Rate ${index}` },
        reason: { code: "STAFF_ONBOARDING", detail: "Synthetic rate-limit fixture" },
      }, new Date(now.getTime() + (6 + index) * 1_000))
    }
    await assert.rejects(
      () => submitSchoolAccountRequest(client, {
        actor: actor(schoolAdmin, schoolMembership, new Date(now.getTime() + 10_000)),
        schoolId,
        target: { accountIdentifier: `p115-rate-blocked-${suffix}@synthetic.test`, displayName: "P1-15 Rate Blocked" },
        reason: { code: "STAFF_ONBOARDING", detail: "Synthetic rate-limit fixture" },
      }, new Date(now.getTime() + 10_000)),
      (error: unknown) => error instanceof SchoolAccountRequestRateLimitedError,
    )

    await assert.rejects(
      () => client.$transaction(async (transaction) => {
        const orphanAccountIdentifier = `p115-orphan-${suffix}@synthetic.test`
        const orphanTarget = await transaction.authenticatedIdentity.create({
          data: {
            accountIdentifier: orphanAccountIdentifier,
            displayName: "P1-15 Orphan Request",
            accountStatus: "PENDING",
          },
        })
        await transaction.schoolAccountRequest.create({
          data: {
            id: randomUUID(),
            requesterIdentityId: schoolAdmin.id,
            requesterMembershipId: schoolMembership.id,
            targetIdentityId: orphanTarget.id,
            schoolId,
            requestedRole: "FINANCE_OFFICER",
            targetAccountIdentifier: orphanAccountIdentifier,
            targetDisplayName: orphanTarget.displayName,
            submissionReasonCode: "DIRECT_SQL",
            submissionReasonDetail: "Synthetic direct-write invariant probe",
            status: "SUBMITTED",
            revision: 1,
            lastReasonCode: "DIRECT_SQL",
            lastReasonDetail: "Synthetic direct-write invariant probe",
            submittedAt: new Date(now.getTime() + 11_000),
            createdAt: new Date(now.getTime() + 11_000),
            updatedAt: new Date(now.getTime() + 11_000),
          },
        })
      }),
      (error: unknown) => String(error).includes("matching immutable history"),
    )

    const audits = await client.auditLog.findMany({ where: { targetType: "SchoolAccountRequest", targetId: submitted.requestId }, orderBy: { sequence: "asc" } })
    assert.deepEqual(audits.map((audit) => audit.commandCode), ["AUTH-01", "AUTH-01", "AUTH-03", "AUTH-01", "AUTH-03"])
    assert.equal(esaoConfiguration.configurationId.length > 0, true)
  } finally {
    await client.$disconnect()
  }
})
