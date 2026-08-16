# P0-05 OBEC Form And Report Implementation Register

**Status:** `DONE`
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
| `reseach/Export-form_2515.pdf` | Supplied OBEC B.E. 2515 assessment-guide form appendix. It directly defines the 15 form/report layouts below; the companion summary preserves their row, column, grouping, total, and signature structure. | 16 PDF pages: index plus 15 form specimens printed pp. 15-29. SHA-256 `22683D2C1680D26D8F15CCC4000B4933F79A8F7B156543131D221A7AEAF6B1F6`. Companion structure: `reseach/Export-form_2515_summarized_structure.md`. |
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
| `GAP-02` Payment evidence | `Form_2515.pdf` PDF p. 7 / printed appendix p. 23, **Receipt-in-lieu**; `Form_Registries_001.pdf` PDF p. 1 / printed p. 21, **Non-budgetary Payment Approval Memorandum**; PDF p. 4 / printed p. 24, **Withholding Certificate (Form BK.28)**; general evidence rules at `manual_2515.md:184-214`. | `FF-04`, `FF-06`, `FF-08`, `FF-10`, `FF-12`; source evidence also supports `FF-09` | Evidence type/reference; office; payer/payee identity and address; purpose/item rows; amount numeric/text; payment category; tax base/rate/amount where applicable; source document attachment/reference; paid stamp/name/date metadata. | Receipt-in-lieu has recipient signature. Approval memo shows Finance Officer preparation and approval positions. BK.28 shows payer/certificate position. Printed positions are captured evidence; application approval remains `AUTH-11`. | P0-03 selects required evidence per flow and prohibits unsupported behavior. `AUTH-11` requires Finance Officer preparation and approval by only the valid explicitly scoped Effective Director Authority holder. | Salary/pension-specific forms named in `GAP-01_08.md` are not present, but they are not required by an approved pilot FF row. Flow-specific third-party receipts, treasury, tax, bank, or contract documents remain external evidence, not missing application forms. | `IMPLEMENTABLE WITH POLICY RULE`; implement common payment-evidence metadata, structured receipt-in-lieu/BK.28 fields where applicable, and external evidence references. |
| `GAP-03` Budget request/direct-payment package | `Form_2515.pdf` PDF p. 13 / printed appendix p. 29 and `Form_Registries_001.pdf` PDF p. 15 / printed p. 38, **Document-Request Register**. | `FF-01`, `FF-02` | Sequence/date; claimant/creditor; expense category; amount; recipient signature/name; submission date; outgoing/transmission reference; paying-authority confirmation reference; notes; originating claim link; confirmation status. | Recipient signature appears in the register. Transmission and paying-authority confirmation remain external evidence references; they do not create application approvers. | P0-03 requires claim/request, source/procurement evidence, entitled payee and transmission evidence for `FF-01`; `FF-02` requires one full paying-authority confirmation and denies partial confirmation. Finance Officer records under `AUTH-10`. | The external request letter, transmission artifact, and paying-authority confirmation formats are not supplied. They are `external evidence`, not required UI templates; application must retain their references/attachments. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as Document-Request Registry UI plus external-evidence capture. |
| `GAP-04` Official Advance agreement/approval | `Form_Registries_001.pdf` PDF p. 2 / printed p. 22, **Advance Agreement and Receipt**, with OBEC rules at `manual_2515.md:684-704`. | `FF-11` | Agreement/reference number; borrower name/position/School; purpose; amount numeric/text; due date; undertaking; Finance Officer review; Director approval; disbursement receipt acknowledgement; supporting estimate/evidence reference; copy count. | Borrower, Finance Officer, Director/approver, and receipt acknowledgement positions appear. Application authority is only Finance Officer preparation plus approval by the valid explicitly scoped Effective Director Authority holder under `AUTH-12`. | Map P0-03 `FF-11` evidence and due control; map OBEC two-copy and supporting-estimate rules; enforce P0-04's exact `AUTH-12` approval boundary. | Supporting estimates are transaction evidence supplied per Advance, not a missing prescribed application form. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as Advance agreement/approval UI. |
| `GAP-05` Advance settlement/unused-cash return | `Form_Registries_001.pdf` PDF p. 3 / printed p. 23, **Advance Agreement reverse - settlement record**; `manual_2515.md:707-732`. | `FF-12`, `FF-13` | Settlement date/iteration; expense-evidence amount; unused-cash-return amount; balance; evidence/receipt number; recipient name/signature; originating agreement link; outstanding status. | Recipient signature is shown on the reverse. It is evidence of settlement/return, not an application approver. | Apply the approved P0-03 atomic settlement and evidence rules; do not infer repeated partial settlement from the table. Apply P0-04 only where an application command expressly requires it. | Completed settlement receipts and expense documents are per-transaction `external evidence`/future acceptance data, not missing form structure. Month-end outstanding Advances are derivable from agreement due/outstanding fields and the existing Daily Balance/Documents Held as Money model. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as linked settlement/return UI. |
| `GAP-06` Receipt Book custody and annual-use control | `Form_Registries_001.pdf` PDF p. 12 / printed p. 35, **Receipt Book Control Register**; receipt forms at `Form_2515.pdf` pp. 1-2; OBEC rules at `manual_2515.md:224-237,744-766`. | Supports `FF-03`, `FF-05`, `FF-07`; lifecycle command `AUTH-13` | Fiscal year; receipt type; books/ranges received; books/ranges issued; remaining books/ranges; custodian; handover date/signature evidence; used/void/unused states; correction/cancellation reference; notes; annual totals/status. | Custodian signature appears in the control register. Handover/correction/void signatures are evidence fields. No Director approval is invented. | Apply OBEC serial, no-erasure, correction/cancellation, new-fiscal-year, and 31 October annual-use reporting rules. `AUTH-13` assigns issue/handover to Finance Officer without an invented approver. | No separate annual-use sheet is supplied, but its required information is derivable from the authoritative Receipt Book register/lifecycle fields; this is `application behavior/report derivation`, not a missing source form. | `IMPLEMENTABLE WITH POLICY RULE`; directly implementable as Receipt Book inventory/lifecycle UI and derived annual-use report. |
| `GAP-07` Daily inspection and Daily Balance evidence | `manual_2515.md:736-742` defines appointed daily receipt/payment inspection and signature points; `Form_2515.pdf` PDF p. 15 / printed appendix p. 31 and `Form_Registries_001.pdf` PDF p. 11 / printed p. 34 provide the **Daily Balance/custody report**. | Cross-checks daily activity for applicable `FF-01` through `FF-14`; it does not create a new Fund Flow | Inspection assignment/evidence reference; inspection date; final receipt reference/total; Cashbook balance/reference; result/discrepancy; inspector identity/signature/time. Daily Balance fields: School/date; cash; cheques/instruments; Documents Held as Money including Advances/payment requests/passbooks; totals/amount in words; custody/handover evidence. | OBEC inspection uses an appointed inspector who signs the final receipt duplicate and Cashbook balance. Daily Balance shows preparer/head/custody committee/recipient positions. Preserve these as evidence positions; do not equate the inspector or custody committee with the application Daily Balance Verifier. | Daily Inspection remains a separate control. P0-04 `AUTH-16/17/18` governs application Daily Balance preparation, independent verification, and approval by only the valid explicitly scoped Effective Director Authority holder. `AUTH-26` does not apply to Daily Inspection. | The appointment order is organization-level `external evidence`; the application needs an evidence reference and assignment behavior, not a prescribed order template. | `IMPLEMENTABLE WITH POLICY RULE`; implement Daily Inspection and Daily Balance as separate workflows with explicit evidence mapping. |
| `GAP-08` Annual Self-Assessment/SAR | `reseach/แบบ 2515 -1.docx` document/table/paragraph references; `แบบ 2515 -2 - 3 สถานศึกษา.xlsx` sheets `แบบ 2515-2` and `แบบ 2515-3`; `แบบ สพท. 2515.xlsx` sheet `แบบ สพท.2515`; `SAR_manual_2515.pdf` and `SESAO_Audit_manual_2515.pdf` | No P0-03 Fund Flow; separate annual governance/reporting control | 2515-1 detailed criteria; 2515-2 scored rows, weights, total and result; SchoolBanchee 2515-3 all-17-School populated table; ESAO synthesis columns and formulas. | Two distinct assessors sign; active School Director approves/signs only; assigned Finance Officer submits; ESAO Reviewer reads/aggregates submitted SARs only under P0-04. | `POL-GAP-08-SAR-001` resolves direct/composite/N/A scoring, evidence gaps, lifecycle, weights/bands and reproducibility; `AUTH-24` and `AUTH-35` through `AUTH-39` resolve commands. | None for P0-05 source/contract scope. Runtime activation and implementation remain downstream work. | `IMPLEMENTABLE`; GAP-08 source/contract closure criteria satisfied without implementing a template. |

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

