# P0-06 Initial Effective-Dated Policy Catalogue

**Status:** ACTIVE initial pilot Policy Version under `AUTH-22`
**Prepared:** 2026-08-12
**Scope:** All 17 SESAO Narathiwat Schools in the approved pilot boundary
**Policy source authority:** OBEC source evidence; operationally activated by the Matrix-designated SESAO Narathiwat Policy Publisher
**Inputs:** `docs/governance/p0-03-fund-flow-record-matrix.md`, `docs/governance/p0-04-authorization-matrix.md`, `BLUEPRINT.md`, `reseach/CONTEXT.md`, and approved P0-03/P0-04 decisions

## Catalogue Boundary

This catalogue translates approved governance decisions into effective-dated policy records. It does not alter source text, create an external appointment, grant a role, or implement application/RBAC code. Each record must be activated as a Policy Version by the current Policy Publisher through `AUTH-22` before it becomes executable policy.

Until activation, missing, tied, overlapping, out-of-scope, or unsupported policy resolution fails closed. Historical Financial Events retain the Policy Version resolved at posting time; later activation supersedes future applicability only.

## Version Envelope

| Field | Initial value |
| --- | --- |
| Policy Version ID | `POL-INITIAL-PILOT-001` |
| Status | `ACTIVE` |
| Effective start | `2026-08-12T00:00:00+07:00` from `INITIAL_POLICY_EFFECTIVE_START` |
| Effective end | Open-ended until superseded by a later Policy Version; no direct retirement |
| Organization scope | SESAO Narathiwat organization `1000960001` |
| School scope | All 17 approved SESAO Narathiwat Schools; no expansion or arbitrary School selection |
| Fiscal baseline | B.E. 2515 school subunit-accounting procedure, as confirmed for the complete 17-School population on 2026-08-08 |
| General overlay | Ministry of Finance B.E. 2562 where applicable and source-backed |
| Publisher | Matrix-designated current Policy Publisher under `AUTH-08`; standby cannot activate |
| Accountable reviewer | SESAO Narathiwat (legal entity) |
| Source immutability | Source text is referenced and integrity-recorded; it is never edited by publication |

## Activation Evidence

| Field | Recorded value |
| --- | --- |
| Activation record | `data/policy-bootstrap/POL-INITIAL-PILOT-001.activation.json` |
| Activation record SHA-256 | `8D4DE8E325E2E688F40C65AA3710AA398F0B5700D9B2A726F91881227FB08F11` |
| Activation authority | `AUTH-22`; current Policy Publisher นางบังอร วันริโก, application identity `96010001001` / `a96010001001` |
| Technical executor | Sealed initial-policy bootstrap CLI; no Policy Administration UI/workflow |
| School scope | `data/schools.csv`, SHA-256 `9AD9FE0F7BC05A529B6B60A57BF238456853A865FD52B38A9A337FE6B0A74EAF`, 17 unique Schools |
| Source integrity | `reseach/manual_2515.md` `2E0244DDE33CB251A7899A21AD993A34D3086C6D6DF5B964A43242465A0F9223`; `reseach/state-income remittance.md` `F35F68DFE9AD766F6D1E0A70CAE86FB7C5CA62D2D537D8139DB22F99CB0832ED`; `reseach/FF-14 Internal money transfer.md` `FEED6B09D08ED726D3DF90778649B27CF6BD1AEEC360844C57638B1C7832EB37` |
| Non-overlap validation | `PASS`; no different ACTIVE Policy Version covers organization `1000960001` and the all-17-School bootstrap scope/domain |
| Audit event | `POLICY_VERSION_ACTIVATED`, outcome `SUCCESS`, no duplicate event on identical rerun |

## Policy Record Contract

Every catalogue rule requires these fields before activation:

`policy_rule_id`, `policy_version_id`, `fund_flow` or command, `scope`, `effective_start`, `effective_end` or supersession link, `source_reference`, `source_revision_or_hash`, `required_documents/evidence`, `cashbook_behavior`, `approval/SoD`, `partial_behavior`, `due_date_rule`, `validation_behavior`, `expected_example`, `publisher`, and `activation_audit_event`.

## Initial Rule Catalogue

