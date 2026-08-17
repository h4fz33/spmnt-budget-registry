# BLK-011 Resolution Record
# Substitute School Director Authority - Evidence Type Specification

**Status:** RESOLVED  
**Blocker:** BLK-011  
**Decision authority:** Private Business / Product Owner  
**Decision date:** 2026-08-16  
**Reconciliation grilling date:** 2026-08-17
**Decision method:** Interactive grilling session with Product Owner  
**Purpose:** Define the exact authoritative appointment/organizational evidence type and validation rules for Acting and Temporary Substitute Director Authority

---

## Context

Product Owner Decision 12 (2026-08-15) approved the Substitute School Director Authority model with deterministic Active → Acting → Temporary precedence, ESAO Admin lifecycle management, and limited command scope. However, it did not specify the evidence type, validation rules, or appointment authority for Acting/Temporary Director appointments.

BLK-011 was raised to obtain these specifications so `AUTH-14` (manage substitute authority) and `AUTH-15` (exercise substitute authority) could be implemented.

---

## Resolution - Hybrid Acting/Temporary Authority Model

The Product Owner selected a **hybrid model** that balances operational flexibility (matching real-world school practice) with oversight controls (ESAO Admin review capability).

### Key Decision: School Director Self-Service + ESAO Admin Oversight

This model **amends Product Owner Decision 12** to add School Director self-service appointment of Acting Director Authority, while preserving ESAO Admin management capability.

---

## Acting Director Authority

### Path A: School Director Self-Service Appointment

**Authority command variant:** `AUTH-14/DIRECTOR` (Director self-service variant of canonical `AUTH-14`)

**Actor:** Active School Director only

**Eligible Acting subjects:**
- Any authenticated account from the same school as the appointing Director
- Initially: Finance Officer or School Admin from same school
- Future scope: Vice Director, other authorized delegate account types (not defined in this resolution)

**Evidence required:**
- **Reason:** Select exactly one fixed initial reason code: `MEDICAL_LEAVE`, `OFFICIAL_TRAVEL`, `PERSONAL_LEAVE`, or `OTHER`
  - `OTHER` requires non-empty explanatory text
  - Standard reason codes may include optional explanatory details
- **Optional document upload:** Director may optionally attach supporting evidence (medical certificate, travel order, etc.) but not required
- No formal SESAO order or external appointment document required

**Command scope:** Limited operational subset only
- `AUTH-09` - Assign/revoke Daily Balance Verifier
- `AUTH-11` - Approve payment (prepare/post payment)
- `AUTH-12` - Issue Official Advance
- `AUTH-18` - Approve/sign Daily Balance

**Excluded commands:** Acting Director Authority does NOT grant:
- `AUTH-19` - Accept Monthly Reconciliation and Close Month
- `AUTH-21` - Approve post-close Privileged Correction
- `AUTH-34` - Create Internal Money-Position Transfer
- `AUTH-35` - Assign SAR assessor
- `AUTH-38` - Approve/sign SAR
- Any membership, policy, audit, or platform commands

**Duration:** No fixed maximum duration
- Director specifies effective start (typically immediate)
- No mandatory expiry date
- Continues until explicitly revoked or active Director resumes/returns
- Before a future effective start, the active Director remains executable; while the Acting record is in force, the named unavailable Director is denied `AUTH-09`, `AUTH-11`, `AUTH-12`, and `AUTH-18` until explicit return/resumption

**Revocation:**
- Appointing Director can revoke anytime
- ESAO Admin can revoke anytime (passive oversight)
- Ends permanently when the appointing Director or ESAO Admin records an explicit authenticated return/resumption lifecycle event; it cannot reactivate automatically
- Login and ordinary Director command activity do not imply return and cannot silently end the record
- Automatically ends when the active Director is removed/replaced via `AUTH-05`
- Membership suspension, account suspension, School transfer, or loss of the required same-School Finance Officer/School Admin assignment permanently invalidates the record; restoration requires a new appointment
- Replacement atomically ends the previous Acting record and activates the replacement; failure leaves the previous record unchanged