## Export Form 2515 Surface Contract

`Export-form_2515.pdf` is a source-structure layer, not a mandate to create
15 editable copies of paper tables. The application keeps the controlled
Financial Event, canonical Control Registry, linked Document Record, and
effective policy as its data model. Each source layout is then exposed on the
appropriate surface below.

| Surface | Meaning |
| --- | --- |
| `PRIMARY RECORD` | A controlled command captures source-backed business facts. It creates or links a Financial Event, Document Record, control data, or structured review evidence; it never posts a free-form ledger row. |
| `RECORD DISPLAY` | A queryable, printable view of canonical records and linked evidence. Rows and balances are derived from the controlled data model and are not edited in the displayed table. |
| `REVIEW / REPORT` | A dated calculation, reconciliation, inspection, or reporting view. Any permitted review inputs are stored with their source reference and audit trail; calculated totals remain derived. |
| `PRINT / EVIDENCE FORM` | A source-faithful print/export or externally received document layout. Printed names, titles, signatures, receipts, and acknowledgements are documentary evidence fields, never independent application roles or permissions. |

| Export PDF page / printed page | Source form | Required application surface | Canonical source and interaction contract | Print/evidence contract |
| --- | --- | --- | --- | --- |
| PDF 2 / p. 15 | `สมุดเงินสด` (Cashbook) | `RECORD DISPLAY` | Display the selected Cashbook Cross-Check entries and running balances for the P0-03 receipt/payment cases only. The two source sections, `รายการรับ` and `รายการจ่าย`, remain visually distinct. No user may add a Cashbook row directly, and a direct-payment claim, Official Advance position change, or `FF-14` transfer must not appear as an invented cashbook movement. | Print the source debit/credit column groups and referenced documents from derived entries. |
| PDF 3 / p. 16 | `ทะเบียนคุมเงินรายได้แผ่นดิน` (State-Income Control Register) | `RECORD DISPLAY` | Display the canonical State-Income Registry created by `FF-05` receipts and linked `FF-06` remittances. Preserve the source's grouped `ประเภทเงินรายได้แผ่นดิน` columns without inventing labels for unspecified subcolumns. | Print grouped columns, totals, document references, and date hierarchy from the resolved policy/catalogue. |
| PDF 4 / p. 17 | `ทะเบียนคุมเงินนอกงบประมาณ` (Non-Budgetary Register) | `RECORD DISPLAY` | Display the canonical Non-Budgetary Registry for approved `FF-03`, `FF-04`, `FF-07` through `FF-10`, and their permitted lifecycle children. The source `ประเภท` header is a resolved fund subtype/classification, not a free-text way to enable an unsupported fund. | Print receipt, payment, balance, and source document rows for the selected fund subtype. |
| PDF 5 / p. 18 | `ทะเบียนคุมเงินนอกงบประมาณ ประเภทเงินรายได้สถานศึกษา` (School-Revenue Non-Budgetary Register) | `RECORD DISPLAY` | Display the approved school-revenue subtype of the Non-Budgetary Registry. `ประเภทการจ่าย` remains a horizontal group of derived allocation/reporting columns, not a second editable expense classification ledger. | Print each specified source expense column and total without flattening the group into row labels. |
| PDF 6 / p. 19 | `ทะเบียนคุมหลักฐานขอเบิก` (Document-Request Register) | `PRIMARY RECORD` plus `RECORD DISPLAY` | `FF-01` captures one controlled request/claim and `FF-02` captures its one permitted full confirmation. The register view derives sequence, claimant/creditor, expense category, amount, recipient, transmission, and confirmation references from those records; register rows are not entered separately. | Print source columns including `เบิกแล้วตาม ใบเบิกเงินเพื่อจ่ายในราชการที่` as one logical reference group, plus documentary recipient signature evidence. |
| PDF 7 / p. 20 | `ทะเบียนคุมเอกสารแทนตัวเงิน` (Documents Held as Money Register) | `RECORD DISPLAY` | Display Document Held as Money controls produced by approved Advance and money-position workflows, including document type, number, amount, conversion date, and linked event. A row cannot be used to write off or independently create an Advance. | Print source columns and linked source-evidence references. |
| PDF 8 / p. 21 | `สมุดคู่ฝาก` (Deposit/Passbook Ledger) | `RECORD DISPLAY` plus `PRINT / EVIDENCE FORM` | Display the controlled deposit/withdrawal history and position balance linked to `FF-14` and external passbook evidence. The combined deposit/withdrawal reference field remains one field; it does not create an external receipt or payment. | Preserve depositor/receiver signature positions as evidence of the external custody interaction. |
| PDF 9 / p. 22 | `ทะเบียนเงินฝากธนาคารประเภทกระแสรายวัน` (Current-Account Bank Register) | `RECORD DISPLAY` | Display bank position history from authorized receipts, payments, and `FF-14` transfers with bank/account metadata. It is not a second system of record and must reconcile to the canonical registries and external statement. | Print the bank, branch, account, receipt, payment, balance, and head-of-unit signature position. |
| PDF 10 / p. 23 | `ทะเบียนคุมรายรับเงินรายได้สถานศึกษา` (School-Revenue Income Control Register) | `RECORD DISPLAY` | Display source-backed school-revenue receipts by approved subtype. Preserve `เงินที่มีผู้มอบให้` and `เงินผลประโยชน์อื่น` as grouped columns; derive their totals from canonical receipt records. | Print the original category groups, subtotal/total, document reference, and notes. |
| PDF 11 / p. 24 | `รายงานเงินคงเหลือประจำวัน` (Daily Balance Report) | `REVIEW / REPORT` plus `PRINT / EVIDENCE FORM` | Calculate cash, instruments, Documents Held as Money, passbooks, and total from the activity date. Capture Daily Inspection, custody/handover, independent verification, and approval evidence only through the separate P0-04 `AUTH-16/17/18` workflow; no report total is manually typed. | Print all fixed rows, repeatable additional items, amount-in-words, custody committee, recipient, and assigned-signature positions as documentary evidence. |
| PDF 12 / p. 25 | `รายงานประเภทเงินคงเหลือ` (Remaining-Fund Classification Report) | `REVIEW / REPORT` | Derive the budget, State Income, and non-budgetary row groups and subtotals from control registries and document/position records for the reporting date. It does not post a balance adjustment. | Print the hierarchical rows, each subtotal, grand total, date, and head-of-unit signature position. |
| PDF 13 / p. 26 | `งบเทียบยอดเงินฝากธนาคาร` (Bank Reconciliation Statement) | `REVIEW / REPORT` plus `PRIMARY RECORD` review inputs | The reconciliation record captures statement identity, statement balance, outstanding cheque and unrecorded-transfer references, permitted adjustment explanations, reviewer evidence, and status. Reconciliation arithmetic and the compared bank-register balance are derived; an adjustment is not a hidden financial-event entry. | Print the source `หัก` and `บวก` calculation groups, item references, calculated totals, result, and signature/position evidence. |
| PDF 14 / p. 27 | `รายงานการรับ - จ่ายเงินรายได้สถานศึกษา` (Annual School-Revenue Receipt/Payment Report) | `REVIEW / REPORT` | Derive the opening balance, income hierarchy, expenditure hierarchy, totals, and carried balance from approved school-revenue records for the selected fiscal year. Source numbering and row hierarchy are report taxonomy, not an invitation to post directly to an annual-report line. | Print the full source hierarchy, fiscal-year/school header, and totals. |
| PDF 15 / p. 28 | `ใบนำฝาก` (Deposit Slip and Receipt) | `PRIMARY RECORD` plus `PRINT / EVIDENCE FORM` | An approved `FF-14` deposit subtype captures money type, item lines, amount, deposit/recipient references, date, and linked bank/paying-agency evidence. It changes a money position only; it is neither a new income receipt nor a generic transfer command. | Render the compound deposit and receipt sections separately, including amount in words and depositor/recipient/head signature positions. |
| PDF 16 / p. 29 | `ใบเบิกถอน` (Withdrawal Request, Authorization, and Receipt) | `PRIMARY RECORD` plus `PRINT / EVIDENCE FORM` | An approved `FF-14` withdrawal subtype captures the request, payment method, recipient/mandate evidence, amount, and linked bank/paying-agency evidence. The command authority remains `AUTH-34` and any source-required School Director action; source labels do not create substitute approval authority. | Keep `คำขอถอนเงิน`, `คำอนุมัติ`, and `ใบรับเงิน` as three distinct printable/documentary sections, including checkbox, signature, title, and receipt positions. |

