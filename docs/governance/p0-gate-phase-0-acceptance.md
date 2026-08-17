# Phase 0 Gate Acceptance

**Decision ID:** `P0-GATE-01`
**Status:** approved as amended; effective `2026-08-18T00:00:00+07:00`
**Decision authority:** Private Business / Product Owner
**Approval instruction:** Product Owner approval in the current Codex session on 2026-08-17; effective-date amendment approved in the current Codex session on 2026-08-17
**Scope:** Phase 0 governance acceptance and Phase 1 release boundary only

## Decision

The Private Business / Product Owner accepts the completed Phase 0 governance
foundation with effect from 2026-08-18 Asia/Bangkok. Phase 1 work may be
claimed on or after that effective time only when each task's own dependencies
are complete and its Active Work protocol is followed.

This decision does not authorize an application, schema, credential, provider,
production, real-data, or object-upload change. It recognizes the approved
governance inputs and keeps every later capability, operational proof, and
deployment decision at its separately assigned task.

## Effective Date Amendment

The original `P0-GATE-01` effective date of
`2026-08-20T00:00:00+07:00` is preserved in the original completion handoff as
historical evidence. The Product Owner's 2026-08-17 amendment supersedes that
date only for the Phase 1 release boundary. The new P0-GATE effective time is
`2026-08-18T00:00:00+07:00`.

This amendment does not alter P0-07 D07. D07 remains independently effective
`2026-08-20T00:00:00+07:00` for evidence already held on that date and all new
evidence thereafter. From 2026-08-18 until D07 takes effect, a Phase 1 task
must not treat the earlier gate date as retention, export, storage, disposal,
or evidence-object authorization under D07.

## Acceptance Evidence

| Phase 0 task | Gate result | Durable evidence |
| --- | --- | --- |
| `P0-01` | Private-product accountability is current; historical records remain preserved. | [ADR-0015](../adr/0015-private-product-testing-governance.md), [P0-01 session](../progress/sessions/2026-08-08_2230_codex_P0-01.md) |
| `P0-02` | The common OBEC B.E. 2515 baseline and 17-School test scope are recorded. | [P0-02 research](../research/p0-02-procedure-baseline-research.md) |
| `P0-03` | All approved Fund Flows and fail-closed unsupported variants are defined. | [Fund Flow matrix](p0-03-fund-flow-record-matrix.md) |
| `P0-04` | Command authority, segregation of duties, and the constrained Effective Director Authority model are complete. | [Authorization matrix](p0-04-authorization-matrix.md), [BLK-011 record](blk-011-resolution-record.md), [ADR-0016](../adr/0016-substitute-school-director-authority.md) |
| `P0-05` | OBEC form/report structures and the structural GAP-08 contract are implementation inputs. | [GAP-08 package](../research/gap-08-contract-decision-package.md), [ADR-0014](../adr/0014-schoolbanchee-2515-3-pilot-aggregate.md) |
| `P0-06` | `POL-INITIAL-PILOT-001` is active for the approved financial policy scope. | [Policy catalogue](p0-06-initial-effective-dated-policy-catalogue.md) |
| `P0-07` | Evidence, privacy, export, and interim no-destructive-disposal boundaries are accepted. D07 remains independently effective 2026-08-20. | [Evidence matrix](p0-07-evidence-retention-export-matrix.md) |
| `P0-08` | Connected-only, synthetic non-production decision/architecture boundary and selected-provider proof are recorded. | [Infrastructure boundary](p0-08-production-infrastructure-boundary.md), [D11 preflight](p0-08-d11-non-production-preflight.md) |
| `P0-09` | The integrity-bound anonymized acceptance dataset is Product Owner-approved. | [P0-09 approval](../../data/acceptance/P0-09/policy-owner-approval.json) |
| `P0-10` | Synthetic School Admin request, ESAO decision, credential, recovery, and bootstrap policy is accepted. | [Onboarding policy](p0-10-registration-onboarding-policy.md), [ADR-0017](../adr/0017-school-admin-initiated-approved-onboarding.md) |
| `P0-11` | The assessment model is defined as a versioned, policy-controlled model without activating unverified audit-instrument rules. | [P0-11 session](../progress/sessions/2026-08-09_1041_codex_P0-11.md) |

## Reconciled Gate Conditions

| Gate condition | Resolution at this gate | Later boundary |
| --- | --- | --- |
| SAR runtime behavior | `POL-GAP-08-SAR-001` is a resolved structural contract, but runtime behavior still requires its own `AUTH-22` activation and implementation task. | No SAR runtime activation is authorized by this gate. |
| Evidence storage and retention | P0-07 records the `DB-STRUCTURED`/`OBJECT-PRIVATE` boundary, `10 MiB` per-artifact limit, external-controlled reference format, classifications, exports, and interim preservation rules. D07 remains independently effective on 2026-08-20. | Object upload and `OBJECT-PRIVATE` remain disabled; no retention duration, provider capability, or automatic disposal is inferred. The P0-GATE amendment does not accelerate D07. |
| Hosting, encryption, backup, and recovery | P0-08 records the selected decision/architecture boundary, connected-only failure behavior, named recovery duties, and bounded selected-provider proof. | Provider backup/PITR, encryption, restoration, recovery drills, SLA, production, and real-data approval remain later work, including `P5-12`. |
| Onboarding | P0-10 supplies the synthetic-only School Admin request and ESAO decision boundary, excludes email/personal-ID verification, and sets recovery and bcrypt requirements. | No public registration, real-person enrolment, object upload, or account import is authorized; implementation remains with P1 tasks. |
| School Financial Accounting Audit instrument | `BLK-004` remains an explicit Phase 4 policy gate for the unverified section 3 criteria, workpapers, weights, cutoffs, ranking, signatures, and deadlines. | It cannot alter the accepted Phase 0 model or block secure-foundation work. It continues to block P4 audit-instrument activation and implementation. |
| Offline operation | P0-08 D03 requires connected business-data access and fail-closed financial/privileged commands. | Offline reads, queued writes, local persistence, and synchronization remain prohibited. |

## Phase 1 Release Constraints

Every Phase 1 task remains subject to its stated dependency and acceptance
conditions. Until separately approved, all Phase 1 work must preserve these
rules:

1. Use synthetic/anonymized data only; real School financial and personal data
   remain prohibited.
2. Do not enable public registration, object upload, a public bucket/URL,
   offline business-data behavior, or production deployment.
3. Do not claim provider encryption, backup/PITR, restore, RPO/RTO, SLA, or
   availability capability beyond the documented P0-08 decision boundary.
4. Enforce only the P0-04/P0-10 authorization and onboarding contracts; no
   generic delegation, System Admin business authority, or substitute-command
   expansion is permitted.
5. Keep `BLK-004` open and all associated audit-instrument/runtime behavior
   fail closed until its Phase 4 policy acceptance is complete.

## Gate Conclusion

No unresolved blocker can alter the approved Phase 0 financial model,
synthetic onboarding policy, deployment decision boundary, or Effective
Director Authority model. `BLK-004` is deliberately limited to future Phase 4
audit-instrument policy and does not widen, activate, or invalidate the Phase
0 assessment-model contract.