**Audit evidence recorded:**
- Appointing Director identity
- Acting subject identity
- Same-school validation result
- Reason (dropdown selection or free text)
- Optional uploaded evidence reference and content hash
- Command scope granted
- Effective start timestamp
- Revocation actor, reason, timestamp (when revoked)
- Return/resumption or eligibility-invalidation actor/event, reason, and timestamp when applicable
- Authorization revision number
- Integrity digest of the immutable application authorization record

**School scope:** Acting authority is scoped to exact same school as appointing Director
- Cross-school Acting prohibited
- Acting subject loses Acting authority if transferred to different school

---

### Path B: ESAO Admin Management

**Authority command variant:** `AUTH-14/ESAO` (ESAO Admin Acting-management variant of canonical `AUTH-14`)

**Actor:** ESAO Admin

**Use cases:**
- Review and revoke Director-created Acting appointments (passive oversight)
- Create Acting authority when active Director is unavailable/unable to self-appoint
- Replace or renew Acting appointments
- Correct errors in Director-created appointments

**Evidence required:** Same as Path A
- Reason selection/free text (required)
- Optional document upload

**Command scope:** Same limited operational subset (`AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`)

**Duration:** No fixed limit; ESAO Admin specifies effective period
- Expiry is optional; the same explicit return, revocation, replacement, and eligibility-invalidation rules apply

**Revocation:** ESAO Admin can revoke anytime

**Replacement:** Atomically ends the previous Acting record and activates the replacement; failure leaves the previous record unchanged

**Correction:** Atomically supersedes the erroneous record with a new immutable revision; failure leaves the prior record unchanged

**Audit evidence:** Same fields as Path A, plus ESAO Admin actor identity

---

## Temporary Director Authority

**Authority command variant:** `AUTH-14/TEMP` (ESAO Admin Temporary-authority variant of canonical `AUTH-14`)

**Actor:** ESAO Admin only

**When used:**
- No active School Director (position vacant, suspended, removed)
- Active Director exists but Acting resolution fails (unavailable, invalid, expired)
- Basis that Active/Acting resolution cannot supply a holder

**Eligible subjects:**
- Named authenticated account with an active membership in the same School
- Initially: Finance Officer or School Admin in that School
- Future scope: Vice Director or other authorized account types

**Evidence required:**
- **Basis documentation:** Free text explaining why Active/Acting cannot supply holder
  - Examples: "Position vacant - no active Director", "Active Director suspended pending investigation", "Acting authority expired and Director still unavailable"
- **Optional document upload:** Supporting evidence (vacancy notice, suspension order, etc.)

**Command scope:** Same limited operational subset (`AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`)

**Duration:** ESAO Admin specifies an effective period with a mandatory expiry timestamp; no fixed maximum duration

**Conversion to permanent Director:**
- ESAO Admin can convert Temporary subject to permanent active School Director through separate `AUTH-05` assignment
- Conversion atomically creates the active Director assignment and ends Temporary authority; failure leaves the Temporary authority unchanged
- Separate audit evidence for `AUTH-05` assignment

**Revocation:** ESAO Admin can revoke anytime

**Replacement:** Atomically ends the previous Temporary record and activates the replacement; failure leaves the previous record unchanged

**Eligibility invalidation:** Membership suspension, account suspension, School transfer, or loss of the required same-School Finance Officer/School Admin assignment permanently invalidates the record; restoration requires a new appointment

**Correction:** Atomically supersedes the erroneous record with a new immutable revision; failure leaves the prior record unchanged

**Audit evidence:**
- ESAO Admin actor identity
- Temporary subject identity
- School
- Basis documentation (why Active/Acting cannot supply holder)
- Optional uploaded evidence reference and content hash
- Command scope granted
- Effective start/end period
- Revocation or conversion details
- Eligibility-invalidation actor/event, reason, and timestamp when applicable
- Integrity digest of the immutable application authorization record

---

## Effective Director Authority Resolution (Updated)

For commands `AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18` only:

**Resolution order:**
1. Valid active School Director (present and able) → active Director executes
2. Otherwise, valid Acting Director Authority (Director-created via `AUTH-14/DIRECTOR` or ESAO-created via `AUTH-14/ESAO`) → Acting subject executes via `AUTH-15`
3. Otherwise, valid Temporary Director Authority (ESAO-created via `AUTH-14/TEMP`) → Temporary subject executes via `AUTH-15`
4. Otherwise, **deny**

