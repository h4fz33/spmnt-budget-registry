# P0-05 OBEC Form And Report Implementation Register

**Status:** `BLOCKED`
**Original research date:** 2026-08-10
**OBEC central-governance reconciliation:** 2026-08-12
**Pilot baseline:** the common OBEC B.E. 2515 baseline for all 17 Schools, established by P0-02
**Fund-flow boundary:** approved [P0-03 Fund Flow/record matrix](../governance/p0-03-fund-flow-record-matrix.md)
**Authorization boundary:** approved [P0-04 Final Authorization Matrix](../governance/p0-04-authorization-matrix.md)

## Purpose And Governance Interpretation

This register identifies which supplied OBEC/reference forms can define application UI structure. It does not approve transaction behavior, create roles, or replace P0-03/P0-04.

OBEC is the central governance authority. The supplied OBEC policies and reference forms are authoritative source material for implementation across ESAO branches and the 17-School pilot. A Yala 2-branded example is treated as a reference implementation of the common OBEC baseline unless its content expressly makes the layout branch-specific. No separate Narathiwat applicability approval, issuer proof, source URL, or revision gate is required merely because a reference form was packaged by or branded for another ESAO.

A form field or printed signature position is evidence of document structure only. Application behavior comes from the approved P0-03 matrix and OBEC rules; application command authority comes only from P0-04. Printed `head`, `approver`, committee, inspector, recipient, or other labels do not create application roles or substitute/Temporary/Acting Director authority.

## Supplied Source Register

| Source | Authority and use | Physical reference |
| --- | --- | --- |
| `reseach/Form_2515.pdf` | Authoritative OBEC B.E. 2515 reference-form excerpt; may directly define UI/form structure. | 16 image-only PDF pages corresponding to printed appendix pages 17-32; SHA-256 `501271209FDDE78166D036C6EBA60A76E0A679047CC21BCD24447704B7CA0CA6`. |
| `reseach/Form_Registries_001.pdf` | Authoritative reference implementation of the common OBEC baseline. Yala 2 branding does not by itself make the layouts branch-specific. | 22 PDF pages corresponding to printed pages 21-45; SHA-256 `2AEB13728B61FD439BFA35EAA0B6C534F1EE56E0CC3B125253FD51EB44188FC6`. |
| `reseach/GAP-01_08.md` | Supplied reconciliation aid. Use its rule descriptions only where consistent with the PDFs, OBEC source text, P0-03, and P0-04. Its incorrect `AUTH-26` reference does not govern Daily Inspection. | Lines 7-14 summarize GAP-01 through GAP-08; lines 20-34 describe Receipt Book, Advance, Daily Inspection, and monthly balance behavior. |
| `reseach/manual_2515.md` | OBEC B.E. 2515 procedure and form text selected by P0-02 as the common baseline. | Form layouts at lines 261-486; operating and signature rules at lines 104-259 and 684-808. |
| `reseach/OBEC_authoritative.pdf` | OBEC guide evidence for the annual Self-Assessment purpose, ten dimensions, annual frequency, and ESAO submission. | PDF pp. 2-3; it does not contain the assessment instrument or result form. |

Blank forms are anonymized samples. They are sufficient to define structure but are not completed acceptance records.

## Readiness Classification

| Classification | Meaning |
| --- | --- |
| `IMPLEMENTABLE` | The OBEC source supplies sufficient structure and no additional mapped business rule is needed beyond ordinary validation. |
| `IMPLEMENTABLE WITH POLICY RULE` | The source supplies sufficient structure, but implementation must also map an OBEC, P0-03, or P0-04 rule. |
| `MISSING` | The supplied authoritative materials genuinely omit a required form/document or rule. |

## GAP-01 Through GAP-08 Implementation Reconciliation

