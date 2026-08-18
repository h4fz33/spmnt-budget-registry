import assert from "node:assert/strict"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import { withSerializableRetry } from "../../src/lib/database/with-serializable-retry.ts"

test("P1-03 migration and seed expose the synthetic bootstrap probe", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })

  try {
    const probe = await client.databaseBootstrap.findUnique({ where: { id: "p1-03" } })
    assert.equal(probe?.seedMarker, "P1-03-SYNTHETIC")
  } finally {
    await client.$disconnect()
  }
})

test("P1-03 retries a serializable conflict with the same operation key", async () => {
  const first = createDatabaseClient({ requestedMode: "test" })
  const second = createDatabaseClient({ requestedMode: "test" })
  let firstReadResolve: (() => void) | undefined
  let secondCommitResolve: (() => void) | undefined
  const firstRead = new Promise<void>((resolve) => {
    firstReadResolve = resolve
  })
  const secondCommitted = new Promise<void>((resolve) => {
    secondCommitResolve = resolve
  })
  let retries = 0

  try {
    await first.client.databaseBootstrap.update({
      where: { id: "p1-03" },
      data: { serializableCounter: 0 },
    })

    const firstOperation = withSerializableRetry(
      async ({ attempt }) =>
        first.client.$transaction(
          async (tx) => {
            const probe = await tx.databaseBootstrap.findUniqueOrThrow({ where: { id: "p1-03" } })
            if (attempt === 1) {
              firstReadResolve?.()
              await secondCommitted
            }

            return tx.databaseBootstrap.update({
              where: { id: probe.id },
              data: { serializableCounter: probe.serializableCounter + 1 },
            })
          },
          { isolationLevel: "Serializable" },
        ),
      {
        operationKey: "P1-03-SERIALIZABLE-PROBE",
        maxAttempts: 3,
        onRetry: () => {
          retries += 1
        },
      },
    )

    const secondOperation = (async () => {
      await firstRead
      await second.client.$transaction(
        async (tx) => {
          await tx.databaseBootstrap.update({
            where: { id: "p1-03" },
            data: { serializableCounter: { increment: 1 } },
          })
        },
        { isolationLevel: "Serializable" },
      )
      secondCommitResolve?.()
    })()

    await Promise.all([firstOperation, secondOperation])
    const finalProbe = await first.client.databaseBootstrap.findUniqueOrThrow({ where: { id: "p1-03" } })
    assert.equal(finalProbe.serializableCounter, 2)
    assert.ok(retries >= 1, "expected at least one serialization retry")
  } finally {
    await Promise.all([first.client.$disconnect(), second.client.$disconnect()])
  }
})

