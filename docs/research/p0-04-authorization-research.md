# P0-04 Authorization Matrix And Decision Register

**Status:** blocked pending source-conflict resolution and final approval

**Research date:** 2026-08-08

**Decision update:** 2026-08-09

**Scope:** architectural authorization and segregation model only. Individual personnel names are operational configuration and are not required in this model.

## Consistency Classification

Every decision and matrix row uses the following labels:

- `APPROVED-BY-DECISION`: explicitly established by the 2026-08-09 human governance decisions.
- `CONSISTENT`: existing source material supports the decision without a contradiction.
- `SOURCE-CONFLICT`: existing source material contradicts the decision; the source is preserved and is not silently changed here.
- `OPEN`: the approved decisions and currently available source material do not establish one safe value.

An Audit Log is evidence. It is not an independent approver or reviewer.

## Source Facts And Boundaries

| Topic | Source fact | Citation | Confidence |
| --- | --- | --- | --- |
| Organization boundary | Every pilot School is an independent financial, reporting, and audit boundary. ESAO oversight and aggregate reporting do not permit silent mutation of a School's canonical financial records. | [Pilot charter](../governance/pilot-charter.md) lines 45-48; [BLUEPRINT.md](../../BLUEPRINT.md) sections 4-5 | High |
| Pilot hierarchy | All 17 pilot Schools sit under SESAO Narathiwat (`1000960001`). | [Pilot charter](../governance/pilot-charter.md) lines 9-18 and 23-48 | High |
| Registration baseline | Public registration creates a Registration Application, not membership or application access. Existing baseline text gives System Admin platform-wide authority and ESAO Admin assigned-school authority. | [BLUEPRINT.md](../../BLUEPRINT.md) section 5.1; [ADR-0003](../adr/0003-nextauth-and-approved-registration.md); [glossary](../../reseach/CONTEXT.md) `Registration Application`, `Membership Approval`, and role entries | High for the existing project baseline; exclusivity is unresolved |
| Financial source controls | The B.E. 2515 material requires authorized payment approval and evidence, assigns daily balance preparation to the finance officer, and describes independent custody verification and a School Director signature/acknowledgement. | [manual_2515.md](../../reseach/manual_2515.md) lines 173-196, 538-546, and 738-742; [P0-02 research](p0-02-procedure-baseline-research.md) lines 98-103 | Medium: local source is preserved and pilot applicability is resolved, but command-level application policy is not yet catalogued |
| Policy source and operator | OBEC is the external Governing Policy Authority and source issuer. SESAO Narathiwat receives unchanged OBEC evidence and operates the corresponding Policy Version lifecycle in SchoolBanchee. | [ADR-0006](../adr/0006-sesao-operational-policy-publication.md) lines 20-30; [glossary](../../reseach/CONTEXT.md) lines 227-229 | High |
| Post-close source language | The current blueprint and glossary describe post-close Privileged Correction with authenticated Director Approval. P0-03 and P0-06 have not yet established a separate catalogue clause for that approval. | [BLUEPRINT.md](../../BLUEPRINT.md) lines 363-370; [glossary](../../reseach/CONTEXT.md) lines 297-303; [P0-02 research](p0-02-procedure-baseline-research.md) lines 109-111 | High for current project text; approval classification remains open under the approved decision |
| P0-03/P0-06 status | No completed P0-03 Fund Flow approval pack or P0-06 effective-dated policy catalogue exists yet. The P0-02 handoff explicitly says source roles do not select the application actor/approver/reviewer matrix. | [DEVELOPMENT-CHECKLIST.md](../../DEVELOPMENT-CHECKLIST.md) lines 53 and 56; [P0-02 research](p0-02-procedure-baseline-research.md) lines 101-111 | High |

## P0-04 Authorization Matrix

The matrix below applies the approved decisions at the architectural role/capability level. A person who performs an action is still authenticated and attributable at runtime; no person's name is an architectural prerequisite.

