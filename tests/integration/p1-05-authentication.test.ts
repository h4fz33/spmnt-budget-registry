import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  authenticateCredentials,
  hashPassword,
} from "../../src/lib/auth/credentials.ts"
import {
  hasFreshAuthentication,
  refreshAuthenticationToken,
  requireFreshAuthentication,
  sessionFromAuthenticationToken,
  tokenForAuthenticatedPrincipal,
} from "../../src/lib/auth/session.ts"

const now = new Date("2026-08-18T13:30:00.000Z")
const password = "Synthetic-P1-05-Password"

async function createSchool(client: ReturnType<typeof createDatabaseClient>["client"], suffix: string) {
  const esao = await client.organization.create({
    data: { type: "ESAO", nameTh: `ESAO ${suffix}` },
  })
  const organization = await client.organization.create({
    data: {
      type: "SCHOOL",
      nameTh: `School ${suffix}`,
      parentOrganizationId: esao.id,
    },
  })

  return client.school.create({
    data: {
      organizationId: organization.id,
      smisCode: `SMIS-${suffix}`,
      moeCode: `MOE-${suffix}`,
    },
  })
}

async function addActiveMembership(
  client: ReturnType<typeof createDatabaseClient>["client"],
  identityId: string,
  schoolId: string,
) {
  return client.approvedMembership.create({
    data: {
      identityId,
      organizationId: schoolId,
      effectiveFrom: new Date(now.getTime() - 60_000),
    },
  })
}

test("P1-05 Credentials authentication activates only current identities and invalidates stale sessions", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = `p105${randomUUID().replaceAll("-", "").slice(0, 12)}`

  try {
    const school = await createSchool(client, suffix)
    const passwordHash = await hashPassword(password)
    assert.match(passwordHash, /^\$2[aby]\$10\$/)

    const activeIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `active-${suffix}@synthetic.test`,
        displayName: "Active synthetic identity",
        accountStatus: "ACTIVE",
        passwordHash,
        passwordChangedAt: now,
      },
    })
    await addActiveMembership(client, activeIdentity.id, school.organizationId)

    const authenticated = await authenticateCredentials(
      client,
      {
        accountIdentifier: `  ACTIVE-${suffix}@SYNTHETIC.TEST  `,
        password,
      },
      now,
    )
    assert.ok(authenticated)
    assert.equal(authenticated.id, activeIdentity.id)
    assert.equal("passwordHash" in authenticated, false)

    const issuedToken = tokenForAuthenticatedPrincipal(authenticated)
    const refreshedToken = await refreshAuthenticationToken(client, issuedToken, now)
    assert.equal(refreshedToken.invalidated, false)
    const activeSession = sessionFromAuthenticationToken(refreshedToken, "2026-08-18T21:30:00.000Z")
    assert.ok(activeSession)
    assert.equal(activeSession.user.id, activeIdentity.id)
    assert.equal(requireFreshAuthentication(activeSession, now.getTime()), true)
    assert.equal(hasFreshAuthentication(authenticated.authenticatedAt, now.getTime() + 5 * 60 * 1000 + 1), false)
    assert.equal(
      requireFreshAuthentication(activeSession, now.getTime() + 5 * 60 * 1000 + 1),
      false,
    )

    assert.equal(
      await authenticateCredentials(
        client,
        { accountIdentifier: activeIdentity.accountIdentifier, password: "Wrong-password" },
        now,
      ),
      null,
    )

    const pendingIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `pending-${suffix}@synthetic.test`,
        displayName: "Pending synthetic identity",
        passwordHash,
        passwordChangedAt: now,
      },
    })
    await addActiveMembership(client, pendingIdentity.id, school.organizationId)
    assert.equal(
      await authenticateCredentials(
        client,
        { accountIdentifier: pendingIdentity.accountIdentifier, password },
        now,
      ),
      null,
    )

    const disabledIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `disabled-${suffix}@synthetic.test`,
        displayName: "Disabled synthetic identity",
        accountStatus: "DISABLED",
        passwordHash,
        passwordChangedAt: now,
      },
    })
    await addActiveMembership(client, disabledIdentity.id, school.organizationId)
    assert.equal(
      await authenticateCredentials(
        client,
        { accountIdentifier: disabledIdentity.accountIdentifier, password },
        now,
      ),
      null,
    )

    const noMembershipIdentity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `no-membership-${suffix}@synthetic.test`,
        displayName: "Unassigned synthetic identity",
        accountStatus: "ACTIVE",
        passwordHash,
        passwordChangedAt: now,
      },
    })
    assert.equal(
      await authenticateCredentials(
        client,
        { accountIdentifier: noMembershipIdentity.accountIdentifier, password },
        now,
      ),
      null,
    )

    const weakCostHash = passwordHash.replace("$10$", "$08$")
    await assert.rejects(() =>
      client.authenticatedIdentity.create({
        data: {
          accountIdentifier: `bad-cost-${suffix}@synthetic.test`,
          displayName: "Invalid credential cost",
          passwordHash: weakCostHash,
          passwordChangedAt: now,
        },
      }),
    )

    await client.authenticatedIdentity.update({
      where: { id: activeIdentity.id },
      data: { authorizationVersion: { increment: 1 } },
    })
    const invalidatedByVersion = await refreshAuthenticationToken(client, issuedToken, now)
    assert.equal(invalidatedByVersion.invalidated, true)
    assert.equal(sessionFromAuthenticationToken(invalidatedByVersion, "2026-08-18T21:30:00.000Z"), null)

    const replacementPassword = "Synthetic-P1-05-Replacement"
    await client.authenticatedIdentity.update({
      where: { id: activeIdentity.id },
      data: {
        passwordHash: await hashPassword(replacementPassword),
        passwordChangedAt: new Date(now.getTime() + 1),
        authorizationVersion: { increment: 1 },
      },
    })
    assert.equal(
      await authenticateCredentials(
        client,
        { accountIdentifier: activeIdentity.accountIdentifier, password },
        now,
      ),
      null,
    )
    assert.ok(
      await authenticateCredentials(
        client,
        { accountIdentifier: activeIdentity.accountIdentifier, password: replacementPassword },
        now,
      ),
    )
  } finally {
    await client.$disconnect()
  }
})