**Active Director Availability creation:**
- `AUTH-14/DIRECTOR` atomically records the appointing active Director as unavailable from the Acting effective start and creates the Acting record
- `AUTH-14/ESAO` atomically records the named active Director as unavailable and creates the Acting record
- `AUTH-14/TEMP` may atomically record the named active Director as unavailable and create Temporary authority when no valid Acting holder exists; a School with zero active Director needs no availability record
- System Admin cannot create, modify, or end Active Director Availability

**Validation rules:**
- At most one active Director per school (zero or one)
- At most one effective Acting holder per school/command/time
- At most one effective Temporary holder per school/command/time
- At most one effective Director Authority holder per school/command/time
- Active assignment may coexist with Acting or Temporary records; valid cross-tier records may coexist only when deterministic precedence resolves exactly one effective holder
- Multiple simultaneously valid records in one tier, contradictory availability/scope/lifecycle state, expired/revoked status, missing evidence, invalid scope, or more than one effective holder → **deny**
- An in-force Acting record marks the named active Director unavailable for `AUTH-09/11/12/18`; that Director cannot execute those commands until an explicit return/resumption event permanently ends the Acting record
- Active Director unavailability is separately recorded and persists if Acting expires, is revoked, or is superseded; until explicit return/resumption, resolution proceeds to valid Temporary authority or denies
- Every underlying person-level SoD rule remains binding to the resolved holder; combined Finance Officer/School Admin roles never relax it

For commands `AUTH-19`, `AUTH-21`, `AUTH-34`, `AUTH-35`, `AUTH-38`, and all other Director-required commands:

**Resolution order:**
1. Valid active School Director only
2. Acting/Temporary are **excluded from these commands**
3. Otherwise, **deny**

---

## Evidence Storage and Validation

### Storage Method: Hybrid (Application Record + Optional Upload)

**Required fields stored in application:**
- Authority type (Acting-Director-created, Acting-ESAO-created, Temporary)
- Appointing actor identity (Director or ESAO Admin)
- Subject identity (who becomes Acting/Temporary)
- School
- Reason code from the fixed initial allowlist; `OTHER` explanation when selected; Temporary Active/Acting-unavailability basis
- Command scope (fixed: `AUTH-09/11/12/18`)
- Effective start timestamp
- Expiry/revocation timestamp (when applicable)
- Status from the fixed `SCHEDULED`, `IN_FORCE`, `REVOKED`, `EXPIRED`, `SUPERSEDED`, `INVALIDATED`, `ENDED_ON_RETURN`, or `CONVERTED` lifecycle
- Integrity digest of the immutable authorization record fields and revision
- Active Director Availability reference for Acting and for Temporary when an active Director exists but remains unavailable

**Optional evidence upload:**
- Document upload (PDF, image, etc.) - optional but recommended
- Stored with its own SHA-256 content hash, separate from the authorization-record integrity digest
- Referenced in audit log
- Export category: `INTERNAL-AUTHORIZATION` (P0-07)
- `INTERNAL-AUTHORIZATION` is a fixed downstream P0-07 reconciliation requirement; this resolution does not itself reopen or complete P0-07

**Validation performed by:**
- **System validation:** Same-school check, duplicate/overlap detection, command scope enforcement, expiry check
- **Eligibility validation:** Membership/account status, School, and eligible-role loss permanently invalidate the authority; restored eligibility does not reactivate the old record
- **Availability validation:** Acting expiry/revocation/supersession does not imply Director return; a separately audited explicit return/resumption event is required before the active Director becomes executable

**Authentication and audit controls:** Every `AUTH-14` variant and every return/resumption, revocation, replacement, correction, renewal, eligibility invalidation, and conversion requires fresh reauthentication, structured reason, authorization-revision update, integrity digest, and immutable audit event. `AUTH-15` inherits the underlying command's authentication, evidence, and person-level SoD controls.
- **Actor validation:** Active Director authority verified before Director-path appointment; ESAO Admin authority verified before ESAO-path appointment
- **Completeness validation:** Required reason field present; optional evidence reference recorded if uploaded

