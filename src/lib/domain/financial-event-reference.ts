declare const financialEventReferenceBrand: unique symbol

export type FinancialEventReference = string & {
  readonly [financialEventReferenceBrand]: "FinancialEventReference"
}

export type UuidGenerator = () => string

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const FINANCIAL_EVENT_REFERENCE = /^FE-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/

function defaultUuidGenerator(): string {
  return globalThis.crypto.randomUUID()
}

/**
 * Parses the opaque, platform-unique Financial Event Reference. The identifier
 * is created once during posting and persisted unchanged on every linked record.
 */
export function parseFinancialEventReference(value: string): FinancialEventReference {
  if (typeof value !== "string" || value !== value.trim()) {
    throw new Error("Financial Event Reference must be a trimmed string")
  }

  if (!FINANCIAL_EVENT_REFERENCE.test(value)) {
    throw new Error("Financial Event Reference must use canonical FE-UUIDv4 format")
  }

  return value as FinancialEventReference
}

export function createFinancialEventReference(
  generateUuid: UuidGenerator = defaultUuidGenerator,
): FinancialEventReference {
  const uuid = generateUuid()

  if (typeof uuid !== "string" || !UUID_V4.test(uuid)) {
    throw new Error("Financial Event Reference generator must return a canonical UUIDv4")
  }

  return parseFinancialEventReference(`FE-${uuid}`)
}
