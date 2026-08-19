import "./load-env.mjs"

import { getServerEnvironment } from "../config/runtime-env.mjs"
import { bootstrapFirstSystemAdmin } from "../src/lib/bootstrap/first-system-admin.ts"
import { createDatabaseClient } from "./db-client.mjs"

let database
try {
  const environment = getServerEnvironment()
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
  delete process.env.BOOTSTRAP_ADMIN_PASSWORD

  if (!environment.bootstrapAdminEmail) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL is required for the initial System Admin bootstrap")
  }
  if (!password) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be supplied through a short-lived secret")
  }

  database = createDatabaseClient({ requestedMode: environment.mode })
  await bootstrapFirstSystemAdmin(database.client, {
    accountIdentifier: environment.bootstrapAdminEmail,
    password,
  })
  console.info("Initial System Admin bootstrap completed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "Initial System Admin bootstrap failed")
  process.exitCode = 1
} finally {
  await database?.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "Initial System Admin bootstrap disconnect failed")
    process.exitCode = 1
  })
}
