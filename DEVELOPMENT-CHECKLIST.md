# SchoolBanchee Development Progress Checklist

**Authority:** [`BLUEPRINT.md`](./BLUEPRINT.md)
**Domain language:** [`reseach/CONTEXT.md`](./reseach/CONTEXT.md)
**Architecture decisions:** [`docs/adr/`](./docs/adr/)
**Current phase:** Phase 0 - Domain and policy foundation
**Last updated:** 2026-08-09

This is the shared execution ledger for all development agents and sessions. Stable task IDs, dependency checks, explicit ownership, and completion evidence are mandatory so work can be resumed without reconstructing prior context.

## Status Convention

- `- [ ] [TODO]` - unclaimed work; dependencies may still be open.
- `- [ ] [ACTIVE]` - claimed in the Active Work table and being changed now.
- `- [ ] [BLOCKED]` - cannot proceed; the blocker is recorded in Blockers and Decisions.
- `- [ ] [DEFERRED]` - deliberately moved out of the current delivery scope with a recorded decision.
- `- [x] [DONE]` - acceptance condition is met and verification evidence is in a session note.

Only `[DONE]` tasks use a checked box. Do not use percentage-complete states.

## Multi-Agent Protocol

1. Read the blueprint, context map, relevant ADRs, this checklist, and recent session notes before claiming work.
2. Select a task whose listed dependencies are `[DONE]`.
3. Change its marker to `[ACTIVE]` and add one row to Active Work before editing implementation files.
4. One owner/session may claim a task. Split broad work into new child IDs before assigning it to multiple agents.
5. Limit a session to one primary task and at most two tightly related secondary tasks.
6. Do not edit files listed by another active task without coordinating through the Active Work notes.
7. Record newly discovered work under the correct phase with a stable ID; do not silently expand the claimed task.
8. Before marking `[DONE]`, meet the acceptance condition, run proportional verification, create a session note, and link its path in the task text or Active Work notes.
9. When blocked, mark `[BLOCKED]`, release files that no longer need active editing, and record the exact decision or external input required.
10. End every session by removing or updating its Active Work row and leaving one exact next action in the session note.

## Active Work

| Task ID | Owner / session | Started | Expected files or modules | Coordination notes |
| --- | --- | --- | --- | --- |
<!-- Add active task rows below this line. -->

## Blockers and Decisions

| ID | Affected tasks | Raised | Owner | Required decision/input | Status/resolution |
| --- | --- | --- | --- | --- | --- |
| `BLK-001` | `P1-14` | 2026-08-08 | Product owner | Supply the official ESAO code or approve a stable internal code for the parent organization referenced by `SCHOOL_SEED_ESAO_CODE`. | Resolved 2026-08-08: official ESAO code `1000960001` supplied by product owner; use it as the parent organization seed code. |
| `BLK-002` | `P0-02`, `P0-03`, `P0-05`, `P0-07` | 2026-08-08 | SESAO Narathiwat Policy Publisher / accountable reviewer | Provide/record one common B.E. 2515 baseline for all 17 SMIS codes with applicable controls and forms. | Resolved 2026-08-08: SESAO Narathiwat confirmed that all 17 Schools in the complete actual school-user population follow the policies, regulations, and forms in the OBEC B.E. 2515 assessment guide. OBEC is the source authority; SESAO is the in-application Policy Publisher. Evidence: `docs/research/p0-02-procedure-baseline-research.md`; sessions: `docs/progress/sessions/2026-08-08_2130_codex_P0-02.md`, `docs/progress/sessions/2026-08-08_2145_codex_P0-02.md`, `docs/progress/sessions/2026-08-08_2230_codex_P0-01.md`. |
| `BLK-003` | `P0-04`, `P0-06`, `P0-10` | 2026-08-08 | SESAO Narathiwat Product Owner / accountable reviewer | Resolve the exact P0-04 source conflicts and open interpretations, then approve the final role/capability matrix: role-based versus named-holder language; ESAO Admin versus System Admin membership authority; `Temporary Director Approval` versus the no-staff-shortage block; Receipt Book issuance "approval" semantics; routine-posting delegation scope; post-close correction approval/reviewer; daily-balance Director signature; Policy Version retirement semantics; and ESAO reviewer scope. | Partially resolved 2026-08-09: Decisions 1-8 are incorporated. No personnel names, automatic expiry, re-delegation, staff-shortage exception, or second-person membership review was added. P0-04 remains blocked; do not close this blocker until the listed conflicts/open decisions are resolved and final approval is recorded. Evidence: `docs/research/p0-04-authorization-research.md`; `BLUEPRINT.md`; `reseach/CONTEXT.md`; `docs/adr/0003-nextauth-and-approved-registration.md`; `docs/adr/0006-sesao-operational-policy-publication.md`; `docs/progress/sessions/2026-08-09_0856_codex_P0-04.md`. |
<!-- Use BLK-001, BLK-002, ... for blockers and link an ADR when a hard-to-reverse decision is made. -->

