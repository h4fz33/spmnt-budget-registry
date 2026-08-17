# P0-08 Production Infrastructure Boundary

**Status:** DECISION/ARCHITECTURE READY; provider capability and production authorization remain separate
**Prepared:** 2026-08-10
**Testing scope:** Synthetic/anonymized 17-School bootstrap fixture only; no real School financial or personal data and no live deployment commitment
**Related decisions:** [ADR-0003](../adr/0003-nextauth-and-approved-registration.md), [ADR-0004](../adr/0004-prisma-and-postgresql-for-persistence.md), [P0-04 Authorization Matrix](./p0-04-authorization-matrix.md), and [P0-07 approved policy matrix](./p0-07-evidence-retention-export-matrix.md)

This document separates approved application architecture from repository-supported technical requirements, proposed operational choices, and decisions that still require accountable approval. It does not provision production infrastructure, amend P0-04, approve P0-07 retention rules, or convert a candidate recovery target into an operational commitment.

## Authoritative Governance Boundary - 2026-08-14

`Private Business / Product Owner` is the accountable product and
infrastructure approver, test-data governance owner, and risk owner. SESAO
Narathiwat is a non-binding testing partner and domain adviser only; it is not
product, infrastructure, security, or data-governance authority. OBEC remains
the policy/reference-form source authority, not the private product sponsor
or infrastructure approver. Bootstrap testing is restricted to
synthetic/anonymized data; real School financial or personal data is
prohibited. The 17-school directory is a testing fixture scope, not a live
deployment commitment. This boundary itself does not select an operator,
RPO/RTO, key owner, backup service, or restore owner. Later bounded decisions
select Prisma Postgres for `DB-STRUCTURED` and Google Cloud Storage for
provider-selected but unconfigured/disabled `OBJECT-PRIVATE` scope only.

| Recorded boundary | Evidence/reference | Effective date | Required authority/sign-off | Conditions |
| --- | --- | --- | --- | --- |
| Private Business / Product Owner is product owner, accountable Product/Infrastructure Owner, test-data governance owner, and risk owner | `OWNER-STATEMENT-2026-08-14`; [ADR-0015](../adr/0015-private-product-testing-governance.md) | 2026-08-14 | Supplied by the private Product Owner; each D01-D11 decision still requires the authority shown in the decision sheet | No infrastructure value, provider, duty acceptance, or production authorization is implied |
| SESAO is a non-binding testing partner and domain adviser only | `OWNER-STATEMENT-2026-08-14`; ADR-0015 | 2026-08-14 | Private Product Owner boundary decision | SESAO feedback is advisory and cannot satisfy P0-08 sign-off |
| Bootstrap testing is synthetic/anonymized only; no real School financial or personal data | `OWNER-STATEMENT-2026-08-14`; ADR-0015 | 2026-08-14 | Private Product Owner/data-governance boundary | Applies until an explicit later data-governance decision authorizes a different scope |

## Decision Classification

| Classification | Meaning in this document |
| --- | --- |
| `APPROVED ARCHITECTURE` | Existing accepted ADR or approved governance boundary; P0-08 does not reopen it |
| `REPOSITORY REQUIREMENT` | Required by the Blueprint/checklist for a future service, but not evidence that an operator or service has accepted it |
| `PROPOSED` | Candidate design for accountable review; not production policy |
| `OPEN` | Exact owner decision, service evidence, or sign-off is absent; the related production capability remains disabled |

## Approved Architecture And Supported Facts

| Topic | Current state | Classification and evidence |
| --- | --- | --- |
| Production persistence | PostgreSQL through Prisma is the shared production write model and source of truth. SQLite is not an acceptable shared-production substitute. | `APPROVED ARCHITECTURE`; ADR-0004 and Blueprint selected stack |
| Financial transaction semantics | Financial commands require Prisma interactive transactions at PostgreSQL `SERIALIZABLE` isolation, targeted reviewed row locks where required, exact decimal money, database constraints, idempotency, and retry of serialization conflicts under the same idempotency key. | `APPROVED ARCHITECTURE`; ADR-0004 and Blueprint transaction algorithm |
| Authentication | NextAuth remains the authentication/session framework; authoritative server-side authorization, active membership, organization scope, and P0-04 command rules still apply. | `APPROVED ARCHITECTURE`; ADR-0003 and P0-04 |
| Runtime configuration | `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` are supplied through environment configuration and real values are not committed. | `REPOSITORY REQUIREMENT`; Blueprint, README, and `.env.example` |
| School boundary | One shared service must not make one School's records readable or mutable from another School. Database relations, queries, exports, backups, restores, and operator workflows must preserve School scope. | `APPROVED ARCHITECTURE`; Blueprint and P0-04 |
| Hosting/operator/provider | D01 selects managed PostgreSQL using Prisma Postgres Free tier in Singapore, contracted and approved by Private Business / Product Owner. D02 designates Private Business / Product Owner as organizational data owner, Operations Owner, and Support/Escalation Owner. Provider-specific responsibility split, network boundary, SLA, and service proof remain open. | `D01/D02 SELECTED; provider-specific verification and dependent evidence OPEN`; `OWNER-STATEMENT-2026-08-14-D01`; current Product Owner instruction in this Codex task (no personal name recorded) |

The selected PostgreSQL/Prisma architecture and D01/D08 service selections do not by themselves prove that either selected service supports the required transaction, backup, encryption, and recovery behavior. Provider-specific verification remains mandatory before production use.

## Environment And Hosting Boundary