**No external SESAO order or formal appointment document required**

---

## Renewal and Expiry Rules

### Acting Director Authority (Director-created)
- **No mandatory expiry:** Continues until revoked or the Director returns
- **Director return:** The appointing Director or ESAO Admin records an explicit authenticated return/resumption lifecycle event that permanently ends the record; login and ordinary Director activity do not imply return
- **No automatic renewal needed:** Can remain active indefinitely while Director unable
- **Renewal if desired:** Director atomically replaces the prior record with a new Acting appointment and updated reason/period

### Acting Director Authority (ESAO-created)
- **ESAO Admin specifies period:** May include expiry date or remain open-ended
- **Renewal:** ESAO Admin atomically replaces the prior record with a new record/revision and updated evidence

### Temporary Director Authority
- **Mandatory expiry:** ESAO Admin specifies the expiry timestamp; there is no fixed maximum duration
- **Renewal:** ESAO Admin atomically replaces the prior record with a new record/revision
- **Conversion:** A separate `AUTH-05` assignment atomically creates the active Director assignment and ends Temporary authority

### Hard Expiry Behavior
- When expiry timestamp reached, status automatically becomes `expired`
- Expired authority cannot be used; `AUTH-15` execution denies
- Must create new appointment (new record) to restore authority
- No grace period or automatic extension

### Authority Record Statuses
- `SCHEDULED`: valid future-effective record not yet executable
- `IN_FORCE`: record is within its effective boundary and eligible for resolution
- `REVOKED`: ended prospectively by an authorized revocation
- `EXPIRED`: ended automatically at its expiry timestamp
- `SUPERSEDED`: atomically replaced or corrected by a newer immutable revision
- `INVALIDATED`: permanently ended by eligibility or integrity failure
- `ENDED_ON_RETURN`: Acting record permanently ended by explicit Director return/resumption
- `CONVERTED`: Temporary record ended atomically when separate `AUTH-05` created the active Director assignment

Denied or failed attempts are immutable audit outcomes, not authority-record statuses.

---

## Relationship to Product Owner Decision 12

This resolution **amends Product Owner Decision 12 (2026-08-15)** as follows:

### Decision 12 Original Scope
- ESAO Admin-only lifecycle management under `AUTH-14`
- Acting requires documented inability evidence
- Temporary requires documented basis evidence
- Limited command scope: `AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`, approval portion of `AUTH-21`

### BLK-011 Amendments (2026-08-16)
- **Added:** School Director self-service appointment variant (`AUTH-14/DIRECTOR`) within the stable canonical `AUTH-14` command family
- **Added:** Reason dropdown/free text + optional upload (not formal SESAO order)
- **Clarified:** Command scope excludes `AUTH-21` entirely (original said "approval portion only" - now excluded to avoid complexity)
- **Clarified:** Evidence format and storage method (hybrid application record + optional upload)
- **Preserved:** ESAO Admin oversight capability, limited command scope, deterministic resolution order, zero-or-one active Director invariant

### Historical Integrity
- Decision 12 governance documentation remains as historical evidence
- This resolution record supersedes Decision 12 for implementation purposes
- The approved hybrid model is the current live authority model

---

## Decision Summary (YAML Format)

