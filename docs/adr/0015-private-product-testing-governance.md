# Private Product Testing Governance Boundary

**Status:** accepted
**Date:** 2026-08-14

Effective 2026-08-14, SchoolBanchee is a private Business product prepared for non-binding testing with SESAO Narathiwat. Private Business / Product Owner owns product scope, infrastructure approval, test-data governance, and risk acceptance; SESAO is only a testing partner and domain adviser; OBEC remains authoritative for policy and reference-form source material but is not the product or infrastructure approver. The bootstrap test scope uses synthetic/anonymized data only, prohibits real School financial or personal data, and treats the 17-school directory as a test fixture rather than a live deployment commitment.

**Consequences**

- P0-08 authority labels must name the Private Business accountable Product/Infrastructure Owner; no provider, region, operator, RPO/RTO, key owner, backup service, or restore owner is selected by this ADR.
- Existing P0-03/P0-04 financial and application-authorization behavior is unchanged.
- Historical session notes and superseded decisions remain historical records.