| Environment | Required boundary | Current decision state |
| --- | --- | --- |
| Development | Isolated non-production PostgreSQL and credentials; synthetic/anonymized data only; no production secret, backup, evidence object, or live School data reuse. Local setup and reset workflow belong to P1-03. | Boundary is a `REPOSITORY REQUIREMENT`; runtime/service selection is `OPEN` for P1-02/P1-03 |
| Test/CI | Ephemeral or isolated PostgreSQL compatible with production transaction semantics; repeatable migrations/seeds; destructive reset limited to test data; integration tests must exercise serializable conflicts and School isolation. | Boundary is a `REPOSITORY REQUIREMENT`; CI service is `OPEN` for P1-03/P1-13 |
| Production | One authoritative shared PostgreSQL write model, private from direct end-user access, reached only by authorized application/runtime and operational paths. Production data and secrets never flow down to development/test. | Logical model and D01-D10 decisions are recorded; D11's redacted private-boundary result passes, but the approved Cloud Run Prisma proof returns HTTP 403 without a project or region. Production enablement remains blocked by unconfigured service controls and the separate final authorization in `P5-12` |
| Restore verification | Isolated recovery environment with production-equivalent PostgreSQL semantics and strictly controlled access. A restore must never overwrite production merely to test recoverability. | D10 selects quarterly drills, Operations execution/runbook ownership, Security privileged-access approval, and Product Owner business validation/final acceptance; environment, runbook, access, and drill evidence remain `OPEN` |

**D01 hosting decision:** use managed PostgreSQL through Prisma Postgres Free tier in Singapore, with PostgreSQL + Prisma ORM. This is the Product Owner's selected D01 value effective 2026-08-14. The Free tier does not establish RPO, RTO, high availability, backup/PITR, restore capability, encryption/key custody, provider SLA, or technical compatibility; each remains a separate decision/evidence requirement.

Any selected production service must provide evidence for:

1. PostgreSQL transactions at `SERIALIZABLE` isolation, row locking, foreign keys, checks, unique indexes, exact `numeric` values, and Prisma migrations.
2. TLS-protected connectivity, private/restricted network access, connection limits/pooling compatible with Prisma, and fail-closed startup when required configuration or transactional connectivity is invalid.
3. Transaction-consistent backups or point-in-time recovery that do not split committed financial state, Audit Log records, report metadata, or related references.
4. Encryption, key-custody, backup, restore, monitoring, incident, maintenance, availability, and data-residency terms accepted by the named owners.
5. Restore export controls that prevent a database copy or support workflow from bypassing P0-04 and P0-07 boundaries.

## Connectivity And Offline Boundary

The authoritative financial state exists only on the connected server and PostgreSQL transaction. D03 rejects offline business-data reads, queued writes, local persistence, and synchronization. Financial and privileged writes therefore remain fail closed whenever the application cannot authenticate the actor, re-check authorization/membership, resolve current policy, validate authoritative balances/revisions, or commit the complete server transaction. Connected server-side drafts may be considered only when later implemented and separately authorized.

| Capability during network loss | Current boundary | Reason |
| --- | --- | --- |
| Read-only/offline UX | `REJECTED`: no offline access to financial, personal, evidence, audit, or authorization data. A static shell or connectivity error may render, but cached business data must not be presented as current authoritative state. | D03 approved boundary; cached scope, privacy, staleness, revocation, and retention behavior remain excluded |
| Queued writes | `REJECTED`: the browser/service worker must not queue a financial, approval, membership, policy, audit, export, or correction command for later execution. | Execution-time state and actor authority cannot be verified offline |
| Local persistence | `REJECTED` for financial records, evidence, credentials/tokens beyond approved session handling, authorization data, and command payloads. No browser database or durable device draft is approved. | Device custody, encryption, deletion, privacy, and cross-user exposure controls remain excluded |
| Synchronization | `REJECTED`: no client conflict-resolution, replay, merge, or background synchronization protocol. Server idempotency/retry after a connected submission is not offline synchronization. | Silent replay could duplicate or reorder financial effects |
| Manual recovery | After connectivity returns, the user must re-authenticate when required, reload authoritative state, and intentionally retry or re-enter an uncommitted command. The same idempotency key is reused only when retrying an uncertain connected submission. | Preserves server authority and makes uncertain outcomes explicit |

**D03 approved boundary:** require continuous connectivity for business reads and commands. Connected server-side drafts may be considered only when later implemented and separately authorized. Do not implement offline business-data caching, queued writes, local financial persistence, or synchronization for the pilot.

## Recovery Objectives

| Objective | Repository evidence | Current status |
| --- | --- | --- |
| Recovery Point Objective (RPO) | D04 approves `RPO <= 24 hours`, measured continuously (24x7), covering the complete authoritative PostgreSQL database and required recovery metadata. Future disabled object bytes are not brought into scope by this decision. | `APPROVED TARGET`; provider-specific achievability, backup/PITR configuration, and drill evidence remain `OPEN` |
| Recovery Time Objective (RTO) | D05 approves `RTO <= 12 hours`, measured from declared incident until the database and recovery metadata are restored, integrity checks pass, and the service is released from recovery quarantine. Financial writes remain blocked until Product Owner business validation is complete. | `APPROVED TARGET`; provider-specific achievability, recovery implementation, and drill evidence remain `OPEN` |

The D04/D05 targets define their measurement boundary and required recovery release condition. D05's `RTO <= 12 hours` replaces the earlier Blueprint `<= 4 hours` candidate for this P0-08 decision record only. Neither target establishes a backup schedule, provider guarantee, operational runbook, or achieved result. Backup frequency alone does not prove RPO, and a provider restore estimate alone does not prove application RTO.

## Encryption, Secrets, And Key Ownership

