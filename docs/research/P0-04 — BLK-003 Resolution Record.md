# P0-04 — BLK-003 Resolution Record

**Status:** Resolved at decision level; P0-04 remains **BLOCKED**  
**Blocker:** `BLK-003`  
**Affected tasks:** `P0-04`, `P0-06`, `P0-10`  
**Decision owner:** SESAO Narathiwat Product Owner / accountable reviewer  
**Decision date:** 2026-08-09  
**Purpose:** Record the human decisions resolving the authorization conflicts identified during P0-04 reconciliation.

---

## 1. Scope

`BLK-003` was raised because the P0-04 authorization research contained conflicts and undefined authorization values affecting:

- role and privileged-capability appointments;
- registration and membership authority;
- School and ESAO authorization boundaries;
- delegation;
- staff-shortage handling;
- Receipt Book control;
- post-close correction;
- daily-balance approval;
- Policy Version lifecycle;
- ESAO review authority.

The decisions in this record resolve the **policy interpretation questions** presented to the Product Owner.

They do **not** by themselves complete P0-04.

P0-04 remains blocked until the resulting Authorization Matrix contains explicit actor, scope, approver, reviewer, authentication, delegation, segregation-of-duties, and audit requirements for every applicable privileged command and membership action, and all required appointment/scope evidence has been supplied.

No personnel names are invented or assigned by this record.

---

# 2. Decision Principles

The following principles apply to all decisions in this record:

1. Authorization architecture remains role/capability based.
2. Runtime actions remain attributable to an authenticated principal.
3. Personnel names are operational appointment evidence and must not be invented in architectural documentation.
4. A role or capability must not receive authority merely because a source uses a broad administrative term.
5. Organizational scope must be enforced independently of platform administration.
6. No actor may approve their own privileged or financially sensitive action.
7. Delegation does not automatically transfer unrelated approval authority.
8. Historical regulatory/source material is retained as evidence and is not silently rewritten.
9. Where a required authorization value is genuinely undefined, it remains explicitly `OPEN` rather than being inferred.
10. Policy Publisher activation remains attributable and auditable and does not require second-person approval under ADR-0006.

---

# 3. Resolved Decisions

## Decision 1 — Named Policy Publisher Holder and Alternate

### Decision

**Authoritative organizational assignment evidence establishes Policy Publisher eligibility.**

The authorization architecture remains role/capability based:

```text
SESAO Internal Audit position/assignment
    |
    +-- Policy Publisher capability
```

Order 452/2568 establishes the organizational eligibility evidence for:

- `นางบังอร วันริโก`, `นักวิชาการตรวจสอบภายในชำนาญการพิเศษ`, `ผู้อำนวยการหน่วยตรวจสอบภายใน`;
- `นายอานุงรุสลัน ดาโวะ`, `นักวิชาการตรวจสอบภายในชำนาญการ`, expressly assigned Internal Audit duties.

The approved Authorization Matrix is the designation record for exactly one current Policy Publisher and one standby alternate:

- Current holder: `นางบังอร วันริโก`;
- Standby alternate: `นายอานุงรุสลัน ดาโวะ`.

A separate Policy Publisher Appointment Memorandum and separate SESAO Auditor appointment document are not required. Order 452/2568 establishes eligibility, not Policy Publisher designation or the application publication scope. Current-status verification is required before designation or privileged publication. The application publication scope must be established separately from the order's organizational scope.

The evidence and designation record must be attributable and auditable.

Personnel names must not be invented by the system design or by Codex.

### Authorization effect

The Policy Publisher capability remains a role/capability definition in the architecture.

The named holder and alternate are recorded in the approved Authorization Matrix associated with P0-04.

The Policy Publisher may activate an evidence-backed Policy Version without second-person approval or pre-activation review, consistent with ADR-0006.

### Closure requirement

**RESOLVED — Order 452/2568, the approved Matrix designation, the approved all-17-School publication scope, and the approved website current-status verification rule are required evidence.**

---

## Decision 2 — System Admin versus ESAO Admin Membership Authority

### Decision

