declare const moneySatangBrand: unique symbol

/**
 * An exact amount expressed in satang. Domain code must not accept a JavaScript
 * number for money because a binary floating-point value can already be rounded.
 */
export type MoneySatang = bigint & {
  readonly [moneySatangBrand]: "MoneySatang"
}

const SATANG_PER_BAHT = BigInt(100)
const MONEY_INPUT = /^(-?)(0|[1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)(?:\.(\d{1,2}))?$/

function invalidMoney(message: string): never {
  throw new Error(`Invalid money amount: ${message}`)
}

function groupThousands(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function moneyFromSatang(value: bigint): MoneySatang {
  if (typeof value !== "bigint") {
    return invalidMoney("satang must be a bigint")
  }

  return value as MoneySatang
}

export function moneyToSatang(value: MoneySatang): bigint {
  return value
}

/**
 * Parses an exact THB decimal string into satang. Inputs with more than two
 * fractional digits are rejected; they are never rounded.
 */
export function parseMoney(value: string): MoneySatang {
  if (typeof value !== "string" || value !== value.trim()) {
    return invalidMoney("expected a trimmed decimal string")
  }

  const match = MONEY_INPUT.exec(value)
  if (!match) {
    return invalidMoney("use digits with at most two fractional digits")
  }

  const [, sign, wholeWithGrouping, fraction = ""] = match
  const whole = BigInt(wholeWithGrouping.replaceAll(",", ""))
  const fractionalSatang = BigInt(fraction.padEnd(2, "0"))
  const amount = whole * SATANG_PER_BAHT + fractionalSatang

  return moneyFromSatang(sign === "-" ? -amount : amount)
}

/** Serializes money without grouping so it can safely cross API and database boundaries. */
export function serializeMoney(value: MoneySatang): string {
  const amount = moneyToSatang(value)
  const negative = amount < BigInt(0)
  const absolute = negative ? -amount : amount
  const whole = absolute / SATANG_PER_BAHT
  const fraction = (absolute % SATANG_PER_BAHT).toString().padStart(2, "0")

  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`
}

/** Formats an exact amount for Thai baht display while retaining ASCII digits. */
export function formatMoney(value: MoneySatang): string {
  const serialized = serializeMoney(value)
  const negative = serialized.startsWith("-")
  const unsigned = negative ? serialized.slice(1) : serialized
  const [whole, fraction] = unsigned.split(".")

  return `${negative ? "-" : ""}${groupThousands(whole)}.${fraction}`
}

export function isPositiveMoney(value: MoneySatang): boolean {
  return moneyToSatang(value) > BigInt(0)
}

export function requirePositiveMoney(value: MoneySatang, label = "amount"): MoneySatang {
  if (!isPositiveMoney(value)) {
    throw new Error(`${label} must be greater than zero`)
  }

  return value
}

export function addMoney(...values: readonly MoneySatang[]): MoneySatang {
  return moneyFromSatang(values.reduce((total, value) => total + moneyToSatang(value), BigInt(0)))
}