| Control | Required production boundary | Current status |
| --- | --- | --- |
| Encryption in transit | TLS for application-to-PostgreSQL, operational access, backup transfer, and private evidence/object transfer; certificate validation must fail closed. | `APPROVED MANDATORY REQUIREMENT`; protocol/version, certificate owner, configuration, and verification evidence are `OPEN` |
| Database/storage encryption at rest | Encrypt PostgreSQL data volumes, snapshots, replicas, temporary recovery copies, and provider-managed storage. | `APPROVED MANDATORY REQUIREMENT`; service configuration and key model are `OPEN` |
| Backup encryption | Encrypt every backup and restore staging copy in transit and at rest; access must be narrower than ordinary application access. | `APPROVED MANDATORY REQUIREMENT`; service configuration, key model, and verification evidence are `OPEN` |
| Evidence/object encryption | Encryption is mandatory for private evidence objects. Google Cloud Storage Nearline in `asia-southeast3` is selected for `OBJECT-PRIVATE` under the 2026-08-16 Product Owner amendment; the Product Owner has recorded/assigned provider-responsibility direction for the selected storage service's retention, backup, restore, encryption, and availability. `OBJECT-PRIVATE` remains unconfigured and disabled. | `APPROVED REQUIREMENT; PRODUCT OWNER-RECORDED PROVIDER RESPONSIBILITY; VERIFICATION OPEN`; no feature, configuration, key model, retention duration, RPO/RTO, schedule, guarantee, or SLA is asserted |
| Application secrets | `DATABASE_URL`, `NEXTAUTH_SECRET`, provider credentials, and similar runtime secrets must come from a controlled secret-delivery mechanism, not source control or client code. For any later GCS setup, the product credential is a per-environment least-privilege Google Cloud service-account key, not an API key. | Delivery boundary and System Admin operational credential-custody delegation are recorded; no key is created/stored, and secret service, rotation, and emergency revocation remain `OPEN` |
| Encryption keys | Private Business / Product Owner remains the security owner. System Admin is the expressly Product Owner-designated infrastructure credential and encryption-key custodian; database/storage/backup keys remain distinct in ownership and access purpose from application runtime secrets where the selected service permits it. Application code, developer workstations, and ordinary business roles must not receive raw encryption keys. | `CUSTODY DELEGATED`; KMS/provider key model, rotation/revocation, emergency/recovery paths, and evidence remain `OPEN` |
| Rotation/revocation | Rotation triggers/frequency, emergency revocation, overlap/re-encryption behavior, audit evidence, and recovery when a key or secret is lost/compromised must be documented and tested. | `REQUIRED; DOCUMENTATION/TESTING OPEN` |

P0-04 application roles do not automatically confer infrastructure authority. The Product Owner's D07 designation makes System Admin the operational infrastructure credential and encryption-key custodian only; it does not increase the P0-04 application System Admin/RBAC authority or make System Admin the accountable product, security, or business-recovery owner. Private Business / Product Owner remains the security owner. Rotation and emergency revocation still require documentation and testing; no key model, provider configuration, or emergency path is yet proven.

## Backup And Recovery Model

### Protected Content

The recovery set must include:

- the complete PostgreSQL database, including canonical financial records, organization/fiscal-year scope, authorization and membership history, policy resolutions, idempotency/outbox state, report metadata, Audit Log history, corrections, immutable revisions, and integrity metadata;
- schema migrations and the application version/configuration identifiers required to interpret the restored database;
- private evidence/report objects and their metadata only after a separately authorized GCS setup/verification task configures the selected `OBJECT-PRIVATE` boundary and enables upload; and
- the object/reference manifest needed to detect missing, extra, mismatched, or cross-School artifacts.

Source code remains protected through the version-control/release process rather than being treated as a database backup. Runtime secrets and raw encryption keys must not be embedded in database backups; their separately controlled recovery path must be documented and tested.

### Repository Baseline And Open Operations

| Topic | Repository baseline | Approval/service gap |
| --- | --- | --- |
| Database/report metadata frequency | D04 approves a continuous 24x7 `RPO <= 24 hours` target for the complete authoritative PostgreSQL database and required recovery metadata. | Target is not proof: schedule, timezone, PITR/log capture, monitoring, and provider-specific evidence remain `OPEN` |
| Restore verification | D10 approves quarterly recovery drills in an isolated recovery environment. Operations executes and owns the runbook; Security approves privileged recovery access; Product Owner performs business validation and final acceptance. | Runbook, environment, access, drill execution, and evidence remain `OPEN` |
| Retention | P0-07-D10 no-automatic-deletion and hold policy is approved in principle by D09. The Product Owner has recorded/assigned provider-responsibility direction for selected `OBJECT-PRIVATE` storage retention, backup, restore, encryption, and availability. | Product policy remains controlling; immutability/deletion-protection configuration, operations acceptance, and evidence remain `OPEN` |
| Immutability/protection | Backups must resist deletion, overwrite, ransomware, credential compromise, and unauthorized export. | Immutability/WORM, separate account/vault, deletion quorum, and break-glass rules are `OPEN` |
| Operational service | Prisma Postgres Free, the D01 selected database service, is the intended PostgreSQL backup/PITR service under D08. Google Cloud Storage remains selected only for unconfigured/disabled `OBJECT-PRIVATE`. | `SELECTED INTENT; PROVIDER-SPECIFIC PROOF OPEN`; no current backup/PITR feature, schedule, monitoring, alerting, secondary copy, restore guarantee, or SLA is asserted |
| Restore responsibility | D10 assigns Operations to execute recovery and own the runbook, Security to approve privileged recovery access, and Product Owner to perform business validation/final acceptance. | `SELECTED DUTIES; RUNBOOK/ACCESS/DRILL EVIDENCE OPEN` |

### Restore Correctness Requirements

A recovery drill is successful only when durable evidence shows that:

1. the requested recovery point is restored into an isolated environment without modifying production;
2. migrations/schema version, foreign keys, checks, unique indexes, relations, exact numeric values, and required serializable transaction behavior are valid;
3. canonical records, Audit Log history, correction/replacement chains, policy/authorization history, report metadata, and idempotency/outbox state are internally consistent;
4. evidence/object manifests and integrity hashes identify every missing, extra, or mismatched artifact without silently discarding a reference;
5. representative per-School totals reconcile and authorization tests prove no accidental cross-School exposure;
6. credentials, secrets, network access, and temporary restore copies remain controlled and are removed or retained only under an approved rule;
7. observed data loss and elapsed recovery are measured against the approved RPO/RTO; and
8. failures, exceptions, approvers, operator actions, backup identifiers, timestamps, and final disposition are recorded without placing sensitive content in System Logs.

