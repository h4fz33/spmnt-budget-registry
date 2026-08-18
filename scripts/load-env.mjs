import { config as loadDotenv } from "dotenv"

function environmentFiles() {
  const mode = process.env.APP_ENV?.trim() ?? process.env.NODE_ENV?.trim() ?? "development"

  if (mode === "test") {
    return [".env", ".env.test", ".env.test.local"]
  }

  if (mode === "production") {
    return [".env", ".env.production", ".env.local", ".env.production.local"]
  }

  return [".env", ".env.development", ".env.local", ".env.development.local"]
}

export function loadProjectEnvironment() {
  const processValues = { ...process.env }

  for (const path of environmentFiles()) {
    loadDotenv({ path, override: true })
  }

  for (const [key, value] of Object.entries(processValues)) {
    process.env[key] = value
  }

  return process.env
}

loadProjectEnvironment()