## Phase 0: Domain and Policy Foundation

- [x] [DONE] `P0-01` Confirm sponsor, product owner, Policy Publishers, pilot schools, and accountable reviewer. Dependencies: none. Done: OBEC is sponsor/accountable organization and external Governing Policy Authority; SESAO Narathiwat is Product Owner, accountable reviewer, and in-application Policy Publisher for unchanged OBEC policies. Evidence: `docs/governance/pilot-charter.md`, `docs/adr/0006-sesao-operational-policy-publication.md`, `docs/progress/sessions/2026-08-08_1331_codex_P0-01.md`, `docs/progress/sessions/2026-08-08_1922_codex_P0-01.md`, `docs/progress/sessions/2026-08-08_2230_codex_P0-01.md`.
- [x] [DONE] `P0-02` Identify the exact OBEC/ESAO procedure and effective source revision for every pilot school. Dependencies: `P0-01`. Done: every School in the complete 17-School actual school-user population uses the B.E. 2515 subunit-accounting manual and forms confirmed by SESAO Narathiwat on 2026-08-08; OBEC is the source authority, SESAO is the in-application Policy Publisher and audit/oversight unit, and each School retains its independent financial-record boundary. Ministry of Finance B.E. 2562 is the verified general overlay. Evidence: `docs/research/p0-02-procedure-baseline-research.md`, `docs/progress/sessions/2026-08-08_2130_codex_P0-02.md`, `docs/progress/sessions/2026-08-08_2145_codex_P0-02.md`, and authority amendment `docs/progress/sessions/2026-08-08_2230_codex_P0-01.md`.
- [ ] [TODO] `P0-03` Approve the Fund Flow and record matrix, including cashbook inclusion, documents, approvals, partial settlements, and due dates. Dependencies: `P0-02`. Done when policy owners sign off all pilot flows.
- [ ] [BLOCKED] `P0-04` Approve roles, school/ESAO data boundaries, registration/membership authority, and segregation-of-duties rules. Dependencies: `P0-01`. Decisions 1-8 are incorporated in the P0-04 matrix/register, but the `BLK-003` source conflicts and open interpretations remain unresolved; P0-04 is not done. Done when every privileged command and membership action has an approved actor, approver, reviewer, and prohibited combination, with no unresolved conflict that can alter authorization. Evidence: `docs/research/p0-04-authorization-research.md`, `docs/adr/0006-sesao-operational-policy-publication.md`, `docs/progress/sessions/2026-08-08_2230_codex_P0-01.md`, `docs/progress/sessions/2026-08-08_2250_codex_P0-04.md`, `docs/progress/sessions/2026-08-09_0856_codex_P0-04.md`.
- [ ] [TODO] `P0-05` Collect anonymized official form/report samples and signature requirements. Dependencies: `P0-02`. Done when samples cover all pilot flows, daily/monthly/annual reports, advances, and Receipt Books.
- [ ] [TODO] `P0-06` Convert regulatory rules into the initial effective-dated policy catalogue. Dependencies: `P0-03`, `P0-04`. Done when rules have scope, effective range, citation, publisher, validation behavior, and expected examples.
- [ ] [TODO] `P0-07` Decide evidence storage, retention, privacy classification, export categories, and audit retention. Dependencies: `P0-01`, `P0-02`. Done when owners approve an enforceable retention/export matrix.
- [ ] [TODO] `P0-08` Decide PostgreSQL hosting, connectivity/offline boundary, RPO, RTO, encryption/key ownership, and operational backup service. Dependencies: `P0-01`. PostgreSQL/Prisma and NextAuth are selected. Done when the remaining production boundary and recovery targets are documented and serializable transaction support is confirmed.
- [ ] [TODO] `P0-09` Build a signed anonymized acceptance dataset with expected registry, budget, balance, reconciliation, and report totals. Dependencies: `P0-03`, `P0-05`, `P0-06`. Done when policy owners approve expected results.
- [ ] [TODO] `P0-10` Approve registration identity proof, requestable school roles, email verification/recovery, password policy, rejection/retention rules, and ESAO assignment boundaries. Dependencies: `P0-04`, `P0-07`. Done when every registration state and reviewer action has approved policy and audit/retention behavior.
- [ ] [TODO] `P0-GATE` Approve Phase 0. Dependencies: `P0-01` through `P0-10`. Done when no unresolved blocker can alter the financial model, onboarding policy, or deployment architecture.

