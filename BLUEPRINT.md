# SchoolBanchee Master Blueprint

**Project:** School financial accounting, budget control, and audit monitoring
**Working name:** SchoolBanchee
**Audience:** Product owners, school finance teams, Education Service Area Office (ESAO) supervisors, auditors, and the implementation team
**Status:** Proposed product and domain baseline
**Version:** 1.1
**Last updated:** 2026-08-09
**Pilot authority:** [SESAO Narathiwat Pilot Governance Charter](./docs/governance/pilot-charter.md)

## 1. Purpose

SchoolBanchee is a Thai-first control and reporting application for schools that operate as subsidiary units of an education service area office. Its purpose is to make school budget registries and financial monitoring complete, traceable, reconcilable, and ready for internal or external audit.

The application must answer these questions for any school, fund flow, date, and amount:

1. What financial event occurred, under which fund flow and fiscal year?
2. Which control-registry entry is authoritative for that event?
3. Which source documents, approvals, custody records, and cross-check records support it?
4. Has the event been reconciled, remitted, reported, corrected, or closed?
5. Who performed or approved each meaningful action, and can the history be trusted?

This document is the implementation baseline. It supersedes the earlier high-level draft in `.claude/plans/budget-registry-blueprint.md` where the two conflict.

## 2. Research Basis and Scope

The requirements are derived from the local research copies in `reseach/` (the directory name is retained as-is):

| Source | Requirements used |
| --- | --- |
| `reseach/manual_2515.md` | Subsidiary-unit accounting model, three fund classes, supporting books/registers, daily/monthly/year-end reports, daily inspection, receipt-book control, borrowing/advance control, and the ten annual self-assessment dimensions. |
| `reseach/manual_2544.md` | Simplified financial-control model for schools, direct payment of budget claims by the paying authority, state-revenue remittance, non-budgetary fund handling, required registers, evidence, and monthly submission expectations. |
| `reseach/audit-operation-manual.md` | Partial SESAO operational-audit reference: school financial-accounting audit objectives, nine examination topics, criterion-level procedures and workpapers, per-school reporting, weighted scoring, result levels, ranking, and an ESAO summary. It is a candidate audit-instrument source, not an automatic replacement for the common B.E. 2515 baseline or a blanket current OBEC rule. |
| `reseach/CONTEXT.md` | Canonical project vocabulary and pilot boundaries, including the control registry, selected cashbook cross-check overlay, policy resolution, close/correction, evidence, and export terminology. |
| `reseach/คู่มือปฏิบัติงานการเงินการบัญชีและการพัสดุ.md` | Same operational guide in the research set; use as a cross-check when the two English-named copies are ambiguous. |

### In scope for the pilot

- One or more schools administered by an ESAO, with strict school data boundaries.
- A controlled School Directory seeded from the supplied 17-school CSV, with unique SMIS and Ministry of Education codes.
- Public school-user registration with System Admin platform account/registration lifecycle support and ESAO Admin organization-membership administration before any membership or application access is granted.
- Fiscal years running from 1 October through 30 September and displayed in Buddhist Era where appropriate.
- Annual Action Plans, Budget Allocations, authorized adjustments, commitments, direct-payment claims, and budget-availability/variance monitoring.
- Control registries for budget document requests, state income, and non-budgetary funds.
- Financial events with a stable reference shared by all linked records.
- Receipts, payments, remittances, refundable deposits, cash-to-bank transfers, and direct-payment confirmations.
- Official Advance approval, disbursement, due-date follow-up, and settlement by accepted evidence and/or returned money.
- Physical Receipt Book inventory, serial-range custody, issuance, void, and fiscal-year reporting.
- Required documentary evidence, approval evidence, due-date controls, and audit history.
- Daily balance reporting, registry/cashbook agreement, bank reconciliation references, monthly reconciliation, monthly financial reporting, and annual school-revenue reporting.
- Annual school self-assessment across the ten control dimensions from the 2515 guide.
- Thai-first school and ESAO workspaces; a separate English-capable system-admin workspace.
- Controlled exports with a recorded boundary, acknowledgement where required, and failed-export diagnostics.

### Explicitly out of scope for v1

- A universal cashbook that records every movement.
- A full general ledger, chart-of-accounts accounting package, or automatic double-entry postings.
- Replacing the government payment authority, treasury, bank, procurement, payroll, or tax systems.
- In-app proof of physical cash custody or bank statements. The app stores references and review results for external evidence.
- Silent editing or deletion of posted financial records.
- Cross-school consolidation as an accounting source of truth. ESAO aggregation is a read/reporting capability only.
- OCR, machine learning, predictive spending, native mobile applications, and external-system integrations until the pilot controls are proven.

### Deferred from the initial pilot

- ESAO Reviewer access, cross-school comparison, ranking, and aggregate summaries. The SESAO Auditor audit-assessment model remains in pilot scope but is gated by explicit command-level authorization decisions.

## 3. Product Principles

1. **Registry before convenience.** A posted event is a controlled record, not a mutable form row.
2. **One event, one reference.** All registries, documents, approvals, remittances, reconciliations, and reports link to a single Financial Event Reference.
3. **Policy is data.** Deadlines, custody limits, required documents, and approval rules are effective-dated policy versions, not hard-coded UI rules.
4. **No invented movement.** A direct-paid budget claim and a cash-to-bank transfer must not create fake school cashbook receipts or payments.
5. **Evidence is part of completeness.** A transaction without the required evidence is incomplete or in Needs Correction status, not silently accepted.
6. **Close preserves accountability.** Monthly close limits ordinary changes but keeps an authorized linked-correction path open.
7. **Auditability is a user feature.** The reason, actor, time, source revision, and evidence for a change must be visible to permitted reviewers.
8. **Thai-first, accessible, and printable.** Screens and reports use Thai operational language, clear Buddhist/Gregorian date handling, keyboard support, and print-safe layouts.
9. **Assessment types are explicit.** Daily inspection, Annual Self-Assessment, School Financial Accounting Audit, and Audit Review Report have different owners, evidence, conclusions, and authority boundaries.

## 4. Ubiquitous Language

The full glossary lives in [`reseach/CONTEXT.md`](./reseach/CONTEXT.md). The terms below are the minimum contract for implementation.

### Organizations and roles

- **School:** An independently managed financial reporting boundary. It is not a tenant or a branch.
- **Office of Basic Education Committee (OBEC):** Sponsor and accountable organization for the pilot, and the external Governing Policy Authority whose issued policy evidence is used by the application. OBEC does not directly operate an in-application Policy Publisher account.
- **Education Service Area Office (ESAO):** Oversight organization that receives school reports and may aggregate results.
- **Finance Officer:** School user who performs finance work for one school.
- **School Admin:** Additive School Role Assignment that may coexist with Finance Officer on the same Approved Membership and performs permitted school governance actions. It cannot activate or assign memberships and does not imply Daily Balance Verifier.
- **School Director:** The single active authenticated School role whose approval is required for selected privileged actions. ESAO Admin assigns or replaces the holder from formal external appointment evidence; without an active holder, every Director-required command is denied.
- **ESAO Admin:** Formally appointed ESAO user who administers organization memberships, School assignment, and School-level roles across all 17 SESAO Narathiwat pilot Schools. The initial pilot has no per-admin School subset, financial authority, privileged-capability assignment, self-administration, or delegation.
- **ESAO Reviewer:** Read/review/compare/report capability with no canonical financial-record mutation, financial approval, membership administration, correction execution, or policy publication authority. It is excluded and denied in the initial pilot; any later assigned-School or aggregate-reporting scope requires a new approved matrix decision.
- **SESAO Auditor:** Highest operational governance and oversight role in the application hierarchy. A SESAO Auditor may be granted the separate Policy Publisher capability, while remaining unable to silently mutate a School's canonical financial records.
- **Policy Publisher:** An in-application capability within the SESAO Internal Audit authorization model. Eligibility is established by current official Internal Audit position/assignment evidence. Order 452/2568 establishes eligibility for `นางบังอร วันริโก` and `นายอานุงรุสลัน ดาโวะ`; the approved Authorization Matrix designates exactly one current holder and one standby alternate. Application publication scope is approved separately and is not attributed to Order 452/2568. The capability registers unchanged OBEC policy evidence, sets scope/effective date, and activates/supersedes an approved Policy Version.
- **System Admin:** Platform operations and identity-governance role that owns platform account/registration lifecycle, diagnostics, and support. It cannot decide or originate organization authority. It may technically apply only the exact Product Owner/accountable-reviewer-approved Policy Publisher designation and evidence with fresh re-authentication, without selecting the person, altering approved scope, or self-granting authority. It performs no school financial action.
- **School Directory:** Controlled list of schools available for registration, identified by unique SMIS and MOE codes.
- **Registration Application:** Request for one permitted school membership; it is not an active user membership.
- **Approved Membership:** Active link between an identity and one organization boundary with one or more effective Role Assignments after Membership Approval. Finance Officer and School Admin may coexist for the same School, subject to person-level segregation of duties.

### Financial model

