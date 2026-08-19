import { createHash } from "node:crypto"

import { z } from "zod"

const uuid = z.string().uuid()
const commandCode = z.string().regex(/^[A-Z][A-Z0-9-]{2,63}$/)
const idempotencyKey = z.string().regex(/^[A-Za-z0-9._:-]{8,128}$/)
const messageType = z.string().regex(/^[A-Z][A-Z0-9._-]{2,63}$/)
const aggregateType = z.string().regex(/^[A-Za-z][A-Za-z0-9._-]{0,63}$/)
const aggregateId = z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/)
const workerId = z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/)
const failureCode = z.string().regex(/^[A-Z][A-Z0-9._:-]{1,127}$/)

const platformScopeSchema = z.object({ kind: z.literal("PLATFORM") }).strict()
const organizationScopeSchema = z
  .object({ kind: z.literal("ORGANIZATION"), organizationId: uuid })
  .strict()
const schoolScopeSchema = z
  .object({ kind: z.literal("SCHOOL"), organizationId: uuid, schoolId: uuid })
  .strict()

const commandScopeSchema = z.discriminatedUnion("kind", [
  platformScopeSchema,
  organizationScopeSchema,
  schoolScopeSchema,
])

export type JsonPrimitive = string | number | boolean | null

export interface JsonArray extends ReadonlyArray<JsonValue> {}

export interface JsonObject {
  readonly [key: string]: JsonValue
}

export type JsonValue = JsonPrimitive | JsonArray | JsonObject

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
)

const idempotentCommandInputSchema = z
  .object({
    actorIdentityId: uuid,
    actorMembershipId: uuid,
    scope: commandScopeSchema,
    commandCode,
    idempotencyKey,
    request: jsonValueSchema,
  })
  .strict()

const outboxMessageInputSchema = z
  .object({
    messageType,
    aggregateType,
    aggregateId,
    payload: jsonValueSchema,
    deduplicationKey: idempotencyKey,
    availableAt: z.date().optional(),
  })
  .strict()

export type CommandScope = Readonly<
  | { kind: "PLATFORM" }
  | { kind: "ORGANIZATION"; organizationId: string }
  | { kind: "SCHOOL"; organizationId: string; schoolId: string }
>

export type IdempotentCommandInput = Readonly<{
  actorIdentityId: string
  actorMembershipId: string
  scope: CommandScope
  commandCode: string
  idempotencyKey: string
  request: JsonValue
}>

export type OutboxMessageInput = Readonly<{
  messageType: string
  aggregateType: string
  aggregateId: string
  payload: JsonValue
  deduplicationKey: string
  availableAt?: Date
}>

export function parseIdempotentCommandInput(input: unknown): IdempotentCommandInput {
  const parsed = idempotentCommandInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error("Idempotent command input is invalid")
  }

  const data = parsed.data as Omit<IdempotentCommandInput, "scope" | "request"> & {
    scope: CommandScope
    request: JsonValue
  }
  return Object.freeze({
    ...data,
    scope: Object.freeze(data.scope),
    request: cloneJsonValue(data.request),
  })
}

export function parseOutboxMessageInput(input: unknown): OutboxMessageInput {
  const parsed = outboxMessageInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error("Outbox message input is invalid")
  }

  const data = parsed.data as Omit<OutboxMessageInput, "payload"> & { payload: JsonValue }
  return Object.freeze({
    ...data,
    payload: cloneJsonValue(data.payload),
  })
}

export function parseJsonValue(value: unknown): JsonValue {
  const parsed = jsonValueSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error("Idempotent command results and outbox payloads must be JSON values")
  }

  return cloneJsonValue(parsed.data as JsonValue)
}

export function idempotencyScopeKey(scope: CommandScope) {
  if (scope.kind === "PLATFORM") {
    return "PLATFORM"
  }

  if (scope.kind === "ORGANIZATION") {
    return `ORGANIZATION:${scope.organizationId}`
  }

  if (scope.organizationId !== scope.schoolId) {
    throw new Error("School idempotency scope must use the exact School organization")
  }

  return `SCHOOL:${scope.schoolId}`
}

export function calculateJsonIntegrityDigest(value: JsonValue) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex")
}

export function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value)
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("JSON number must be finite")
    }
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`
  }

  const objectValue = value as JsonObject
  const entries = Object.keys(objectValue)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(objectValue[key]!)}`)
  return `{${entries.join(",")}}`
}

function cloneJsonValue(value: JsonValue): JsonValue {
  return JSON.parse(canonicalJson(value)) as JsonValue
}

export function parseOutboxWorkerId(value: unknown) {
  const parsed = workerId.safeParse(value)
  if (!parsed.success) {
    throw new Error("Outbox worker identifier is invalid")
  }
  return parsed.data
}

export function parseOutboxFailureCode(value: unknown) {
  const parsed = failureCode.safeParse(value)
  if (!parsed.success) {
    throw new Error("Outbox failure code is invalid")
  }
  return parsed.data
}
