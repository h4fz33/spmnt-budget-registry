import assert from "node:assert/strict"

import { createDatabaseClient } from "./db-client.mjs"

const expectedTables = ["ScopedNumberSequence", "ScopedNumberAllocation"]
const expectedConstraints = [
  "ScopedNumberSequence_schoolId_buddhistFiscalYear_registerCode_k",
  "ScopedNumberSequence_register_code_check",
  "ScopedNumberSequence_next_value_check",
  "ScopedNumberAllocation_sequenceId_value_key",
  "ScopedNumberAllocation_value_check",
]
const expectedTriggers = [
  "ScopedNumberSequence_assert_transition",
  "ScopedNumberSequence_assert_consistency",
  "ScopedNumberSequence_prevent_truncate",
  "ScopedNumberAllocation_assert_consistency",
  "ScopedNumberAllocation_prevent_update",
  "ScopedNumberAllocation_prevent_delete",
  "ScopedNumberAllocation_prevent_truncate",
]
const expectedForeignKeys = [
  "ScopedNumberSequence_schoolId_fkey",
  "ScopedNumberSequence_fiscal_year_fkey",
  "ScopedNumberAllocation_sequenceId_fkey",
]

const database = createDatabaseClient({ requestedMode: "test" })

try {
  const [tables, constraints, triggers, foreignKeys] = await Promise.all([
    database.client.$queryRaw`
      SELECT table_name AS "name"
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY(${expectedTables})
    `,
    database.client.$queryRaw`
      SELECT conname AS "name"
      FROM pg_constraint
      WHERE conname = ANY(${expectedConstraints})
    `,
    database.client.$queryRaw`
      SELECT trigger."tgname" AS "name"
      FROM pg_trigger trigger
      JOIN pg_class relation ON relation."oid" = trigger."tgrelid"
      JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace"
      WHERE namespace."nspname" = 'public'
        AND NOT trigger."tgisinternal"
        AND trigger."tgname" = ANY(${expectedTriggers})
    `,
    database.client.$queryRaw`
      SELECT
        constraint_name AS "name",
        delete_rule AS "deleteRule",
        update_rule AS "updateRule"
      FROM information_schema.referential_constraints
      WHERE constraint_schema = 'public'
        AND constraint_name = ANY(${expectedForeignKeys})
    `,
  ])

  assert.deepEqual(tables.map((table) => table.name).sort(), [...expectedTables].sort())
  assert.deepEqual(constraints.map((constraint) => constraint.name).sort(), [...expectedConstraints].sort())
  assert.deepEqual(triggers.map((trigger) => trigger.name).sort(), [...expectedTriggers].sort())
  assert.deepEqual(
    foreignKeys.map((foreignKey) => foreignKey.name).sort(),
    [...expectedForeignKeys].sort(),
  )
  assert.deepEqual(
    foreignKeys.filter(
      (foreignKey) => foreignKey.deleteRule !== "RESTRICT" || foreignKey.updateRule !== "RESTRICT",
    ),
    [],
    "P1-10 foreign keys must restrict update and deletion",
  )

  console.info("P1-10 scoped-numbering structural verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-10 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-10 verifier disconnect failed")
    process.exitCode = 1
  })
}
