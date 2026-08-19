# P0-09 Phase 0 Acceptance Dataset

`P0-09-ACCEPTANCE-001` is the smallest deterministic, anonymized fixture
that covers each approved P0-03 Fund Flow once and projects the P0-05
authoritative form/report structures. Amounts are integer satang so every
expected total can be recomputed exactly.

The fixture is acceptance data, not application seed data, a policy source,
or evidence of a real School transaction. It contains no real School, person,
account, receipt, or external-document identifier.

## Inputs

- P0-03 Fund Flow and record matrix: financial behavior and linked controls.
- Active `POL-INITIAL-PILOT-001`: applicable financial policy for this FY 2568
  fixture. The August 2026 reporting date and all events are in the fiscal year
  beginning 1 October 2025, per the P1-04/P1-10 fiscal-year contract.
- P0-05 form/report register: authoritative structures and documentary fields.
- GAP-08 only for static 2515-1/2515-2/2515-3 structural expectations. It
  does not activate or exercise SAR runtime behavior.

## Files

- `fixture.json`: source events, evidence references, registry effects, money
  positions, cashbook effects, and budget effects.
- `expected-results.json`: the explicit registry, budget, balance,
  reconciliation, report, and control expectations.
- `form-output-expectations.json`: P0-05 GAP and report/register coverage.
- `policy-owner-approval.json`: integrity-bound sign-off record for the exact
  approved fixture, expected-results, and form-output hashes. It records the
  attributable Private Business / Product Owner identity, timestamp, and
  evidence reference; SESAO domain review is advisory evidence only and cannot
  satisfy this private-product acceptance gate.
- `history/2026-08-15-policy-owner-approval.json`: preserved superseded
  approval record for the former BE 2569 label. It cannot approve the corrected
  BE 2568 payload.

## Verification

Run:

```powershell
node scripts/verify-p0-09-acceptance-dataset.cjs
node scripts/verify-p0-09-acceptance-dataset.cjs --require-policy-owner-approval
```

The first command verifies the deterministic dataset. The second verifies the
recorded Private Business / Product Owner approval evidence as the final
acceptance gate; it never treats prior P0-03/P0-05/P0-06 approvals or SESAO
advisory domain evidence as a substitute.

## Next Exact Action

The approval applies only to the three recorded integrity-bound hashes. Before
changing `fixture.json`, `expected-results.json`, or
`form-output-expectations.json`, recompute all three hashes and obtain a new
attributable Private Business / Product Owner approval; do not reuse this
approval for changed payloads.