## Financial, Audit, And Authorization Safety Evaluation

| Risk | Required infrastructure response |
| --- | --- |
| Partial or inconsistent financial recovery | Use transaction-consistent PostgreSQL backup/PITR; never assemble financial tables from unrelated export times; validate constraints, totals, and transaction semantics after restore |
| Loss of Audit Log or immutable history | Back up Audit Log and all revision/correction/replacement links with the canonical database; restore checks must detect gaps and preserve append-only meaning |
| Evidence/source mismatch | Protect object/reference manifests and integrity hashes; do not claim recovery complete when referenced evidence is absent or altered |
| Unauthorized operator access | Separate service operation from application business authority; least-privilege access, audited emergency paths, and no use of a backup/restore copy as an unscoped export |
| Cross-School exposure | Preserve organization scope in constraints and restore tests; isolate recovery access and prohibit broadly distributed database dumps |
| Unknown authoritative state during outage | Fail closed for financial and privileged writes; require explicit connected retry/re-entry rather than queued replay |
| Serialization support absent/misconfigured | Do not enable production posting until startup/integration evidence confirms `SERIALIZABLE`, row locks, retries, migrations, and transactional connectivity on the selected service |

## Required Approval Register

Every response must identify the approving authority, effective date, named operational owner, and evidence/service commitment. A provider feature list alone is not organizational approval.

| ID | Exact decision/input required | Current safe state |
| --- | --- | --- |
| `P0-08-D01` | Select production hosting model/provider/service tier, PostgreSQL version policy, region/data residency, availability topology, and contracting/accountable organization. | No production database provisioned by P0-08 |
| `P0-08-D02` | Name the organizational data owner, infrastructure/database operator, support/escalation owner, and provider responsibility split. | Private Business / Product Owner is expressly selected as organizational data owner, Operations Owner, and Support/Escalation Owner. This is infrastructure accountability, not an inferred application role; provider-specific split/evidence remain `OPEN` |
| `P0-08-D03` | Approve continuous-connectivity/offline scope separately for read-only UX, queued writes, local persistence, synchronization, connected drafts, and manual recovery. | `APPROVED`: reject offline business-data reads, queued writes, local persistence, and synchronization; financial/privileged commands remain connected and fail closed. Connected server-side drafts require later implementation and authorization |
| `P0-08-D04` | Approve RPO, measurement boundary, covered components, business interpretation, and stricter category-specific target if required. | `APPROVED TARGET`: `RPO <= 24 hours`, measured continuously (24x7), covering the complete authoritative PostgreSQL database and required recovery metadata; future disabled object bytes are excluded |
| `P0-08-D05` | Approve RTO, measurement boundary, covered components, degraded-mode rule, escalation, and business validation authority. | `APPROVED TARGET`: `RTO <= 12 hours`, from declared incident to restored database/recovery metadata, passing integrity checks and release from recovery quarantine; writes remain blocked until Product Owner business validation |
| `P0-08-D06` | Approve encryption-in-transit, database/storage-at-rest, backup, and evidence-object encryption requirements and accepted service evidence. | `APPROVED MANDATORY REQUIREMENT` for transit, database/storage at rest, backups, restore copies, and private evidence objects; no configuration, protocol, certificate, key model, or provider capability is proven |
| `P0-08-D07` | Name secret owner, database/storage/backup key owner, custodians, rotation/revocation authority, emergency path, and audit/segregation rules; select a service only after approval. | System Admin is expressly Product Owner-designated infrastructure credential and encryption-key custodian only; no P0-04/RBAC expansion. Product Owner remains security owner; rotation and emergency revocation documentation/testing remain `OPEN` |
| `P0-08-D08` | Select backup/PITR service and schedule, consistency method, monitoring/alerting, failure escalation, secondary-copy strategy, and access boundary. | Prisma Postgres Free is the selected intended PostgreSQL backup/PITR service, subject to provider-specific proof. No current backup/PITR feature, schedule, monitoring, alerting, secondary copies, restore guarantee, SLA, or capability evidence is asserted |
| `P0-08-D09` | Jointly approve backup retention/generations, legal-hold interaction, immutability/deletion protection, and secure destruction with P0-07-D10. | P0-07-D10 no-automatic-deletion and hold policy is approved in principle only. Immutability/deletion-protection configuration, operations acceptance, and evidence remain `OPEN` |
| `P0-08-D10` | Name restore operator, recovery lead, security approver, business validation owner, isolated restore environment, runbook, drill frequency, and evidence/sign-off path. | `APPROVED DUTIES`: quarterly drills in an isolated recovery environment; Operations executes and owns the runbook; Security approves privileged recovery access; Product Owner performs business validation and final acceptance. Configuration and drill evidence remain `OPEN` |
| `P0-08-D11` | Obtain separately authorized non-production selected-provider capability/configuration proof for Prisma Postgres and, only after separately authorized setup, Google Cloud Storage. This does not execute or accept application migrations, financial behavior, School isolation, Audit Log/history preservation, schema-integrity restore, or a full RPO/RTO drill; those remain assigned to later implementation/verification tasks. | `COMPLETE FOR BOUNDED NON-PRODUCTION PROOF`: Product Owner approved Google Secret Manager and bounded `P0-08-D11-01` execution on 2026-08-16, amended the selected GCS class to `NEARLINE`, ratified removal of only the observed public binding, and approved the controlled Prisma runner. The class and redacted no-public-binding Boolean pass. Execution `d11-prisma-runner-z8s66` returned `HTTP_STATUS=200`, the exact project ID, and `DEFAULT_REGION=ap-southeast-1`; Prisma's official FAQ maps that identifier to Singapore. No provider capability or production authorization is implied; final production authorization belongs to `P5-12`. Evidence: `docs/governance/p0-08-d11-non-production-preflight.md` |

## Minimum BLK-008 Decision Package

Return this section only. Every row requires a selected value or an explicit rejection, the cited evidence/reference, effective date, and the named authority shown below. A technical recommendation, provider feature page, or operator acknowledgement is input evidence; it is not a substitute for the required accountable decision.

