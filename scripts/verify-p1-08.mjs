import assert from "node:assert/strict"

import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import { createDatabaseClient } from "./db-client.mjs"

const expectedConstraints = [
  "AuditLog_sequence_check",
  "AuditLog_actor_version_check",
  "AuditLog_command_code_check",
  "AuditLog_target_type_check",
  "AuditLog_target_id_check",
  "AuditLog_reason_code_check",
  "AuditLog_correlation_id_check",
  "AuditLog_previous_digest_shape_check",
  "AuditLog_integrity_digest_shape_check",
]

const expectedIndexes = [
  "AuditLog_sequence_key",
  "AuditLog_integrityDigest_key",
  "AuditLog_scope_sequence_idx",
  "AuditLog_actor_sequence_idx",
  "AuditLog_target_sequence_idx",
]

const expectedTriggers = [
  "AuditLog_assert_insert_integrity",
  "AuditLog_prevent_update",
  "AuditLog_prevent_delete",
  "AuditLog_prevent_truncate",
]

const database = createDatabaseClient({ requestedMode: "test" })

try {
  const tables = await database.client.$queryRaw`
    SELECT table_name AS "name"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'AuditLog'
  `
  assert.equal(tables.length, 1, "P1-08 AuditLog table is missing")

  const constraints = await database.client.$queryRaw`
    SELECT conname AS "name"
    FROM pg_constraint
    WHERE conname = ANY(${expectedConstraints})
  `
  assert.deepEqual(
    constraints.map((constraint) => constraint.name).sort(),
    [...expectedConstraints].sort(),
    "P1-08 AuditLog constraints are incomplete",
  )

  const indexes = await database.client.$queryRaw`
    SELECT indexname AS "name"
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = ANY(${expectedIndexes})
  `
  assert.deepEqual(
    indexes.map((index) => index.name).sort(),
    [...expectedIndexes].sort(),
    "P1-08 AuditLog indexes are incomplete",
  )

  const triggers = await database.client.$queryRaw`
    SELECT trigger."tgname" AS "name"
    FROM pg_trigger trigger
    JOIN pg_class relation ON relation."oid" = trigger."tgrelid"
    JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace"
    WHERE namespace."nspname" = 'public'
      AND NOT trigger."tgisinternal"
      AND trigger."tgname" = ANY(${expectedTriggers})
  `
  assert.deepEqual(
    triggers.map((trigger) => trigger.name).sort(),
    [...expectedTriggers].sort(),
    "P1-08 AuditLog triggers are incomplete",
  )

  const unsafeForeignKeys = await database.client.$queryRaw`
    SELECT constraint_name AS "name"
    FROM information_schema.referential_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE 'AuditLog_%_fkey'
      AND delete_rule <> 'RESTRICT'
  `
  assert.deepEqual(unsafeForeignKeys, [], "P1-08 AuditLog foreign keys must restrict deletion")

  const records = await database.client.auditLog.findMany({ orderBy: { sequence: "asc" } })
  assertAuditLogIntegrity(records)

  console.info("P1-08 audit-log structural and integrity verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-08 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-08 verifier disconnect failed")
    process.exitCode = 1
  })
}