**System Admin and ESAO Admin retain distinct authority boundaries.**

### System Admin

System Admin is authoritative for platform-level:

- account lifecycle;
- registration lifecycle;
- platform support and administration.

System Admin does **not** thereby acquire authority to bypass organizational membership boundaries.

### ESAO Admin

ESAO Admin is authoritative for organization-level membership administration, including:

- membership approval;
- membership rejection;
- membership suspension;
- membership removal;
- School assignment;
- School-level role assignment.

ESAO Admin operates only within its permitted organizational scope.

### Prohibited escalation

Platform administration must not be used to:

- self-grant organizational privileges;
- self-assign privileged roles;
- bypass School/ESAO scope;
- grant Policy Publisher capability;
- grant other prohibited privileged capabilities to the acting administrator.

### Authorization effect

The Authorization Matrix must distinguish:

```text
Platform lifecycle
    -> System Admin

Organizational membership lifecycle
    -> ESAO Admin
```

The matrix must not treat System Admin's platform authority as unrestricted financial or organizational authority.

---

## Decision 3 — Temporary Director Approval

### Decision

**Temporary Director Approval remains a permitted alternate authorization mechanism.**

When no authenticated School Director is active, a formally controlled Temporary Director Approval path may be used for applicable Director-required operations.

It is not a general or automatic staff-shortage bypass.

### Approved controls

- An authenticated SESAO Product Owner/accountable reviewer issues, activates, or revokes the approval under strong authentication. SESAO Auditor has no authority under this command.
- The approval is limited to one named School and only the specific Director-required commands listed in its evidence record.
- It has fixed start and expiry timestamps, no automatic renewal, and is immediately revoked when a permanent School Director is appointed.
- No separate independent reviewer is required.
- The evidence records the authenticated issuer, School, Director-unavailability reason, commands, timestamps, decision, and Audit Log outcome.
- The issuer cannot approve their own approval, be its subject, use it for their own financial action, delegate or re-delegate it, or bypass School segregation of duties.

### Current status

**RESOLVED — approved by the Product Owner on 2026-08-10.**

### Consequence

The previous blanket interpretation that every Director absence automatically blocks every Director-required operation is superseded by this controlled Temporary Director Approval decision.

---

## Decision 4 — Receipt Book "Approval" Semantics

### Decision

**Receipt Book "approval" is custody/issuance evidence, not mandatory second-person authorization.**

A Finance Officer may issue a Receipt Book without a mandatory second-person approval gate.

The Receipt Book control must nevertheless preserve:

- book number;
- serial range;
- custodian;
- issuance/handover evidence;
- fiscal year;
- used/voided/unused status;
- void reason;
- serial-gap/duplicate detection;
- daily reconciliation;
- audit evidence.

The word `approval` in the relevant record is not, by itself, an authorization requirement.

### Authorization effect

```text
Actor: Finance Officer
Approver: N/A
Reviewer: N/A
```

unless another independently established control explicitly requires review.

The Finance Officer cannot use this interpretation to bypass unrelated financial approval requirements.

---

## Decision 5 — Routine Posting Delegation

### Decision

**Routine posting is within the architectural delegation concept, but no delegation is enabled in the initial pilot.**

Any future Matrix amendment may enable routine-posting delegation only with these safeguards:

- compatible role;
- same organizational/School scope;
- explicit capability scope;
- no self-approval;
- no re-delegation;
- explicit revocation;
- invalidation when the delegator loses the underlying authority.

Until such an amendment is approved, delegation creation, revocation, and use are denied. A future routine-posting delegation would not grant approval authority.

### Authorization effect

No delegate may perform routine posting in the initial pilot. If later enabled, an eligible delegate could perform only the explicitly delegated routine-posting capability.

The delegate does not thereby acquire:

- payment approval authority;
- advance approval authority;
- membership authority;
- Policy Publisher authority;
- ESAO Admin authority;
- System Admin authority.

The final Authorization Matrix must distinguish posting authority from approval authority.

---

## Decision 6 — Post-Close Privileged Correction

### Decision

**Authenticated School Director Approval is mandatory for every Privileged Correction before execution.**

