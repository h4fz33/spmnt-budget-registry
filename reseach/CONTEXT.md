# SchoolBanchee

SchoolBanchee is a school-finance context for Thai OBEC procedures. This is the sole live glossary for the target procedure and complete school-user population; current-code gaps belong in the blueprint and historical research copies are pointers only. `research/school-banchee-plan/context-thai-pronouns.md` supplies the Thai display vocabulary and formal operational register without changing the definitions below.

## Organizations And Roles

**Office of Basic Education Committee (OBEC)**:
The sponsor and accountable organization for the pilot, and the external Governing Policy Authority whose issued policy is the source for an Effective Financial Policy. OBEC does not directly operate the in-application Policy Publisher role.
Thai name: `สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน`

_Avoid_: Treating OBEC as the operational publisher, or assuming an ESAO user has Policy Publisher permission without approved eligibility and designation

**School**:
A school whose financial records are managed independently for reporting and audit purposes.
_Avoid_: Tenant, branch
Thai UI: `สถานศึกษา`

**Actual School-User Population**:
The complete set of Schools that use SchoolBanchee in the current approved scope. It is not a sample subset. The current population is the 17 Schools under SESAO Narathiwat identified in the Pilot Governance Charter.
_Avoid_: Pilot-only subset, optional sample schools

**Education Service Area Office**:
The auditing and oversight organization for its assigned school-user population. It receives and reviews school financial reports and may aggregate school-level results, but it does not own a School's canonical financial records or become the Policy Publisher by virtue of that oversight.
_Avoid_: District when referring to the formal OBEC organization, Policy Publisher, canonical-record owner
Thai UI: `สำนักงานเขตพื้นที่การศึกษา (สพท.)`

**School Admin**:
A School Role Assignment for permitted school-level governance actions that may coexist with Finance Officer on the same Approved Membership. It does not approve, activate, or assign memberships and does not imply Daily Balance Verifier.
_Avoid_: Finance officer, system admin
Thai UI: `ผู้ดูแลระบบระดับสถานศึกษา`

**Finance Officer**:
A school user assigned to perform finance work for one school.
_Avoid_: Accountant when referring to the operational finance role
Thai UI: `เจ้าหน้าที่การเงิน`

**School Director**:
The single active School role whose approval is required for selected privileged financial actions at one School. ESAO Admin assigns or replaces the holder from formal external appointment evidence; without an active holder, every Director-required command is denied.
_Avoid_: Typed approver name, checkbox approval
Thai UI: `ผู้อำนวยการสถานศึกษา`

**Director Approval**:
Approval made by an authenticated School Director for a director-required action.
_Avoid_: Reassigned approval identity

**Temporary Director Approval**:
A constrained future alternate authorization that could apply only when no authenticated School Director is active. It is excluded and denied in the initial pilot; later activation requires a new approved matrix decision for issuer, command scope, duration, reviewer, evidence, and segregation-of-duties restrictions.
_Avoid_: Director Approval, automatic shortage exception, external approver

**Routine Posting Delegation**:
An explicit, capability-specific delegation that permits routine posting within the delegate's compatible role and the same School/organizational scope. It has explicit revocation, becomes invalid when the delegator loses the underlying authority, cannot be re-delegated, and grants no approval authority.
_Avoid_: Automatic permission, approval delegation, role transfer

**Daily Balance Verifier**:
A dedicated School-scoped capability held by an authenticated School Admin or Finance Officer who independently verifies a Daily Balance Report prepared by another person before School Director approval. The authenticated School Director for that School assigns or prospectively revokes the capability but cannot assign it to themselves; the holder cannot prepare, approve/sign, solely reconcile, or close the same report and cannot delegate the capability in the initial pilot.
_Avoid_: Daily inspector by implication, report preparer, Director approver

**Deferred Privileged Command**:
An applicable privileged command whose required authorization values have not been approved and which is excluded from the current pilot and denied until a later approved policy or P0-04 matrix decision brings it into scope.
_Avoid_: Broad-role fallback, implied authorization, temporary permissive default

