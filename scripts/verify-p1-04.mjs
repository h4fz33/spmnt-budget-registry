import assert from "node:assert/strict"

import { createDatabaseClient } from "./db-client.mjs"

const expectedTables = [
  "Organization",
  "School",
  "AuthenticatedIdentity",
  "ApprovedMembership",
  "SchoolRoleAssignment",
  "FiscalYear",
  "ActiveDirectorAvailability",
  "SubstituteDirectorAuthority",
  "SubstituteDirectorAuthorityLifecycle",
]

const expectedConstraints = [
  "Organization_parent_shape_check",
  "AuthenticatedIdentity_normalized_identifier_check",
  "ApprovedMembership_effective_range_check",
  "SchoolRoleAssignment_effective_range_check",
  "FiscalYear_dates_check",
  "SubstituteDirectorAuthority_fixed_command_scope_check",
  "SubstituteDirectorAuthority_reason_shape_check",
]

const expectedIndexes = [
  "ApprovedMembership_one_active_identity_organization",
  "SchoolRoleAssignment_one_active_director_per_school",
  "ActiveDirectorAvailability_one_unavailable_per_school",
  "SubstituteDirectorAuthority_one_in_force_tier_per_school",
]

const expectedTriggers = [
  "SchoolRoleAssignment_assert_scope_and_overlap",
  "SubstituteDirectorAuthority_assert_scope_and_overlap",
  "SubstituteDirectorAuthority_prevent_delete",
  "SubstituteDirectorAuthorityLifecycle_prevent_update",
]

const database = createDatabaseClient({ requestedMode: "test" })

try {
  const tables = await database.client.$queryRaw`
    SELECT table_name AS "name"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY(${expectedTables})
  `
  assert.deepEqual(
    tables.map((table) => table.name).sort(),
    [...expectedTables].sort(),
    "P1-04 tables are incomplete",
  )

  const constraints = await database.client.$queryRaw`
    SELECT conname AS "name"
    FROM pg_constraint
    WHERE conname = ANY(${expectedConstraints})
  `
  assert.deepEqual(
    constraints.map((constraint) => constraint.name).sort(),
    [...expectedConstraints].sort(),
    "P1-04 check constraints are incomplete",
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
    "P1-04 partial indexes are incomplete",
  )

  const triggers = await database.client.$queryRaw`
    SELECT DISTINCT trigger_name AS "name"
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND trigger_name = ANY(${expectedTriggers})
  `
  assert.deepEqual(
    triggers.map((trigger) => trigger.name).sort(),
    [...expectedTriggers].sort(),
    "P1-04 integrity triggers are incomplete",
  )

  const unsafeForeignKeys = await database.client.$queryRaw`
    SELECT constraint_name AS "name"
    FROM information_schema.referential_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE 'SchoolRoleAssignment_%_fkey'
      AND delete_rule <> 'RESTRICT'
  `
  assert.deepEqual(unsafeForeignKeys, [], "P1-04 role foreign keys must restrict deletion")

  console.info("P1-04 structural persistence verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-04 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-04 verifier disconnect failed")
    process.exitCode = 1
  })
}