- **Fiscal Year:** Government accounting year, 1 October to 30 September.
- **Annual Action Plan:** Approved school plan that organizes fiscal-year Projects and Activities and their funding.
- **Budget Allocation:** Authorized spending ceiling; it is not cash received by the school.
- **Budget Commitment:** Approved obligation that reserves allocation before direct payment is confirmed.
- **Available Budget:** Revised allocation less confirmed use and outstanding commitments; it is not a cash or bank balance.
- **Official Advance:** Temporary official-purpose disbursement controlled until settled by evidence and/or return of unused money.
- **Advance Settlement:** Controlled discharge of an Official Advance; it is not an undocumented write-off.
- **Receipt Book:** Controlled physical receipt-number range assigned to a custodian for one fiscal year.
- **Document Held as Money:** Controlled document included in daily money-position evidence until cleared.
- **Fund Flow:** Classification that determines the required records, controls, and effective policy for an event.
- **Financial Event:** One auditable business occurrence submitted under a Fund Flow.
- **Financial Event Reference:** Stable identifier linking every record for one event.
- **Control Registry:** Canonical single-entry control record for a fund or document class.
- **Cashbook Cross-Check Entry:** Secondary cashbook record created only for flows whose policy requires a receipt/payment cross-check.
- **Document Record:** Structured record of documentary evidence such as a request, receipt, or payment voucher.
- **Posted Financial Event:** Event accepted into school records; it is not a draft.

### Reconciliation and governance

- **Daily Registry/Cashbook Agreement:** Daily comparison of applicable cross-check balances with canonical registry balances.
- **Monthly Reconciliation:** End-of-month reconciliation and report-preparation procedure.
- **Monthly Close:** Marking a month as reported while preserving approved linked corrections.
- **Linked Correction:** Audited correction linked to the original event and affected records; it replaces nothing silently.
- **Privileged Correction:** Post-close linked correction requiring authenticated School Director Approval before execution, with the proposer/preparer barred from self-approval. The initial pilot requires no separate independent pre-execution reviewer; immutable evidence is retained for later approved oversight access.
- **Audit Log:** Immutable history of meaningful financial and governance actions.
- **Effective Financial Policy / Policy Version:** Versioned rules selected by scope and event effective date.

### Assessment and audit

- **Annual Self-Assessment:** School-submitted fiscal-year review against a versioned ten-dimension checklist, with evidence, findings, corrective actions, and Director/ESAO review. It is not an independent external audit result.
- **School Financial Accounting Audit:** SESAO-led substantive examination of one School's financial-accounting controls for a defined audit period, using approved criteria, workpapers, and evidence without mutating canonical financial records.
- **Audit Assessment Cycle:** Versioned instance of a School Financial Accounting Audit for one School and period, including assigned auditor, policy/checklist revisions, workpapers, findings, score/result, report, acceptance, and follow-up.
- **Audit Checklist Version:** Effective-dated set of audit topics, criteria, test methods, required evidence, scoring weights, and result-level rules, with source citation, publisher, scope, and applicability. Examination-topic and scoring-category mappings are stored explicitly when they differ.
- **Audit Workpaper:** Structured record of one audit test or review step, including criterion, method, observation, evidence references, conclusion, and responsible reviewer.
- **Audit Finding:** Documented audit conclusion or exception linked to a workpaper and evidence, with severity, owner, due date, corrective action, response, and verification state.
- **Audit Score:** Reproducible weighted result calculated from a checklist version and completed workpapers; it is a historical snapshot and never replaces findings or evidence.
- **Audit Result Level:** Policy-defined classification of an audit score and/or specified critical findings. Names, bands, and override rules are policy data, not hard-coded assumptions.
- **School Financial Accounting Audit Report:** Finalized per-school report preserving audit scope, source revisions, workpaper conclusions, findings, score/result, acceptance history, and corrective-action state.
- **ESAO Audit Summary:** Authorized aggregate report over finalized school audit reports; result distributions or ranking are included only when policy and scope permit them.

## 5. Actors and Permission Boundary

Access is scoped by organization and role. A user never gains access to another school's financial records merely by knowing an identifier.

| Capability | Finance Officer | School Admin | School Director | ESAO Admin | ESAO Reviewer | SESAO Auditor / Policy Publisher capability | System Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Submit public registration | Request Finance Officer | Not publicly requestable; ESAO Admin may add after approval | Not publicly requestable | Not publicly requestable | Not publicly requestable | Not publicly requestable | Not publicly requestable |
| Platform account/registration lifecycle | No | No | No | No organization-membership decision | No | No | Platform-wide only |
| Administer organization membership, School assignment, or School-level role | No | No | No | Authorized organizational boundary | No | No | No |
| Draft and submit financial events | Own school | Own school if granted | Review only | No school entry | No school entry | No school entry | Support only, no business entry |
| Post routine events | Yes, within policy | Valid routine-posting delegation only | No | No | No | No | No |
| Prepare Daily Balance | Yes | No | No | No | No | No | No |
| Verify Daily Balance | No self-verification | No role inferred | Approves after verification | No role inferred | No role inferred | No role inferred | No |
| Approve/sign Daily Balance | No | No | Authenticated approval/signature after verification | No | No | No | No |
| Approve director-required actions | No | No | Yes | No | No | No | No |
| Start/assign accounting audit | No | No | No | No | No | Appointed auditor: assigned schools | No |
| Perform audit workpapers | No | No | No | No | No | Assigned auditor: assigned schools | No |
| Submit audit finding response | Own school | Own school if granted | Own school | No | Read/review/compare/report only | Review only | No |
| Finalize/accept audit assessment | No | No | No | No authority inferred | No authority inferred | Different appointed SESAO Auditor from the working auditor | No |
| View audit result/ranking | Own school's finalized report | Own school's finalized report | Own school's finalized report | Authorized membership history only | Deferred and denied in initial pilot | Assigned Audit Assessment Cycle only; ranking denied | Operational diagnostics only |
| Reconcile and prepare monthly report | Yes | Yes | Review only | No | Read/review/compare/report only; no return/acceptance authority | No | No |
| Close a month | No | No | Yes, after accepting the prepared reconciliation; no delegation | No | Deferred and denied | No | No |
| Create post-close Privileged Correction | Propose if authorized | Propose if authorized | Approve before execution | No | No correction or review authority inferred | No | No |
| Publish or supersede Policy Version | No | No | No | No | No | Policy Publisher capability only | No |
| View a school | Own school | Own school | Own school | Membership-administration boundary only | Deferred and denied in initial pilot | Assigned Policy/Audit scope only | Operational diagnostics only |
| Manage identity/audit operations | No | No | No | Assigned membership history | Permitted review/report evidence only | Policy-publication audit only | Platform-wide account/registration lifecycle only |
| Export financial data | Allowed categories only | Allowed categories only | Allowed categories only | Membership-administration evidence only | Deferred and denied in initial pilot | Assigned Audit Assessment evidence only where later export policy permits | Diagnostics only |

System Admin owns platform account and registration lifecycle only. ESAO Admin is authoritative for organization membership approval/rejection, suspension/removal, School assignment, and School-level role assignment; platform administration cannot bypass that boundary.

SESAO Product Owner/accountable reviewer is the external appointment authority for ESAO Admin. System Admin may technically apply or revoke only the exact appointment evidence with fresh re-authentication and complete audit attribution; it cannot originate the appointment, select the person, alter the all-17-School scope, or use this path for ordinary membership or another privileged capability.

SESAO Product Owner/accountable reviewer also externally appoints or revokes SESAO Auditors. Multiple holders may have organization-wide eligibility across all 17 Schools, but appointment alone grants no School evidence access; access begins only through an assigned Audit Assessment Cycle. System Admin again acts only as the evidence-bound technical executor.

A SESAO Policy Publisher may activate an evidence-backed Policy Version without a second-person approval or pre-activation review. Activation remains attributable and audited. P0-04 cannot close until Order 452/2568 current-status verification, the approved Matrix designation of the current holder and standby alternate, separately approved application publication scope, remaining `OPEN` values, and final matrix approval are recorded.

The Product Owner/accountable reviewer designates exactly one current holder and one standby alternate through the approved Authorization Matrix. Current official Internal Audit position/assignment evidence establishes eligibility; no separate Policy Publisher Appointment Memorandum or separate SESAO Auditor appointment document is required. System Admin is only the technical executor. The alternate cannot publish while standby; replacement requires updated authoritative evidence, current-status verification, and an updated approved designation. No delegation or fixed expiry is required.

Temporary Director Approval remains a constrained future mechanism but is excluded and denied in the initial pilot. When no authenticated School Director is active, every Director-required command is denied; later activation requires a new approved matrix decision for issuer, command scope, duration, reviewer, evidence, and segregation-of-duties restrictions.

Segregation of duties is enforced for approval, verification, inspection, and close. The same person must not silently create, approve, reconcile, and close the same sensitive action when the effective policy prohibits it. For Daily Balance, Finance Officer preparation, verification by a different School Admin or Finance Officer holding `Daily Balance Verifier`, and School Director approval/signature are separate ordered controls.

Audit-assessment assignment, final acceptance, independent review, and ranking visibility remain subject to the approved Policy Version and the unresolved P0-04 authorization scope. The audit workflow is read/review oriented and cannot mutate a School's canonical financial records; any financial correction uses the normal linked-correction commands.

