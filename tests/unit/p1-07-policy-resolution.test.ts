import assert from "node:assert/strict"
import { test } from "node:test"

import {
  PolicyResolutionDeniedError,
  calculatePolicyResolutionIntegrityDigest,
  calculatePolicyVersionIntegrityDigest,
  selectEffectivePolicyVersion,
} from "../../src/lib/policy/core.ts"

test("P1-07 resolves exactly one effective policy and rejects missing or tied candidates", () => {
  const first = { policyVersionId: "POL-P107-ONE" }
  const second = { policyVersionId: "POL-P107-TWO" }

  assert.equal(selectEffectivePolicyVersion([first]), first)
  assert.throws(
    () => selectEffectivePolicyVersion([]),
    (error: unknown) =>
      error instanceof PolicyResolutionDeniedError && error.code === "MISSING_EFFECTIVE_POLICY_VERSION",
  )
  assert.throws(
    () => selectEffectivePolicyVersion([first, second]),
    (error: unknown) =>
      error instanceof PolicyResolutionDeniedError && error.code === "AMBIGUOUS_EFFECTIVE_POLICY_VERSION",
  )
})

test("P1-07 integrity digests bind immutable policy and resolution inputs", () => {
  const effectiveFrom = new Date("2026-10-01T00:00:00.000Z")
  const policyDigest = calculatePolicyVersionIntegrityDigest({
    policyVersionId: "POL-P107-DIGEST",
    organizationId: "00000000-0000-4000-8000-000000000001",
    effectiveFrom,
    supersedesId: null,
    publisherDesignationId: "00000000-0000-4000-8000-000000000002",
    publisherIdentityId: "00000000-0000-4000-8000-000000000003",
    sourceIntegrityDigest: "a".repeat(64),
    schoolIds: ["school-b", "school-a"],
  })
  const reorderedPolicyDigest = calculatePolicyVersionIntegrityDigest({
    policyVersionId: "POL-P107-DIGEST",
    organizationId: "00000000-0000-4000-8000-000000000001",
    effectiveFrom,
    supersedesId: null,
    publisherDesignationId: "00000000-0000-4000-8000-000000000002",
    publisherIdentityId: "00000000-0000-4000-8000-000000000003",
    sourceIntegrityDigest: "a".repeat(64),
    schoolIds: ["school-a", "school-b"],
  })
  assert.equal(policyDigest, reorderedPolicyDigest)

  const resolutionDigest = calculatePolicyResolutionIntegrityDigest({
    policyVersionId: "00000000-0000-4000-8000-000000000004",
    schoolId: "00000000-0000-4000-8000-000000000005",
    subjectCode: "FF-01",
    targetType: "FinancialEvent",
    targetId: "SB-2569-000001",
    effectiveAt: effectiveFrom,
    resolvedAt: new Date("2026-10-02T00:00:00.000Z"),
  })
  const changedTargetDigest = calculatePolicyResolutionIntegrityDigest({
    policyVersionId: "00000000-0000-4000-8000-000000000004",
    schoolId: "00000000-0000-4000-8000-000000000005",
    subjectCode: "FF-01",
    targetType: "FinancialEvent",
    targetId: "SB-2569-000002",
    effectiveAt: effectiveFrom,
    resolvedAt: new Date("2026-10-02T00:00:00.000Z"),
  })
  assert.notEqual(resolutionDigest, changedTargetDigest)
})
