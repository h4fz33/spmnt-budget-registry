# GAP-08 Contract Decision Package

**Status:** Product Owner-resolved source/application contract; no application code or template implemented.
**Task:** P0-05
**Prepared:** 2026-08-14

## 0. Product Owner resolution

The bootstrap initial-pilot contract is approved as follows:

- Direct mappings: `YES` = full fixed weight; `NO` = zero; no partial credit.
- Composite mappings: deterministic `ALL_REQUIRED` over source-applicable subcriteria; all applicable `YES` = full fixed weight, any applicable `NO` = zero, all subcriteria genuinely non-applicable = full fixed weight; no fractional score.
- `N/A` is permitted only for a documented source condition and requires explicit value, reason, and source-condition/evidence reference. A genuinely non-applicable criterion receives full fixed weight. Missing evidence is `EVIDENCE_GAP` / `REVIEW_REQUIRED`, never `NO` or `N/A`, and blocks final scoring/submission.
- Exactly two distinct assessors: assigned active Finance Officer in slot 1 and explicitly assigned External Assessor in slot 2. The active School Director occupies neither slot.
- Both assessors sign; the active School Director approves/signs only; the assigned Finance Officer submits only after both signatures, Director approval, resolved scoring, and no blocking evidence gap.
- Lifecycle: `DRAFT -> IN_PROGRESS -> ASSESSOR_1_SIGNED -> ASSESSOR_2_SIGNED -> DIRECTOR_APPROVAL_PENDING -> DIRECTOR_APPROVED -> READY_FOR_SUBMISSION -> SUBMITTED`.
- P0-04 now uses narrow `AUTH-24` plus `AUTH-35` through `AUTH-39`. `AUTH-26`, `AcceptAssessment`, and generic delegation are not used.
- `SB-2515-3-17-SCHOOL-AGGREGATE` is approved as a SchoolBanchee bootstrap-pilot exception derived from all 17 Schools' submitted 2515-2 results. It is not original OBEC 2515-3 and creates no ranking, approval, return, mutation, or override authority.
- Rules and source hashes are registered under `POL-GAP-08-SAR-001`; runtime activation remains an `AUTH-22` publication action and does not reopen GAP-08.

## 1. Evidence boundary

The supplied OBEC B.E. 2515 materials are central-governance source material for the 17-school pilot. No additional ESAO provenance or applicability approval is required. The form layouts establish document/UI structure, but printed signatures do not create application roles. P0-03 remains the Fund Flow Matrix. The controlled GAP-08 amendment is now recorded in P0-04 without changing any financial command or the School Director-only boundary.

Evidence inspected:

| Source | Exact reference | What it establishes |
| --- | --- | --- |
| `reseach/แบบ 2515 -1.docx` | document title/header; body table 0; paragraphs 0-18 | 2515-1 header, detailed criteria table, two assessor positions, one School Director position. The DOCX has no pagination metadata; references are document/table/paragraph locations. |
| `reseach/แบบ 2515 -2 - 3 สถานศึกษา.xlsx` | sheet `แบบ 2515-2`, rows 1-109; sheet `แบบ 2515-3`, rows 5-11 | 2515-2 scored summary and the SchoolBanchee 2515-3 populated multi-school table. |
| `reseach/แบบ สพท. 2515.xlsx` | sheet `แบบ สพท.2515`, rows 2-33, columns B-BS | ESAO synthesis headings, 17 school rows, dimension totals, grand total, band, and result formulas. |
| `reseach/SAR_manual_2515.pdf` | supplied manual; Form 2515-1/2/3 sections (printed pages as shown in the PDF) | ten dimensions, assessment flow, form meanings and signature positions. |
| `reseach/SESAO_Audit_manual_2515.pdf` | SAR workflow and ESAO synthesis sections | July submission context and synthesis/risk-planning context. |
| `reseach/2515-1_to_2515-2-semantic-scoring-matrix.md` and `.xlsx` | Markdown Matrix table; workbook `Semantic Matrix` rows 2-54, `Summary` rows 1-6 | semantic mappings, weights, and explicit warning that composite/N/A algorithms are not authoritative. |

## 2. GAP-08 source contract

### 2.1 Forms and workflow

