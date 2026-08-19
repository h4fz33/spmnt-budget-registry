# P0-08-D11 Non-Production Provider Preflight

**Status:** COMPLETE FOR BOUNDED NON-PRODUCTION PROOF - approved controlled
Prisma runner returned the exact project and region, Prisma's official mapping
was recorded, and the redacted GCS private-boundary check passed
**Task:** `P0-08-D11-01`
**Date:** 2026-08-17 (completion reconciliation)
**Authority:** Private Business / Product Owner, current Codex task instruction

## Approved Boundary

This is limited to non-production selected-provider proof for synthetic or
anonymized, non-business test data. It grants no production access or
authorization, real School financial or personal data use, public bucket or
URL, object-upload activation, offline business-data reads, queued writes,
local persistence, synchronization, application migration, financial behavior,
School-isolation, Audit Log/history, schema-integrity restore, or full
RPO/RTO drill.

Google Secret Manager is the approved controlled secret-delivery mechanism.
System Admin is the operational credential custodian; Private Business /
Product Owner remains accountable for evidence acceptance. This record never
contains a secret value, account identity, token, URI, service-account JSON,
or key material.

## Approved Non-Secret Targets

| Service | Approved target |
| --- | --- |
| Google Cloud project | `spmnt-sch-acc-audit` |
| GCS bucket | `spmnt-audit-object-upload` |
| GCS storage class/location | Nearline / `asia-southeast3` |
| Prisma project | `proj_cmspqhtsz2dti12f55eww2w0o` (`schoolBanchee`) |
| Prisma API endpoint | `https://api.prisma.io/v1/projects/proj_cmspqhtsz2dti12f55eww2w0o` |
| Prisma supplied region identifier | `ap-southeast-1`; controlled runner confirms the project's `defaultRegion`, and Prisma's official FAQ maps the identifier to Singapore |

The prior truncated Prisma identifier is not an accepted target or evidence
reference.

## Product Owner Amendment - 2026-08-16

The Product Owner retains `NEARLINE` as the required default class for the
selected GCS bucket, superseding only the prior `Standard` selection. The
Product Owner also ratifies the prior removal of only the observed
`allUsers`/`roles/storage.objectViewer` binding and approves a dedicated
non-production Cloud Run Job for Prisma proof. Its first run may retrieve only
`d11-prisma-api-token` from Secret Manager and emit only redacted HTTP status,
matching project ID, and reported region. It must not read the database URI or
GCS service-account JSON, or expose a secret to chat, source, logs, or a
developer workstation. No provider configuration or capability is accepted by
this amendment.

## Product Owner Amendment - 2026-08-18 P1-23

The Product Owner authorizes a separate dedicated non-production Cloud Run Job
for synthetic PostgreSQL verification. This narrowly supersedes the preceding
database-URI prohibition only for that new job: its distinct runtime service
account may receive `SPMNT-ACC-AUDIT_PRISMA-POSTGRES-URI` as the `DATABASE_URL`
environment variable through Secret Manager injection. It must never retrieve
the payload by CLI, print it, write it to source/logs, or expose it to a
developer workstation or chat.

The existing `d11-prisma-runner` remains unchanged and retains its API-token
only boundary. The P1-23 job may run only test-mode migration deployment,
idempotent seed, and named focused verification commands against the required
`schoolbanchee_test` database. It must emit only the named command result and
overall status. No reset, provider-capability claim, production access,
real-School data, backup/PITR, encryption, recovery, or storage operation is
authorized by this amendment.

## Product Owner Selector Amendment - 2026-08-19 P1-23

For the P1-23 runner only, `TEST_DATABASE_ID` with the exact non-secret value
`db_cmsywhp011xf62pdt4pmp50xk` is the authoritative synthetic Prisma database
selector. `TEST_DATABASE_SECRET_ID` must exactly identify
`SPMNT-ACC-AUDIT_PRISMA-POSTGRES-URI`, whose non-secret labels bind it to the
same Prisma database ID and P1-23 synthetic-test purpose. The Secret Manager
custodian must create the existing `DATABASE_URL` secret version from the
direct PostgreSQL connection generated for that exact Prisma database. The
runner receives both non-secret selector values as static configuration and
the connection only through the existing secret injection; it must not
retrieve, print, store, or inspect the URI.