| Command or capability | Authorized actor | Required approver | Independent verifier / reviewer | Required evidence and conditions | Prohibited combination | Decision status | Consistency status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Registration application submission | Registration Applicant | N/A | N/A | Active School Directory choice, permitted school role request, identity and acknowledgement validation; submission creates no membership or session. | Applicant cannot approve, activate, or assign the resulting membership. | `APPROVED-BY-DECISION` | `CONSISTENT` |
| Membership administration: approve, reject, suspend, remove, change School assignment, or change School-level role | ESAO Admin within the authorized assigned boundary | N/A | N/A | Authenticated command, permitted School/ESAO scope, structured reason where applicable, and Audit Log evidence. Audit evidence is not a reviewer. | ESAO Admin cannot use membership administration to grant itself privileged authority; no self-assignment or public request of privileged authority. | `APPROVED-BY-DECISION` | `SOURCE-CONFLICT`: existing ADR-0003 and BLUEPRINT also grant System Admin platform-wide membership authority; the decision does not explicitly revoke that authority. |
| Privileged ESAO/platform appointment or capability grant/revocation | Role-based authorized appointing authority; exact grant/revocation authority | `OPEN`: existing source does not identify one final appointing path | `OPEN`: accountable review requirement is not established by the approved decisions | Authenticated, attributable, scoped membership/capability change; no personnel names in the architecture model. | Never public; no self-assignment, self-approval, or use of membership administration to grant privileged authority. | `APPROVED-BY-DECISION` for role-based modeling | `SOURCE-CONFLICT` for existing named-holder requirements; see Findings 1 and 6 |
| Routine financial event creation and posting | Finance Officer in the School | N/A | Assigned daily inspector performs the separate post-posting inspection; this is not a posting approver | Resolve the effective policy; validate required evidence, amount, date, scope, and posting controls. Audit evidence remains required. | No unauthorized actor; no separate person may be required by this decision as a routine second approver. | `APPROVED-BY-DECISION` | `CONSISTENT` for no second-person approval; the source daily-inspection control is preserved. Existing optional delegated School Admin posting is recorded as a scope conflict in Finding 5. |
| Payment preparation and posting | Finance Officer prepares/posts | School Director, or a valid capability-specific delegated payment approver | Assigned daily inspector performs the separate post-posting inspection; this is not the Director Approval | Authenticated Director Approval or valid delegation, required payment evidence, and effective policy resolution. | The preparer cannot approve the same payment. | `APPROVED-BY-DECISION` | `CONSISTENT`: payment approval and daily inspection remain distinct controls. |
| State-Income Remittance execution/posting | Finance Officer | N/A | Assigned daily inspector performs the separate inspection for the operating-day record; this is not a posting approver | Link to the source State Income receipt, due-date control, remittance evidence, amount/link validation, and Audit Log. | No invented second-person approval; source obligation cannot be detached or over-remitted. | `APPROVED-BY-DECISION` | `CONSISTENT`: current sources establish remittance linkage, evidence, and daily inspection, not a mandatory second approver. |
| Official Advance issuance | Finance Officer prepares/posts | School Director, or a valid capability-specific delegated advance approver | Assigned daily inspector performs the separate inspection for the cash movement; this is not the advance approver | Authenticated approval/delegation, eligible purpose/fund, advance agreement, evidence, due-date control, and prior-unsettled checks. | The preparer cannot approve the same advance. | `APPROVED-BY-DECISION` | `CONSISTENT`: Director approval, independent SoD, and daily inspection remain distinct controls. |
| Receipt Book issuance | Finance Officer | N/A (no second-person approval under the approved decision) | N/A | Custody tracking, serial-range controls, custodian/handover evidence, fiscal-year controls, void/gap retention, and Audit Log. | No untracked issue, overlapping range, reuse, deletion, or self-created privileged authority. | `APPROVED-BY-DECISION` | `SOURCE-CONFLICT`: BLUEPRINT requires recording issuance "approval"; whether that field is a second-person authorization or custody evidence is unresolved. |
| Cash/custody operation | Finance Officer performs the operation | N/A prior approval | Independent verifier; the performer cannot be the sole verifier | Count/custody evidence, money-position records, required handover, discrepancy handling, and Audit Log. | Performer cannot be the sole verifier. Staff shortage blocks the operation. | `APPROVED-BY-DECISION` | `CONSISTENT` with source custody verification, subject to the Receipt Book/source distinctions above. |
| Daily Balance preparation | Finance Officer prepares | `OPEN`: source material records a School Director signature/acknowledgement; the approved decision does not classify it as an approval | Independent verifier; the preparer cannot be the sole verifier | Daily balance by money position, source records/evidence, discrepancy state, and Audit Log. | Preparer cannot be the sole verifier; staff shortage blocks the operation. | `APPROVED-BY-DECISION` | `OPEN`: resolve whether the Director signature is approval, acknowledgement, or evidence only. |
| Monthly Reconciliation preparation | Finance Officer prepares | `OPEN`: BLUEPRINT describes School Director review/acceptance; the approved decision establishes independent verification but does not classify that existing review as approval | Independent verifier; the preparer cannot be the sole verifier; exact additional ESAO review is `OPEN` | Reconciliation version, bank comparison, outstanding obligations, evidence, acceptance event, and stale propagation. | Preparer cannot be the sole verifier. Staff shortage blocks the operation. | `APPROVED-BY-DECISION` | `SOURCE-CONFLICT/OPEN`: preserve the existing Director/ESAO review language until its relationship to independent verification is decided. |
| Monthly Close | School Director, or a valid capability-specific delegated close authority | N/A (the authorized closer performs the close after readiness is met) | Independently verified reconciliation required before close | Close readiness, independently verified reconciliation, unresolved exceptions, report package, and Audit Log. | The Finance Officer who prepared the reconciliation cannot close the period; no self-approval or staff-shortage bypass. | `APPROVED-BY-DECISION` | `OPEN`: existing blueprint permits ESAO review/override "under policy," but no final reviewer scope is catalogued. |
| Post-close correction / Adjustment Entry | Authorized School user proposes a linked correction | `OPEN`: current blueprint and glossary require authenticated Director Approval, while the approved decision says not to invent the correction approval if policy does not establish it | `OPEN`: no independent reviewer requirement is established; Audit Log is evidence only | Original closed record remains immutable; correction is linked, reasoned, evidenced, and auditable, with dependency/stale propagation. | Never update, delete, rewrite, replace, or silently re-parent the original closed transaction. | `APPROVED-BY-DECISION` for the correction mechanism | `SOURCE-CONFLICT`: current project text requires Director Approval; P0-03/P0-06 have not independently catalogued its authority. |
| Policy Version activation | SESAO Auditor holding the Policy Publisher capability | N/A | N/A before activation; later authorized audit review may inspect the Audit Log | Unchanged OBEC source evidence, scope, effective date, non-overlap validation, authenticated actor, outcome, and Audit Log. | Cannot alter OBEC source text, invent revisions, bypass evidence, mutate School financial records, or use a generic independently assignable Policy Publisher role. | `APPROVED-BY-DECISION` | `CONSISTENT` with ADR-0006. |
| Policy Version retirement/deactivation | SESAO Auditor holding the Policy Publisher capability | N/A | N/A before transition; later authorized audit review may inspect the Audit Log | Same authenticated, attributable, evidence-backed, effective-dated, scoped, and auditable lifecycle controls as activation. | No source mutation, history rewrite, School-record mutation, delegation, or second-person approval requirement. | `APPROVED-BY-DECISION` | `OPEN`: current ADR names activation/supersession but does not define the exact retirement/deactivation state transition. |
| Inspection / verification assignment and performance | Compatible authorized role in the same School/scope; School Director may delegate this capability | N/A | The assigned independent verifier performs the verification; no performer self-verification | Capability-specific delegation, same-scope membership, evidence and acceptance event, and Audit Log. | No re-delegation, role transfer, self-verification, or staff-shortage exception. | `APPROVED-BY-DECISION` | `CONSISTENT` with source daily-inspection and custody controls; exact ESAO oversight scope remains open. |
| System support and audit operations | System Admin for platform support and diagnostics | N/A | N/A | Authenticated operational action and separate system diagnostics; no School financial command. | System Admin performs no School financial entry, approval, inspection, reconciliation, close, Policy Publisher, or delegated action. | `APPROVED-BY-DECISION` | `CONSISTENT` |
| ESAO oversight/report review | Scoped ESAO reviewer capability | `OPEN`: report policy does not establish an approval path | `OPEN`: exact reviewer role, scope, and required review are not established | Read/report-only scope, evidence references, and no canonical-record mutation. | Oversight cannot mutate a School's canonical records; Audit Log is not a substitute for an independent reviewer. | `OPEN` | `OPEN` |

