# P0-03 Fund Flow And Record Matrix Approval Pack

**Status:** proposed for Policy Publisher and accountable-reviewer approval; unsupported variants fail closed
**Prepared:** 2026-08-10
**Scope:** all 17 SESAO Narathiwat Schools under the approved B.E. 2515 baseline
**Policy authority:** OBEC source evidence operated in-application by the Matrix-designated SESAO Narathiwat Policy Publisher

## Decision Boundary

This document proposes the complete pilot Fund Flow classification and the records created by each event. It does not activate an Effective Financial Policy and is not implementation authority until every `OPEN` decision below is resolved and the Policy Publisher/accountable reviewer records sign-off.

The source-backed rules are:

- The Control Registry is canonical; the Cashbook is a required secondary record only for the B.E. 2515 receipt/payment cases listed below.
- Direct-paid budget claims create documentary controls but no School cash, bank, budget-register receipt/payment, or Cashbook movement.
- Cash/bank/paying-agency deposits and withdrawals are money-position changes, not external receipts or payments, and do not create Cashbook entries.
- Official Advance disbursement and unused-cash return are tracked as changes between money and a Document Held as Money; neither creates a Cashbook entry. Accepted settlement expense evidence creates the eventual payment record.
- Every external non-budgetary or State Income receipt/payment uses its applicable canonical registry and source-required document. A missing or unsupported classification fails closed.
- Partial settlement, discharge, or payment is prohibited unless the approved row explicitly permits it. A due date is policy-resolved from recorded source facts, never selected ad hoc by a user.

## Proposed Record Matrix

`Required` means the supplied source establishes the control. `OPEN` means the Product Owner/Policy Publisher must decide or confirm the application rule before that variant can be enabled.

