import assert from "node:assert/strict"

import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import { createDatabaseClient } from "./db-client.mjs"

const constraintNames = [
  "SchoolAccountRequest_pkey",
  "SchoolAccountRequest_role_check",
  "SchoolAccountRequest_target_distinct_check",
  "SchoolAccountRequest_account_check",
  "SchoolAccountRequest_text_check",
  "SchoolAccountRequest_revision_check",
  "SchoolAccountRequest_verification_check",
  "SchoolAccountRequest_status_shape_check",
  "SchoolAccountRequestHistory_pkey",
  "SchoolAccountRequestHistory_requestId_revision_key",
  "SchoolAccountRequestHistory_integrityDigest_key",
  "SchoolAccountRequestHistory_role_check",
  "SchoolAccountRequestHistory_account_check",
  "SchoolAccountRequestHistory_text_check",
  "SchoolAccountRequestHistory_revision_check",
  "SchoolAccountRequestHistory_verification_check",
  "SchoolAccountRequestRateLimit_pkey",
  "SchoolAccountRequestRateLimit_attempt_check",
].map((name) => name.slice(0, 63))

const indexNames = [
  "SchoolAccountRequest_schoolId_status_updatedAt_idx",
  "SchoolAccountRequest_requesterIdentityId_schoolId_status_idx",
  "SchoolAccountRequest_targetIdentityId_status_idx",
  "SchoolAccountRequest_targetAccountIdentifier_nonterminal_key",
  "SchoolAccountRequest_targetIdentityId_nonterminal_key",
  "SchoolAccountRequestHistory_requestId_occurredAt_idx",
  "SchoolAccountRequestHistory_actorIdentityId_occurredAt_idx",
  "SchoolAccountRequestRateLimit_schoolId_windowStartedAt_idx",
].map((name) => name.slice(0, 63))

const triggerNames = [
  "SchoolAccountRequest_prevent_mutation",
  "SchoolAccountRequestHistory_prevent_mutation",
  "SchoolAccountRequestHistory_assert_shape",
  "SchoolAccountRequest_assert_shape",
]

const database = createDatabaseClient({ requestedMode: "test" })
try {
  const [constraints, indexes, triggers, partialIndexes, columns] = await Promise.all([
    database.client.$queryRaw`SELECT conname AS "name" FROM pg_constraint WHERE conname = ANY(${constraintNames})`,
    database.client.$queryRaw`SELECT indexname AS "name" FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY(${indexNames})`,
    database.client.$queryRaw`SELECT trigger."tgname" AS "name" FROM pg_trigger trigger JOIN pg_class relation ON relation."oid" = trigger."tgrelid" JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace" WHERE namespace."nspname" = 'public' AND NOT trigger."tgisinternal" AND trigger."tgname" = ANY(${triggerNames})`,
    database.client.$queryRaw`SELECT indexname AS "name", indexdef AS "definition" FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'SchoolAccountRequest' AND indexname LIKE 'SchoolAccountRequest_target%nonterminal%'`,
    database.client.$queryRaw`SELECT column_name AS "name" FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('SchoolAccountRequest', 'SchoolAccountRequestHistory') AND (column_name ILIKE '%password%' OR column_name ILIKE '%hash%' OR column_name ILIKE '%activation%' OR column_name ILIKE '%recovery%')`,
  ])
  assert.deepEqual(constraints.map((row) => row.name).sort(), constraintNames.sort())
  assert.deepEqual(indexes.map((row) => row.name).sort(), indexNames.sort())
  assert.deepEqual(triggers.map((row) => row.name).sort(), triggerNames.sort())
  assert.equal(partialIndexes.length, 2)
  assert.equal(partialIndexes.every((row) => /WHERE/i.test(row.definition) && /status/i.test(row.definition)), true)
  assert.equal(columns.length, 0, "P1-15 request and history tables must not contain credential fields")

  const requests = await database.client.schoolAccountRequest.findMany({
    orderBy: { createdAt: "asc" },
    include: { history: { orderBy: { revision: "asc" } }, target: { include: { memberships: { include: { roleAssignments: true } } } } },
  })
  for (const request of requests) {
    assert.equal(request.requestedRole, "FINANCE_OFFICER")
    assert.match(request.targetAccountIdentifier, /^[^@\s]+@synthetic\.test$/)
    assert.equal(request.targetAccountIdentifier, request.targetAccountIdentifier.toLowerCase())
    assert.equal(request.history.length >= 2, true)
    assert.equal(request.target.passwordHash, null)
    assert.equal(request.target.passwordChangedAt, null)
    assert.equal(request.history.every((entry) => entry.integrityDigest.length === 64), true)
    if (request.status === "APPROVED") {
      assert.equal(request.target.accountStatus, "ACTIVE")
      assert.equal(request.target.memberships.length, 1)
      assert.equal(request.target.memberships[0]?.organizationId, request.schoolId)
      assert.deepEqual(request.target.memberships[0]?.roleAssignments.map((assignment) => assignment.role), ["FINANCE_OFFICER"])
    } else {
      assert.equal(request.target.accountStatus, "PENDING")
      assert.equal(request.target.memberships.length, 0)
    }
  }

  assertAuditLogIntegrity(await database.client.auditLog.findMany({ orderBy: { sequence: "asc" } }))
  console.info("P1-15 School Account Request verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-15 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-15 verifier disconnect failed")
    process.exitCode = 1
  })
}
