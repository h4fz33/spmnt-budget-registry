import { spawnSync } from "node:child_process"

const checks = [
  ["CONFIG", ["run", "db:validate:test"]],
  ["MIGRATE", ["run", "db:migrate:test"]],
  ["SEED", ["run", "db:seed:test"]],
  ["P1_03_VERIFY", ["run", "verify:p1-03"]],
  ["P1_07_TEST", ["run", "test:p1-07"]],
  ["P1_07_VERIFY", ["run", "verify:p1-07"]],
  ["P1_08_TEST", ["run", "test:p1-08"]],
  ["P1_08_VERIFY", ["run", "verify:p1-08"]],
  ["P1_22_TEST", ["run", "test:p1-22"]],
  ["P1_09_TEST", ["run", "test:p1-09"]],
  ["P1_09_VERIFY", ["run", "verify:p1-09"]],
  ["P1_10_UNIT", ["run", "test:p1-10"]],
  ["P1_10_INTEGRATION", ["run", "test:p1-10:integration"]],
  ["P1_10_VERIFY", ["run", "verify:p1-10"]],
  ["P1_17_TEST", ["run", "test:p1-17"]],
  ["P1_17_VERIFY", ["run", "verify:p1-17"]],
  ["P1_18_TEST", ["run", "test:p1-18"]],
  ["P1_18_VERIFY", ["run", "verify:p1-18"]],
  ["P1_19_TEST", ["run", "test:p1-19"]],
  ["P1_19_VERIFY", ["run", "verify:p1-19"]],
  ["P1_20_TEST", ["run", "test:p1-20"]],
  ["P1_20_VERIFY", ["run", "verify:p1-20"]],
  ["P1_21_TEST", ["run", "test:p1-21"]],
  ["P1_21_VERIFY", ["run", "verify:p1-21"]],
  ["P1_15_TEST", ["run", "test:p1-15"]],
  ["P1_15_VERIFY", ["run", "verify:p1-15"]],
]

function failureReason(result) {
  if (result.error) {
    return "PROCESS_START_FAILED"
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
  if (/P1001|Can't reach database server/i.test(output)) {
    return "DATABASE_UNREACHABLE"
  }
  if (/credentials are incorrect|password authentication failed|authentication failed/i.test(output)) {
    return "DATABASE_AUTH_FAILED"
  }
  if (/database name containing test/i.test(output)) {
    return "TEST_DATABASE_NAME_INVALID"
  }
  if (/TEST_DATABASE_ID and TEST_DATABASE_SECRET_ID do not select the approved P1-23 test connection/i.test(output)) {
    return "TEST_DATABASE_SELECTOR_INVALID"
  }
  if (/DATABASE_URL must use a direct postgres:\/\/ or postgresql:\/\/ URL/i.test(output)) {
    return "TEST_DATABASE_CONNECTION_FORMAT_INVALID"
  }
  if (/DATABASE_URL is required|Invalid runtime configuration/i.test(output)) {
    return "TEST_RUNTIME_CONFIGURATION_INVALID"
  }
  if (/Cannot find module|Cannot find package/i.test(output)) {
    return "RUNNER_DEPENDENCY_INVALID"
  }
  if (/P3005|schema is not empty/i.test(output)) {
    return "MIGRATION_BASELINE_REQUIRED"
  }

  const prismaCode = output.match(/\bP\d{4}\b/)
  if (prismaCode) {
    return `PRISMA_${prismaCode[0]}`
  }

  return "COMMAND_FAILED"
}

for (const [name, args] of checks) {
  const result = spawnSync("npm", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    windowsHide: true,
  })

  if (result.error || result.status !== 0) {
    console.log(`CHECK=${name};RESULT=FAIL;REASON=${failureReason(result)}`)
    process.exitCode = 1
    break
  }

  console.log(`CHECK=${name};RESULT=PASS`)
}

if (process.exitCode !== 1) {
  console.log("VERIFY_RUN=PASS")
}
