# BLK-011 Evidence Decision Framework
# Substitute School Director Authority - Evidence Type Specification

**Status:** HISTORICAL / SUPERSEDED 2026-08-16 by [BLK-011 Resolution Record](./blk-011-resolution-record.md)
**Blocker:** BLK-011  
**Decision authority:** Private Business / Product Owner  
**Purpose:** Preserve the pre-decision framework that informed BLK-011. It is not current authorization policy and must not be used as an implementation contract.

---

## Context

Product Owner Decision 12 (2026-08-15) approved the Substitute School Director Authority model with:
- Deterministic Active → Acting → Temporary precedence
- ESAO Admin-only lifecycle management under `AUTH-14`
- Limited command scope (`AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`, approval portion of `AUTH-21`)
- Fail-closed execution until evidence types are defined

**What's approved:** The authority model, lifecycle, command scope, and governance structure.

**What's missing:** The exact authoritative document/evidence type that proves:
1. Acting Director appointments (unavailable active Director + distinct Acting substitute + inability basis)
2. Temporary Director appointments (Temporary substitute + basis that Active/Acting cannot supply holder)

---

## Required Decisions

### Decision A: Acting Director Authority Evidence

**Question:** What is the exact authoritative document or organizational record that proves Acting Director Authority?

**Required elements:**
- Document type/name (e.g., "Acting Director Appointment Order", "Temporary Assignment Letter", organizational memo, email from authorized official)
- Issuing authority (who can issue this document?)
- Must identify: unavailable active School Director (by name/position)
- Must identify: distinct named Acting substitute
- Must document: inability/unavailability reason or basis
- School scope
- Effective period (start date, expiry/termination)
- Command scope (which Director-required commands this appointment covers)

**Options for consideration:**

**Option A1: SESAO-issued Acting Director Appointment Order**
- Formal order/memorandum issued by SESAO authorized official
- Contains all required elements listed above
- Signed/stamped by authorized SESAO administrator
- Validation: verify issuer authority, completeness, School match, no overlap

**Option A2: School-issued Acting Assignment with SESAO Acknowledgment**
- School issues acting assignment document
- SESAO acknowledges/approves through reply or endorsement
- Validation: verify both School issuance and SESAO acknowledgment

**Option A3: Email/Digital Record from Authorized SESAO Official**
- Email or digital record from identified SESAO official
- Contains all required elements
- Validation: verify sender authority, completeness, authenticity

**Option A4: External Governmental Appointment Record**
- Ministry or higher authority appointment document
- SESAO forwards/registers the appointment
- Validation: verify external source, SESAO registration

**Option A5: Other (specify)**

**Selected option:** _______________

**Validation rules:**
- How is issuer authority verified?
- What fields are mandatory?
- What constitutes "inability" (illness, travel, leave, suspension, investigation)?
- How is authenticity verified?
- What happens if evidence is incomplete or ambiguous?

---

### Decision B: Temporary Director Authority Evidence

**Question:** What is the exact authoritative document or organizational record that proves Temporary Director Authority?

**Required elements:**
- Document type/name
- Issuing authority
- Must identify: named Temporary substitute
- Must document: basis that Active/Acting resolution cannot supply a holder (including zero active Director scenario)
- School scope
- Effective period (start date, expiry)
- Command scope

**Options for consideration:**

**Option B1: SESAO-issued Temporary Director Designation**
- Formal order/memorandum from SESAO
- Explicitly states no active/acting Director available or active/acting resolution fails
- Names Temporary substitute
- Validation: verify completeness, no active/acting conflict

**Option B2: Emergency Temporary Assignment (Short Duration)**
- Specific document type for urgent/emergency scenarios
- Limited duration (e.g., max 30/60/90 days)
- Must document why Active/Acting unavailable
- Validation: verify urgency basis, duration limits

**Option B3: Same as Acting (no distinction)**
- Use same evidence type as Acting
- Distinguish only by content: Acting identifies unavailable active Director; Temporary states Active/Acting cannot supply holder
- Validation: ensure correct classification based on content

**Option B4: Other (specify)**

**Selected option:** _______________

**Validation rules:**
- What constitutes valid "basis that Active/Acting cannot supply holder"?
- How is zero-active-Director scenario documented?
- What if an Acting appointment exists but is invalid/expired?
- Maximum duration allowed?
- Renewal process?

---

### Decision C: Inability/Unavailability Basis

**Question:** What specific reasons constitute valid "inability" or "unavailability" for Acting authority?

**Options:**
- [ ] Medical leave (requires medical certificate?)
- [ ] Official travel/assignment elsewhere
- [ ] Suspension pending investigation
- [ ] Extended personal leave
- [ ] Position vacant (active Director resigned/transferred)
- [ ] Active Director present but conflicted (financial interest in specific transaction)
- [ ] Other: _______________

