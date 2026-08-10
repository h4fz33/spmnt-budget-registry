# SESAO Operational Policy Publication Under OBEC Governance

**Status:** accepted
**Date:** 2026-08-08
**Supersedes:** [ADR-0005](0005-obec-policy-publication-authority.md)

## Context

ADR-0005 assigned the in-application Policy Publisher role to OBEC. The project owner has clarified the operating model:

- OBEC remains the sponsor/accountable organization and the external governance-policy authority.
- OBEC does not directly operate this application.
- SESAO Narathiwat receives the unchanged OBEC policy and operates its lifecycle in SchoolBanchee for the complete 17-School population.
- The SESAO Internal Audit Unit is the organizational eligibility boundary for the Policy Publisher capability; its eligibility model is distinct from the separate SESAO Auditor appointment used for Audit Assessment Cycles.

The terms "policy source" and "Policy Publisher" were previously conflated. Without a distinction, the audit trail would incorrectly identify OBEC as the in-application actor or allow SESAO to be treated as the issuer of a new regulatory source.

## Decision

OBEC is the external Governing Policy Authority and source of policy evidence. It has no regular in-application Policy Publisher account or command role.

SESAO Narathiwat is the in-application Policy Publisher organization. A named, authenticated current holder designated in the approved Authorization Matrix and eligible through current official Internal Audit position/assignment evidence may:

- register an unchanged OBEC policy source and its evidence;
- set the policy's School scope and effective date within the approved SESAO Narathiwat boundary; and
- activate or supersede an auditable, non-overlapping Policy Version in SchoolBanchee.

This permission does not permit the SESAO to alter the original OBEC policy text, invent a source revision, bypass required source evidence, or mutate a School's canonical financial records. "All rights" in this decision means the enumerated in-application policy-lifecycle commands, not unrestricted financial or platform-administration access.

Policy publication remains audited and effective-dated. An authorized SESAO Policy Publisher may activate a Policy Version without a second-person approval or pre-activation review. Order 452/2568 establishes Internal Audit eligibility; the approved Authorization Matrix designates the current holder and standby alternate. Before designation or publication, verify the named person on the official SESAO Narathiwat Internal Audit Unit page and record the URL, retrieval timestamp, result, and conflict outcome. The separately approved scope is all 17 Schools affiliated with SESAO Narathiwat and is sourced from the official SESAO organizational information page, not Order 452/2568. The audit history retains actor, scope, source, effective date, and activation outcome. This decision does not introduce a delegation or fixed-expiry requirement. This exception is limited to policy activation and does not relax financial or membership segregation of duties.

ADR-0011 defines the designation mechanism: the Product Owner/accountable reviewer approves the Authorization Matrix designation of one current holder and one named standby alternate from eligible Internal Audit personnel. System Admin only applies the exact approved designation and evidence; the alternate receives no publication authority until updated evidence and designation atomically activate them and remove the prior holder.

## Consequences

- `Policy Publisher` now means a SESAO operational permission under OBEC governance, while the original issuer remains visible on every policy source and version.
- The P0-04 matrix assigns the Policy Publisher capability to the current Matrix-designated eligible Internal Audit holder and records that no independent reviewer is required before policy activation. The Product Owner approved the Matrix, scope, and current-status verification rule on 2026-08-10; command-specific evidence remains mandatory before privileged use.
- P0-02 retains OBEC and Ministry of Finance citations as regulatory/source authority; SESAO becomes the in-application applicability, scope, effective-date, and activation authority.
- School financial-record boundaries remain unchanged. The SESAO Auditor may review assigned Schools and policy evidence but does not gain silent record-mutation authority.
