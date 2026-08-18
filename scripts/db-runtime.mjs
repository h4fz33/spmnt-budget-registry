import "./load-env.mjs"

const supportedModes = new Set(["development", "test"])

function readMode(requestedMode) {
  const applicationMode = process.env.APP_ENV?.trim()
  const nodeMode = process.env.NODE_ENV?.trim()
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

export function getDatabaseRuntime({ requestedMode } = {}) {
  const mode = readMode(requestedMode)
  const value = process.env.DATABASE_URL?.trim()

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

  if (!runtime.databaseName.toLowerCase().includes("test")) {
    throw new Error("Test database operations require a database name containing test")
  }
}