### Authority Key

| Code | Required authority and boundary |
| --- | --- |
| `A` | Private Business accountable Product/Infrastructure Owner. Owns product accountability, infrastructure approval, delegation, production-risk acceptance, and authorization to use the selected production boundary. |
| `P` | Private Business / Product Owner. Owns testing-product behavior, operational priorities, outage/offline behavior, test-data governance, and business validation of recovery. It does not become database, backup, or key operator merely by approving a product decision. |
| `O` | Named operations owner. Supplies feasibility/service evidence and accepts executable database, backup, monitoring, incident, restore, and support duties. It cannot approve institutional risk or business policy on behalf of `A` or `P`. |
| `S` | Named security owner. Approves encryption, secret/key custody, privileged operational access, rotation/revocation, backup protection, recovery access, and security evidence. It does not select business recovery tolerance. |
| `R` | P0-07 records/retention authority. Approves backup retention, legal-hold interaction, and destruction under P0-07-D10. P0-08 cannot close D09 before this linked authority decision exists. |

### Decision Sheet

| ID | Required decision authority | Mandatory input/acceptance from | Minimum response required | Selected value / decision | Evidence or reference | Effective date |
| --- | --- | --- | --- | --- | --- | --- |
| `P0-08-D01` | `A` | `O` service/contract/feasibility evidence; `S` security and residency review; `P` confirms pilot suitability | Hosting model, provider/service tier, PostgreSQL version policy, region/data residency, availability topology, contracting organization, and explicit approval/rejection | `SELECTED; verification OPEN` | `OWNER-STATEMENT-2026-08-14-D01` | `2026-08-14` |
| `P0-08-D02` | `A` | `O` accepts operator/support duties; `S` accepts security-escalation boundary | Named organizational data owner, infrastructure/database operator, support/escalation owner, provider responsibility split, and documented delegation where applicable | `SELECTED: PRIVATE BUSINESS / PRODUCT OWNER IS DATA OWNER, OPERATIONS OWNER, AND SUPPORT/ESCALATION OWNER; PROVIDER-SPECIFIC SPLIT OPEN` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D03` | `P` | `S` review for any cached/local data; `O` connectivity/support feasibility | Separate approve/reject answers for offline read-only business data, queued writes, local persistence, synchronization, connected server-side drafts, and manual recovery | `APPROVED: REJECT OFFLINE READS, QUEUED WRITES, LOCAL PERSISTENCE, AND SYNCHRONIZATION; CONNECTED DRAFTS LATER/AUTHORIZED ONLY` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D04` | `A` | `P` states business loss tolerance and covered records; `O` proves achievable service design | Approved RPO, measurement start/end, covered components/data, 24x7 or business-calendar interpretation, exceptions, and escalation | `APPROVED TARGET: RPO <= 24 HOURS, CONTINUOUS 24X7, AUTHORITATIVE POSTGRESQL + REQUIRED RECOVERY METADATA` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D05` | `A` | `P` states business recovery priority/degraded-mode acceptance; `O` proves achievable recovery design | Approved RTO, measurement start/end, covered components, degraded-mode rule, operating calendar, escalation, and business validation authority | `APPROVED TARGET: RTO <= 12 HOURS, INCIDENT TO QUARANTINE RELEASE; WRITES BLOCKED PENDING PRODUCT OWNER VALIDATION` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D06` | `S` | `O` supplies service/configuration evidence; `A` accepts any documented residual risk | Required encryption in transit, database/storage at rest, backups, restore copies, and evidence objects; certificate/enforcement requirements and accepted proof | `APPROVED MANDATORY REQUIREMENT; CONFIGURATION/PROVIDER PROOF OPEN` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D07` | `A` for accountable ownership/delegation; `S` for custody/control design | `O` accepts assigned operational custody without receiving business authority | Named application-secret owner, database/storage/backup key owner, custodians, separation rules, rotation/revocation authority, emergency path, recovery path, and audit evidence | `SYSTEM ADMIN CUSTODY DELEGATED; NO P0-04/RBAC EXPANSION; ROTATION/EMERGENCY REVOCATION OPEN` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D08` | `A` authorizes the service boundary | `O` selects and accepts the operational service/schedule; `S` approves access/protection; `P` confirms protected business content | Backup/PITR service, transaction-consistency method, schedule/timezone, monitoring/alerting, failure escalation, secondary-copy strategy, protected content, and access boundary | `PRISMA POSTGRES FREE SELECTED AS INTENDED DATABASE BACKUP/PITR SERVICE; PROVIDER-SPECIFIC PROOF OPEN` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D09` | `R` jointly with `A` | `S` approves deletion/immutability protection; `O` confirms implementability and propagation | Backup generations/period, legal-hold behavior, immutability/deletion protection, secure destruction, disposal evidence, and reconciliation with P0-07-D10 | `P0-07-D10 POLICY APPROVED IN PRINCIPLE; CONFIGURATION/OPERATIONS/EVIDENCE OPEN` | `PO-REP-2026-08-12-D10`; current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D10` | `A` approves accountable recovery delegation | `O` names/accepts restore and recovery duties; `S` accepts security approval duties; `P` names/accepts business validation | Restore operator, recovery lead, security approver, business validation owner, isolated environment, runbook owner/reference, drill frequency, temporary-copy disposition, and sign-off evidence | `QUARTERLY ISOLATED DRILLS; OPERATIONS RUNBOOK/EXECUTION; SECURITY ACCESS APPROVAL; PRODUCT OWNER VALIDATION/FINAL ACCEPTANCE; PROOF OPEN` | Current Product Owner instruction in this Codex task (no personal name recorded); P0-08-D02-D10-01 session handoff | 2026-08-15 |
| `P0-08-D11` | `A` accepts sufficient non-production selected-provider evidence for P0-08 decision/architecture readiness; final production authorization remains `P5-12` | `O` produces provider proof; `S` accepts security/isolation proof; `P` accepts only the synthetic/anonymized test-boundary and recovery-feasibility evidence | Redacted pass/fail evidence for isolated availability/configuration facts, controlled-secret-delivery/custody boundary, TLS/encryption, a minimal non-business PostgreSQL compatibility harness, private GCS boundary only when separately setup-authorized, and observed backup/restore feasibility. No application migration, financial behavior, School-isolation, Audit Log/history, schema-integrity restore, or full RPO/RTO drill result is accepted here | `COMPLETE FOR BOUNDED NON-PRODUCTION PROOF -- HTTP 200/project/region, Prisma Singapore mapping, and private bucket Boolean pass; later capability/production gates remain` | Product Owner approval/amendment in the current Codex task; `docs/governance/p0-08-d11-non-production-preflight.md` | 2026-08-17 |

