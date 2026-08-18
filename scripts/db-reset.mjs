import { spawnSync } from "node:child_process"
import path from "node:path"
import { assertTestDatabase, getDatabaseRuntime } from "./db-runtime.mjs"

const requiredConsent = "I authorize resetting the synthetic test database"

try {
  const runtime = getDatabaseRuntime({ requestedMode: "test" })
  assertTestDatabase(runtime)

  if (process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION !== requiredConsent) {
    throw new Error(
      `Reset is destructive. Set PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION to the exact consent text: ${requiredConsent}`,
    )
  }

  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js")
  const result = spawnSync(process.execPath, [prismaCli, "migrate", "reset", "--force"], {
    env: process.env,
    stdio: "inherit",
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
  } else {
    const seedResult = spawnSync(process.execPath, [prismaCli, "db", "seed"], {
      env: process.env,
      stdio: "inherit",
    })

    if (seedResult.error) {
      throw seedResult.error
    }

    process.exitCode = seedResult.status ?? 1
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Test database reset failed")
  process.exitCode = 1
}
