import assert from "node:assert/strict"

import { SYSTEM_ADMIN_BOOTSTRAP_COMMAND, SYSTEM_ADMIN_BOOTSTRAP_ID, SYSTEM_ADMIN_BOOTSTRAP_REASON } from "../src/lib/bootstrap/constants.ts"
import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import { createDatabaseClient } from "./db-client.mjs"

const expectedConstraints = [
  "SystemAdminBootstrap_singleton_check",
  "SystemAdminBootstrap_identityId_fkey",
  "SystemAdminBootstrap_membershipId_fkey",
  "SystemAdminBootstrap_platformOrganizationId_fkey",
]
const expectedIndexes = [
  "SystemAdminBootstrap_identityId_key",
  "SystemAdminBootstrap_membershipId_key",
  "SystemAdminBootstrap_platformOrganizationId_key",
]
const expectedTriggers = [
  "SystemAdminBootstrap_assert_shape",
  "SystemAdminBootstrap_prevent_mutation",
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
      WHERE schemaname = 'public'
        AND indexname = ANY(${expectedIndexes})
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
  assert.deepEqual(constraints.map((constraint) => constraint.name).sort(), [...expectedConstraints].sort())
  assert.deepEqual(indexes.map((index) => index.name).sort(), [...expectedIndexes].sort())
  assert.deepEqual(triggers.map((trigger) => trigger.name).sort(), [...expectedTriggers].sort())

  const records = await database.client.systemAdminBootstrap.findMany({
    include: {
      identity: true,
      membership: { include: { organization: true, roleAssignments: true } },
      platformOrganization: true,
    },
  })
  assert.equal(records.length, 1, "P1-17 requires exactly one System Admin bootstrap")
  const bootstrap = records[0]
  assert.equal(bootstrap.id, SYSTEM_ADMIN_BOOTSTRAP_ID)
  assert.equal(bootstrap.identity.accountStatus, "ACTIVE")
  assert.match(bootstrap.identity.accountIdentifier, /^[a-z0-9._%+-]+@synthetic\.test$/)
  assert.match(bootstrap.identity.passwordHash ?? "", /^\$2[aby]\$10\$/)
  assert.ok(bootstrap.identity.passwordChangedAt)
  assert.equal(bootstrap.membership.identityId, bootstrap.identityId)
  assert.equal(bootstrap.membership.organizationId, bootstrap.platformOrganizationId)
  assert.equal(bootstrap.membership.status, "ACTIVE")
  assert.equal(bootstrap.membership.effectiveTo, null)
  assert.equal(bootstrap.membership.organization.type, "PLATFORM")
  assert.equal(bootstrap.membership.roleAssignments.length, 0)
  assert.equal(bootstrap.platformOrganization.id, bootstrap.platformOrganizationId)

  const audit = await database.client.auditLog.findFirst({
    where: {
      actorIdentityId: bootstrap.identityId,
      actorMembershipId: bootstrap.membershipId,
      scopeKind: "PLATFORM",
      commandCode: SYSTEM_ADMIN_BOOTSTRAP_COMMAND,
      targetType: "SystemAdminBootstrap",
      targetId: SYSTEM_ADMIN_BOOTSTRAP_ID,
      outcome: "SUCCESS",
      reasonCode: SYSTEM_ADMIN_BOOTSTRAP_REASON,
    },
  })
  assert.ok(audit, "P1-17 requires matching immutable audit evidence")
  assertAuditLogIntegrity(await database.client.auditLog.findMany({ orderBy: { sequence: "asc" } }))

  console.info("P1-17 sealed System Admin bootstrap verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-17 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-17 verifier disconnect failed")
    process.exitCode = 1
  })
}