### Returned Evidence Reconciliation - 2026-08-15

The repository, attachments available to this task, current P0-07 D01/D10 state, and governance-alignment evidence were rechecked after the decision sheet was issued. P0-07-D10 supplies the adopted Product Owner policy input for monthly generation, no automatic age expiry/destruction, holds, controlled raw export/restore, and auditability. The 2026-08-15 Product Owner instruction originally selected Google Cloud Storage Standard in `asia-southeast3` for `OBJECT-PRIVATE`; the 2026-08-16 Product Owner amendment supersedes only that class with Google Cloud Storage Nearline in the same region. The Product Owner retains the provider-responsibility direction for the selected storage service's retention, backup, restore, encryption, and availability, and remains security owner. D02-D10 remain exactly as recorded below. No bucket, credential, key model, configuration, provider feature, backup/PITR schedule, monitoring, alerting, secondary copy, restore guarantee, SLA, or D11 proof is selected by those decisions. P0-08-D09 is approved in principle only and remains partially unresolved.

The authoritative `OWNER-STATEMENT-2026-08-14` boundary is now reconciled above. It supersedes the private-product authority interpretation only: Private Business is accountable, SESAO is advisory, and bootstrap data is synthetic/anonymized. The additional `OWNER-STATEMENT-2026-08-14-D01` input selects managed Prisma Postgres Free tier in Singapore, PostgreSQL + Prisma ORM, and Private Business contracting/accountability. It does not resolve RPO, RTO, HA, backup/PITR, restore, encryption/key custody, provider SLA, D02 operator duties, or D11 technical proof.

| ID | Authoritative response/evidence actually supplied | Reconciliation against required authority | Status |
| --- | --- | --- | --- |
| `P0-08-D01` | Product Owner decision input selects managed PostgreSQL, Prisma Postgres Free tier, Singapore region, PostgreSQL + Prisma ORM, Private Business as product/infrastructure authority and contracting authority, synthetic/anonymized data only, and no real School financial or personal data. Effective 2026-08-14. | Selected value is recorded. Provider-specific PostgreSQL/Prisma compatibility, service terms, network/data-residency proof, and required `O`/`S`/`P` verification remain required; Free tier does not imply RPO/RTO, HA, backup/PITR, restore, encryption/key custody, or SLA. | `SELECTED; VERIFICATION OPEN` |
| `P0-08-D02` | Current Product Owner instruction expressly selects Private Business / Product Owner as organizational data owner, Operations Owner, and Support/Escalation Owner. This is deliberate infrastructure accountability, not an inferred P0-04 application role. | D02 ownership and duty accountability are selected. Provider-specific responsibility split, executable service acceptance, and evidence remain absent. | `SELECTED; PROVIDER-SPECIFIC SPLIT/VERIFICATION OPEN` |
| `P0-08-D03` | Current Product Owner instruction rejects offline business-data reads, queued writes, local persistence, and synchronization. Financial and privileged commands remain connected and fail closed; connected server-side drafts may be considered only when later implemented and authorized. | D03 policy is selected. No offline implementation is authorized; later connected-draft design remains separately gated. | `APPROVED; IMPLEMENTATION/VERIFICATION OPEN` |
| `P0-08-D04` | Current Product Owner instruction approves `RPO <= 24 hours`, measured continuously (24x7), for the complete authoritative PostgreSQL database and required recovery metadata. Future disabled object bytes are excluded. | D04 target and measurement boundary are selected. Service design, backup/PITR configuration, and achieved recovery evidence remain absent. | `APPROVED TARGET; PROVIDER-SPECIFIC PROOF OPEN` |
| `P0-08-D05` | Current Product Owner instruction approves `RTO <= 12 hours`, from declared incident to restored database/recovery metadata, passing integrity checks and release from recovery quarantine. Financial writes remain blocked until Product Owner business validation completes. | D05 target, endpoints, and validation gate are selected. Recovery design and achieved recovery evidence remain absent. | `APPROVED TARGET; PROVIDER-SPECIFIC PROOF OPEN` |
| `P0-08-D06` | Current Product Owner instruction approves encryption as mandatory for transit, database/storage at rest, backups, restore copies, and private evidence objects. | No configuration, protocol, certificate, key model, or provider verification evidence was supplied. | `APPROVED REQUIREMENT; CONFIGURATION/VERIFICATION OPEN` |
| `P0-08-D07` | Current Product Owner instruction designates System Admin as infrastructure credential and encryption-key custodian only; Private Business / Product Owner remains security owner. The delegation does not expand P0-04 application System Admin/RBAC authority. Application code, developer workstations, and ordinary business roles may not hold raw encryption keys. | Custody delegation is selected. Rotation and emergency revocation must be documented and tested; key model, emergency path, and evidence remain absent. | `CUSTODY DELEGATED; ROTATION/REVOCATION/VERIFICATION OPEN` |
| `P0-08-D08` | Current Product Owner instruction selects Prisma Postgres Free, the D01 database service, as the intended PostgreSQL backup/PITR service. | No current backup/PITR capability, schedule, monitoring, alerting, secondary copy, restore guarantee, SLA, or provider-specific evidence is supplied. | `SELECTED INTENT; PROVIDER-SPECIFIC PROOF OPEN` |
| `P0-08-D09` | Current Product Owner instruction approves the P0-07-D10 no-automatic-deletion and hold policy in principle only. | Immutability/deletion-protection configuration, operations acceptance, and evidence remain absent; the GCS direction does not configure object storage. | `POLICY APPROVED IN PRINCIPLE; CONFIGURATION/OPERATIONS/EVIDENCE OPEN` |
| `P0-08-D10` | Current Product Owner instruction approves quarterly recovery drills in an isolated recovery environment. Operations executes and owns the runbook; Security approves privileged recovery access; Product Owner performs business validation and final acceptance. | The duty split and drill frequency are selected. No runbook, isolated environment, privileged-access configuration, drill execution, or provider restore evidence is supplied. | `DUTIES/DRILL FREQUENCY APPROVED; IMPLEMENTATION/VERIFICATION OPEN` |
| `P0-08-D11` | Product Owner approved Google Secret Manager and bounded non-production setup/proof on 2026-08-16. The exact Prisma target is `proj_cmspqhtsz2dti12f55eww2w0o`; no result for the earlier truncated identifier is accepted. The bucket reports selected `NEARLINE` / `ASIA-SOUTHEAST3`, and the current redacted check returns `HasPublicBinding=False`. The dedicated runner executes as `d11-prisma-runner@spmnt-sch-acc-audit.iam.gserviceaccount.com`, may access only the Prisma API-token secret from `key: latest`, and emits only redacted HTTP/project/region results. Execution `d11-prisma-runner-z8s66` returned `HTTP_STATUS=200`, `PROJECT_ID=proj_cmspqhtsz2dti12f55eww2w0o`, and `DEFAULT_REGION=ap-southeast-1`. | The successful controlled result and Prisma FAQ mapping (`https://www.prisma.io/docs/postgres/faq`, `ap-southeast-1` -> `Singapore`) satisfy bounded D11 proof. No encryption-at-rest, PostgreSQL compatibility, backup/PITR, restore, or provider capability is accepted. D11 cannot grant production authorization; application migrations, financial behavior, School isolation, Audit Log/history preservation, schema-integrity restore, and full RPO/RTO drills remain later work. | `COMPLETE FOR BOUNDED NON-PRODUCTION PROOF; LATER CAPABILITY/PRODUCTION GATES OPEN` |

