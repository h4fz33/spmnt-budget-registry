# Development Session Handoff

**Session file:** `2026-08-19_2016_codex_P1-24-rebaseline.md`
**Owner/agent:** `codex/root`
**Primary task:** `P1-24`
**Secondary tasks:** `BLK-017` approved rebaseline execution
**Started:** `2026-08-19T20:16:02+07:00`
**Ended:** `2026-08-19T20:35:28+07:00`
**Outcome:** Completed

## Intent

Execute the Private Business / Product Owner-approved `BLK-017` path: establish
a new controlled synthetic runtime, repair canonical forward migration order,
transition the selected selector and secret version, and verify it without
resetting, dropping, recreating, or modifying the previously selected runtime.

## Work Completed

- Moved only the canonical source directory identities, leaving SQL unchanged:
  `20260819150000_p1_09_outbox_abandoned_lease` became
  `20260819160100_p1_09_outbox_abandoned_lease`, and
  `20260819150100_p1_09_outbox_abandoned_lease_enforcement` became
  `20260819160200_p1_09_outbox_abandoned_lease_enforcement`.
- Created a fresh disposable local synthetic database and proved all 12
  canonical migrations deploy in lexical order without manual SQL ordering.
- Provisioned the new persistent Prisma synthetic database
  `db_ang2o4k2cs20d4xolyfwqiol` in `ap-southeast-1`. Its direct URL was held
  only in process memory while creating enabled version `4` of the existing
  `SPMNT-ACC-AUDIT_PRISMA-POSTGRES-URI` secret; no URL, credentials, token, or
  payload was recorded.
- Updated the existing secret's non-secret `prisma-database-id` label and the
  P1-23 fail-closed selector to the new database ID. The secret resource name,
  `latest` key reference, purpose label, service account, test environment,
  resource limits, and timeout were preserved.
- Built Cloud Build `ad3bfc50-aa09-433d-9769-c5486db61977`, tag
  `20260819202431`, digest
  `sha256:602959e471819a4a269be8f147174697160083100d5b2e79e6aec32685d13725`.
  Cloud Run Job `p1-23-db-verifier` generation `23` now uses that digest and
  the new non-secret `TEST_DATABASE_ID`.
- Executed `p1-23-db-verifier-zpqrk`; it completed successfully and emitted
  only the allowlisted check results through `VERIFY_RUN=PASS`.

## Files Changed

| Path | Change and reason |
| --- | --- |
| `prisma/migrations/20260819160100_p1_09_outbox_abandoned_lease/` | Renamed from the historical `20260819150000` source identity so the P1-09 enum base deploys first on a pristine runtime. |
| `prisma/migrations/20260819160200_p1_09_outbox_abandoned_lease_enforcement/` | Renamed from the historical `20260819150100` source identity so its trigger/enforcement SQL deploys after the enum migration. |
| `scripts/db-runtime.mjs` | Select only the newly approved P1-23 database ID when the runner selector pair is present. |
| `tests/unit/p1-23-database-selector.test.mjs` | Bind fail-closed selector coverage to the new selected database ID. |
| `docs/governance/p0-08-d11-non-production-preflight.md` | Record the bounded Product Owner rebaseline amendment and retain the former selector/runtime as historical evidence. |
| `DEVELOPMENT-CHECKLIST.md` | Claim/release P1-24, resolve BLK-017, and mark P1-24 done after durable verification. |
| `docs/progress/sessions/2026-08-19_2016_codex_P1-24-rebaseline.md` | Durable approval, transition, and verification evidence. |

## Verification

| Command/check | Result | Evidence or relevant output |
| --- | --- | --- |
| Fresh local `npm run db:migrate:test` | PASS | New disposable `p1_24_clean_test_20260819` applied all 12 migrations in canonical lexical order; P1-09 base `20260819160000` preceded `20260819160100` and `20260819160200`. |
| Fresh local `npm run db:generate`, `npm run db:seed:test`, `npm run db:validate:test` | PASS | Generated client, idempotent synthetic seed, and test-runtime configuration all passed. |
| Selected local focused checks | PASS | `verify:p1-03`, `test:p1-07`, `verify:p1-07`, `test:p1-08`, `verify:p1-08`, `test:p1-22`, `test:p1-09`, `verify:p1-09`, `test:p1-10`, `test:p1-10:integration`, `verify:p1-10`, `test:p1-17`, and `verify:p1-17` passed. |
| Local P1-23 wrapper | ENVIRONMENT LIMITATION | The wrapper's child-process launch returned `PROCESS_START_FAILED` in the local tool sandbox. Its exact commands were run directly against the same clean database and passed; the unmodified wrapper subsequently passed in Cloud Run. |
| New Prisma database metadata | PASS | Database ID `db_ang2o4k2cs20d4xolyfwqiol` reports `ap-southeast-1`; no connection value was displayed. |
| Secret metadata | PASS | Existing secret label reports the new database ID and `p1-23-test`; version `4` is enabled. No payload was read back. |
| `npm run test:p1-23`, `npx prisma validate`, `npx tsc --noEmit`, `git diff --check` | PASS | Selector unit tests, schema validation, type check, and whitespace check passed. |
| Cloud Run Job readback | PASS | Generation `23` uses the immutable digest above, new selector ID, existing Secret Manager `latest` mapping, existing service account, `APP_ENV=test`, `NODE_ENV=test`, ESAO code, CPU/memory limits, and 1200-second timeout. |
| `gcloud run jobs execute p1-23-db-verifier --wait` | PASS | Execution `p1-23-db-verifier-zpqrk` completed successfully in 54.07 seconds with `succeededCount=1`. |
| Controlled runner results | PASS | `CONFIG`, `MIGRATE`, `SEED`, `P1_03_VERIFY`, `P1_07_TEST`, `P1_07_VERIFY`, `P1_08_TEST`, `P1_08_VERIFY`, `P1_22_TEST`, `P1_09_TEST`, `P1_09_VERIFY`, `P1_10_UNIT`, `P1_10_INTEGRATION`, `P1_10_VERIFY`, `P1_17_TEST`, `P1_17_VERIFY`, and `VERIFY_RUN` all returned `PASS`; container exit `0`. |

## Domain and Architecture Decisions

- The Product Owner selected a new controlled synthetic runtime rather than
  mutating the former runtime's Prisma migration history. The original
  migration identities remain historical evidence for that former runtime.
- The runner's provenance remains the exact non-secret selector pair plus the
  existing Secret Manager resource/key mapping. The direct PostgreSQL URL is
  never inferred from its `/postgres` pathname and never emitted.

## Blockers and Risks

None for `P1-24`. `BLK-017` is resolved. The local Cloud Run wrapper's
child-process limitation is confined to the interactive tool sandbox; the
authoritative controlled Cloud Run execution passed unchanged.

## Checklist Updates

- Task status changes: `P1-24` `[BLOCKED]` -> `[ACTIVE]` -> `[DONE]`.
- Blocker status changes: `BLK-017` open -> resolved.
- New task IDs: None.
- Active Work row released/updated: Removed after final controlled execution.

## Next Exact Action

For `P1-19`, claim its dedicated configured-Auditor migration and service
files only after rereading this rebaseline evidence; it is the next unblocked
schema lane. Keep `P1-18` blocked until its exact attributable Product
Owner-approved configuration/revocation record is supplied.
