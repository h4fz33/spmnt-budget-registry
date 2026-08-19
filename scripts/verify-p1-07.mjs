import assert from "node:assert/strict"

import { createDatabaseClient } from "./db-client.mjs"

const expectedTables = [
  "PolicyPublisherDesignation",
  "PolicyVersion",
  "PolicyVersionSourceEvidence",
  "PolicyVersionSchoolScope",
  "PolicyResolutionRecord",
]

const expectedConstraints = [
  "PolicyPublisherDesignation_official_page_check",
  "PolicyPublisherDesignation_evidence_hash_check",
  "PolicyPublisherDesignation_status_dates_check",
  "PolicyVersion_identifier_check",
  "PolicyVersion_effective_range_check",
  "PolicyVersion_status_check",
  "PolicyVersionSourceEvidence_content_hash_check",
  "PolicyResolutionRecord_integrity_digest_check",
]

const expectedIndexes = [
  "PolicyPublisherDesignation_one_current_per_organization",
  "PolicyPublisherDesignation_one_standby_per_organization",
  "PolicyVersion_policyVersionId_key",
  "PolicyVersion_integrityDigest_key",
  "PolicyVersionSchoolScope_schoolId_policyVersionId_idx",
  "PolicyResolutionRecord_targetType_targetId_key",
]

const expectedTriggers = [
  "PolicyPublisherDesignation_assert_scope",
  "PolicyVersion_assert_publication",
  "PolicyVersion_assert_activation_audit",
  "PolicyVersionSourceEvidence_assert_draft",
  "PolicyVersionSchoolScope_assert_draft",
  "PolicyResolutionRecord_assert_effective_scope",
  "PolicyVersion_preserve_history",
  "PolicyResolutionRecord_prevent_update",
  "PolicyResolutionRecord_prevent_delete",
]

const database = createDatabaseClient({ requestedMode: "test" })

try {
  const tables = await database.client.$queryRaw`
    SELECT table_name AS "name"
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY(${expectedTables})
  `
  assert.deepEqual(
    tables.map((table) => table.name).sort(),
    [...expectedTables].sort(),
    "P1-07 policy tables are incomplete",
  )

  const constraints = await database.client.$queryRaw`
    SELECT conname AS "name"
    FROM pg_constraint
    WHERE conname = ANY(${expectedConstraints})
  `
  assert.deepEqual(
    constraints.map((constraint) => constraint.name).sort(),
    [...expectedConstraints].sort(),
    "P1-07 policy constraints are incomplete",
  )

  const indexes = await database.client.$queryRaw`
    SELECT indexname AS "name"
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = ANY(${expectedIndexes})
  `
  assert.deepEqual(
    indexes.map((index) => index.name).sort(),
    [...expectedIndexes].sort(),
    "P1-07 policy indexes are incomplete",
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
    "P1-07 policy triggers are incomplete",
  )

  const unsafeForeignKeys = await database.client.$queryRaw`
    SELECT constraint_name AS "name"
    FROM information_schema.referential_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE 'Policy%_fkey'
      AND delete_rule <> 'RESTRICT'
  `
  assert.deepEqual(unsafeForeignKeys, [], "P1-07 policy foreign keys must restrict deletion")

  console.info("P1-07 policy publication structural verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-07 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-07 verifier disconnect failed")
    process.exitCode = 1
  })
}
