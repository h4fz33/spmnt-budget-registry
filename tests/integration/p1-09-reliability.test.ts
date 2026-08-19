import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  claimOutboxMessages,
  completeOutboxDelivery,
  enqueueOutboxMessageInTransaction,
  executeIdempotentCommand,
  IdempotencyKeyReuseError,
  OutboxLeaseLostError,
  processOutboxBatch,
} from "../../src/lib/reliability/core.ts"

async function createActiveSchoolActor(
  client: ReturnType<typeof createDatabaseClient>["client"],
  suffix: string,
) {
  const esao = await client.organization.create({
    data: { type: "ESAO", nameTh: `P1-09 ESAO ${suffix}` },
  })
  const schoolOrganization = await client.organization.create({
    data: {
      type: "SCHOOL",
      nameTh: `P1-09 School ${suffix}`,
      parentOrganizationId: esao.id,
    },
  })
  const school = await client.school.create({
    data: {
      organizationId: schoolOrganization.id,
      smisCode: `P109-SMIS-${suffix}`,
      moeCode: `P109-MOE-${suffix}`,
    },
  })
  const identity = await client.authenticatedIdentity.create({
    data: {
      accountIdentifier: `p109-${suffix}@synthetic.test`,
      displayName: `P1-09 actor ${suffix}`,
      accountStatus: "ACTIVE",
    },
  })
  const membership = await client.approvedMembership.create({
    data: {
      identityId: identity.id,
      organizationId: school.organizationId,
      effectiveFrom: new Date(Date.now() - 60_000),
    },
  })

  return { school, identity, membership }
}

