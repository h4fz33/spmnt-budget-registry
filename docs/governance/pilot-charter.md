# SchoolBanchee Pilot Governance Charter

**Status:** approved
**Approved:** 2026-08-08
**Last amended:** 2026-08-12
**Pilot and school-user population:** all 17 schools in the supplied School Directory; this is the project's complete current school-user population, not a sample subset.

## Accountable Organization

| Responsibility | Approved organization |
| --- | --- |
| Sponsor / accountable organization | สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (Office of Basic Education Committee) |
| Product owner | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| Governing Policy Authority | สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (Office of Basic Education Committee) |
| Policy Publisher(s) in SchoolBanchee | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| Accountable reviewer | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| ESAO Thai name | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส |
| ESAO English name | Secondary Educational Service Area Office Narathiwat |
| ESAO code | `1000960001` |

The Office of Basic Education Committee owns sponsorship/accountability and external governance-policy authority for the pilot. The Secondary Educational Service Area Office Narathiwat owns product delivery, accountable audit/oversight review, and the in-application Policy Publisher function for unchanged OBEC policies across the complete 17-school population. Order 452/2568 establishes Policy Publisher eligibility; the approved Authorization Matrix designates the current holder and standby alternate. Before designation or publication, the official SESAO Internal Audit Unit page is checked and its URL, retrieval timestamp, named-person result, and conflict outcome recorded. The approved 17-school publication scope is sourced from the official SESAO organizational information page and is not attributed to Order 452/2568. A designated current holder may register the source, set scope/effective date, and activate a Policy Version; that function does not permit source-text changes or School financial-record mutation. The canonical command matrix is `docs/governance/p0-04-authorization-matrix.md`. P0-04 is complete under the Product Owner-approved School Director-only model: each School has zero or one active School Director, and Director-required commands deny when no active holder exists. Operational actions must be performed by named, authenticated users. An organization label, typed name, shared account, or unrelated role is not approval evidence.

OBEC is also the central authority for the common policy/form baseline used across participating ESAO branches. Supplied OBEC policies, manuals, and reference forms are authoritative implementation inputs for the 17-School pilot. A reference form branded for another ESAO is treated as an implementation of the common OBEC baseline unless its source expressly makes the layout or rule branch-specific; no separate Narathiwat provenance, applicability, issuer-confirmation, revision, or form-approval gate is imposed merely for that branding. Form fields and printed signature positions define documentary/evidence structure only. P0-03/P0-06 govern financial behavior and effective policy; P0-04 alone governs application commands and roles. See [ADR-0013](../adr/0013-obec-central-governance-and-authoritative-reference-forms.md).

## School-User Population Boundary

All 17 schools in [`data/schools.csv`](../../data/schools.csv) are approved for the pilot and constitute the project's complete actual school-user population:

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

Each School remains an independent financial reporting and audit boundary. SESAO Narathiwat is the audit/oversight unit for the complete school-user population and may aggregate or review reports, but it does not own or silently mutate a School's canonical financial records.

Adding or removing a School from the pilot and actual school-user population requires an approved charter revision and an audited School Directory change. School names are display values; SMIS and MOE codes are the controlled identifiers and are imported as strings.

## Follow-Up Appointments and Decisions

This charter establishes organization-level accountability and the actual school-user population scope. It does not complete these later controls:

- `P0-02`: bind each pilot School to the exact effective OBEC/ESAO financial procedure and citations.
- `P0-04`: complete. Retain the Product Owner-approved Matrix and its operational evidence; before each Policy Publisher designation/publication, record the approved current-status check and scope evidence.
- `P0-08`: approve PostgreSQL hosting, backup, recovery, connectivity, and key ownership.
- `P0-10`: approve registration identity proof, requestable roles, account recovery, and membership-review policy.

## Authority Amendment

On 2026-08-08, the project owner amended the P0-01 authority assignments. This amendment supersedes the role assignments recorded in the original P0-01 session note while preserving that note as historical evidence. The amendment does not change the complete 17-school population boundary or the ESAO code.

Later on 2026-08-08, the project owner superseded the prior in-application publisher assignment: OBEC is the external governance-policy authority, while SESAO Narathiwat receives unchanged OBEC policies and performs their in-application registration, scoping, effective dating, and activation. See [ADR-0006](../adr/0006-sesao-operational-policy-publication.md).

## Source of Approval

The original sponsor, ownership, review responsibilities, all-17-school pilot scope, and official ESAO code `1000960001` were supplied by the project owner on 2026-08-08. The authority split was amended by the project owner on 2026-08-08; see the [P0-01 amendment evidence](../progress/sessions/2026-08-08_1922_codex_P0-01.md). The project owner further clarified that the same 17 schools are the complete actual school-user population and that SESAO Narathiwat is their audit/oversight unit; see the [P0-02 scope clarification](../progress/sessions/2026-08-08_2145_codex_P0-02.md). The in-application publication authority was then amended as recorded in [ADR-0006](../adr/0006-sesao-operational-policy-publication.md) and the [P0-01 publication-authority amendment](../progress/sessions/2026-08-08_2230_codex_P0-01.md). The School list is validated from [`data/schools.csv`](../../data/schools.csv): 17 rows with unique, nonblank School names, SMIS codes, and MOE codes.
