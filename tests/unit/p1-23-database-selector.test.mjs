import assert from "node:assert/strict"
import test from "node:test"

import { getDatabaseRuntime } from "../../scripts/db-runtime.mjs"

const approvedTestDatabaseId = "db_ang2o4k2cs20d4xolyfwqiol"
const approvedTestDatabaseSecretId = "SPMNT-ACC-AUDIT_PRISMA-POSTGRES-URI"

function testSource(overrides = {}) {
  return {
    APP_ENV: "test",
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://synthetic:synthetic@db.invalid:5432/postgres",
    ...overrides,
  }
}

test("the exact P1-23 selector permits the generated connection's generic database name", () => {
  const runtime = getDatabaseRuntime({
    requestedMode: "test",
    source: testSource({
      TEST_DATABASE_ID: approvedTestDatabaseId,
      TEST_DATABASE_SECRET_ID: approvedTestDatabaseSecretId,
    }),
  })

  assert.deepEqual(runtime.testDatabaseSelector, {
    databaseId: approvedTestDatabaseId,
    secretId: approvedTestDatabaseSecretId,
  })
  assert.equal(runtime.databaseName, "postgres")
})

test("an unapproved database or secret selector fails closed", () => {
  assert.throws(
    () =>
      getDatabaseRuntime({
        requestedMode: "test",
        source: testSource({
          TEST_DATABASE_ID: "db_other",
          TEST_DATABASE_SECRET_ID: approvedTestDatabaseSecretId,
        }),
      }),
    /TEST_DATABASE_ID and TEST_DATABASE_SECRET_ID do not select the approved P1-23 test connection/,
  )
  assert.throws(
    () =>
      getDatabaseRuntime({
        requestedMode: "test",
        source: testSource({
          TEST_DATABASE_ID: approvedTestDatabaseId,
          TEST_DATABASE_SECRET_ID: "OTHER_SECRET",
        }),
      }),
    /TEST_DATABASE_ID and TEST_DATABASE_SECRET_ID do not select the approved P1-23 test connection/,
  )
})

test("ordinary local and CI test URLs retain the database-name guard", () => {
  const runtime = getDatabaseRuntime({
    requestedMode: "test",
    source: testSource({ DATABASE_URL: "postgresql://synthetic:synthetic@db.invalid:5432/schoolbanchee_test" }),
  })

  assert.equal(runtime.testDatabaseSelector, undefined)
  assert.equal(runtime.databaseName, "schoolbanchee_test")
})

test("a generic database name without the approved selector fails closed", () => {
  assert.throws(
    () => getDatabaseRuntime({ requestedMode: "test", source: testSource() }),
    /Test database operations require a database name containing test/,
  )
})