The post-close correction flow is:

```text
Closed financial record
        |
        v
Privileged Correction proposal
        |
        v
Authenticated School Director Approval
        |
        v
Correction execution
        |
        v
Immutable audit evidence
```

The proposer/preparer cannot approve their own correction.

System Admin cannot perform the financial correction merely by virtue of platform administration.

### Reviewer

The existence and identity/capability of an independent reviewer remains unresolved.

Therefore:

**Reviewer = OPEN**

unless authoritative evidence establishes the reviewer.

The unresolved reviewer must not be silently inferred from the existing generic ESAO review language.

---

## Decision 7 — Daily Balance Director Approval

### Decision

**The School Director signature is formal approval.**

The Daily Balance control therefore requires the following ordered process:

```text
Finance Officer
    |
    | prepare
    v
Daily Balance Report
    |
    | independent verification
    v
Independent Verifier
    |
    | Director approval/signature
    v
School Director
```

The Finance Officer cannot:

- approve their own report;
- serve as the sole independent verifier.

The Director approval/signature is distinct from preparation and independent verification.

### Independent verifier

The existence of an independent verifier is required.

The exact verifier capability/assignment remains:

**OPEN**

until the authorization source defines it.

The existing daily-inspection workflow must not be assumed to make the inspector the verifier without an explicit capability decision.

---

## Decision 8 — Policy Version Retirement/Deactivation

### Decision

**There is no separate Policy Version retirement/deactivation command.**

A Policy Version becomes inactive through supersession by a newly activated Policy Version.

The lifecycle therefore remains conceptually:

```text
Draft
  |
  v
Active V1
  |
  | activate V2 / supersede V1
  v
Superseded V1       Active V2
```

The system must not introduce:

- `RetirePolicyVersion`;
- `DeactivatePolicyVersion`;

unless a future approved policy decision explicitly establishes such a command.

### Historical preservation

Historical Policy Version resolution must remain immutable.

Previously posted financial events must retain their resolved Policy Version and must not be re-resolved merely because a newer version becomes active.

This is consistent with the existing policy-resolution and traceability rules.

---

## Decision 9 — ESAO Reviewer Scope

### Decision

**ESAO Reviewer is a read/review/compare/report capability, not a financial approval authority.**

The ESAO Reviewer may:

- review permitted School financial reports;
- compare risk across permitted Schools;
- aggregate permitted reporting information;
- record review/reporting evidence where the workflow supports it.

The ESAO Reviewer may not:

- modify School canonical financial records;
- approve financial transactions;
- administer membership;
- change School assignments;
- change School roles;
- execute post-close corrections;
- publish or activate Policy Versions;
- use generic review authority as an override capability.

### Scope

The repository establishes an ESAO no-mutation oversight boundary, but the exact:

- assigned-School scope; and
- permitted aggregate-reporting scope

remain:

**OPEN**

until explicitly defined.

The terms `accept`, `reject`, `return`, and `override` must not automatically be treated as ESAO Reviewer powers unless an authoritative command-level rule establishes them.

---

## Decision 10 — Single Active End-to-End SESAO Auditor

### Decision

Any number of named authenticated SESAO Auditor accounts may be configured. Each Audit Assessment has exactly one active Auditor at a time, and that active Auditor owns the complete workflow: create the Assessment, perform it, modify findings, finalize it, and approve/accept its result as the responsible audit operator.

Creation atomically establishes the authenticated creator as the initial active Auditor. After creation, ESAO Admin alone assigns, atomically reassigns, or revokes the active assignment and gains no Assessment content or review authority from doing so. Completion ends executable Auditor authority for that Assessment.

No additional Auditor participant, verification, approval, review, or specialized Auditor role is required. The active Auditor is limited to the exact Assessment, School, audit period, and approved checklist/policy versions and cannot mutate canonical School financial records.

Initial Auditor accounts use the sealed application bootstrap with authenticated identity, person name, role, and organizational scope. Bootstrap requires no appointment-document upload, evidence hash, external verification, or second-person in-application approval and does not constitute an external governmental appointment.

