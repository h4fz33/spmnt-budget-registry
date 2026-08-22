import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import { assertAuditLogIntegrity } from "../../src/lib/audit/core.ts"
import { bootstrapFirstSystemAdmin } from "../../src/lib/bootstrap/first-system-admin.ts"
import { PILOT_ESAO_ORGANIZATION_ID } from "../../src/lib/bootstrap/sesao-auditor.ts"
import {
  applyPolicyPublisherDesignation,
  PolicyPublisherDesignationError,
  PolicyPublisherFreshAuthenticationRequiredError,
  PolicyPublisherReplayError,
  resolveCurrentPolicyPublisher,
} from "../../src/lib/authorization/policy-publisher.ts"

async function ensureSystemAdmin(client: ReturnType<typeof createDatabaseClient>["client"], suffix: string) {
  let bootstrap = await client.systemAdminBootstrap.findUnique({
    where: { id: "p1-17" },
    include: { identity: true, membership: true },
  })
  if (!bootstrap) {
    await bootstrapFirstSystemAdmin(client, {
      accountIdentifier: `p120-system-admin-${suffix}@synthetic.test`,
      password: "P1-20-System-Admin-Password",
    })
    bootstrap = await client.systemAdminBootstrap.findUniqueOrThrow({
      where: { id: "p1-17" },
      include: { identity: true, membership: true },
    })
  }
  return bootstrap
}

async function createInternalAuditIdentity(
  client: ReturnType<typeof createDatabaseClient>["client"],
  suffix: string,
  label: string,
  now: Date,
) {
  return client.authenticatedIdentity.create({
    data: {
      accountIdentifier: `p120-${label}-${suffix}@synthetic.test`,
      displayName: `P1-20 ${label} Internal Audit`,
      accountStatus: "ACTIVE",
      memberships: {
        create: {
          organizationId: PILOT_ESAO_ORGANIZATION_ID,
          status: "ACTIVE",
          effectiveFrom: now,
        },
      },
    },
  })
}

function subject(identity: Readonly<{ id: string; accountIdentifier: string; displayName: string }>, retrievedAt: Date, marker: string) {
  return {
    identityId: identity.id,
    accountIdentifier: identity.accountIdentifier,
    personName: identity.displayName,
    currentStatusEvidence: {
      officialPageUrl: "https://www.sesaonara.go.th/internal-audit/",
      retrievedAt,
      namedPersonResult: `Official Internal Audit Unit result confirms ${identity.displayName}`,
      conflictOutcome: "NO_CONFLICT",
      evidenceReference: `synthetic://p1-20/internal-audit/${marker}`,
      evidenceHash: marker.repeat(64).slice(0, 64),
    },
  }
}

function approval(suffix: string, marker: string) {
  return {
    externalApprovalRecordId: `PO-P1-20-${suffix}-${marker}`,
    approvalAuthorityLabel: "Private Business / Product Owner",
    approvalAuthorityIdentity: "synthetic-product-owner@synthetic.test",
    approvalEvidenceReference: `synthetic://p1-20/approval/${suffix}/${marker}`,
    approvalEvidenceHash: marker.repeat(64).slice(0, 64),
    scopeEvidenceReference: `synthetic://p1-20/scope/${suffix}/${marker}`,
    scopeEvidenceHash: marker.toLowerCase().repeat(64).slice(0, 64),
  }
}