### 5.1 Registration and membership lifecycle

`Submitted -> Pending Review -> Needs Correction (optional) -> Approved | Rejected | Withdrawn`

1. The public form loads School choices from the active School Directory; an applicant cannot create or type an arbitrary school.
2. The applicant supplies Thai display name, normalized email, password/confirmation, selected School, requested school role, and required policy acknowledgements. SMIS/MOE codes are displayed for disambiguation.
3. Only Finance Officer can be requested publicly. School Admin may be added by ESAO Admin to the same School membership at approval or later without replacing Finance Officer; School Director, System Admin, ESAO Admin, ESAO Reviewer, SESAO Auditor, and Policy Publisher are never publicly requestable. No generic privileged-capability administration command exists; each permitted privileged appointment or Policy Publisher designation requires its own enumerated evidence-backed command.
4. Submission validates uniqueness/rate limits, hashes the password with the approved password algorithm, creates the identity in `PENDING_APPROVAL`, and creates a Registration Application. It returns a generic response and creates no NextAuth session.
5. System Admin manages the platform account/registration lifecycle and cannot make an organization-membership decision. A formally appointed ESAO Admin may review applications across all 17 SESAO Narathiwat pilot Schools and is the sole decision maker with no second reviewer. Queue viewing requires an authenticated session; approve, reject, request correction, suspend, remove, School-assignment change, and School-role add/remove require fresh re-authentication.
6. ESAO Admin approval atomically creates the Approved Membership with Finance Officer and activates the identity when it has at least one active membership. ESAO Admin may add or remove School Admin at approval or later without replacing Finance Officer. Rejection, correction, suspension, removal, assignment change, and role change require a structured reason; every decision records actor, subject, School, requested/assigned roles, previous/new state, reason, time, outcome, and Audit Log evidence. Suspension, removal, assignment change, and role change immediately invalidate the subject's authorization revision.
7. NextAuth sign-in succeeds only for an active identity with an active membership. ESAO Admin suspension, School assignment/role change, and membership removal take effect on the next protected server check and remain audited.
8. The first System Admin is created by a one-time operational bootstrap using an environment-identified email and securely supplied password; public registration cannot solve the initial trust problem.
9. ESAO Admin assigns, replaces, or revokes exactly one active School Director per School from formal external appointment evidence. The command requires fresh re-authentication, has no second reviewer, atomically replaces the prior holder, invalidates affected authorization revisions, and records actor, School, old/new Director, evidence, reason, effective time, and outcome.

## 6. Fund Flows and Record Matrix

Fund Flow is the primary discriminator. The UI asks for the flow first and then presents only fields and records allowed by its policy.

| Fund Flow | School cash movement | Canonical registry | Required documents | Cashbook cross-check | Controlled child/due date |
| --- | --- | --- | --- | --- | --- |
| **Budget Direct-Payment Claim** | No | Document-Request Registry | Claim/request evidence; procurement/payment evidence | No | Direct-Payment Confirmation; optional authority reference |
| **Retainable Non-Budgetary Receipt** | Yes | Non-Budgetary Registry | Receipt Record and source evidence | Yes | None unless policy assigns one |
| **Retainable Non-Budgetary Payment** | Yes | Non-Budgetary Registry | Payment Voucher Record and source evidence | Yes | None unless policy assigns one |
| **State Income Receipt** | Yes until remitted | State-Income Registry | Receipt Record and source evidence | Yes | Remittance with policy due date |
| **State-Income Remittance** | Yes out | State-Income Registry | Remittance evidence | Yes where policy requires | Closes the related state-income obligation |
| **Refundable Deposit Receipt** | Yes until returned | Deposit Registry | Receipt Record, contract/deposit evidence | Yes | Refund/return with due date |
| **Refundable Deposit Return** | Yes out | Deposit Registry | Payment/return evidence | Yes | Must reference the originating deposit |
| **Official Advance Disbursement** | Yes out | Advance Registry and applicable fund registry | Approved advance agreement and purpose evidence | Yes | Advance Settlement with policy due date |
| **Official Advance Settlement** | Sometimes (unused return) | Advance Registry and applicable fund registry | Accepted expense evidence and/or unused-money receipt | Cash portion only | Closes or reduces the originating advance |
| **Cash-to-Bank Transfer** | Position change only | Applicable fund registry | Deposit/withdrawal evidence | No | No external receipt/payment semantics |

Budget categories such as personnel, operating, investment, subsidy, and other expenditure are attributes of a Budget Direct-Payment Claim or policy, not permission to manufacture a school cash entry.

### 6.1 Budget control chain

`Annual Action Plan -> Budget Allocation -> Budget Adjustment (optional) -> Budget Commitment (optional) -> Budget Direct-Payment Claim -> Direct-Payment Confirmation`

- An allocation is approved authority, not school cash.
- A commitment reserves available allocation but is not yet an expense or payment.
- A claim consumes a commitment, where one exists, or directly consumes available allocation when policy permits.
- Direct-Payment Confirmation establishes actual use for budget monitoring without creating a school cash movement.
- Reallocation and cancellation preserve the old values, authorization, reason, and effective date.
- Dashboard variance separates revised allocation, outstanding commitment, confirmed use, and available budget.

## 7. End-to-End Lifecycle

### 7.1 Financial event lifecycle

`Draft -> Submitted -> Needs Correction (optional) -> Approved (if required) -> Posted -> Reconciled -> Reported -> Closed`

`Rejected`, `Cancelled`, and `Archived` are terminal or governance states with an explicit reason. A Posted event is never deleted. A correction creates a new linked event and leaves the original visible.

### 7.2 Receipt or payment workflow

1. Finance Officer selects the Fund Flow and effective date.
2. The system resolves exactly one Policy Version by school scope, fund flow, and date.
3. The form collects the policy-required parties, amount, purpose, budget/programme reference, document numbers, money position, and evidence references.
4. Validation checks fiscal-year membership, positive amount, uniqueness, required evidence, authority, due dates, available balance where applicable, and segregation of duties.
5. The event is submitted. Director-required actions wait for an authenticated Director Approval.
6. Posting atomically creates the canonical registry entry, the permitted documents, any permitted cashbook cross-check entry, and the audit event.
7. Daily inspection compares records and records an acceptance or Needs Correction result.

### 7.3 Budget direct-payment workflow

1. Record the claim/request and assign a Financial Event Reference.
2. Track receipt of complete evidence and submission to the ESAO/paying authority.
3. Record authority payment confirmation and entitled payee; do not post school cash.
4. Mark the claim complete only when the confirmation and policy-required evidence are present.

### 7.4 Remittance and refundable-deposit workflow

1. Receipt creates an obligation and a Policy-derived Due-Date Control.
2. Dashboard and notification jobs surface upcoming and overdue obligations.
3. Remittance/return references the source receipt and records destination, date, amount, and evidence.
4. Partial settlement is allowed only when the policy permits it; the remaining obligation stays open.

### 7.5 Official advance workflow

1. Confirm the requester is eligible, the purpose/fund is allowed, and the required estimate and activity/travel evidence is complete.
2. Enforce the policy rule that can prohibit a new advance while the person has an unsettled prior advance.
3. Obtain authenticated Director Approval and post the disbursement, Advance Registry entry, applicable fund/cashbook record, Due-Date Control, and Document Held as Money reference.
4. Settlement accepts expense evidence, unused-money return, or both. The accepted evidence amount plus returned amount cannot exceed the outstanding advance.
5. Mark the advance settled only when its outstanding amount is exactly zero. Overdue advances remain visible in daily/monthly controls and corrective-action work.

### 7.6 Daily inspection and reconciliation

- Finance Officer prepares the Daily Balance Report for each operating day with activity from cash, documents held as money, bank-position records, applicable cashbook cross-checks, and canonical registries.
- A different authenticated School Admin or Finance Officer holding the School-scoped `Daily Balance Verifier` capability verifies the prepared report. The capability cannot be inferred from daily inspection; the verifier cannot prepare, approve/sign, solely reconcile, or close the same report.
- After independent verification, an authenticated School Director formally approves/signs the report. The preparer cannot approve/sign the same report.
- The report records opening balance, receipts, payments/position changes, closing balance, external evidence references, preparer identity/time, verifier identity/time/evidence, and School Director approval/signature identity/time.
- Daily inspection remains a separate comparison control. It may record its own inspector and acceptance/Needs Correction result, but does not substitute for the independent-verifier capability.
- A disagreement creates a Registry/Cashbook Disagreement and blocks normal close until resolved or explicitly accepted under policy.
- At month end, the Monthly Reconciliation includes the final daily report, bank reconciliation reference, outstanding remittances/deposits, unresolved exceptions, and report package.

### 7.7 Receipt-book control

- Register each physical book's book number and non-overlapping serial range before issue.
- A Finance Officer may issue a Receipt Book without a mandatory second-person authorization. Record custodian, issuance/handover evidence, fiscal year, and the used/voided/unused status of each controlled receipt number; the former "approval" label means custody/issuance evidence.
- A void keeps both the number and reason; a number is never reused or deleted.
- A book is not issued across fiscal years. Unused numbers at year end are cancelled under policy and included in the annual usage report.
- Reconcile system Receipt Records to issued serials during daily inspection and include gaps/duplicates in Needs Correction.

