# P0-04 — Authorization Matrix
## SchoolBanchee

**Status:** Proposed for SESAO Narathiwat Product Owner / Accountable Reviewer approval  
**Effective date:** To be approved  
**Scope:** All 17 pilot Schools under SESAO Narathiwat  
**Parent organization:** SESAO Narathiwat (`1000960001`)  
**External Governing Policy Authority:** OBEC  
**In-application Policy Publisher:** SESAO Narathiwat

---

## 1. Purpose

This Authorization Matrix defines:

1. organizational data boundaries;
2. application roles and their authority;
3. registration and membership authority;
4. financial command authorization;
5. actor / approver / reviewer separation;
6. prohibited combinations;
7. delegation and temporary authority;
8. ESAO oversight boundaries;
9. System Administrator boundaries.

This matrix is a product-control decision derived from the approved SchoolBanchee architecture and applicable policy evidence. It is not itself a regulatory document.

---

# 2. Organization and Data Boundaries

| Boundary | Rule |
|---|---|
| SESAO | Parent organization and ESAO oversight boundary |
| School | Independent financial, reporting, and audit boundary |
| School user | May access only the School(s) explicitly assigned through an active membership |
| School Director | May access only their assigned School(s) |
| ESAO Admin | May access only assigned School/ESAO scope |
| ESAO Reviewer | May review only assigned scope or approved aggregate scope |
| Policy Publisher | May manage Policy Versions within the SESAO policy-publication boundary |
| System Admin | Platform-wide technical/identity administration; no School financial authority |
| Cross-school access | Never granted merely by knowing a School identifier |
| Aggregate reporting | May read authorized aggregate information but must not mutate a School's canonical financial records |
| Financial mutation | Must always occur within the authoritative School boundary |

### Mandatory rule

A user must never obtain access to another School's financial records merely by supplying, discovering, or knowing that School's identifier.

---

# 3. Application Roles

| Role | Scope | Primary purpose | Financial entry | Approval | Review |
|---|---|---|---:|---:|---:|
| Applicant | Requested School only | Request membership | No | No | No |
| Finance Officer | Assigned School | Financial preparation and posting | Yes | Limited | No |
| School Admin | Assigned School | Administrative/financial support | Only when explicitly delegated | No by default | Yes where assigned |
| School Director | Assigned School | Management and approval | No routine entry | Yes | Yes |
| School Inspector | Assigned School | Daily inspection/control | No | No | Yes |
| Custody Committee Member | Assigned School | Cash/custody verification | No | No | Yes |
| ESAO Admin | Assigned ESAO/School scope | Membership administration and oversight | No | Membership only | Yes |
| ESAO Reviewer | Assigned ESAO/School scope | Independent oversight/review | No | Policy-dependent | Yes |
| Policy Publisher | SESAO | Policy registration and activation | No | Policy activation | Post-action audit |
| System Admin | Platform-wide | Technical and identity administration | No | No financial approval | Technical audit only |

---

# 4. Registration and Membership Authorization

## 4.1 Public Registration

| Action | Actor | Approver | Reviewer | Scope | Prohibited |
|---|---|---|---|---|---|
| Submit school-role registration | Applicant | ESAO Admin or System Admin | Independent audit/review as applicable | Selected School | Applicant cannot approve own application |
| Request Finance Officer role | Applicant | Authorized membership reviewer | ESAO/platform reviewer | Selected School | Cannot request privileged ESAO/System role |
| Request School Admin role | Applicant | Authorized membership reviewer | ESAO/platform reviewer | Selected School | Cannot self-assign |
| Request School Director role | Applicant | Authorized membership reviewer / appointing authority | ESAO/platform reviewer | Selected School | Cannot self-approve |
| Request ESAO Admin | Not publicly requestable | Designated appointing authority | Independent accountable reviewer | ESAO scope | No self-request/self-approval |
| Request ESAO Reviewer | Not publicly requestable | Designated appointing authority | Independent accountable reviewer | ESAO scope | No self-request/self-approval |
| Request Policy Publisher | Not publicly requestable | Designated SESAO authority | Accountable reviewer | SESAO | No self-request/self-approval |
| Request System Admin | Not publicly requestable | Designated platform authority | Independent platform reviewer | Platform | No self-request/self-approval |

---

# 5. Membership Administration

