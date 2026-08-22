import assert from "node:assert/strict"

import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import { createDatabaseClient } from "./db-client.mjs"

const expectedConstraints = [
  "PolicyPublisherDesignationProvenance_pkey",
  // PostgreSQL truncates identifiers to NAMEDATALEN - 1 (63 characters).
  "PolicyPublisherDesignationProvenance_externalApprovalRecordId_k",
  "PolicyPublisherDesignationProvenance_integrityDigest_key",
  "PolicyPublisherDesignationProvenance_approval_check",
  "PolicyPublisherDesignationProvenance_scope_check",
  "PolicyPublisherDesignationProvenance_organizationId_fkey",
  "PolicyPublisherDesignationProvenance_currentDesignationId_fkey",
  "PolicyPublisherDesignationProvenance_standbyDesignationId_fkey",
  "PolicyPublisherDesignationProvenance_technicalExecutorIdentityI",
  "PolicyPublisherDesignationProvenance_technicalExecutorMembershi",
]
const expectedIndexes = [
  "PolicyPublisherDesignationProvenance_externalApprovalRecordId_k",
  "PolicyPublisherDesignationProvenance_integrityDigest_key",
  "PolicyPublisherDesignationProvenance_organizationId_action_exec",
]
const expectedTriggers = [
  "PolicyPublisherDesignationProvenance_prevent_mutation",
  "PolicyPublisherDesignationProvenance_assert_shape",
]

const database = createDatabaseClient({ requestedMode: "test" })
try {
  const [constraints, indexes, triggers] = await Promise.all([
    database.client.$queryRaw`SELECT conname AS "name" FROM pg_constraint WHERE conname = ANY(${expectedConstraints})`,
    database.client.$queryRaw`SELECT indexname AS "name" FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY(${expectedIndexes})`,
    database.client.$queryRaw`SELECT trigger."tgname" AS "name" FROM pg_trigger trigger JOIN pg_class relation ON relation."oid" = trigger."tgrelid" JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace" WHERE namespace."nspname" = 'public' AND NOT trigger."tgisinternal" AND trigger."tgname" = ANY(${expectedTriggers})`,
  ])
  assert.deepEqual(constraints.map((row) => row.name).sort(), expectedConstraints.sort())
  assert.deepEqual(indexes.map((row) => row.name).sort(), expectedIndexes.sort())
  assert.deepEqual(triggers.map((row) => row.name).sort(), expectedTriggers.sort())

  const provenances = await database.client.policyPublisherDesignationProvenance.findMany({
    include: { currentDesignation: true, standbyDesignation: true },
    orderBy: { executedAt: "asc" },
  })
  assert.ok(provenances.length >= 1, "P1-20 requires immutable designation provenance")
  for (const provenance of provenances) {
    assert.equal(provenance.approvalAuthorityLabel, "Private Business / Product Owner")
    assert.notEqual(provenance.currentDesignation.identityId, provenance.standbyDesignation.identityId)
    assert.notEqual(provenance.technicalExecutorIdentityId, provenance.currentDesignation.identityId)
    assert.notEqual(provenance.technicalExecutorIdentityId, provenance.standbyDesignation.identityId)
    const audit = await database.client.auditLog.findFirst({
      where: {
        commandCode: "AUTH-08",
        targetType: "PolicyPublisherDesignationProvenance",
        targetId: provenance.id,
        outcome: "SUCCESS",
        actorIdentityId: provenance.technicalExecutorIdentityId,
        actorMembershipId: provenance.technicalExecutorMembershipId,
        scopeKind: "PLATFORM",
      },
    })
    assert.ok(audit, "P1-20 provenance requires separately attributable System Admin execution audit")
  }

  const active = await database.client.policyPublisherDesignation.findMany({
    where: { status: { in: ["CURRENT", "STANDBY"] } },
    orderBy: { status: "asc" },
  })
  assert.deepEqual(active.map((designation) => designation.status), ["CURRENT", "STANDBY"])
  assert.notEqual(active[0]?.identityId, active[1]?.identityId)
  assertAuditLogIntegrity(await database.client.auditLog.findMany({ orderBy: { sequence: "asc" } }))
  console.info("P1-20 Policy Publisher designation verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-20 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-20 verifier disconnect failed")
    process.exitCode = 1
  })
}
