# Development Session Handoff

**Session file:** `2026-08-22_1127_codex_P1-16-director-self-service.md`
**Owner/agent:** `codex/root`
**Primary task:** `P1-16`
**Secondary tasks:** None
**Started:** 2026-08-22 10:20 +07:00
**Ended:** 2026-08-22 11:28 +07:00
**Outcome:** Completed

## Intent

Close the Phase 1 re-audit gap in `P1-16`: expose the approved
`AUTH-14/DIRECTOR` active School Director self-service Acting appointment and
explicit return/resumption path in the authenticated School workspace, while
preserving the existing ESAO/System Admin lifecycle boundary. Completion also
required focused PostgreSQL evidence, static checks, and a durable checklist
handoff. This session does not approve `P1-GATE`.

## Work Completed

- Added a server-rendered `/director/authority` School Director page. It is
  reachable only when the authenticated identity has one current active
  School Director assignment in the exact pilot scope.
- Added `/api/director/authority` GET/POST handlers. The endpoint derives the
  current School membership from the session, enforces the School boundary,
  exposes only same-School active Finance Officer/School Admin subjects, and
  permits only `ACTING_DIRECTOR` creation or `RETURN` transition. ESAO and
  Temporary variants remain unavailable through this self-service path.
- Added `listDirectorAuthorityState` to the transactional lifecycle service,
  and linked the Director control into the Thai-first workspace navigation
  only for `SCHOOL_DIRECTOR` workspaces.
- Added focused integration assertions for the Director state query,
  self-service Acting appointment, `ENDED_ON_RETURN` transition,
  `RESUMED` availability, and cross-School denial. Extended the structural
  P1-16 verifier to require the Director API/page/panel/navigation surface.
- Reclosed `P1-16` as `[DONE]` and released its Active Work row. `P1-GATE`
  remains independently `[BLOCKED]` pending hosted checks for this revision.

## Files Changed

| Path | Change and reason |
| --- | --- |
| `src/lib/organization/lifecycle.ts` | Added authorization-scoped Director state query and typed subject/authority snapshot. |
| `src/app/api/director/authority/route.ts` | Added authenticated School Director self-service API with exact action/variant boundary. |
| `src/app/director/authority/page.tsx` | Added authenticated Director workspace route. |
| `src/components/organization/director-authority-panel.tsx` | Added Thai-first Acting appointment, authority history, and return/resumption UI. |
| `src/components/app-shell/navigation.ts` | Exposed the implemented Director route only for School Director workspaces. |
| `src/components/app-shell/application-shell.tsx` | Added the Director control icon in shell navigation. |
| `tests/integration/p1-16-organization-lifecycle.test.ts` | Added Director self-service state, appointment, return, and cross-School regression coverage. |
| `tests/unit/p1-11-application-shell.test.ts` | Updated role-navigation expectations for the implemented Director route. |
| `scripts/verify-p1-16.mjs` | Added source-surface checks for the Director self-service contract. |
| `DEVELOPMENT-CHECKLIST.md` | Reopened then completed `P1-16`, released Active Work, and linked this evidence. |

## Verification

| Command/check | Result | Evidence or relevant output |
| --- | --- | --- |
| Fresh disposable PostgreSQL 16 container, 20 migrations | PASS | `127.0.0.1:5441`, all canonical migrations applied from empty database. |
| Synthetic seed | PASS | `npm run db:seed:test`; 17 Schools created with `1000960001` pilot ESAO. |
| `npm run test:p1-16` | PASS | Credential replay/consumption, role lifecycle, Director lifecycle, AUTH-14, fresh-auth, invalidation, and new self-service assertions passed. |
| `npm run verify:p1-16` | PASS | Database constraints/triggers, token hashes, audit chain, and Director source-surface checks passed. |
| `npm run test:integration` | PASS | 16/16 current integration tests passed serially on the disposable database. |
| `node --conditions=react-server --experimental-strip-types --test tests/unit/p1-11-application-shell.test.ts` | PASS | 4/4 shell/navigation tests passed. |
| `npx tsc --noEmit` | PASS | No TypeScript diagnostics. |
| `npx prisma validate` | PASS | Current Prisma schema valid. |
| `npm run lint` | PASS | No ESLint warnings/errors with disposable development values. |
| `npm run build` | PASS | Production build passed with valid non-production HTTPS/remote placeholders under the local toolchain. |
| `git diff --check` | PASS | No whitespace errors; only existing line-ending warnings were reported. |
| Disposable database cleanup | PASS | Created test containers were removed; configured `.env.test.local` credentials were not changed. |

## Domain and Architecture Decisions

- `AUTH-14/DIRECTOR` is now represented as an authenticated School Director
  workflow, while `AUTH-14/ESAO` and `AUTH-14/TEMP` remain ESAO Admin paths.
- The self-service UI does not create an external appointment, a second
  Director role, or a generic delegation. It calls the existing transactional,
  fresh-authenticated, immutable lifecycle service and preserves explicit
  return/resumption semantics from ADR-0016 and `BLK-011`.

## Blockers and Risks

- `P1-GATE` remains `[BLOCKED]`: no hosted GitHub Actions run exists for the
  current uncommitted revision. The prior hosted run predates this Director
  surface and current P1-16/CI changes. A fresh hosted `Quality`,
  `PostgreSQL integration`, and `Production build` run is required before the
  gate can be approved or Phase 2 can begin.
- The first focused command against configured `.env.test.local` credentials
  was rejected by the provider; those credentials remain untouched. Local
  disposable PostgreSQL evidence is not a substitute for hosted gate proof.

## Checklist Updates

- Task status: `P1-16` changed from `[ACTIVE]` to `[DONE]`.
- New task IDs: None.
- Active Work row released: `P1-16` removed.
- `P1-GATE` remains `[BLOCKED]`; no Phase 2 task was started.

## Next Exact Action

Claim `P1-GATE` only after a fresh hosted Actions run on this revision reports
passing `Quality`, `PostgreSQL integration`, and `Production build` checks;
then reconcile the gate against this note and the prior Phase 1 evidence.