```yaml
acting_director_authority:
  paths:
    - path: director_self_service
      command_family: AUTH-14
      command_variant: DIRECTOR
      actor: Active School Director
      eligible_subjects:
        - Finance Officer (same school)
        - School Admin (same school)
        - Future: Vice Director, other authorized delegates
      evidence:
        reason: 
          type: fixed_reason_code
          required: true
          dropdown_options:
            - MEDICAL_LEAVE
            - OFFICIAL_TRAVEL
            - PERSONAL_LEAVE
            - OTHER
          other_explanation_required: true
          standard_reason_details_optional: true
        document_upload:
          required: false
          optional: true
      command_scope:
        - AUTH-09
        - AUTH-11
        - AUTH-12
        - AUTH-18
      excluded_commands:
        - AUTH-19
        - AUTH-21
        - AUTH-34
        - AUTH-35
        - AUTH-38
      duration: no_fixed_limit
      mandatory_expiry: false
      active_director_execution_while_in_force: denied_for_AUTH_09_11_12_18_until_explicit_return
      revocation:
        - appointing_director_anytime
        - esao_admin_anytime_passive_oversight
        - permanent_end_when_director_returns
        - permanent_end_when_active_director_removed_or_replaced
        - permanent_invalidation_on_subject_eligibility_loss
      director_return_trigger: explicit_authenticated_lifecycle_event_by_appointing_director_or_esao_admin
      implicit_return_triggers: none
      replacement: atomic_end_previous_and_activate_replacement
      correction: atomic_supersede_with_immutable_revision
    
    - path: esao_admin_management
      command_family: AUTH-14
      command_variant: ESAO
      actor: ESAO Admin
      use_cases:
        - review_and_revoke_director_created
        - create_when_director_unavailable
        - replace_renew_appointments
      evidence: same_as_director_path
      command_scope: same_as_director_path
      duration: esao_admin_specifies
      mandatory_expiry: false
      revocation: esao_admin_anytime
      replacement: atomic_end_previous_and_activate_replacement
      correction: atomic_supersede_with_immutable_revision

temporary_director_authority:
  command_family: AUTH-14
  command_variant: TEMP
  actor: ESAO Admin only
  when_used:
    - no_active_school_director
    - active_acting_resolution_fails
  eligible_subjects:
    - Finance Officer (same school)
    - School Admin (same school)
    - Future: Vice Director, other authorized delegates
  evidence:
    basis_documentation:
      type: freetext
      required: true
      examples:
        - Position vacant - no active Director
        - Active Director suspended
        - Acting authority expired and Director unavailable
    document_upload:
      required: false
      optional: true
  command_scope:
    - AUTH-09
    - AUTH-11
    - AUTH-12
    - AUTH-18
  conversion_to_permanent: via_AUTH-05_separate_command
  conversion_atomicity: create_active_director_and_end_temporary_or_leave_temporary_unchanged
  duration: esao_admin_specifies_no_fixed_maximum
  mandatory_expiry: true
  revocation: esao_admin_anytime
  replacement: atomic_end_previous_and_activate_replacement
  correction: atomic_supersede_with_immutable_revision
  eligibility_loss: permanently_invalidates_requires_new_appointment

effective_director_authority_resolution:
  for_commands:
    - AUTH-09
    - AUTH-11
    - AUTH-12
    - AUTH-18
  resolution_order:
    1: valid_active_school_director
    2: valid_acting_authority_director_or_esao_created
    3: valid_temporary_authority_esao_created
    4: deny
  active_director_availability:
    separately_audited: true
    creation:
      AUTH-14/DIRECTOR: atomic_with_acting_creation_by_active_director
      AUTH-14/ESAO: atomic_with_acting_creation_by_esao_admin
      AUTH-14/TEMP: atomic_with_temporary_creation_when_active_director_exists_and_no_acting_holder
      zero_active_director: no_availability_record_required
      system_admin: prohibited
    acting_end_does_not_restore_availability: true
    restoration: explicit_authenticated_return_or_resumption_event
  overlap:
    cross_tier_records: allowed_only_when_precedence_resolves_one_effective_holder
    same_tier_multiple_valid_records: deny
    contradictory_state_or_multiple_effective_holders: deny
  
  for_other_director_commands:
    - AUTH-19
    - AUTH-21
    - AUTH-34
    - AUTH-35
    - AUTH-38
  resolution_order:
    1: valid_active_school_director_only
    2: deny_acting_temporary_excluded

evidence_storage:
  method: hybrid_application_record_plus_optional_upload
  required_fields_in_application:
    - authority_type
    - appointing_actor_identity
    - subject_identity
    - school
    - reason_required
    - command_scope
    - effective_start
    - expiry_revocation_when_applicable
    - status
    - immutable_record_integrity_digest
    - active_director_availability_reference_when_applicable
  optional_upload:
    - document_pdf_image
    - separate_content_hash_sha256
    - export_category_internal_authorization
  p0_07_effect: downstream_reconciliation_required_without_reopening_or_completing_p0_07

renewal_and_expiry:
  acting_director_created:
    mandatory_expiry: false
    automatic_renewal: false
    renewal_method: director_creates_new_record
  
  acting_esao_created:
    expiry: optional
    renewal_method: esao_admin_creates_new_record
  
  temporary:
    expiry: mandatory
    renewal_method: esao_admin_creates_new_record
    conversion: via_AUTH-05_to_permanent_director
  
  hard_expiry_behavior:
    - status_becomes_expired
    - AUTH-15_execution_denies
    - must_create_new_appointment
    - no_grace_period

authority_record_statuses:
  - SCHEDULED
  - IN_FORCE
  - REVOKED
  - EXPIRED
  - SUPERSEDED
  - INVALIDATED
  - ENDED_ON_RETURN
  - CONVERTED
failed_or_denied_attempts: audit_outcomes_not_record_statuses

authentication_and_audit:
  lifecycle_actions:
    fresh_reauthentication: required
    structured_reason: required
    authorization_revision_update: required
    integrity_digest: required
    immutable_audit_event: required
  AUTH-15: inherits_underlying_command_authentication_evidence_and_sod
```