**Needs Correction**:
A status for an audited action that requires school follow-up before normal completion or an authorized exception.
_Avoid_: Informational warning

**System Admin**:
A platform operations and identity-governance role that owns platform account and registration lifecycle, diagnostics, and support. It cannot decide or originate organization authority. It may technically apply the exact Product Owner/accountable-reviewer-approved Policy Publisher designation and evidence without selecting the person, changing approved scope, modifying the designation, or self-granting authority.
_Avoid_: Organization membership administrator, school admin, finance officer
Thai UI: `ผู้ดูแลระบบส่วนกลาง`

**ESAO Admin**:
An Education Service Area Office user authorized to approve/reject, suspend/remove, and otherwise administer organization memberships, School assignments, and School-level roles across all 17 SESAO Narathiwat pilot Schools. The role has no per-admin School subset, financial authority, privileged-capability assignment, self-administration, or delegation in the initial pilot.
_Avoid_: System admin, school admin, policy publisher

**Privileged Appointment Evidence**:
An attributable external record that names an ESAO Admin or SESAO Auditor appointment, its approved scope, and effective information. For Policy Publisher, the authoritative organizational eligibility evidence and the approved Authorization Matrix designation are retained together. System Admin may technically apply evidence or designation but cannot originate, select, or alter its authority.
_Avoid_: System Admin decision, self-appointment, generic admin grant

**ESAO Reviewer**:
An Education Service Area Office capability limited to reading, reviewing, comparing, and reporting permitted School information, and recording permitted review/report evidence. It is excluded and denied in the initial pilot; any later assigned-School or aggregate-reporting scope requires an approved matrix decision and cannot add mutation, approval, membership, correction, policy-publication, acceptance, rejection, return, or override authority by implication.
_Avoid_: ESAO Admin, financial approver, correction reviewer by default

**SESAO Auditor**:
The single highest operational governance and oversight role in the SchoolBanchee hierarchy, which may be held by multiple appointed people. One holder performs and submits an assigned Audit Assessment Cycle and a different holder of the same role independently verifies findings and finalizes/accepts it; the role does not imply ESAO Reviewer, generic aggregate access, or financial-record mutation authority, while Policy Publisher remains a separate capability.
_Avoid_: System Admin, unrestricted financial-record editor

**School Directory**:
The controlled list of Schools eligible for registration, identified by official SMIS and Ministry of Education codes.
_Avoid_: Free-text school list, applicant-created school

**Registration Applicant**:
A person who has submitted a Registration Application but has no SchoolBanchee membership or application access.
_Avoid_: Active user, school member

**Registration Application**:
A request from a Registration Applicant for Finance Officer membership at one specific School. No other role is publicly requestable in the initial pilot.
_Avoid_: User account, Approved Membership

**Membership Approval**:
An authenticated ESAO Admin decision within the permitted organizational boundary that assigns an approved role and organization boundary to a Registration Application. System Admin platform authority cannot bypass this boundary.
_Avoid_: Email verification, self-assigned role

**Approved Membership**:
A scoped active authorization linking a user identity to one School, Education Service Area Office, or platform-operations boundary with one or more effective Role Assignments. School Role Assignments may be additive but remain subject to person-level segregation of duties.
_Avoid_: Registration Application, login session

**School Role Assignment**:
An effective role attached to an Approved Membership for one School. Finance Officer may coexist with School Admin, but role union does not create a combined role, imply Daily Balance Verifier, or bypass person-level segregation of duties.
_Avoid_: Replacement role, combined finance-admin role, implicit capability

## Interface Language

**Thai-First Interface**:
The user-facing language policy for School and Education Service Area Office workspaces. Thai is the default; identifiers, file formats, vendor names, official source-document names, and technical codes may remain in English when necessary.
_Avoid_: English-first school workspace

**System Admin Workspace**:
A dedicated platform-operations workspace for platform account/registration lifecycle, diagnostics, and support that is separately accessible from School Admin and Education Service Area Office workspaces. Organization membership administration belongs to ESAO Admin. It is the only UI scope allowed to be English-first.
_Avoid_: Organization membership administration, School Admin workspace, Education Service Area Office workspace