## Phase 1: Secure Foundation

- [ ] [TODO] `P1-01` Migrate the application source to TypeScript with strict checks and stable import conventions. Dependencies: `P0-GATE`. Done when the current UI builds and type-checks without suppressing domain errors.
- [ ] [TODO] `P1-02` Add validated environment/configuration loading and separate development, test, and production settings. Dependencies: `P1-01`. Done when startup fails clearly on missing or invalid required configuration.
- [ ] [TODO] `P1-03` Establish PostgreSQL development/test runtimes, Prisma connection/configuration, schema migrations, local seed/reset workflow, and CI database. Dependencies: `P1-01`, `P1-02`. Done when a clean database can be migrated, seeded, and integration-tested repeatably with serializable transaction retry support.
- [ ] [TODO] `P1-04` Implement School/ESAO Organization, membership, role, Fiscal Year, and identifier Prisma models with foreign keys, restrictive deletion, checks, and unique indexes. Dependencies: `P1-03`. Done when duplicate SMIS/MOE codes, cross-school references, and invalid fiscal dates fail under tests and database constraints.
- [ ] [TODO] `P1-05` Integrate NextAuth Credentials authentication, JWT/session callbacks, account activation state, authorization-version invalidation, and re-authentication hooks. Dependencies: `P1-04`, decision `P0-08`. Done when pending/disabled users receive no protected session and sensitive actions can require fresh authentication.
- [ ] [TODO] `P1-06` Implement deny-by-default server-side RBAC and organization-scoped authorization services behind NextAuth middleware. Dependencies: `P1-04`, `P1-05`, decision `P0-04`. Done when an authorization matrix covers every role, stale token membership is rejected, and cross-school access fails.
- [ ] [TODO] `P1-07` Implement Policy Version publication, overlap validation, resolution precedence, and resolution records. Dependencies: `P1-03`, `P1-04`, catalogue `P0-06`. Done when missing and ambiguous policy tests fail closed and historical resolution remains stable.
- [ ] [TODO] `P1-08` Implement append-only Audit Log infrastructure with actor, scope, outcome, reason, and tamper-evidence strategy. Dependencies: `P1-03`, `P1-04`. Done when meaningful test commands produce immutable, permission-protected audit records.
- [ ] [TODO] `P1-09` Implement PostgreSQL-backed idempotency storage, transactional outbox, and background-job retry conventions. Dependencies: `P1-03`. Done when duplicate command submissions return one result and transaction/job retries create no duplicate business records.
- [ ] [TODO] `P1-10` Implement exact numeric money, Buddhist/Gregorian fiscal-date, stable reference, and transaction-safe scoped numbering primitives. Dependencies: `P1-01`, `P1-03`. Done when parsing, rounding rejection, serialization, year rollover, serialization retry, gap, and duplicate tests pass.
- [ ] [TODO] `P1-11` Build the Thai-first authenticated application shell, workspace switch rules, navigation, error states, and baseline accessibility. Dependencies: `P1-05`, `P1-06`. Done when each role sees only permitted navigation at desktop and tablet widths.
- [ ] [TODO] `P1-12` Establish automated PostgreSQL backup and a documented restore/schema-integrity smoke test. Dependencies: `P1-03`, decision `P0-08`. Done when a backup is restored into a clean environment and schema, foreign keys, indexes, references, and totals verify.
- [ ] [TODO] `P1-13` Establish CI checks for formatting, lint, type checks, unit tests, PostgreSQL integration tests, Prisma migrations, seeds, and production build. Dependencies: `P1-01`, `P1-03`. Done when protected checks run deterministically from a clean checkout.
- [ ] [TODO] `P1-14` Implement the validated School Directory seed from `data/schools.csv`. Dependencies: `P1-03`, `P1-04`. Done when all 17 schools upsert idempotently, codes remain strings/unique, parent ESAO is explicit, and differences fail with a report rather than silent overwrite.
- [ ] [TODO] `P1-15` Implement public school-user Registration Application API/form with School Directory selection, allowed role request, validation, password hashing, rate limiting, non-enumerating responses, and `PENDING_APPROVAL` state. Dependencies: `P1-05`, `P1-14`, policy `P0-10`. Done when submission creates no membership/session and abuse/duplicate/privileged-role tests pass.
- [ ] [TODO] `P1-16` Implement System Admin and scoped ESAO Admin registration queues, correction/rejection/approval, membership activation, suspension, role change, and audit history. Dependencies: `P1-06`, `P1-08`, `P1-15`. Done when approval is atomic, assigned scope is enforced, stale authorization is invalidated, and all decisions are audited.
- [ ] [TODO] `P1-17` Implement one-time first-System-Admin bootstrap without public privilege escalation. Dependencies: `P1-03`, `P1-05`. Done when an environment-identified email plus securely supplied password creates exactly one audited System Admin and repeat/unsafe execution fails closed.
- [ ] [TODO] `P1-GATE` Approve Phase 1. Dependencies: `P1-01` through `P1-17`. Done when registration/approval, authenticated school isolation, policy resolution, audit logging, idempotency, PostgreSQL migration/serializable transaction, build, and restore evidence pass.

