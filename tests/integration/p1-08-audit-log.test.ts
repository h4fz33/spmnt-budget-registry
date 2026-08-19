import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  assertAuditLogIntegrity,
  AuditAccessDeniedError,
  readScopedAuditLog,
  recordAuditEvent,
} from "../../src/lib/audit/core.ts"

async function createSchool(client: ReturnType<typeof createDatabaseClient>["client"], suffix: string) {
  const esao = await client.organization.create({
    data: {
      type: "ESAO",
      nameTh: `P1-08 ESAO ${suffix}`,
    },
  })
  const organization = await client.organization.create({
    data: {
      type: "SCHOOL",
      nameTh: `P1-08 School ${suffix}`,
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

async function createActiveActor(
  client: ReturnType<typeof createDatabaseClient>["client"],
  schoolId: string,
  suffix: string,
) {
  const identity = await client.authenticatedIdentity.create({
    data: {
      accountIdentifier: `p108-${suffix}@synthetic.test`,
      displayName: `P1-08 actor ${suffix}`,
      accountStatus: "ACTIVE",
    },
  })
  const membership = await client.approvedMembership.create({
    data: {
      identityId: identity.id,
      organizationId: schoolId,
      effectiveFrom: new Date(Date.now() - 60_000),
    },
  })

  return { identity, membership }
}

function auditEventInput(
  actor: Awaited<ReturnType<typeof createActiveActor>>,
  schoolId: string,
  targetId: string,
  outcome: "SUCCESS" | "DENIED" = "SUCCESS",
) {
  return {
    actorIdentityId: actor.identity.id,
    actorMembershipId: actor.membership.id,
    scope: { kind: "SCHOOL" as const, organizationId: schoolId, schoolId },
    commandCode: "P1-08-AUDIT-TEST",
    targetType: "AuditLogFixture",
    targetId,
    outcome,
    reasonCode: outcome === "SUCCESS" ? "SYNTHETIC_TEST" : "POLICY_DENIED",
    correlationId: `p108-${targetId}`,
    occurredAt: new Date(),
  }
}

test("P1-08 appends an immutable, scoped, integrity-verifiable audit history", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16)

  try {
    const school = await createSchool(client, suffix)
    const otherSchool = await createSchool(client, `${suffix}other`)
    const actor = await createActiveActor(client, school.organizationId, suffix)

    const allowed = await recordAuditEvent(
      client,
      auditEventInput(actor, school.organizationId, `allowed-${suffix}`),
    )
    const denied = await recordAuditEvent(
      client,
      auditEventInput(actor, school.organizationId, `denied-${suffix}`, "DENIED"),
    )

    assert.equal(denied.sequence, allowed.sequence + BigInt(1))
    assert.equal(denied.previousIntegrityDigest, allowed.integrityDigest)
    assert.equal(denied.outcome, "DENIED")

    await assert.rejects(
      () =>
        client.auditLog.update({
          where: { id: allowed.id },
          data: { reasonCode: "MUTATION_ATTEMPT" },
        }),
      (error: unknown) => error instanceof Error,
    )
    await assert.rejects(
      () => client.auditLog.delete({ where: { id: allowed.id } }),
      (error: unknown) => error instanceof Error,
    )
    await assert.rejects(
      () => client.$executeRawUnsafe('TRUNCATE TABLE "AuditLog"'),
      (error: unknown) => error instanceof Error,
    )

    await assert.rejects(
      () =>
        client.auditLog.create({
          data: {
            sequence: denied.sequence + BigInt(1),
            actorIdentityId: actor.identity.id,
            actorMembershipId: actor.membership.id,
            actorAuthorizationVersion: actor.identity.authorizationVersion,
            actorMembershipAuthorizationVersion: actor.membership.authorizationVersion,
            scopeKind: "SCHOOL",
            scopeOrganizationId: school.organizationId,
            scopeSchoolId: school.organizationId,
            commandCode: "P1-08-AUDIT-TEST",
            targetType: "AuditLogFixture",
            targetId: `broken-${suffix}`,
            outcome: "FAILED",
            reasonCode: "BROKEN_CHAIN_TEST",
            occurredAt: new Date(),
            previousIntegrityDigest: "b".repeat(64),
            integrityDigest: "c".repeat(64),
          },
        }),
      (error: unknown) => error instanceof Error,
    )

    await assert.rejects(
      () =>
        recordAuditEvent(
          client,
          auditEventInput(actor, otherSchool.organizationId, `cross-school-${suffix}`),
        ),
      (error: unknown) => error instanceof AuditAccessDeniedError,
    )

    const scopedRecords = await readScopedAuditLog(client, {
      actorIdentityId: actor.identity.id,
      actorMembershipId: actor.membership.id,
      scope: { kind: "SCHOOL", organizationId: school.organizationId, schoolId: school.organizationId },
      purposeCode: "AUTHORIZED_REVIEW",
      occurredAt: new Date(),
    })
    assert.ok(scopedRecords.length >= 3)
    assert.ok(scopedRecords.every((record) => record.scopeSchoolId === school.organizationId))

    await client.approvedMembership.update({
      where: { id: actor.membership.id },
      data: { status: "SUSPENDED" },
    })
    await assert.rejects(
      () => recordAuditEvent(client, auditEventInput(actor, school.organizationId, `suspended-${suffix}`)),
      (error: unknown) => error instanceof AuditAccessDeniedError,
    )

    const allRecords = await client.auditLog.findMany({ orderBy: { sequence: "asc" } })
    assertAuditLogIntegrity(allRecords)
    const tamperedRecords = [...allRecords]
    const lastRecord = tamperedRecords.at(-1)!
    tamperedRecords[tamperedRecords.length - 1] = {
      ...lastRecord,
      reasonCode: "TAMPERED_REASON",
    }
    assert.throws(() => assertAuditLogIntegrity(tamperedRecords), /integrity digest/)
  } finally {
    await client.$disconnect()
  }
})