| ID | Fund Flow / event variant | School money effect | Canonical financial/control record | Required documents or evidence | Cashbook cross-check | Approval | Partial behavior | Due-date rule | Status and source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FF-01` | Budget Direct-Payment Claim | None | Document-Request Registry | Claim/request, source/procurement evidence, entitled payee, transmission evidence | Prohibited | `OPEN`: exact application approval before submission/confirmation | `OPEN`: partial external confirmation behavior | No source-backed event deadline in supplied baseline | Proposed; `manual_2515.md:79-82,142,148,591-602` |
| `FF-02` | Direct-Payment Confirmation | None | Child of originating Document-Request Registry entry | Paying-authority confirmation, payee and authority reference | Prohibited | No new School payment approval; original claim authority must remain valid | `OPEN`: one or multiple confirmations | No new due date; preserves any approved claim target | Proposed; same source as `FF-01` |
| `FF-03` | Retainable Non-Budgetary Receipt | Cash/bank increases | Non-Budgetary Registry, separated by fund subtype | Receipt Record and source evidence; bank evidence where received by transfer | Required | Routine receipt posting under `AUTH-10`; no invented approver | Not applicable to the atomic receipt | None unless the fund-specific source creates an obligation | Proposed; `manual_2515.md:87-94,146,511-520,604-608` |
| `FF-04` | Retainable Non-Budgetary Payment | Cash/bank decreases | Non-Budgetary Registry, separated by fund subtype | Approved activity/source evidence and Payment Voucher Record | Required | School Director approval under `AUTH-11` | `OPEN`: whether one approved obligation may be paid in parts | None unless fund-specific policy supplies one | Proposed; `manual_2515.md:184-214,522-533,648-653,665-678` |
| `FF-05` | State Income Receipt | Cash/bank increases pending remittance | State-Income Registry | Receipt Record and source evidence; bank/passbook evidence for interest | Required | Routine receipt posting under `AUTH-10`; no invented approver | Not applicable to the atomic receipt | Creates remittance obligation: cash at least monthly; if held cash exceeds THB 10,000, remit within three following working days | Proposed; `manual_2515.md:79-85,144,253-255,572-574,654-658` |
| `FF-06` | State-Income Remittance | Cash/bank decreases; obligation decreases | State-Income Registry child linked to one or more receipts | Treasury/ESAO receipt or KTB payment notice and Pay-in Slip | Required | School Director approval under `AUTH-11`; source also requires Director approval | `OPEN`: allocation across receipts and whether partial remittance is permitted | Cash rule from `FF-05`; electronic-payment deadline remains `OPEN` because the supplied source defers to a Ministry rule without recording its value | Proposed; `manual_2515.md:247-259,658-663` |
| `FF-07` | Contract-Security Receipt | Cash/bank increases pending custody deposit | Non-Budgetary Registry subtype `contract security` | Receipt Record, contract, payer, custody/deposit evidence | Required on receipt; later custody deposit is a position change | Routine receipt posting under `AUTH-10` | Not applicable to the atomic receipt | Return eligibility/effective date derives from the recorded contract and approved policy | Proposed; `manual_2515.md:94,146,570,604-623` |
| `FF-08` | Contract-Security Return | Custodied balance decreases to entitled contractor | Non-Budgetary Registry child linked to originating security | Contract release evidence, withdrawal request, entitled payee and paying-authority confirmation | Required by the B.E. 2515 recording procedure even where the paying authority disburses directly | School Director approval under `AUTH-11` | `OPEN`: full-only or partial release | Contract/policy-derived; no universal duration is stated in supplied baseline | Proposed; `manual_2515.md:642-647` |
| `FF-09` | Withheld-Tax Recognition | Gross payment is split; withheld amount remains under School custody | Non-Budgetary Registry subtype `withheld tax`, linked to originating payment | Withholding certificate Form 4235 and originating payment evidence | No separate receipt entry; originating net payment remains governed by its row | Inherits originating payment approval; no second approval is invented | Exact withheld amount only | Creates remittance due 7 days after month-end, or 15 days after month-end for online Revenue Department filing | Proposed classification; terminology/model sign-off `OPEN`; `manual_2515.md:94,146,564,583` |
| `FF-10` | Withheld-Tax Remittance | Cash/bank decreases; tax liability decreases | Non-Budgetary Registry child linked to withheld-tax recognition | Revenue Department remittance/payment evidence | Required as payment | School Director approval under `AUTH-11` | `OPEN`: aggregation/allocation and partial remittance | 7 days after month-end, or 15 days after month-end for approved online filing | Proposed classification; terminology/model sign-off `OPEN`; `manual_2515.md:564` |
| `FF-11` | Official Advance Disbursement | Cash/bank decreases and Document Held as Money increases; fund total does not yet become expense | Advance Registry plus Document-Held-as-Money control | Approved advance request, two agreements, estimate, and activity/travel evidence | Prohibited | School Director approval under `AUTH-12`; prior unsettled advance blocks a new advance | One approved disbursement amount; no unapproved increment | Travel: 15 days after return; other official activity: 30 days after receipt | Proposed; `manual_2515.md:129-133,216-222,684-714` |
| `FF-12` | Official Advance Settlement By Expense Evidence | Document Held as Money decreases; accepted amount becomes fund expense | Advance Registry plus applicable fund registry | Accepted expense evidence recorded against both agreement copies | Required for the accepted expense amount when it becomes the payment record | `OPEN`: exact application actor/acceptance control; original advance approval remains attributable | `OPEN`: repeated partial evidence submissions; source permits evidence plus unused-cash return but does not explicitly approve repeated partial submissions | Same originating advance deadline; overdue recovery within 30 days after due date | Proposed; `manual_2515.md:711-720,730-734` |
| `FF-13` | Official Advance Unused-Cash Return | Cash increases and Document Held as Money decreases; no new income | Advance Registry and Daily Balance money-position evidence | Agreement-back notation and return evidence; no Receipt Record required | Prohibited | `OPEN`: exact application actor/acceptance control; no new financial approval is implied | May combine with accepted expense evidence; total discharge cannot exceed outstanding advance | Same originating advance deadline | Proposed; `manual_2515.md:722-728` |
| `FF-14` | Internal Money-Position Transfer | Moves the same fund among cash, bank, or paying-agency custody; net fund amount unchanged | Applicable fund registry position history and Daily Balance evidence | Deposit/withdrawal slip, passbook/bank evidence, or paying-agency deposit/withdrawal evidence | Prohibited | `OPEN`: exact command mapping; source requires Director awareness/approval for specified paying-agency deposits and withdrawals | Transfer is atomic; no partial-settlement concept | No child obligation; operational deposit timing may come from the applicable source | Proposed; `manual_2515.md:129-133,150-155,609-640` |

## Conditional Fund Subtypes

The following source-recognized variants are not enabled merely by approving the generic rows:

| Variant | Proposed parent | Required decision before use |
| --- | --- | --- |
| School revenue, Scout, Girl Guide, Red Cross Youth, donation, and general subsidy receipts/payments | `FF-03` / `FF-04` | Confirm each subtype is actually used in the 17-School population and attach its current purpose, custody, spending, and reporting source. |
| EEF funds | `FF-03` / `FF-04` | Confirm that at least one pilot School operates the fund and approve the EEF B.E. 2564 overlay; P0-02 found applicability unresolved. |
| Restricted grant unused-balance return | Linked child of `FF-03` using `FF-04` payment controls | Approve which grant subtypes require return, destination, deadline, partial-return behavior, and evidence. |
| Excess-budget or prior-year return | Separate linked return only if an actual School-controlled budget balance exists | Confirm applicability despite the selected direct-payment model and record the governing source/deadline. |

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
| `P0-03-D01` | Approve the 14-row flow/event inventory and the distinction between Financial Events, lifecycle children, and position changes. | Approve as written; unlisted flow or event variant is denied. |
| `P0-03-D02` | Define `FF-01/02` application approval and whether partial Direct-Payment Confirmations are allowed. | Finance Officer records the request/confirmation under `AUTH-10`; source-approved claim evidence is mandatory; one full confirmation only. |
| `P0-03-D03` | Decide partial payment for `FF-04`, partial/allocation behavior for `FF-06`, and partial contract-security release for `FF-08`. | Full-only for all three; partial commands are unsupported and denied. |
| `P0-03-D04` | Supply the current electronic State Income remittance deadline referenced but not stated by the supplied source. | Electronic State Income receipt is allowed, but electronic remittance posting is denied until the exact deadline source/value is registered. |
| `P0-03-D05` | Approve separate contract-security and withheld-tax models, including the `FF-09/10` terminology and linkage to gross payment. | Approve `FF-07/08` and `FF-09/10` as separate models; no generic Refundable Deposit command. |
| `P0-03-D06` | Define the authorized settlement-evidence and unused-cash-return acceptance actor/control for `FF-12/13`, and whether repeated partial submissions are allowed. | Finance Officer records settlement under `AUTH-10`; original `AUTH-12` approval remains attributable; one atomic settlement containing evidence, unused cash, or both; no repeated partial submissions. |
| `P0-03-D07` | Approve the exact command/approval mapping for each `FF-14` transfer subtype. | Finance Officer initiates; School Director approves when the source explicitly requires Director approval/acknowledgement; the required P0-04 command amendment must be approved before enabling that subtype. |
| `P0-03-D08` | Approve the enabled retainable-fund subtypes and any restricted-grant unused-balance return rules. | Enable only a subtype with registered current source and purpose/custody/spending rules; deny restricted-balance return until its destination, deadline, and evidence are approved. |
| `P0-03-D09` | Confirm EEF and excess/prior-year budget-return applicability or explicitly exclude them from the initial pilot. | Exclude both until School applicability and governing source are supplied and approved. |
| `P0-03-D10` | Sign off the complete Matrix for all 17 Schools and authorize it as input to P0-06; no source text may be altered by that activation. | No activation or implementation authority until both sign-off rows are complete. |

## Sign-Off

| Role | Name / application identity | Decision | Timestamp | Configuration / evidence reference |
| --- | --- | --- | --- | --- |
| Current Policy Publisher | `นางบังอร วันริโก` / application identity `OPEN` | `OPEN` | `OPEN` | Fresh current-status check required under `AUTH-08/22` |
| SESAO Narathiwat Product Owner / accountable reviewer | `OPEN` | `OPEN` | `OPEN` | `OPEN` |

**P0-03 status:** `BLOCKED` pending `P0-03-D01` through `P0-03-D10` and both sign-off records. Do not implement unsupported rows or mark P0-03 done.
