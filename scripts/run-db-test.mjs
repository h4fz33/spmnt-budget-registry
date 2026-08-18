import { spawnSync } from "node:child_process"
import path from "node:path"

const [requestedCommand, ...argumentsToForward] = process.argv.slice(2)

if (!requestedCommand) {
  console.error("A database test command is required")
  process.exitCode = 1
} else {
  const conflictingMode = ["APP_ENV", "NODE_ENV"].find((name) => {
    const value = process.env[name]?.trim()
    return value && value !== "test"
  })

  if (conflictingMode) {
    console.error(`${conflictingMode} must be unset or test for a test database command`)
    process.exitCode = 1
  } else {
    process.env.APP_ENV = "test"
    process.env.NODE_ENV = "test"

    try {
      const { getDatabaseRuntime } = await import("./db-runtime.mjs")
      const runtime = getDatabaseRuntime({ requestedMode: "test" })
      console.info(`Test database runtime is valid for ${runtime.mode}.`)

      const isPrismaCommand = requestedCommand === "prisma"
      const command = requestedCommand === "node" || isPrismaCommand ? process.execPath : requestedCommand
      const forwardedArguments = isPrismaCommand
        ? [path.join(process.cwd(), "node_modules", "prisma", "build", "index.js"), ...argumentsToForward]
        : argumentsToForward
      const result = spawnSync(command, forwardedArguments, {
        env: process.env,
        stdio: "inherit",
        windowsHide: true,
      })

      if (result.error) {
        throw result.error
      }

      process.exitCode = result.status ?? 1
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Test database command failed")
      process.exitCode = 1
    }
  }
}
