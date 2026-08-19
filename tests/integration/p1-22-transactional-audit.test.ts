import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  assertAuditLogIntegrity,
  AuditAccessDeniedError,
  recordAuditEventInTransaction,
} from "../../src/lib/audit/core.ts"

test("P1-22 keeps an outer mutation and its audit evidence atomic", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16)
  const occurredAt = new Date()

  try {
    const esao = await client.organization.create({
      data: { type: "ESAO", nameTh: `P1-22 ESAO ${suffix}` },
    })
    const schoolOrganization = await client.organization.create({
      data: {
        type: "SCHOOL",
        nameTh: `P1-22 School ${suffix}`,
        parentOrganizationId: esao.id,
      },
    })
    const school = await client.school.create({
      data: {
        organizationId: schoolOrganization.id,
        smisCode: `P122-SMIS-${suffix}`,
        moeCode: `P122-MOE-${suffix}`,
      },
    })
    const identity = await client.authenticatedIdentity.create({
      data: {
        accountIdentifier: `p122-${suffix}@synthetic.test`,
        displayName: `P1-22 actor ${suffix}`,
        accountStatus: "ACTIVE",
      },
    })
    const membership = await client.approvedMembership.create({
      data: {
        identityId: identity.id,
        organizationId: school.organizationId,
        effectiveFrom: new Date(occurredAt.getTime() - 60_000),
      },
    })

    const auditInput = (targetId: string) => ({
      actorIdentityId: identity.id,
      actorMembershipId: membership.id,
      scope: { kind: "SCHOOL" as const, organizationId: school.organizationId, schoolId: school.organizationId },
      commandCode: "P1-22-TRANSACTIONAL-AUDIT",
      targetType: "TransactionalFixture",
      targetId,
      outcome: "SUCCESS" as const,
      reasonCode: "SYNTHETIC_TRANSACTION_TEST",
      correlationId: `p122-${targetId}`,
      occurredAt,
    })

    const rolledBackTargetId = `rollback-${suffix}`
    await assert.rejects(() =>
      client.$transaction(
        async (transaction) => {
          await transaction.organization.create({
            data: { type: "PLATFORM", nameTh: `P1-22 rolled back ${suffix}` },
          })
          await recordAuditEventInTransaction(transaction, auditInput(rolledBackTargetId))
          throw new Error("P1-22 forced rollback")
        },
        { isolationLevel: "Serializable" },
      ),
    )
    assert.equal(
      await client.auditLog.findFirst({ where: { targetType: "TransactionalFixture", targetId: rolledBackTargetId } }),
      null,
    )
    assert.equal(await client.organization.findFirst({ where: { nameTh: `P1-22 rolled back ${suffix}` } }), null)

    const committed = await client.$transaction(
      async (transaction) => {
        const businessRecord = await transaction.organization.create({
          data: { type: "PLATFORM", nameTh: `P1-22 committed ${suffix}` },
        })
        const auditEvent = await recordAuditEventInTransaction(transaction, auditInput(businessRecord.id))
        return { businessRecord, auditEvent }
      },
      { isolationLevel: "Serializable" },
    )

    const committedBusinessRecord = await client.organization.findUnique({ where: { id: committed.businessRecord.id } })
    const committedAuditEvent = await client.auditLog.findUnique({ where: { id: committed.auditEvent.id } })
    assert.equal(committedBusinessRecord?.id, committed.businessRecord.id)
    assert.equal(committedAuditEvent?.targetId, committed.businessRecord.id)
    assertAuditLogIntegrity(await client.auditLog.findMany({ orderBy: { sequence: "asc" } }))

    await client.approvedMembership.update({
      where: { id: membership.id },
      data: { status: "SUSPENDED" },
    })
    await assert.rejects(
      () =>
        client.$transaction((transaction) =>
          recordAuditEventInTransaction(transaction, auditInput(`revoked-${suffix}`)),
        ),
      (error: unknown) => error instanceof AuditAccessDeniedError,
    )
  } finally {
    await client.$disconnect()
  }
})