## Phase 2: Core Controlled Records

- [ ] [TODO] `P2-01` Implement Financial Event aggregate, lifecycle/state machine, Financial Event Reference, and atomic posting transaction. Dependencies: `P1-GATE`. Done when invalid transitions and partial posting are impossible under integration tests.
- [ ] [TODO] `P2-02` Implement Document Records, evidence references, policy-required evidence checks, and document-number control. Dependencies: `P2-01`, `P1-10`. Done when posting fails closed on missing/duplicate evidence and retains verification history.
- [ ] [TODO] `P2-03` Implement Annual Action Plans, Budget Allocations, and authorized Budget Adjustments. Dependencies: `P2-01`. Done when revised allocation is reproducible and prior revisions/approvals remain visible.
- [ ] [TODO] `P2-04` Implement Budget Commitments and concurrency-safe Available Budget calculation. Dependencies: `P2-03`. Done when competing commitments cannot jointly overspend and pending/confirmed claims are not double-counted.
- [ ] [TODO] `P2-05` Implement Budget Direct-Payment Claim and Direct-Payment Confirmation. Dependencies: `P2-02`, `P2-04`. Done when claims consume correct availability and never change school cash/bank balances.
- [ ] [TODO] `P2-06` Implement retainable non-budgetary receipt posting. Dependencies: `P2-01`, `P2-02`. Done when registry, Receipt Record, money position, and required cross-check post atomically.
- [ ] [TODO] `P2-07` Implement retainable non-budgetary payment posting. Dependencies: `P2-01`, `P2-02`. Done when authorization, evidence, available fund balance, registry, and cross-check rules pass.
- [ ] [TODO] `P2-08` Implement State Income receipt, Due-Date Control, partial/full Remittance, and overdue state. Dependencies: `P2-06`, `P2-07`. Done when remittance cannot exceed or detach from its source receipt.
- [ ] [TODO] `P2-09` Implement Refundable Deposit receipt, due control, partial/full return, and Lifecycle Child restrictions. Dependencies: `P2-06`, `P2-07`. Done when returns remain linked and cannot exceed the outstanding deposit.
- [ ] [TODO] `P2-10` Implement Cash-to-Bank Transfer as an internal position change. Dependencies: `P2-01`, `P2-02`. Done when fund total nets to zero and no external receipt/payment or cashbook cross-check is invented.
- [ ] [TODO] `P2-11` Implement Official Advance approval, disbursement, Document Held as Money, due control, and settlement. Dependencies: `P2-06`, `P2-07`. Done when prior-unsettled rules, settlement math, evidence, and returned-money records pass.
- [ ] [TODO] `P2-12` Implement Receipt Book inventory, serial ranges, custody handover, use, void, and fiscal-year cancellation. Dependencies: `P2-02`. Done when overlapping/reused serials fail and gaps/voids are retained.
- [ ] [TODO] `P2-13` Implement the policy-selected Cashbook Cross-Check overlay. Dependencies: `P2-05` through `P2-11`. Done when required flows have exactly one matching cross-check and prohibited flows have none.
- [ ] [TODO] `P2-14` Implement canonical registry projections, running balances, deterministic rebuild, and integrity comparison. Dependencies: `P2-05` through `P2-13`. Done when projections rebuild to the same totals from canonical records.
- [ ] [TODO] `P2-15` Build flow-first intake, approval, posting-preview, registry, and event-history UI. Dependencies: `P2-02` through `P2-14`, `P1-11`. Done when users cannot enter flow-incompatible fields and every linked record is navigable.
- [ ] [TODO] `P2-16` Implement pre-close Linked Correction with reversal/adjustment, corrected event, reason, and dependency capture. Dependencies: `P2-14`. Done when originals remain immutable and balances/references follow the correction chain.
- [ ] [TODO] `P2-17` Implement approved opening-balance/import workflow with validation, preview, audit, and rollback-before-posting. Dependencies: `P2-14`, dataset `P0-09`. Done when imports cannot bypass policy or mutate posted history.
- [ ] [TODO] `P2-18` Complete invariant fixtures for every Fund Flow, concurrency case, and prohibited-record case. Dependencies: `P2-05` through `P2-17`. Done when the signed acceptance dataset and all blueprint fixtures pass.
- [ ] [TODO] `P2-GATE` Approve Phase 2. Dependencies: `P2-01` through `P2-18`. Done when all pilot events post, correct, rebuild, and authorize exactly as the policy matrix specifies.

