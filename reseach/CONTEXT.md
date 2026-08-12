# SchoolBanchee

SchoolBanchee is a school-finance context for Thai OBEC procedures. This is the sole live glossary for the target procedure and complete school-user population; current-code gaps belong in the blueprint and historical research copies are pointers only. `research/school-banchee-plan/context-thai-pronouns.md` supplies the Thai display vocabulary and formal operational register without changing the definitions below.

## Organizations And Roles

**Office of Basic Education Committee (OBEC)**:
The sponsor and accountable organization for the pilot, and the central Governing Policy Authority whose common policy and form baseline applies across participating ESAO branches. OBEC does not directly operate the in-application Policy Publisher role.
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
The sole School authority whose approval is required for selected privileged financial actions at one School. A School has zero or one active holder. Without an active holder, every Director-required command is denied and no other role may substitute.
_Avoid_: Typed approver name, checkbox approval
Thai UI: `ผู้อำนวยการสถานศึกษา`

**Director Approval**:
Approval made by an authenticated School Director for a director-required action.
_Avoid_: Reassigned approval identity

**Routine Posting Delegation**:
A deferred capability-specific authorization concept for routine posting. No grant or use is enabled in the initial pilot; any future enablement requires an approved Matrix amendment.
_Avoid_: Current permission, automatic permission, approval delegation, role transfer

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
A platform operations and identity-governance role that owns platform account and registration lifecycle, diagnostics, support, and the sealed Initial Authorization Bootstrap. Outside that allowlisted bootstrap, it cannot decide or originate organization authority and may technically apply only exact approved appointment or designation records without selection, scope, or self-grant discretion.
_Avoid_: Organization membership administrator, school admin, finance officer
Thai UI: `ผู้ดูแลระบบส่วนกลาง`

**ESAO Admin**:
An Education Service Area Office user authorized to administer organization memberships, School assignments, School-level roles, and active Auditor assignments across all 17 SESAO Narathiwat pilot Schools. Auditor assignment administration does not grant Audit Assessment content access or the SESAO Auditor role; the role has no per-admin School subset, financial authority, self-administration, or delegation in the initial pilot.
_Avoid_: System admin, school admin, policy publisher

**Initial Authorization Bootstrap**:
The sealed one-time application configuration that binds named authenticated identities to the approved initial role and organizational-scope allowlist. It creates application authority and an immutable configuration history but is not an external governmental appointment or organizational evidence verification.
_Avoid_: Appointment, generic System Admin grant, reusable privilege bootstrap

**Privileged Appointment Evidence**:
An attributable post-bootstrap external record that names an ESAO Admin or SESAO Auditor appointment, its approved scope, and effective information. Initial Authorization Bootstrap records are configuration provenance, not Privileged Appointment Evidence. For Policy Publisher, authoritative organizational eligibility evidence and the approved Authorization Matrix designation are retained together.
_Avoid_: System Admin decision, self-appointment, generic admin grant

**ESAO Reviewer**:
An Education Service Area Office capability limited to reading, reviewing, comparing, and reporting permitted School information, and recording permitted review/report evidence. It is excluded and denied in the initial pilot; any later assigned-School or aggregate-reporting scope requires an approved matrix decision and cannot add mutation, approval, membership, correction, policy-publication, acceptance, rejection, return, or override authority by implication.
_Avoid_: ESAO Admin, financial approver, correction reviewer by default

**SESAO Auditor**:
The end-to-end Audit Assessment operator role, which may be held by any number of named authenticated accounts. An authenticated configured Auditor creates an Assessment and atomically becomes its initial active Auditor; the active Auditor then performs, modifies findings for, finalizes, and approves/accepts the result. The role does not imply ESAO Reviewer, generic aggregate access, financial-record mutation, or Policy Publisher authority.
_Avoid_: System Admin, unrestricted financial-record editor

**Active Auditor Assignment**:
The single effective link between one SESAO Auditor and one Audit Assessment that authorizes the Auditor's end-to-end Assessment actions. Creation establishes the initial assignment, later ESAO Admin replacement is atomic, and completion ends executable authority while preserving assignment history.
_Avoid_: Auditor team, reviewer assignment, concurrent Auditor access

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

## Governance And Document Authority

**Common OBEC Baseline**:
The centrally governed OBEC policy and form source shared across participating ESAO branches. The 17-School SESAO Narathiwat pilot uses the B.E. 2515 baseline without creating a separate ESAO policy baseline.
_Avoid_: Narathiwat-specific baseline, per-ESAO form authority

