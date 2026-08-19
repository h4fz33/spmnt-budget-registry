import { buddhistFiscalYear, type BuddhistFiscalYear } from "./fiscal-date.ts"

export type ScopedNumberScope = Readonly<{
  schoolId: string
  buddhistFiscalYear: BuddhistFiscalYear
  registerCode: string
}>

export type ScopedNumber = Readonly<{
  scope: ScopedNumberScope
  value: number
  display: string
}>

export type ScopedNumberSequenceState = Readonly<{
  scope: ScopedNumberScope
  nextValue: number
}>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const REGISTER_CODE = /^[A-Z][A-Z0-9_]{0,31}$/
const MAX_SCOPED_NUMBER = Number.MAX_SAFE_INTEGER

function requirePositiveSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive safe integer`)
  }

  return value
}

function requireWidth(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > 18) {
    throw new Error("Scoped number width must be an integer between 1 and 18")
  }

  return value
}

export function createScopedNumberScope(input: {
  schoolId: string
  buddhistFiscalYear: number
  registerCode: string
}): ScopedNumberScope {
  if (typeof input.schoolId !== "string" || !UUID.test(input.schoolId)) {
    throw new Error("Scoped number schoolId must be a canonical UUID")
  }

  if (typeof input.registerCode !== "string" || !REGISTER_CODE.test(input.registerCode)) {
    throw new Error("Scoped number registerCode must use uppercase A-Z, 0-9, or underscore")
  }

  return Object.freeze({
    schoolId: input.schoolId,
    buddhistFiscalYear: buddhistFiscalYear(input.buddhistFiscalYear),
    registerCode: input.registerCode,
  })
}

/** Stable serialization for sequence-table keys and idempotency records. */
export function scopedNumberScopeKey(scope: ScopedNumberScope): string {
  return `${scope.schoolId}:${scope.buddhistFiscalYear}:${scope.registerCode}`
}

export function formatScopedNumber(value: number, width = 6): string {
  return requirePositiveSafeInteger(value, "Scoped number").toString().padStart(requireWidth(width), "0")
}

export function parseScopedNumber(value: string): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error("Scoped number must contain digits only")
  }

  return requirePositiveSafeInteger(Number(value), "Scoped number")
}

export function allocateNextScopedNumber(state: ScopedNumberSequenceState): {
  allocated: ScopedNumber
  next: ScopedNumberSequenceState
} {
  const value = requirePositiveSafeInteger(state.nextValue, "Next scoped number")
  if (value === MAX_SCOPED_NUMBER) {
    throw new Error("Scoped number sequence is exhausted")
  }

  const scope = createScopedNumberScope(state.scope)
  return Object.freeze({
    allocated: Object.freeze({ scope, value, display: formatScopedNumber(value) }),
    next: Object.freeze({ scope, nextValue: value + 1 }),
  })
}

/**
 * Detects duplicate values and gaps in an already allocated scope. It is a
 * verifier, not a concurrency mechanism; durable allocation is intentionally
 * deferred until a PostgreSQL sequence table can be introduced.
 */
export function assertScopedNumbersContiguous(numbers: readonly ScopedNumber[]): void {
  const byScope = new Map<string, number[]>()

  for (const number of numbers) {
    const scope = createScopedNumberScope(number.scope)
    const value = requirePositiveSafeInteger(number.value, "Scoped number")
    const key = scopedNumberScopeKey(scope)
    const values = byScope.get(key) ?? []
    values.push(value)
    byScope.set(key, values)
  }

  for (const [scope, values] of byScope) {
    values.sort((left, right) => left - right)

    for (let index = 0; index < values.length; index += 1) {
      const expected = index + 1
      if (values[index] !== expected) {
        const reason = values[index] < expected ? "duplicate" : "gap"
        throw new Error(`Scoped number ${reason} in ${scope}: expected ${expected}, received ${values[index]}`)
      }
    }
  }
}

/**
 * Required durable integration for a later migration and financial posting:
 * - a sequence row is uniquely keyed by schoolId, buddhistFiscalYear, and registerCode;
 * - nextValue is positive and advanced in the same SERIALIZABLE transaction as the event;
 * - the allocated value has a unique constraint in its owning document/register table;
 * - an idempotency key returns its prior allocation on serialization retry;
 * - allocation failure rolls back the event, so no committed number is skipped.
 */
export const SCOPED_NUMBERING_PERSISTENCE_CONTRACT = Object.freeze({
  sequenceKey: ["schoolId", "buddhistFiscalYear", "registerCode"],
  initialValue: 1,
  isolationLevel: "SERIALIZABLE",
  requiresIdempotencyKey: true,
  requiresOwningRecordUniqueConstraint: true,
} as const)
