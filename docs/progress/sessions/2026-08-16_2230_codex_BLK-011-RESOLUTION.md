# BLK-011 Resolution Session

**Session:** 2026-08-16 22:30  
**Owner:** Product Owner + Codex  
**Primary task:** BLK-011 resolution  
**Status:** RESOLVED - Hybrid Acting/Temporary Authority Model approved

---

## Objective

Resolve BLK-011 by obtaining Product Owner decisions on exact authoritative appointment/organizational evidence type and validation rules for Acting and Temporary Substitute Director Authority.

---

## Context

BLK-011 blocked P0-04, P0-10, P0-GATE, P1-04, P1-06, and P1-16 because Product Owner Decision 12 (2026-08-15) approved the Substitute School Director Authority governance model but did not specify:
- What document type proves Acting/Temporary appointments
- What constitutes valid inability/temporary basis
- Storage and validation rules
- Renewal and expiry behavior

Without these specifications, `AUTH-14` (manage substitute authority) and `AUTH-15` (exercise substitute authority) could not be implemented.

---

## Decision Process

### Interactive Grilling Session

Conducted interactive question-and-answer session with Product Owner to understand:
1. Current real-world practice at schools
2. Governance intent for pilot
3. Evidence formality requirements
4. Operational constraints

### Key Discovery

Product Owner revealed that **real-world practice** at schools differs from Decision 12:
- Active School Directors can appoint Acting Directors immediately from school accounts
- Reason only, no formal evidence required
- No SESAO reporting or approval gate
- Operational necessity for fast delegation when Director unavailable

### Governance Choice

Presented three options:
- **Option 1:** Amend to full Director self-service (matches practice, less oversight)
- **Option 2:** Keep Decision 12 as-is (ESAO Admin only, stronger controls)
- **Option 3:** Hybrid - Director self-service with ESAO Admin passive oversight

**Product Owner selected Option 3 (Hybrid)**

---

## Decisions Made

### Acting Director Authority - Two Paths

**Path A: School Director Self-Service (`AUTH-14-DIRECTOR`)**
- Active School Director can appoint Acting immediately
- Eligible subjects: School accounts (Finance Officer, School Admin, future: Vice Director)
- Evidence: Reason dropdown/free text (required) + optional document upload
- Command scope: Limited operational subset (`AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`)
- Duration: No fixed limit; Director or ESAO Admin can revoke anytime
- Oversight: ESAO Admin passive review (can see and revoke anytime)

**Path B: ESAO Admin Management (`AUTH-14-ESAO`)**
- ESAO Admin creates/revokes Acting authority
- Use cases: Oversight, correction, when Director unavailable
- Same evidence requirements and command scope

### Temporary Director Authority

**ESAO Admin Only (`AUTH-14-TEMP`)**
- When no active Director or Active/Acting cannot supply holder
- Evidence: Basis free text (required) + optional upload
- Same limited command scope
- Can convert to permanent Director via `AUTH-05`

### Command Scope Decision

**Limited operational subset only:**
- ✅ `AUTH-09` - Assign Daily Balance Verifier
- ✅ `AUTH-11` - Approve payment
- ✅ `AUTH-12` - Approve Official Advance
- ✅ `AUTH-18` - Approve/sign Daily Balance

**Excluded (active Director only):**
- ❌ `AUTH-19` - Monthly Close
- ❌ `AUTH-21` - Post-close Correction
- ❌ `AUTH-34` - Internal Transfer
- ❌ `AUTH-35` - SAR Assessor assignment
- ❌ `AUTH-38` - SAR Approval

### Evidence Requirements

**For all Acting/Temporary appointments:**
- **Required:** Reason (dropdown or free text)
  - Suggested dropdown: Medical Leave, Official Travel, Personal Leave, Other
- **Optional:** Document upload (PDF, image, etc.)
- **No formal SESAO order required**

### Storage and Validation

**Storage:** Hybrid (application record + optional upload)
- Required fields in database
- Optional evidence document with SHA-256 hash
- Export category: `INTERNAL-AUTHORIZATION`

**Validation:**
- System: same-school check, overlap detection, expiry check
- Actor: Director/ESAO Admin authority verification
- Completeness: required reason field present

### Duration and Renewal

**Acting (Director-created):**
- No mandatory expiry
- Continues until revoked or Director returns
- Renewal: create new record if desired

**Acting (ESAO-created):**
- ESAO Admin specifies period
- May include expiry date

**Temporary:**
- ESAO Admin specifies period (typically includes expiry)
- Can convert to permanent via `AUTH-05`

**Hard expiry:** No grace period; must create new appointment

---

## Resolution Document Created

**File:** `docs/governance/blk-011-resolution-record.md`

Comprehensive resolution record documenting:
- Complete hybrid model specification
- Evidence requirements and validation rules
- Storage and audit requirements
- Renewal and expiry behavior
- Relationship to Decision 12 (amendment)
- Implementation impact and unblocked tasks
- YAML decision summary

---

## Files Created

- `docs/governance/blk-011-resolution-record.md` - Complete resolution record
- `docs/progress/sessions/2026-08-16_2230_codex_BLK-011-RESOLUTION.md` - This session note

---

## Handoff to Codex Session 019fea82-49ed-7ae2-a8fd-8614817b0871

The resolution record is complete. The designated Codex session should now:

1. **Update P0-04 Authorization Matrix**
   - Add `AUTH-14-DIRECTOR` row (School Director self-service)
   - Add `AUTH-14-ESAO` row (ESAO Admin management)
   - Add `AUTH-14-TEMP` row (Temporary authority)
   - Update `AUTH-15` to reference new authority paths
   - Add command scope exclusions to `AUTH-19`, `AUTH-21`, `AUTH-34`, `AUTH-35`, `AUTH-38`

2. **Mark BLK-011 as RESOLVED in checklist**
   - Update status/resolution column
   - Reference resolution record
   - Update affected task dependencies

3. **Update or create ADR**
   - Document hybrid model amendment to Decision 12
   - Explain rationale (operational flexibility + oversight)
   - Record as superseding ADR-0016 or create new ADR-0017

4. **Verify unblocked tasks**
   - Confirm P0-04 can proceed to completion
   - Confirm P0-10 is no longer blocked by Acting/Temporary
   - Confirm P0-GATE can close with complete authority model

5. **Create completion session note**
   - Document matrix updates
   - Reference resolution record
   - List unblocked tasks

---

## Verification

- [x] Product Owner decisions obtained for all BLK-011 questions
- [x] Hybrid model fully specified (two Acting paths + Temporary)
- [x] Evidence requirements defined (reason + optional upload)
- [x] Command scope clarified (limited operational subset)
- [x] Storage and validation rules documented
- [x] Renewal and expiry behavior specified
- [x] Resolution record created with complete specification
- [x] YAML decision summary provided
- [x] Implementation impact and next actions documented

---

## Session Outcome

**BLK-011 is RESOLVED.**

The hybrid Acting/Temporary Director Authority model is approved and documented. School Directors can appoint Acting immediately for operational flexibility, while ESAO Admin retains passive oversight and management capability. Evidence requirements are specified (reason + optional upload), command scope is limited to operational commands only, and validation rules are defined.

Next session (019fea82-49ed-7ae2-a8fd-8614817b0871) can proceed with Authorization Matrix updates and checklist resolution.