### 7.8 Annual self-assessment

Each school completes one assessment per fiscal year against these ten control dimensions from the 2515 guide:

1. School fund administration
2. Control of remaining balances
3. Cash custody
4. Receipt control
5. Payment control
6. Accounting/register maintenance
7. Financial reporting
8. Daily receipt/payment inspection
9. Advance/loan control
10. Receipt-book control

Each dimension has a versioned checklist, evidence references, finding severity, owner, due date, corrective action, and Director submission/acceptance. ESAO Reviewer comparison is excluded and denied in the initial pilot; any later assigned-School or aggregate scope requires a new approved matrix decision and cannot change school records.

### 7.9 School financial accounting audit assessment

The section 3 audit in `reseach/audit-operation-manual.md` is a substantive, SESAO-led examination of a School's accounting controls. It verifies that the Annual Action Plan covers every fund transparently, actual balances and custody controls are complete and compliant, and accounting/register/reporting records are current and correct. It is a fourth workflow alongside Daily Inspection, Annual Self-Assessment, and Audit Review Report. It is not a second way to post or correct financial records.

One appointed SESAO Auditor performs and submits an explicitly assigned Audit Assessment Cycle; a different holder of the same SESAO Auditor role independently verifies findings and finalizes/accepts it with strong re-authentication. Neither may mutate School canonical records. Appointment and cycle-assignment authority remain subject to explicit decisions; ESAO Reviewer access, cross-school comparison, ranking, and aggregate summaries are excluded and denied in the initial pilot.

`Planned -> Assigned -> Fieldwork -> Findings Draft -> Management Response -> Review -> Finalized -> Follow-up -> Closed`

1. Any appointed SESAO Auditor may start an Audit Assessment Cycle for one School and a defined fiscal/audit period, then assign one working and one different finalizing SESAO Auditor; the creator may occupy either position, never both. Create/assign/reassign requires fresh re-authentication, grants evidence access only for that Cycle/School, preserves all assignment history, and blocks the Cycle if revocation leaves either position vacant. Persist the applicable Policy Version, Audit Checklist Version, source revision, scope, as-of date, and both assigned auditors before fieldwork begins.
2. Execute the versioned criteria through criterion-level Audit Workpapers. A workpaper records the assertion, test method, population or sample where applicable, observation, evidence references (including external cash-custody and bank evidence), conclusion, preparer, reviewer, and timestamps.
3. Cover the nine examination topics named by the reference: Annual Action Plan; remaining balances; cash custody; receipts and payments; accounting/register maintenance; financial reports; daily receipt/payment inspection; advances/loan debtors; and Receipt Books.
4. Preserve the source's detailed subtests, including plan preparation/execution/follow-up, physical and bank/passbook balance checks, custody appointments and limits, receipt/payment authorization and evidence, register-to-source tie-outs, report completeness/submission, daily sign-offs, advance aging/settlement, and serial-range custody and year-end reporting.

| Examination topic | Minimum versioned audit assertions and evidence |
| --- | --- |
| Annual Action Plan | Responsible preparation, mission/OBEC alignment, all funding sources, project/activity timing-budget-owner, required plan/change approvals, publication, semester monitoring, and annual results reporting. |
| Remaining balances | Cash, bank/passbook, and drawing-agency deposit balances exist at the audit cut-off and reconcile by fund/register to the Daily Balance Report. |
| Cash custody | External appointment/count/storage/signature evidence, policy-controlled custody limits, and remittance/deposit exceptions or aging. |
| Receipts and payments | Written finance assignment; receipt-form/serial control; authorized purpose and payee; source/procurement/approval/payment evidence; and receipt/payment voucher, register, cheque/bank, and approval tie-outs. |
| Accounting/register maintenance | Required state-income, non-budgetary, deposit, request, and drawing-agency registers are current, complete, and traceable to source documents and balances. |
| Financial reports | Daily balance report completeness and required signatures; monthly package, bank comparison, submission evidence, and required other-report timing or exception reasons. |
| Daily receipt/payment inspection | End-of-day receipt totals, payment-voucher/register comparison, assigned-inspector evidence, and required sign-off. |
| Advances/loan debtors | Eligibility, approval, agreement/estimate/purpose evidence, due-date control, debtor ledger completeness, prior-unsettled restriction, settlement evidence, and overdue follow-up. |
| Receipt Books | Fiscal-year use, parallel-book rationale, custodian/register issue evidence, serial/count reconciliation, void/unused cancellation and retention, and annual usage-report evidence. |

5. Convert failed or qualified tests into Audit Findings linked to the workpaper and source evidence. Each finding has severity, condition, cause/effect or rationale, owner, due date, corrective action, management response, verification/re-test, and closure or accepted-exception state.
6. Produce a per-School School Financial Accounting Audit Report from the completed workpapers and summary forms. The report includes objectives, scope, criteria/checklist and policy revisions, exceptions, recommendations, score/result, signatures or acceptance events required by policy, issue date, and report revision metadata.
7. Calculate an Audit Score only from the versioned rubric. The reference document's example has ten weighted score categories totaling 100 points (5/20/5/10/20/20/5/5/5/5), even though its examination list has nine topics because receipts and payments are scored separately. Store that mapping, any N/A/rounding/critical-finding rules, and result-band cutoffs as policy data; the reference names four result levels but does not provide verified current cutoff ranges.
8. Generate an ESAO Audit Summary over finalized reports only. Result distributions and school ranking are permitted only when the applicable Policy Version authorizes them, the cohort uses a comparable checklist/rubric, and the requesting actor's assigned-school boundary permits the view. Ties, incomplete cycles, and suppressed personal identifiers are explicit outcomes.
9. Keep the final cycle, workpapers, findings, score, rank snapshot, acceptance history, and reports immutable. A correction to an underlying financial record or a revision to a stored audit dependency follows the linked-correction path or audit revision path and marks dependent audit artifacts Stale; a replacement report or re-opened follow-up preserves the original history.

The reference workpaper pack includes balance-count, cash, bank, bank-reconciliation, drawing-agency-deposit, non-budgetary-custody, state-income-custody, receipt-use/recording, payment-evidence/recording, advance-debtor, receipt-book-count/control, and note workpapers, plus annual-plan and financial-control summary forms. These are configurable instrument templates and are not hard-coded as current B.E. 2544 law.

## 8. Domain Invariants

These rules are enforced in domain services and database constraints, then covered by automated tests.

1. Every posted event has one immutable Financial Event Reference, one school, one fiscal year, one Fund Flow, and one resolved Policy Version.
2. Amounts are positive exact decimal values; no binary floating-point arithmetic is used for money.
3. A posting is atomic: either all required records for the flow are created, or none are.
4. A flow that excludes a cashbook cross-check never creates one; a flow that requires one cannot be posted without it.
5. A Budget Direct-Payment Claim cannot change a school cash or bank balance.
6. A Cash-to-Bank Transfer changes money position within the same fund and cannot be reported as an external receipt or payment.
7. State Income and Refundable Deposit receipts cannot be closed without their required remittance/return or a policy-authorized exception.
8. A Financial Event Reference is unique within the platform and all linked records use it rather than copied descriptions.
9. Receipt numbers, payment-voucher numbers, claim numbers, deposit references, and remittance references are unique within their configured school/fiscal-year/register scope.
10. A posted record is immutable. Corrections are linked, reasoned, permission-checked, and auditable.
11. A closed month rejects ordinary backdated posting. A Privileged Correction requires the source close revision, structured reason category, evidence, and authenticated School Director Approval before execution; the proposer/preparer cannot self-approve, no separate independent pre-execution reviewer is required in the initial pilot, and immutable evidence is retained for later approved oversight access.
12. A source event with a Lifecycle Child cannot be directly replaced or re-parented.
13. A reconciliation becomes Stale whenever a related posted event, correction, policy result, or evidence reference changes.
14. A report is reproducible from its stored filter, policy, data revision, and generation time. A stale report remains retained and is replaced explicitly.
15. Policy resolution rejects overlapping or tied effective policies; a user cannot select an ad hoc deadline or rule.
16. Every export is authorization-checked by category and school/ESAO boundary. A failed export receives a correlation ID and display code without leaking data.
17. Audit-log entries are append-only and include actor, role, scope, action, target, timestamp, outcome, and before/after or reason data where relevant.
18. An Official Advance cannot be settled for more than its outstanding amount; accepted evidence plus returned money must equal the total amount settled.
19. When policy prohibits concurrent advances, a person with an unsettled advance cannot receive another.
20. Receipt Book serial ranges cannot overlap within a School, and used/voided numbers are never reused or deleted.
21. A Registration Applicant has no organization membership, protected session, or financial access before Membership Approval.
22. Public registration cannot request or grant System Admin, ESAO Admin, reviewer, or Policy Publisher privileges.
23. ESAO Admin organization-membership administration records additive School Role Assignments independently from the public Finance Officer request. Finance Officer and School Admin may coexist for one School, but role union cannot imply Daily Balance Verifier or bypass person-level segregation of duties; System Admin platform authority cannot bypass the boundary.
24. A school choice must reference an active School Directory record; SMIS and MOE codes are unique immutable identifiers.
25. Middleware route checks never replace server-side membership and organization authorization.
26. Normalized email is unique, and at most one active/pending Registration Application exists for the same identity and School; public responses do not reveal whether an identity already exists.
27. An Annual Self-Assessment, a School Financial Accounting Audit, a Daily Inspection, and an Audit Review Report are distinct record types with distinct actors and lifecycles; one cannot be silently substituted for another.
28. Every Audit Workpaper belongs to one Audit Assessment Cycle and one Audit Checklist Version, records its test outcome and evidence references, and cannot be finalized while a required criterion is missing unless the policy records an authorized exception or N/A rationale.
29. Finalized audit cycles, workpapers, findings, score snapshots, rank snapshots, and reports are immutable. A correction to a stored audit dependency creates a Stale dependency and an explicit replacement or follow-up revision; a later unrelated policy publication does not re-resolve historical audit results.
30. Audit Scores and any result level or ranking are reproducible from the stored checklist/rubric version, completed workpapers, source revisions, and authorized cohort; a score never hides an unresolved finding.
31. Audit-assessment commands may create review, finding, report, and follow-up records, but cannot mutate a School's canonical financial records or bypass linked-correction and authorization rules.
32. An Audit Assessment Cycle resolves exactly one published Audit Checklist Version by School scope and audit/as-of date. Missing or tied versions fail closed, and a finalized cycle never re-resolves merely because a later checklist is published.
33. A Daily Balance Report records Finance Officer preparation, verification by a different School Admin or Finance Officer holding `Daily Balance Verifier`, then authenticated School Director approval/signature in that order. The verifier cannot prepare, approve/sign, solely reconcile, or close the same report.
34. A Policy Version becomes inactive only when a newer activated Policy Version supersedes it. Historical policy resolution remains immutable, and no separate retirement/deactivation command exists.