| Command | Actor | Approver | Reviewer | Prohibited combination |
|---|---|---|---|---|
| Review registration | ESAO Admin within assigned scope / System Admin | N/A | Audit reviewer where required | Applicant cannot review own application |
| Request correction | ESAO Admin / System Admin | N/A | Audit trail | Applicant cannot change approval decision |
| Approve membership | Authorized ESAO Admin / System Admin | N/A | Independent audit trail | Reviewer cannot approve own request |
| Reject membership | Authorized ESAO Admin / System Admin | N/A | Audit trail | Applicant cannot reject own request |
| Suspend membership | Authorized ESAO Admin / System Admin | N/A | Audit reviewer | Subject user cannot suspend own membership |
| Remove membership | Authorized ESAO Admin / System Admin | Designated authority where required | Independent reviewer | Subject user cannot remove own membership |
| Change school assignment | ESAO Admin within assigned scope | Designated authority where required | Independent reviewer | User cannot assign themselves |
| Change role | Authorized administrator | Designated authority where required | Independent reviewer | User cannot elevate themselves |
| Assign privileged ESAO role | Designated authorized administrator | Appointing authority | Independent accountable reviewer | No self-assignment |
| Assign System Admin | Designated platform authority | Appointing authority | Independent platform review | No self-assignment |

---

# 6. Financial Event Authorization

## 6.1 Routine Financial Events

| Command | Actor | Approver | Reviewer | Prohibited combination |
|---|---|---|---|---|
| Create draft financial event | Finance Officer / delegated School Admin | N/A | N/A | Must belong to actor's assigned School |
| Submit financial event | Finance Officer / delegated School Admin | N/A | N/A | Cannot submit outside assigned School |
| Post routine event | Finance Officer with posting authority | Policy-dependent | Daily inspector | Actor cannot approve a separate approval-required event they created |
| Approve director-required event | School Director / authorized delegate | N/A | Inspector / audit | Creator cannot approve own event |
| Reject event | Authorized approver | N/A | Audit trail | Creator cannot approve/reject own event where SoD applies |
| Correct unposted draft | Original actor / authorized School user | N/A | Audit as required | Cannot modify posted history |

---

# 7. Sensitive Financial Commands

Sensitive financial commands require stronger segregation.

| Command | Actor | Approver | Reviewer | Prohibited combination |
|---|---|---|---|---|
| Payment | Finance Officer / delegated finance user | School Director or documented delegate | Assigned inspector / ESAO reviewer | Actor cannot approve own payment |
| Remittance | Finance Officer / delegated finance user | School Director or documented delegate | Assigned inspector / ESAO reviewer | Actor cannot approve own remittance |
| Advance issuance | Finance Officer / delegated finance user | School Director or documented delegate | Assigned inspector / ESAO reviewer | Actor cannot approve own advance |
| Receipt Book issuance | Authorized custody/finance officer | School Director or documented delegate | Custody committee / inspector | Issuer cannot be sole verifier |
| Cash/custody operation | Responsible finance officer | School Director where required | Custody committee | One person cannot be sole preparer and verifier |
| Daily balance preparation | Responsible finance officer | School Director signs/acknowledges where required | Custody committee / inspector | Preparer cannot be sole verifier |
| Daily inspection | Assigned inspector | N/A | ESAO oversight | Preparer/poster cannot be sole inspector |
| Monthly reconciliation | Finance Officer / School Admin | School Director / delegated close authority | ESAO reviewer | Reconciler cannot be sole closer |
| Monthly close | School Director / delegated close authority | N/A | ESAO reviewer | Cannot close unresolved discrepancy |
| Post-close correction proposal | School user | School Director | ESAO reviewer | Proposer cannot approve |
| Post-close correction approval | School Director | N/A | ESAO reviewer | System Admin cannot perform financial correction |
| Post-close correction execution | Authorized School financial process | Required approval | ESAO reviewer | Must preserve original record and correction chain |

---

# 8. Daily Inspection and Cash/Custody

The following segregation is mandatory unless an approved policy exception applies:

```text
Preparation
    ↓
Responsible Finance Officer
    ↓
Verification
    ↓
Custody Committee / Assigned Inspector
    ↓
Acknowledgement / Management Sign-off
    ↓
School Director
```

No single person may silently perform the entire preparation → verification → approval chain for a sensitive financial action when the effective policy requires segregation.

---

# 9. Reconciliation and Closing

| Activity | Responsible role | Required control |
|---|---|---|
| Prepare reconciliation | Finance Officer / School Admin | Must use authoritative records |
| Investigate discrepancy | Finance Officer / authorized School user | Evidence required |
| Approve reconciliation | School Director / delegated close authority | Cannot be sole preparer |
| Close month | School Director / delegated close authority | Unresolved material discrepancy blocks close |
| Review close | ESAO Reviewer | Review does not mutate School records |
| Reopen/correct after close | Authorized School process | Requires post-close correction workflow and audit trail |