test("P1-20 applies one exact current/standby designation and atomically replaces it", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)

  try {
    const systemAdmin = await ensureSystemAdmin(client, suffix)
    const now = new Date()
    const current = await createInternalAuditIdentity(client, suffix, "current", now)
    const standby = await createInternalAuditIdentity(client, suffix, "standby", now)
    const successorStandby = await createInternalAuditIdentity(client, suffix, "successor", now)
    const actor = {
      identityId: systemAdmin.identityId,
      membershipId: systemAdmin.membershipId,
      accountIdentifier: systemAdmin.identity.accountIdentifier,
      authorizationVersion: systemAdmin.identity.authorizationVersion,
      membershipAuthorizationVersion: systemAdmin.membership.authorizationVersion,
      authenticatedAt: now.getTime(),
    }

    const initial = {
      action: "DESIGNATE" as const,
      actor,
      approval: approval(suffix, "a"),
      current: subject(current, new Date(now.getTime() - 60_000), "a"),
      standby: subject(standby, new Date(now.getTime() - 60_000), "b"),
      effectiveFrom: now,
    }
    const legacyDesignation = await client.policyPublisherDesignation.create({
      data: {
        organizationId: PILOT_ESAO_ORGANIZATION_ID,
        identityId: current.id,
        status: "CURRENT",
        officialPageUrl: initial.current.currentStatusEvidence.officialPageUrl,
        retrievedAt: new Date(now.getTime() - 2 * 60_000),
        namedPersonResult: initial.current.currentStatusEvidence.namedPersonResult,
        conflictOutcome: initial.current.currentStatusEvidence.conflictOutcome,
        evidenceReference: "synthetic://p1-07/legacy-designation",
        evidenceHash: "0".repeat(64),
        effectiveFrom: new Date(now.getTime() - 2 * 60_000),
      },
    })
    const initialResult = await applyPolicyPublisherDesignation(client, initial, now)
    assert.equal(initialResult.action, "DESIGNATE")
    const supersededLegacy = await client.policyPublisherDesignation.findUniqueOrThrow({ where: { id: legacyDesignation.id } })
    assert.equal(supersededLegacy.status, "SUPERSEDED")
    assert.equal(supersededLegacy.supersededAt?.getTime(), now.getTime())
    assert.equal((await resolveCurrentPolicyPublisher(client, { identityId: current.id, authorizationVersion: current.authorizationVersion, now }))?.designationId, initialResult.currentDesignationId)
    assert.equal(await resolveCurrentPolicyPublisher(client, { identityId: standby.id, authorizationVersion: standby.authorizationVersion, now }), null)

    const initialProvenance = await client.policyPublisherDesignationProvenance.findUniqueOrThrow({
      where: { id: initialResult.provenanceId },
      include: { currentDesignation: true, standbyDesignation: true },
    })
    assert.equal(initialProvenance.approvalAuthorityLabel, "Private Business / Product Owner")
    assert.equal(initialProvenance.technicalExecutorIdentityId, systemAdmin.identityId)
    assert.equal(initialProvenance.currentDesignation.identityId, current.id)
    assert.equal(initialProvenance.standbyDesignation.identityId, standby.id)

    await assert.rejects(
      () => applyPolicyPublisherDesignation(client, initial, now),
      (error: unknown) => error instanceof PolicyPublisherReplayError,
    )
    await assert.rejects(
      () => applyPolicyPublisherDesignation(client, { ...initial, approval: approval(suffix, "c"), current: subject(current, new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000), "c") }, now),
      (error: unknown) => error instanceof PolicyPublisherDesignationError && error.code === "STALE_CURRENT_STATUS_EVIDENCE",
    )
    await assert.rejects(
      () => applyPolicyPublisherDesignation(client, { ...initial, action: "REPLACE", actor: { ...actor, authenticatedAt: now.getTime() - 6 * 60_000 }, approval: approval(suffix, "d") }, now),
      (error: unknown) => error instanceof PolicyPublisherFreshAuthenticationRequiredError,
    )

    const replacementAt = new Date(now.getTime() + 60_000)
    const replacement = {
      action: "REPLACE" as const,
      actor: { ...actor, authenticatedAt: replacementAt.getTime() },
      approval: approval(suffix, "e"),
      current: subject(standby, replacementAt, "e"),
      standby: subject(successorStandby, replacementAt, "f"),
      effectiveFrom: replacementAt,
    }
    const replacementResult = await applyPolicyPublisherDesignation(client, replacement, replacementAt)
    assert.equal(replacementResult.action, "REPLACE")

    const superseded = await client.policyPublisherDesignation.findMany({
      where: { id: { in: [initialResult.currentDesignationId, initialResult.standbyDesignationId] } },
      orderBy: { id: "asc" },
    })
    assert.equal(superseded.every((designation) => designation.status === "SUPERSEDED" && designation.supersededAt?.getTime() === replacementAt.getTime()), true)
    assert.equal(await resolveCurrentPolicyPublisher(client, { identityId: current.id, authorizationVersion: current.authorizationVersion, now: replacementAt }), null)
    assert.equal((await resolveCurrentPolicyPublisher(client, { identityId: standby.id, authorizationVersion: standby.authorizationVersion, now: replacementAt }))?.designationId, replacementResult.currentDesignationId)

    const active = await client.policyPublisherDesignation.findMany({
      where: { organizationId: PILOT_ESAO_ORGANIZATION_ID, status: { in: ["CURRENT", "STANDBY"] } },
      orderBy: { status: "asc" },
    })
    assert.deepEqual(active.map((designation) => designation.status), ["CURRENT", "STANDBY"])
    assert.deepEqual(active.map((designation) => designation.identityId).sort(), [standby.id, successorStandby.id].sort())
    await assert.rejects(
      () => client.$executeRaw`UPDATE "PolicyPublisherDesignationProvenance" SET "approvalAuthorityIdentity" = "approvalAuthorityIdentity" WHERE "id" = ${replacementResult.provenanceId}`,
      (error: unknown) => error instanceof Error,
    )

    const audit = await client.auditLog.findUnique({ where: { id: replacementResult.auditEventId } })
    assert.equal(audit?.commandCode, "AUTH-08")
    assert.equal(audit?.actorIdentityId, systemAdmin.identityId)
    assertAuditLogIntegrity(await client.auditLog.findMany({ orderBy: { sequence: "asc" } }))
  } finally {
    await client.$disconnect()
  }
})
