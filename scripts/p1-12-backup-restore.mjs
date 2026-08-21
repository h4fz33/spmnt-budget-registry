import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import "./load-env.mjs"

const sourceValue = process.env.P1_12_SOURCE_DATABASE_URL?.trim()
const backupRoot = mkdtempSync(path.join(tmpdir(), "schoolbanchee-p1-12-"))
const dumpPath = path.join(backupRoot, "synthetic.dump")
let restoreDatabaseName
const executable = (name, environmentName) => process.env[environmentName]?.trim() || (process.platform === "win32"
  ? path.join("C:", "Program Files", "PostgreSQL", "18", "bin", `${name}.exe`)
  : name)
const psql = executable("psql", "P1_12_PSQL_PATH")
const pgDump = executable("pg_dump", "P1_12_PG_DUMP_PATH")
const pgRestore = executable("pg_restore", "P1_12_PG_RESTORE_PATH")

function fail(message) {
  throw new Error(message)
}

function parseDatabaseUrl(value, label) {
  if (!value) fail(`${label} is required`)

  let url
  try {
    url = new URL(value)
  } catch {
    fail(`${label} must be a valid PostgreSQL URL`)
  }

  if (!(["postgres:", "postgresql:"].includes(url.protocol))) {
    fail(`${label} must use postgres:// or postgresql://`)
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""))
  if (!databaseName) fail(`${label} must include a database name`)

  return { url, databaseName }
}

function toolDatabaseUrl(url) {
  const toolUrl = new URL(url)
  // Prisma accepts URL parameters such as ?schema=public; PostgreSQL client
  // tools do not. The database target itself remains unchanged.
  toolUrl.search = ""
  toolUrl.hash = ""
  return toolUrl.toString()
}

function assertLocalSyntheticScope(parsed) {
  const host = parsed.url.hostname.toLowerCase()
  if (!(["localhost", "127.0.0.1", "::1"].includes(host))) {
    fail("P1-12 accepts only an explicitly supplied local synthetic PostgreSQL host")
  }
  if (!parsed.databaseName.toLowerCase().includes("test")) {
    fail("P1-12 source database name must contain test")
  }
}

function adminUrlFor(parsed) {
  const admin = new URL(parsed.url)
  admin.pathname = "/postgres"
  return toolDatabaseUrl(admin)
}

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }).trim()
  } catch (error) {
    const status = error?.status ?? "unknown"
    const detail = error?.stderr?.toString().trim().split(/\r?\n/).slice(-1)[0]
    fail(`${command} failed with exit code ${status}${detail ? `: ${detail}` : ""}`)
  }
}

function scalar(databaseUrl, sql) {
  return run(psql, [databaseUrl, "-X", "-v", "ON_ERROR_STOP=1", "-At", "-c", sql])
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`
}

function collectSnapshot(databaseUrl) {
  const tables = scalar(
    databaseUrl,
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  ).split(/\r?\n/).filter(Boolean)

  const rows = {}
  for (const table of tables) {
    rows[table] = Number(scalar(databaseUrl, `SELECT count(*)::text FROM ${quoteIdentifier(table)}`))
  }

  const foreignKeys = Number(scalar(
    databaseUrl,
    "SELECT count(*)::text FROM pg_catalog.pg_constraint WHERE connamespace = 'public'::regnamespace AND contype = 'f' AND convalidated",
  ))
  const constraints = Number(scalar(
    databaseUrl,
    "SELECT count(*)::text FROM pg_catalog.pg_constraint WHERE connamespace = 'public'::regnamespace AND convalidated",
  ))
  const indexes = Number(scalar(
    databaseUrl,
    "SELECT count(*)::text FROM pg_catalog.pg_indexes WHERE schemaname = 'public'",
  ))
  const invalidIndexes = Number(scalar(
    databaseUrl,
    "SELECT count(*)::text FROM pg_catalog.pg_index index_record JOIN pg_catalog.pg_class table_record ON table_record.oid = index_record.indrelid JOIN pg_catalog.pg_namespace table_schema ON table_schema.oid = table_record.relnamespace WHERE table_schema.nspname = 'public' AND NOT index_record.indisvalid",
  ))
  const columns = scalar(
    databaseUrl,
    "SELECT table_record.relname || '|' || column_record.attnum || '|' || column_record.attname || '|' || pg_catalog.format_type(column_record.atttypid, column_record.atttypmod) || '|' || column_record.attnotnull || '|' || coalesce(pg_catalog.pg_get_expr(default_record.adbin, default_record.adrelid), '') FROM pg_catalog.pg_attribute column_record JOIN pg_catalog.pg_class table_record ON table_record.oid = column_record.attrelid JOIN pg_catalog.pg_namespace table_schema ON table_schema.oid = table_record.relnamespace LEFT JOIN pg_catalog.pg_attrdef default_record ON default_record.adrelid = column_record.attrelid AND default_record.adnum = column_record.attnum WHERE table_schema.nspname = 'public' AND table_record.relkind IN ('r', 'p') AND column_record.attnum > 0 AND NOT column_record.attisdropped ORDER BY table_record.relname, column_record.attnum",
  ).split(/\r?\n/).filter(Boolean)
  const constraintCatalog = scalar(
    databaseUrl,
    "SELECT table_record.relname || '|' || constraint_record.conname || '|' || constraint_record.contype::text || '|' || constraint_record.convalidated::text || '|' || coalesce(constraint_record.conkey::text, '') || '|' || coalesce(constraint_record.confrelid::regclass::text, '') || '|' || coalesce(constraint_record.confkey::text, '') || '|' || constraint_record.confupdtype::text || '|' || constraint_record.confdeltype::text || '|' || constraint_record.confmatchtype::text || '|' || constraint_record.condeferrable::text || '|' || constraint_record.condeferred::text FROM pg_catalog.pg_constraint constraint_record JOIN pg_catalog.pg_class table_record ON table_record.oid = constraint_record.conrelid JOIN pg_catalog.pg_namespace table_schema ON table_schema.oid = table_record.relnamespace WHERE table_schema.nspname = 'public' ORDER BY table_record.relname, constraint_record.conname",
  ).split(/\r?\n/).filter(Boolean)
  const indexDefinitions = scalar(
    databaseUrl,
    "SELECT tablename || '|' || indexname || '|' || indexdef FROM pg_catalog.pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname",
  ).split(/\r?\n/).filter(Boolean)
  const seedMarker = scalar(
    databaseUrl,
    "SELECT coalesce((SELECT \"seedMarker\" FROM \"DatabaseBootstrap\" WHERE id = 'p1-03'), '')",
  )

  return {
    rows,
    totalRows: Object.values(rows).reduce((total, count) => total + count, 0),
    foreignKeys,
    constraints,
    indexes,
    invalidIndexes,
    columns,
    constraintCatalog,
    indexDefinitions,
    seedMarker,
  }
}

function createDatabase(adminUrl, databaseName) {
  run(psql, [
    adminUrl,
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `CREATE DATABASE ${quoteIdentifier(databaseName)}`,
  ])
}

function dropDatabase(adminUrl, databaseName) {
  run(psql, [
    adminUrl,
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`,
  ])
}

