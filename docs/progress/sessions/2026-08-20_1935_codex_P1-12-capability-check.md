# Development Session Handoff

**Session file:** `2026-08-20_1935_codex_P1-12-capability-check.md`
**Owner/agent:** `codex/p1-12`
**Primary task:** `P1-12`
**Secondary tasks:** None
**Started:** `2026-08-20T19:20:00+07:00`
**Ended:** `2026-08-20T19:35:00+07:00`
**Outcome:** Blocked

## Intent

Assess whether the selected Prisma Postgres Free runtime has an authorized,
provider-specific automated backup/PITR capability and whether this workspace
has an approved isolated synthetic recovery path for the P1-12 acceptance
condition: restore a backup into a clean environment and verify schema,
foreign keys, indexes, references, and totals.

## Work Completed

- Re-read the P0-08 production boundary, P0-08 D08/D10/D11 evidence, ADR-0004,
  ADR-0015, the prior P1-12 handoff, and the active checklist boundary.
- Retrieved Prisma's official backup documentation on 2026-08-20. It states
  that automatic daily snapshots are available on Starter, Pro, and Business
  plans only; the selected Free plan is not included in the snapshot-retention
  table. The page states that finer-grained point-in-time restore is future
  functionality.
- Confirmed the same documentation supports manual `pg_dump` and
  `pg_restore` with a direct connection. This is a possible future controlled
  backup/restore mechanism, but it is not evidence of provider-managed
  automated backup/PITR or an approved operational schedule.
- Checked local prerequisites. PostgreSQL CLI tools are installed, but the
  Docker daemon is unavailable, so no isolated local PostgreSQL restore target
  exists in this session. The selected runtime connection is present only in
  ignored environment files; its payload was not read, printed, or used.
- Performed no database dump, restore, reset, drop, recreate, Secret Manager
  mutation, Cloud Run change, or provider resource provisioning.

## Files Changed

| Path | Change and reason |
| --- | --- |
| `docs/governance/p0-08-production-infrastructure-boundary.md` | Reconciled current official Prisma backup capability evidence with D08 while preserving the Free-plan selection as an unresolved intent and recording the alternative-decision gap. |
| `docs/progress/sessions/2026-08-20_1935_codex_P1-12-capability-check.md` | Durable evidence note for the provider-capability and recovery-path assessment. |

## Verification

| Command/check | Result | Evidence or relevant output |
| --- | --- | --- |
| `Get-Content docs/governance/p0-08-production-infrastructure-boundary.md` | PASS | D08 selects Prisma Postgres Free as intended backup/PITR service, while provider capability, configuration, restore ownership, and drill evidence remain open; D10 selects quarterly isolated drills but does not provision one. |
| `Get-Content docs/progress/sessions/2026-08-19_1415_codex_P1-12.md` | PASS | Existing P1-12 blocker and prohibition on repurposing the D11/P1-23 runner remain applicable. |
| Official Prisma backup documentation (`https://www.prisma.io/docs/postgres/database/backups`) | PASS (capability evidence) | Automatic snapshots are listed for Starter/Pro/Business only; Free is omitted. Manual `pg_dump`/`pg_restore` is documented. Point-in-time restore is described as future functionality. |
| `Get-Command pg_dump,pg_restore,psql` | PASS | PostgreSQL 18 client tools are installed. Prisma documentation requires matching PostgreSQL 17 tools for Prisma Postgres, so the installed tool version is not accepted for a selected-runtime dump without a controlled compatibility decision. |
| `docker ps` | BLOCKED | Docker API unavailable (`dockerDesktopLinuxEngine` pipe missing); no isolated local restore target is available. |
| Ignored environment-file key inspection | PASS | `DATABASE_URL`/`CLAIM_URL` keys exist, but secret payloads were not read or emitted. |

## Domain and Architecture Decisions

None. The selected Prisma Postgres Free architecture and P0-08 connected-only,
synthetic/anonymized boundary remain unchanged. Manual dumps must not be treated
as provider-managed automated backup/PITR without an approved scheduler,
protected destination, retention/encryption controls, and restore ownership.

## Blockers and Risks

`BLK-008` still blocks P1-12. The exact missing inputs are:

- Product Owner/Operations/Security approval of a backup method that is valid
  for the selected Free plan, including schedule, destination, retention,
  encryption/key custody, monitoring, and redacted evidence output.
- An explicitly provisioned, isolated synthetic recovery environment and
  privileged recovery-access procedure.
- Provider/project-specific evidence that a transaction-consistent backup can
  be created and restored there, followed by the schema/foreign-key/index/
  reference/total smoke test.

The D11/P1-23 runner remains ineligible because its approved authorization
excludes backup/PITR, recovery, storage operations, and schema-integrity restore.

## Checklist Updates

- Task status: `P1-12` `[ACTIVE]` -> `[BLOCKED]` after the capability and
  recovery-path assessment.
- Blocker status: `BLK-008` remains open with the exact missing approvals,
  environment, compatible tools, and restore evidence recorded above.
- Active Work row released after the parent session reconciled the result.

## Next Exact Action

Obtain a Product Owner/Operations/Security-approved backup design and provision
an isolated synthetic restore target; then reclaim `P1-12` and run the direct
`pg_dump`/`pg_restore` plus schema/relational-integrity verifier with PostgreSQL
17-compatible tools, retaining only redacted evidence.