### Cross-Surface Rules

1. Primary-record capture must create or link the required Financial Event,
   canonical registry entry, document/evidence record, policy resolution, and
   audit history atomically. A rendered row, subtotal, or report line is never
   its own mutable record.
2. Record-display and review/report filters must retain School, fiscal period,
   fund flow/subtype where relevant, source revision, policy resolution, and
   generated-at timestamp. A changed input marks the prior report stale and
   requires an explicit replacement rather than overwrite.
3. The original Thai labels, row hierarchy, grouped columns, blank/repeatable
   lines, subtotals, totals, amount-in-words fields, and compound sections are
   source structure to reproduce in views and exports. They do not override
   P0-03 financial behavior, P0-04 authorization, P0-06 policy resolution, or
   ADR-0001's canonical-control-registry boundary.
4. A source signature, committee, recipient, approver, or printed title is
   captured as print/evidence data. It neither provisions an application role
   nor grants a command, and it cannot substitute for an absent active School
   Director or other required P0-04 capability.

## Conflicts And Boundary Rules

1. **Daily Balance:** OBEC custody positions and P0-04 application workflow are both preserved. The UI may reproduce source evidence fields, but application execution must follow `AUTH-16/17/18` in order.
2. **Daily Inspection:** `GAP-01_08.md` incorrectly references `AUTH-26`; `AUTH-26` creates an Audit Assessment. Daily Inspection is a separate OBEC control and must not create or reuse that capability.
3. **Cashbook:** OBEC form structure does not override ADR-0001 or P0-03. Control Registries remain canonical and Cashbook is only the approved cross-check overlay.
4. **Receipt Book deadline:** the applicable B.E. 2515 baseline states 31 October. The B.E. 2544 comparison's 15 October date is historical and does not control this pilot.
5. **Signatures:** a printed signature position is a document/evidence field. It does not create application authority, a substitute Director, an ESAO Reviewer, or any new role.
6. **Advances and direct payment:** source forms do not change P0-03 atomicity, evidence, deadlines, or money-position behavior.
7. **Audit separation:** Annual Self-Assessment (`GAP-08`) remains distinct from School Financial Accounting Audit workpapers under `BLK-004` and P0-11.