## Phase 3: Daily Control, Reconciliation, and Close

- [ ] [TODO] `P3-01` Implement Daily Balance calculation and report source model across cash, bank, and Documents Held as Money. Dependencies: `P2-GATE`. Done when totals reproduce from canonical events by money position.
- [ ] [TODO] `P3-02` Implement Daily Inspection assignment, evidence references, discrepancy capture, signature/Acceptance Event, and Needs Correction. Dependencies: `P3-01`. Done when the inspector cannot accept incomplete or unauthorized evidence.
- [ ] [TODO] `P3-03` Implement Registry/Cashbook Agreement by event-reference set, fields, and totals. Dependencies: `P2-13`, `P3-01`. Done when missing, extra, mismatched, and net-zero-offsetting errors are all detected.
- [ ] [TODO] `P3-04` Implement due-date jobs, dashboards, and notifications for remittances, deposits, advances, corrections, and reviews. Dependencies: `P2-08`, `P2-09`, `P2-11`, `P1-09`. Done when upcoming/overdue states are deterministic and retry-safe.
- [ ] [TODO] `P3-05` Implement Bank Reconciliation with external evidence references and outstanding items. Dependencies: `P3-01`, evidence decision `P0-07`. Done when book/statement differences and outstanding items explain the result.
- [ ] [TODO] `P3-06` Implement sequenced Monthly Reconciliation versions and readiness checks. Dependencies: `P3-02`, `P3-03`, `P3-05`. Done when unresolved discrepancies and obligations block or explicitly qualify readiness under policy.
- [ ] [TODO] `P3-07` Implement reconciliation Acceptance Events and immutable accepted versions. Dependencies: `P3-06`. Done when acceptance appends identity/time/revision and cannot overwrite prior versions.
- [ ] [TODO] `P3-08` Implement dependency tracking and Stale propagation for reconciliations and reports. Dependencies: `P3-06`, `P2-16`. Done when a related correction/evidence change marks all dependent artifacts stale without deleting them.
- [ ] [TODO] `P3-09` Implement Monthly Close, close readiness, report revision, and ordinary backdate rejection. Dependencies: `P3-07`, `P3-08`. Done when close is reproducible and ordinary posting cannot enter the closed period.
- [ ] [TODO] `P3-10` Implement post-close Privileged Correction and authenticated Director Approval. Dependencies: `P3-09`. Done when source close revision, reason category, evidence, approval, adjustment, and stale propagation are atomic.
- [ ] [TODO] `P3-11` Complete end-to-end daily/monthly control and correction fixture suite. Dependencies: `P3-01` through `P3-10`. Done when a complete month closes, corrects, re-reconciles, and produces traceable replacement state.
- [ ] [TODO] `P3-GATE` Approve Phase 3. Dependencies: `P3-01` through `P3-11`. Done when an auditor can reproduce a closed month and its complete correction history.

