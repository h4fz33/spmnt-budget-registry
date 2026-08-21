import assert from "node:assert/strict"

import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import { createDatabaseClient } from "./db-client.mjs"

const expectedConstraints = [
  "SchoolAdminBootstrap_pkey",
  "SchoolAdminBootstrap_singleton_check",
  "SchoolAdminBootstrap_status_shape_check",
  "SchoolAdminBootstrapManifestRow_role_check",
  "SchoolAdminBootstrapProvenance_bootstrapId_action_key",
  "SchoolAdminBootstrapProvenance_approval_check",
]
const expectedIndexes = [
  "SchoolAdminBootstrapManifestRow_bootstrapId_rowNumber_key",
  "SchoolAdminBootstrapManifestRow_bootstrapId_schoolId_key",
  "SchoolAdminBootstrapManifestRow_bootstrapId_accountIdentifier_k",
  "SchoolAdminBootstrapManifestRow_bootstrapId_rowDigest_key",
  "SchoolAdminBootstrapManifestRow_schoolId_accountIdentifier_idx",
  "SchoolAdminBootstrapProvenance_bootstrapId_action_key",
]
const expectedTriggers = [
  "SchoolAdminBootstrap_prevent_mutation",
  "SchoolAdminBootstrapManifestRow_prevent_mutation",
  "SchoolAdminBootstrapProvenance_prevent_mutation",
  "SchoolAdminBootstrap_assert_shape",
  "SchoolAdminBootstrapProvenance_assert_shape",
]
const constraintNames = expectedConstraints.map((name) => name.slice(0, 63))

const database = createDatabaseClient({ requestedMode: "test" })
try {
  const [constraints, indexes, triggers, bootstrap] = await Promise.all([
    database.client.$queryRaw`SELECT conname AS "name" FROM pg_constraint WHERE conname = ANY(${constraintNames})`,
    database.client.$queryRaw`SELECT indexname AS "name" FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY(${expectedIndexes})`,
    database.client.$queryRaw`SELECT trigger."tgname" AS "name" FROM pg_trigger trigger JOIN pg_class relation ON relation."oid" = trigger."tgrelid" JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace" WHERE namespace."nspname" = 'public' AND NOT trigger."tgisinternal" AND trigger."tgname" = ANY(${expectedTriggers})`,
    database.client.schoolAdminBootstrap.findUnique({ where: { id: "p1-21" }, include: { manifestRows: true, provenance: { orderBy: { action: "asc" } } } }),
  ])
  assert.deepEqual(constraints.map((row) => row.name).sort(), constraintNames.sort())
  assert.deepEqual(indexes.map((row) => row.name).sort(), expectedIndexes.sort())
  assert.deepEqual(triggers.map((row) => row.name).sort(), expectedTriggers.sort())
  assert.ok(bootstrap, "P1-21 bootstrap is missing")
  assert.equal(bootstrap.status, "EXECUTED")
  assert.equal(bootstrap.manifestRows.length, 17)
  assert.equal(new Set(bootstrap.manifestRows.map((row) => row.schoolId)).size, 17)
  assert.equal(bootstrap.manifestRows.every((row) => row.roleCode === "SCHOOL_ADMIN"), true)
  assert.equal(bootstrap.manifestRows.every((row) => row.accountIdentifier.endsWith("@synthetic.test")), true)
  assert.deepEqual(bootstrap.provenance.map((record) => record.action), ["APPROVE", "EXECUTE"])
  for (const record of bootstrap.provenance) {
    assert.equal(record.manifestDigest, bootstrap.manifestDigest)
    assert.equal(record.approvalAuthorityLabel, "ESAO Admin")
    const audit = await database.client.auditLog.findFirst({ where: { commandCode: "AUTH-09", targetType: "SchoolAdminBootstrap", targetId: "p1-21", outcome: "SUCCESS", actorIdentityId: record.actorIdentityId, actorMembershipId: record.actorMembershipId, correlationId: record.externalApprovalRecordId } })
    assert.ok(audit, `P1-21 ${record.action} provenance lacks matching audit evidence`)
  }
  assertAuditLogIntegrity(await database.client.auditLog.findMany({ orderBy: { sequence: "asc" } }))
  console.info("P1-21 School Admin bootstrap verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-21 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-21 verifier disconnect failed")
    process.exitCode = 1
  })
}