### Required Sign-Off

| Authority | Decision | Name/reference | Date | Conditions |
| --- | --- | --- | --- | --- |
| `A`: Private Business accountable Product/Infrastructure Owner | D01, D02, D04, D05, D07-D10 selected; D11 bounded non-production proof accepted 2026-08-17 | `OWNER-STATEMENT-2026-08-14-D01`; `OWNER-STATEMENT-2026-08-14`; current Product Owner instruction in this Codex task (no personal name recorded); ADR-0015; `docs/progress/sessions/2026-08-17_1339_codex_P0-08-D11-01.md` | `2026-08-17` | D01-D11 do not approve provider capability claims or production. `P5-12` remains the final production-authorization gate |
| `P`: Private Business / Product Owner | D03 connectivity boundary, D04/D05 business targets, D10 business validation/final acceptance, and D11 bounded synthetic/anonymized proof accepted | Current Product Owner instruction in this Codex task (no personal name recorded) | `2026-08-17` | Connected drafts require later authorization; financial writes remain blocked through recovery validation; D11 acceptance cannot grant production approval |
| `O`: Private Business / Product Owner acting as Operations Owner | D02 organizational operations/support accountability and D10 runbook/execution duties selected | Current Product Owner instruction in this Codex task (no personal name recorded) | `2026-08-15` | Must produce provider-specific service, backup, monitoring, incident, restore, drill, and evidence proof; no personal operator name or executed runbook is supplied |
| `S`: Private Business / Product Owner security owner | D06 encryption mandate and D07 System Admin custody delegation selected; D11 security proof `OPEN` | Current Product Owner instruction in this Codex task (no personal name recorded) | `2026-08-15` | System Admin custody does not expand P0-04/RBAC; no key model, rotation/revocation process, emergency path, configuration, or evidence is supplied |
| `R`: P0-07 records/retention authority | P0-07-D10 policy approved in principle for D09 | `PO-REP-2026-08-12-D10`; current Product Owner instruction in this Codex task (no personal name recorded) | `2026-08-15` | Existing P0-07 policy remains controlling; D09 configuration, operations acceptance, and evidence stay open; GCS direction does not configure storage |
| `A`/`P`/`O`/`S`: Private Business / Product Owner | D11 storage-class amendment, IAM-remediation ratification, and controlled Prisma-runner authorization | Current Product Owner instruction in this Codex task (no personal name recorded) | `2026-08-16` | Nearline supersedes only the prior GCS class. The ratification covers only the earlier removal of `allUsers`/`roles/storage.objectViewer`. The runner may access only the Prisma API-token secret and emit redacted HTTP/project/region results; it must not read the database URI or GCS service-account JSON in its first proof, nor expose secrets to chat, source, logs, or a developer workstation. No provider capability, production, or real-data acceptance is granted. |

## D11 Staging And Acceptance Boundary

D11 is a future non-production selected-provider capability/configuration-proof
prerequisite. It can establish only factual, redacted evidence about the
selected services and their approved boundary; it does not assert that a
provider feature is configured or capable until the later proof task produces
and records a pass result. Its data scope remains synthetic/anonymized only,
with no real School financial or personal data, production access, or
production authorization.

When separately authorized, D11 may verify isolated Prisma Postgres/GCS
availability and configuration facts, a redacted controlled-secret-delivery
and custody boundary, TLS/encryption evidence, a minimal non-business
PostgreSQL compatibility harness, a private GCS boundary only after separate
execution approval, and observed backup/restore feasibility. It does not
authorize application schema or business data.