## Phase 4: Reporting, Assessment, and ESAO Oversight

- [ ] [TODO] `P4-01` Implement reproducible report definitions, source-revision manifests, artifact storage, and Stale/Replacement Report behavior. Dependencies: `P3-GATE`. Done when the same manifest reproduces the same totals and replacement never overwrites history.
- [ ] [TODO] `P4-02` Implement print-ready Daily Balance Report. Dependencies: `P4-01`, `P3-01`. Done when the approved sample matches calculations, Thai dates, identity, pagination, and signature areas.
- [ ] [TODO] `P4-03` Implement Monthly Financial Report package and submission/return workflow. Dependencies: `P4-01`, `P3-09`. Done when the package includes required daily, bank, balance, exception, and acceptance records.
- [ ] [TODO] `P4-04` Implement annual School Revenue receipt/payment report and fiscal-year deadlines. Dependencies: `P4-01`, `P2-14`. Done when the approved annual sample and policy deadline behavior pass.
- [ ] [TODO] `P4-05` Implement budget allocation/commitment/use/availability and variance reports. Dependencies: `P4-01`, `P2-04`, `P2-05`. Done when reports reconcile to budget-control calculations by plan/programme/project.
- [ ] [TODO] `P4-06` Implement Official Advance outstanding/overdue and Receipt Book custody/usage reports. Dependencies: `P4-01`, `P2-11`, `P2-12`. Done when all open advances and serial gaps/voids are traceable.
- [ ] [TODO] `P4-07` Implement versioned annual ten-dimension self-assessment, evidence, findings, corrective actions, and Director submission. Dependencies: `P1-07`, `P2-02`. Done when all dimensions support evidence, severity, ownership, due date, and closure.
- [ ] [TODO] `P4-08` Implement ESAO assigned-school review, return/acceptance, aggregate risk, and school-boundary enforcement. Dependencies: `P4-03`, `P4-07`, `P1-06`. Done when aggregate views cannot mutate canonical school records or expose unassigned schools.
- [ ] [TODO] `P4-09` Implement authorization-scoped PDF/CSV/XLSX exports, acknowledgement, artifact expiry, and failed-export diagnostics. Dependencies: `P4-01`, decision `P0-07`. Done when category/boundary tests and correlation/display-code behavior pass.
- [ ] [TODO] `P4-10` Implement Audit Review Report for approvals, corrections, disagreements, exports, stale artifacts, and policy changes. Dependencies: `P4-01`, `P1-08`, `P3-10`. Done when each result navigates to immutable source evidence.
- [ ] [TODO] `P4-11` Complete report contract, print snapshot, export-boundary, assessment, and ESAO end-to-end tests. Dependencies: `P4-02` through `P4-10`. Done when official samples and authorization fixtures pass.
- [ ] [TODO] `P4-GATE` Approve Phase 4. Dependencies: `P4-01` through `P4-11`. Done when the school and ESAO can complete an auditable fiscal reporting cycle without spreadsheet repair.