| Artifact | Source-established structure | Signatures/actors shown | Application interpretation boundary |
| --- | --- | --- | --- |
| 2515-1 | School, affiliation, fiscal year, as-of date; ten-dimension detailed checklist; each item has `มี/ใช่` and `ไม่มี/ไม่ใช่` response columns plus notes/observations; evidence is documentary/reference content. | Two distinct printed `ผู้ประเมิน` positions; one `ผู้อำนวยการสถานศึกษา` position (DOCX paragraphs 11-19). | Directly implementable as source-faithful assessment data under `POL-GAP-08-SAR-001` and `AUTH-35` through `AUTH-38`. |
| 2515-2 | School, affiliation, fiscal year, as-of date, student count; criterion rows with `คะแนนตามเกณฑ์` and `คะแนนประเมินที่ได้`; dimension subtotals, total 100, and result level (XLSX sheet `แบบ 2515-2`, rows 1-109). | Same two assessor positions and School Director position in the supplied form/manual. | Summary/report and deterministic score structure are implementable under the resolved direct/composite/N/A policy. |
| 2515-3 | Original source meaning is a school-level result report. Product Owner approved a durable SchoolBanchee exception: a populated table containing the submitted 2515-2 results of all 17 Schools, with columns aligned to the ESAO 2515 synthesis columns. | Source table is documentary/report output; no new approval actor is inferred. | Implement only as `SB-2515-3-17-SCHOOL-AGGREGATE`; do not describe it as the original OBEC 2515-3 meaning. |
| `แบบ สพท. 2515` | ESAO synthesis: school number/name/student count/size; dimensions 1-10; total score; level; assessment result. Rows 8-24 are the 17-school area; formulas at row 8 and subsequent rows calculate dimension totals, total, band and label. | Synthesis/reporting actor is not an approval role in the supplied workbook. | Proposed cross-school read/aggregate capability requires a P0-04 amendment; no approve, return, mutate, rank, or override. |

### 2.2 Dimensions, weights, bands, timing

The ten dimensions and 100-point weights are source-established by 2515-2 and the supplied matrix: (1) school financial administration 10; (2) remaining-fund control 20; (3) custody of funds 5; (4) receipts control 10; (5) payments control 20; (6) accounting 17; (7) financial reports 5; (8) daily receipt/payment inspection 3; (9) advances 5; (10) receipt-book control 5. Total = 100.

The workbook formulas and manual use these bands: 85-100 Very Good (4), 70-84.50 Good (3), 60-69.50 Fair (2), below 60 Improve (1). The boundary values are source spreadsheet behavior; a current effective Policy Version must still be selected before runtime enforcement.

The manuals establish annual self-assessment and submission within July. July is a source timing context, not an approved application deadline or fiscal-close rule. The package includes no separate submission-cover form (previous Product Owner decision: N/A).

## 3. 2515-1 -> 2515-2 semantic scoring decision matrix (resolved)

Every scored mapping in the current semantic matrix is reproduced below. The former candidate text is preserved as decision provenance and is superseded by the approved deterministic rules in Section 0 and `POL-GAP-08-SAR-001`.