### Delegation rules

School Director may delegate only these capabilities through this mechanism: payment approval, advance approval, monthly close, and inspection/verification. The delegate must have a compatible existing organizational role and belong to the same School/scope. Delegation is capability-specific, does not transfer the underlying role, cannot bypass segregation of duties or permit self-approval, remains active until explicitly revoked, becomes immediately invalid when the delegator loses the underlying authority, and cannot be re-delegated.

Policy Publisher, ESAO Admin, System Admin, and membership administration cannot be delegated through this mechanism. There is no automatic expiry. If a required authorized or independent role is unavailable, the operation is blocked. These rules do not resolve the existing `Temporary Director Approval` definition or the existing optional delegated School Admin routine-posting text; both are reported as source conflicts below.

## Decision Register

### Decision 1 - Privileged appointments

- **Approved decision:** Use role-based appointments now. Named personnel are operational configuration and are not required in the architectural authorization model. Do not invent names.
- **Applied:** Matrix rows use roles and capabilities. Runtime authentication and Audit Log attribution still identify the acting account.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `SOURCE-CONFLICT` with existing named-holder/alternate language in ADR-0006, the pilot charter, and the glossary. That language is preserved pending owner qualification or supersession.

### Decision 2 - Membership administration

- **Approved decision:** ESAO Admin is authoritative for approve, reject, suspend, remove, change School assignment, and change School-level role. No mandatory second-person approval or review is required. Audit logging is evidence, not a reviewer. ESAO Admin cannot use membership administration to grant itself privileged authority.
- **Applied:** The membership row has ESAO Admin as actor and `N/A` for approver and reviewer, with the self-grant prohibition.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `SOURCE-CONFLICT`: existing ADR-0003 and BLUEPRINT grant System Admin platform-wide membership authority. The decision does not explicitly revoke or qualify that source authority; no silent removal was made.

