# P0-10 Registration and Onboarding Policy

**Status:** accepted for synthetic/anonymized private-product bootstrap scope
**Decision authority:** Private Business / Product Owner
**Decision date:** 2026-08-17
**Related decision:** `P0-04-D14-01`
**ADR:** [ADR-0017](../adr/0017-school-admin-initiated-approved-onboarding.md)

This record captures the Product Owner's segmented P0-10 decisions. It replaces public Finance Officer registration for the current private pilot with a School Admin-submitted, ESAO Admin-approved account request. It does not authorize real-person data, object upload, production deployment, or application implementation.

## Scope and Roles

- The pilot uses synthetic/anonymized identities only. Real-person enrolment, personal-ID evidence, identity documents, and real School data are disabled.
- The initial School Admin population is one synthetic account per active School in a sealed 17-row manifest. ESAO Admin approves the manifest; System Admin only executes it technically.
- After bootstrap, an active School Admin may submit only a same-School request for a synthetic `Finance Officer` account. `School Staff`, `Vice Director`, School Director, Acting/Temporary authority, ESAO Admin, System Admin, SESAO Auditor, and Policy Publisher are not requestable through this path.
- ESAO Admin remains the sole organization decision maker across all 17 Schools. System Admin is limited to technical platform/credential execution and cannot choose or alter identity, School, membership, role, or authority.

## Request Lifecycle

```text
Submitted by School Admin
  -> Pending ESAO Review
  -> Needs Correction
  -> Resubmitted by School Admin
  -> Approved | Rejected | Withdrawn
```

- A School Admin request contains the target synthetic identity, normalized synthetic email/account identifier, the requester's own School, `Finance Officer`, and a structured reason. Submission grants no session, membership, role, or financial access.
- Only ESAO Admin may verify, request correction, approve, or reject. The reviewer cannot silently change the requested School or role. A School Admin may correct or withdraw only its own unapproved request and cannot target its own identity.
- Approval atomically creates one Finance Officer membership for the requested School and activates the identity. Suspension, removal, transfer, and later role changes remain ESAO Admin `AUTH-04` actions.
- One non-terminal request may exist per synthetic identity across the pilot. Duplicate, stale, cross-School, unsupported-role, self-target, and replayed requests fail closed.

## Identity, Credential, and Recovery Controls

- ESAO Admin verifies the synthetic identity and School association against the Product Owner-approved synthetic pilot roster/reference and records only an opaque reference and `VERIFIED`, `NEEDS_CORRECTION`, or `NOT_VERIFIED` outcome.
- No personal-ID evidence, identity-document bytes, email verification, email possession proof, or object upload is accepted.
- Passwords use bcrypt cost factor `10` and a minimum of 8 characters. Generic failures, throttling, temporary lockout, session invalidation after reset, and no credential logging remain required implementation controls.
- After an exact ESAO approval or approved bootstrap execution, System Admin may issue a single-use 24-hour activation code to the target through a Product Owner-approved controlled test channel. School Admin and ESAO Admin cannot view, choose, retain, or reuse the code; the target sets its own password. This is technical credential setup, not identity or membership approval.
- Recovery is ESAO-verified and System-Admin-executed. System Admin may issue/reset a technical credential only from the exact ESAO decision; recovery cannot activate an identity or change membership, School, or role.

## Evidence and Retention

| Evidence | Binding |
| --- | --- |
| Request fields, requester, target, School, role, reasons, lifecycle, verification outcome, and decision history | `EV-01`, `R-ACCOUNT-OPEN` |
| Membership, School Admin bootstrap, Finance Officer assignment, role/School revisions, and authorization history | `EV-03`, `R-ACCOUNT-OPEN` and `R-IMMUTABLE` |
| Sign-in, failed attempts, activation/recovery, throttling, and technical execution metadata | `EV-02`, `R-SECURITY-OPEN` |

All transitions and technical executions emit immutable Audit Log evidence. No automatic deletion, anonymization, raw export, or bulk export is permitted. Passwords, bcrypt hashes, activation codes, recovery secrets, and credential-bearing payloads never enter evidence or logs.

## Implementation Boundary

This policy is governance-only. P1-15 and P1-16 must implement the School Admin request and ESAO decision queues; P1-21 must implement the exact sealed 17-School Admin bootstrap. No application, RBAC, schema, provider, credential, production, or real-data change is authorized by P0-10.
