# Development Session Handoff

**Session file:** `2026-08-22_0741_codex_P1-16-remediation.md`
**Owner/agent:** `codex/root`
**Primary task:** `P1-16`
**Secondary tasks:** None
**Started:** 2026-08-22 00:00 +07:00
**Ended:** 2026-08-22 07:41 +07:00
**Outcome:** Completed

## Intent

Review and resolve the active P1-16 System Admin technical credential lifecycle
and ESAO Admin organization-membership, School Director, and AUTH-14
Acting/Temporary authority lifecycle. Completion required durable immutable
database evidence, fresh re-authentication, authorization-version
invalidation, audit history, and a focused PostgreSQL verification path. This
session does not approve P1-GATE.

## Work Completed

- Corrected the polymorphic P1-04 immutable trigger so identity updates do not
  evaluate Substitute Director fields, while Substitute Director lifecycle
  changes require exactly one status transition and record-version increment.
- Added explicit allowed lifecycle transitions and a follow-up migration that
  allows terminal `REVOKED`, `EXPIRED`, `SUPERSEDED`, `INVALIDATED`,
  `ENDED_ON_RETURN`, and `CONVERTED` updates after subject or Director
  eligibility ends, while retaining active-state subject/availability checks.
- Added regression coverage for active Director additive-role rejection,
  direct status/revision mutation rejection, one-time credential replay,
  AUTH-14 resolution, and subject-suspension invalidation.
- Removed the two React hook lint warnings from the authenticated organization
  lifecycle panel and made the shared integration runner explicitly serial for
  its single synthetic database.

## Files Changed

| Path | Change and reason |
| --- | --- |
| `prisma/schema.prisma` | P1-16 credential operation/recovery approval models and relations. |
| `prisma/migrations/20260821230000_p1_16_identity_lifecycle/migration.sql` | Credential lifecycle enums, constraints, indexes, foreign keys, and immutable guards. |
| `prisma/migrations/20260822090000_p1_16_substitute_authority_lifecycle_revision/migration.sql` | Polymorphic immutable-trigger repair and revisioned authority lifecycle guard. |
| `prisma/migrations/20260822100000_p1_16_authority_lifecycle_trigger_fix/migration.sql` | Active-state-only authority subject/availability trigger validation. |
| `src/lib/organization/lifecycle.ts` | Transactional credential, membership, role, Director, and AUTH-14 lifecycle services. |
| `src/lib/authorization/school-authorization.ts` | Effective Director resolution and lifecycle synchronization. |
| `src/app/api/admin/organization-lifecycle/route.ts` | Authenticated ESAO/System Admin lifecycle API. |
| `src/app/api/credential/consume/route.ts` | One-time activation/recovery credential consumption endpoint. |
| `src/app/admin/organization/page.tsx` | Authenticated organization administration page. |
| `src/app/activate/page.tsx` | Credential activation/recovery page. |
| `src/components/organization/organization-lifecycle-panel.tsx` | Thai-first lifecycle queues and technical credential UI. |
| `src/components/organization/credential-consumption-form.tsx` | One-time credential form. |
| `tests/integration/p1-16-organization-lifecycle.test.ts` | Focused end-to-end lifecycle and replay/invalidation coverage. |
| `scripts/verify-p1-16.mjs` | Database constraint, trigger, credential-shape, and audit-chain verifier. |
| `package.json` | P1-16 scripts and serial shared integration test runner. |
| `DEVELOPMENT-CHECKLIST.md` | P1-16 completion evidence and Active Work release; P1-GATE remains blocked. |

## Verification