| Excluded from D11 provider proof | Retained implementation/verification owner |
| --- | --- |
| Real application Prisma migrations; financial `SERIALIZABLE`, locking, retry/idempotency, constraint, and exact-money behavior | `P1-03`, `P1-09`, and `P1-10` retain their existing acceptance conditions |
| Application School isolation and authorization behavior | `P1-04` and `P1-06` retain their existing acceptance conditions |
| Append-only Audit Log/history preservation | `P1-08` retains its existing acceptance condition |
| Schema-integrity restore of the implemented application | `P1-12` retains its existing acceptance condition |
| Complete recovery drill against the approved RPO/RTO targets, including operations/security/Product Owner acceptance | `P5-05` retains its existing acceptance condition |

Passing adequate D11 non-production evidence and accountable acceptance can
make P0-08 decision/architecture-ready. It cannot grant final production
authorization, enable production access, or replace `P5-12` sign-off.

`P0-08-D11-01` is the Product Owner-approved non-production setup/proof task.
Google Secret Manager in the approved GCP project is its controlled
secret-delivery mechanism. The bucket reports the Product Owner-amended
`NEARLINE` selection, and the current redacted bucket check returns
`HasPublicBinding=False` for the public-principal condition. The Product Owner
ratified removal of only the observed public `allUsers`
`roles/storage.objectViewer` binding; no other IAM state is recorded.

The dedicated `d11-prisma-runner` Cloud Run Job in `asia-southeast3` runs as
`d11-prisma-runner@spmnt-sch-acc-audit.iam.gserviceaccount.com`. That account
has Secret Manager accessor scope only for
`SPMNT-ACC-AUDIT_PRISMA-SERVICE-TOKEN`; the previous default Compute
service-account accessor was removed. The job injects only
`PRISMA_API_TOKEN`, uses no `gcloud secrets` command, and emits only redacted
HTTP status, project ID, and default region. Its Secret Manager reference is
`key: latest`. Its successful 2026-08-17 execution
`d11-prisma-runner-z8s66` emitted `HTTP_STATUS=200`,
`PROJECT_ID=proj_cmspqhtsz2dti12f55eww2w0o`, and
`DEFAULT_REGION=ap-southeast-1`. Prisma's official FAQ
(`https://www.prisma.io/docs/postgres/faq`, retrieved 2026-08-17 Asia/Bangkok)
maps that identifier to Singapore. This preserves custody and logging
boundaries but does not establish provider capability or production readiness.
It must continue
to prohibit
production access, real School financial/personal data, credentials in
source/client/logs, public bucket/URL exposure, offline business-data reads,
queued writes, local persistence, and synchronization. No Prisma URI or GCS
service-account JSON key has been read, created, or stored by this task.

**Product Owner-supplied Prisma response - 2026-08-16:** A supplied response
body identifies the exact project as `schoolBanchee` and reports
`defaultRegion=ap-southeast-1`. This remains historical partial project
metadata; the current controlled runner result and Prisma FAQ mapping are the
accepted D11 evidence.

## Acceptance Audit

| P0-08 acceptance element | Result | Evidence or gap |
| --- | --- | --- |
| PostgreSQL hosting model, environment separation, operator, and ownership documented | Partially satisfied | D01 selects Prisma Postgres Free in Singapore; D02 selects Private Business / Product Owner data/operations/support accountability. Provider-specific service evidence remains D11. |
| Connectivity/offline boundary distinguishes reads, queued writes, local persistence, synchronization, and recovery | Satisfied as approved fail-closed policy | D03 rejects offline reads, queued writes, local persistence, and synchronization; connected server-side drafts remain separately gated. |
| RPO explicitly documented | Satisfied as approved target | D04 approves `RPO <= 24 hours`, continuous 24x7, for authoritative PostgreSQL and required recovery metadata; provider-specific proof remains open. |
| RTO explicitly documented | Satisfied as approved target | D05 approves `RTO <= 12 hours` through recovery-quarantine release, with financial writes blocked pending Product Owner validation; provider-specific proof remains open. |
| Encryption and key/secret ownership documented | Partially satisfied | D06 makes encryption mandatory and D07 delegates System Admin operational custody without P0-04/RBAC expansion. Key model, rotation/revocation, configuration, and verification remain open. |
| Backup content, frequency, retention, encryption, ownership, restore, verification, and protection documented | Partially satisfied | D08 selects intended Prisma Postgres Free backup/PITR service; D09 approves policy in principle; D10 selects quarterly isolated drills and duties. All service configuration and provider-specific proof remain open. |
| Serializable transaction support confirmed | Satisfied only at architecture level | PostgreSQL/Prisma requirement is approved. D11 may later establish limited non-business provider compatibility facts; implemented transaction behavior remains `P1-03`, `P1-09`, and `P1-10` work |
| Financial, audit, evidence, authentication/authorization, School-isolation, and fail-closed risks evaluated | Satisfied for design | Safety evaluation and restore correctness requirements |
| Accountable approval makes production boundary enforceable | **Satisfied for decision/architecture readiness; production remains separately gated** | D01-D10 decisions are recorded; the D11 class amendment, IAM-remediation ratification, controlled-runner design, successful redacted Prisma result, Prisma-controlled Singapore mapping, and redacted no-public-principal bucket result pass. Provider capability, recovery, and final production authorization remain later gates; `P5-12` is required for production authorization |

**P0-08 status:** `DECISION/ARCHITECTURE READY`. D01-D10 decision values and the D11 class amendment, IAM-remediation ratification, controlled-runner design, successful redacted Prisma result, Prisma-controlled Singapore mapping, and redacted no-public-principal bucket result are recorded. No provider capability, encryption-at-rest, PostgreSQL compatibility, backup/PITR, restore, or production authorization is implied; production financial posting, production access, and real-School-data use remain unauthorized pending their later tasks and `P5-12`.

**Exact next action:** Proceed to the separately dependent Phase 1 provider
capability and recovery tasks. Do not treat this D11 result as production
authorization; `P5-12` remains the final production gate.