## Financial Procedure

**Annual Action Plan**:
The School's approved Fiscal Year plan that organizes Projects and Activities and their authorized funding.
_Avoid_: Transaction list, informal spending plan

**Annual Self-Assessment**:
A School-submitted fiscal-year review against the versioned ten control dimensions, with evidence, findings, corrective actions, and Director/ESAO review. It is not an independent School Financial Accounting Audit.
_Avoid_: External audit, final audit result

**Budget Allocation**:
An authorized spending ceiling assigned to a School for a Fiscal Year, budget category, programme, Project, or Activity. It is authority to spend, not cash received by the School.
_Avoid_: Bank balance, school receipt

**Budget Commitment**:
An approved obligation that reserves part of a Budget Allocation before direct payment is confirmed.
_Avoid_: Cash payment, completed expense

**Budget Adjustment**:
An authorized increase, decrease, or transfer of a Budget Allocation that preserves the previous allocation and its approval history.
_Avoid_: Edited allocation, cash transfer

**Available Budget**:
The uncommitted part of a revised Budget Allocation after confirmed use and outstanding Budget Commitments. It is not a cash, bank, or registry balance.
_Avoid_: Cash balance, fund balance

**Official Advance**:
Money temporarily disbursed to an eligible person for an approved official activity and controlled until settled by acceptable evidence and return of any unused amount.
_Avoid_: Personal loan, permanent expense

**Advance Settlement**:
The controlled discharge of an Official Advance using accepted expense evidence, return of unused money, or both.
_Avoid_: New receipt, undocumented write-off

**Receipt Book**:
A controlled physical receipt-number range assigned to a custodian for one Fiscal Year, including used, voided, and unused receipts. Its issuance/handover record is custody evidence, not a mandatory second-person authorization.
_Avoid_: Numbering preference, generic document sequence, second-person approval gate

**Document Held as Money**:
A controlled document, such as an outstanding Official Advance agreement or cheque, included in the applicable daily money-position evidence until cleared.
_Avoid_: Generic attachment, cash

**Fiscal Year**:
The Thai government accounting year, from October 1 through September 30.
_Avoid_: Calendar year

**Control Registry**:
An OBEC single-entry control record for a fund or document class. It is the canonical financial record for the target procedure.
_Avoid_: General ledger, cashbook source of truth

**Cashbook**:
The target-pilot secondary cross-check record collection for selected receipt/payment Fund Flows. It is not a canonical account and does not record every money movement.
_Avoid_: Universal transaction capture, source of truth

**Financial Event**:
The target-pilot unit of an auditable business occurrence submitted under a Fund Flow, with the applicable linked registry, documentary, and cross-check records.
_Avoid_: Generic cashbook row, asynchronous sync job
Thai UI: `รายการทางการเงิน`

**Financial Event Reference**:
The stable reference that links all records created for one Financial Event.
_Avoid_: Copied description, matching by date and amount

**Fund Flow**:
The classification that determines which records, controls, and Effective Financial Policy apply to a Financial Event.
_Avoid_: One-size-fits-all transaction type
Thai UI: `ประเภทกระแสเงิน`

**Budget Direct-Payment Claim**:
A budget claim documented in the request registry and later confirmed as paid directly by the paying authority. It is not a school cash or bank receipt or payment.
_Avoid_: Budget cashbook entry, school disbursement

**Retainable Non-Budgetary Fund**:
A non-budgetary fund the school may hold and use under its applicable procedure. Its external receipts and payments use the linked registry, document, and cashbook cross-check records required by that procedure.
_Avoid_: Generic income, budget fund

**State Income**:
Money the school collects but may not retain for its own use and must remit under the applicable policy.
_Avoid_: Retainable school income, unrestricted fund

**Refundable Deposit**:
Non-budgetary money held until it must be returned to the entitled party, with a controlled due date.
_Avoid_: School income, permanent balance