test("P1-09 commits one idempotent business result and retries outbox work safely", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16)
  // A historical clock isolates this focused test from persistent runner messages.
  const now = new Date(0)
  const idempotencyKey = `p109:${suffix}:command`

  try {
    const actor = await createActiveSchoolActor(client, suffix)
    const input = {
      actorIdentityId: actor.identity.id,
      actorMembershipId: actor.membership.id,
      scope: {
        kind: "SCHOOL" as const,
        organizationId: actor.school.organizationId,
        schoolId: actor.school.organizationId,
      },
      commandCode: "P1-09-TEST-COMMAND",
      idempotencyKey,
      request: { action: "CREATE_SYNTHETIC_RECORD", version: 1 },
    }

    const submit = () =>
      executeIdempotentCommand(client, input, async (transaction) => {
        const businessRecord = await transaction.organization.create({
          data: { type: "PLATFORM", nameTh: `P1-09 business ${suffix}` },
        })
        const message = await enqueueOutboxMessageInTransaction(transaction, {
          messageType: "P1-09.SYNTHETIC.CREATED",
          aggregateType: "SyntheticReliabilityFixture",
          aggregateId: businessRecord.id,
          payload: { businessRecordId: businessRecord.id, version: 1 },
          deduplicationKey: `p109:${suffix}:outbox`,
          availableAt: now,
        })
        return { businessRecordId: businessRecord.id, messageId: message.id }
      })
    const submissions = await Promise.all([submit(), submit()])
    const first = submissions.find((submission) => !submission.replayed)!
    const concurrentReplay = submissions.find((submission) => submission.replayed)!
    assert.equal(first.replayed, false)
    assert.equal(concurrentReplay.replayed, true)
    assert.deepEqual(concurrentReplay.result, first.result)

    const replay = await executeIdempotentCommand(client, input, async () => {
      throw new Error("Duplicate command body must not run")
    })
    assert.equal(replay.replayed, true)
    assert.deepEqual(replay.result, first.result)
    assert.equal(
      await client.organization.count({ where: { nameTh: `P1-09 business ${suffix}` } }),
      1,
    )
    assert.equal(
      await client.outboxMessage.count({ where: { id: first.result.messageId } }),
      1,
    )

    await assert.rejects(
      () =>
        executeIdempotentCommand(client, { ...input, request: { action: "ALTERED", version: 1 } }, async () => ({
          businessRecordId: "unreachable",
          messageId: "unreachable",
        })),
      (error: unknown) => error instanceof IdempotencyKeyReuseError,
    )

    const rollbackKey = `p109:${suffix}:rollback`
    await assert.rejects(() =>
      executeIdempotentCommand(client, { ...input, idempotencyKey: rollbackKey }, async (transaction) => {
        await transaction.organization.create({
          data: { type: "PLATFORM", nameTh: `P1-09 rollback ${suffix}` },
        })
        await enqueueOutboxMessageInTransaction(transaction, {
          messageType: "P1-09.SYNTHETIC.ROLLBACK",
          aggregateType: "SyntheticReliabilityFixture",
          aggregateId: actor.school.organizationId,
          payload: { rollback: true },
          deduplicationKey: `p109:${suffix}:rollback-outbox`,
        })
        throw new Error("P1-09 forced rollback")
      }),
    )
    assert.equal(await client.organization.count({ where: { nameTh: `P1-09 rollback ${suffix}` } }), 0)
    assert.equal(
      await client.commandIdempotencyRecord.count({ where: { idempotencyKey: rollbackKey } }),
      0,
    )
    assert.equal(
      await client.outboxMessage.count({ where: { deduplicationKey: `p109:${suffix}:rollback-outbox` } }),
      0,
    )

    const claimed = await claimOutboxMessages(client, {
      workerId: `worker:${suffix}`,
      limit: 1,
      now,
    })
    assert.equal(claimed.length, 1)
    assert.equal(claimed[0]?.id, first.result.messageId)
    assert.equal(
      (await claimOutboxMessages(client, { workerId: `other:${suffix}`, now })).length,
      0,
    )

    const retry = await completeOutboxDelivery(client, {
      messageId: first.result.messageId,
      workerId: `worker:${suffix}`,
      delivered: false,
      failureCode: "SYNTHETIC_TRANSIENT_FAILURE",
      maxAttempts: 3,
      now,
    })
    assert.equal(retry.message.status, "PENDING")
    assert.equal(retry.attempt.outcome, "RETRY_SCHEDULED")
    assert.equal(retry.attempt.nextAvailableAt?.getTime(), now.getTime() + 1_000)
    assert.equal(
      (await claimOutboxMessages(client, { workerId: `worker:${suffix}`, now })).length,
      0,
    )

    let deliveries = 0
    const processed = await processOutboxBatch(client, {
      workerId: `worker:${suffix}`,
      limit: 1,
      now: retry.attempt.nextAvailableAt!,
      handler: async (message) => {
        deliveries += 1
        assert.equal(message.id, first.result.messageId)
        assert.equal(message.deliveryKey, first.result.messageId)
      },
    })
    assert.deepEqual(processed, {
      claimed: 1,
      delivered: 1,
      retryScheduled: 0,
      deadLettered: 0,
      leaseLost: 0,
    })
    assert.equal(deliveries, 1)
    assert.equal(
      (await processOutboxBatch(client, {
        workerId: `worker:${suffix}`,
        now: new Date(retry.attempt.nextAvailableAt!.getTime() + 1),
        handler: async () => {
          throw new Error("Delivered messages must not be processed again")
        },
      })).claimed,
      0,
    )

    const attempts = await client.outboxDeliveryAttempt.findMany({
      where: { messageId: first.result.messageId },
      orderBy: { attemptNumber: "asc" },
    })
    assert.deepEqual(
      attempts.map((attempt) => attempt.outcome),
      ["RETRY_SCHEDULED", "DELIVERED"],
    )
    await assert.rejects(
      () =>
        client.outboxDeliveryAttempt.update({
          where: { id: attempts[0]!.id },
          data: { failureCode: "MUTATION_ATTEMPT" },
        }),
      (error: unknown) => error instanceof Error,
    )
    await assert.rejects(
      () => client.outboxDeliveryAttempt.delete({ where: { id: attempts[0]!.id } }),
      (error: unknown) => error instanceof Error,
    )
  } finally {
    await client.$disconnect()
  }
})

