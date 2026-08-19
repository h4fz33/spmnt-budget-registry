import { createHash } from "node:crypto"

import { z } from "zod"

const uuid = z.string().uuid()
const commandCode = z.string().regex(/^[A-Z][A-Z0-9-]{2,63}$/)
const targetType = z.string().regex(/^[A-Za-z][A-Za-z0-9._-]{0,63}$/)
const targetId = z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/)
const reasonCode = z.string().regex(/^[A-Z][A-Z0-9._:-]{1,127}$/)
const correlationId = z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/)

const platformScopeSchema = z.object({
  kind: z.literal("PLATFORM"),
})

const organizationScopeSchema = z.object({
  kind: z.literal("ORGANIZATION"),
  organizationId: uuid,
})

const schoolScopeSchema = z.object({
  kind: z.literal("SCHOOL"),
  organizationId: uuid,
  schoolId: uuid,
})

const auditScopeSchema = z.discriminatedUnion("kind", [
  platformScopeSchema,
  organizationScopeSchema,
  schoolScopeSchema,
])

const auditEventInputSchema = z.object({
  actorIdentityId: uuid,
  actorMembershipId: uuid,
  scope: auditScopeSchema,
  commandCode,
  targetType,
  targetId,
  outcome: z.enum(["SUCCESS", "DENIED", "FAILED"]),
  reasonCode,
  correlationId: correlationId.nullish(),
  occurredAt: z.date(),
})

export type AuditScope = Readonly<
  | { kind: "PLATFORM" }
  | { kind: "ORGANIZATION"; organizationId: string }
  | { kind: "SCHOOL"; organizationId: string; schoolId: string }
>

export type AuditEventInput = Readonly<{
  actorIdentityId: string
  actorMembershipId: string
  scope: AuditScope
  commandCode: string
  targetType: string
  targetId: string
  outcome: "SUCCESS" | "DENIED" | "FAILED"
  reasonCode: string
  correlationId: string | null
  occurredAt: Date
}>

export type PreparedAuditEvent = AuditEventInput &
  Readonly<{
    sequence: bigint
    actorAuthorizationVersion: number
    actorMembershipAuthorizationVersion: number
    previousIntegrityDigest: string | null
  }>

export function parseAuditEventInput(input: unknown): AuditEventInput {
  const parsed = auditEventInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error("Audit event input is invalid")
  }

  return Object.freeze({
    ...parsed.data,
    correlationId: parsed.data.correlationId ?? null,
    scope: Object.freeze(parsed.data.scope),
  })
}

export function calculateAuditIntegrityDigest(event: PreparedAuditEvent) {
  // Explicit field order makes the digest stable across runtimes and protects
  // every stored metadata field plus the predecessor link.
  const canonical = JSON.stringify({
    version: 1,
    sequence: event.sequence.toString(),
    actorIdentityId: event.actorIdentityId,
    actorMembershipId: event.actorMembershipId,
    actorAuthorizationVersion: event.actorAuthorizationVersion,
    actorMembershipAuthorizationVersion: event.actorMembershipAuthorizationVersion,
    scope: event.scope,
    commandCode: event.commandCode,
    targetType: event.targetType,
    targetId: event.targetId,
    outcome: event.outcome,
    reasonCode: event.reasonCode,
    correlationId: event.correlationId,
    occurredAt: event.occurredAt.toISOString(),
    previousIntegrityDigest: event.previousIntegrityDigest,
  })

  return createHash("sha256").update(canonical, "utf8").digest("hex")
}

export function scopeMatchesRecord(
  scope: AuditScope,
  record: Readonly<{
    scopeKind: "PLATFORM" | "ORGANIZATION" | "SCHOOL"
    scopeOrganizationId: string | null
    scopeSchoolId: string | null
  }>,
) {
  if (scope.kind !== record.scopeKind) {
    return false
  }

  if (scope.kind === "PLATFORM") {
    return record.scopeOrganizationId === null && record.scopeSchoolId === null
  }

  if (scope.kind === "ORGANIZATION") {
    return record.scopeOrganizationId === scope.organizationId && record.scopeSchoolId === null
  }

  return (
    record.scopeOrganizationId === scope.organizationId &&
    record.scopeSchoolId === scope.schoolId
  )
}