| GAP | OBEC source and form/document | Related FF control(s) | UI fields | Signatures/actors shown and evidence handling | Policy rule to map | Remaining gap and type | Implementation readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GAP-01` Official receipt | `Form_2515.pdf` PDF pp. 1-2 / printed appendix pp. 17-18, **Receipt Form 1** and **Receipt Form 2**; receipt handling rules at `manual_2515.md:200-237,511-520`. | `FF-03`, `FF-05`, `FF-07` | Receipt type; book number; receipt number; office; date; payer; purpose/items; numeric amount; amount in words; receiver printed name and position; status/correction/void reference. | Money receiver signature/position appears on both forms. Daily inspector signature on the final duplicate and correction countersignatures are external/source evidence fields, not new application roles. | P0-03 controls which receipt flows create records; `AUTH-10` controls routine application posting. Preserve serial, correction, cancellation, and fiscal-year rules from OBEC. | No missing form. A completed issued/cancelled receipt is future acceptance-test data, not a P0-05 form blocker. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as receipt-entry/display UI. |
| `GAP-02` Payment evidence | `Form_2515.pdf` PDF p. 7 / printed appendix p. 23, **Receipt-in-lieu**; `Form_Registries_001.pdf` PDF p. 1 / printed p. 21, **Non-budgetary Payment Approval Memorandum**; PDF p. 4 / printed p. 24, **Withholding Certificate (Form BK.28)**; general evidence rules at `manual_2515.md:184-214`. | `FF-04`, `FF-06`, `FF-08`, `FF-10`, `FF-12`; source evidence also supports `FF-09` | Evidence type/reference; office; payer/payee identity and address; purpose/item rows; amount numeric/text; payment category; tax base/rate/amount where applicable; source document attachment/reference; paid stamp/name/date metadata. | Receipt-in-lieu has recipient signature. Approval memo shows Finance Officer preparation and approval positions. BK.28 shows payer/certificate position. Printed positions are captured evidence; application approval remains `AUTH-11`. | P0-03 selects required evidence per flow and prohibits unsupported behavior. `AUTH-11` requires Finance Officer preparation and active School Director approval for payment commands. | Salary/pension-specific forms named in `GAP-01_08.md` are not present, but they are not required by an approved pilot FF row. Flow-specific third-party receipts, treasury, tax, bank, or contract documents remain external evidence, not missing application forms. | `IMPLEMENTABLE WITH POLICY RULE`; implement common payment-evidence metadata, structured receipt-in-lieu/BK.28 fields where applicable, and external evidence references. |
| `GAP-03` Budget request/direct-payment package | `Form_2515.pdf` PDF p. 13 / printed appendix p. 29 and `Form_Registries_001.pdf` PDF p. 15 / printed p. 38, **Document-Request Register**. | `FF-01`, `FF-02` | Sequence/date; claimant/creditor; expense category; amount; recipient signature/name; submission date; outgoing/transmission reference; paying-authority confirmation reference; notes; originating claim link; confirmation status. | Recipient signature appears in the register. Transmission and paying-authority confirmation remain external evidence references; they do not create application approvers. | P0-03 requires claim/request, source/procurement evidence, entitled payee and transmission evidence for `FF-01`; `FF-02` requires one full paying-authority confirmation and denies partial confirmation. Finance Officer records under `AUTH-10`. | The external request letter, transmission artifact, and paying-authority confirmation formats are not supplied. They are `external evidence`, not required UI templates; application must retain their references/attachments. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as Document-Request Registry UI plus external-evidence capture. |
| `GAP-04` Official Advance agreement/approval | `Form_Registries_001.pdf` PDF p. 2 / printed p. 22, **Advance Agreement and Receipt**, with OBEC rules at `manual_2515.md:684-704`. | `FF-11` | Agreement/reference number; borrower name/position/School; purpose; amount numeric/text; due date; undertaking; Finance Officer review; Director approval; disbursement receipt acknowledgement; supporting estimate/evidence reference; copy count. | Borrower, Finance Officer, Director/approver, and receipt acknowledgement positions appear. Application authority is only Finance Officer preparation plus active School Director approval under `AUTH-12`. | Map P0-03 `FF-11` evidence and due control; map OBEC two-copy and supporting-estimate rules; enforce P0-04 School Director-only approval. | Supporting estimates are transaction evidence supplied per Advance, not a missing prescribed application form. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as Advance agreement/approval UI. |
| `GAP-05` Advance settlement/unused-cash return | `Form_Registries_001.pdf` PDF p. 3 / printed p. 23, **Advance Agreement reverse - settlement record**; `manual_2515.md:707-732`. | `FF-12`, `FF-13` | Settlement date/iteration; expense-evidence amount; unused-cash-return amount; balance; evidence/receipt number; recipient name/signature; originating agreement link; outstanding status. | Recipient signature is shown on the reverse. It is evidence of settlement/return, not an application approver. | Apply the approved P0-03 atomic settlement and evidence rules; do not infer repeated partial settlement from the table. Apply P0-04 only where an application command expressly requires it. | Completed settlement receipts and expense documents are per-transaction `external evidence`/future acceptance data, not missing form structure. Month-end outstanding Advances are derivable from agreement due/outstanding fields and the existing Daily Balance/Documents Held as Money model. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as linked settlement/return UI. |
| `GAP-06` Receipt Book custody and annual-use control | `Form_Registries_001.pdf` PDF p. 12 / printed p. 35, **Receipt Book Control Register**; receipt forms at `Form_2515.pdf` pp. 1-2; OBEC rules at `manual_2515.md:224-237,744-766`. | Supports `FF-03`, `FF-05`, `FF-07`; lifecycle command `AUTH-13` | Fiscal year; receipt type; books/ranges received; books/ranges issued; remaining books/ranges; custodian; handover date/signature evidence; used/void/unused states; correction/cancellation reference; notes; annual totals/status. | Custodian signature appears in the control register. Handover/correction/void signatures are evidence fields. No Director approval is invented. | Apply OBEC serial, no-erasure, correction/cancellation, new-fiscal-year, and 31 October annual-use reporting rules. `AUTH-13` assigns issue/handover to Finance Officer without an invented approver. | No separate annual-use sheet is supplied, but its required information is derivable from the authoritative Receipt Book register/lifecycle fields; this is `application behavior/report derivation`, not a missing source form. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as Receipt Book inventory/lifecycle UI and derived annual-use report. |
| `GAP-07` Daily inspection and Daily Balance evidence | `manual_2515.md:736-742` defines appointed daily receipt/payment inspection and signature points; `Form_2515.pdf` PDF p. 15 / printed appendix p. 31 and `Form_Registries_001.pdf` PDF p. 11 / printed p. 34 provide the **Daily Balance/custody report**. | Cross-checks daily activity for applicable `FF-01` through `FF-14`; it does not create a new Fund Flow | Inspection assignment/evidence reference; inspection date; final receipt reference/total; Cashbook balance/reference; result/discrepancy; inspector identity/signature/time. Daily Balance fields: School/date; cash; cheques/instruments; Documents Held as Money including Advances/payment requests/passbooks; totals/amount in words; custody/handover evidence. | OBEC inspection uses an appointed inspector who signs the final receipt duplicate and Cashbook balance. Daily Balance shows preparer/head/custody committee/recipient positions. Preserve these as evidence positions; do not equate the inspector or custody committee with the application Daily Balance Verifier. | Daily Inspection remains a separate control. P0-04 `AUTH-16/17/18` governs application Daily Balance preparation, independent verification, and active School Director approval. `AUTH-26` does not apply to Daily Inspection. | The appointment order is organization-level `external evidence`; the application needs an evidence reference and assignment behavior, not a prescribed order template. | `IMPLEMENTABLE WITH POLICY RULE`; implement Daily Inspection and Daily Balance as separate workflows with explicit evidence mapping. |
| `GAP-08` Annual Self-Assessment/SAR | `reseach/OBEC_authoritative.pdf` pp. 2-3 and `GAP-01_08.md` lines 14,32-36 establish annual frequency, ESAO submission, and ten assessment dimensions, but provide no assessment/result form. | No P0-03 Fund Flow; separate annual governance/reporting control | Known header-level fields only: School, assessment year, ten dimensions, submission destination/date. Item-level criteria, responses, evidence cells, calculations, result fields, and acknowledgement fields are not supplied. | No current signature, acknowledgement, or submission positions are supplied. No application role may be inferred. | Annual execution and ESAO submission are source-backed. The `100 points` statement in `GAP-01_08.md` is insufficient to define weights, calculations, bands, or approval behavior. P0-04 supplies no missing SAR command mapping. | Missing `form`: complete OBEC annual Self-Assessment instrument/result/submission layout. Missing `policy rule`: item-level scoring/weights/result calculation and required signature/acknowledgement positions. | `MISSING`; not safely implementable as a complete UI or report. |

## Other Collected OBEC Forms And Reports

The earlier P0-05 inventory remains covered by the OBEC baseline and may define UI structure subject to P0-03/P0-04 behavior:

| ID | Form/report | Source reference | Implementation boundary |
| --- | --- | --- | --- |
| `FR-01` | Cashbook | `manual_2515.md:263-268` | Reference/cross-check structure only; ADR-0001 keeps Control Registries canonical. |
| `FR-02` | State-Income Control Register | `manual_2515.md:270-275` | UI structure; fund/flow behavior from P0-03/P0-06. |
| `FR-03/04` | Generic and School Revenue Non-Budgetary Registers | `manual_2515.md:277-293` | UI structure; enabled fund types from approved policy. |
| `FR-05` | Document-Request Register | `manual_2515.md:295-300`; supplied PDFs above | Implement per `GAP-03`. |
| `FR-06` | Documents Held as Money Register | `manual_2515.md:302-307` | UI structure; Advance behavior from `FF-11/12/13`. |
| `FR-07/08` | Paying-Agency and Bank Registers | `manual_2515.md:309-323` | UI/evidence structure; external signatures do not create commands. |
| `FR-09` | School Revenue Receipt Register | `manual_2515.md:325-331` | UI structure and annual-report source data. |
| `FR-10` | Daily Balance Report | `manual_2515.md:333-358`; supplied PDFs above | UI structure; signatures/workflow from `AUTH-16/17/18`. |
| `FR-11` | Monthly Balance-By-Fund Report | `manual_2515.md:360-372` | Directly derivable report; Monthly Reconciliation acceptance/close from `AUTH-19`. |
| `FR-12` | Bank Reconciliation Statement | `manual_2515.md:374-406` | Directly implementable report structure; application acceptance from `AUTH-19`. |
| `FR-13` | Annual School Revenue Receipt/Payment Report | `manual_2515.md:408-443,799-808` | Directly implementable report structure; do not invent a signature absent from the source/P0-04. |
| `FR-14/15` | Paying-Agency Deposit and Withdrawal Forms | `manual_2515.md:445-485` | External-evidence/UI reference structure; `FF-14/AUTH-34` remains authoritative. |

## Conflicts And Boundary Rules

1. **Daily Balance:** OBEC custody positions and P0-04 application workflow are both preserved. The UI may reproduce source evidence fields, but application execution must follow `AUTH-16/17/18` in order.
2. **Daily Inspection:** `GAP-01_08.md` incorrectly references `AUTH-26`; `AUTH-26` creates an Audit Assessment. Daily Inspection is a separate OBEC control and must not create or reuse that capability.
3. **Cashbook:** OBEC form structure does not override ADR-0001 or P0-03. Control Registries remain canonical and Cashbook is only the approved cross-check overlay.
4. **Receipt Book deadline:** the applicable B.E. 2515 baseline states 31 October. The B.E. 2544 comparison's 15 October date is historical and does not control this pilot.
5. **Signatures:** a printed signature position is a document/evidence field. It does not create application authority, a substitute Director, an ESAO Reviewer, or any new role.
6. **Advances and direct payment:** source forms do not change P0-03 atomicity, evidence, deadlines, or money-position behavior.
7. **Audit separation:** Annual Self-Assessment (`GAP-08`) remains distinct from School Financial Accounting Audit workpapers under `BLK-004` and P0-11.

## Remaining Blocker

`BLK-007` is reduced to one concrete OBEC-material gap:

- `GAP-08`: supply the complete OBEC annual Self-Assessment instrument/result/submission form, including item-level criteria, fields, scoring/weight/result rules, and required signature or acknowledgement positions. If OBEC prescribes no fixed form or score, provide the authoritative rule stating that fact and the minimum required result/submission content.

No issuer, revision, Yala-versus-Narathiwat, all-17-School applicability, completed sample, or separate ESAO approval demand remains in `BLK-007`. Completed transaction documents belong to later acceptance-data/evidence work, not P0-05 form discovery. `BLK-004` remains separate and is not expanded by this reconciliation.

## Acceptance Decision

| Acceptance requirement | Result |
| --- | --- |
| Pilot Fund Flow form/document structures established from supplied OBEC material | Passed for `GAP-01` through `GAP-07`, with P0-03 mapping recorded. |
| Daily, monthly, annual operational, Advance, and Receipt Book structures | Passed except the distinct annual Self-Assessment instrument under `GAP-08`. |
| Fields, signatures/evidence, FF mapping, policy rule, remaining gap, and UI readiness recorded | Passed for `GAP-01` through `GAP-08`. |
| P0-03 and P0-04 preserved; no role or behavior inferred from a form | Passed. |
| Complete annual Self-Assessment form/rule available | **Failed: `GAP-08` is `MISSING`.** |

**P0-05 status:** `BLOCKED`. `GAP-01` through `GAP-07` are ready for later implementation planning, but P0-05 cannot be marked `DONE` until the concrete `GAP-08` OBEC instrument/rule is supplied. No application code or template was implemented by this task.
