# P0-03 Fund Flow And Record Matrix Approval Pack

**Status:** Product Owner-approved complete initial-pilot Fund Flow and record matrix; unsupported variants fail closed
**Prepared:** 2026-08-10
**Scope:** all 17 SESAO Narathiwat Schools under the approved B.E. 2515 baseline
**Policy authority:** OBEC source evidence operated in-application by the Matrix-designated SESAO Narathiwat Policy Publisher

## Decision Boundary

This document records the complete pilot Fund Flow classification and the Product Owner-approved initial-pilot decisions. It does not activate an Effective Financial Policy or authorize application implementation until the sign-off records and remaining evidence gates are complete.

The source-backed rules are:

- The Control Registry is canonical; the Cashbook is a required secondary record only for the B.E. 2515 receipt/payment cases listed below.
- Direct-paid budget claims create documentary controls but no School cash, bank, budget-register receipt/payment, or Cashbook movement.
- Cash/bank/paying-agency deposits and withdrawals are money-position changes, not external receipts or payments, and do not create Cashbook entries.
- Official Advance disbursement and unused-cash return are tracked as changes between money and a Document Held as Money; neither creates a Cashbook entry. Accepted settlement expense evidence creates the eventual payment record.
- Every external non-budgetary or State Income receipt/payment uses its applicable canonical registry and source-required document. A missing or unsupported classification fails closed.
- Partial settlement, discharge, or payment is prohibited unless the approved row explicitly permits it. A due date is policy-resolved from recorded source facts, never selected ad hoc by a user.

## Proposed Record Matrix

`Required` means the supplied source establishes the control. `Conditional` means the approved rule is enabled only when its stated applicability/source gate is satisfied. Unsupported variants fail closed.

