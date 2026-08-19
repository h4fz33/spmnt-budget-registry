import assert from "node:assert/strict"

import { createDatabaseClient } from "./db-client.mjs"

const expectedTables = ["CommandIdempotencyRecord", "OutboxMessage", "OutboxDeliveryAttempt"]
const expectedConstraints = [
  "CommandIdempotencyRecord_scoped_key",
  "CommandIdempotencyRecord_scope_shape_check",
  "CommandIdempotencyRecord_request_digest_check",
  "OutboxMessage_deduplicationKey_key",
  "OutboxMessage_status_shape_check",
  "OutboxMessage_delivery_attempts_check",
  "OutboxDeliveryAttempt_messageId_attemptNumber_key",
  "OutboxDeliveryAttempt_outcome_shape_check",
]
const expectedTriggers = [
  "CommandIdempotencyRecord_assert_scope",
  "CommandIdempotencyRecord_prevent_update",
  "CommandIdempotencyRecord_prevent_delete",
  "CommandIdempotencyRecord_prevent_truncate",
  "OutboxMessage_assert_transition",
  "OutboxMessage_assert_abandoned_lease_attempt",
  "OutboxMessage_prevent_truncate",
  "OutboxDeliveryAttempt_assert_message_state",
  "OutboxDeliveryAttempt_prevent_update",
  "OutboxDeliveryAttempt_prevent_delete",
  "OutboxDeliveryAttempt_prevent_truncate",
]

const database = createDatabaseClient({ requestedMode: "test" })

try {
  const [tables, constraints, triggers, outcomes, unsafeForeignKeys] = await Promise.all([
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
      SELECT enumlabel AS "name"
      FROM pg_enum
      JOIN pg_type ON pg_type."oid" = pg_enum.enumtypid
      WHERE pg_type.typname = 'OutboxDeliveryOutcome'
    `,
    database.client.$queryRaw`
      SELECT constraint_name AS "name"
      FROM information_schema.referential_constraints
      WHERE constraint_schema = 'public'
        AND constraint_name IN (
          'CommandIdempotencyRecord_actorIdentityId_fkey',
          'CommandIdempotencyRecord_actorMembershipId_fkey',
          'CommandIdempotencyRecord_scopeOrganizationId_fkey',
          'CommandIdempotencyRecord_scopeSchoolId_fkey',
          'OutboxDeliveryAttempt_messageId_fkey'
        )
        AND delete_rule <> 'RESTRICT'
    `,
  ])

  assert.deepEqual(
    tables.map((table) => table.name).sort(),
    [...expectedTables].sort(),
    "P1-09 reliability tables are incomplete",
  )
  assert.deepEqual(
    constraints.map((constraint) => constraint.name).sort(),
    [...expectedConstraints].sort(),
    "P1-09 reliability constraints are incomplete",
  )
  assert.deepEqual(
    triggers.map((trigger) => trigger.name).sort(),
    [...expectedTriggers].sort(),
    "P1-09 reliability triggers are incomplete",
  )
  assert.deepEqual(
    outcomes.map((outcome) => outcome.name).sort(),
    ["ABANDONED", "DEAD_LETTERED", "DELIVERED", "RETRY_SCHEDULED"],
    "P1-09 outbox delivery outcomes are incomplete",
  )
  assert.deepEqual(unsafeForeignKeys, [], "P1-09 foreign keys must restrict deletion")

  console.info("P1-09 reliability structural verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-09 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-09 verifier disconnect failed")
    process.exitCode = 1
  })
}