### Authorization effect

- `AUTH-25`: ESAO Admin assignment/reassignment/revocation.
- `AUTH-26`: Auditor creation with atomic initial assignment.
- `AUTH-27`: active-Auditor performance.
- `AUTH-31`: active-Auditor finding modification.
- `AUTH-32`: active-Auditor finalization.
- `AUTH-33`: same active Auditor approves/accepts the result and completes the Assessment.
- SESAO Auditor is removed from `AUTH-14` Temporary Director Approval issuance.

### Status

**RESOLVED — approved by the Product Owner on 2026-08-10.**

---

# 4. Superseded Interpretations

The following interpretations are superseded for the current application authorization model:

| Previous interpretation | Current decision |
| --- | --- |
| Named Policy Publisher is optional configuration for P0-04 | Order 452/2568 organizational evidence plus approved Matrix designation are required for Policy Publisher eligibility/designation |
| System Admin has unrestricted organizational membership authority | System Admin is platform-scoped; ESAO Admin owns organizational membership |
| Director absence always blocks Director-required operations | Controlled Temporary Director Approval remains available |
| Receipt Book `approval` implies second-person authorization | Approval is custody/issuance evidence |
| Routine posting can never be delegated | It remains a future delegation concept, but no delegation grant or use is enabled in the initial pilot |
| Post-close Director approval is unresolved | Director approval is mandatory |
| Director daily signature is merely acknowledgement/evidence | Director signature is formal approval |
| Policy Version can have a separate retirement/deactivation command | Supersession is the only inactive transition |
| ESAO Reviewer may have generic acceptance/return/override authority | ESAO Reviewer is review/compare/report only |
| Audit Assessment requires distinct working and finalizing Auditors | One active Auditor operates the Assessment end to end |
| SESAO Auditor may administer Assessment assignments or Temporary Director Approval | ESAO Admin administers Assessment assignments; SESAO Auditor has only the five approved Assessment actions |

These supersessions apply to the **current application authorization model**.

Historical manuals, dated research notes, previous session notes, and earlier architectural statements remain preserved as historical evidence where required.

---

# 5. Items Remaining Open After BLK-003

The nine human decisions are resolved, but the following authorization values still prevent P0-04 closure.

## 5. Current Matrix Decisions

The Product Owner approved the following final-Matrix inputs on 2026-08-10:

- Order 452/2568 eligibility is validated before Policy Publisher designation/publication through the official SESAO Narathiwat Internal Audit Unit page. Record the URL, retrieval timestamp, named-person result, and conflict outcome.
- Policy Publisher publication scope is all 17 Schools affiliated with SESAO Narathiwat, sourced separately from the official SESAO organizational information page, not Order 452/2568.
- No generic ESAO or platform override command exists. Every unlisted privileged command is denied.
- Temporary Director Approval uses the approved controls in Decision 3, but recipient eligibility and required subject evidence remain `OPEN`; issuance and use fail closed.
- Privileged Correction requires School Director approval, with no separate independent pre-execution reviewer; the proposer/preparer cannot self-approve.
- The Daily Balance Verifier, SESAO Auditor assessment, membership, School Director, and ESAO Reviewer limits are those explicitly enumerated by the live Authorization Matrix.
- The SESAO Auditor workflow uses one active Auditor per Assessment, atomic creator assignment, ESAO Admin-controlled later assignment changes, and the five approved end-to-end Auditor commands without an additional Auditor review step.
- The Product Owner approved the final Authorization Matrix, subject to durable recording of this decision and operational evidence.

Temporary Director Approval recipient eligibility and subject evidence remain `OPEN`. Every other unsupported or unlisted operation is explicitly denied, and every command fails closed when its command-specific evidence is missing or invalid.

---

# 6. P0-04 Closure Rule

`BLK-003` is resolved at the human-decision level.

It does **not** mean P0-04 is complete.

P0-04 may be marked `[DONE]` only when:

1. every privileged command has an approved actor;
2. every privileged command has an explicit scope;
3. every required approval has an approved approver;
4. every required independent review has an approved reviewer;
5. prohibited combinations are explicit;
6. authentication/strong-auth requirements are explicit where applicable;
7. delegation rules are explicit;
8. delegation scope and invalidation rules are explicit;
9. membership lifecycle authority is explicit;
10. privileged capability grant/revocation authority is explicit;
11. required named appointment or authoritative organizational evidence applicable to each command has been recorded;
12. no unresolved conflict remains that can alter authorization behavior;
13. the final Authorization Matrix has received the required human approval/sign-off.

Until these conditions are met:

**P0-04 = BLOCKED**

---

# 7. Evidence and Source Handling

The following source classes must be preserved as historical evidence where they document earlier research or source language:

- `reseach/manual_2515.md`
- `reseach/manual_2544.md`
- Thai duplicate/manual copies
- `reseach/audit-operation-manual.md`
- prior P0 session notes
- ADRs containing historical decisions that have subsequently been superseded.

Historical source text must not be silently rewritten merely to make it agree with this application authorization decision.

Where a live architectural document conflicts with this approved decision, it should be reconciled explicitly and, where appropriate, marked as superseded by this record.

The B.E. 2515 material remains the selected baseline for the current 17-School population, while OBEC remains the governing policy authority and SESAO operates as the in-application Policy Publisher.

---

# 8. Relationship to Existing Authorization Research

The existing P0-04 research describes its proposed authorization matrix as an inference requiring Product Owner/accountable-review approval and named appointments.

This resolution record supplies the Product Owner decisions needed to reconcile the identified conflicts.

The final Authorization Matrix must now be rebuilt from these decisions rather than treating the earlier proposed matrix as already approved.

The matrix must retain the existing principle that Policy Publisher activation requires no second-person approval or pre-activation review while remaining attributable and auditable.

---

# 9. Required Next Action

The next P0-04 activity is **Phase 2 reconciliation**.

Codex should:

1. claim P0-04 according to the repository Active Work process;
2. record this resolution as the authoritative BLK-003 decision record;
3. reconcile live governance/design documents against the nine decisions;
4. preserve historical source material;
5. retain the approved operational evidence for each privileged use;
6. maintain the P0-04 Authorization Matrix as the implementation source;
7. validate that no stale live statement contradicts these decisions;
8. keep P0-04 marked `BLOCKED`;
9. make no application/RBAC implementation changes until P0-04 is approved.

---

# 10. Final Decision Summary

| ID | Decision | Status |
| --- | --- | --- |
| BLK-003-01 | Policy Publisher eligibility from Order 452/2568 organizational evidence; approved Matrix designation for one current holder and one standby alternate | **RESOLVED** |
| BLK-003-02 | System Admin platform lifecycle; ESAO Admin organizational membership | **RESOLVED** |
| BLK-003-03 | Temporary Director Approval retained as controlled alternate | **PARTIALLY RESOLVED — RECIPIENT ELIGIBILITY/EVIDENCE OPEN** |
| BLK-003-04 | Receipt Book approval = custody/issuance evidence | **RESOLVED** |
| BLK-003-05 | Routine posting included in existing delegation | **RESOLVED** |
| BLK-003-06 | School Director approval mandatory for Privileged Correction | **RESOLVED** |
| BLK-003-07 | School Director signature = formal Daily Balance approval | **RESOLVED** |
| BLK-003-08 | Supersession only; no Policy Version retirement command | **RESOLVED** |
| BLK-003-09 | ESAO Reviewer = review/compare/report only | **RESOLVED** |
| BLK-003-10 | Single active end-to-end SESAO Auditor; ESAO Admin controls later assignment changes | **RESOLVED** |

### Overall BLK-003 status

**RESOLVED — DECISION LEVEL**

### Overall P0-04 status

**BLOCKED — AUTHORIZATION MATRIX AND REQUIRED EVIDENCE/SCOPE STILL REQUIRED**

### No implementation authorization code should be written from this record alone.

The final implementation authorization model must derive from the approved P0-04 Authorization Matrix after the required operational evidence has been retained and P0-04 completion is explicitly authorized.