The exact database/secret selector pair, Secret Manager labels, and Cloud Run
environment-to-secret mapping establish the P1-23 connection provenance. The
direct TCP PostgreSQL URL may correctly use `/postgres`; it is not required to
contain `schoolbanchee_test`. Ordinary local and CI test commands continue to
require a database name containing `test`. The selector does not grant the
runner a Prisma API token, Management API access, provider-operation authority,
production access, or a reset permission. A successful sequence establishes
only the approved synthetic test execution; it does not establish provider
capability or production readiness.

## Product Owner Rebaseline Amendment - 2026-08-19 P1-24

The Product Owner approved `BLK-017`'s new controlled synthetic
runtime/rebaseline path and selector-secret transition. The P1-23 runner's
current authoritative selector is now
`TEST_DATABASE_ID=db_ang2o4k2cs20d4xolyfwqiol` with the unchanged
`TEST_DATABASE_SECRET_ID=SPMNT-ACC-AUDIT_PRISMA-POSTGRES-URI`. Secret Manager
version `4` was created from the direct PostgreSQL URL generated for that exact
new database and became the resource's `latest` version; the resource name,
secret-delivery mechanism, and runner service account remain unchanged.

The former selector `db_cmsywhp011xf62pdt4pmp50xk`, its corresponding secret
versions, and that runtime's already-applied migration history are retained as
historical P1-23 evidence. They are not reset, dropped, recreated, mutated, or
used by the rebaselined runner. This amendment authorizes no production data,
provider-capability claim, recovery operation, or change outside the bounded
synthetic P1-23 verification purpose.

## Controlled-Secret Resource Mapping

The following names were supplied by the Product Owner. No secret payload is
opened, copied, logged, or persisted by a developer workstation or this
record. The approved runner receives only the Prisma API token through Cloud
Run's Secret Manager environment injection.

| Logical use | Secret Manager resource ID | Metadata result |
| --- | --- | --- |
| `d11-prisma-api-token` | `SPMNT-ACC-AUDIT_PRISMA-SERVICE-TOKEN` | PASS - enabled-version metadata exists |
| `d11-prisma-database-url` | `SPMNT-ACC-AUDIT_PRISMA-POSTGRES-URI` | PASS - enabled-version metadata exists |
| `d11-gcs-service-account-json` | `SPMNT-ACC-AUDIT_GCS-SERVICE-ACCOUNT` | PASS - enabled-version metadata exists |

## Redacted Preflight Results

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Google Cloud CLI availability and approved-project authentication | PASS - HISTORICAL PREFLIGHT METADATA | Prior metadata inspection confirmed the approved project without displaying an account identity, token, or secret; this does not establish current Cloud Run access. |
| Secret Manager resource-name metadata | PASS - HISTORICAL PREFLIGHT METADATA | Prior metadata inspection found enabled-version metadata for the three approved resource IDs. No version payload was retrieved; this does not establish current runner delivery. |
| GCS bucket location | PASS | `spmnt-audit-object-upload` reports `ASIA-SOUTHEAST3`, matching selected `asia-southeast3`. |
| GCS storage class | PASS - current selection matches observed class | The preflight observed `NEARLINE`; the Product Owner's 2026-08-16 amendment makes Nearline the required class. This is a decision reconciliation, not provider-capability evidence or a storage configuration change. |
| GCS private-object boundary | PASS - REDACTED CURRENT RESULT | The approved bucket check returned `HasPublicBinding=False`, covering both `allUsers` and `allAuthenticatedUsers`; no IAM members or policy were retained. |
| IAM remediation handling | PASS - CURRENT ABSENCE RESULT | The Product Owner ratified removal of only the observed `allUsers`/`roles/storage.objectViewer` binding. The redacted current Boolean confirms neither public principal is present; it does not assert any other IAM state. |
| Prisma endpoint reachability | PASS - CONTROLLED RUNNER | Execution `d11-prisma-runner-z8s66` returned `HTTP_STATUS=200` for the exact project route. |
| Prisma authenticated project verification - 2026-08-17 | PASS - REDACTED CONTROLLED RESULT | Execution `d11-prisma-runner-z8s66` emitted `HTTP_STATUS=200`, `PROJECT_ID=proj_cmspqhtsz2dti12f55eww2w0o`, and `DEFAULT_REGION=ap-southeast-1`. |
| Prisma region mapping | PASS - PRISMA-CONTROLLED SOURCE | Prisma's official FAQ, `https://www.prisma.io/docs/postgres/faq` (retrieved 2026-08-17 Asia/Bangkok), lists `ap-southeast-1` as `Singapore`. |
| Cloud Run Job approach | PASS - CONTROLLED EXECUTION PATH | Job `d11-prisma-runner` in `asia-southeast3` runs as `d11-prisma-runner@spmnt-sch-acc-audit.iam.gserviceaccount.com`. That dedicated account has Secret Manager accessor scope only for `SPMNT-ACC-AUDIT_PRISMA-SERVICE-TOKEN`; the prior default Compute service-account accessor was removed. The job injects one variable, `PRISMA_API_TOKEN`, from Secret Manager key `latest`, and contains no `gcloud secrets` command. Its program emits only HTTP status, project ID, and default region. |
| Provider configuration/testing | NOT RUN | No database URI retrieval, GCS service-account JSON access, PostgreSQL connection, object upload, TLS/encryption observation, backup/PITR, or restore test was run. These remain later Phase 1 tasks. |