| ID | Fund Flow / event variant | School money effect | Canonical financial/control record | Required documents or evidence | Cashbook cross-check | Approval | Partial behavior | Due-date rule | Status and source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FF-01` | Budget Direct-Payment Claim | None | Document-Request Registry | Claim/request, source/procurement evidence, entitled payee, transmission evidence | Prohibited | Finance Officer records under `AUTH-10`; evidence required | Atomic claim; no unsupported partial claim | No source-backed event deadline in supplied baseline | Approved initial pilot; `manual_2515.md:79-82,142,148,591-602` |
| `FF-02` | Direct-Payment Confirmation | None | Child of originating Document-Request Registry entry | Paying-authority confirmation, payee and authority reference | Prohibited | Finance Officer records under `AUTH-10`; original claim authority remains attributable | One full confirmation only; partial confirmation is denied | No new due date; preserves any approved claim target | Approved initial pilot; same source as `FF-01` |
| `FF-03` | Retainable Non-Budgetary Receipt | Cash/bank increases | Non-Budgetary Registry, separated by fund subtype | Receipt Record and source evidence; bank evidence where received by transfer | Required | Routine receipt posting under `AUTH-10`; no invented approver | Not applicable to the atomic receipt | None unless the fund-specific source creates an obligation | Approved initial pilot; subtype applicability remains conditional; `manual_2515.md:87-94,146,511-520,604-608` |
| `FF-04` | Retainable Non-Budgetary Payment | Cash/bank decreases | Non-Budgetary Registry, separated by fund subtype | Approved activity/source evidence and Payment Voucher Record | Required | School Director approval under `AUTH-11` | Payment Voucher is atomic; unsupported partial payment is denied | None unless fund-specific policy supplies one | Approved initial pilot; `manual_2515.md:184-214,522-533,648-653,665-678` |
| `FF-05` | State Income Receipt | Cash/bank increases pending remittance | State-Income Registry | Receipt Record and source evidence; bank/passbook evidence for interest | Required | Routine receipt posting under `AUTH-10`; no invented approver | Not applicable to the atomic receipt | Creates remittance obligation: cash at least monthly; if held cash exceeds THB 10,000, remit within three following working days | Approved initial pilot; conditional return children remain gated; `manual_2515.md:79-85,144,253-255,572-574,654-658` |
| `FF-06` | State-Income Remittance | Cash/bank decreases; obligation decreases | State-Income Registry child linked to one or more receipts | Treasury/ESAO receipt or KTB payment notice and Pay-in Slip | Required | School Director approval under `AUTH-11`; source also requires Director approval | Explicit allocation across liabilities/receipts. Actual partial remittance is `NON_COMPLIANT_PARTIAL` with outstanding balance and `Needs Correction` | Electronic remittance uses the next-working-day application control; source-derived cash rule remains linked | Approved initial pilot; `manual_2515.md:247-259,658-663` |
| `FF-07` | Contract-Security Receipt | Cash/bank increases pending custody deposit | Non-Budgetary Registry subtype `contract security` | Receipt Record, contract, payer, custody/deposit evidence | Required on receipt; later custody deposit is a position change | Routine receipt posting under `AUTH-10` | Not applicable to the atomic receipt | Return eligibility/effective date derives from the recorded contract and approved policy | Approved initial pilot; `manual_2515.md:94,146,570,604-623` |
| `FF-08` | Contract-Security Return | Custodied balance decreases to entitled contractor | Non-Budgetary Registry child linked to originating security | Contract release evidence, withdrawal request, entitled payee and paying-authority confirmation | Required by the B.E. 2515 recording procedure even where the paying authority disburses directly | School Director approval under `AUTH-11` | Full or partial release allowed only with required release evidence and never above outstanding custody | Contract/policy-derived; no universal duration is stated in supplied baseline | Approved initial pilot; `manual_2515.md:642-647` |
| `FF-09` | Withheld-Tax Recognition | Gross payment is split; withheld amount remains under School custody | Non-Budgetary Registry subtype `withheld tax`, linked to originating payment | Withholding certificate Form 4235 and originating payment evidence | No separate receipt entry; originating net payment remains governed by its row | Inherits originating payment approval; no second approval is invented | Exact withheld amount only | Creates remittance due 7 days after month-end, or 15 days after month-end for online Revenue Department filing | Approved initial pilot; `manual_2515.md:94,146,564,583` |
| `FF-10` | Withheld-Tax Remittance | Cash/bank decreases; tax liability decreases | Non-Budgetary Registry child linked to withheld-tax recognition | Revenue Department remittance/payment evidence | Required as payment | School Director approval under `AUTH-11` | Explicit allocation across liabilities. Actual partial remittance is `NON_COMPLIANT_PARTIAL`, retains outstanding balance, and enters `Needs Correction` | 7 days after month-end, or 15 days after month-end for approved online filing | Approved initial pilot; `manual_2515.md:564` |
| `FF-11` | Official Advance Disbursement | Cash/bank decreases and Document Held as Money increases; fund total does not yet become expense | Advance Registry plus Document-Held-as-Money control | Approved advance request, two agreements, estimate, and activity/travel evidence | Prohibited | School Director approval under `AUTH-12`; prior unsettled advance blocks a new advance | One approved disbursement amount; no unapproved increment | Travel: 15 days after return; other official activity: 30 days after receipt | Approved initial pilot; `manual_2515.md:129-133,216-222,684-714` |
| `FF-12` | Official Advance Settlement By Expense Evidence | Document Held as Money decreases; accepted amount becomes fund expense | Advance Registry plus applicable fund registry | Accepted expense evidence recorded against both agreement copies | Required for the accepted expense amount when it becomes the payment record | Finance Officer records one atomic settlement under `AUTH-10`; original advance approval remains attributable | One atomic settlement containing accepted expense evidence, unused cash, or both; no repeated partial submissions | Same originating advance deadline; overdue recovery within 30 days after due date | Approved initial pilot; `manual_2515.md:711-720,730-734` |
| `FF-13` | Official Advance Unused-Cash Return | Cash increases and Document Held as Money decreases; no new income | Advance Registry and Daily Balance money-position evidence | Agreement-back notation and return evidence; no Receipt Record required | Prohibited | Finance Officer records as part of the one atomic settlement under `AUTH-10`; no second approval | May combine with accepted expense evidence; total discharge cannot exceed outstanding advance | Same originating advance deadline | Approved initial pilot; `manual_2515.md:722-728` |
| `FF-14` | Internal Money-Position Transfer | Moves the same fund among cash, bank, or paying-agency custody; net fund amount unchanged | Applicable fund registry position history and Daily Balance evidence | Deposit/withdrawal slip, passbook/bank evidence, or paying-agency deposit/withdrawal evidence | Prohibited | `AUTH-34`: Finance Officer initiates only approved transfer subtypes; School Director approval/acknowledgement applies where the resolved policy/source explicitly requires it. No generic transfer authority. | Transfer is atomic; no partial-settlement concept | No child obligation; operational deposit timing may come from the applicable source | Approved initial pilot; `manual_2515.md:129-133,150-155,609-640` |

## Conditional Fund Subtypes

The following source-recognized variants are not enabled merely by approving the generic rows:

| Variant | Proposed parent | Required decision before use |
| --- | --- | --- |
| School revenue, Scout, Girl Guide, Red Cross Youth, donation, and general subsidy receipts/payments | `FF-03` / `FF-04` | Enabled only for registered catalogue entries with current purpose, custody, spending, and reporting rules. School Admin may add school-specific Fund Type/Subtype entries only under approved templates; Fund Class remains policy-controlled and immutable. |
| EEF funds | `FF-03` / `FF-04` | Conditionally enabled where a pilot School operates the fund and the approved EEF B.E. 2564 overlay, grant/cycle/beneficiary scope, and evidence rules apply. |
| Restricted grant unused-balance return | Linked child of `FF-03` using `FF-04` payment controls | EEF unused-balance return remains disabled until destination, deadline, partial-return behavior, and evidence are separately approved. |
| Excess-budget or prior-year return | Separate linked return only if an actual School-controlled budget balance exists | Conditionally enabled under `FF-05`/`FF-06` when applicability and governing source/deadline are recorded; otherwise fail closed. |

Unsupported subtype, source, or lifecycle-child combinations fail closed.

## Cross-Flow Controls

1. Every posting is atomic across the Financial Event, canonical registry, required document, permitted Cashbook cross-check, Due-Date Control, and Audit Log.
2. Receipt/payment rows require Cashbook agreement unless the row explicitly prohibits a Cashbook entry.
3. Position changes and Advance disbursement/unused-cash return never manufacture external receipt/payment totals.
4. A lifecycle child must reference its source event and cannot exceed the source outstanding amount.
5. No settlement, remittance, return, confirmation, or transfer may be re-parented after posting.
6. Exact decimal arithmetic, named authenticated actors, School scope, source/evidence preservation, P0-04 authorization, and linked-correction rules apply to every row.
7. Missing policy, tied policy resolution, missing evidence, unsupported partial behavior, stale source revision, or scope mismatch denies posting.

## Approval Decisions

The Policy Publisher/accountable reviewer must record one answer for each item:

| Decision | Required approval | Proposed fail-closed initial-pilot default |
| --- | --- | --- |
| `P0-03-D01` | Approve the 14-row flow/event inventory and the distinction between Financial Events, lifecycle children, and position changes. | **APPROVED:** as written; unlisted flow or event variant is denied. |
| `P0-03-D02` | Define `FF-01/02` application approval and whether partial Direct-Payment Confirmations are allowed. | **APPROVED:** Finance Officer records the request/confirmation under `AUTH-10`; source-approved claim evidence is mandatory; one full confirmation only. |
| `P0-03-D03` | Decide partial payment for `FF-04`, partial/allocation behavior for `FF-06`, and partial contract-security release for `FF-08`. | **APPROVED:** Payment Voucher is atomic; `FF-06` supports explicit allocation and records actual partial remittance as `NON_COMPLIANT_PARTIAL` with outstanding balance and `Needs Correction`; `FF-08` partial release is allowed with evidence. |
| `P0-03-D04` | Supply the current electronic State Income remittance deadline referenced but not stated by the supplied source. | **APPROVED:** electronic State Income remittance is enabled with a next-working-day application control; source-derived cash rules remain linked. |
| `P0-03-D05` | Approve separate contract-security and withheld-tax models, including the `FF-09/10` terminology and linkage to gross payment. | **APPROVED:** `FF-07/08` and `FF-09/10` remain separate models; no generic Refundable Deposit command. |
| `P0-03-D06` | Define the authorized settlement-evidence and unused-cash-return acceptance actor/control for `FF-12/13`, and whether repeated partial submissions are allowed. | **APPROVED:** Finance Officer records one atomic settlement under `AUTH-10`; original `AUTH-12` approval remains attributable; settlement may contain evidence, unused cash, or both; no repeated partial submissions or second approval. |
| `P0-03-D07` | Approve the exact command/approval mapping for each `FF-14` transfer subtype. | **APPROVED:** `AUTH-34` permits Finance Officer initiation of approved transfer subtypes; School Director approves/acknowledges only where the source explicitly requires it; no generic transfer authority. |
| `P0-03-D08` | Approve the enabled retainable-fund subtypes and any restricted-grant unused-balance return rules. | **APPROVED:** immutable initial Fund Type/Subtype catalogue is enabled. School Admin may create/activate school-specific entries only under approved templates; defaults and Fund Class cannot be edited. Restricted-balance return remains denied until separately approved. |
| `P0-03-D09` | Confirm EEF and excess/prior-year budget-return applicability or explicitly exclude them from the initial pilot. | **APPROVED:** EEF is conditionally enabled under `FF-03/04`; EEF unused-balance return remains disabled. Excess Budget Return and Prior-Year Budget Return are conditionally enabled under `FF-05/06` when applicability/source/deadline are recorded. |
| `P0-03-D10` | Sign off the complete Matrix for all 17 Schools and authorize it as input to P0-06; no source text may be altered by that activation. | **APPROVED:** complete 14-row Matrix and D01-D09 decisions accepted for all 17 Schools. `AUTH-08/22` is an approved Policy Publisher command control, not a P0-03 sign-off gate. Source text remains immutable. |

## Sign-Off

| Role | Name / application identity | Decision | Timestamp | Configuration / evidence reference |
| --- | --- | --- | --- | --- |
| Current Policy Publisher | นางบังอร วันริโก / `96010001001` (`a96010001001`) | Designation recorded | 2026-08-12 (recording date) | `reseach/Application ID.csv`; `AUTH-08/22` governs future designation/publication commands and is not a P0-03 gate |
| SESAO Narathiwat Product Owner / accountable reviewer | SESAO Narathiwat (legal entity; no individual substituted) | Approved | 2026-08-12 (recording date) | Organization-level accountability; no human identity invented |

### Recorded Sign-Off Addendum (2026-08-12)

The draft sign-off rows above are superseded by these recorded identities and decisions:

| Role | Recorded identity | Decision / status | Recorded at | Reference |
| --- | --- | --- | --- | --- |
| Current Policy Publisher | นางบังอร วันริโก; `96010001001` / `a96010001001`; account status `active` | Designation recorded; no duplicate P0-03 confirmation is required | 2026-08-12 (recording date; exact approval clock time not available) | `reseach/Application ID.csv` |
| Product Owner / accountable reviewer | SESAO Narathiwat (legal entity; no individual substituted) | Approved for the complete 17-School Matrix and D01-D10 decisions | 2026-08-12 (recording date; exact approval clock time not available) | Product Owner decision record in this session |

**P0-03 status:** `DONE`. D01-D10 decisions, accountable-entity sign-off, and `AUTH-34` command reconciliation are recorded. `AUTH-08/22` is not a duplicate P0-03 confirmation gate; no unsupported variant is enabled and source text remains immutable. This Matrix is governance input to P0-06 and does not itself implement application behavior.
