# Development Session Handoff

**Session file:** `2026-08-22_0941_codex_P1-GATE-ci-repair.md`
**Owner/agent:** `codex/root`
**Primary task:** `P1-GATE`
**Secondary tasks:** None
**Started:** `2026-08-22 09:05 +07:00`
**Ended:** `2026-08-22 09:41 +07:00`
**Outcome:** Blocked

## Intent

Repair the PostgreSQL CI fixture/verifier sequencing discovered during the
fresh Phase 1 gate review, reproduce the complete current-source workflow on
clean synthetic databases, and approve the gate only if the hosted evidence
condition is satisfied.

## Work Completed

- Repaired `.github/workflows/p1-03-postgres.yml` so CI creates and migrates an
  isolated P1-20 database, runs its integration/verifier pair there, runs the
  remaining integration fixtures serially, and executes structural verifiers
  against durable fixtures.
- Split CI integration commands at the P1-15/P1-16 credential boundary. CI
  verifies P1-15 before P1-16 consumes an activation credential and sets the
  approved Finance Officer password.
- Confirmed the workflow now supplies durable P1-18, P1-19, and P1-21 evidence
  through their existing focused integration fixtures rather than relying on
  incomplete ad-hoc bootstraps.
- Kept `P1-GATE` blocked: the corrected workflow has not run on a hosted runner
  for the current uncommitted revision.

## Files Changed

| Path | Change and reason |
| --- | --- |
| `.github/workflows/p1-03-postgres.yml` | Isolated P1-20 database; ordered serial pre/post lifecycle fixtures; moved P1-15 verification before credential consumption; skipped only already-verified P1-15 and isolated P1-20 in the final verifier loop. |
| `package.json` | Added serial CI pre/post integration scripts and included P1-15/P1-16 in the normal serial integration command. |
| `DEVELOPMENT-CHECKLIST.md` | Claimed and released P1-GATE; recorded the workflow repair, local evidence, and remaining hosted-run blocker. |
| `docs/progress/sessions/2026-08-22_0941_codex_P1-GATE-ci-repair.md` | Durable gate-repair evidence and exact next action. |

## Verification

| Command/check | Result | Evidence or relevant output |
| --- | --- | --- |
| Fresh migration and repeat seed | PASS | Local PostgreSQL service; 20 migrations applied; 17 Schools created, then 17 unchanged. |
| Isolated `npm run test:p1-20` / `npm run verify:p1-20` | PASS | Fresh `schoolbanchee_p1_gate_ci_p1_20_test_repro2_20260822`; one integration test and immutable provenance verifier passed. |
| `npm run test:integration:ci:pre` | PASS | Fresh `schoolbanchee_p1_gate_ci_test_repro2_20260822`; 14 tests passed serially. |
| `npm run verify:p1-15` before P1-16 | PASS | Credential-free approved request contract verified before lifecycle consumption. |
| `npm run test:integration:ci:post` | PASS | Six P1-16/P1-17/P1-18/P1-19/P1-21/P1-22 tests passed serially. |
| Remaining P1 structural verifiers | PASS | P1-03/04/05/06/07/08/09/10/14/16/17/18/19/21 all passed on the same fresh main database. |
| `npm run verify:env` | PASS | Environment validation checks passed. |
| `node --experimental-strip-types --test tests/unit/*.test.ts` | PASS | 10 unit tests passed. |
| `npx prisma format --check` | PASS | Prisma files formatted correctly. |
| `npx prisma validate` | PASS | Current Prisma schema valid. |
| `npm run lint` | PASS | No ESLint warnings or errors with disposable test runtime values. |
| `npx tsc --noEmit` | PASS | No TypeScript diagnostics. |
| `git diff --check` | PASS | No whitespace errors. |

## Domain and Architecture Decisions

- The CI fixture order now reflects two distinct acceptance states: P1-15
  proves membership approval remains credential-free, while P1-16 proves the
  later System Admin-controlled credential operation. No runtime authorization
  boundary was widened.
- P1-20 remains isolated because P1-07 intentionally creates a legacy/current
  Policy Publisher designation while proving the P1-20 provenance requirement.
- Hosted CI remains the required gate evidence; local reproduction does not
  substitute for it.

## Blockers and Risks

- `P1-GATE` remains blocked until the corrected `Quality`, `PostgreSQL
  integration`, and `Production build` checks pass on the current revision in
  hosted CI. The repository has no `gh` or `act` executable, and no push was
  authorized or performed.

## Checklist Updates

- Task status: `P1-GATE` remains `[BLOCKED]`; no approval recorded.
- New task IDs: None.
- Active Work row released: `P1-GATE` released after local CI repair and review.

## Next Exact Action

Run the hosted `Quality`, `PostgreSQL integration`, and `Production build`
checks on the current revision, then rerun `P1-GATE` against that run before
changing the gate status or starting Phase 2.