## 9. Core Algorithms

### 9.1 Policy resolution

For a given School, Fund Flow, and effective date:

1. Select published policy versions whose effective range includes the date, whose Fund Flow matches, and whose organization scope contains the School.
2. Rank candidates by declared specificity: school-specific, then ESAO-wide, then approved national/default scope.
3. Require exactly one candidate at the highest applicable rank. Zero candidates means `POLICY_NOT_FOUND`; multiple candidates mean `POLICY_AMBIGUOUS`.
4. Persist the selected Policy Version and the resolution inputs on the Financial Event.
5. Never re-resolve a posted historical event merely because a newer policy is published.

Policy publication rejects overlapping active ranges at the same scope and specificity. A user cannot bypass a missing/ambiguous policy by choosing a version in the event form.

Activating a newer Policy Version supersedes the prior active version for future applicability. There is no separate Policy Version retirement/deactivation transition, and historical events retain their originally resolved version.

### 9.1.1 Audit checklist resolution

For a given School and audit/as-of date:

1. Select published Audit Checklist Versions whose effective range includes the date and whose organization scope contains the School.
2. Rank candidates by declared specificity: school-specific, then ESAO-wide, then approved national/default scope.
3. Require exactly one candidate at the highest applicable rank. Zero candidates means `AUDIT_CHECKLIST_NOT_FOUND`; multiple candidates mean `AUDIT_CHECKLIST_AMBIGUOUS`.
4. Persist the selected checklist version, source citation, rubric, and resolution inputs on the Audit Assessment Cycle before workpapers are created.
5. Never re-resolve a finalized historical cycle merely because a newer checklist is published. A correction to a stored checklist dependency uses the explicit stale/replacement path.

Audit Checklist publication rejects overlapping active ranges at the same scope and specificity. An auditor cannot bypass a missing or ambiguous checklist by selecting a version in the audit form.

### 9.2 Atomic posting

Posting runs through a Prisma interactive transaction at `SERIALIZABLE` isolation. Where balance, allocation, or sequence rows need explicit mutual exclusion, use carefully reviewed parameterized `SELECT ... FOR UPDATE` statements inside that transaction; retry PostgreSQL serialization failures under the same idempotency key:

```text
authorize actor and school membership
return prior result when the idempotency key already succeeded
lock draft event, fiscal period, numbering sequence, and linked obligation/commitment
resolve and persist the applicable policy version
validate state, evidence, approval, amount, date, balance, allocation, and link rules
allocate the immutable Financial Event Reference and scoped document numbers
insert canonical registry entry
insert only the documents and cashbook cross-check allowed/required by the Fund Flow
update obligation, commitment, counters, and derived balance projections
append audit event and enqueue post-commit notifications/outbox messages
commit; retry serialization conflicts under the same idempotency key
```

Report generation and notifications never sit inside the financial transaction. They consume the committed source revision and can be retried safely.

### 9.3 Budget availability

For one allocation dimension (School, Fiscal Year, category, programme, Project/Activity, and any policy-required source):

```text
revised_allocation = original_allocation + approved_increases - approved_decreases
confirmed_use = sum(active direct-payment confirmations and policy-recognized actuals)
outstanding_commitment = sum(max(commitment_amount - confirmed_use_applied - releases, 0))
pending_uncommitted_claim = sum(active unconfirmed claims that have no commitment)
available_budget = revised_allocation
                 - confirmed_use
                 - outstanding_commitment
                 - pending_uncommitted_claim
```

A pending claim backed by a commitment remains covered by that commitment and is not subtracted twice. Approving a commitment or posting a claim locks the allocation/commitment rows inside the serializable transaction, then recalculates from current canonical values so concurrent requests cannot overspend. A negative Available Budget is rejected unless the resolved policy contains a specifically authorized exception, which is separately approved and audited.

### 9.4 Financial and position balances

Balances are derived from active canonical records, not accepted from the client:

```text
fund_closing = fund_opening + external_receipts - external_payments
position_closing = position_opening
                 + external_in - external_out
                 + transfers_in - transfers_out
```

A Cash-to-Bank Transfer nets to zero at fund level but moves value between cash and bank positions. Budget Direct-Payment Claims and confirmations are excluded from school cash/bank balances. Stored running balances are projections for performance and are rebuilt/tested against canonical sums.

### 9.5 Registry/cashbook agreement

For each operating day, select canonical entries whose Fund Flow requires a cross-check, then compare them to cashbook cross-check entries by Financial Event Reference. Agreement requires the same event-reference set, amount, direction, date, fund, and money position, followed by equal opening and closing totals. The result records missing references, extra references, field mismatches, and total delta; a zero total delta alone is not sufficient.

### 9.6 Linked correction

1. Lock the original event, its Lifecycle Children, related close revision, and current reconciliation/report dependencies.
2. Reject direct source replacement when a Lifecycle Child would be orphaned or re-parented.
3. Before close, create an explicitly linked reversal/adjustment and corrected event under the current open revision.
4. After close, require a Privileged Correction proposal, structured reason, evidence, source close revision, and authenticated School Director Approval before execution; reject any proposal where the proposer/preparer is the approver. No separate independent pre-execution reviewer is required in the initial pilot; immutable evidence is retained for later approved oversight access. Post the Adjustment Entry in the permitted open period.
5. Recalculate affected projections and mark dependent reconciliations/reports Stale in the same transaction.
6. Keep the original, correction chain, approvals, and replacement reports queryable as one audit history.

### 9.7 Reconciliation and stale propagation

A Reconciliation Version stores its dependency set: event revisions, cross-check revisions, evidence references, bank-reconciliation version, and Policy Versions. Acceptance appends an Acceptance Event rather than overwriting the version. Any later change to a dependency marks that version and its reports Stale, opens a new sequenced version, and leaves the accepted historical version intact.

## 10. Data Model

Use PostgreSQL through Prisma with explicit history and normalized relations. Internal IDs are opaque UUIDs; public references and human-facing document numbers remain separate stable fields. Money is stored in `numeric(19,2)` (or an equivalent exact decimal type) and calculated without JavaScript floating-point arithmetic. Immutable report/configuration snapshots are stored only where they improve historical reproducibility; independently governed records remain relational records.

### Tenancy and identity

- `organizations`: platform, ESAO, or school scope, Thai/English names, immutable `smis_code`/`moe_code` where applicable, status, parent organization ID.
- `users`: normalized identity/email, display names, password hash, account status, authorization version, authentication metadata.
- `registration_applications`: applicant ID, requested school/role, status, reviewer decision, structured reason, timestamps.
- `organization_memberships`: user ID, organization ID, effective dates, status, approver ID, authorization revision.
- `membership_role_assignments`: membership ID, role, effective dates, status, grant/revocation actor, reason, evidence reference, and timestamps; Finance Officer and School Admin may coexist for one School, while exactly one School Director assignment may be active per School.
- `privileged_appointments`: appointment or designation type, external authority/designation authority, evidence reference, subject, fixed scope, effective/current-status or revocation information, technical executor, outcome, and timestamps. Policy Publisher records retain Order 452/2568 eligibility evidence and approved Authorization Matrix designation separately.
- `auth_events`: credential, sign-in, sign-out, recovery, suspension, and session-security evidence separate from financial audit actions where appropriate.
- `role_permissions`: permission definitions and policy-bound capabilities.
- `fiscal_years`: Buddhist display year, Gregorian start/end, status, close metadata.

