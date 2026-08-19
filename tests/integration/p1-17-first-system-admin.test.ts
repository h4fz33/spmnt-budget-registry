import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  SYSTEM_ADMIN_BOOTSTRAP_COMMAND,
  SYSTEM_ADMIN_BOOTSTRAP_ID,
  SYSTEM_ADMIN_BOOTSTRAP_REASON,
} from "../../src/lib/bootstrap/constants.ts"
import {
  FirstSystemAdminBootstrapAlreadyExistsError,
  FirstSystemAdminBootstrapError,
  FirstSystemAdminBootstrapUnsafeStateError,
  bootstrapFirstSystemAdmin,
} from "../../src/lib/bootstrap/first-system-admin.ts"
import { authenticateCredentials } from "../../src/lib/auth/credentials.ts"
import { assertAuditLogIntegrity } from "../../src/lib/audit/core.ts"
import { resolveActiveSystemAdmin } from "../../src/lib/authorization/system-admin.ts"

const password = "Synthetic-P1-17-Initial-Password"

test("P1-17 seals one audited platform System Admin bootstrap and rejects replay", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16)

  try {
    const initialBootstrap = await client.systemAdminBootstrap.findUnique({
      where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
      select: { id: true },
    })

    if (!initialBootstrap) {
      const occupiedEmail = `p117-occupied-${suffix}@synthetic.test`
      await client.authenticatedIdentity.create({
        data: {
          accountIdentifier: occupiedEmail,
          displayName: "P1-17 pre-existing synthetic identity",
        },
      })
      await assert.rejects(
        () => bootstrapFirstSystemAdmin(client, { accountIdentifier: occupiedEmail, password }),
        (error: unknown) => error instanceof FirstSystemAdminBootstrapUnsafeStateError,
      )
      assert.equal(await client.systemAdminBootstrap.count(), 0)

      const accountIdentifier = `P117-INITIAL-${suffix}@SYNTHETIC.TEST`
      await assert.rejects(
        () => bootstrapFirstSystemAdmin(client, { accountIdentifier, password: "short" }),
        (error: unknown) => error instanceof FirstSystemAdminBootstrapError,
      )
      assert.equal(await client.systemAdminBootstrap.count(), 0)

      await bootstrapFirstSystemAdmin(client, { accountIdentifier, password })
      const authenticated = await authenticateCredentials(client, {
        accountIdentifier: accountIdentifier.toLowerCase(),
        password,
      })
      assert.ok(authenticated)
    }

    const bootstrap = await client.systemAdminBootstrap.findUniqueOrThrow({
      where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
      include: {
        identity: true,
        membership: { include: { organization: true, roleAssignments: true } },
        platformOrganization: true,
      },
    })
    assert.equal(bootstrap.identity.accountStatus, "ACTIVE")
    assert.match(bootstrap.identity.accountIdentifier, /^[a-z0-9._%+-]+@synthetic\.test$/)
    assert.match(bootstrap.identity.passwordHash ?? "", /^\$2[aby]\$10\$/)
    assert.ok(bootstrap.identity.passwordChangedAt)
    assert.equal(bootstrap.membership.identityId, bootstrap.identityId)
    assert.equal(bootstrap.membership.organizationId, bootstrap.platformOrganizationId)
    assert.equal(bootstrap.membership.status, "ACTIVE")
    assert.equal(bootstrap.membership.effectiveTo, null)
    assert.equal(bootstrap.membership.organization.type, "PLATFORM")
    assert.equal(bootstrap.membership.organization.status, "ACTIVE")
    assert.equal(bootstrap.membership.roleAssignments.length, 0)
    assert.equal(bootstrap.platformOrganization.id, bootstrap.platformOrganizationId)

    const auditEvent = await client.auditLog.findFirst({
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
    assert.ok(auditEvent)
    assertAuditLogIntegrity(await client.auditLog.findMany({ orderBy: { sequence: "asc" } }))

    const systemAdmin = await resolveActiveSystemAdmin(client, {
      identityId: bootstrap.identityId,
      authorizationVersion: bootstrap.identity.authorizationVersion,
    })
    assert.equal(systemAdmin?.membershipId, bootstrap.membershipId)
    assert.equal(
      await resolveActiveSystemAdmin(client, {
        identityId: bootstrap.identityId,
        authorizationVersion: bootstrap.identity.authorizationVersion + 1,
      }),
      null,
    )

    const identityCountBeforeReplay = await client.authenticatedIdentity.count()
    await assert.rejects(
      () =>
        bootstrapFirstSystemAdmin(client, {
          accountIdentifier: `p117-replay-${suffix}@synthetic.test`,
          password,
        }),
      (error: unknown) => error instanceof FirstSystemAdminBootstrapAlreadyExistsError,
    )
    assert.equal(await client.authenticatedIdentity.count(), identityCountBeforeReplay)
    await assert.rejects(
      () =>
        client.$executeRaw`
          UPDATE "SystemAdminBootstrap"
          SET "identityId" = "identityId"
          WHERE "id" = ${SYSTEM_ADMIN_BOOTSTRAP_ID}
        `,
      (error: unknown) => error instanceof Error,
    )
  } finally {
    await client.$disconnect()
  }
})
