import assert from "node:assert/strict"

import { PILOT_ESAO_ORGANIZATION_ID, SESA0_AUDITOR_BOOTSTRAP_ID, SESA0_AUDITOR_BOOTSTRAP_COMMAND, SESA0_AUDITOR_BOOTSTRAP_REASON } from "../src/lib/bootstrap/sesao-auditor.ts"
import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import { createDatabaseClient } from "./db-client.mjs"

const expectedConstraints = [
  "SesaoAuditorBootstrap_singleton_check",
  "SesaoAuditorBootstrap_esaoOrganizationId_fkey",
  "SesaoAuditorConfiguration_identityId_fkey",
  "SesaoAuditorConfiguration_esaoOrganizationId_fkey",
  "SesaoAuditorSchoolScope_configurationId_fkey",
  "SesaoAuditorSchoolScope_schoolId_fkey",
  "SesaoAuditorProvenance_configurationId_fkey",
  "SesaoAuditorProvenance_subjectIdentityId_fkey",
  "SesaoAuditorProvenance_technicalExecutorIdentityId_fkey",
  "SesaoAuditorProvenance_technicalExecutorMembershipId_fkey",
]
const expectedIndexes = [
  "SesaoAuditorConfiguration_identity_active_key",
  "SesaoAuditorSchoolScope_configurationId_schoolId_key",
  "SesaoAuditorProvenance_externalApprovalRecordId_action_key",
  "SesaoAuditorProvenance_configurationId_action_key",
]
const expectedTriggers = [
  "SesaoAuditorBootstrap_assert_shape",
  "SesaoAuditorBootstrap_prevent_mutation",
  "SesaoAuditorConfiguration_assert_shape",
  "SesaoAuditorConfiguration_prevent_mutation",
  "SesaoAuditorSchoolScope_prevent_mutation",
  "SesaoAuditorProvenance_assert_shape",
  "SesaoAuditorProvenance_prevent_mutation",
]

const database = createDatabaseClient({ requestedMode: "test" })
try {
  const [constraints, indexes, triggers] = await Promise.all([
    database.client.$queryRaw`SELECT conname AS "name" FROM pg_constraint WHERE conname = ANY(${expectedConstraints})`,
    database.client.$queryRaw`SELECT indexname AS "name" FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY(${expectedIndexes})`,
    database.client.$queryRaw`SELECT trigger."tgname" AS "name" FROM pg_trigger trigger JOIN pg_class relation ON relation."oid" = trigger."tgrelid" JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace" WHERE namespace."nspname" = 'public' AND NOT trigger."tgisinternal" AND trigger."tgname" = ANY(${expectedTriggers})`,
  ])
  assert.deepEqual(constraints.map((row) => row.name).sort(), expectedConstraints.sort())
  assert.deepEqual(indexes.map((row) => row.name).sort(), expectedIndexes.sort())
  assert.deepEqual(triggers.map((row) => row.name).sort(), expectedTriggers.sort())

  const bootstrap = await database.client.sesaoAuditorBootstrap.findUnique({ where: { id: SESA0_AUDITOR_BOOTSTRAP_ID }, include: { configurations: { include: { schoolScopes: true, identity: true } } } })
  assert.ok(bootstrap, "P1-19 requires one sealed Auditor bootstrap")
  assert.equal(bootstrap.esaoOrganizationId, PILOT_ESAO_ORGANIZATION_ID)
  assert.ok(bootstrap.configurations.length >= 1)
  assert.ok(bootstrap.configurations.every((configuration) => configuration.configurationSource === "INITIAL_BOOTSTRAP" && configuration.status === "ACTIVE" && configuration.roleCode === "SESAO_AUDITOR" && configuration.schoolScopes.length === 17))
  const audit = await database.client.auditLog.findFirst({ where: { scopeKind: "PLATFORM", scopeOrganizationId: null, scopeSchoolId: null, commandCode: SESA0_AUDITOR_BOOTSTRAP_COMMAND, targetType: "SesaoAuditorBootstrap", targetId: SESA0_AUDITOR_BOOTSTRAP_ID, outcome: "SUCCESS", reasonCode: SESA0_AUDITOR_BOOTSTRAP_REASON } })
  assert.ok(audit, "P1-19 requires bootstrap audit evidence")
  assertAuditLogIntegrity(await database.client.auditLog.findMany({ orderBy: { sequence: "asc" } }))
  const provenance = await database.client.sesaoAuditorProvenance.findMany({ include: { configuration: true } })
  assert.ok(provenance.every((record) => record.approvalAuthorityLabel === "Private Business / Product Owner"))
  assert.ok(provenance.every((record) => record.technicalExecutorIdentityId !== record.subjectIdentityId))
  console.info("P1-19 configured SESAO Auditor verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-19 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => { console.error(error instanceof Error ? error.message : "P1-19 verifier disconnect failed"); process.exitCode = 1 })
}