| 2515-2 criterion (max) | 2515-1 source | Type | Source fact | Candidate rule / consequence |
| --- | --- | --- | --- | --- |
| 1.1 (2) | 1.1 | DIRECT | Same substantive criterion. | YES full / NO zero is a candidate only; PO must approve response-to-score rule. |
| 1.2 (1) | 1.3 | DIRECT | Same substantive criterion. | Same unresolved direct rule. |
| 1.3 (1) | 1.5 | DIRECT | Same substantive criterion. | Same unresolved direct rule. |
| 1.4 (1) | 1.7 | DIRECT | Same substantive criterion. | Same unresolved direct rule. |
| 1.5 (1) | 1.11 | DIRECT | Same substantive criterion. | Same unresolved direct rule. |
| 1.6 (2) | 1.10, 1.12, 1.13 | COMPOSITE | Execution, conformity and exception reporting are combined. | PO must choose all-required, assessor-entered score, or review-required; no fractional score is inferred. |
| 1.7 (1) | 1.14 | DIRECT | Same substantive criterion. | Direct rule unresolved. |
| 1.8 (1) | 1.15 | DIRECT | Same substantive criterion. | Direct rule unresolved. |
| 2.1 (5) | 2.1 | DIRECT | Daily balance preparation/currentness and Director sign. | Direct rule unresolved; Director signature remains documentary/P0-04-controlled. |
| 2.2 (5) | 2.4 | DIRECT | Daily balance carry-forward reconciliation. | Direct rule unresolved. |
| 2.3 (2) | 2.3 | DIRECT | Cash and instruments agree to report. | Direct rule unresolved. |
| 2.4 (5) | 2.5 | DIRECT | Bank balances agree to report. | N/A applicability must be decided separately. |
| 2.5 (3) | 2.6 | DIRECT | Paying-agency deposit agrees to report. | Direct rule unresolved. |
| 3.1 (1) | 3.1 | DIRECT | Custody committee appointment. | Direct rule unresolved. |
| 3.2 (1) | 3.2 | DIRECT | Custody operation. | Direct rule unresolved. |
| 3.3 (2) | 3.3 | DIRECT | Limits/rules for each money type. | Direct rule unresolved. |
| 3.4 (0.5) | 3.4.2, 3.4.3 | COMPOSITE | Monthly and over-limit remittance timing combined; 3.4.1 is supporting. | PO must choose composite treatment; no partial-credit algorithm supplied. |
| 3.5 (0.5) | 3.5 | DIRECT | Withholding-tax remittance timing. | Direct rule unresolved. |
| 4.1 (1) | 4.1 | DIRECT | Written receipt/payment assignment. | Direct rule unresolved. |
| 4.2 (2) | 4.2 | DIRECT | Receiver is assigned by Director. | Printed assignment is evidence, not a new role. |
| 4.3 (4) | 4.3 | DIRECT | Receipt issued under OBEC form/conditions. | Direct rule unresolved. |
| 4.4 (2) | 4.4 | DIRECT | Receipt substantive details complete. | Direct rule unresolved. |
| 4.5 (1) | 4.5 | DIRECT | Daily receipt total agrees to final copy. | Direct rule unresolved. |
| 5.1 (5) | 5.1 and 5.1.1.1-5.1.5 | COMPOSITE | Multiple payment types consolidated. | PO must define applicable-type and partial-score behavior. |
| 5.2 (5) | 5.2 | DIRECT | Director approval for payments. | Preserve P0-03/P0-04; form does not widen authority. |
| 5.3 (5) | 5.4 | DIRECT | Complete payment evidence. | Direct rule unresolved. |
| 5.4 (3) | 5.5, 5.5.1-5.5.5 | COMPOSITE | Receipt voucher components consolidated. | PO must choose all-required/entered/review-required. |
| 5.5 (2) | 5.6 | DIRECT | Paid stamp/name/date/signature. | Documentary evidence only. |
| 6.1 (5) | 6.1 | DIRECT | Cashbook entries agree to evidence. | Direct rule unresolved. |
| 6.2 (3) | 6.1 | EXPANDED | 2515-1 6.1 contains cashbook and non-budgetary registers; 2515-2 separates them. | PO must approve extraction of the non-budgetary component. |
| 6.3 (1) | 6.2 | DIRECT | State-income register. | Direct rule unresolved. |
| 6.4 (1) | 6.3.1 | DIRECT | Document-request register. | Direct rule unresolved. |
| 6.5 (2) | 6.3.2; 9.4.1-9.4.2 supporting | DIRECT | Documents-held-as-money register; advance references support it. | Direct score source remains 6.3.2; avoid double scoring. |
| 6.6 (2) | 6.3.3(1), 6.3.3(2) | COMPOSITE | Current-account register existence and correctness combined. | N/A applicability and composite rule require PO decision. |
| 6.7 (3) | 6.4.1, 6.4.2 | COMPOSITE | Paying-agency deposit book existence and correctness combined. | Composite rule unresolved. |
| 7.1 (2) | 7.1.1 | DIRECT | Monthly remaining-fund report. | Direct rule unresolved. |
| 7.2 (1) | 7.1.2 | DIRECT | Monthly current-account reconciliation. | N/A applicability requires PO decision. |
| 7.3 (0.5) | 7.2.1 | DIRECT | Last-working-day daily balance submission. | Direct rule unresolved; July timing remains separate. |
| 7.4 (0.5) | 7.2.2 | DIRECT | Remaining-fund report submission. | Direct rule unresolved. |
| 7.5 (0.5) | 7.2.3 | DIRECT | Current-account reconciliation submission. | N/A applicability requires PO decision. |
| 7.6 (0.5) | 7.3 | DIRECT | Annual school-revenue report/submission. | Direct rule unresolved. |
| 8.1 (1) | 8.1 | DIRECT | Daily inspector appointment. | Evidence only; do not reuse AUTH-26. |
| 8.2 (2) | 8.2.1, 8.2.2 | COMPOSITE | Receipt and payment checks combined. | PO must choose composite rule. |
| 9.1 (1) | 9.1, 9.1.1-9.1.5 | COMPOSITE | Loan contract and required fields combined. | Applicable only where advances exist; N/A policy unresolved. |
| 9.2 (1) | 9.2 | DIRECT | Expense estimate attached. | N/A policy unresolved when no advances. |
| 9.3 (1) | 9.3 | DIRECT | No new advance before prior settlement. | N/A policy unresolved when no advances. |
| 9.4 (1) | 9.5.1(1), 9.5.1(2) | COMPOSITE | Travel and other-purpose settlement deadlines combined. | PO must define applicable loan type and composite treatment. |
| 9.5 (1) | 9.6.1, 9.6.2, 9.6.3 | COMPOSITE | Overdue debt, follow-up and Director report combined. | PO must define no-overdue case and N/A behavior. |
| 10.1 (1) | 10.4 | DIRECT | Receipt-book register. | Direct rule unresolved. |
| 10.2 (1) | 10.2, 10.3 | COMPOSITE | Correction and cancellation evidence combined. | PO must choose composite rule. |
| 10.3 (1) | 10.5 | DIRECT | No cross-fiscal-year receipt use. | Direct rule unresolved. |
| 10.4 (1) | 10.6 | DIRECT | Unused old receipts cancelled. | Direct rule unresolved. |
| 10.5 (1) | 10.7 | DIRECT | Annual receipt-use report. | Direct rule unresolved; source deadline context is 31 October, not SAR July. |