**Cash-to-Bank Transfer**:
An internal position change between cash and bank for the same fund. It is registry-only and is neither a receipt nor a payment.
_Avoid_: Cashbook receipt, cashbook payment, external money movement

**Canonical Registry Entry**:
The control-registry record that represents a Financial Event for financial reporting and control.
_Avoid_: Projection, synchronized copy

**Document-Request Registry**:
The control registry for documents submitted in support of a Budget Direct-Payment Claim.
_Avoid_: Cashbook receipt, school payment record

**Cashbook Cross-Check Entry**:
A linked secondary cashbook record used only where the Fund Flow requires a receipt/payment cross-check. It is not canonical and is not created for direct-paid budget claims or cash-to-bank transfers.
_Avoid_: Primary transaction record, universal cashbook row
Thai UI: `รายการบันทึกในสมุดเงินสดเพื่อตรวจสอบยันยอด`

**Document Record**:
A control record for documentary evidence associated with a Financial Event, such as a request, receipt, or payment voucher.
_Avoid_: Generic attachment

**Receipt Record**:
A document record that evidences receipt of money. It applies only to receipts.
_Avoid_: Payment voucher, expense receipt

**Payment Voucher Record**:
A document record that evidences payment of money. It applies only to payments.
_Avoid_: Receipt record, generic voucher

**Direct-Payment Confirmation**:
The recorded confirmation that an external authority paid a Budget Direct-Payment Claim directly to the entitled party.
_Avoid_: School payment, cashbook payment

**Remittance**:
The payment of State Income to the required receiving authority under the applicable policy.
_Avoid_: Retainable-fund expense, school income payment

**Due-Date Control**:
The applicable-policy deadline attached to a remittance, Refundable Deposit, or other time-bound Financial Event.
_Avoid_: Informal reminder, hard-coded local rule

**Effective Financial Policy**:
The target-pilot versioned rule set in force for a Financial Event's effective date and Fund Flow, including remittance, custody, and reporting requirements.
_Avoid_: Current setting without history, hard-coded procedure
Thai UI: `ระเบียบการเงินที่มีผลบังคับใช้`

**Policy Version**:
An auditable, effective-dated version of the Effective Financial Policy. A later activated version supersedes the active version for future applicability without rewriting the rule used by an earlier Financial Event. There is no separate retirement/deactivation command.
_Avoid_: Edited-in-place policy, retire command, deactivate command

**Policy Publisher**:
An in-application capability within the SESAO Internal Audit authorization model that registers unchanged OBEC policy evidence, sets the separately approved School scope and effective date, and activates an approved, auditable Policy Version. Current official Internal Audit position/assignment evidence establishes eligibility; the approved Authorization Matrix designates one current holder and one standby alternate. Activation does not require a second-person approval or pre-activation review. It cannot alter the OBEC source text, invent a source revision, or mutate a School's canonical financial records.
_Avoid_: External policy issuer, mutable school setting, finance-officer override, unappointed capability holder

**Policy Resolution**:
The selection of the applicable Policy Version for a Financial Event by policy scope and effective date. It rejects unresolved ties rather than allowing a user to choose an ad hoc rule.
_Avoid_: User-selected deadline, current setting lookup

## Reconciliation And Evidence

**Daily Registry/Cashbook Agreement**:
The daily agreement between applicable cashbook cross-check balances and the corresponding control-registry balances. It does not create cashbook rows for flows that exclude them.
_Avoid_: Cashbook source-of-truth check

**Daily Balance Report**:
The daily report of balances by money position used for finance control and cash-custody checking. A Finance Officer prepares it, a different School Admin or Finance Officer holding `Daily Balance Verifier` verifies it, and an authenticated School Director then formally approves/signs it.
_Avoid_: Cashbook total only, preparer self-verification, unsigned acknowledgement

**External Cash-Custody Evidence**:
Appointment, handover, count, storage, and signature evidence maintained outside SchoolBanchee for cash kept in custody.
_Avoid_: In-app custody proof

**External Bank Evidence**:
Bank-statement evidence maintained outside SchoolBanchee and referenced during bank reconciliation.
_Avoid_: In-app statement file

