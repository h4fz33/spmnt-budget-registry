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

**Named appointment is required for P0-04 completion.**

The authorization architecture remains role/capability based:

```text
SESAO Auditor
    |
    +-- Policy Publisher capability
```

However, P0-04 cannot be closed until formal appointment evidence identifies:

- the current named Policy Publisher holder; and
- the designated alternate.

The appointment evidence must be attributable and auditable.

Personnel names must not be invented by the system design or by Codex.

### Authorization effect

The Policy Publisher capability remains a role/capability definition in the architecture.

The named holder and alternate are recorded as operational appointment evidence associated with P0-04.

The Policy Publisher may activate an evidence-backed Policy Version without second-person approval or pre-activation review, consistent with ADR-0006.

### Closure requirement

**OPEN — appointment evidence required.**

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

### Required controls

The Authorization Matrix must explicitly define:

- issuer;
- exact command scope;
- duration;
- reviewer;
- evidence requirements;
- segregation-of-duties restrictions.

These values must not be invented.

### Current status

The mechanism is approved in principle, but its detailed authorization parameters remain:

**OPEN**

until authoritative values are supplied.

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

**Routine posting is included in the existing delegation mechanism.**

Routine posting may therefore be delegated subject to the existing delegation safeguards:

- compatible role;
- same organizational/School scope;
- explicit capability scope;
- no self-approval;
- no re-delegation;
- explicit revocation;
- invalidation when the delegator loses the underlying authority.

Delegation of routine posting does **not** grant approval authority.

### Authorization effect

A delegated School Admin or other eligible delegate may perform only the explicitly delegated routine-posting capability.

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

# 4. Superseded Interpretations

The following interpretations are superseded for the current application authorization model:

| Previous interpretation | Current decision |
| --- | --- |
| Named Policy Publisher is optional configuration for P0-04 | Appointment evidence is required for P0-04 closure |
| System Admin has unrestricted organizational membership authority | System Admin is platform-scoped; ESAO Admin owns organizational membership |
| Director absence always blocks Director-required operations | Controlled Temporary Director Approval remains available |
| Receipt Book `approval` implies second-person authorization | Approval is custody/issuance evidence |
| Routine posting is outside delegation | Routine posting is included in existing delegation |
| Post-close Director approval is unresolved | Director approval is mandatory |
| Director daily signature is merely acknowledgement/evidence | Director signature is formal approval |
| Policy Version can have a separate retirement/deactivation command | Supersession is the only inactive transition |
| ESAO Reviewer may have generic acceptance/return/override authority | ESAO Reviewer is review/compare/report only |

These supersessions apply to the **current application authorization model**.

Historical manuals, dated research notes, previous session notes, and earlier architectural statements remain preserved as historical evidence where required.

---

# 5. Items Remaining Open After BLK-003

The nine human decisions are resolved, but the following authorization values still prevent P0-04 closure.

## 5.1 Policy Publisher appointment

Required:

- named current holder;
- named alternate;
- appointment evidence;
- effective appointment information;
- attributable record.

**Status: OPEN**

---

## 5.2 Temporary Director Approval

Required:

- issuer;
- exact command scope;
- duration;
- reviewer;
- evidence;
- SoD restrictions.

**Status: OPEN**

---

## 5.3 Privileged Correction reviewer

Required:

- whether an independent reviewer is required;
- reviewer role/capability;
- reviewer scope;
- prohibited combinations.

**Status: OPEN**

---

## 5.4 Daily Balance independent verifier

Required:

- verifier capability/role;
- permitted scope;
- independence from preparer;
- relationship between verifier and Director approver.

**Status: OPEN**

---

## 5.5 ESAO Reviewer scope

Required:

- assigned-School boundary;
- aggregate-reporting boundary;
- exact report/action scope;
- any required review evidence.

**Status: OPEN**

---

## 5.6 Privileged capability administration

The Authorization Matrix must explicitly define who can:

- grant privileged capabilities;
- revoke privileged capabilities;
- appoint privileged role holders;
- change privileged assignments;
- review those operations;
- perform emergency or replacement actions, if any.

No actor may be inferred as authorized merely because they possess a generic administrative role.

**Status: OPEN**

---

## 5.7 Other privileged commands

The final P0-04 matrix must explicitly classify remaining privileged operations, including where applicable:

- monthly reconciliation and close;
- audit-assessment assignment;
- audit-assessment final acceptance;
- ESAO reporting/oversight operations;
- any generic `override` command;
- membership and privileged-role elevation/revocation;
- delegation creation/revocation;
- other commands capable of changing authorization or financial state.

Each must receive explicit actor, scope, approver, reviewer, prohibited combination, authentication, delegation, and audit requirements.

**Status: OPEN**

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
11. required named appointment evidence has been recorded;
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
5. identify and explicitly mark remaining `OPEN` authorization values;
6. rebuild the P0-04 Authorization Matrix;
7. validate that no stale live statement contradicts these decisions;
8. keep P0-04 marked `BLOCKED`;
9. make no application/RBAC implementation changes until P0-04 is approved.

---

# 10. Final Decision Summary

| ID | Decision | Status |
| --- | --- | --- |
| BLK-003-01 | Named Policy Publisher holder + alternate required for P0-04 closure | **RESOLVED** |
| BLK-003-02 | System Admin platform lifecycle; ESAO Admin organizational membership | **RESOLVED** |
| BLK-003-03 | Temporary Director Approval retained as controlled alternate | **RESOLVED** |
| BLK-003-04 | Receipt Book approval = custody/issuance evidence | **RESOLVED** |
| BLK-003-05 | Routine posting included in existing delegation | **RESOLVED** |
| BLK-003-06 | School Director approval mandatory for Privileged Correction | **RESOLVED** |
| BLK-003-07 | School Director signature = formal Daily Balance approval | **RESOLVED** |
| BLK-003-08 | Supersession only; no Policy Version retirement command | **RESOLVED** |
| BLK-003-09 | ESAO Reviewer = review/compare/report only | **RESOLVED** |

### Overall BLK-003 status

**RESOLVED — DECISION LEVEL**

### Overall P0-04 status

**BLOCKED — AUTHORIZATION MATRIX AND APPOINTMENT/SCOPE EVIDENCE STILL REQUIRED**

### No implementation authorization code should be written from this record alone.

The final implementation authorization model must derive from the approved P0-04 Authorization Matrix after all remaining `OPEN` values have been resolved and the required human sign-off has been recorded.