---

# 10. Policy Publication

| Command | Actor | Approver | Reviewer | Prohibited |
|---|---|---|---|---|
| Register evidence-backed Policy Version | Named SESAO Policy Publisher | Not required | Audit trail / later authorized review | Cannot invent source |
| Set policy scope | Policy Publisher | Not required | Audit trail | Cannot exceed authorized SESAO scope |
| Set effective date | Policy Publisher | Not required | Audit trail | Cannot create unsupported effective date |
| Activate Policy Version | Policy Publisher | Not required | No pre-activation second-person review required | Cannot activate without evidence |
| Retire/deactivate Policy Version | Policy Publisher | Per policy | Accountable review | Cannot rewrite historical version |
| Modify OBEC source evidence | No application role | N/A | N/A | Prohibited |
| Create fabricated policy revision | No role | N/A | N/A | Prohibited |
| Mutate School financial records | Policy Publisher | N/A | N/A | Prohibited |

### Policy activation rule

SESAO Policy Publisher activation does **not** require a second-person approval or pre-activation review under ADR-0006.

The activation remains:

- authenticated;
- attributable;
- auditable;
- evidence-backed.

This exception applies **only to policy activation** and does not weaken segregation of duties for financial operations, closing, membership, or privileged administration.

---

# 11. ESAO Oversight

| Activity | ESAO authority |
|---|---|
| View assigned School records | Yes |
| Review financial reports | Yes |
| Review audit history | Yes |
| Review reconciliation | Yes |
| Review registration/membership | Yes within assigned scope |
| Review aggregate reports | Yes |
| Return/report findings | Yes |
| Correct School financial records directly | No |
| Post School financial events | No |
| Approve School financial events | No unless separately appointed under effective policy |
| Close School accounting period | No unless explicitly appointed under effective policy |
| Modify School canonical records | No |
| Change School balances directly | No |

ESAO oversight is a **review/control function**, not an unrestricted backdoor into School financial records.

---

# 12. System Administrator Boundary

The System Administrator has platform-wide technical authority but does not receive School financial authority merely by holding the System Admin role.

### System Admin MAY

- manage platform identities;
- manage technical configuration;
- review platform-level audit information;
- administer memberships according to approved membership policy;
- perform technical support;
- perform operational recovery procedures;
- manage system-level security controls.

### System Admin MUST NOT

- create School financial entries;
- post School financial events;
- approve School financial events;
- perform daily financial inspection;
- perform reconciliation;
- close School accounting periods;
- perform post-close financial corrections;
- alter canonical financial balances;
- bypass financial authorization controls.

Technical privilege does not imply financial authority.

---

# 13. Delegation

Delegation is permitted only when:

1. the delegator has the authority being delegated;
2. the effective policy permits delegation;
3. the delegate is an authenticated user;
4. the delegate is within the appropriate organizational scope;
5. the delegation has a defined start date;
6. the delegation has an expiry date;
7. the delegation is auditable;
8. the delegation cannot create a prohibited self-approval combination.

### Delegation record

Every temporary delegation must identify:

| Field | Required |
|---|---|
| Delegator | Yes |
| Delegate | Yes |
| Role/capability | Yes |
| Scope | Yes |
| Start date/time | Yes |
| Expiry date/time | Yes |
| Reason | Yes where policy requires |
| Authorizing authority | Yes |
| Audit event | Yes |

Expired delegation must automatically cease to grant authority.

---

# 14. Staff-Shortage Exception

A staff shortage must **not automatically eliminate segregation of duties**.

If the effective policy permits an exception:

1. the exception must be explicitly recorded;
2. the affected School must be identified;
3. the affected command must be identified;
4. the reason must be recorded;
5. compensating review must be defined;
6. an independent reviewer must perform the compensating review where possible;
7. the exception must have an expiry date;
8. all actions must remain auditable.

The application must never silently convert a staff shortage into unrestricted authority.

---

# 15. Prohibited Role Combinations

The following combinations are prohibited unless a specific effective policy exception is approved and compensating controls are recorded.

