# P0-04 Authorization Research And Decision Register

**Status:** historical final-Matrix research preserved; Product Owner Decision 12 is approved, with substitute execution fail closed under `BLK-011`
**Research date:** 2026-08-08
**Latest reconciliation:** 2026-08-15
**Decision authority:** [P0-04 — BLK-003 Resolution Record](<P0-04 — BLK-003 Resolution Record.md>)
**Canonical matrix:** [P0-04 Final Authorization Matrix](../governance/p0-04-authorization-matrix.md)

## Scope

This record preserves the P0-04 research conclusions and routes implementation to the canonical command-level Matrix. The Matrix is authoritative for actor, eligibility/evidence, scope, approver, reviewer, authentication, delegation, SoD, grant/revoke authority, audit evidence, fail-closed behavior, and status.

Generic role names do not grant authority. An operation not enumerated by the Matrix is denied.

## Final Decision Effects

1. **Policy Publisher:** Order 452/2568 establishes Internal Audit eligibility for `นางบังอร วันริโก` and `นายอานุงรุสลัน ดาโวะ`. The approved Matrix designates the former as current holder and the latter as standby alternate. The official Internal Audit Unit page supplies the approved current-status check; all 17 SESAO Narathiwat Schools are the separately sourced application publication scope. System Admin applies the exact designation technically and has no selection or modification authority.
2. **Membership:** System Admin owns platform account/registration lifecycle only. ESAO Admin owns organization membership, School assignment, Finance Officer/School Admin role assignment, and evidence-backed School Director assignment across all 17 Schools.
3. **Substitute School Director Authority:** The former School Director-only conclusion is historical/superseded effective 2026-08-15. Each School still has zero or one active School Director. For the limited `AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`, and approval portion of `AUTH-21` scope, Effective Director Authority resolves active Director when present and able, then valid Acting authority, then valid Temporary authority, else deny. An Acting record identifies the unavailable active Director and a distinct named Acting substitute; a Temporary record records the documented basis that Active/Acting resolution cannot supply a holder, including zero active Director. `AUTH-14`/`AUTH-15` are ESAO Admin-managed, non-delegated authority records; their execution remains fail closed until `BLK-011` supplies the exact appointment/organizational evidence type and validation rule.
4. **Receipt Book:** Finance Officer issuance requires custody/issuance evidence, not a second-person authorization inferred from the word approval.
5. **Delegation:** No delegation is enabled in the initial pilot. Every delegated variant and delegation grant/revoke command is denied.
6. **Privileged Correction:** School Director approval is mandatory before execution; proposer/preparer self-approval is prohibited; no separate independent pre-execution reviewer is required.
7. **Daily Balance:** Finance Officer prepares; a different same-School holder of the `Daily Balance Verifier` capability verifies; School Director approves/signs. School Director alone grants/revokes the verifier capability and cannot assign themselves.
8. **Policy lifecycle:** A new activation supersedes the prior Policy Version. No retirement/deactivation command exists.
9. **ESAO Reviewer:** No initial-pilot access or command exists. Assigned-School review, comparison, aggregation, acceptance, return, and override remain deferred and denied.
10. **Audit Assessment:** Any number of SESAO Auditor accounts may be configured. An authenticated Auditor creates an Assessment and atomically becomes its initial active Auditor; ESAO Admin controls later assignment, atomic reassignment, and revocation. Exactly one Auditor is active per Assessment and operates it end to end through creation, performance, finding modification, finalization, and responsible-Auditor result acceptance, with no additional Auditor participant or review step. Completed Assessments permit no further Auditor command.
11. **Generic privilege:** No generic ESAO/platform grant, emergency access, or override exists.

## Evidence Summary

- Order 452/2568 repository source SHA-256: `F8D3AD0F2B21FEDC9C1F7EAB3A00A6AC60041D8F68701EF32B991C4AC4FFF9AC`.
- Order issuer: Secondary Educational Service Area Office Narathiwat.
- Order effective date: 15 October B.E. 2568.
- Current-status source: `https://www.sesaonara.go.th/หน่วยตรวจสอบภายใน/`, inspected 2026-08-10. It lists both named people but has no visible effective/revocation date and uses `ผู้อำนวยการกลุ่ม` for the current holder; the discrepancy is retained, not normalized.
- Publication-scope source: `https://www.sesaonara.go.th/about-us/`, inspected 2026-08-10. It states SESAO Narathiwat has 17 affiliated secondary schools.
- Product Owner final-Matrix sign-off: recorded 2026-08-10 in the BLK-003 record and P0-04 session evidence.
- Order signatory personal name: unverified and deliberately not propagated.
- Initial SESAO Auditor configuration: sealed application bootstrap using authenticated identity, person name, role, and organizational scope; no appointment-document upload, evidence hash, external verification, or second-person in-application approval.

## Remaining Blockers

`BLK-011`: Private Business / Product Owner must specify the exact authoritative appointment/organizational evidence type and validation rule for Acting and Temporary authority, including the evidence for inability and temporary basis. No legal/organizational document type is inferred. Until then `AUTH-14` appointment lifecycle and `AUTH-15` exercise deny.

## Completion Status

The canonical Matrix contains explicit controls for every enumerated command and explicit denial for unlisted/generic commands. Conditions 1-10 and 12-13 are satisfied; Condition 11 remains open under `BLK-011`, so `P0-04 = BLOCKED -- amended`. Future implementation must derive from the Matrix: it may not infer a substitute capability, evidence type, generic delegation, or any scope beyond the expressly permitted commands.
