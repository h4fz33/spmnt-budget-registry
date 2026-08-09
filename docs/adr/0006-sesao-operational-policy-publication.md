# SESAO Operational Policy Publication Under OBEC Governance

**Status:** accepted
**Date:** 2026-08-08
**Supersedes:** [ADR-0005](0005-obec-policy-publication-authority.md)

## Context

ADR-0005 assigned the in-application Policy Publisher role to OBEC. The project owner has clarified the operating model:

- OBEC remains the sponsor/accountable organization and the external governance-policy authority.
- OBEC does not directly operate this application.
- SESAO Narathiwat receives the unchanged OBEC policy and operates its lifecycle in SchoolBanchee for the complete 17-School population.
- The SESAO Auditor is the highest operational governance and oversight role in the application hierarchy, followed by School Director, Finance Officer, and other authorized users.

The terms "policy source" and "Policy Publisher" were previously conflated. Without a distinction, the audit trail would incorrectly identify OBEC as the in-application actor or allow SESAO to be treated as the issuer of a new regulatory source.

## Decision

OBEC is the external Governing Policy Authority and source of policy evidence. It has no regular in-application Policy Publisher account or command role.

SESAO Narathiwat is the in-application Policy Publisher organization. A named, authenticated SESAO Auditor granted the `Policy Publisher` permission may:

- register an unchanged OBEC policy source and its evidence;
- set the policy's School scope and effective date within the approved SESAO Narathiwat boundary; and
- activate or supersede an auditable, non-overlapping Policy Version in SchoolBanchee.

This permission does not permit the SESAO to alter the original OBEC policy text, invent a source revision, bypass required source evidence, or mutate a School's canonical financial records. "All rights" in this decision means the enumerated in-application policy-lifecycle commands, not unrestricted financial or platform-administration access.

Policy publication remains audited and effective-dated. An authorized SESAO Policy Publisher may activate a Policy Version without a second-person approval or pre-activation review. P0-04 cannot close until formal appointment evidence identifies the current holder and alternate, and the audit history retains actor, scope, source, effective date, and activation outcome. This decision does not introduce a delegation or expiry requirement. This exception is limited to policy activation and does not relax financial or membership segregation of duties.

ADR-0011 defines the appointment mechanism: the Product Owner/accountable reviewer externally designates one active holder and one named standby alternate from active SESAO Auditors. System Admin only applies exact evidence; the alternate receives no publication authority until replacement evidence atomically activates them and removes the prior holder.

## Consequences

- `Policy Publisher` now means a SESAO operational permission under OBEC governance, while the original issuer remains visible on every policy source and version.
- The P0-04 matrix must assign the Policy Publisher permission to an appointed SESAO Auditor and record that no independent reviewer is required before policy activation. Formal evidence for the current holder and alternate remains required for P0-04 closure; remaining authorization values are recorded in the BLK-003 reconciliation record rather than inferred here.
- P0-02 retains OBEC and Ministry of Finance citations as regulatory/source authority; SESAO becomes the in-application applicability, scope, effective-date, and activation authority.
- School financial-record boundaries remain unchanged. The SESAO Auditor may review assigned Schools and policy evidence but does not gain silent record-mutation authority.
