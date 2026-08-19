import assert from "node:assert/strict"
import { createHash, randomUUID } from "node:crypto"
import { test } from "node:test"

import { PILOT_ESAO, seedSchoolDirectory } from "../../prisma/school-directory-seed.mjs"
import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  PolicyPublicationDeniedError,
  PolicyResolutionDeniedError,
  publishPolicyVersion,
  resolvePolicyVersion,
  selectEffectivePolicyVersion,
} from "../../src/lib/policy/core.ts"

const hash = (character: string) => character.repeat(64)
const digest = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds)
}

async function resolveCurrentPublisher(
  client: ReturnType<typeof createDatabaseClient>["client"],
  organizationId: string,
  occurredAt: Date,
  suffix: string,
) {
  let designation = await client.policyPublisherDesignation.findFirst({
    where: { organizationId, status: "CURRENT" },
    include: { identity: true },
  })

  if (!designation) {
    const identity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p107-current-${suffix}@synthetic.test`,
        displayName: `P1-07 current publisher ${suffix}`,
        accountStatus: "ACTIVE",
      },
    })
    designation = await client.policyPublisherDesignation.create({
      data: {
        organizationId,
        identityId: identity.id,
        status: "CURRENT",
        officialPageUrl: "https://www.sesaonara.go.th/internal-audit",
        retrievedAt: addMilliseconds(occurredAt, -60_000),
        namedPersonResult: "Synthetic current Policy Publisher confirmed",
        conflictOutcome: "NO_CONFLICT",
        evidenceReference: `P1-07-current-${suffix}`,
        evidenceHash: hash("a"),
        effectiveFrom: addMilliseconds(occurredAt, -60_000),
      },
      include: { identity: true },
    })
  }

  const membership = await client.approvedMembership.findFirst({
    where: {
      identityId: designation.identityId,
      organizationId,
      status: "ACTIVE",
      effectiveFrom: { lte: occurredAt },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: occurredAt } }],
    },
  })
  const activeMembership = membership ?? (await client.approvedMembership.create({
    data: {
      identityId: designation.identityId,
      organizationId,
      effectiveFrom: addMilliseconds(occurredAt, -60_000),
    },
  }))

  return { designation, membership: activeMembership }
}

test("P1-07 publishes a complete directory scope, rejects ambiguity, and preserves historical resolution", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 14)
  const policySuffix = suffix.toUpperCase()

  try {
    await seedSchoolDirectory(client, { esaoCode: PILOT_ESAO.code })
    const now = new Date()
    const organizationId = PILOT_ESAO.organizationId
    const publisher = await resolveCurrentPublisher(client, organizationId, now, suffix)
    const existingActive = await client.policyVersion.findFirst({
      where: { organizationId, status: "ACTIVE" },
      orderBy: { effectiveFrom: "desc" },
    })
    const firstEffectiveAt = addMilliseconds(
      new Date(Math.max(now.getTime(), existingActive?.effectiveFrom.getTime() ?? 0)),
      24 * 60 * 60 * 1000,
    )
    const secondEffectiveAt = addMilliseconds(firstEffectiveAt, 24 * 60 * 60 * 1000)
    const firstPolicyId = `POL-P107-${policySuffix}-A`
    const secondPolicyId = `POL-P107-${policySuffix}-B`

    const firstPublication = await publishPolicyVersion(client, {
      policyVersionId: firstPolicyId,
      organizationId,
      actorIdentityId: publisher.designation.identityId,
      actorMembershipId: publisher.membership.id,
      freshAuthenticatedAt: addMilliseconds(now, -60_000),
      effectiveFrom: firstEffectiveAt,
      sources: [
        {
          sourceReference: `synthetic://p1-07/${suffix}/initial`,
          sourceRevision: "initial",
          contentHash: hash("b"),
        },
      ],
      supersedesPolicyVersionId: existingActive?.policyVersionId ?? null,
      correlationId: `p107-${suffix}-a`,
      occurredAt: now,
    })
    assert.equal(firstPublication.policyVersion.status, "ACTIVE")
    assert.equal(firstPublication.policyVersion.schoolScopes.length, 17)
    assert.equal(firstPublication.auditEvent.commandCode, "AUTH-22")
    assert.equal(firstPublication.auditEvent.reasonCode, "POLICY_VERSION_ACTIVATED")

    const school = await client.school.findFirstOrThrow({
      where: { organization: { parentOrganizationId: organizationId } },
    })
    const earliestScopedPolicy = await client.policyVersion.findFirst({
      where: {
        organizationId,
        status: { in: ["ACTIVE", "SUPERSEDED"] },
        schoolScopes: { some: { schoolId: school.organizationId } },
      },
      orderBy: { effectiveFrom: "asc" },
    })
    const missingEffectiveAt = addMilliseconds(earliestScopedPolicy?.effectiveFrom ?? firstEffectiveAt, -1)
    const firstTarget = `P107-${suffix}-HISTORICAL`
    const historicalResolution = await resolvePolicyVersion(client, {
      schoolId: school.organizationId,
      subjectCode: "FF-01",
      targetType: "FinancialEvent",
      targetId: firstTarget,
      effectiveAt: addMilliseconds(firstEffectiveAt, 60_000),
      resolvedAt: addMilliseconds(now, 1_000),
    })
    assert.equal(historicalResolution.policyVersion.policyVersionId, firstPolicyId)

    const secondPublication = await publishPolicyVersion(client, {
      policyVersionId: secondPolicyId,
      organizationId,
      actorIdentityId: publisher.designation.identityId,
      actorMembershipId: publisher.membership.id,
      freshAuthenticatedAt: addMilliseconds(now, -30_000),
      effectiveFrom: secondEffectiveAt,
      sources: [
        {
          sourceReference: `synthetic://p1-07/${suffix}/replacement`,
          sourceRevision: "replacement",
          contentHash: hash("c"),
        },
      ],
      supersedesPolicyVersionId: firstPolicyId,
      correlationId: `p107-${suffix}-b`,
      occurredAt: addMilliseconds(now, 2_000),
    })
    assert.equal(secondPublication.policyVersion.status, "ACTIVE")

    const historicalRepeat = await resolvePolicyVersion(client, {
      schoolId: school.organizationId,
      subjectCode: "FF-01",
      targetType: "FinancialEvent",
      targetId: firstTarget,
      effectiveAt: addMilliseconds(firstEffectiveAt, 60_000),
      resolvedAt: addMilliseconds(now, 3_000),
    })
    assert.equal(historicalRepeat.policyVersion.policyVersionId, firstPolicyId)
    assert.equal(historicalRepeat.resolution.id, historicalResolution.resolution.id)

    const futureResolution = await resolvePolicyVersion(client, {
      schoolId: school.organizationId,
      subjectCode: "FF-01",
      targetType: "FinancialEvent",
      targetId: `P107-${suffix}-FUTURE`,
      effectiveAt: addMilliseconds(secondEffectiveAt, 60_000),
      resolvedAt: addMilliseconds(now, 4_000),
    })
    assert.equal(futureResolution.policyVersion.policyVersionId, secondPolicyId)

    await assert.rejects(
      () =>
        resolvePolicyVersion(client, {
          schoolId: school.organizationId,
          subjectCode: "FF-01",
          targetType: "FinancialEvent",
          targetId: `P107-${suffix}-MISSING`,
          effectiveAt: missingEffectiveAt,
          resolvedAt: addMilliseconds(now, 5_000),
        }),
      (error: unknown) =>
        error instanceof PolicyResolutionDeniedError && error.code === "MISSING_EFFECTIVE_POLICY_VERSION",
    )
    assert.throws(
      () => selectEffectivePolicyVersion([{ policyVersionId: firstPolicyId }, { policyVersionId: secondPolicyId }]),
      (error: unknown) =>
        error instanceof PolicyResolutionDeniedError && error.code === "AMBIGUOUS_EFFECTIVE_POLICY_VERSION",
    )

    const overlapDraftId = randomUUID()
    await client.policyVersion.create({
      data: {
        id: overlapDraftId,
        policyVersionId: `POL-P107-${policySuffix}-OVERLAP`,
        organizationId,
        status: "DRAFT",
        effectiveFrom: addMilliseconds(secondEffectiveAt, 60_000),
        publisherDesignationId: publisher.designation.id,
        publisherIdentityId: publisher.designation.identityId,
        sourceIntegrityDigest: digest(`${suffix}-overlap-source`),
        integrityDigest: digest(`${suffix}-overlap-version`),
      },
    })
    await client.policyVersionSourceEvidence.create({
      data: {
        policyVersionId: overlapDraftId,
        sourceReference: `synthetic://p1-07/${suffix}/overlap`,
        contentHash: hash("f"),
      },
    })
    await client.policyVersionSchoolScope.createMany({
      data: secondPublication.policyVersion.schoolScopes.map((scope) => ({
        policyVersionId: overlapDraftId,
        schoolId: scope.schoolId,
      })),
    })
    await assert.rejects(
      () =>
        client.policyVersion.update({
          where: { id: overlapDraftId },
          data: { status: "ACTIVE", activatedAt: addMilliseconds(now, 6_000) },
        }),
      (error: unknown) => error instanceof Error,
    )
    await assert.rejects(
      () =>
        client.policyVersionSourceEvidence.create({
          data: {
            policyVersionId: secondPublication.policyVersion.id,
            sourceReference: `synthetic://p1-07/${suffix}/after-activation`,
            contentHash: hash("f"),
          },
        }),
      (error: unknown) => error instanceof Error,
    )
    await assert.rejects(
      () =>
        client.policyResolutionRecord.update({
          where: { id: historicalResolution.resolution.id },
          data: { subjectCode: "FF-02" },
        }),
      (error: unknown) => error instanceof Error,
    )

    let standby = await client.policyPublisherDesignation.findFirst({
      where: { organizationId, status: "STANDBY" },
    })
    if (!standby) {
      const standbyIdentity = await client.authenticatedIdentity.create({
        data: {
          accountIdentifier: `p107-standby-${suffix}@synthetic.test`,
          displayName: `P1-07 standby ${suffix}`,
          accountStatus: "ACTIVE",
        },
      })
      standby = await client.policyPublisherDesignation.create({
        data: {
          organizationId,
          identityId: standbyIdentity.id,
          status: "STANDBY",
          officialPageUrl: "https://www.sesaonara.go.th/internal-audit",
          retrievedAt: addMilliseconds(now, -60_000),
          namedPersonResult: "Synthetic standby Policy Publisher confirmed",
          conflictOutcome: "NO_CONFLICT",
          evidenceReference: `P1-07-standby-${suffix}`,
          evidenceHash: hash("9"),
          effectiveFrom: addMilliseconds(now, -60_000),
        },
      })
    }
    const existingStandbyMembership = await client.approvedMembership.findFirst({
      where: {
        identityId: standby.identityId,
        organizationId,
        status: "ACTIVE",
        effectiveFrom: { lte: addMilliseconds(now, 7_000) },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: addMilliseconds(now, 7_000) } }],
      },
    })
    const standbyMembership = existingStandbyMembership ?? (await client.approvedMembership.create({
      data: {
        identityId: standby.identityId,
        organizationId,
        effectiveFrom: addMilliseconds(now, -60_000),
      },
    }))
    await assert.rejects(
      () =>
        publishPolicyVersion(client, {
          policyVersionId: `POL-P107-${policySuffix}-DENIED`,
          organizationId,
          actorIdentityId: standby.identityId,
          actorMembershipId: standbyMembership.id,
          freshAuthenticatedAt: now,
          effectiveFrom: addMilliseconds(secondEffectiveAt, 24 * 60 * 60 * 1000),
          sources: [{ sourceReference: `synthetic://p1-07/${suffix}/standby`, contentHash: hash("8") }],
          supersedesPolicyVersionId: secondPolicyId,
          occurredAt: addMilliseconds(now, 7_000),
        }),
      (error: unknown) =>
        error instanceof PolicyPublicationDeniedError && error.code === "CURRENT_POLICY_PUBLISHER_REQUIRED",
    )
  } finally {
    await client.$disconnect()
  }
})