## Remaining Blocker

None for P0-05. `BLK-007` is resolved by the Product Owner contract, P0-04 amendment, `POL-GAP-08-SAR-001`, and ADR-0014. Runtime policy activation remains a downstream `AUTH-22` prerequisite and `BLK-004` remains a separate audit-policy blocker.

## Acceptance Decision

| Acceptance requirement | Result |
| --- | --- |
| Pilot Fund Flow form/document structures established from supplied OBEC material | Passed for `GAP-01` through `GAP-07`, with P0-03 mapping recorded. |
| Daily, monthly, annual operational, Advance, Receipt Book, and SAR structures | Passed as source structure; scoring and authorization policy remain open. |
| Fields, signatures/evidence, FF mapping, policy rule, remaining gap, and UI readiness recorded | Passed for `GAP-01` through `GAP-08`. |
| P0-03 and P0-04 preserved; no role or behavior inferred from a form | Passed. |
| Complete annual Self-Assessment source structure available | **Passed: supplied 2515-1/2/3 and ESAO workbooks establish the source contract.** |

**P0-05 status:** `DONE`. GAP-08 source, scoring, N/A, authorization, lifecycle, and 2515-3 exception contracts are resolved. No application code or template was implemented by this task.

## GAP-08 Contract Reconciliation Addendum (2026-08-14)

The newly supplied `reseach/แบบ 2515 -1.docx`, `reseach/แบบ 2515 -2 - 3 สถานศึกษา.xlsx`, and `reseach/แบบ สพท. 2515.xlsx` establish the complete source document structures for 2515-1, 2515-2, the SchoolBanchee 17-school 2515-3 exception, and ESAO synthesis. They also expose spreadsheet formulas for dimension totals, total score, and result bands. These formulas are recorded as source spreadsheet behavior, not automatically as authoritative runtime policy.

The former `BLK-007` wording "missing complete instrument" is narrowed. Remaining blocker evidence is the Product Owner decisions for composite scoring, N/A scoring, assessor eligibility/cardinality/segregation and lifecycle, the controlled P0-04 amendment for SAR commands and narrow ESAO Reviewer read/aggregate, and approval of the durable 17-school 2515-3 exception. No issuer, Yala/Narathiwat applicability, or separate ESAO provenance gate remains. See the decision-ready contract at [`gap-08-contract-decision-package.md`](./gap-08-contract-decision-package.md).

**Historical note superseded:** GAP-08 is now contract-closed by the Product Owner decisions recorded in `gap-08-contract-decision-package.md`; no template or application code was implemented.