function assertSameSnapshot(source, restored) {
  if (JSON.stringify(source.rows) !== JSON.stringify(restored.rows)) {
    fail("restored table row counts differ from the source snapshot")
  }
  for (const key of [
    "totalRows",
    "foreignKeys",
    "constraints",
    "indexes",
    "invalidIndexes",
    "columns",
    "constraintCatalog",
    "indexDefinitions",
    "seedMarker",
  ]) {
    const sourceValue = Array.isArray(source[key]) ? JSON.stringify(source[key]) : source[key]
    const restoredValue = Array.isArray(restored[key]) ? JSON.stringify(restored[key]) : restored[key]
    if (sourceValue !== restoredValue) fail(`restored ${key} differs from the source snapshot`)
  }
  if (restored.invalidIndexes !== 0) fail("restored database contains invalid indexes")
  if (restored.constraints < restored.foreignKeys) fail("restored constraint catalog is inconsistent")
  if (!restored.seedMarker) fail("source and restored databases lack the P1-03 synthetic seed marker")
}

try {
  if (process.env.APP_ENV !== "test" || process.env.NODE_ENV !== "test") {
    fail("P1-12 requires APP_ENV=test and NODE_ENV=test")
  }

  const source = parseDatabaseUrl(sourceValue, "P1_12_SOURCE_DATABASE_URL")
  assertLocalSyntheticScope(source)
  const sourceDatabaseUrl = toolDatabaseUrl(source.url)
  const adminUrl = adminUrlFor(source)
  const serverMajor = scalar(sourceDatabaseUrl, "SELECT split_part(current_setting('server_version'), '.', 1)")
  const dumpVersion = run(pgDump, ["--version"]).match(/(\d+)/)?.[1]
  const restoreVersion = run(pgRestore, ["--version"]).match(/(\d+)/)?.[1]
  if (!dumpVersion || !restoreVersion || dumpVersion !== restoreVersion || dumpVersion !== serverMajor) {
    fail("pg_dump/pg_restore major version must match the source PostgreSQL server")
  }

  const sourceSnapshot = collectSnapshot(sourceDatabaseUrl)
  run(pgDump, [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    dumpPath,
    sourceDatabaseUrl,
  ])
  const backupBytes = statSync(dumpPath).size

  restoreDatabaseName = `schoolbanchee_restore_${Date.now()}_${Math.floor(Math.random() * 100000)}`
  const restoreUrl = new URL(source.url)
  restoreUrl.pathname = `/${restoreDatabaseName}`
  const restoreDatabaseUrl = toolDatabaseUrl(restoreUrl)
  createDatabase(adminUrl, restoreDatabaseName)
  run(pgRestore, [
    "--exit-on-error",
    "--no-owner",
    "--no-privileges",
    "--dbname",
    restoreDatabaseUrl,
    dumpPath,
  ])

  const restoredSnapshot = collectSnapshot(restoreDatabaseUrl)
  assertSameSnapshot(sourceSnapshot, restoredSnapshot)

  console.info("P1_12_SCOPE=PASS; local synthetic test database only")
  console.info(`P1_12_BACKUP=PASS; bytes=${backupBytes}`)
  console.info("P1_12_RESTORE=PASS")
  console.info(`P1_12_ROWS=PASS; total=${restoredSnapshot.totalRows}`)
  console.info(`P1_12_FOREIGN_KEYS=PASS; count=${restoredSnapshot.foreignKeys}`)
  console.info(`P1_12_CONSTRAINTS=PASS; count=${restoredSnapshot.constraints}`)
  console.info(`P1_12_INDEXES=PASS; count=${restoredSnapshot.indexes}`)
  console.info("P1_12_SCHEMA=PASS; table columns, constraint catalog, and indexes match")
  console.info("P1_12_REFERENCES=PASS; seed marker and foreign-key definitions match")
  console.info("P1_12_VERIFY=PASS")
} finally {
  if (restoreDatabaseName) {
    try {
      dropDatabase(adminUrlFor(parseDatabaseUrl(sourceValue, "P1_12_SOURCE_DATABASE_URL")), restoreDatabaseName)
    } catch {
      console.error("P1_12_CLEANUP=FAIL; temporary restore database may require manual removal")
      process.exitCode = 1
    }
  }
  rmSync(backupRoot, { recursive: true, force: true })
}