**Authoritative Reference Form**:
A supplied OBEC policy/manual form or reference implementation that may define application UI, report, register, document, printed-signature, and evidence-capture structure. Another ESAO's branding does not make it branch-specific unless the source expressly says so.
_Avoid_: Illustrative-only sample, ESAO-approved template, application authorization source

**Documentary Signature Position**:
A signature, title, committee, inspector, approver, recipient, or similar position printed on an Authoritative Reference Form as document/evidence structure. It does not itself create an application role, permission, or command authority.
_Avoid_: Application role, substitute Director, authorization grant

**Application Authorization**:
The authority for a named authenticated actor to execute an application command within an approved scope and segregation-of-duties boundary. It is not inferred from a form field, printed signature, title, or committee label.
_Avoid_: Documentary signature, typed approver, form-derived role

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
A School-submitted fiscal-year review against the OBEC ten control dimensions. Its detailed instrument, result/scoring content, signatures/acknowledgements, and application commands come only from the authoritative form/rule and applicable policy/authorization; it is not an independent School Financial Accounting Audit.
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
The one atomic controlled discharge of an Official Advance using accepted expense evidence, return of unused money, or both. Repeated partial settlement submissions are not part of the initial pilot.
_Avoid_: New receipt, undocumented write-off, repeated partial settlement

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

**Contract Security**:
Custodial money received under a contract and held pending a controlled release to the entitled contractor. It is separate from Withheld Tax; full or evidenced partial release cannot exceed the outstanding custodial balance.
_Avoid_: School income, generic refundable deposit, tax liability

**Withheld Tax**:
The tax component retained from a gross payment as a custodial liability until remitted to the Revenue Department. It is not Contract Security and is not a returnable deposit.
_Avoid_: Retainable fund, contract-security return, generic deposit

**Internal Money-Position Transfer**:
An atomic, net-zero movement between cash, bank, and/or paying-agency positions within the same fund. It is neither an external receipt nor a payment and has no Cashbook Cross-Check Entry.
_Avoid_: Cash-to-Bank Transfer, Cashbook receipt, Cashbook payment, external money movement, generic transfer authority

**Fund Class**:
The policy-controlled top-level classification of a fund. It is immutable to School administration.
_Avoid_: Locally editable school category

**Fund Type / Fund Subtype**:
The policy-defined classification used to select a Fund Flow and associated controls. The immutable initial catalogue supplies defaults; a School Admin may add school-specific entries only under approved policy templates and cannot change Fund Class or inherited flow controls.
_Avoid_: Unrestricted local category, generic `OTHER`, policy override

**Non-Compliant Partial Remittance**:
A recorded State Income or Withheld-Tax remittance that discharges less than the allocated outstanding liability. The liability remains outstanding and enters Needs Correction; the state does not authorize an otherwise unsupported partial payment.
_Avoid_: Normal partial settlement, completed remittance

**Canonical Registry Entry**:
The control-registry record that represents a Financial Event for financial reporting and control.
_Avoid_: Projection, synchronized copy

**Document-Request Registry**:
The control registry for documents submitted in support of a Budget Direct-Payment Claim.
_Avoid_: Cashbook receipt, school payment record

**Cashbook Cross-Check Entry**:
A linked secondary cashbook record used only where the Fund Flow requires a receipt/payment cross-check. It is not canonical and is not created for direct-paid budget claims or Internal Money-Position Transfers.
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
The applicable-policy deadline attached to a remittance, Contract Security, Withheld Tax, or other time-bound Financial Event.
_Avoid_: Informal reminder, hard-coded local rule

**Effective Financial Policy**:
The target-pilot versioned rule set in force for a Financial Event's effective date and Fund Flow, including remittance, custody, and reporting requirements.
_Avoid_: Current setting without history, hard-coded procedure
Thai UI: `ระเบียบการเงินที่มีผลบังคับใช้`

**Policy Version**:
An auditable, effective-dated version of the Effective Financial Policy. A later activated version supersedes the active version for future applicability without rewriting the rule used by an earlier Financial Event. There is no separate retirement/deactivation command.
_Avoid_: Edited-in-place policy, retire command, deactivate command