## Phase 5: Pilot Hardening and Rollout

- [ ] [TODO] `P5-01` Perform threat modeling, dependency review, authorization penetration tests, and remediation. Dependencies: `P4-GATE`. Done when no unresolved high-severity security finding remains.
- [ ] [TODO] `P5-02` Complete privacy, retention, evidence-access, audit-retention, and export-policy review. Dependencies: `P4-GATE`, decision `P0-07`. Done when approved policy is enforced and verified with representative data.
- [ ] [TODO] `P5-03` Run representative-volume performance, concurrency, and long-report tests. Dependencies: `P4-GATE`. Done when agreed response/report targets pass without financial inconsistency.
- [ ] [TODO] `P5-04` Complete accessibility, responsive-layout, print, and Thai-language review with target users. Dependencies: `P4-GATE`. Done when critical workflows pass keyboard, contrast, overflow, and terminology review.
- [ ] [TODO] `P5-05` Run backup restoration, disaster-recovery, key rotation, and RPO/RTO drills. Dependencies: `P1-12`, `P4-GATE`. Done when observed recovery meets approved targets.
- [ ] [TODO] `P5-06` Establish production observability, alerting, audit/system-log separation, support diagnostics, and incident runbooks. Dependencies: `P4-GATE`. Done when rehearsed failures produce actionable, non-sensitive diagnostics.
- [ ] [TODO] `P5-07` Prepare Thai user guides, finance/reviewer training, administrator runbook, and support escalation path. Dependencies: `P4-GATE`. Done when pilot users can complete scripted work without developer assistance.
- [ ] [TODO] `P5-08` Rehearse opening-balance/master-data migration and reconciliation against signed source totals. Dependencies: `P2-17`, `P4-GATE`. Done when two repeat migrations yield identical approved results.
- [ ] [TODO] `P5-09` Execute pilot UAT across representative schools and fund profiles. Dependencies: `P5-01` through `P5-08`. Done when every critical scenario has a named result and evidence.
- [ ] [TODO] `P5-10` Resolve pilot defects and policy discrepancies through reviewed code changes or new Policy Versions. Dependencies: `P5-09`. Done when no critical/high defect or unexplained financial discrepancy remains.
- [ ] [TODO] `P5-11` Prepare production deployment, migration, rollback, communication, and hypercare plan. Dependencies: `P5-10`. Done when the plan is rehearsed and every step has an owner and verification/rollback condition.
- [ ] [TODO] `P5-12` Obtain production readiness and rollout approval. Dependencies: `P5-11`. Done when sponsor, policy, security, operations, and pilot representatives sign off.
- [ ] [TODO] `P5-GATE` Complete initial rollout and post-deployment verification. Dependencies: `P5-12`. Done when monitoring, balances, reports, access boundaries, backup, and support path are verified in production.