## Security And Custody Result

The historical 2026-08-16 completion claim used direct Secret Manager payload
retrieval; it is not accepted under the approved runner boundary, whether or
not its value was displayed. The approved runner is now configured to receive
only `PRISMA_API_TOKEN` through Cloud Run Secret Manager injection. Its
dedicated runtime service account,
`d11-prisma-runner@spmnt-sch-acc-audit.iam.gserviceaccount.com`, can access no
D11 secret other than the Prisma API-token resource, and its output contains
only the three redacted fields recorded above. No secret value, header,
response body, database URI, or
GCS service-account JSON was read, printed, committed, logged, or persisted by
a developer workstation or this record. No provider resource or IAM member was
changed by the execution. No provider capability, encryption-at-rest
configuration, backup/PITR, restore procedure, or production authorization is
accepted.

## Historical Completion Claim - Not Accepted

The 2026-08-16 completion claim in session
`docs/progress/sessions/2026-08-16_2230_codex_P0-08-D11-01.md` is retained as
historical evidence but is not an accepted D11 result. It bypassed the
Product Owner-approved dedicated Cloud Run Job and therefore cannot establish
controlled runner attribution or secret custody under the current boundary.
Its direct-secret method and unsupported region-source assertion must not be
reused.

**Current retry result (2026-08-17):** the approved execution
`d11-prisma-runner-z8s66` returned only the allowlisted fields
`HTTP_STATUS=200`, `PROJECT_ID=proj_cmspqhtsz2dti12f55eww2w0o`, and
`DEFAULT_REGION=ap-southeast-1`. The Job metadata confirms its injected Secret
Manager reference is `key: latest`. Prisma's official FAQ maps that region
identifier to Singapore. The current bucket check returned only
`HasPublicBinding=False`. No secret payload, database URI, GCS service-account
JSON, IAM policy contents, provider resource, or production state was read or
changed by this task.

## Task Handoff

`P0-08-D11-01` acceptance is complete for its bounded non-production proof.
The successful run proves only the controlled Prisma project/region response,
Secret Manager custody/logging boundary, the current redacted GCS private
principal check, and the Prisma-controlled region mapping. It does not accept
provider backup/PITR, encryption, restore, SLA, application migration,
financial behavior, production access, or real-data use.

The accepted execution is `d11-prisma-runner-z8s66` with
`HTTP_STATUS=200`, `PROJECT_ID=proj_cmspqhtsz2dti12f55eww2w0o`, and
`DEFAULT_REGION=ap-southeast-1`; the Prisma FAQ mapping and redacted bucket
Boolean are recorded above. No further D11 provider operation is authorized.