### Configuration and policy

- `fund_flows`: code, name, category, whether school cash moves, required registers/documents/cross-check.
- `fund_types`: budget, state income, retainable non-budgetary, refundable deposit, and configured subtypes.
- `annual_action_plans`: school, fiscal year, approval status, revision, and programme/project hierarchy.
- `budget_allocations`: plan dimension, original amount, revised amount, authority reference, source revision.
- `budget_adjustments`: allocation, direction/transfer, amount, effective date, reason, approval.
- `budget_commitments`: allocation, counterparty/purpose, committed amount, applied amount, status, approval.
- `receipt_books`: school, fiscal year, book number, serial range, custodian, issuance/handover evidence, return evidence, status. These evidence fields are not a mandatory second-person authorization.
- `receipt_book_numbers`: book, serial, status, linked Receipt Record, void reason, audit revision.
- `policy_versions`: scope, effective start/end, status, publisher, superseded-by version where applicable, source citation, immutable rule payload. Inactivity is represented only by supersession.
- `policy_resolution_records`: event, selected policy version, resolution inputs, and result.
- `audit_checklist_versions`: source citation, publisher, scope, effective range, status, topics, criteria, test methods, required evidence, scoring weights, and result-level rules.
- `audit_checklist_items`: checklist version, examination topic, criterion, scoring category, maximum points, applicability, and required workpaper fields.
- `numbering_sequences`: per-school/fiscal-year/register document sequence and gap/void controls.

### Financial records

- `financial_events`: event reference, school, fiscal year, effective date, flow, status, counterparty, purpose, amount, money position, source revision.
- `registry_entries`: canonical registry type, event reference, receipt/payment/position-change amounts, running balance snapshot, document number.
- `cashbook_cross_checks`: event reference, only for permitted receipt/payment flows, money position, debit/credit, balance, agreement status.
- `document_records`: document type, number, issue date, issuer/recipient, evidence location/reference, verification status.
- `event_links`: typed links among claims, receipts, remittances, deposits, returns, transfers, and corrections.
- `due_date_controls`: source event, policy rule, due date, status, settlement amount, exception reason.
- `official_advances`: source event, recipient, agreement, purpose, due date, original/outstanding amount, status.
- `advance_settlements`: advance, settlement date, accepted-evidence amount, returned amount, status, evidence references.
- `approvals`: approval type, actor, authenticated timestamp, reason category, evidence reference, source revision.

### Control and reporting

- `daily_inspections`: operating date, inspector, source revisions, result, discrepancy reason, acceptance event.
- `daily_balance_reports`: report date, money-position balances, supporting inspection reference, preparer identity/time, `Daily Balance Verifier` identity/time/evidence, School Director approval/signature identity/time, discrepancy state, generation revision.
- `bank_reconciliations`: period, external statement reference, book balance, statement balance, outstanding items, result.
- `monthly_reconciliations`: fiscal period, version, status, linked daily/bank records, exceptions, acceptance event.
- `monthly_closes`: period, close revision, closed by, closed at, report package, reopen/exception policy.
- `annual_assessment_cycles`: school, fiscal year, checklist version, status, submission and acceptance.
- `assessment_items`: dimension, finding, severity, evidence, owner, due date, corrective action.
- `audit_assessment_cycles`: School, fiscal/audit period, as-of date, checklist/policy/source revisions, assigned auditor, status, submission/review/finalization/closure events, and report references.
- `audit_workpapers`: cycle, checklist item, procedure, population/sample, observed result, evidence references, conclusion, preparer/reviewer, and verification history.
- `audit_findings`: cycle/workpaper, control topic, severity, rationale, owner, due date, corrective action, management response, verification/re-test, and closure or accepted-exception state.
- `audit_score_snapshots`: cycle, rubric revision, per-category awarded/max points, total, result level, cohort/rank snapshot, tie/incomplete handling, and calculation timestamp.
- `reports`: type, scope, filters, source revisions, policy versions, status, generated artifact metadata, stale/replacement link.

### Audit and operations

- `audit_log`: append-only financial/governance history with hash-chain or equivalent tamper evidence.
- `export_attempts`: category, scope, requester, acknowledgement, result, correlation ID, display code, artifact metadata.
- `system_logs`: operational diagnostics kept separate from financial audit evidence.
- `notifications`: due-date, Needs Correction, stale, disagreement, and review alerts.

### Relational integrity controls

- Foreign keys include `organization_id` and `fiscal_year_id` where a cross-school or cross-year link would be unsafe. Command services also validate that linked records share the permitted scope.
- Unique/partial indexes cover normalized email, SMIS/MOE codes, event reference, scoped document numbers, active membership, Registration Applications, Receipt Book serials, idempotency keys, policy overlap constraints, and one active close per period.
- Audit Checklist Versions reject overlapping published effective ranges at the same scope and specificity; a cycle persists one resolved checklist/rubric version and reports persist their authorized cohort/rank snapshot.
- Prisma validation, PostgreSQL `CHECK` constraints, enums, and required relations reject malformed money, dates, state values, required scope, and incompatible record shapes; domain services enforce procedure-specific cross-record rules.
- `SERIALIZABLE` transactions and locked rows protect approvals, allocations, closes, numbering, registrations, and correction dependencies from lost updates.
- Financial/history records are never cascade-deleted. Relations use `ON DELETE RESTRICT` or archival paths, preserving the controlled correction and audit history.
- Schema/index changes use reviewed Prisma migrations with preflight validation; application startup does not silently change the production schema.

## 11. Application Architecture

### Recommended shape

Start as a modular monolith so posting, policy resolution, reconciliation, and audit logging share one ACID transaction. Keep module boundaries explicit so an ESAO reporting read model or integration can be added later without changing the financial source of truth.

**Current baseline:** Next.js 14 App Router, React 18, shadcn/ui, Tailwind CSS, and lucide-react. The existing repository is a UI shell only; persistence and authentication are not implemented.

**Selected production stack:** TypeScript, PostgreSQL, Prisma, NextAuth with a Credentials provider and password hashing, object storage for report artifacts, and a background job runner for notifications and long reports. `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` come from validated environment configuration. PostgreSQL is the multi-school production source of truth; SQLite is not an acceptable substitute for the shared deployment.

### Modules

1. **Identity and organization:** School Directory seed, registration, NextAuth authentication, approval, memberships, and role/scope checks.
2. **Policy:** version publication, scope validation, resolution, and citations.
3. **Financial events:** flow-specific commands, validation, posting, links, and corrections.
4. **Registries:** canonical registry projections and running balances.
5. **Cross-check and custody:** cashbook overlay, daily inspection, external evidence references.
6. **Reconciliation and close:** daily/monthly reconciliation, stale detection, close revisions.
7. **Assessment:** annual ten-dimension self-assessment plus SESAO school accounting audit assessment, versioned workpapers, findings, scoring, and corrective actions.
8. **Reporting and exports:** reproducible report queries, print/PDF/CSV/XLSX boundaries.
9. **Audit and operations:** append-only audit history, system logs, export diagnostics, backups.

### Command/query boundary

Financial mutations use commands that validate policy and write all linked records in one transaction. Reports, dashboards, and ESAO aggregation use read queries or projections and never become alternate write paths.

Suggested commands:

- `SubmitRegistrationApplication`
- `ReviewRegistrationApplication`
- `ApproveMembership` / `SuspendMembership`
- `SubmitFinancialEvent`
- `ApproveFinancialEvent`
- `PostFinancialEvent`
- `RecordDirectPaymentConfirmation`
- `RecordRemittance` / `RecordDepositReturn`
- `RecordCashToBankTransfer`
- `InspectDailyRecords`
- `PrepareDailyBalance` / `VerifyDailyBalance` / `ApproveDailyBalance`
- `CreateReconciliationVersion` / `AcceptReconciliation`
- `CloseMonth`
- `ProposeLinkedCorrection` / `ApprovePrivilegedCorrection`
- `StartAssessmentCycle` / `SubmitAssessment` / `AcceptAssessment`
- `StartAuditAssessment` / `AssignAuditAssessment`
- `RecordAuditWorkpaper` / `SubmitAuditAssessment`
- `FinalizeAuditAssessment` / `VerifyAuditFinding`
- `PublishPolicyVersion`
- `GenerateReport` / `GenerateAuditSummary` / `ExportReport`

## 12. API and Validation Contract

Financial and administration endpoints are authenticated, organization-scoped, and idempotent for a caller-provided request key. Public School Directory lookup and Registration Application submission are the only initial unauthenticated business endpoints; they are rate-limited, return non-enumerating responses, and grant no membership.

Example route groups:

```text
/api/auth/*
/api/public/schools
/api/registration-applications
/api/admin/registration-applications/*
/api/admin/memberships/*
/api/organizations/:organizationId/*
/api/fiscal-years/*
/api/action-plans/*
/api/budget-allocations/*
/api/budget-commitments/*
/api/official-advances/*
/api/receipt-books/*
/api/policies/*
/api/financial-events/*
/api/registries/*
/api/inspections/daily/*
/api/reconciliations/*
/api/monthly-closes/*
/api/assessments/*
/api/audit-assessments/*
/api/reports/*
/api/exports/*
/api/audit/*
```