**Documentation required:**
- Supporting evidence needed? (medical cert, travel order, suspension notice, etc.)
- Or is the appointment document self-sufficient?

---

### Decision D: Temporary Basis Documentation

**Question:** What specific scenarios constitute valid "basis that Active/Acting resolution cannot supply a holder"?

**Options:**
- [ ] No active School Director appointed (position vacant)
- [ ] Active Director position filled but holder is suspended/removed
- [ ] Acting authority exists but is invalid/expired
- [ ] Acting authority exists but acting substitute also unavailable
- [ ] Extended vacancy (position vacant > X days)
- [ ] Other: _______________

**Documentation required:**
- Must the appointment document explicitly state which scenario applies?
- Supporting evidence needed?

---

### Decision E: Evidence Storage and Verification

**Question:** Where and how are these appointment documents stored and verified?

**Options:**

**E1: Application upload/attachment**
- ESAO Admin uploads document as PDF/image when creating `AUTH-14` record
- System stores document reference and content hash
- Audit log records upload actor, timestamp, hash

**E2: External reference only**
- ESAO Admin enters document reference number/ID and date
- Physical/external document remains outside system
- System records reference metadata only

**E3: Hybrid**
- Document reference recorded (number, date, issuer)
- Optional upload for convenience
- External document remains authoritative

**Selected option:** _______________

**Verification workflow:**
- [ ] ESAO Admin verifies evidence before creating `AUTH-14` record
- [ ] System Admin separately verifies? (Y/N)
- [ ] Product Owner approval required for each appointment? (Y/N)
- [ ] Audit verification during periodic review? (Y/N)

---

### Decision F: Expiry and Renewal

**Question:** How are appointments renewed, and what evidence is required?

**Renewal approach:**
- [ ] New appointment document required (creates new `AUTH-14` record/revision)
- [ ] Extension document references original appointment
- [ ] Automatic renewal if basis persists (requires periodic revalidation)

**Maximum duration:**
- Acting: _______ days/months (or no limit if inability persists)
- Temporary: _______ days/months

**Expiry handling:**
- [ ] Hard expiry (authority ends automatically on expiry date)
- [ ] Grace period for renewal (how many days?)
- [ ] Must explicitly revoke even if expired

---

## Decision Summary Template

Once decisions are made, complete this summary:

```yaml
acting_director_evidence:
  document_type: "_______________"
  issuing_authority: "_______________"
  required_fields:
    - unavailable_active_director_name
    - acting_substitute_name
    - inability_basis
    - school
    - effective_period
    - command_scope
  inability_valid_reasons:
    - "_______________"
    - "_______________"
  storage_method: "_______________"
  validation_rules: "_______________"

temporary_director_evidence:
  document_type: "_______________"
  issuing_authority: "_______________"
  required_fields:
    - temporary_substitute_name
    - basis_for_temporary
    - school
    - effective_period
    - command_scope
  temporary_valid_basis:
    - "_______________"
    - "_______________"
  storage_method: "_______________"
  validation_rules: "_______________"

renewal_rules:
  approach: "_______________"
  acting_max_duration: "_______________"
  temporary_max_duration: "_______________"
  expiry_handling: "_______________"
```

---

## Recommended Approach (for consideration only)

**Recommendation:** Start with the simplest verifiable approach:

1. **Evidence type:** SESAO-issued appointment order or memo (can be digital/email)
2. **Required fields:** All elements listed in Decision A/B
3. **Storage:** External reference + optional upload (hybrid approach)
4. **Inability basis:** Any documented reason making active Director unable to perform the specific command
5. **Temporary basis:** Explicitly state "no active Director" or "acting authority unavailable/invalid"
6. **Validation:** ESAO Admin verifies completeness before creating `AUTH-14` record; system validates structure/non-overlap
7. **Renewal:** New appointment document required (creates new record/revision)
8. **Duration:** No hard maximum; effective period stated in each appointment

**Rationale:** Balances formality (SESAO authority), flexibility (various inability reasons), and auditability (explicit documentation).

---

## Next Steps

1. **Product Owner reviews this framework**
2. **Product Owner makes decisions A through F**
3. **Decisions recorded in governance as BLK-011 Resolution**
4. **P0-04 Authorization Matrix updated with evidence requirements**
5. **BLK-011 marked RESOLVED**
6. **Implementation task can design `AUTH-14`/`AUTH-15` with known evidence contract**

---

## Questions for Product Owner

Before making final decisions, consider:

1. Does SESAO have existing appointment/acting assignment procedures we should follow?
2. Are there legal/regulatory requirements for acting/temporary authority in educational institutions?
3. What level of formality is appropriate for the 17-school pilot vs. future expansion?
4. Should the evidence requirements be strict (detailed validation) or flexible (trust ESAO Admin judgment)?
5. Are there examples of past acting/temporary assignments we can reference?