---

## Implementation Impact

### Tasks Potentially Unblocked After Governance Reconciliation
- `P0-04` may complete only after the canonical Matrix and full closure audit reconcile this approved model
- `P0-10` and `P0-GATE` may remove the BLK-011 dependency only after that reconciliation is durably verified
- `P1-04`, `P1-06`, and `P1-16` may incorporate the model only through separately claimed implementation tasks after their governance dependencies are complete

### Required Implementation Work
1. Update P0-04 Authorization Matrix to define `AUTH-14/DIRECTOR`, `AUTH-14/ESAO`, and `AUTH-14/TEMP` actor-specific variants within the existing `AUTH-14` row
2. Update `AUTH-15` to reference the `AUTH-14` variants
3. Define reason dropdown values in policy configuration
4. Design Acting/Temporary authority database schema (Prisma models)
5. Implement Director self-service appointment UI/API
6. Implement ESAO Admin Acting/Temporary management UI/API
7. Implement effective Director Authority resolution logic for `AUTH-09/11/12/18`
8. Update audit logging to capture Acting/Temporary lifecycle events
9. Add Acting/Temporary authority to P0-07 export categories
10. Update authorization tests to cover all resolution paths

---

## Closure Conditions Met

BLK-011 required the following decisions, now resolved:

| Decision | Resolution |
| --- | --- |
| Acting Director evidence type | Reason dropdown/free text (required) + optional document upload; no formal SESAO order |
| Temporary Director evidence type | Basis free text (required) + optional document upload |
| Acting appointment authority | Active School Director (self-service) OR ESAO Admin |
| Temporary appointment authority | ESAO Admin only |
| Valid inability reasons | Any documented reason (medical, travel, personal, other) - free text or dropdown |
| Valid temporary basis | No active Director, Acting unavailable/invalid/expired, documented in free text |
| Evidence storage | Hybrid: application record (required fields) + optional upload |
| Validation approach | System validates same-school, overlap, expiry; actors validate completeness |
| Renewal rules | New appointment record required; no automatic renewal |
| Expiry rules | Optional for Director-created or ESAO-created Acting; mandatory for Temporary; every expiry is hard with no grace period |
| Replacement/conversion | Acting and Temporary replacement is atomic; `AUTH-05` conversion atomically creates the active Director and ends Temporary authority |
| Director return | Permanently ends the Acting record; no automatic reactivation |
| Temporary subject scope | Active same-School Finance Officer or School Admin; future account types remain undefined |
| Return trigger | Explicit authenticated lifecycle event by the appointing Director or ESAO Admin; login and ordinary commands never imply return |
| Eligibility loss | Membership/account suspension, School transfer, or eligible-role loss permanently invalidates the record; restoration requires a new appointment |
| Integrity evidence | Every immutable authorization record has an integrity digest; an optional upload has its own separate SHA-256 hash |
| Command identity | Stable canonical `AUTH-14` with `DIRECTOR`, `ESAO`, and `TEMP` variants rather than new top-level Matrix IDs |
| Acting execution boundary | Before a future start the Director remains executable; while Acting is in force, the named unavailable Director is denied `AUTH-09/11/12/18` until explicit return |
| Expiry | Optional for either Acting path; mandatory for Temporary, with no fixed maximum duration, grace period, or automatic extension |
| Person-level SoD | Payment self-approval, Daily Balance prepare/verify/approve conflicts, verifier self-assignment, and role-union bypass remain prohibited |
| Acting reason allowlist | `MEDICAL_LEAVE`, `OFFICIAL_TRAVEL`, `PERSONAL_LEAVE`, `OTHER`; `OTHER` requires explanatory text |
| Active Director Availability | Separate audited state; Acting end never restores availability automatically, and explicit return/resumption is required |
| Cross-tier overlap | Permitted only when precedence resolves exactly one effective holder; same-tier duplicates, contradictory state, or multiple effective holders deny |
| Correction | Atomically supersedes the prior record with a new immutable revision; failure leaves the prior record unchanged |
| P0-07 category | `INTERNAL-AUTHORIZATION` is fixed for records and optional attachments as a downstream reconciliation requirement; P0-07 is not reopened or completed here |
| Availability actor | Active Director or ESAO Admin records unavailability atomically through the applicable `AUTH-14` variant; System Admin is prohibited |
| Lifecycle statuses | `SCHEDULED`, `IN_FORCE`, `REVOKED`, `EXPIRED`, `SUPERSEDED`, `INVALIDATED`, `ENDED_ON_RETURN`, `CONVERTED`; denied attempts are audit outcomes |
| Authentication/audit | Every lifecycle action requires fresh reauthentication, structured reason, revision update, integrity digest, and immutable audit event |
| Closure boundary | Separately claimed governance reconciliation and full P0-04 closure audit are required before completion; no code implementation is authorized here |

