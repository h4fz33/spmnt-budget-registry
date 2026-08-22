# Development Session Handoff

**Session file:** `2026-08-22_1241_codex_P1-16-scheduled-revocation.md`
**Owner/agent:** codex
**Primary task:** `P1-16`
**Secondary tasks:** `P1-GATE` review
**Started:** 2026-08-22 12:00 +07:00
**Ended:** 2026-08-22 12:45 +07:00
**Outcome:** Completed

## Intent

Resolve the reopened P1-16 defect in scheduled AUTH-14 cancellation and
expiry handling. The acceptance condition is that terminal cancellation before
the scheduled start cannot leave the active Director unavailable, lifecycle
state remains immutable and audited, and delayed expiry resolves atomically.

## Work Completed

- Added transaction-scoped pre-start availability resumption. A scheduled
  authority that is revoked, invalidated, or superseded before its effective
  start resumes its availability only when no other scheduled or in-force
  authority references that availability. The stored `resumedAt` is strictly
  after `unavailableFrom`.
- Applied the same strict timestamp rule to explicit Director return at the
  exact effective-start boundary.
- Corrected automatic authority synchronization so a scheduled record whose
  expiry has already passed transitions directly to `EXPIRED` rather than
  incorrectly becoming `IN_FORCE`.
- Added migration `20260822130000_p1_16_scheduled_authority_expiry` to permit
  the valid immutable `SCHEDULED -> EXPIRED` transition.
- Extended the P1-16 integration fixture for pre-start revocation,
  pre-start subject invalidation, pre-start supersession, delayed expiry, and
  exact-boundary return/resumption.

## Files Changed

| Path | Change and reason |
| --- | --- |
| `src/lib/organization/lifecycle.ts` | Resume pre-start availability for all relevant terminal cancellation paths and enforce a valid return timestamp. |
| `src/lib/authorization/school-authorization.ts` | Promote scheduled authorities to `IN_FORCE` only when not already expired. |
| `tests/integration/p1-16-organization-lifecycle.test.ts` | Add scheduled cancellation, invalidation, supersession, expiry, and exact-boundary regressions. |
| `prisma/migrations/20260822130000_p1_16_scheduled_authority_expiry/migration.sql` | Allow direct scheduled-to-expired lifecycle transition while preserving immutable guards. |
| `DEVELOPMENT-CHECKLIST.md` | Close P1-16, link this evidence, and release Active Work. |
| `docs/progress/sessions/2026-08-22_1241_codex_P1-16-scheduled-revocation.md` | Durable handoff evidence. |

## Verification

| Command/check | Result | Evidence or relevant output |
| --- | --- | --- |
| Fresh PostgreSQL migration and seed | PASS | `schoolbanchee_p116_scheduled_revocation_test2_20260822`; all 21 current migrations applied and 17 synthetic Schools seeded. |
| `npm run test:p1-16` | PASS | Credential, role, Director, AUTH-14, scheduled cancellation/invalidation/supersession/expiry, exact-boundary return, fresh-auth, and invalidation assertions passed. |
| `npm run verify:p1-16` | PASS | Current trigger, credential, audit-chain, and Director surface checks passed. |
| Full integration | PASS | Fresh `schoolbanchee_p1_phase1_current_test_20260822`; 16/16 tests passed serially. |
| CI-shaped PostgreSQL workflow | PASS | Fresh `schoolbanchee_p1_ci_current_test_20260822`; 14 pre-fixtures, P1-15 verifier, 6 post-fixtures, and every enabled structural verifier passed. |
| `npx tsc --noEmit` | PASS | No TypeScript diagnostics. |
| `npx prisma validate` | PASS | Current Prisma schema is valid. |
| `npx prisma format --check` | PASS | All Prisma files formatted correctly. |
| `npm run lint` | PASS | No ESLint warnings or errors with synthetic CI environment values. |
| `npm run build` | PASS | Production build completed with synthetic non-production placeholders. |
| `git diff --check` | PASS | No whitespace errors. |

## Domain and Architecture Decisions

None. The accepted authority boundary remains unchanged: availability is
independent state, substitute authority is exact and command-scoped, and
Private Business / Product Owner remains the private-product authority.

## Blockers and Risks

`P1-GATE` remains blocked because no hosted GitHub Actions run covers the
current uncommitted revision. Local and CI-shaped PostgreSQL evidence cannot
substitute for the required hosted `Quality`, `PostgreSQL integration`, and
`Production build` checks.

## Checklist Updates

- `P1-16`: `[ACTIVE]` to `[DONE]` with this session evidence and prior P1-16 evidence preserved.
- `P1-GATE`: remains `[BLOCKED]`; no approval inferred from local evidence.
- `P2-01`: remains `[TODO]`; no Phase 2 work started.
- Active Work row: released.

## Next Exact Action

Run the hosted `Quality`, `PostgreSQL integration`, and `Production build`
checks on the current revision, then claim `P1-GATE` and reconcile approval
against that hosted run before starting `P2-01`.
