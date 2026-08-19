declare const gregorianDateBrand: unique symbol
declare const buddhistFiscalYearBrand: unique symbol

export type GregorianDate = string & {
  readonly [gregorianDateBrand]: "GregorianDate"
}

export type BuddhistFiscalYear = number & {
  readonly [buddhistFiscalYearBrand]: "BuddhistFiscalYear"
}

export type FiscalYearRange = Readonly<{
  buddhistYear: BuddhistFiscalYear
  startsOn: GregorianDate
  endsOn: GregorianDate
}>

const GREGORIAN_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const BUDDHIST_ERA_DATE = /^(\d{4,5})-(\d{2})-(\d{2})$/
const BUDDHIST_ERA_OFFSET = 543
const MIN_GREGORIAN_YEAR = 1000
const MAX_GREGORIAN_YEAR = 9999

type DateParts = Readonly<{
  year: number
  month: number
  day: number
}>

function invalidDate(message: string): never {
  throw new Error(`Invalid Gregorian date: ${message}`)
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year: number, month: number): number {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return days[month - 1] ?? 0
}

function parseDateParts(
  value: string,
  expression: RegExp,
  label: string,
  calendarYearOffset = 0,
): DateParts {
  if (typeof value !== "string" || value !== value.trim()) {
    return invalidDate(`expected a trimmed ${label} string`)
  }

  const match = expression.exec(value)
  if (!match) {
    return invalidDate(`expected ${label} as YYYY-MM-DD`)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return invalidDate(`expected numeric ${label} fields`)
  }

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year + calendarYearOffset, month)) {
    return invalidDate(`calendar day does not exist: ${value}`)
  }

  return { year, month, day }
}

function formatGregorianDate({ year, month, day }: DateParts): GregorianDate {
  if (year < MIN_GREGORIAN_YEAR || year > MAX_GREGORIAN_YEAR) {
    return invalidDate(`year must be between ${MIN_GREGORIAN_YEAR} and ${MAX_GREGORIAN_YEAR}`)
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}` as GregorianDate
}

export function parseGregorianDate(value: string): GregorianDate {
  return formatGregorianDate(parseDateParts(value, GREGORIAN_DATE, "Gregorian date"))
}

export function toBuddhistEraDate(value: GregorianDate): string {
  const date = parseDateParts(value, GREGORIAN_DATE, "Gregorian date")
  return `${(date.year + BUDDHIST_ERA_OFFSET).toString().padStart(4, "0")}-${date.month
    .toString()
    .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`
}

export function fromBuddhistEraDate(value: string): GregorianDate {
  const date = parseDateParts(value, BUDDHIST_ERA_DATE, "Buddhist Era date", -BUDDHIST_ERA_OFFSET)
  return formatGregorianDate({
    year: date.year - BUDDHIST_ERA_OFFSET,
    month: date.month,
    day: date.day,
  })
}

export function buddhistFiscalYear(value: number): BuddhistFiscalYear {
  if (!Number.isInteger(value)) {
    throw new Error("Buddhist fiscal year must be an integer")
  }

  // P1-04 stores a fiscal year whose start is 1 October of BE - 543 and whose
  // end is 30 September of BE - 542. Both Gregorian years must be representable.
  if (value < MIN_GREGORIAN_YEAR + BUDDHIST_ERA_OFFSET || value > MAX_GREGORIAN_YEAR + 542) {
    throw new Error("Buddhist fiscal year is outside the supported Gregorian date range")
  }

  return value as BuddhistFiscalYear
}

/**
 * Returns the persisted Thai-government fiscal year for a local Gregorian
 * date. The fiscal year begins on 1 October and is labeled with its BE start
 * year, matching the P1-04 FiscalYear database constraint.
 */
export function fiscalYearForGregorianDate(value: GregorianDate): BuddhistFiscalYear {
  const date = parseDateParts(value, GREGORIAN_DATE, "Gregorian date")
  return buddhistFiscalYear(date.year + BUDDHIST_ERA_OFFSET - (date.month < 10 ? 1 : 0))
}

export function fiscalYearRange(value: BuddhistFiscalYear): FiscalYearRange {
  const buddhistYear = buddhistFiscalYear(value)
  const startYear = buddhistYear - BUDDHIST_ERA_OFFSET

  return Object.freeze({
    buddhistYear,
    startsOn: formatGregorianDate({ year: startYear, month: 10, day: 1 }),
    endsOn: formatGregorianDate({ year: startYear + 1, month: 9, day: 30 }),
  })
}

export function isDateInFiscalYear(value: GregorianDate, fiscalYear: BuddhistFiscalYear): boolean {
  return fiscalYearForGregorianDate(value) === buddhistFiscalYear(fiscalYear)
}
