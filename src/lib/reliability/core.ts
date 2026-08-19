import { Prisma } from "../../../generated/prisma/client.ts"
import type {
  CommandIdempotencyRecord,
  OutboxDeliveryAttempt,
  OutboxMessage,
  PrismaClient,
} from "../../../generated/prisma/client"

import { withSerializableRetry } from "../database/with-serializable-retry.ts"

import {
  calculateJsonIntegrityDigest,
  idempotencyScopeKey,
  parseIdempotentCommandInput,
  parseJsonValue,
  parseOutboxFailureCode,
  parseOutboxMessageInput,
  parseOutboxWorkerId,
  type CommandScope,
  type IdempotentCommandInput,
  type JsonValue,
  type OutboxMessageInput,
} from "./contract.ts"

type DatabaseTransaction = Prisma.TransactionClient

const DEFAULT_OUTBOX_LEASE_MS = 30_000
const DEFAULT_OUTBOX_MAX_ATTEMPTS = 5
const OUTBOX_RETRY_BASE_MS = 1_000
const OUTBOX_RETRY_MAX_MS = 60_000

export class IdempotencyKeyReuseError extends Error {
  constructor() {
    super("Idempotency key was already used with a different command request")
    this.name = "IdempotencyKeyReuseError"
  }
}

export class OutboxDeduplicationConflictError extends Error {
  constructor() {
    super("Outbox deduplication key was already used for a different message")
    this.name = "OutboxDeduplicationConflictError"
  }
}

export class OutboxLeaseLostError extends Error {
  constructor() {
    super("Outbox message lease is no longer held by this worker")
    this.name = "OutboxLeaseLostError"
  }
}

export class OutboxDeliveryFailure extends Error {
  readonly code: string

  constructor(code: string) {
    super("Outbox delivery failed")
    this.name = "OutboxDeliveryFailure"
    this.code = parseOutboxFailureCode(code)
  }
}

export type IdempotentCommandResult<T extends JsonValue> = Readonly<{
  result: T
  replayed: boolean
  idempotencyRecord: CommandIdempotencyRecord
}>

export type IdempotentCommandHandler<T extends JsonValue> = (
  transaction: DatabaseTransaction,
) => Promise<T>