**Policy Publisher**:
An in-application capability within the SESAO Internal Audit authorization model that registers unchanged OBEC policy evidence, sets the all-17-School SESAO Narathiwat scope and effective date, and activates an approved, auditable Policy Version. Order 452/2568 establishes eligibility; the approved Authorization Matrix designates one current holder and one standby alternate. Before designation or publication, record an official SESAO Internal Audit Unit page check with its URL, retrieval timestamp, named-person result, and conflict outcome. Activation does not require a second-person approval or pre-activation review. It cannot alter the OBEC source text, invent a source revision, or mutate a School's canonical financial records.
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
A posted Remittance or Contract-Security Return linked to its State Income receipt or Contract-Security receipt. A source with a Lifecycle Child is not directly correctable because replacing it would invalidate the child's controlled source relationship.
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

**Evidence Category**:
The domain class assigned to evidence so storage, privacy, access, retention, deletion, export, and audit controls can be resolved consistently. It is not a file format or a generic attachment label.
_Avoid_: File extension, folder name, export category

**Privacy Classification**:
The handling class derived from evidence content and disclosure risk. The pilot classes are Public, Internal, Confidential, and Restricted; content can raise a category to a more restrictive class.
_Avoid_: Role, permission, retention period

**Retention Rule**:
An approved rule stating how long a category is kept, which event starts the period, which holds suspend disposition, and what deletion or preservation action follows. An open duration is not permanent legal retention.
_Avoid_: Backup schedule, archive status, guessed legal period

**Legal Hold**:
A recorded suspension of otherwise eligible evidence destruction because an investigation, audit, dispute, appeal, correction, or other approved records obligation remains active.
_Avoid_: Ordinary archive, indefinite retention without authority

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
A SESAO-led substantive examination of one School's financial-accounting controls for a defined audit period. The active SESAO Auditor operates the exact assigned Assessment end to end without mutating canonical School financial records; ESAO Reviewer access, cross-school comparison, ranking, and aggregate summaries remain excluded and denied in the initial pilot.
_Avoid_: Annual Self-Assessment, Audit Review Report, general ledger

**Audit Assessment Cycle**:
A versioned instance of a School Financial Accounting Audit for one School and audit period, with one active Auditor at a time, applicable Policy Version, Audit Checklist Version, workpapers, findings, result, report, responsible-Auditor acceptance, reassignment history, and follow-up history. The authenticated creator becomes the initial active Auditor, and ESAO Admin controls later assignment changes.
_Avoid_: Assessment item, report filter

**Audit Checklist Version**:
The effective-dated, source-cited set of audit topics, criteria, test methods, required evidence, scoring weights, and result-level rules used by an Audit Assessment Cycle. It preserves any mapping where examination topics and scoring categories differ.
_Avoid_: Mutable checklist setting, self-assessment form

**Audit Workpaper**:
A structured record of one audit test step, including the criterion, method, observation, evidence references, conclusion, and responsible active Auditor.
_Avoid_: Generic attachment, Audit Log entry

**Audit Finding**:
A documented audit conclusion or exception linked to an Audit Workpaper and its evidence, with severity, owner, due date, corrective action, response, attributable revisions, and follow-up/re-test state.
_Avoid_: Informational warning, Needs Correction status only

**Audit Score**:
A reproducible weighted result calculated from an Audit Checklist Version and the completed workpapers. It remains a snapshot of the audit and never replaces the underlying findings or evidence.
_Avoid_: Mutable grade, self-reported total

**Audit Result Level**:
A policy-defined classification of an Audit Score and/or specified critical findings for an Audit Assessment Cycle. Level names, bands, and any override rules come from the applicable version rather than being hard-coded.
_Avoid_: Universal pass/fail, color-only status

**School Financial Accounting Audit Report**:
The completed per-School report for an Audit Assessment Cycle, preserving its scope, criteria/checklist and policy revisions, workpaper conclusions, findings, score, result level, responsible-Auditor finalization/acceptance history, and corrective-action state.
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

**Prohibited Export**:
An export whose category, requester, scope, content, record state, or delivery path is not explicitly approved. It is denied even when the requester can view some underlying records.
_Avoid_: Warning-only export, role-inferred download

**Export Artifact**:
A generated file for one approved Export Category and exact authorized scope. It inherits the source classification, is integrity-recorded, and expires under its approved download-window rule while the export-attempt history remains.
_Avoid_: Permanent public URL, audit record, unrestricted evidence archive

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
