# OBEC Policy Publication Authority

**Status:** superseded by ADR-0006
**Date:** 2026-08-08

## Context

The original P0-01 governance record assigned sponsorship, product ownership, policy publication, and accountable review to the Secondary Educational Service Area Office Narathiwat. The project owner has amended that authority split:

- Sponsor / accountable organization: `สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน` (Office of Basic Education Committee, OBEC).
- Product owner: `สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส` (Secondary Educational Service Area Office Narathiwat).
- Policy Publisher(s): OBEC.
- Accountable reviewer: SESAO Narathiwat.

Policy publication controls the effective-dated rules used by financial events. Treating the ESAO Product Owner as the publisher would allow an organization boundary to silently imply publication authority, so the distinction must be explicit in the domain, authorization matrix, and implementation blueprint.

## Decision

OBEC is the sponsor/accountable organization and the authority whose named, authenticated Policy Publisher(s) activate approved Policy Versions. SESAO Narathiwat remains the pilot Product Owner and accountable reviewer. School users and ordinary ESAO roles do not activate Policy Versions unless a separate OBEC appointment explicitly grants that authority.

Policy publication remains audited, effective-dated, non-overlapping, and subject to the actor/approver/reviewer segregation rules approved in later Phase 0 policy work. This decision changes authority ownership only; it does not change the 17-school boundary, ESAO code, financial record model, or membership-review boundaries.

## Consequences

- Authorization and policy-resolution design must represent OBEC policy-publication scope separately from SESAO school oversight and review scope.
- The P0-04 matrix must name OBEC Policy Publisher(s), the OBEC approval path, and the SESAO accountable reviewer.
- P0-02 source-baseline requests are directed to OBEC Policy Publisher(s), with SESAO Narathiwat accountable review/countersignature where appropriate.
- Historical P0-01 evidence remains valid as a record of the prior approved state; the amended charter and amendment session are the current state.
