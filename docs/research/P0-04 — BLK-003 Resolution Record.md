# P0-04 — BLK-003 Resolution Record

**Status:** Historical `BLK-003` resolution (including the former School Director-only model) is preserved; Product Owner Decision 12 supersedes the live former model effective 2026-08-15 and exposes separate `BLK-011` appointment-evidence work
**Blocker:** `BLK-003`  
**Affected tasks:** `P0-04`, `P0-06`, `P0-10`  
**Historical decision owner:** SESAO Narathiwat Product Owner / accountable reviewer
**Decision date:** 2026-08-09  
**Latest superseding decision:** 2026-08-10
**Current amendment authority:** Private Business / Product Owner, Product Owner Decision 12, 2026-08-15
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

## Decision 3 — Temporary Director Approval (Superseded)

**Historical status:** Superseded on 2026-08-10 by Decision 11. The text below is retained as decision history and is not part of the live authorization model.

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

### Former status

**SUPERSEDED — the initial pilot no longer includes this mechanism.**

The former decision approved an alternate mechanism but did not establish recipient eligibility or subject evidence. Decision 11 removes the mechanism from the initial pilot, so those former `OPEN` values are no longer required.

### Consequence

This former consequence is superseded. Under Decision 11, every Director-required command is denied when its School has no active School Director.

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
- SESAO Auditor has no School Director authority and cannot execute `AUTH-14` or `AUTH-15`.

### Status

**RESOLVED — approved by the Product Owner on 2026-08-10.**

---

## Decision 11 — School Director-Only Initial Pilot (Historical/Superseded)

### Decision

The initial SESAO Narathiwat pilot has one School Director authority model. Each School has zero or one active School Director. ESAO Admin assigns, replaces, or revokes that application authorization state under `AUTH-05`; the assignment does not itself create an external governmental appointment.

When a School has no active School Director, every Director-required command is denied. ESAO Admin, System Admin, SESAO Auditor, Policy Publisher, Finance Officer, and every other role are prohibited from inheriting or substituting for School Director authority.

Temporary Director, Acting Director, Temporary Director Approval, temporary subject, substitute Director, and automatic fallback authority are not included in the initial pilot. `AUTH-14` and `AUTH-15` remain stable Matrix IDs but have no actor, recipient, grant/revoke authority, or subject evidence and are always denied.

### Authorization effect

- `AUTH-05` is the only command that establishes or changes active School Director authority.
- `AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`, `AUTH-19`, and `AUTH-21` require an active School Director and have no fallback actor.
- `AUTH-14` and `AUTH-15` are `DEFERRED-AND-DENIED` in the initial pilot.
- Conditions 10 and 11 are satisfied because no Temporary Director grant/revoke capability or subject evidence is required for an explicitly excluded capability.

### Status

**HISTORICAL/SUPERSEDED EFFECTIVE 2026-08-15 - approved by the then-recorded Product Owner on 2026-08-10. Decision 12 supersedes the live no-substitute interpretation without changing the active-School-Director invariant.**

---

## Decision 12 — Substitute School Director Authority

**Status:** **HISTORICAL/SUPERSEDED EFFECTIVE 2026-08-16**. Approved by Private Business / Product Owner effective 2026-08-15; preserved verbatim as the predecessor to the BLK-011 hybrid amendment below.

### Decision

Each School continues to have zero or one active School Director. Acting and Temporary Substitute Director Authority are not additional active Directors, generic delegation, membership, or role transfer. They are named, separately auditable authority records managed only by ESAO Admin under `AUTH-14`.

Effective Director Authority resolves for the exact School, command, and time in this deterministic order:

1. a valid active School Director when present and able;
2. otherwise one valid Acting Substitute Director Authority;
3. otherwise one valid Temporary Substitute Director Authority;
4. otherwise deny.

When the active Director resumes, Acting authority immediately ceases to be effective. Active/Acting/Temporary conflict, same-tier duplicate or overlap, invalid status or scope, expiry, stale/incomplete/ambiguous evidence, or any result with more than one effective holder fails closed. The invariants are: active Directors `<= 1`, effective Acting holders `<= 1`, effective Temporary holders `<= 1`, and effective Director Authority holders for the same School/command/time `<= 1`.

### Lifecycle and evidence boundary

`AUTH-14` is ESAO Admin-only and may appoint/activate, replace/renew through a new record or revision, revoke, expire, or invalidate an Acting/Temporary authority record. ESAO Admin gains no Director-required financial authority by managing that record; System Admin is prohibited from the lifecycle.

Temporary records require a named Temporary subject, School, appointment/organizational evidence, documented basis that Active/Acting resolution cannot supply a holder (including a School with zero active Director), start, expiry, exact command scope, appoint/revoke actor, status, and audit history. Acting records require both the named unavailable active Director and a distinct named Acting substitute, School, documented active-Director inability reason/basis/evidence, start, expiry or termination, appointment actor, exact command scope, status, and audit history. This decision does not invent a legal or organizational document type or external eligibility criteria. The missing exact evidence type and validation rule, including the evidence for inability or temporary basis, is `BLK-011`; until that blocker is resolved, `AUTH-14` and `AUTH-15` deny execution.