## 4. N/A decision matrix (resolved)

The workbooks/matrix show formula-capable cases, but do not by themselves state an authoritative scoring policy. Product Owner policy now resolves every identified N/A-capable criterion under the same documented-source-condition/full-fixed-weight rule.

| Criterion | Source condition | Spreadsheet/source behavior | Approved treatment | Status |
| --- | --- | --- | --- | --- |
| 2.4 | No applicable bank/current-account balance. | Form criterion exists; matrix notes N/A possibility. | Explicit N/A + reason + source/evidence; award full 5. | RESOLVED |
| 6.6 | No current-account bank account. | Current-account register criterion exists; workbook alone did not define policy. | Explicit N/A + reason + source/evidence; award full 2. | RESOLVED |
| 7.2 | No current-account account/reconciliation. | Monthly reconciliation column remains in the template. | Explicit N/A + reason + source/evidence; award full 1. | RESOLVED |
| 7.5 | No current-account account/reconciliation submission. | Submission column remains in the template. | Explicit N/A + reason + source/evidence; award full 0.5. | RESOLVED |
| 9.1-9.4 | School has no advances in the assessment period. | Advance section is structurally present. | Each genuinely non-applicable criterion records N/A reason/source and receives full fixed weight. | RESOLVED |
| 9.5 | No overdue advance debtors. | Matrix explicitly flags N/A handling. | Explicit N/A + reason + source/evidence; award full 1. | RESOLVED |

The implementation must retain the N/A reason and source condition. Missing evidence is never N/A and blocks final score/submission.

## 5. SAR assessor authorization decision matrix (resolved)

Source forms show two assessor signature slots; Product Owner policy and P0-04 now resolve the application authorization separately.

