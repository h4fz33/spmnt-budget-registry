import nextEnv from "@next/env"

import {
  EnvironmentValidationError,
  environmentModes,
  loadServerEnvironment,
} from "../config/runtime-env.mjs"

const { loadEnvConfig } = nextEnv

function readRequestedMode() {
  const option = process.argv.find((argument) => argument.startsWith("--mode="))

  if (!option) {
    return undefined
  }

  const mode = option.slice("--mode=".length)

  if (!environmentModes.includes(mode)) {
    throw new Error("--mode must be development, test, or production")
  }

  return mode
}

try {
  const requestedMode = readRequestedMode()
  loadEnvConfig(process.cwd(), requestedMode === "development")
  const environment = loadServerEnvironment(process.env, requestedMode)
  console.info(`Runtime configuration is valid for ${environment.mode}.`)
} catch (error) {
  if (error instanceof EnvironmentValidationError || error instanceof Error) {
    console.error(error.message)
  } else {
    console.error("Invalid runtime configuration")
  }

  process.exitCode = 1
}