**Bank Reconciliation**:
The periodic comparison of bank-related registry balances and bank-statement evidence, including outstanding items.
_Avoid_: Bank report

**Monthly Reconciliation**:
The end-of-month reconciliation and report-preparation procedure, including the required bank comparison and state-income remittance reporting.
_Avoid_: Hard monthly freeze

**Monthly Financial Report**:
The report prepared for the Education Service Area Office from the applicable registry, reconciliation, and evidence records.
_Avoid_: Cashbook-only report

**Stale Reconciliation**:
A reconciliation result that is no longer current because a related financial record changed.
_Avoid_: Accepted reconciliation, draft reconciliation

**Reconciliation Version**:
A distinct, sequenced iteration of a reconciliation for one period.
_Avoid_: Hidden revision, overwritten reconciliation

**Acceptance Event**:
A dated record that a Reconciliation Version was accepted.
_Avoid_: Overwrite, status flip

## Corrections And Governance

**Posted Financial Event**:
A Financial Event accepted into the school records rather than held as a draft or form input.
_Avoid_: Saved row, asynchronous sync-pending entry

**Monthly Close**:
The act of marking a month as reported while preserving the approved, audited linked-correction path.
_Avoid_: Hard freeze, irreversible lock
Thai UI: `การปิดบัญชีประจำเดือน`

**Linked Correction**:
An audited correction linked to the original Financial Event and its affected records rather than a silent overwrite.
_Avoid_: Direct edit, replacement without trace
Thai UI: `การแก้ไขรายการแบบเชื่อมโยง`

**Adjustment Entry**:
A corrective entry linked to an original posted record after the relevant month is closed.
_Avoid_: Edit, overwrite

**Privileged Correction**:
A post-close Linked Correction made only after authenticated School Director Approval and the required audit evidence. The proposer/preparer cannot self-approve, and the initial pilot requires no separate independent pre-execution reviewer; immutable evidence is retained for later approved oversight access.
_Avoid_: Admin edit, direct fix, self-approved correction

**Post-Close Correction Approval**:
The structured authenticated School Director Approval recorded before a Privileged Correction executes, including its reason category, evidence reference, approving identity, time, and source close revision. It cannot be supplied by the proposer/preparer and requires no separate independent pre-execution reviewer in the initial pilot.
_Avoid_: Client-supplied approver, free-text approval checkbox, self-approval

**Lifecycle Child**:
A posted Remittance or Refund linked to its State Income receipt or Refundable Deposit receipt. A source with a Lifecycle Child is not directly correctable because replacing it would invalidate the child's controlled source relationship.
_Avoid_: Independent child row, silently re-parented payment

**Repair Reason Category**:
A structured classification for a post-close correction.
_Avoid_: Free-text reason only

**Registry/Cashbook Disagreement**:
A difference between a canonical registry entry and an applicable linked cashbook cross-check entry. It requires investigation and correction under the close policy.
_Avoid_: Sync warning, ignored mismatch

**Audit Log**:
The immutable history of meaningful financial and governance actions.
_Avoid_: Activity feed, debug log

**Active Financial Record**:
A financial record included in normal reporting, workflows, and review surfaces.
_Avoid_: Current row, live data

**Archived Financial Record**:
A retained financial record excluded from normal working views and reports under archive policy.
_Avoid_: Deleted record, hidden record

**Financial Archive**:
A retained financial record removed from normal working views under authorized policy, not deleted.
_Avoid_: Deletion, purge

**Audit Review Report**:
A review surface for audit-sensitive financial and governance actions.
_Avoid_: Debug report, activity log

**School Financial Accounting Audit**:
A SESAO-led substantive examination of one School's financial-accounting controls for a defined audit period. An appointed SESAO Auditor may operate an assigned cycle once its command-level authority is approved; ESAO Reviewer access, cross-school comparison, ranking, and aggregate summaries remain excluded and denied in the initial pilot.
_Avoid_: Annual Self-Assessment, Audit Review Report, general ledger

