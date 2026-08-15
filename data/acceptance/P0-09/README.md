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
- Active `POL-INITIAL-PILOT-001`: applicable financial policy for this FY 2569
  fixture.
- P0-05 form/report register: authoritative structures and documentary fields.
- GAP-08 only for static 2515-1/2515-2/2515-3 structural expectations. It
  does not activate or exercise SAR runtime behavior.

## Files

- `fixture.json`: source events, evidence references, registry effects, money
  positions, cashbook effects, and budget effects.
- `expected-results.json`: the explicit registry, budget, balance,
  reconciliation, report, and control expectations.
- `form-output-expectations.json`: P0-05 GAP and report/register coverage.
- `policy-owner-approval.json`: integrity-bound sign-off record. It must show
  `APPROVED` with a real Private Business / Product Owner identity, timestamp,
  and evidence reference before P0-09 can be marked `DONE`. SESAO domain
  review may be retained as advisory evidence only and cannot satisfy this
  private-product acceptance gate.

## Verification

Run:

```powershell
node scripts/verify-p0-09-acceptance-dataset.cjs
node scripts/verify-p0-09-acceptance-dataset.cjs --require-policy-owner-approval
```

The first command verifies the deterministic dataset. The second intentionally
fails while the approval record remains pending; it is the final acceptance
gate and never treats prior P0-03/P0-05/P0-06 approvals or SESAO advisory
domain evidence as a substitute.

## Next Exact Action

Private Business / Product Owner must review the three unchanged
integrity-bound files and record attributable approval identity, timestamp,
and evidence reference in `policy-owner-approval.json`. The approval remains
pending until that evidence is supplied; no additional approval beyond that
existing P0-09 gate is introduced here.