| Command/check | Result | Evidence or relevant output |
| --- | --- | --- |
| Fresh local PostgreSQL database `schoolbanchee_p1_16_remediation_test` | PASS | 20 migrations applied from a clean database; no existing database was reset or changed. |
| `npm run db:seed:test` | PASS | Synthetic marker applied and 17 School Directory rows created. |
| `npm run test:p1-16` | PASS | Credential replay/consumption, additive roles, Director replacement/revocation, AUTH-14 Acting/Temporary, fresh-auth checks, and subject-suspension invalidation passed. |
| `npm run verify:p1-16` | PASS | Credential constraints/triggers, token hashes, lifecycle shape, and audit-chain integrity passed. |
| `npm run db:migrate:test` after verification | PASS | No pending migrations. |
| `npm run test:integration` | PASS | 16 tests passed serially, including P1-03 through P1-10, P1-14, P1-15, P1-16, and P1-22. |
| `npx tsc --noEmit` | PASS | No TypeScript diagnostics. |
| `npx prisma validate` | PASS | Prisma schema valid. |
| `npm run lint` with disposable non-production placeholders | PASS | No ESLint warnings or errors. |
| `git diff --check` | PASS | No whitespace errors. |
| `npm run build` with disposable production placeholders | BLOCKED BY LOCAL TOOLCHAIN | Runtime environment validation passed, then Next/Webpack failed under local Node `v24.16.0` with `WasmHash._updateWithBuffer`; no application assertion was reported. Re-run under the supported CI/Node toolchain. |

## Post-Session Evidence Reconciliation

The gate review completed the follow-up migration and current-source checks
after this handoff was written:

- `prisma/migrations/20260822100000_p1_16_authority_lifecycle_trigger_fix/migration.sql`
  was applied from a clean database as migration 20. It reapplies both the
  immutable-column and active-state authority triggers.
- `tests/integration/p1-06-authorization.test.ts` now bootstraps the sealed
  System Admin precondition before testing durable automatic expiry. The
  current serial integration suite passes all 16 tests.
- `npm run test:p1-16` and `npm run verify:p1-16` pass on the isolated
  `schoolbanchee_p1_16_remediation_test` database. The isolated P1-20 test and
  verifier also pass on a clean database.
- Current-schema `npm run test:p1-12` passes against disposable PostgreSQL 18:
  the restore matched 56 rows, 99 validated foreign keys, 657 validated
  constraints, 144 public indexes, zero invalid indexes, and the synthetic
  seed marker.
- The production build passes under the supported Node 22 toolchain in a
  disposable container. Local Node 24 remains an unsupported toolchain for
  this Next/Webpack combination.

## Domain and Architecture Decisions

- Technical credential material remains outside durable records: only a
  one-time token hash and lifecycle metadata are persisted. System Admin can
  execute only exact approved activation or recovery records; ESAO Admin
  remains the organization decision maker.
- School Director assignment remains application authorization state backed by
  appointment evidence; it does not create an external governmental
  appointment. AUTH-14 records are named, exact-scope authority records and do
  not grant executable authority to the appointing administrator.
- A Substitute Director record is immutable except for an allowed lifecycle
  transition paired with exactly one incremented `recordVersion`. Eligibility
  loss invalidates the record without requiring the ended subject or
  availability state to remain active.

## Blockers and Risks

- `P1-GATE` remains independently blocked after the fresh gate review. This
  session did not approve the gate.
- The local production build is not evidence because the installed Node
  `v24.16.0`/Next 14 Webpack combination fails in the toolchain; hosted CI or a
  supported Node version is required for that separate gate evidence.
- The remote `.env.test.local` database credentials remain untouched; all
  database evidence above uses the isolated local synthetic runtime.
- The current-source build and tests are local/isolated evidence. A fresh
  hosted CI run for the post-P1-16 revision is still required before approving
  `P1-GATE`.

## Checklist Updates

- Task status: `P1-16` changed from `[ACTIVE]` to `[DONE]`.
- New task IDs: None.
- Active Work row released: `P1-16` removed.
- `P1-GATE` remains `[BLOCKED]` and points to this completion evidence for a
  fresh review at
  `docs/progress/sessions/2026-08-22_0828_codex_P1-GATE-review.md`.

## Next Exact Action

The fresh `P1-GATE` review is recorded in
`docs/progress/sessions/2026-08-22_0828_codex_P1-GATE-review.md`. Run hosted CI
on the current post-P1-16 revision before changing the gate status.