**Audit Assessment Cycle**:
A versioned instance of a School Financial Accounting Audit for one School and audit period, with different working and finalizing SESAO Auditors, applicable Policy Version, Audit Checklist Version, workpapers, findings, result, report, acceptance, and follow-up history. Any appointed SESAO Auditor may create and assign the two positions but may occupy at most one of them.
_Avoid_: Assessment item, report filter

**Audit Checklist Version**:
The effective-dated, source-cited set of audit topics, criteria, test methods, required evidence, scoring weights, and result-level rules used by an Audit Assessment Cycle. It preserves any mapping where examination topics and scoring categories differ.
_Avoid_: Mutable checklist setting, self-assessment form

**Audit Workpaper**:
A structured record of one audit test or review step, including the criterion, method, observation, evidence references, conclusion, and responsible reviewer.
_Avoid_: Generic attachment, Audit Log entry

**Audit Finding**:
A documented audit conclusion or exception linked to an Audit Workpaper and its evidence, with severity, owner, due date, corrective action, response, and verification state.
_Avoid_: Informational warning, Needs Correction status only

**Audit Score**:
A reproducible weighted result calculated from an Audit Checklist Version and the completed workpapers. It remains a snapshot of the audit and never replaces the underlying findings or evidence.
_Avoid_: Mutable grade, self-reported total

**Audit Result Level**:
A policy-defined classification of an Audit Score and/or specified critical findings for an Audit Assessment Cycle. Level names, bands, and any override rules come from the applicable version rather than being hard-coded.
_Avoid_: Universal pass/fail, color-only status

**School Financial Accounting Audit Report**:
The finalized per-School report for an Audit Assessment Cycle, preserving its scope, criteria/checklist and policy revisions, workpaper conclusions, findings, score, result level, acceptance history, and corrective-action state.
_Avoid_: Annual Self-Assessment report, overwritten reprint

**ESAO Audit Summary**:
An authorized aggregate report over finalized School Financial Accounting Audit Reports. It may include result distributions or ranking only when the applicable policy and scope permit it, and it cannot mutate a School's canonical records.
_Avoid_: Consolidated accounting source, unrestricted school ranking

**Stale Report**:
A previously produced report that may no longer represent active financial records.
_Avoid_: Invalid report, deleted report

**Replacement Report**:
A newly generated report that explicitly replaces a Stale Report while preserving report history.
_Avoid_: Silent reprint, overwritten report

## Exports And Diagnostics

**Export Type**:
The output action used to create an allowed export.
_Avoid_: Export category, report kind

**Export Category**:
The domain class of records used to determine whether an export is allowed and which boundary applies.
_Avoid_: File format, button label

**Client Export Acknowledgement**:
A UI-only acknowledgement shown before an export action when the applicable export procedure requires it.
_Avoid_: Persisted approval, audit-log acknowledgement

**Failed Export Correlation ID**:
The internal globally unique identifier for a failed export attempt.
_Avoid_: Display code, session-only code

**Failed Export Display Code**:
A human-readable code used by authorized users to find a failed export attempt within its permitted boundary.
_Avoid_: Correlation ID, audit-log ID

**System Log**:
Diagnostic records for operational investigation that are separate from financial audit evidence.
_Avoid_: Audit log, financial history

## Historical Or Extended Procedure

**Legacy Cashbook Procedure**:
The historical or extended cashbook process described by the guide as a cross-check method alongside control registries. It is background for the target pilot, not a separate canonical accounting model.
_Avoid_: Active double-entry scope

**Deliberate Cashbook Cross-Check Overlay**:
The target-pilot use of selected Cashbook Cross-Check Entries as an additional control for procedure-selected receipt/payment flows. It is informed by the Legacy Cashbook Procedure without reviving a universal cashbook workflow.
_Avoid_: Restored legacy accounting model, universal external-movement row

**Accumulated-Fund Year-End Procedure**:
The guide's historical or extended year-end accounting material concerning accumulated funds. It is documented background, not active v1 double-entry scope.
_Avoid_: Current pilot requirement
