import assert from "node:assert/strict"

import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import {
  ESAO_ADMIN_CONFIGURATION_COMMAND,
  ESAO_ADMIN_ROLE,
  PILOT_ESAO_ORGANIZATION_ID,
} from "../src/lib/authorization/esao-admin.ts"
import { createDatabaseClient } from "./db-client.mjs"

const expectedConstraints = [
  "EsaoAdminConfiguration_identityId_fkey",
  "EsaoAdminConfiguration_esaoOrganizationId_fkey",
  "EsaoAdminSchoolScope_configurationId_fkey",
  "EsaoAdminSchoolScope_schoolId_fkey",
  "EsaoAdminProvenance_configurationId_fkey",
  "EsaoAdminProvenance_subjectIdentityId_fkey",
  "EsaoAdminProvenance_technicalExecutorIdentityId_fkey",
  "EsaoAdminProvenance_technicalExecutorMembershipId_fkey",
]
const expectedIndexes = [
  "EsaoAdminConfiguration_identity_active_key",
  "EsaoAdminSchoolScope_configurationId_schoolId_key",
  "EsaoAdminProvenance_externalApprovalRecordId_action_key",
  "EsaoAdminProvenance_configurationId_action_key",
]
const expectedTriggers = [
  "EsaoAdminConfiguration_assert_shape",
  "EsaoAdminConfiguration_prevent_mutation",
  "EsaoAdminSchoolScope_prevent_mutation",
  "EsaoAdminProvenance_assert_shape",
  "EsaoAdminProvenance_prevent_mutation",
]

const database = createDatabaseClient({ requestedMode: "test" })
try {
  const [constraints, indexes, triggers] = await Promise.all([
    database.client.$queryRaw`
      SELECT conname AS "name"
      FROM pg_constraint
      WHERE conname = ANY(${expectedConstraints})
    `,
    database.client.$queryRaw`
      SELECT indexname AS "name"
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = ANY(${expectedIndexes})
    `,
    database.client.$queryRaw`
      SELECT trigger."tgname" AS "name"
      FROM pg_trigger trigger
      JOIN pg_class relation ON relation."oid" = trigger."tgrelid"
      JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace"
      WHERE namespace."nspname" = 'public'
        AND NOT trigger."tgisinternal"
        AND trigger."tgname" = ANY(${expectedTriggers})
    `,
  ])
  assert.deepEqual(constraints.map((row) => row.name).sort(), [...expectedConstraints].sort())
  assert.deepEqual(indexes.map((row) => row.name).sort(), [...expectedIndexes].sort())
  assert.deepEqual(triggers.map((row) => row.name).sort(), [...expectedTriggers].sort())

  const configurations = await database.client.esaoAdminConfiguration.findMany({
    include: {
      identity: {
        include: {
          memberships: {
            include: { organization: true, roleAssignments: true },
          },
        },
      },
      schoolScopes: { orderBy: { schoolId: "asc" } },
      provenance: { orderBy: { action: "asc" } },
    },
  })
  assert.ok(configurations.length > 0, "P1-18 requires durable ESAO Admin configuration evidence")
  for (const configuration of configurations) {
    assert.equal(configuration.roleCode, ESAO_ADMIN_ROLE)
    assert.equal(configuration.configurationSource, "APPROVED_APPOINTMENT")
    assert.equal(configuration.esaoOrganizationId, PILOT_ESAO_ORGANIZATION_ID)
    assert.equal(configuration.schoolScopes.length, 17)
    assert.equal(new Set(configuration.schoolScopes.map((scope) => scope.schoolId)).size, 17)
    assert.equal(configuration.identity.accountIdentifier.endsWith("@synthetic.test"), true)
    assert.equal(configuration.identity.memberships.length, 1)
    assert.equal(configuration.identity.memberships[0]?.organizationId, PILOT_ESAO_ORGANIZATION_ID)
    assert.equal(configuration.identity.memberships[0]?.organization.type, "ESAO")
    assert.equal(configuration.identity.memberships[0]?.roleAssignments.length, 0)
    assert.equal(configuration.provenance.filter((record) => record.action === "APPOINT").length, 1)
    assert.equal(configuration.provenance.filter((record) => record.action === "REVOKE").length, configuration.status === "REVOKED" ? 1 : 0)
    for (const provenance of configuration.provenance) {
      assert.equal(provenance.approvalAuthorityLabel, "Private Business / Product Owner")
      assert.equal(provenance.subjectRoleCode, ESAO_ADMIN_ROLE)
      assert.equal(provenance.subjectIdentityId, configuration.identityId)
      assert.notEqual(provenance.technicalExecutorIdentityId, provenance.subjectIdentityId)
      const expectedReason = provenance.action === "APPOINT"
        ? "ESAO_ADMIN_CONFIGURATION_APPLIED"
        : "ESAO_ADMIN_CONFIGURATION_REVOKED"
      const audit = await database.client.auditLog.findFirst({
        where: {
          actorIdentityId: provenance.technicalExecutorIdentityId,
          actorMembershipId: provenance.technicalExecutorMembershipId,
          scopeKind: "PLATFORM",
          commandCode: ESAO_ADMIN_CONFIGURATION_COMMAND,
          targetType: "EsaoAdminConfiguration",
          targetId: configuration.id,
          outcome: "SUCCESS",
          reasonCode: expectedReason,
          correlationId: provenance.externalApprovalRecordId,
        },
      })
      assert.ok(audit, "P1-18 requires separately attributable technical execution audit evidence")
    }
  }
  assertAuditLogIntegrity(await database.client.auditLog.findMany({ orderBy: { sequence: "asc" } }))
  console.info("P1-18 ESAO Admin configuration verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-18 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-18 verifier disconnect failed")
    process.exitCode = 1
  })
}
