import assert from "node:assert/strict"

import { createDatabaseClient } from "./db-client.mjs"

const database = createDatabaseClient({ requestedMode: "test" })

try {
  const constraints = await database.client.$queryRaw`
    SELECT conname AS "name"
    FROM pg_constraint
    WHERE conname = 'AuthenticatedIdentity_password_shape_check'
  `
  assert.equal(constraints.length, 1, "P1-05 bcrypt credential constraint is missing")

  const triggers = await database.client.$queryRaw`
    SELECT DISTINCT trigger_name AS "name"
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND trigger_name = 'AuthenticatedIdentity_assert_security_change_version'
  `
  assert.equal(triggers.length, 1, "P1-05 authorization-version trigger is missing")

  console.info("P1-05 structural authentication verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-05 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-05 verifier disconnect failed")
    process.exitCode = 1
  })
}
