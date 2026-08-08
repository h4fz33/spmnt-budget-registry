# SchoolBanchee Pilot Governance Charter

**Status:** approved
**Approved:** 2026-08-08
**Pilot:** all 17 schools in the supplied School Directory

## Accountable Organization

| Responsibility | Approved organization |
| --- | --- |
| Sponsor / accountable organization | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| Product owner | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| Policy Publisher | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| Accountable reviewer | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส (Secondary Educational Service Area Office Narathiwat) |
| ESAO Thai name | สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส |
| ESAO English name | Secondary Educational Service Area Office Narathiwat |
| ESAO code | `1000960001` |

The organization owns product, policy-publication, and review accountability for the pilot. Operational actions must be performed by named, authenticated users appointed to the applicable ESAO role. An organization label, typed name, or shared account is not approval evidence.

## Pilot School Boundary

All 17 schools in [`data/schools.csv`](../../data/schools.csv) are approved for the pilot:

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

Each School remains an independent financial reporting and audit boundary. ESAO oversight and aggregate reporting do not allow the ESAO to silently mutate a School's canonical financial records.

Adding or removing a pilot School requires an approved charter revision and an audited School Directory change. School names are display values; SMIS and MOE codes are the controlled identifiers and are imported as strings.

## Follow-Up Appointments and Decisions

This charter establishes organization-level accountability and pilot scope. It does not complete these later controls:

- `P0-02`: bind each pilot School to the exact effective OBEC/ESAO financial procedure and citations.
- `P0-04`: appoint named users to ESAO roles and approve the authorization/segregation-of-duties matrix.
- `P0-08`: approve PostgreSQL hosting, backup, recovery, connectivity, and key ownership.
- `P0-10`: approve registration identity proof, requestable roles, account recovery, and membership-review policy.

## Source of Approval

The sponsor, ownership, review responsibilities, all-17-school pilot scope, and official ESAO code `1000960001` were supplied by the project owner on 2026-08-08. The School list is validated from [`data/schools.csv`](../../data/schools.csv): 17 rows with unique, nonblank School names, SMIS codes, and MOE codes.
