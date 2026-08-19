import assert from "node:assert/strict"
import { test } from "node:test"

import {
  addMoney,
  formatMoney,
  moneyToSatang,
  parseMoney,
  requirePositiveMoney,
  serializeMoney,
} from "../../src/lib/domain/money.ts"
import {
  fiscalYearForGregorianDate,
  fiscalYearRange,
  fromBuddhistEraDate,
  isDateInFiscalYear,
  parseGregorianDate,
  toBuddhistEraDate,
} from "../../src/lib/domain/fiscal-date.ts"
import {
  createFinancialEventReference,
  parseFinancialEventReference,
} from "../../src/lib/domain/financial-event-reference.ts"
import {
  allocateNextScopedNumber,
  assertScopedNumbersContiguous,
  createScopedNumberScope,
  formatScopedNumber,
  parseScopedNumber,
  SCOPED_NUMBERING_PERSISTENCE_CONTRACT,
} from "../../src/lib/domain/scoped-numbering.ts"

const schoolId = "f144e96b-9fdf-46d0-acfd-0ddf4abbe8bb"

test("P1-10 parses, formats, and serializes money exactly in satang", () => {
  const amount = parseMoney("1,234,567.80")
  assert.equal(moneyToSatang(amount), BigInt(123456780))
  assert.equal(serializeMoney(amount), "1234567.80")
  assert.equal(formatMoney(amount), "1,234,567.80")
  assert.equal(serializeMoney(parseMoney("-0.01")), "-0.01")
  assert.equal(serializeMoney(addMoney(parseMoney("100.25"), parseMoney("0.75"))), "101.00")

  for (const invalid of ["1.001", "0.000", "1,23.45", "01.00", " 1.00", "1.", "+1.00"]) {
    assert.throws(() => parseMoney(invalid), /Invalid money amount/)
  }
  assert.throws(() => requirePositiveMoney(parseMoney("0.00")), /greater than zero/)
})

test("P1-10 converts local calendar dates and fiscal-year rollover without time zones", () => {
  const september = parseGregorianDate("2026-09-30")
  const october = parseGregorianDate("2026-10-01")

  assert.equal(toBuddhistEraDate(october), "2569-10-01")
  assert.equal(fromBuddhistEraDate("2569-10-01"), october)
  assert.equal(fromBuddhistEraDate("2567-02-29"), "2024-02-29")
  assert.equal(fiscalYearForGregorianDate(september), 2568)
  assert.equal(fiscalYearForGregorianDate(october), 2569)
  assert.deepEqual(fiscalYearRange(fiscalYearForGregorianDate(october)), {
    buddhistYear: 2569,
    startsOn: "2026-10-01",
    endsOn: "2027-09-30",
  })
  assert.equal(isDateInFiscalYear(parseGregorianDate("2027-09-30"), fiscalYearForGregorianDate(october)), true)
  assert.equal(isDateInFiscalYear(parseGregorianDate("2027-10-01"), fiscalYearForGregorianDate(october)), false)
  assert.throws(() => parseGregorianDate("2026-02-29"), /calendar day does not exist/)
  assert.throws(() => fromBuddhistEraDate("2569-02-29"), /calendar day does not exist/)
})

test("P1-10 creates and validates immutable opaque Financial Event References", () => {
  const reference = createFinancialEventReference(() => "6f5926f8-31ec-4bf7-bfe9-3a847bc87a66")

  assert.equal(reference, "FE-6f5926f8-31ec-4bf7-bfe9-3a847bc87a66")
  assert.equal(parseFinancialEventReference(reference), reference)
  assert.throws(() => parseFinancialEventReference("REF-BUD-CLAIM-001"), /canonical FE-UUIDv4 format/)
  assert.throws(
    () => createFinancialEventReference(() => "6f5926f8-31ec-3bf7-bfe9-3a847bc87a66"),
    /UUIDv4/,
  )
})

test("P1-10 formats scoped numbers and detects duplicate and gap ledgers", () => {
  const scope = createScopedNumberScope({
    schoolId,
    buddhistFiscalYear: 2569,
    registerCode: "PAYMENT_VOUCHER",
  })
  const first = allocateNextScopedNumber({ scope, nextValue: 1 })
  const second = allocateNextScopedNumber(first.next)

  assert.equal(first.allocated.display, "000001")
  assert.equal(second.allocated.display, "000002")
  assert.equal(formatScopedNumber(42, 4), "0042")
  assert.equal(parseScopedNumber("000042"), 42)
  assert.doesNotThrow(() => assertScopedNumbersContiguous([first.allocated, second.allocated]))
  assert.throws(
    () => assertScopedNumbersContiguous([first.allocated, first.allocated]),
    /Scoped number duplicate/,
  )
  assert.throws(
    () => assertScopedNumbersContiguous([first.allocated, { ...second.allocated, value: 3 }]),
    /Scoped number gap/,
  )
  assert.equal(SCOPED_NUMBERING_PERSISTENCE_CONTRACT.isolationLevel, "SERIALIZABLE")
  assert.equal(SCOPED_NUMBERING_PERSISTENCE_CONTRACT.requiresIdempotencyKey, true)
})