| Combination | Status |
|---|---|
| Applicant + own membership approver | Prohibited |
| User + own role elevation approver | Prohibited |
| User + own membership suspension authority | Prohibited |
| Financial event creator + own sensitive-event approver | Prohibited |
| Payment creator + payment approver | Prohibited |
| Advance creator + advance approver | Prohibited |
| Remittance creator + remittance approver | Prohibited |
| Receipt Book issuer + sole verifier | Prohibited |
| Daily balance preparer + sole inspector | Prohibited |
| Reconciler + sole closer | Prohibited |
| Person with unresolved discrepancy + sole close authority | Prohibited |
| Post-close correction proposer + approver | Prohibited |
| System Admin + School financial authority | Prohibited |
| Policy Publisher + modification of OBEC source evidence | Prohibited |
| Public applicant + ESAO privileged role request | Prohibited |
| User + self-assigned School membership | Prohibited |

---

# 16. Authorization Decision Rules

The authorization engine must evaluate at least:

```text
Identity
    +
Active Membership
    +
Role
    +
Organization Scope
    +
School Scope
    +
Command
    +
Current Policy Version
    +
Effective Date
    +
Segregation-of-Duties Constraints
    +
Delegation
    +
Approval State
    +
Record State
```

Authorization must never be based only on:

```text
role == "ADMIN"
```

or:

```text
schoolId supplied by client
```

The server must derive and verify the user's effective scope.

---

# 17. Minimum Authorization Invariants

### INV-AUTH-01 — Organization Isolation

A user cannot read or mutate another School's financial records unless the user's active membership explicitly authorizes that scope.

### INV-AUTH-02 — Server Authority

Client-supplied organization, School, role, policy, approval, or balance information is never authoritative.

### INV-AUTH-03 — Membership Required

Protected School operations require an active identity and active membership.

### INV-AUTH-04 — Privileged Roles Are Not Publicly Requestable

`SYSTEM_ADMIN`, `ESAO_ADMIN`, reviewer, and Policy Publisher privileges cannot be obtained through ordinary public registration.

### INV-AUTH-05 — Approval Separation

A user cannot approve their own sensitive financial action when the effective policy requires segregation.

### INV-AUTH-06 — Inspection Separation

A user who prepared/posted a sensitive financial operation cannot be its sole inspector where the effective policy requires independent inspection.

### INV-AUTH-07 — Close Separation

A reconciler cannot be the sole closer where the effective policy requires separation.

### INV-AUTH-08 — Immutable Financial History

Authorization cannot permit silent mutation or deletion of posted financial history.

### INV-AUTH-09 — Policy Publisher Boundary

Policy Publisher authority cannot mutate School financial records.

### INV-AUTH-10 — System Admin Boundary

System Admin authority cannot be used as a substitute for School financial authorization.

### INV-AUTH-11 — Delegation Expiry

Expired delegation cannot authorize an operation.

### INV-AUTH-12 — Auditability

Every privileged authorization decision and membership change must produce attributable audit evidence.

---

# 18. Approval Items Required to Close P0-04

The following items require explicit Product Owner / Accountable Reviewer approval:

- [ ] Named SESAO Policy Publisher and alternate
- [ ] Named ESAO Admins and alternates
- [ ] Named ESAO Reviewers and alternates
- [ ] Assigned-school scope for ESAO Admins
- [ ] Assigned-school scope for ESAO Reviewers
- [ ] School Director appointment model
- [ ] School Director delegation model
- [ ] Finance Officer appointment model
- [ ] Inspector appointment model
- [ ] Custody Committee appointment model
- [ ] Delegation start/expiry requirements
- [ ] Staff-shortage exception procedure
- [ ] Compensating review procedure
- [ ] Publicly requestable School roles
- [ ] Membership approval authority
- [ ] Privileged-role assignment authority
- [ ] Command-level actor/approver/reviewer matrix
- [ ] Prohibited role combinations
- [ ] Audit requirements for authorization changes

---

# 19. P0-04 Completion Condition

P0-04 may be marked `[DONE]` only when:

1. the Authorization Matrix is approved;
2. every privileged command has an actor;
3. every approval-required command has an approver;
4. every review-required command has a reviewer;
5. prohibited combinations are approved;
6. School/ESAO boundaries are approved;
7. registration authority is approved;
8. membership authority is approved;
9. delegation and expiry are approved;
10. staff-shortage exceptions are approved;
11. required named appointments/alternates are recorded;
12. the final matrix is stored in the repository;
13. the checklist is updated;
14. a session note records the approval and verification evidence.

---

## 20. Approval Record

**Product Owner:** SESAO Narathiwat

Name: ______________________________

Signature/approval: __________________

Date: _______________________________


**Accountable Reviewer:** SESAO Narathiwat

Name: ______________________________

Signature/approval: __________________

Date: _______________________________


**Policy Publisher:** SESAO Narathiwat

Name: ______________________________

Signature/approval: __________________

Date: _______________________________