| Rule ID | Applies to | Initial rule | Source citation | Evidence / validation | Expected example |
| --- | --- | --- | --- | --- | --- |
| `POL-FF-01` | `FF-01` Budget Direct-Payment Claim | Finance Officer records one claim under `AUTH-10`; no School cash, bank, budget-register receipt/payment, or Cashbook movement. | `manual_2515.md:79-82,142,148,591-602`; P0-03 `FF-01`; `AUTH-10` | Claim/request, procurement/source evidence, entitled payee, transmission evidence; duplicate or unsupported partial claim denies. | A claim is posted to the Document-Request Registry while School cash remains unchanged. |
| `POL-FF-02` | `FF-02` Direct-Payment Confirmation | Finance Officer records one full confirmation linked to one originating claim; no School payment or Cashbook movement. | P0-03 `FF-02`; `manual_2515.md:79-82,142,148,591-602`; `AUTH-10` | Paying-authority confirmation, payee and authority reference; partial confirmation denies. | One complete paying-authority confirmation closes the claim's confirmation state. |
| `POL-FF-03` | `FF-03` Retainable Non-Budgetary Receipt | Receipt increases the applicable School money position and canonical Non-Budgetary Registry; Cashbook cross-check required. | P0-03 `FF-03`; `manual_2515.md:87-94,146,511-520,604-608`; `AUTH-10` | Receipt Record, source evidence, and bank evidence where applicable; fund subtype must be policy-enabled. | An approved School Revenue receipt posts to the registry and one matching Cashbook cross-check. |
| `POL-FF-04` | `FF-04` Retainable Non-Budgetary Payment | Payment decreases the applicable fund; Payment Voucher is atomic; `AUTH-11` approval may resolve only to the valid explicitly scoped Effective Director Authority holder; Cashbook cross-check required. | P0-03 `FF-04`; `manual_2515.md:184-214,522-533,648-653,665-678`; `AUTH-11` | Approved activity/source evidence and Payment Voucher; no partial payment. | A full approved voucher posts registry, cash position, and one cross-check atomically. |
| `POL-FF-05` | `FF-05` State Income Receipt | Receipt increases State-Income Registry and creates remittance obligation; Cashbook cross-check required. | P0-03 `FF-05`; `manual_2515.md:79-85,144,253-255,572-574,654-658`; `AUTH-10` | Receipt/source/bank evidence; monthly rule and THB 10,000 cash threshold with three-following-working-day rule. | A state-income receipt remains outstanding until linked remittance. |
| `POL-FF-06` | `FF-06` State-Income Remittance | `AUTH-11` approval may resolve only to the valid explicitly scoped Effective Director Authority holder; allocation across receipts/liabilities is explicit. Electronic remittance uses next-working-day application control. | P0-03 `FF-06`; `manual_2515.md:247-259,658-663`; `reseach/state-income remittance.md`; `AUTH-11` | Treasury/ESAO/KTB evidence and Pay-in Slip; actual partial remittance is `NON_COMPLIANT_PARTIAL`, leaves outstanding balance, and enters `Needs Correction`. | A remittance allocated across two receipts posts one linked child and preserves each residual balance. |
| `POL-FF-07` | `FF-07/08` Contract Security | Contract Security is a separate custodial model. Receipt is routine under `AUTH-10`; return requires `AUTH-11` approval from only the valid explicitly scoped Effective Director Authority holder; full or evidenced partial release cannot exceed outstanding custody. | P0-03 `FF-07/08`; `manual_2515.md:94,146,570,604-623,642-647`; `AUTH-10/11` | Contract, payer, custody/deposit, release and entitled-payee evidence; child cannot be re-parented. | A THB 10,000 security return of THB 4,000 leaves THB 6,000 outstanding. |
| `POL-FF-08` | `FF-09/10` Withheld Tax | Withheld Tax is a separate custodial liability linked to gross payment. Recognition inherits originating approval; remittance uses `AUTH-11` approval from only the valid explicitly scoped Effective Director Authority holder. | P0-03 `FF-09/10`; `manual_2515.md:94,146,564,583`; `AUTH-11` | Form 4235, originating payment, Revenue Department remittance evidence; actual partial remittance is `NON_COMPLIANT_PARTIAL` with `Needs Correction`. | THB 1,000 withheld from a gross payment remains a liability until linked remittance. |
| `POL-FF-09` | `FF-11` Official Advance Disbursement | `AUTH-12` approval may resolve only to the valid explicitly scoped Effective Director Authority holder; prior-unsettled advance blocks new issue; one approved disbursement amount. | P0-03 `FF-11`; `manual_2515.md:129-133,216-222,684-714`; `AUTH-12` | Request, agreements, estimate, purpose/travel evidence; no unapproved increment or Cashbook entry. | A THB 5,000 advance creates Document Held as Money, not expense. |
| `POL-FF-10` | `FF-12/13` Advance Settlement | Finance Officer records one atomic settlement under `AUTH-10` containing accepted expense evidence, unused return, or both; no repeated partial submissions or second approval. | P0-03 `FF-12/13`; `manual_2515.md:711-728,730-734`; `AUTH-10` | Both agreement copies, accepted expense evidence, return evidence; total discharge cannot exceed outstanding advance. | THB 3,000 expense plus THB 2,000 returned settles a THB 5,000 advance atomically. |
| `POL-FF-11` | `FF-14` Internal Money-Position Transfer | `AUTH-34`: Finance Officer initiates only approved subtype; same Fund, atomic/net-zero; active School Director approval/acknowledgement only when this rule/source requires it; substitute authority is excluded; no Cashbook. | P0-03 `FF-14`; `manual_2515.md:129-133,150-155,609-640`; `reseach/FF-14 Internal money transfer.md`; `AUTH-34` | Deposit/withdrawal slip, passbook, paying-agency evidence; cross-School, cross-Fund, partial, duplicate, or generic transfer denies. | THB 2,000 moves from cash to bank in one Fund; total Fund balance remains THB 2,000. |

## Fund Catalogue Rules