export async function executeIdempotentCommand<T extends JsonValue>(
  database: PrismaClient,
  input: unknown,
  handler: IdempotentCommandHandler<T>,
): Promise<IdempotentCommandResult<T>> {
  const command = parseIdempotentCommandInput(input)
  const scopeKey = idempotencyScopeKey(command.scope)
  const requestIntegrityDigest = calculateJsonIntegrityDigest(command.request)

  try {
    return await withSerializableRetry(
      () =>
        database.$transaction(
          async (transaction) => {
          // The unique key is the durable backstop; this scoped advisory lock
          // makes concurrent duplicate submission take the replay branch.
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(
              hashtextextended(${idempotencyLockKey(command, scopeKey)}, 9)
            )
          `

          const existing = await transaction.commandIdempotencyRecord.findUnique({
            where: {
              actorIdentityId_scopeKey_commandCode_idempotencyKey: {
                actorIdentityId: command.actorIdentityId,
                scopeKey,
                commandCode: command.commandCode,
                idempotencyKey: command.idempotencyKey,
              },
            },
          })
          if (existing) {
            if (existing.requestIntegrityDigest !== requestIntegrityDigest) {
              throw new IdempotencyKeyReuseError()
            }

            return Object.freeze({
              result: parseJsonValue(existing.responseBody) as T,
              replayed: true,
              idempotencyRecord: existing,
            })
          }

          const result = parseJsonValue(await handler(transaction)) as T
          const record = await transaction.commandIdempotencyRecord.create({
            data: {
              actorIdentityId: command.actorIdentityId,
              actorMembershipId: command.actorMembershipId,
              ...scopeData(command.scope),
              scopeKey,
              commandCode: command.commandCode,
              idempotencyKey: command.idempotencyKey,
              requestIntegrityDigest,
              responseBody: toPrismaJson(result),
              completedAt: new Date(),
            },
          })

          return Object.freeze({ result, replayed: false, idempotencyRecord: record })
          },
          { isolationLevel: "Serializable" },
        ),
      { operationKey: "P1-09-IDEMPOTENT-COMMAND" },
    )
  } catch (error) {
    // A concurrent SERIALIZABLE transaction can take its snapshot before it
    // waits on the advisory lock. If the winning command commits during that
    // wait, an unrelated unique write in the losing body can surface first.
    // Resolve only a now-committed exact key as replay; otherwise preserve the
    // original domain or infrastructure error.
    const committed = await database.commandIdempotencyRecord.findUnique({
      where: {
        actorIdentityId_scopeKey_commandCode_idempotencyKey: {
          actorIdentityId: command.actorIdentityId,
          scopeKey,
          commandCode: command.commandCode,
          idempotencyKey: command.idempotencyKey,
        },
      },
    })
    if (!committed) {
      throw error
    }
    if (committed.requestIntegrityDigest !== requestIntegrityDigest) {
      throw new IdempotencyKeyReuseError()
    }
    return Object.freeze({
      result: parseJsonValue(committed.responseBody) as T,
      replayed: true,
      idempotencyRecord: committed,
    })
  }
}

export async function enqueueOutboxMessageInTransaction(
  transaction: DatabaseTransaction,
  input: unknown,
): Promise<OutboxMessage> {
  const message = parseOutboxMessageInput(input)
  const payloadIntegrityDigest = calculateJsonIntegrityDigest(message.payload)

  const existing = await transaction.outboxMessage.findUnique({
    where: { deduplicationKey: message.deduplicationKey },
  })
  if (existing) {
    return assertMatchingOutboxMessage(existing, message, payloadIntegrityDigest)
  }

  try {
    return await transaction.outboxMessage.create({
      data: {
        messageType: message.messageType,
        aggregateType: message.aggregateType,
        aggregateId: message.aggregateId,
        payload: toPrismaJson(message.payload),
        payloadIntegrityDigest,
        deduplicationKey: message.deduplicationKey,
        availableAt: message.availableAt,
      },
    })
  } catch (error) {
    if (!hasErrorCode(error, "P2002")) {
      throw error
    }

    const duplicate = await transaction.outboxMessage.findUnique({
      where: { deduplicationKey: message.deduplicationKey },
    })
    if (!duplicate) {
      throw error
    }
    return assertMatchingOutboxMessage(duplicate, message, payloadIntegrityDigest)
  }
}

export type ClaimOutboxMessagesInput = Readonly<{
  workerId: string
  limit?: number
  leaseMs?: number
  now?: Date
}>

export async function claimOutboxMessages(
  database: PrismaClient,
  input: ClaimOutboxMessagesInput,
): Promise<readonly OutboxMessage[]> {
  const workerId = parseOutboxWorkerId(input.workerId)
  const limit = positiveInteger(input.limit ?? 10, "Outbox claim limit", 100)
  const leaseMs = positiveInteger(input.leaseMs ?? DEFAULT_OUTBOX_LEASE_MS, "Outbox lease duration", 300_000)
  const now = input.now ?? new Date()
  const leaseExpiresAt = new Date(now.getTime() + leaseMs)

  return withSerializableRetry(
    () =>
      database.$transaction(
        async (transaction) => {
          const claims = await transaction.$queryRaw<
            ReadonlyArray<{
              id: string
              leaseAbandoned: boolean
              abandonedWorkerId: string | null
              abandonedAttemptNumber: number | null
            }>
          >`
            WITH eligible AS (
              SELECT "id", "status", "leaseOwner", "deliveryAttempts"
              FROM "OutboxMessage"
              WHERE (
                ("status" = 'PENDING' AND "availableAt" <= ${now})
                OR ("status" = 'PROCESSING' AND "leaseExpiresAt" <= ${now})
              )
              ORDER BY "availableAt" ASC, "createdAt" ASC, "id" ASC
              FOR UPDATE SKIP LOCKED
              LIMIT ${limit}
            )
            UPDATE "OutboxMessage" message
            SET "status" = 'PROCESSING'::"OutboxMessageStatus",
                "leaseOwner" = ${workerId},
                "leasedAt" = ${now},
                "leaseExpiresAt" = ${leaseExpiresAt},
                "deliveryAttempts" = CASE
                  WHEN eligible."status" = 'PROCESSING'::"OutboxMessageStatus"
                    THEN message."deliveryAttempts" + 1
                  ELSE message."deliveryAttempts"
                END,
                "updatedAt" = ${now}
            FROM eligible
            WHERE message."id" = eligible."id"
            RETURNING
              message."id",
              (eligible."status" = 'PROCESSING'::"OutboxMessageStatus") AS "leaseAbandoned",
              eligible."leaseOwner" AS "abandonedWorkerId",
              CASE
                WHEN eligible."status" = 'PROCESSING'::"OutboxMessageStatus"
                  THEN message."deliveryAttempts"
                ELSE NULL
              END AS "abandonedAttemptNumber"
          `
          if (claims.length === 0) {
            return []
          }

          await Promise.all(
            claims
              .filter(
                (claim) =>
                  claim.leaseAbandoned &&
                  claim.abandonedWorkerId !== null &&
                  claim.abandonedAttemptNumber !== null,
              )
              .map((claim) =>
                transaction.outboxDeliveryAttempt.create({
                  data: {
                    messageId: claim.id,
                    attemptNumber: claim.abandonedAttemptNumber!,
                    workerId: claim.abandonedWorkerId!,
                    outcome: "ABANDONED",
                    failureCode: "LEASE_EXPIRED",
                    occurredAt: now,
                  },
                }),
              ),
          )

          const messages = await transaction.outboxMessage.findMany({
            where: { id: { in: claims.map((claim) => claim.id) } },
          })
          const byId = new Map(messages.map((message) => [message.id, message]))
          return claims.map((claim) => byId.get(claim.id)!).filter(Boolean)
        },
        { isolationLevel: "Serializable" },
      ),
    { operationKey: "P1-09-OUTBOX-CLAIM" },
  )
}

export type CompleteOutboxDeliveryInput = Readonly<{
  messageId: string
  workerId: string
  delivered: boolean
  failureCode?: string
  maxAttempts?: number
  now?: Date
}>

export type CompletedOutboxDelivery = Readonly<{
  message: OutboxMessage
  attempt: OutboxDeliveryAttempt
}>

export async function completeOutboxDelivery(
  database: PrismaClient,
  input: CompleteOutboxDeliveryInput,
): Promise<CompletedOutboxDelivery> {
  const messageId = parseUuid(input.messageId, "Outbox message id")
  const workerId = parseOutboxWorkerId(input.workerId)
  const maxAttempts = positiveInteger(
    input.maxAttempts ?? DEFAULT_OUTBOX_MAX_ATTEMPTS,
    "Outbox maximum attempts",
    100,
  )
  const failureCode = input.delivered ? undefined : parseOutboxFailureCode(input.failureCode)
  const now = input.now ?? new Date()

  return withSerializableRetry(
    () =>
      database.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(
              hashtextextended(${"SchoolBanchee outbox delivery " + messageId}, 9)
            )
          `

          const message = await transaction.outboxMessage.findFirst({
            where: {
              id: messageId,
              status: "PROCESSING",
              leaseOwner: workerId,
              leaseExpiresAt: { gt: now },
            },
          })
          if (!message) {
            throw new OutboxLeaseLostError()
          }

          const attemptNumber = message.deliveryAttempts + 1
          if (input.delivered) {
            const completedMessage = await transaction.outboxMessage.update({
              where: { id: message.id },
              data: {
                status: "DELIVERED",
                leaseOwner: null,
                leasedAt: null,
                leaseExpiresAt: null,
                deliveryAttempts: attemptNumber,
                deliveredAt: now,
                lastFailureCode: null,
              },
            })
            const attempt = await transaction.outboxDeliveryAttempt.create({
              data: {
                messageId: message.id,
                attemptNumber,
                workerId,
                outcome: "DELIVERED",
                occurredAt: now,
              },
            })
            return Object.freeze({ message: completedMessage, attempt })
          }

          if (attemptNumber >= maxAttempts) {
            const completedMessage = await transaction.outboxMessage.update({
              where: { id: message.id },
              data: {
                status: "DEAD_LETTER",
                leaseOwner: null,
                leasedAt: null,
                leaseExpiresAt: null,
                deliveryAttempts: attemptNumber,
                deadLetteredAt: now,
                lastFailureCode: failureCode,
              },
            })
            const attempt = await transaction.outboxDeliveryAttempt.create({
              data: {
                messageId: message.id,
                attemptNumber,
                workerId,
                outcome: "DEAD_LETTERED",
                failureCode,
                occurredAt: now,
              },
            })
            return Object.freeze({ message: completedMessage, attempt })
          }

          const nextAvailableAt = calculateOutboxRetryAt(now, attemptNumber)
          const completedMessage = await transaction.outboxMessage.update({
            where: { id: message.id },
            data: {
              status: "PENDING",
              leaseOwner: null,
              leasedAt: null,
              leaseExpiresAt: null,
              deliveryAttempts: attemptNumber,
              availableAt: nextAvailableAt,
              lastFailureCode: failureCode,
            },
          })
          const attempt = await transaction.outboxDeliveryAttempt.create({
            data: {
              messageId: message.id,
              attemptNumber,
              workerId,
              outcome: "RETRY_SCHEDULED",
              failureCode,
              occurredAt: now,
              nextAvailableAt,
            },
          })
          return Object.freeze({ message: completedMessage, attempt })
        },
        { isolationLevel: "Serializable" },
      ),
    { operationKey: "P1-09-OUTBOX-COMPLETE" },
  )
}

export type OutboxHandlerMessage = Readonly<{
  id: string
  messageType: string
  aggregateType: string
  aggregateId: string
  payload: JsonValue
  deliveryKey: string
}>

export type ProcessOutboxBatchInput = ClaimOutboxMessagesInput &
  Readonly<{
    maxAttempts?: number
    handler: (message: OutboxHandlerMessage) => Promise<void>
  }>

export type ProcessOutboxBatchResult = Readonly<{
  claimed: number
  delivered: number
  retryScheduled: number
  deadLettered: number
  leaseLost: number
}>

export async function processOutboxBatch(
  database: PrismaClient,
  input: ProcessOutboxBatchInput,
): Promise<ProcessOutboxBatchResult> {
  const now = input.now ?? new Date()
  const messages = await claimOutboxMessages(database, { ...input, now })
  let delivered = 0
  let retryScheduled = 0
  let deadLettered = 0
  let leaseLost = 0

  for (const message of messages) {
    try {
      await input.handler(outboxHandlerMessage(message))
      const completion = await completeOutboxDelivery(database, {
        messageId: message.id,
        workerId: input.workerId,
        delivered: true,
        maxAttempts: input.maxAttempts,
        now,
      })
      if (completion.attempt.outcome === "DELIVERED") {
        delivered += 1
      }
    } catch (error) {
      if (error instanceof OutboxLeaseLostError) {
        leaseLost += 1
        continue
      }

      const completion = await completeOutboxDelivery(database, {
        messageId: message.id,
        workerId: input.workerId,
        delivered: false,
        failureCode: deliveryFailureCode(error),
        maxAttempts: input.maxAttempts,
        now,
      })
      if (completion.attempt.outcome === "DEAD_LETTERED") {
        deadLettered += 1
      } else {
        retryScheduled += 1
      }
    }
  }

  return Object.freeze({
    claimed: messages.length,
    delivered,
    retryScheduled,
    deadLettered,
    leaseLost,
  })
}

export function calculateOutboxRetryAt(completedAt: Date, attemptNumber: number) {
  const validatedAttempt = positiveInteger(attemptNumber, "Outbox attempt number", 100)
  const delayMs = Math.min(OUTBOX_RETRY_BASE_MS * 2 ** (validatedAttempt - 1), OUTBOX_RETRY_MAX_MS)
  return new Date(completedAt.getTime() + delayMs)
}

function idempotencyLockKey(command: IdempotentCommandInput, scopeKey: string) {
  return `SchoolBanchee idempotency ${command.actorIdentityId}:${scopeKey}:${command.commandCode}:${command.idempotencyKey}`
}

function scopeData(scope: CommandScope) {
  if (scope.kind === "PLATFORM") {
    return {
      scopeKind: "PLATFORM" as const,
      scopeOrganizationId: null,
      scopeSchoolId: null,
    }
  }

  if (scope.kind === "ORGANIZATION") {
    return {
      scopeKind: "ORGANIZATION" as const,
      scopeOrganizationId: scope.organizationId,
      scopeSchoolId: null,
    }
  }

  return {
    scopeKind: "SCHOOL" as const,
    scopeOrganizationId: scope.organizationId,
    scopeSchoolId: scope.schoolId,
  }
}

function assertMatchingOutboxMessage(
  existing: OutboxMessage,
  input: OutboxMessageInput,
  payloadIntegrityDigest: string,
) {
  if (
    existing.messageType !== input.messageType ||
    existing.aggregateType !== input.aggregateType ||
    existing.aggregateId !== input.aggregateId ||
    existing.payloadIntegrityDigest !== payloadIntegrityDigest
  ) {
    throw new OutboxDeduplicationConflictError()
  }
  return existing
}

function toPrismaJson(value: JsonValue): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue)
}

function hasErrorCode(error: unknown, expectedCode: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === expectedCode
}

function positiveInteger(value: number, label: string, maximum: number) {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${label} must be an integer from 1 through ${maximum}`)
  }
  return value
}

function parseUuid(value: string, label: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${label} is invalid`)
  }
  return value
}

function deliveryFailureCode(error: unknown) {
  return error instanceof OutboxDeliveryFailure ? error.code : "OUTBOX_HANDLER_FAILURE"
}

function outboxHandlerMessage(message: OutboxMessage): OutboxHandlerMessage {
  return Object.freeze({
    id: message.id,
    messageType: message.messageType,
    aggregateType: message.aggregateType,
    aggregateId: message.aggregateId,
    payload: parseJsonValue(message.payload),
    // Recipients use this stable key to make at-least-once worker delivery safe.
    deliveryKey: message.id,
  })
}
