# School Admin-Initiated, ESAO-Approved Onboarding

**Status:** accepted
**Date:** 2026-08-17

For the synthetic/anonymized private-product pilot, SchoolBanchee has no public registration of Finance Officers. An active School Admin submits a same-School account request for a synthetic Finance Officer identity. An active ESAO Admin is the sole verifier and organization decision maker across all 17 Schools. Approval atomically creates the Finance Officer membership and activates the identity; submission, correction, or withdrawal grants nothing.

The initial School Admin population is established through a separate sealed bootstrap. An active ESAO Admin approves an exact synthetic manifest with exactly one School Admin row per active School. System Admin is only the technical executor of that exact manifest and cannot select, alter, approve, activate, revoke, or assign an organization identity outside the approved record. The manifest contains no passwords or activation/recovery secrets. Later School Admin changes remain ESAO Admin decisions under `AUTH-04`.

## Policy Contract

- The pilot permits synthetic/test identities only. Real-person registration, personal-ID evidence, identity-document upload, real School data, and production activation remain prohibited.
- `Finance Officer` is the only ordinary account role requestable through a School Admin request. School Admin, School Director, Acting/Temporary authority, ESAO Admin, System Admin, SESAO Auditor, Policy Publisher, Vice Director, and future School Staff roles are not requestable through this path.
- The request lifecycle is `Submitted -> Pending ESAO Review -> Needs Correction -> Resubmitted | Approved | Rejected | Withdrawn`.
- One non-terminal request may exist per synthetic identity. A School Admin may act only within its own School and cannot self-administer or change the requested School or role.
- No personal-ID evidence or email verification is used. ESAO Admin records only the verification outcome and an opaque reference to the Product Owner-approved synthetic pilot roster.
- Credentials use bcrypt cost factor `10` with a minimum length of 8 characters. Credential material, bcrypt hashes, activation codes, and recovery secrets are never logged or placed in request/manifest evidence.
- After an exact ESAO approval or approved bootstrap execution, System Admin may issue a single-use 24-hour activation code to the target through a Product Owner-approved controlled test channel. School Admin and ESAO Admin cannot view, choose, retain, or reuse the code; the target sets its own password. This is credential setup, not identity or membership approval.
- Recovery is ESAO-verified and System-Admin-executed. System Admin may reset technical credentials only from the exact recorded ESAO decision and cannot change membership, School, role, or account authority.
- Request and membership history remains preserved under the P0-07 `EV-01`/`EV-03` retention boundary; security and recovery metadata remains `EV-02`. Raw and bulk exports remain prohibited unless a separate export category authorizes them.

## Consequences

- ADR-0003 remains preserved as historical approved-registration architecture; this ADR supersedes its public-registration actor and lifecycle semantics for the current private synthetic pilot.
- `AUTH-01` is the School Admin submission command and `AUTH-01/BOOTSTRAP` is the sealed 17-School Admin manifest execution path. `AUTH-03` remains the ESAO Admin decision boundary.
- P1-15 and P1-16 must implement the School Admin request/ESAO decision queues, not a public Finance Officer form. P1-21 owns the later sealed 17-School Admin bootstrap implementation.
- This ADR authorizes governance reconciliation only. It does not authorize application, RBAC, schema, credential, provider, production, or real-data changes.
