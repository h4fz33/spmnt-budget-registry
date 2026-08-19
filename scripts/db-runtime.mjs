import "./load-env.mjs"

const supportedModes = new Set(["development", "test"])
const P1_23_TEST_DATABASE_ID = "db_ang2o4k2cs20d4xolyfwqiol"
const P1_23_TEST_DATABASE_SECRET_ID = "SPMNT-ACC-AUDIT_PRISMA-POSTGRES-URI"

function readMode(source, requestedMode) {
  const applicationMode = source.APP_ENV?.trim()
  const nodeMode = source.NODE_ENV?.trim()
  const mode = requestedMode ?? applicationMode ?? nodeMode ?? "development"

  if (!supportedModes.has(mode)) {
    throw new Error("Database commands require APP_ENV/NODE_ENV to be development or test")
  }

  if (applicationMode && nodeMode && applicationMode !== nodeMode) {
    throw new Error("APP_ENV and NODE_ENV must match")
  }

  if (requestedMode && applicationMode && requestedMode !== applicationMode) {
    throw new Error(`Requested ${requestedMode} database mode, but APP_ENV is ${applicationMode}`)
  }

  if (requestedMode && nodeMode && requestedMode !== nodeMode) {
    throw new Error(`Requested ${requestedMode} database mode, but NODE_ENV is ${nodeMode}`)
  }

  return mode
}

function readTestDatabaseId(source, mode) {
  const databaseId = source.TEST_DATABASE_ID?.trim()
  const secretId = source.TEST_DATABASE_SECRET_ID?.trim()

  if (!databaseId && !secretId) {
    return undefined
  }

  if (
    mode !== "test" ||
    databaseId !== P1_23_TEST_DATABASE_ID ||
    secretId !== P1_23_TEST_DATABASE_SECRET_ID
  ) {
    throw new Error("TEST_DATABASE_ID and TEST_DATABASE_SECRET_ID do not select the approved P1-23 test connection")
  }

  return Object.freeze({ databaseId, secretId })
}

export function getDatabaseRuntime({ requestedMode, source = process.env } = {}) {
  const mode = readMode(source, requestedMode)
  const value = source.DATABASE_URL?.trim()

  if (!value) {
    throw new Error("DATABASE_URL is required for database commands")
  }

  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error("DATABASE_URL must be a valid direct PostgreSQL URL")
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use a direct postgres:// or postgresql:// URL")
  }

  if (!url.hostname) {
    throw new Error("DATABASE_URL must include a PostgreSQL host")
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""))
  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name")
  }

  const runtime = Object.freeze({
    mode,
    databaseName,
    databaseUrl: value,
    hostname: url.hostname,
    testDatabaseSelector: readTestDatabaseId(source, mode),
  })

  if (mode === "test") {
    assertTestDatabase(runtime)
  }

  return runtime
}

export function assertTestDatabase(runtime) {
  if (runtime.mode !== "test") {
    throw new Error("Test database operations require APP_ENV=test and NODE_ENV=test")
  }

  if (
    runtime.testDatabaseSelector?.databaseId === P1_23_TEST_DATABASE_ID &&
    runtime.testDatabaseSelector.secretId === P1_23_TEST_DATABASE_SECRET_ID
  ) {
    return
  }

  if (runtime.testDatabaseSelector) {
    throw new Error("TEST_DATABASE_ID and TEST_DATABASE_SECRET_ID do not select the approved P1-23 test connection")
  }

  if (!runtime.databaseName.toLowerCase().includes("test")) {
    throw new Error("Test database operations require a database name containing test")
  }
}