### Command boundary

Only a valid, named, explicitly scoped `AUTH-15` holder may execute `AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`, or the approval portion of `AUTH-21`. All underlying authentication, policy, evidence, School scope, and segregation-of-duties controls remain. `AUTH-19`, `AUTH-34`, `AUTH-35`, `AUTH-38`, membership, Policy Publisher, Auditor, System Admin, cross-School, generic, and emergency commands remain excluded from substitute authority.

No self-appointment, self-grant, re-delegation, generic override, or cross-School/command-scope bypass is permitted.

---

## Decision 13 — BLK-011 Hybrid Substitute Authority Reconciliation

**Status:** **APPROVED LIVE MODEL** by Private Business / Product Owner on 2026-08-16, with reconciliation issues finalized 2026-08-17.

Stable `AUTH-14` retains one Matrix ID with `DIRECTOR`, `ESAO`, and `TEMP` variants. An active School Director may create Acting authority for a distinct authenticated Finance Officer or School Admin with active membership in the same School; ESAO Admin may create/manage Acting authority and alone manages Temporary authority. System Admin has no substitute or Active Director Availability lifecycle authority. Future Vice Director or other subject types remain unsupported until separately approved.

Acting uses one fixed initial reason code (`MEDICAL_LEAVE`, `OFFICIAL_TRAVEL`, `PERSONAL_LEAVE`, or `OTHER`); `OTHER` requires explanation. Temporary requires free-text basis showing that Active/Acting resolution cannot supply a holder, including zero active Director. A formal SESAO order or external appointment document is not required. Every immutable application record has an integrity digest; an optional upload has a separate SHA-256 hash and downstream `INTERNAL-AUTHORIZATION` export classification.

Active Director Availability is separately audited. `AUTH-14/DIRECTOR`, `AUTH-14/ESAO`, or, when applicable, `AUTH-14/TEMP` creates unavailability atomically. Substitute expiry, revocation, or supersession never restores availability; only explicit authenticated return/resumption or active-assignment termination does. Acting expiry is optional and Temporary expiry mandatory. Replacement, renewal, correction, eligibility invalidation, and separate `AUTH-05` conversion are atomic immutable transitions using `SCHEDULED`, `IN_FORCE`, `REVOKED`, `EXPIRED`, `SUPERSEDED`, `INVALIDATED`, `ENDED_ON_RETURN`, or `CONVERTED`; failed attempts are audit outcomes, not record statuses.

`AUTH-15` is limited to `AUTH-09`, `AUTH-11`, `AUTH-12`, and `AUTH-18`. `AUTH-19`, `AUTH-21`, `AUTH-34`, `AUTH-35`, `AUTH-38`, and every other command remain active-Director-only or denied. Underlying authentication, evidence, reviewer, and person-level SoD controls remain binding. Cross-tier records may coexist only when precedence resolves exactly one effective holder; same-tier duplicates, contradictory state, or multiple effective holders deny.

---

# 4. Superseded Interpretations

The following interpretations are superseded for the current application authorization model:

| Previous interpretation | Current decision |
| --- | --- |
| Named Policy Publisher is optional configuration for P0-04 | Order 452/2568 organizational evidence plus approved Matrix designation are required for Policy Publisher eligibility/designation |
| System Admin has unrestricted organizational membership authority | System Admin is platform-scoped; ESAO Admin owns organizational membership |
| School Director-only model; `AUTH-14`/`AUTH-15` always denied | Historical model superseded by Decision 12, then amended by live Decision 13/BLK-011; only `AUTH-09/11/12/18` may resolve through `AUTH-15` |
| Receipt Book `approval` implies second-person authorization | Approval is custody/issuance evidence |
| Routine posting can never be delegated | It remains a future delegation concept, but no delegation grant or use is enabled in the initial pilot |
| Post-close Director approval is unresolved | Director approval is mandatory |
| Director daily signature is merely acknowledgement/evidence | Director signature is formal approval |
| Policy Version can have a separate retirement/deactivation command | Supersession is the only inactive transition |
| ESAO Reviewer may have generic acceptance/return/override authority | ESAO Reviewer is review/compare/report only |
| Audit Assessment requires distinct working and finalizing Auditors | One active Auditor operates the Assessment end to end |
| SESAO Auditor may administer Assessment assignments or Substitute Director Authority | ESAO Admin administers Assessment assignments and the enumerated substitute lifecycle; SESAO Auditor has only the five approved Assessment actions |

These supersessions apply to the **current application authorization model**.

Historical manuals, dated research notes, previous session notes, and earlier architectural statements remain preserved as historical evidence where required.

---

# 5. Current Matrix Decisions