Validation must produce field-level errors in Thai for school workspaces and stable machine-readable codes for support. Do not trust client-supplied school IDs, approver names, balances, policy IDs, or report totals; derive or authorize them server-side.

Audit-assessment endpoints resolve the assigned School scope, Audit Checklist Version, and applicable Policy Version server-side. Workpaper completion, finding verification, finalization, aggregate summaries, and ranking visibility fail closed when required evidence, authorization, comparable rubric data, or the policy-defined acceptance path is missing.

NextAuth middleware performs coarse route gating and redirects. Every route handler, server action, and data query performs authoritative server-side account-status, membership-role, organization-scope, and authorization-version checks; middleware claims alone are insufficient for financial access.

## 13. User Experience Blueprint

The application opens to the user's permitted workspace and current fiscal year. Thai is the default language for school and ESAO users; technical identifiers and official source-document names may remain in English.

### Core screens

- **Public registration:** active School search/selection with SMIS/MOE codes, permitted role request, account fields, privacy acknowledgement, and pending-review confirmation.
- **Registration administration:** System Admin platform account/registration-lifecycle queue and ESAO Admin organization-membership queue within the authorized boundary. ESAO Admin, not System Admin, provides approve, correction, reject, suspend, School-assignment, School-role, and membership-history views.
- **Workspace dashboard:** balances by fund flow and money position, due/overdue remittances and deposits, Needs Correction items, stale reconciliations, and recent audit-sensitive actions.
- **Budget workspace:** Annual Action Plan, revised allocations, commitments, direct-payment claims, confirmed use, available budget, and variance by programme/project.
- **Financial event intake:** flow-first form with dynamic policy-required fields, document checklist, evidence references, approval path, and posting preview.
- **Official advances:** approval queue, outstanding/due/overdue list, evidence settlement, unused-money return, and recipient history.
- **Receipt-book control:** serial-range inventory, custodian handover, issued/used/void/unused reconciliation, and annual report.
- **Registry views:** document-request, state-income, non-budgetary, deposit, and configured fund registers with running totals and scope filters.
- **Cashbook cross-check:** only applicable entries, with agreement/disagreement state and link back to canonical event.
- **Daily Balance and inspection:** Finance Officer preparation, assigned `Daily Balance Verifier` verification, and School Director approval/signature states, plus the separate inspection checklist, counted balances, external evidence references, discrepancy workflow, and inspection acceptance event.
- **Reconciliation:** versioned daily/monthly reconciliation, bank comparison fields, outstanding items, report package, and stale indicators.
- **Monthly close:** close readiness checklist, unresolved exceptions, report submission, close revision, and permitted correction path.
- **Annual self-assessment:** ten dimensions, evidence, findings, corrective actions, and Director/ESAO review.
- **School financial accounting audit:** assigned-auditor queue, versioned criteria and workpapers, evidence and external-evidence references, findings, management responses, verification, score/result, and final report history.
- **ESAO audit summary:** authorized assigned-school audit status, overdue finding follow-up, comparable result distributions, and policy-permitted ranking with clear scope and cohort filters.
- **Reports and exports:** reproducible filters, Thai fiscal dates, print-safe templates, export category boundary, and replacement history.
- **Administration:** school users, fiscal years, numbering sequences, and fund-flow configuration for authorized school/ESAO users; organization membership administration is reserved for ESAO Admin, platform account/registration lifecycle for System Admin, and policy publication for the Matrix-designated eligible Internal Audit Policy Publisher acting on unchanged OBEC policy evidence.

### Interaction and accessibility requirements

- Use stable tables with numeric columns right-aligned, visible filters, pagination, and keyboard navigation.
- Use familiar icons from lucide-react for commands, with tooltips for unfamiliar icons.
- Provide explicit confirmation for posting, approval, close, correction, archive, and export actions.
- Never hide a stale, disputed, or Needs Correction state behind a color-only indicator.
- Support desktop-first workflows and usable tablet layouts; mobile is read/triage capable, not a replacement for full document entry.
- Reports must print with school identity, fiscal period, source revision, page numbers, and signature areas where required.

## 14. Reporting and Audit Outputs

### Required reports

1. Daily Balance Report for each activity day, including cash, bank positions, documents held as money, and applicable cross-check totals.
2. Monthly Financial Report package for the ESAO, submitted by the policy deadline (the research guide specifies the 15th of the following month for the standard monthly package).
3. Bank Reconciliation with external statement reference and outstanding items.
4. Annual School Revenue Receipt/Payment Report, submitted within the policy period after fiscal year end (the guide specifies 30 days).
5. Fund balance and outstanding-obligation reports by Fund Flow, type, programme, and money position.
6. Annual ten-dimension Self-Assessment and corrective-action report.
7. Audit Review Report for approvals, corrections, voids, disagreements, stale reports, exports, and policy changes.
8. Budget Allocation/Commitment/Use/Availability and variance reports by plan, programme, Project/Activity, category, and fiscal period.
9. Outstanding/Overdue Official Advance and settlement report by recipient, fund, due date, and corrective status.
10. Receipt Book custody, serial usage/gap/void, and fiscal-year usage report.
11. School Financial Accounting Audit Report with audit scope, checklist/policy revisions, workpaper conclusions, findings/recommendations, management responses, verified corrective actions, score/result, and required acceptance/signature history.
12. ESAO Audit Summary for an authorized comparable cohort, with assessment completion, finding status, result distribution, and policy-permitted ranking.

The Audit Review Report in item 7 is a review of audit-sensitive system actions. It is not the School Financial Accounting Audit Report in item 11.

Every report stores the exact filters, source revision, policy resolution, generator, and generation timestamp. Audit summaries additionally store the finalized-cycle cohort, checklist/rubric revision, ranking/tie rules, and authorization scope. When related data changes, the report is Stale and a Replacement Report is generated rather than silently overwriting it.

## 15. Security, Privacy, and Resilience

- Enforce least privilege, organization scoping, and server-side authorization on every read and write.
- Use NextAuth middleware for route gating and server-side membership checks for authorization; inactive/pending users never receive protected application access.
- Hash credentials using the selected memory-hard password algorithm, rate-limit registration/sign-in, prevent account enumeration, and protect registration endpoints against CSRF/automation abuse.
- Require strong authentication and re-authentication for director approval, close, privileged correction, policy publication, audit finalization, and sensitive export.
- Encrypt data in transit and at rest; keep evidence references private by default and use expiring access for stored artifacts.
- Redact personal identifiers in ESAO aggregates and exports unless the export policy allows them.
- Restrict audit workpapers, findings, scores, result levels, and rankings to the assigned School/ESAO boundary; school users can access only their School's authorized report and response workflow.
- Keep audit logs append-only, separately permissioned, and retained according to the applicable records policy.
- Back up the database and report metadata daily, test restoration quarterly, and record backup health.
- Define recovery objectives before production: target RPO <= 24 hours and RTO <= 4 hours for the pilot unless the sponsoring authority sets stricter values.
- Provide idempotency keys, retry-safe jobs, and a clear failed-export correlation path.

## 16. Quality Strategy

### Automated tests

- Unit tests for fiscal-year/date conversion, money arithmetic, policy resolution, due dates, balance calculations, and permission checks.
- Property tests for allocation/commitment concurrency so two individually valid requests cannot jointly overspend an allocation.
- Property/invariant tests for posting atomicity, prohibited cashbook rows, immutable history, and correction/link constraints.
- Integration tests against a real PostgreSQL database for registration, membership authorization, every Fund Flow, serializable transaction retry, constraint enforcement, and close state.
- Contract tests for report totals and export boundaries.
- End-to-end tests for receipt, payment, direct-payment claim, remittance, daily inspection, monthly close, privileged correction, and annual assessment.
- End-to-end tests for advance eligibility/disbursement/partial settlement/overdue closure and Receipt Book issue/use/void/year-end cancellation.
- Unit and integration tests for Audit Checklist Version resolution, topic-to-score-category mapping, workpaper completeness, score/result calculation, tie/incomplete handling, finding verification, immutable finalization, stale/replacement behavior, and assigned-school authorization.
- End-to-end tests for auditor assignment, fieldwork, management response, final audit report, authorized ESAO summary, and corrective-action re-test without canonical-record mutation.

### Audit acceptance fixtures

Maintain deterministic fixtures for at least:

- A budget claim paid directly to a vendor with no school cash movement.
- Two concurrent commitments competing for the same remaining allocation, with exactly one succeeding.
- A retainable receipt, cash-to-bank transfer, and payment with matching cross-check.
- State income received, partially remitted, overdue, and fully remitted.
- A refundable deposit received and returned after month close.
- An advance blocked by an older unsettled advance, then settled by valid expense evidence plus unused cash return.
- Overlapping receipt serial ranges rejected and a voided number retained permanently.
- A registry/cashbook disagreement corrected before close and after close.
- A tied/overlapping policy version rejected by resolution.
- A report becoming stale and being explicitly replaced.
- A failed export that is visible only within its authorized boundary.
- An applicant unable to sign in before approval, an ESAO Admin unable to approve an unassigned school, and approval activating exactly one scoped membership.
- A School Financial Accounting Audit with all required workpapers, nine examination topics, ten policy-configured score categories, findings, a finalized report, and an authorized ESAO summary.
- An incomplete workpaper pack, unresolved required finding, or missing policy result band that blocks audit finalization.
- Two comparable finalized audit cycles with a policy-defined tie/rank outcome, plus an incompatible checklist or out-of-scope school excluded from the ESAO ranking view.
- A post-finalization financial correction or verified finding update that marks the affected audit report and summary Stale and produces an explicit replacement.

### Definition of done for a financial feature

A feature is complete only when its policy, command validation, persistence constraints, audit events, permissions, report impact, Thai errors, migration/backup behavior, tests, and user workflow are documented and verified.

## 17. Delivery Roadmap

Execution status, task ownership, dependencies, phase gates, and session handoffs are tracked in [`DEVELOPMENT-CHECKLIST.md`](./DEVELOPMENT-CHECKLIST.md).

### Phase 0: Domain and policy foundation

- Confirm pilot schools, roles, fund-flow catalogue, evidence retention, and policy publishers.
- Approve the glossary and the canonical-vs-cross-check boundary.
- Convert the research guide's rules into initial versioned policy data.
- Produce a signed sample pack of real anonymized forms and expected totals.

**Exit:** policy owners can explain every Fund Flow and required record, and the sample pack has expected answers.

### Phase 1: Secure foundation

- TypeScript and application shell with Thai-first locale.
- Authentication, organization membership, RBAC, fiscal years, and audit-log infrastructure.
- PostgreSQL/Prisma schema, reviewed migrations, the validated School Directory seed, numbering sequences, and backup job.
- NextAuth sign-in, public registration, System Admin platform account/registration lifecycle, ESAO Admin organization-membership lifecycle, and first-System-Admin bootstrap.

**Exit:** a user can enter only the permitted school workspace and every privileged action is audited.

### Phase 2: Core controlled records

- Flow-first event intake and posting commands.
- Annual Action Plan, allocation, adjustment, commitment, direct-payment claim, and availability controls.
- Document-Request Registry for budget claims and direct-payment confirmation.
- Non-budgetary, state-income, deposit, and transfer registries.
- Official Advance and Receipt Book control workflows.
- Selected cashbook cross-check entries and running balances.

**Exit:** all pilot fixtures post correctly without prohibited records and balances are reproducible.

### Phase 3: Daily control and close

- Daily inspection and Daily Balance Report.
- Disagreement/Needs Correction workflow.
- Bank reconciliation references, monthly reconciliation versions, close readiness, and close revision.

**Exit:** a school can complete an auditable month and a reviewer can reproduce its close package.

### Phase 4: Reporting, assessment, and SESAO audit

- Monthly and annual report packages, print/PDF/CSV exports, stale/replacement behavior.
- Ten-dimension annual self-assessment and corrective-action tracking.
- SESAO School Financial Accounting Audit Assessment with workpapers, findings, policy-controlled scores/result levels, final reports, and authorized aggregate summaries.
- ESAO review and aggregate risk views.

**Exit:** ESAO can receive, review, and trace school reports and finalized accounting audits without changing canonical school records.

### Phase 5: Pilot hardening and rollout

- Security review, restore drill, performance test, accessibility review, Thai language review, training, and support runbook.
- Pilot with a small representative school set across different fund profiles.
- Capture discrepancies and update policy versions rather than patching history.

**Exit:** pilot acceptance criteria are met, unresolved risks have owners, and a rollout/rollback plan is approved.

## 18. Success Measures

- 100% of posted events have a policy resolution, Financial Event Reference, required evidence status, and audit trail.
- 0 prohibited cashbook entries for direct-payment claims and cash-to-bank transfers.
- 0 overspent Budget Allocations without an explicit policy-authorized, approved exception.
- 100% of monthly packages identify their source revision and reconciliation acceptance.
- All overdue state-income remittances and refundable deposits are visible with an owner and due date.
- All overdue Official Advances and unexplained Receipt Book gaps are visible with an owner and corrective status.
- Daily and monthly report totals reproduce from the registry without manual spreadsheet repair.
- Annual self-assessment completion and corrective-action closure are measurable per school.
- 100% of finalized School Financial Accounting Audits identify their audit period, assigned scope, checklist/rubric and policy revisions, completed workpapers, findings, score/result, and report history.
- ESAO audit summaries and any authorized ranking reproduce from comparable finalized audit cycles without exposing unassigned schools or hiding incomplete cycles.
- Typical event entry is under two minutes after configuration; routine reports render in under five seconds for a pilot school.
- Restoration drills meet the agreed RPO/RTO and no cross-school data is exposed in authorization tests.

## 19. Risks and Controls

| Risk | Control |
| --- | --- |
| Old and new manuals appear to imply different accounting shapes | Bind every pilot school to an approved procedure/policy version; keep universal ledger behavior out of the shared core. |
| Regulatory deadlines or custody limits change | Effective-dated policy publication with citations and non-overlap validation. |
| Concurrent posting overspends a fund or allocation | Exact numeric money, serializable PostgreSQL transactions, locked allocation rows, idempotency, retry, and concurrency tests. |
| Users work around the system in spreadsheets | Make required registers/reports faster to produce, import opening balances under approval, and measure unresolved manual adjustments. |
| Cross-school data exposure | Organization-scoped foreign keys/queries, deny-by-default authorization, export boundaries, and penetration tests. |
| Misconfigured PostgreSQL isolation permits inconsistent posting | Startup and integration checks require migrations, transactional connectivity, and serializable retry behavior before enabling posting. |
| Public registration is abused or grants privilege | Rate limiting, non-enumerating responses, restricted requested roles, no session before approval, scoped approvers, and audited activation. |
| Evidence is lost or cannot be reviewed | Retention policy, integrity metadata, encrypted object storage or controlled external reference, backup and restore drills. |
| Poor school connectivity interrupts entry | Retry-safe drafts and idempotent submission; decide offline scope before Phase 1 exit. |
| A correction invalidates an accepted close/report | Dependency tracking, stale propagation, sequenced reconciliation, and explicit replacement reports. |
| Self-assessment, daily inspection, and final audit are conflated | Separate aggregates, commands, evidence, reports, and permissions; no assessment record can mutate canonical financial records. |
| Historical audit weights or ranking rules are treated as current | Versioned audit checklist/rubric with source citation, scope, effective range, explicit topic-to-score mapping, and policy-controlled result bands/ranking. |
| Pilot shortcuts become production liabilities | Phase exit criteria, migration tests, documented exceptions, and production security/restore review before rollout. |

## 20. Decisions and Open Questions

### Baseline decisions

- The Control Registry is the financial source of truth; the cashbook is a deliberate cross-check overlay.
- Budget Allocations and Commitments measure authority and reservation, not school cash.
- Financial events are posted as controlled domain records, not as automatic universal double-entry journal rows.
- Policy versions are effective-dated and published by the Matrix-designated eligible Internal Audit Policy Publisher from unchanged OBEC policy evidence. A newer activation supersedes the prior version; school users and other ESAO roles cannot retire, deactivate, or override versions ad hoc.
- Corrections are linked and auditable; close is not implemented as destructive freezing.
- ESAO aggregation is reporting-only and cannot mutate a school's canonical records.
- PostgreSQL through Prisma is the persistence layer; financial commands run in serializable transactions with database-enforced relations and constraints.
- NextAuth is the authentication layer, while authoritative authorization is enforced server-side from active memberships.
- Public registration creates a pending application only; ESAO Admin membership approval within the permitted organizational boundary is required before access, while System Admin remains limited to platform account/registration lifecycle.
- The repository School Directory seed contains the supplied 17 schools with unique SMIS and MOE codes.

### Resolve before Phase 1 exit

- Which exact OBEC/ESAO policy documents and revisions are effective for the pilot schools?
- Which fund flows require cashbook cross-checks, which require Director Approval, and which allow partial settlement?
- Which Official Advance purposes/funds are permitted, what due dates apply, and which Receipt Book forms/serial rules are currently authoritative?
- Evidence storage location, retention period, maximum file size, and external-document reference format.
- PostgreSQL hosting boundary, encryption/key ownership, backup service, and recovery objectives approved by the sponsoring authority.
- Registration identity-proof requirements, email verification/recovery channel, password policy, and which school roles applicants may request.
- Official report templates, Thai terminology review, signature requirements, and export classifications.
- Which section 3 audit criteria, workpaper templates, weights, topic-to-score-category mapping, result-level cutoffs, ranking cohort/tie rules, signatures, and finding-response deadlines are currently applicable to SESAO schools.
- Whether the pilot needs offline capture or can require a connected deployment.

## 21. Traceability Rule

Every implemented rule must point to a policy version and research citation. Every research-derived report field must point back to the event, registry entry, document, reconciliation, assessment item, Audit Workpaper, or Audit Finding that produced it. When a regulation changes, publish a new Policy Version, update tests and forms for future events, and preserve the old resolution for historical events.