### Decision 3 - Policy Publisher

- **Approved decision:** Policy Publisher is a capability held by the SESAO Auditor role, not an independently assignable generic role. A named operational appointment may be configured later.
- **Applied:** Activation and retirement/deactivation rows name `SESAO Auditor holding the Policy Publisher capability`; no generic role or personnel name is introduced.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `CONSISTENT` with ADR-0006 and the glossary's capability distinction.

### Decision 4 - Financial authorization

- **Approved decision:** Routine posting, remittance, and Receipt Book issuance require no second-person approval. Payment and advance issuance require School Director approval, with no self-approval. Cash/custody, daily balance, and monthly reconciliation require independent verification and prohibit the preparer/performer from being the sole verifier. Monthly close is performed by the School Director or valid delegated close authority only after independently verified reconciliation, and the reconciliation preparer cannot close. Closed-period originals are immutable; corrections use a linked auditable mechanism.
- **Applied:** Each financial command is a separate matrix row with explicit approver/reviewer values, evidence conditions, and prohibited combinations. Post-close correction approval remains `OPEN` as required by the decision where the source basis is unsettled.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `SOURCE-CONFLICT` for Receipt Book issuance and post-close approval; `OPEN` for the meaning of the daily-balance Director signature; otherwise `CONSISTENT` with the available B.E. 2515/blueprint controls.

### Decision 5 - Policy Version retirement

- **Approved decision:** Policy Publisher may retire/deactivate a Policy Version under the same authorization model as activation. No second-person approval is required. All transitions remain authenticated, attributable, evidence-backed, and auditable.
- **Applied:** Retirement/deactivation has the same SESAO Auditor capability, `N/A` approver/reviewer, and lifecycle evidence requirements as activation.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `OPEN` only for the exact lifecycle state/transition name; current ADR establishes activation/supersession but not a retirement/deactivation state definition.

### Decision 6 - Delegation

- **Approved decision:** School Director may delegate payment approval, advance approval, monthly close, and inspection/verification, subject to compatible role, same scope, capability-specific authority, no role transfer, no SoD bypass, no self-approval, explicit revocation, immediate invalidation on loss of delegator authority, no re-delegation, and no delegation of Policy Publisher, ESAO Admin, System Admin, or membership administration. No automatic expiry.
- **Applied:** The delegation rules are stated verbatim at capability level and referenced by the affected matrix rows.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `SOURCE-CONFLICT` where existing blueprint text permits optional delegated School Admin routine posting; that text is preserved pending owner interpretation of the listed capability scope.