---

## Final Status

**BLK-011: RESOLVED**

The exact authoritative appointment/organizational evidence type and validation rules have been specified. The hybrid model amends Decision 12 to allow School Director self-service appointment of Acting Director Authority with ESAO Admin passive oversight, while preserving ESAO Admin-only Temporary Director Authority management.

The evidence and lifecycle decisions are complete, but `AUTH-14`/`AUTH-15` implementation remains unauthorized until a separately claimed governance task reconciles the Matrix, Blueprint, glossary, ADR, checklist, research, and downstream contracts and the P0-04 closure audit passes.

---

## Evidence and References

- **Decision framework:** `docs/governance/p0-04-blk-011-evidence-decision-framework.md` (prepared 2026-08-16)
- **Decision session:** Interactive grilling with Product Owner, 2026-08-16
- **Related decisions:** Product Owner Decision 12 (2026-08-15), preserved as historical context
- **Authorization Matrix:** `docs/governance/p0-04-authorization-matrix.md` (to be updated)
- **BLK-003 Resolution:** `docs/research/P0-04 — BLK-003 Resolution Record.md` (historical)
- **ADR-0016:** Substitute School Director Authority (to be updated with hybrid model)

---

## Next Actions

1. **A separately claimed governance reconciliation task** must:
   - Update P0-04 Authorization Matrix with `AUTH-14/DIRECTOR`, `AUTH-14/ESAO`, and `AUTH-14/TEMP` variants under the stable canonical `AUTH-14` command
   - Mark BLK-011 as RESOLVED in DEVELOPMENT-CHECKLIST.md
   - Update or create new ADR documenting the hybrid model amendment
   - Create session note for BLK-011 resolution
   - Run the full P0-04 closure audit and update P0-04/P0-10/P0-GATE status only from durable verification evidence

2. **Future implementation tasks** (not part of BLK-011 resolution):
   - Design Prisma schema for Acting/Temporary authority records (P1-04)
   - Implement authorization resolution services (P1-06)
   - Build ESAO Admin and Director UIs for lifecycle management (P1-16)

No RBAC, schema, application, provider, configuration, or production implementation is authorized by this resolution or grilling session.
