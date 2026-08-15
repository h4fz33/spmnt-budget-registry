# SchoolBanchee Pilot Governance Charter

**Status:** approved
**Approved:** 2026-08-08
**Last amended:** 2026-08-14
**Pilot/testing scope:** the supplied 17-school directory is a synthetic/anonymized bootstrap testing scope, not a live deployment commitment or authorization to process real School data.

## Accountable Organization

| Responsibility | Approved organization |
| --- | --- |
| Private product owner / accountable infrastructure approver | Private Business / Product Owner |
| SESAO relationship | Non-binding testing partner and domain adviser; not product, infrastructure, or data-governance authority |
| Governing Policy Authority | สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (Office of Basic Education Committee) |
| Policy Publisher(s) in SchoolBanchee | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| Accountable product/infrastructure reviewer | Private Business / Product Owner |
| ESAO Thai name | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส |
| ESAO English name | Secondary Educational Service Area Office Narathiwat |
| ESAO code | `1000960001` |

Private Business owns product accountability, infrastructure approval, test-data governance, and risk acceptance for this private testing product. SESAO Narathiwat is a non-binding testing partner and domain adviser only; it does not approve product, infrastructure, security, retention, or data-governance decisions. OBEC remains the authoritative source of policy and reference-form material, not the software sponsor or infrastructure approver. Any application authorization model remains a product design boundary and must not be read as an external governmental appointment. The effective date of this boundary is 2026-08-14. Operational actions must be performed by named, authenticated users. An organization label, typed name, shared account, or unrelated role is not approval evidence.

OBEC is also the central authority for the common policy/form baseline used across participating ESAO branches. Supplied OBEC policies, manuals, and reference forms are authoritative implementation inputs for the 17-School pilot. A reference form branded for another ESAO is treated as an implementation of the common OBEC baseline unless its source expressly makes the layout or rule branch-specific; no separate Narathiwat provenance, applicability, issuer-confirmation, revision, or form-approval gate is imposed merely for that branding. Form fields and printed signature positions define documentary/evidence structure only. P0-03/P0-06 govern financial behavior and effective policy; P0-04 alone governs application commands and roles. See [ADR-0013](../adr/0013-obec-central-governance-and-authoritative-reference-forms.md).

## School-User Population Boundary

The 17 entries in [`data/schools.csv`](../../data/schools.csv) are retained as a synthetic/anonymized bootstrap test fixture. They are not a live School-user population, deployment commitment, or permission to ingest real School financial or personal data:

| School | SMIS code | MOE code |
| --- | --- | --- |
| นราธิวาส | `96012001` | `1096240348` |
| นราสิกขาลัย | `96012002` | `1096240349` |
| เฉลิมพระเกียรติกรมหลวงนราธิวาสราชนครินทร์ บางปอประชารักษ์ | `96012003` | `1096240350` |
| บาเจาะ | `96012004` | `1096240353` |
| ร่มเกล้า | `96012005` | `1096240354` |
| ตันหยงมัส | `96012006` | `1096240355` |
| รือเสาะชนูปถัมภ์ | `96012007` | `1096240356` |
| เรียงราษฏร์อุปถัมภ์ | `96012008` | `1096240357` |
| ศรีวารินทร์ | `96012009` | `1096240358` |
| ตากใบ | `96022001` | `1096240352` |
| เวียงสุวรรณวิทยาคม | `96022002` | `1096240359` |
| สุคิรินวิทยา | `96022004` | `1096240361` |
| สุไหงโกลก | `96022005` | `1096240362` |
| ธัญธารวิทยา | `96022006` | `1096240364` |
| มัธยมสุไหงปาดี | `96022007` | `1096240363` |
| สวนพระยาวิทยา | `96022008` | `1096240365` |
| บูกิตประชาอุปถัมภ์ | `96022010` | `1096240366` |

Each configured test School remains an independent financial reporting and audit boundary in the product model. SESAO Narathiwat may advise on domain behavior and participate in non-binding testing, but this creates no live operational, product, infrastructure, or data-governance authority.

Adding or removing a test fixture from the bootstrap scope requires an approved product change and an audited School Directory change. School names are display values; SMIS and MOE codes are controlled test identifiers and are imported as strings.

## Follow-Up Appointments and Decisions

This charter establishes private-product accountability and the bootstrap testing scope. It does not complete these later controls:

- `P0-02`: bind each pilot School to the exact effective OBEC/ESAO financial procedure and citations.
- `P0-04`: complete. Retain the Product Owner-approved Matrix and its operational evidence; before each Policy Publisher designation/publication, record the approved current-status check and scope evidence.
- `P0-08`: approve PostgreSQL hosting, backup, recovery, connectivity, and key ownership.
- `P0-10`: approve registration identity proof, requestable roles, account recovery, and membership-review policy.

## Authority Amendment

On 2026-08-08, the project owner amended the P0-01 authority assignments. This amendment supersedes the role assignments recorded in the original P0-01 session note while preserving that note as historical evidence. The amendment does not change the complete 17-school population boundary or the ESAO code.

On 2026-08-14, the project owner superseded the product-accountability and population interpretation: Private Business / Product Owner is the accountable product/infrastructure and test-data authority; SESAO is a non-binding testing partner/domain adviser; the 17-school directory is synthetic/anonymized test scope only; and real School financial or personal data is prohibited. See [ADR-0015](../adr/0015-private-product-testing-governance.md).

Later on 2026-08-08, the project owner superseded the prior in-application publisher assignment: OBEC is the external governance-policy authority, while SESAO Narathiwat receives unchanged OBEC policies and performs their in-application registration, scoping, effective dating, and activation. See [ADR-0006](../adr/0006-sesao-operational-policy-publication.md).

## Source of Approval

The original 2026-08-08 authority and population statements remain historical evidence. The authoritative 2026-08-14 private-product/testing boundary supersedes their product-owner, infrastructure-authority, and live-population interpretation without changing historical notes, P0-03/P0-04 behavior, or OBEC policy/form source authority. The School list remains validated from [`data/schools.csv`](../../data/schools.csv) as a 17-row synthetic/anonymized bootstrap fixture.
