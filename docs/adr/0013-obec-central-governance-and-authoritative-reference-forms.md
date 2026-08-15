# OBEC Central Governance And Authoritative Reference Forms

**Status:** accepted
**Date:** 2026-08-12

## Context

SchoolBanchee uses one common OBEC policy/form baseline across participating ESAO branches, including the 17-School SESAO Narathiwat pilot. Earlier P0-05 language risked treating source provenance, another ESAO's branding, or a completed transaction specimen as a prerequisite before an OBEC/reference form could define application structure.

## Decision

OBEC is the central governance authority. Supplied OBEC policies, manuals, and reference forms are authoritative implementation inputs and may directly define UI, form, report, registry, printed-signature, document, and evidence-capture structure. A form branded for another ESAO is treated as a reference implementation of the common OBEC baseline unless the source expressly defines the layout or rule as branch-specific. SchoolBanchee does not add a separate ESAO provenance, current-revision, applicability, issuer-confirmation, or form-approval gate merely to use that structure.

Document structure does not grant application authority. Printed signatures, titles, committees, inspectors, approvers, and recipients remain documentary/evidence fields. P0-03 controls Fund Flow and financial behavior, P0-04 controls application roles and command authorization, and P0-06 resolves effective behavior through the active Policy Version. Completed/anonymized transaction documents are acceptance evidence, not prerequisites for recognizing an authoritative form structure.

## Consequences

- UI and report work may start from the P0-05-mapped OBEC/reference structures without a second ESAO form-approval workflow.
- Forms cannot create a Temporary/Acting Director, substitute approver, generic role, or permission outside P0-04.
- A genuine missing OBEC form/rule remains a blocker. P0-05 `GAP-08` was later resolved by the supplied 2515-1/2/3 package, Product Owner contract, P0-04 amendment, and `POL-GAP-08-SAR-001`; `BLK-004` remains a separate audit-policy question governed through an applicable Policy Version.
- ADR-0006 continues to govern ESAO operational publication of unchanged OBEC policy. This decision adds no second policy authority or generic form/provenance administration platform.