### Decision 7 - Staff shortage

- **Approved decision:** There is no staff-shortage exception. If a required authorized or independent role is unavailable, the operation is blocked. SoD and verification requirements are not relaxed automatically.
- **Applied:** The block rule appears in delegation rules and all affected financial rows.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `SOURCE-CONFLICT` with the glossary's `Temporary Director Approval` definition, which permits temporary approval when no active Director exists. It is not silently removed.

### Decision 8 - Membership review

- **Approved decision:** No mandatory second-person review is required for ESAO Admin membership administration.
- **Applied:** Membership administration has reviewer `N/A`; Audit Log evidence is explicitly not a reviewer.
- **Decision classification:** `APPROVED-BY-DECISION`.
- **Consistency classification:** `SOURCE-CONFLICT/OPEN` with the existing System Admin authority and any unspecified ESAO reviewer expectations; no reviewer requirement was invented.

## Source-Consistency Findings

1. **Role-based appointments versus named-holder requirements - `SOURCE-CONFLICT`.** Decision 1 removes names from the architecture model, while ADR-0006, the pilot charter, and the glossary still require named authenticated holders/alternates. The runtime need for an authenticated actor is compatible; the architectural completion requirement is not. Owner qualification or supersession is required.
2. **ESAO Admin versus System Admin membership authority - `SOURCE-CONFLICT/OPEN`.** Decision 2 names ESAO Admin as authoritative, while ADR-0003 and BLUEPRINT grant System Admin platform-wide membership authority. The decision does not explicitly revoke System Admin authority. This artifact records the conflict without choosing an exclusivity interpretation.
3. **Staff shortage - `SOURCE-CONFLICT`.** Decision 7 requires blocking, while `reseach/CONTEXT.md` defines `Temporary Director Approval` for no active Director. The glossary/source must be qualified or superseded by the decision owner.
4. **Receipt Book issuance approval - `SOURCE-CONFLICT`.** Decision 4 says no second-person approval, while BLUEPRINT lines 241-245 require issuance approval to be recorded. Custody, serial, handover, fiscal-year, gap, and audit controls remain required; the meaning of the existing approval field is unresolved.
5. **Routine posting delegation - `SOURCE-CONFLICT/OPEN`.** BLUEPRINT line 134 permits optional delegated School Admin routine posting; Decision 6 lists only four delegable capabilities. The existing text is preserved pending an explicit scope interpretation.
6. **Post-close correction approval - `SOURCE-CONFLICT/OPEN`.** BLUEPRINT lines 363-370 and the glossary lines 297-303 require authenticated Director Approval, while the approved decision says not to invent a correction approval where policy does not establish it. P0-03/P0-06 are not complete catalogues. The correction mechanism is approved; the approval requirement remains open.

## Remaining Open Decisions

- Qualify or supersede named-holder/alternate wording in ADR-0006, the charter, and the glossary for the architectural model.
- Resolve whether System Admin retains platform-wide membership administration alongside ESAO Admin's authoritative role.
- Resolve the `Temporary Director Approval` source conflict against the no-staff-shortage-exception decision.
- Resolve whether Receipt Book "approval" is a second-person authorization or custody evidence.
- Decide whether the School Director daily-balance signature is an approval, acknowledgement, or evidence only.
- Resolve the exact post-close correction approval/reviewer rule from an authoritative policy catalogue or a new human decision; do not invent it.
- Define Policy Version retirement/deactivation's exact state transition and the ESAO reviewer role/scope.
- Clarify the scope of existing optional delegated routine posting relative to Decision 6's listed capabilities.

## P0-04 Completion Status

P0-04 is **not done**. Decisions 1-8 are incorporated into the matrix and register, but the source conflicts and open interpretations above prevent final approval. `BLK-003` must remain open in narrowed form until those conflicts are resolved and the SESAO Product Owner/accountable reviewer approves the final matrix.

**Ready for final approval:** No.

**Can BLK-003 be closed:** No. It can be narrowed to the exact source conflicts and open decisions listed above; it must not be closed by this documentation pass.
