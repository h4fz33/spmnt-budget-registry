import assert from "node:assert/strict"

import {
  EnvironmentValidationError,
  loadServerEnvironment,
} from "../config/runtime-env.mjs"

function makeEnvironment(mode, overrides = {}) {
  const environment = {
    APP_ENV: mode,
    NODE_ENV: mode,
    DATABASE_URL: "postgresql://example:example@db.test.invalid:5432/school_banchee",
    NEXTAUTH_URL: mode === "production" ? "https://schoolbanchee.example.invalid" : "http://localhost:6000",
    NEXTAUTH_SECRET: "test-secret-that-is-longer-than-thirty-two-characters",
    SCHOOL_SEED_ESAO_CODE: "1000960001",
  }

  return { ...environment, ...overrides }
}

function expectConfigurationFailure(environment, expectedIssue, requestedMode) {
  assert.throws(
    () => loadServerEnvironment(environment, requestedMode),
    (error) => error instanceof EnvironmentValidationError && error.message.includes(expectedIssue),
  )
}

assert.equal(loadServerEnvironment(makeEnvironment("development")).mode, "development")
assert.equal(loadServerEnvironment(makeEnvironment("test")).mode, "test")
assert.equal(loadServerEnvironment(makeEnvironment("production")).mode, "production")

expectConfigurationFailure(makeEnvironment("development", { DATABASE_URL: undefined }), "DATABASE_URL")
expectConfigurationFailure(makeEnvironment("development", { DATABASE_URL: "sqlite://local" }), "postgres://")
expectConfigurationFailure(makeEnvironment("development", { NEXTAUTH_SECRET: "too-short" }), "32 characters")
expectConfigurationFailure(makeEnvironment("production", { NEXTAUTH_URL: "http://schoolbanchee.example.invalid" }), "HTTPS")
expectConfigurationFailure(makeEnvironment("production", { DATABASE_URL: "postgresql://example:example@localhost:5432/school_banchee" }), "loopback")
expectConfigurationFailure(makeEnvironment("development", { APP_ENV: "test" }), "must match")
expectConfigurationFailure(makeEnvironment("development"), "Requested test validation", "test")

console.info("Environment validation checks passed.")