## Definition of Done for Every Feature Task

Apply every relevant item before changing a task to `[DONE]`:

- [ ] Scope and acceptance condition are unchanged or the expansion has its own task ID.
- [ ] Domain terms match `reseach/CONTEXT.md`; resolved new terms are added there without implementation details.
- [ ] Regulatory behavior cites a Policy Version/source and has no ad hoc client override.
- [ ] State transitions and domain invariants are enforced server-side.
- [ ] Prisma schema, PostgreSQL constraints/indexes, relation integrity, and migration/rollback behavior are reviewed.
- [ ] Exact money, fiscal dates, numbering, concurrency, and idempotency are handled where applicable.
- [ ] Authentication, authorization, organization boundary, segregation of duties, and re-authentication are tested.
- [ ] Meaningful success and failure actions create the required audit evidence without leaking sensitive data to System Logs.
- [ ] Thai-first UI includes loading, empty, validation, Needs Correction, stale, conflict, and retry states.
- [ ] Unit/integration/end-to-end tests scale with the feature's risk and include a regression case.
- [ ] Reporting, reconciliation, correction, export, backup, and stale-propagation impacts are addressed.
- [ ] Commands used for verification and their outcomes are recorded in the session note.
- [ ] The checklist, Active Work table, relevant ADR/context, and session note are updated.

## Session Notes

Create one note per work session under `docs/progress/sessions/` using [`docs/progress/SESSION-TEMPLATE.md`](./docs/progress/SESSION-TEMPLATE.md). Name it:

```text
YYYY-MM-DD_HHMM_<owner>_<primary-task-id>.md
```

Session notes are durable handoff evidence, not a narrative transcript. Record intent, completed work, paths changed, verification results, decisions, blockers, checklist updates, and the next exact action.

## Adding Tasks

- Keep the existing ID stable forever; never renumber completed or referenced tasks.
- Add phase tasks using the next integer, for example `P2-19`.
- Use child IDs only when an active task must be split, for example `P2-15A` and `P2-15B`; mark the parent done only after every child is done.
- Use `X-01`, `X-02`, ... for cross-cutting maintenance that is not a phase gate dependency.
- Add a dependency and one objectively verifiable completion sentence to every new task.
- Put ideas outside the approved pilot in a separate backlog document; do not dilute this progression checklist.

## Cross-Cutting Tasks

- [x] [DONE] `X-01` Record MongoDB/Mongoose, NextAuth, controlled registration approval, and the supplied school seed dataset in the domain/architecture baseline. Dependencies: none. Done when the blueprint, glossary, ADRs, checklist, environment contract, and validated repository seed file agree. Evidence: `docs/progress/sessions/2026-08-07_0115_codex_X-01.md`.
- [x] [DONE] `X-02` Supersede MongoDB/Mongoose with Prisma/PostgreSQL while retaining NextAuth, approval-gated registration, the School Directory seed, and all financial-domain rules. Dependencies: none. Done when the current blueprint, ADRs, checklist, environment contract, README, and handoff evidence name Prisma/PostgreSQL consistently and preserve the prior MongoDB decision as superseded history. Evidence: `docs/progress/sessions/2026-08-08_1304_codex_X-02.md`.
- [x] [DONE] `X-03` Record the official ESAO Narathiwat code in governance and School Directory seed configuration. Dependencies: `P0-01`. Done when the code `1000960001` appears consistently in the pilot charter, environment contract, seed-data documentation, and blocker history. Evidence: `docs/progress/sessions/2026-08-08_1419_codex_X-03.md`.
