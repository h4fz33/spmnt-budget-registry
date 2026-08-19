import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import {
  allocateScopedNumber,
  allocateScopedNumberInTransaction,
} from "../../src/lib/domain/scoped-numbering-persistence.ts"
import { createScopedNumberScope } from "../../src/lib/domain/scoped-numbering.ts"

const FISCAL_YEAR = 2569
const REGISTER_CODE = "PAYMENT_VOUCHER"

async function createActiveSchoolActor(
  client: ReturnType<typeof createDatabaseClient>["client"],
  suffix: string,
) {
  const esao = await client.organization.create({
    data: { type: "ESAO", nameTh: `P1-10 ESAO ${suffix}` },
  })
  const schoolOrganization = await client.organization.create({
    data: {
      type: "SCHOOL",
      nameTh: `P1-10 School ${suffix}`,
      parentOrganizationId: esao.id,
    },
  })
  const school = await client.school.create({
    data: {
      organizationId: schoolOrganization.id,
      smisCode: `P110-SMIS-${suffix}`,
      moeCode: `P110-MOE-${suffix}`,
    },
  })
  await client.fiscalYear.create({
    data: {
      schoolId: school.organizationId,
      buddhistYear: FISCAL_YEAR,
      startsOn: new Date("2026-10-01T00:00:00.000Z"),
      endsOn: new Date("2027-09-30T00:00:00.000Z"),
    },
  })
  const identity = await client.authenticatedIdentity.create({
    data: {
      accountIdentifier: `p110-${suffix}@synthetic.test`,
      displayName: `P1-10 actor ${suffix}`,
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

function allocationInput(
  actor: Awaited<ReturnType<typeof createActiveSchoolActor>>,
  idempotencyKey: string,
) {
  return {
    actorIdentityId: actor.identity.id,
    actorMembershipId: actor.membership.id,
    idempotencyKey,
    commandScope: {
      kind: "SCHOOL" as const,
      organizationId: actor.school.organizationId,
      schoolId: actor.school.organizationId,
    },
    numberScope: {
      schoolId: actor.school.organizationId,
      buddhistFiscalYear: FISCAL_YEAR,
      registerCode: REGISTER_CODE,
    },
  }
}

test("P1-10 allocates one durable scoped number and replays the original allocation", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16)

  try {
    const actor = await createActiveSchoolActor(client, suffix)
    const input = allocationInput(actor, `p110:${suffix}:replay`)
    const first = await allocateScopedNumber(client, input)
    const replay = await allocateScopedNumber(client, input)

    assert.equal(first.replayed, false)
    assert.equal(replay.replayed, true)
    assert.deepEqual(replay.result, first.result)
    assert.equal(first.result.value, "1")
    assert.equal(first.result.display, "000001")
    assert.equal(
      await client.scopedNumberAllocation.count({ where: { id: first.result.allocationId } }),
      1,
    )

    const [left, right] = await Promise.all([
      allocateScopedNumber(client, allocationInput(actor, `p110:${suffix}:left`)),
      allocateScopedNumber(client, allocationInput(actor, `p110:${suffix}:right`)),
    ])
    assert.deepEqual(
      [left.result.value, right.result.value].sort(),
      ["2", "3"],
    )

    const sequence = await client.scopedNumberSequence.findUniqueOrThrow({
      where: {
        schoolId_buddhistFiscalYear_registerCode: {
          schoolId: actor.school.organizationId,
          buddhistFiscalYear: FISCAL_YEAR,
          registerCode: REGISTER_CODE,
        },
      },
    })
    assert.equal(sequence.nextValue, BigInt(4))
    assert.equal(
      await client.scopedNumberAllocation.count({ where: { sequenceId: sequence.id } }),
      3,
    )
    await assert.rejects(
      () =>
        client.scopedNumberSequence.update({
          where: { id: sequence.id },
          data: { nextValue: BigInt(5) },
        }),
      /Scoped number sequence and allocation ledger are inconsistent/,
    )
    await assert.rejects(
      () => client.scopedNumberAllocation.delete({ where: { id: first.result.allocationId } }),
      (error: unknown) => error instanceof Error,
    )

    const emptySequence = await client.scopedNumberSequence.create({
      data: {
        schoolId: actor.school.organizationId,
        buddhistFiscalYear: FISCAL_YEAR,
        registerCode: "RECEIPT_REGISTER",
      },
    })
    assert.equal(emptySequence.nextValue, BigInt(1))
    await assert.rejects(
      () => client.scopedNumberAllocation.create({ data: { sequenceId: sequence.id, value: BigInt(4) } }),
      /Scoped number sequence and allocation ledger are inconsistent/,
    )
    const freshScope = { ...input, numberScope: { ...input.numberScope, registerCode: "CASHBOOK" } }
    const [freshLeft, freshRight] = await Promise.all([
      allocateScopedNumber(client, { ...freshScope, idempotencyKey: `p110:${suffix}:fresh-left` }),
      allocateScopedNumber(client, { ...freshScope, idempotencyKey: `p110:${suffix}:fresh-right` }),
    ])
    assert.deepEqual(
      [freshLeft.result.value, freshRight.result.value].sort(),
      ["1", "2"],
    )
    assert.equal(
      await client.scopedNumberSequence.count({
        where: { schoolId: actor.school.organizationId, registerCode: "CASHBOOK" },
      }),
      1,
    )
  } finally {
    await client.$disconnect()
  }
})

test("P1-10 rolls back a scoped number with the caller transaction and enforces School fiscal scope", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16)

  try {
    const actor = await createActiveSchoolActor(client, suffix)
    const numberScope = createScopedNumberScope({
      schoolId: actor.school.organizationId,
      buddhistFiscalYear: FISCAL_YEAR,
      registerCode: REGISTER_CODE,
    })
    await assert.rejects(() =>
      client.$transaction(
        async (transaction) => {
          await allocateScopedNumberInTransaction(transaction, { numberScope })
          await transaction.organization.create({
            data: { type: "PLATFORM", nameTh: `P1-10 rollback ${suffix}` },
          })
          throw new Error("P1-10 forced rollback")
        },
        { isolationLevel: "Serializable" },
      ),
    )
    assert.equal(
      await client.scopedNumberSequence.count({ where: { schoolId: actor.school.organizationId } }),
      0,
    )
    assert.equal(
      await client.scopedNumberAllocation.count({
        where: { sequence: { schoolId: actor.school.organizationId } },
      }),
      0,
    )
    assert.equal(
      await client.organization.count({ where: { nameTh: `P1-10 rollback ${suffix}` } }),
      0,
    )

    const allocated = await client.$transaction(
      (transaction) => allocateScopedNumberInTransaction(transaction, { numberScope }),
      { isolationLevel: "Serializable" },
    )
    assert.equal(allocated.scopedNumber.value, 1)

    await assert.rejects(
      () =>
        allocateScopedNumber(client, {
          ...allocationInput(actor, `p110:${suffix}:wrong-scope`),
          commandScope: {
            kind: "SCHOOL",
            organizationId: actor.school.organizationId,
            schoolId: randomUUID(),
          },
        }),
      /must match the exact School scope/,
    )
  } finally {
    await client.$disconnect()
  }
})