1. Fund Class is policy-controlled and immutable to School administration.
2. The following immutable initial Fund Type/Subtype catalogue is the default for the pilot:

| Fund Type | Immutable default subtypes / constraint |
| --- | --- |
| General Subsidy - Free Education | Textbooks; Learning Equipment; Uniforms; Learner Development Activities; Per-Head Teaching Support; Basic Factors for Poor Students |
| General Subsidy - Other | Local Teacher/Personnel Support; Local Lunch Support; Lunch-Production Revolving Fund |
| Education Maintenance Fee | No additional default subtype |
| Donation | Unrestricted; Restricted Project; Scholarship; Construction/Improvement |
| School Revenue | Premises/Canteen Rental; Activity Income; Service Income; Contract-Breach Penalty |
| Student Loan Operating Fund | No additional default subtype |
| Scout | No additional default subtype |
| Girl Guide | No additional default subtype |
| Red Cross Youth | No additional default subtype |
| EEF | Restricted by approved grant, cycle, and beneficiary overlay |
| State Income | Disposed Budget Asset; General-Subsidy Interest; Excess Budget Return; Prior-Year Budget Return |
| Contract Security / Withheld Tax | Custodial models, not locally extensible retainable funds |

3. School Admin may create or activate school-specific Fund Type/Subtype entries only under approved templates for General Subsidy - Other, Donation, and School Revenue.
4. Extensions inherit the approved Fund Flow, evidence, approval, deadline, partial, Cashbook, and custody behavior. They cannot override policy or create a generic `OTHER` class.
5. Contract Security and Withheld Tax are custodial models and are not locally extensible retainable funds.
6. EEF is conditionally enabled under `FF-03/04` only where the approved grant/cycle/beneficiary overlay applies. EEF unused-balance return remains disabled pending a separate approved rule.
7. Excess Budget Return and Prior-Year Budget Return are conditionally enabled under `FF-05/06` only where applicability, source, destination, deadline, evidence, and linkage are recorded; otherwise fail closed.

## Authorization And SoD Rules

- `AUTH-10` routine financial events require active Finance Officer membership and own-School scope.
- `AUTH-11` payment and remittance commands require the valid explicitly scoped Effective Director Authority holder where the Matrix row requires approval; Acting/Temporary authority is permitted only under the resolved `AUTH-14/15` contract.
- `AUTH-12` Official Advance issue requires the valid explicitly scoped Effective Director Authority holder and prior-unsettled checks; Acting/Temporary authority is permitted only under the resolved `AUTH-14/15` contract.
- `AUTH-34` is the only transfer command. It is not a generic privilege and cannot cross School or Fund boundaries.
- `AUTH-14` and `AUTH-15` use the resolved hybrid model and only the Matrix's explicit `AUTH-09`, `AUTH-11`, `AUTH-12`, and `AUTH-18` command scope. Unsupported subjects, commands, reasons/bases, state combinations, or multiple effective holders deny.
- No delegation, shared account, self-approval, source mutation, silent re-parenting, or unsupported command is permitted.

## Resolution And Activation

For each Financial Event, resolve exactly one active Policy Version by organization/School scope, Fund Flow, and effective date. A missing or tied result denies posting. Activation requires the current Policy Publisher under `AUTH-22`, strong re-authentication, unchanged OBEC source evidence, all-17-School scope, non-overlap validation, and an audit event. No second-person pre-activation approval is required by the approved Matrix.

## P0-06 Acceptance Checks

- Every rule has scope, effective-date fields, source citation, publisher, validation behavior, and expected example.
- All 14 P0-03 flows are represented; `FF-12/13` share the atomic settlement rule and `FF-07/08`, `FF-09/10` remain distinct child models.
- `AUTH-34` is the only FF-14 command boundary and has no generic transfer path.
- Director-required commands fail closed without a valid authorized holder. Acting/Temporary Effective Director Authority is limited to `AUTH-09/11/12/18`; `AUTH-19`, `AUTH-21`, `AUTH-34`, `AUTH-35`, `AUTH-38`, and all unlisted commands remain active-School-Director-only or denied as the Matrix requires.
- Unsupported variants, tied policy resolution, missing evidence, cross-scope access, and source mutation fail closed.
- Historical policy resolution is immutable; later activation supersedes only future events.

## GAP-08 SAR Extension

The Product Owner-approved GAP-08 scoring, N/A, assessor, approval, submission, lifecycle, result-band, and 2515-3 exception rules are registered separately as [`POL-GAP-08-SAR-001`](./p0-06-gap-08-sar-policy-extension.md). They do not mutate the already activated `POL-INITIAL-PILOT-001`. Runtime SAR resolution must use the extension's own source hashes/effective period and requires an `AUTH-22` activation record before application behavior is enabled.

**P0-06 status:** `DONE`. `POL-INITIAL-PILOT-001` is ACTIVE with the authoritative bootstrap effective start, `AUTH-22` activation evidence, source-integrity validation, all-17-School scope validation, non-overlap validation, and idempotent rerun verification. This bootstrap record does not implement future Policy Administration UI/workflow.
