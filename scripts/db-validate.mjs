import { getDatabaseRuntime } from "./db-runtime.mjs"

function requestedMode() {
  const option = process.argv.find((argument) => argument.startsWith("--mode="))
  return option ? option.slice("--mode=".length) : undefined
}

try {
  const runtime = getDatabaseRuntime({ requestedMode: requestedMode() })
  console.info(`Database runtime is valid for ${runtime.mode}.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid database runtime")
  process.exitCode = 1
}