| Decision | Approved contract | Consequence |
| --- | --- | --- |
| Eligibility | Slot 1 active Finance Officer; slot 2 authenticated External Assessor with exact School/SAR assignment. | External assignment grants no School membership or other capability. |
| Cardinality | Exactly two distinct people. | Duplicate identity blocks signing/progression. |
| Director conflict | Active School Director cannot occupy either slot. | Director remains approval/signature only. |
| Assignment | Standing School-scoped assignment under `AUTH-35`; no scheduled expiry. | Immutable effective history required. |
| Revocation/invalidation | Finance Officer role loss/School transfer or explicit revoke/replace invalidates slot 1; explicit revoke/replace or account ineligibility invalidates slot 2. | Invalid assignment blocks further signature/progression; prior history remains. |
| Signatures | Finance Officer signs under `AUTH-36`; External Assessor under `AUTH-37`. | Neither signature is Director approval. |
| Director action | Active School Director approves/signs under `AUTH-38` and cannot submit. | Assigned Finance Officer submits later under `AUTH-39`. |

## 6. Controlled P0-04 amendment (applied)

P0-04 records the exact command boundary below; no application code is implemented by P0-05.

| Matrix command | Actor/scope | Boundary |
| --- | --- | --- |
| `AUTH-35` assign/revoke/replace SAR assessor | Active School Director, one School | Two slots, distinct people, exact eligibility and lifecycle. |
| `AUTH-36` sign as Finance Officer assessor | Assigned active Finance Officer, one School/SAR | Slot 1 signature only. |
| `AUTH-37` sign as External Assessor | Assigned External Assessor, one School/SAR | Slot 2 signature only; no approval/submission. |
| `AUTH-38` approve/sign SAR | Active School Director, one School/SAR | Approval only after both signatures; no assessment/submission. |
| `AUTH-39` submit approved SAR | Assigned Finance Officer, one School/SAR | Only after Director approval, resolved scoring and no blocking evidence gap. |
| `AUTH-24` read/aggregate submitted SARs | ESAO Reviewer, 17-School organization scope | Read and permitted aggregate/report output only; no ranking or mutation. |

Do not create `AcceptAssessment`; do not reuse `AUTH-26` (Audit Assessment creation).

## 7. Cross-school authorization boundary

Approved `AUTH-24` enables ESAO Reviewer read/aggregate of submitted SAR results across the 17 pilot Schools. Approve, return, mutate, assign, sign, submit, rank, override, or alteration of School results remain denied. Aggregation is synthesis/risk-planning output, not ownership of School canonical records.

## 8. Durable 2515-3 exception record

**Resolution:** Product Owner approved. The application report is derived from each School's submitted 2515-2 result, creates no ranking/approval/return/mutation/override authority, and is durably recorded in ADR-0014 and `POL-SAR-08`. The pre-decision wording below is retained only as decision provenance.

**Exception ID:** `SB-2515-3-17-SCHOOL-AGGREGATE`

The Product Owner-approved pilot behavior is a SchoolBanchee application table populated from each School's submitted 2515-2 result for all 17 Schools. Its columns align with the supplied `แบบ สพท. 2515` columns: School identity, student count/size, ten dimension subtotals, total, level and result. It is a derived cross-school application report and not the original OBEC meaning of Form 2515-3. It creates no ranking, approval, return, mutation, or override authority. Durable evidence: ADR-0014 and `POL-SAR-08`.

## 9. Product Owner decision status

All eight prior decision categories are `APPROVED` and recorded in Section 0, P0-04, `POL-GAP-08-SAR-001`, and ADR-0014. Runtime activation of the policy version remains an `AUTH-22` publication action, not an unresolved GAP-08 contract decision.

## 10. Revised GAP-08 closure criteria

GAP-08 closure requires: (a) approved composite and N/A rules; (b) registered effective Policy Version for dimensions, weights, bands and July context; (c) P0-04 amendment for assessor assignment/revocation/signing, Director approval/signature, Finance Officer submission, and narrow cross-school read/aggregate; (d) durable 17-school 2515-3 exception; (e) complete source-faithful 2515-1/2/3 and ESAO structures; and (f) verification that P0-03 and the School Director-only boundary remain unchanged.

All GAP-08 source/contract closure criteria are satisfied. No template or application code is implemented. Runtime use remains fail-closed until `POL-GAP-08-SAR-001` is activated through `AUTH-22` and later implementation tasks pass their own verification.
