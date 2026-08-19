import type { Prisma, PrismaClient } from "../../../generated/prisma/client.ts"

import { executeIdempotentCommand, type IdempotentCommandResult } from "../reliability/core.ts"

import {
  createScopedNumberScope,
  formatScopedNumber,
  type ScopedNumber,
  type ScopedNumberScope,
} from "./scoped-numbering.ts"

type DatabaseTransaction = Prisma.TransactionClient

const ALLOCATE_SCOPED_NUMBER_COMMAND = "P1-10-ALLOCATE-SCOPED-NUMBER"
const FIRST_UNALLOCATED_VALUE = BigInt(2)

export type ScopedNumberAllocationInput = Readonly<{
  actorIdentityId: string
  actorMembershipId: string
  idempotencyKey: string
  commandScope: Readonly<{
    kind: "SCHOOL"
    organizationId: string
    schoolId: string
  }>
  numberScope: Readonly<{
    schoolId: string
    buddhistFiscalYear: number
    registerCode: string
  }>
}>

export type ScopedNumberAllocationResult = Readonly<{
  allocationId: string
  scopedNumber: ScopedNumber
}>

type StoredScopedNumberAllocationResult = Readonly<{
  allocationId: string
  schoolId: string
  buddhistFiscalYear: number
  registerCode: string
  value: string
  display: string
}>

/**
 * Allocates a durable number through the caller's existing transaction. The
 * caller owns authorization and any business record, so rollback reverts both
 * that record and this allocation without leaving a committed gap.
 */
export async function allocateScopedNumberInTransaction(
  transaction: DatabaseTransaction,
  input: Readonly<{
    numberScope: ScopedNumberScope
  }>,
): Promise<ScopedNumberAllocationResult> {
  const numberScope = createScopedNumberScope(input.numberScope)
  const sequence = await transaction.scopedNumberSequence.upsert({
    where: {
      schoolId_buddhistFiscalYear_registerCode: {
        schoolId: numberScope.schoolId,
        buddhistFiscalYear: numberScope.buddhistFiscalYear,
        registerCode: numberScope.registerCode,
      },
    },
    create: {
      schoolId: numberScope.schoolId,
      buddhistFiscalYear: numberScope.buddhistFiscalYear,
      registerCode: numberScope.registerCode,
      nextValue: FIRST_UNALLOCATED_VALUE,
    },
    update: {
      nextValue: { increment: BigInt(1) },
    },
  })
  const value = sequence.nextValue - BigInt(1)
  const scopedNumber = toScopedNumber(numberScope, value)
  const allocation = await transaction.scopedNumberAllocation.create({
    data: {
      sequenceId: sequence.id,
      value,
    },
  })

  return Object.freeze({ allocationId: allocation.id, scopedNumber })
}

/**
 * Persists a successful allocation under the existing P1-09 command-replay
 * contract. A replay returns the initial allocation without advancing a
 * sequence or creating a second allocation record.
 */
export async function allocateScopedNumber(
  database: PrismaClient,
  input: ScopedNumberAllocationInput,
): Promise<IdempotentCommandResult<StoredScopedNumberAllocationResult>> {
  const numberScope = createScopedNumberScope(input.numberScope)
  const commandScope = scopedNumberCommandScope(input.commandScope, numberScope)

  return executeIdempotentCommand<StoredScopedNumberAllocationResult>(
    database,
    {
      actorIdentityId: input.actorIdentityId,
      actorMembershipId: input.actorMembershipId,
      scope: commandScope,
      commandCode: ALLOCATE_SCOPED_NUMBER_COMMAND,
      idempotencyKey: input.idempotencyKey,
      request: {
        action: "ALLOCATE_SCOPED_NUMBER",
        version: 1,
        schoolId: numberScope.schoolId,
        buddhistFiscalYear: numberScope.buddhistFiscalYear,
        registerCode: numberScope.registerCode,
      },
    },
    async (transaction) => {
      const allocation = await allocateScopedNumberInTransaction(transaction, { numberScope })
      return serializeAllocation(allocation)
    },
  )
}

function scopedNumberCommandScope(
  commandScope: ScopedNumberAllocationInput["commandScope"],
  numberScope: ScopedNumberScope,
) {
  if (
    commandScope.organizationId !== commandScope.schoolId ||
    commandScope.schoolId !== numberScope.schoolId
  ) {
    throw new Error("Scoped number command scope must match the exact School scope")
  }

  return Object.freeze({
    kind: "SCHOOL" as const,
    organizationId: commandScope.organizationId,
    schoolId: commandScope.schoolId,
  })
}

function serializeAllocation(allocation: ScopedNumberAllocationResult): StoredScopedNumberAllocationResult {
  return Object.freeze({
    allocationId: allocation.allocationId,
    schoolId: allocation.scopedNumber.scope.schoolId,
    buddhistFiscalYear: allocation.scopedNumber.scope.buddhistFiscalYear,
    registerCode: allocation.scopedNumber.scope.registerCode,
    value: allocation.scopedNumber.value.toString(),
    display: allocation.scopedNumber.display,
  })
}

function toScopedNumber(scope: ScopedNumberScope, value: bigint): ScopedNumber {
  const numberValue = Number(value)
  if (!Number.isSafeInteger(numberValue) || numberValue < 1) {
    throw new Error("Scoped number sequence value is outside the supported safe-integer range")
  }

  return Object.freeze({ scope, value: numberValue, display: formatScopedNumber(numberValue) })
}