test("P1-09 recovers expired leases and records the terminal dead-letter attempt", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16)
  // A historical clock isolates this focused test from persistent runner messages.
  const now = new Date(0)

  try {
    const expiring = await client.$transaction((transaction) =>
      enqueueOutboxMessageInTransaction(transaction, {
        messageType: "P1-09.SYNTHETIC.EXPIRING",
        aggregateType: "SyntheticReliabilityFixture",
        aggregateId: `expiring-${suffix}`,
        payload: { fixture: "expiring" },
        deduplicationKey: `p109:${suffix}:expiring`,
        availableAt: now,
      }),
    )
    const firstLease = await claimOutboxMessages(client, {
      workerId: `first:${suffix}`,
      leaseMs: 10,
      now,
    })
    assert.equal(firstLease[0]?.id, expiring.id)

    const reclaimedAt = new Date(now.getTime() + 11)
    const secondLease = await claimOutboxMessages(client, {
      workerId: `second:${suffix}`,
      leaseMs: 1_000,
      now: reclaimedAt,
    })
    assert.equal(secondLease[0]?.id, expiring.id)
    const abandonedAttempts = await client.outboxDeliveryAttempt.findMany({
      where: { messageId: expiring.id },
      orderBy: { attemptNumber: "asc" },
    })
    assert.deepEqual(
      abandonedAttempts.map((attempt) => ({
        attemptNumber: attempt.attemptNumber,
        workerId: attempt.workerId,
        outcome: attempt.outcome,
        failureCode: attempt.failureCode,
        nextAvailableAt: attempt.nextAvailableAt,
      })),
      [
        {
          attemptNumber: 1,
          workerId: `first:${suffix}`,
          outcome: "ABANDONED",
          failureCode: "LEASE_EXPIRED",
          nextAvailableAt: null,
        },
      ],
    )
    await assert.rejects(
      () =>
        completeOutboxDelivery(client, {
          messageId: expiring.id,
          workerId: `first:${suffix}`,
          delivered: true,
          now: new Date(reclaimedAt.getTime() + 1),
        }),
      (error: unknown) => error instanceof OutboxLeaseLostError,
    )
    const delivered = await completeOutboxDelivery(client, {
      messageId: expiring.id,
      workerId: `second:${suffix}`,
      delivered: true,
      now: new Date(reclaimedAt.getTime() + 1),
    })
    assert.equal(delivered.message.status, "DELIVERED")
    assert.equal(delivered.attempt.attemptNumber, 2)

    const deadLetter = await client.$transaction((transaction) =>
      enqueueOutboxMessageInTransaction(transaction, {
        messageType: "P1-09.SYNTHETIC.DEAD",
        aggregateType: "SyntheticReliabilityFixture",
        aggregateId: `dead-${suffix}`,
        payload: { fixture: "dead" },
        deduplicationKey: `p109:${suffix}:dead`,
        availableAt: now,
      }),
    )
    const deadClaim = await claimOutboxMessages(client, {
      workerId: `dead:${suffix}`,
      now,
    })
    assert.equal(deadClaim[0]?.id, deadLetter.id)
    const terminal = await completeOutboxDelivery(client, {
      messageId: deadLetter.id,
      workerId: `dead:${suffix}`,
      delivered: false,
      failureCode: "SYNTHETIC_PERMANENT_FAILURE",
      maxAttempts: 1,
      now,
    })
    assert.equal(terminal.message.status, "DEAD_LETTER")
    assert.equal(terminal.attempt.outcome, "DEAD_LETTERED")
    assert.equal(
      await client.outboxDeliveryAttempt.count({ where: { messageId: deadLetter.id } }),
      1,
    )
  } finally {
    await client.$disconnect()
  }
})