Historical `BLK-003` decisions remain resolved. Decision 12 is preserved as historical predecessor evidence; Decision 13/BLK-011 is the approved live hybrid amendment.

## 5. Current Matrix Decisions

The then-recorded Product Owner approved the following historical Matrix inputs on 2026-08-10:

- Order 452/2568 eligibility is validated before Policy Publisher designation/publication through the official SESAO Narathiwat Internal Audit Unit page. Record the URL, retrieval timestamp, named-person result, and conflict outcome.
- Policy Publisher publication scope is all 17 Schools affiliated with SESAO Narathiwat, sourced separately from the official SESAO organizational information page, not Order 452/2568.
- No generic ESAO or platform override command exists. Every unlisted privileged command is denied.
- The former Temporary Director exclusion is historical/superseded effective 2026-08-15 by Decision 12; it remains preserved as historical evidence.
- Privileged Correction requires School Director approval, with no separate independent pre-execution reviewer; the proposer/preparer cannot self-approve.
- The Daily Balance Verifier, SESAO Auditor assessment, membership, School Director, and ESAO Reviewer limits are those explicitly enumerated by the live Authorization Matrix.
- The SESAO Auditor workflow uses one active Auditor per Assessment, atomic creator assignment, ESAO Admin-controlled later assignment changes, and the five approved end-to-end Auditor commands without an additional Auditor review step.
- The Product Owner approved the historical Authorization Matrix, subject to durable recording of this decision and operational evidence.

Decision 13/BLK-011 supplies the final application reason/basis evidence, eligibility, availability, lifecycle, audit, and command-scope contract. Every unsupported or unlisted operation remains denied, and every command fails closed when its command-specific evidence or authority state is missing or invalid.

---

# 6. P0-04 Closure Rule

`BLK-003` remains historically resolved. Decision 12 replaced its School Director-only interpretation; Decision 13 resolves and supersedes the resulting BLK-011 gap without rewriting either historical decision.

P0-04 is complete when the canonical documents have been reconciled and the checks below confirm all 13 conditions.

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

The final Authorization Matrix records all 13 conditions as satisfied. Condition 11 is satisfied by the Product Owner-approved immutable application reason/basis evidence, exact same-School eligibility and availability validation, and optional separately hashed upload; no formal external order is required.

**P0-04 = DONE after the 2026-08-17 canonical reconciliation and closure audit.**

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

This resolution record preserves the historical Product Owner decisions and records Decision 13/BLK-011 as the live Substitute Director Authority boundary.

The final Authorization Matrix was rebuilt from these decisions and is now the canonical command-level authorization source; the earlier proposed matrix must not be treated as live.

The matrix must retain the existing principle that Policy Publisher activation requires no second-person approval or pre-activation review while remaining attributable and auditable.

---

# 9. Required Next Action

Future implementation must be separately claimed and derive exactly from the reconciled Matrix. No code, RBAC, schema, provider, configuration, or production change is authorized by this governance record.

---

# 10. Final Decision Summary

| ID | Decision | Status |
| --- | --- | --- |
| BLK-003-01 | Policy Publisher eligibility from Order 452/2568 organizational evidence; approved Matrix designation for one current holder and one standby alternate | **RESOLVED** |
| BLK-003-02 | System Admin platform lifecycle; ESAO Admin organizational membership | **RESOLVED** |
| BLK-003-03 | School Director-only model; Temporary Director capability excluded from initial pilot | **HISTORICAL/SUPERSEDED EFFECTIVE 2026-08-15** |
| BLK-003-04 | Receipt Book approval = custody/issuance evidence | **RESOLVED** |
| BLK-003-05 | Routine posting included in existing delegation | **RESOLVED** |
| BLK-003-06 | School Director approval mandatory for Privileged Correction | **RESOLVED** |
| BLK-003-07 | School Director signature = formal Daily Balance approval | **RESOLVED** |
| BLK-003-08 | Supersession only; no Policy Version retirement command | **RESOLVED** |
| BLK-003-09 | ESAO Reviewer = review/compare/report only | **RESOLVED** |
| BLK-003-10 | Single active end-to-end SESAO Auditor; ESAO Admin controls later assignment changes | **RESOLVED** |
| D12 | Substitute School Director Authority predecessor: deterministic Active/Acting/Temporary precedence; ESAO Admin-only lifecycle; included approval portion of `AUTH-21` | **HISTORICAL/SUPERSEDED EFFECTIVE 2026-08-16** |
| D13 / BLK-011 | Hybrid `AUTH-14` variants, resolved application evidence/availability/lifecycle contract, and `AUTH-15` limited to `AUTH-09/11/12/18` | **APPROVED LIVE MODEL** |

### Overall BLK-003 status

**RESOLVED**

### Overall P0-04 status

**DONE. All 13 closure conditions are satisfied by the reconciled final Matrix.**

### No implementation authorization code should be written from this record alone.

The final implementation authorization model must derive from the approved P0-04 Authorization Matrix through separately claimed implementation tasks.
