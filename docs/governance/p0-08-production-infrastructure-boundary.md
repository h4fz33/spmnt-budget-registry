# P0-08 Production Infrastructure Boundary

**Status:** BLOCKED; private Product/Infrastructure Owner approval and provider-specific evidence required
**Prepared:** 2026-08-10
**Testing scope:** Synthetic/anonymized 17-School bootstrap fixture only; no real School financial or personal data and no live deployment commitment
**Related decisions:** [ADR-0003](../adr/0003-nextauth-and-approved-registration.md), [ADR-0004](../adr/0004-prisma-and-postgresql-for-persistence.md), [P0-04 Authorization Matrix](./p0-04-authorization-matrix.md), and [P0-07 draft matrix](./p0-07-evidence-retention-export-matrix.md)

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
deployment commitment. This boundary does not select any provider, region,
operator, RPO/RTO, key owner, backup service, or restore owner.

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
| Hosting/operator/provider | D01 selects managed PostgreSQL using Prisma Postgres Free tier in Singapore, contracted and approved by Private Business / Product Owner. Network boundary, operator/support split, SLA, and service proof remain open. | `D01 SELECTED; verification and dependent decisions OPEN`; `OWNER-STATEMENT-2026-08-14-D01` |

The selected PostgreSQL/Prisma architecture does not by itself prove that an unselected hosting service supports the required transaction, backup, encryption, and recovery behavior. Provider-specific verification remains mandatory before production use.

## Environment And Hosting Boundary

| Environment | Required boundary | Current decision state |
| --- | --- | --- |
| Development | Isolated non-production PostgreSQL and credentials; synthetic/anonymized data only; no production secret, backup, evidence object, or live School data reuse. Local setup and reset workflow belong to P1-03. | Boundary is a `REPOSITORY REQUIREMENT`; runtime/service selection is `OPEN` for P1-02/P1-03 |
| Test/CI | Ephemeral or isolated PostgreSQL compatible with production transaction semantics; repeatable migrations/seeds; destructive reset limited to test data; integration tests must exercise serializable conflicts and School isolation. | Boundary is a `REPOSITORY REQUIREMENT`; CI service is `OPEN` for P1-03/P1-13 |
| Production | One authoritative shared PostgreSQL write model, private from direct end-user access, reached only by authorized application/runtime and operational paths. Production data and secrets never flow down to development/test. | Logical model and D01 selection are recorded; production enablement remains blocked by D02-D11 and provider-specific proof |
| Restore verification | Isolated recovery environment with production-equivalent PostgreSQL semantics and strictly controlled access. A restore must never overwrite production merely to test recoverability. | `REPOSITORY REQUIREMENT`; owner, environment, and runbook are `OPEN` |

**D01 hosting decision:** use managed PostgreSQL through Prisma Postgres Free tier in Singapore, with PostgreSQL + Prisma ORM. This is the Product Owner's selected D01 value effective 2026-08-14. The Free tier does not establish RPO, RTO, high availability, backup/PITR, restore capability, encryption/key custody, provider SLA, or technical compatibility; each remains a separate decision/evidence requirement.

Any selected production service must provide evidence for:

1. PostgreSQL transactions at `SERIALIZABLE` isolation, row locking, foreign keys, checks, unique indexes, exact `numeric` values, and Prisma migrations.
2. TLS-protected connectivity, private/restricted network access, connection limits/pooling compatible with Prisma, and fail-closed startup when required configuration or transactional connectivity is invalid.
3. Transaction-consistent backups or point-in-time recovery that do not split committed financial state, Audit Log records, report metadata, or related references.
4. Encryption, key-custody, backup, restore, monitoring, incident, maintenance, availability, and data-residency terms accepted by the named owners.
5. Restore export controls that prevent a database copy or support workflow from bypassing P0-04 and P0-07 boundaries.

## Connectivity And Offline Boundary

The authoritative financial state exists only on the connected server and PostgreSQL transaction. The repository has not approved an offline transaction engine or synchronization protocol. Until P0-08-D03 is approved, financial and privileged writes fail closed whenever the application cannot authenticate the actor, re-check authorization/membership, resolve current policy, validate authoritative balances/revisions, or commit the complete server transaction.

| Capability during network loss | Current boundary | Reason |
| --- | --- | --- |
| Read-only/offline UX | No offline access to financial, personal, evidence, audit, or authorization data is approved. A static shell or connectivity error may render, but cached business data must not be presented as current authoritative state. | Cached scope, privacy, staleness, revocation, and retention behavior are unapproved |
| Queued writes | Prohibited pending approval. The browser/service worker must not queue a financial, approval, membership, policy, audit, export, or correction command for later execution. | Execution-time state and actor authority cannot be verified offline |
| Local persistence | Prohibited for financial records, evidence, credentials/tokens beyond approved session handling, authorization data, and command payloads. No browser database or durable device draft is approved. | Device custody, encryption, deletion, privacy, and cross-user exposure controls are unspecified |
| Synchronization | No client conflict-resolution, replay, merge, or background synchronization protocol is approved. Server idempotency/retry after a connected submission is not offline synchronization. | Silent replay could duplicate or reorder financial effects |
| Manual recovery | After connectivity returns, the user must re-authenticate when required, reload authoritative state, and intentionally retry or re-enter an uncommitted command. The same idempotency key is reused only when retrying an uncertain connected submission. | Preserves server authority and makes uncertain outcomes explicit |

**Proposed pilot decision:** require continuous connectivity for business reads and commands; permit only connected, server-side drafts when later implemented and authorized. Do not implement offline business-data caching, queued writes, local financial persistence, or synchronization for the pilot. This proposal requires Product Owner approval and must not be treated as approved policy.

## Recovery Objectives

| Objective | Repository evidence | Current status |
| --- | --- | --- |
| Recovery Point Objective (RPO) | The Blueprint records a candidate target of `RPO <= 24 hours`. | `OPEN`; candidate only, not an approved loss tolerance or provider guarantee |
| Recovery Time Objective (RTO) | The Blueprint records a candidate target of `RTO <= 4 hours`. | `OPEN`; candidate only, not an approved restoration commitment or provider guarantee |

The approved objectives must define the measured start/end events, covered production components, business calendar/24x7 interpretation, degraded-mode acceptance, escalation owner, and evidence produced by a recovery drill. Backup frequency alone does not prove RPO, and a provider restore estimate alone does not prove application RTO.

## Encryption, Secrets, And Key Ownership

| Control | Required production boundary | Current status |
| --- | --- | --- |
| Encryption in transit | TLS for application-to-PostgreSQL, operational access, backup transfer, and private evidence/object transfer; certificate validation must fail closed. | `PROPOSED mandatory control`; protocol/version, certificate owner, and verification evidence are `OPEN` |
| Database/storage encryption at rest | Encrypt PostgreSQL data volumes, snapshots, replicas, temporary recovery copies, and provider-managed storage. | `PROPOSED mandatory control`; service and key model are `OPEN` |
| Backup encryption | Encrypt every backup and restore staging copy in transit and at rest; access must be narrower than ordinary application access. | `PROPOSED mandatory control`; service, key model, and operator are `OPEN` |
| Evidence/object encryption | P0-07 proposes private encrypted object storage. Exact service, region, key owner, and retention are unresolved and remain governed by BLK-006. | `OPEN`; P0-08 must not approve P0-07-D01 or D10 |
| Application secrets | `DATABASE_URL`, `NEXTAUTH_SECRET`, provider credentials, and similar runtime secrets must come from a controlled secret-delivery mechanism, not source control or client code. | Configuration boundary is a `REPOSITORY REQUIREMENT`; secret service/custodian/rotation are `OPEN` |
| Encryption keys | Database/storage/backup keys must be distinct in ownership and access purpose from application runtime secrets where the selected service permits it. Application code and ordinary business roles must not receive raw encryption keys. | `PROPOSED`; KMS/provider and custody model are `OPEN` |
| Rotation/revocation | Named owners must define rotation triggers/frequency, emergency revocation, overlap/re-encryption behavior, audit evidence, and recovery when a key or secret is lost/compromised. | `OPEN` |

P0-04 application roles do not automatically confer infrastructure authority. In particular, System Admin's diagnostic/technical-executor boundary does not silently make that role the database owner, backup custodian, secret owner, or encryption-key owner. Private Business / Product Owner must name the infrastructure operator, security/key custodian, backup operator, and restore approver, including segregation and emergency access rules.

## Backup And Recovery Model

### Protected Content

The recovery set must include:

- the complete PostgreSQL database, including canonical financial records, organization/fiscal-year scope, authorization and membership history, policy resolutions, idempotency/outbox state, report metadata, Audit Log history, corrections, immutable revisions, and integrity metadata;
- schema migrations and the application version/configuration identifiers required to interpret the restored database;
- private evidence/report objects and their metadata only after P0-07 approves their production storage and retention boundary; and
- the object/reference manifest needed to detect missing, extra, mismatched, or cross-School artifacts.

Source code remains protected through the version-control/release process rather than being treated as a database backup. Runtime secrets and raw encryption keys must not be embedded in database backups; their separately controlled recovery path must be documented and tested.

### Repository Baseline And Open Operations

| Topic | Repository baseline | Approval/service gap |
| --- | --- | --- |
| Database/report metadata frequency | Blueprint says back up the database and report metadata daily and record backup health. | Daily is a repository target, not an approved RPO proof; exact schedule, timezone, PITR/log capture, and service are `OPEN` |
| Restore verification | Blueprint says test restoration quarterly; P1-12 requires restore into a clean environment and schema/relation/total verification. | Quarterly is a repository target; named restore owner, runbook, isolated environment, evidence, and acceptance authority are `OPEN` |
| Retention | `PO-REP-2026-08-12-D10` approves one monthly generation, no automatic age expiry/destruction, hold protection, System Admin operation and administratively controlled restore as Product Owner policy. | P0-08-D09 still requires accountable infrastructure/security/operations acceptance and implementability evidence; D10 selects no provider/product/region/platform |
| Immutability/protection | Backups must resist deletion, overwrite, ransomware, credential compromise, and unauthorized export. | Immutability/WORM, separate account/vault, deletion quorum, and break-glass rules are `OPEN` |
| Operational service | No backup provider, managed feature, secondary store, or cross-region model is selected. | `OPEN` |
| Restore responsibility | No database restore operator, application recovery lead, security approver, or business validation owner is named. | `OPEN` |

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
| `P0-08-D02` | Name the organizational data owner, infrastructure/database operator, support/escalation owner, and provider responsibility split. | No inferred owner from application roles |
| `P0-08-D03` | Approve continuous-connectivity/offline scope separately for read-only UX, queued writes, local persistence, synchronization, connected drafts, and manual recovery. | Financial/privileged writes fail closed; no offline business-data feature approved |
| `P0-08-D04` | Approve RPO, measurement boundary, covered components, business interpretation, and stricter category-specific target if required. | `OPEN`; Blueprint candidate `<= 24 hours` only |
| `P0-08-D05` | Approve RTO, measurement boundary, covered components, degraded-mode rule, escalation, and business validation authority. | `OPEN`; Blueprint candidate `<= 4 hours` only |
| `P0-08-D06` | Approve encryption-in-transit, database/storage-at-rest, backup, and evidence-object encryption requirements and accepted service evidence. | No provider/configuration approval |
| `P0-08-D07` | Name secret owner, database/storage/backup key owner, custodians, rotation/revocation authority, emergency path, and audit/segregation rules; select a service only after approval. | No KMS/provider or key owner invented |
| `P0-08-D08` | Select backup/PITR service and schedule, consistency method, monitoring/alerting, failure escalation, secondary-copy strategy, and access boundary. | Blueprint daily target only; no operational service selected |
| `P0-08-D09` | Jointly approve backup retention/generations, legal-hold interaction, immutability/deletion protection, and secure destruction with P0-07-D10. | P0-07-D10 policy input approved under `PO-REP-2026-08-12-D10`; P0-08 authority/implementability acceptance remains `OPEN` |
| `P0-08-D10` | Name restore operator, recovery lead, security approver, business validation owner, isolated restore environment, runbook, drill frequency, and evidence/sign-off path. | Blueprint quarterly target only; no restore authority inferred |
| `P0-08-D11` | Obtain provider-specific proof and project verification that PostgreSQL/Prisma migrations, `SERIALIZABLE`, row locks, retry/idempotency, constraints, School isolation, encryption, backup, and restore requirements all work on the selected service. | Production financial posting remains disabled |

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
| `P0-08-D02` | `A` | `O` accepts operator/support duties; `S` accepts security-escalation boundary | Named organizational data owner, infrastructure/database operator, support/escalation owner, provider responsibility split, and documented delegation where applicable | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D03` | `P` | `S` review for any cached/local data; `O` connectivity/support feasibility | Separate approve/reject answers for offline read-only business data, queued writes, local persistence, synchronization, connected server-side drafts, and manual recovery | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D04` | `A` | `P` states business loss tolerance and covered records; `O` proves achievable service design | Approved RPO, measurement start/end, covered components/data, 24x7 or business-calendar interpretation, exceptions, and escalation | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D05` | `A` | `P` states business recovery priority/degraded-mode acceptance; `O` proves achievable recovery design | Approved RTO, measurement start/end, covered components, degraded-mode rule, operating calendar, escalation, and business validation authority | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D06` | `S` | `O` supplies service/configuration evidence; `A` accepts any documented residual risk | Required encryption in transit, database/storage at rest, backups, restore copies, and evidence objects; certificate/enforcement requirements and accepted proof | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D07` | `A` for accountable ownership/delegation; `S` for custody/control design | `O` accepts assigned operational custody without receiving business authority | Named application-secret owner, database/storage/backup key owner, custodians, separation rules, rotation/revocation authority, emergency path, recovery path, and audit evidence | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D08` | `A` authorizes the service boundary | `O` selects and accepts the operational service/schedule; `S` approves access/protection; `P` confirms protected business content | Backup/PITR service, transaction-consistency method, schedule/timezone, monitoring/alerting, failure escalation, secondary-copy strategy, protected content, and access boundary | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D09` | `R` jointly with `A` | `S` approves deletion/immutability protection; `O` confirms implementability and propagation | Backup generations/period, legal-hold behavior, immutability/deletion protection, secure destruction, disposal evidence, and reconciliation with P0-07-D10 | `POLICY INPUT APPROVED; A/S/O ACCEPTANCE OPEN` | `PO-REP-2026-08-12-D10` | 2026-08-13 |
| `P0-08-D10` | `A` approves accountable recovery delegation | `O` names/accepts restore and recovery duties; `S` accepts security approval duties; `P` names/accepts business validation | Restore operator, recovery lead, security approver, business validation owner, isolated environment, runbook owner/reference, drill frequency, temporary-copy disposition, and sign-off evidence | `OPEN` | `OPEN` | `OPEN` |
| `P0-08-D11` | `A` grants final production authorization after evidence acceptance | `O` produces technical proof; `S` accepts security/isolation proof; `P` accepts business recovery and School-boundary results | Evidence references and pass/fail results for Prisma migrations, PostgreSQL `SERIALIZABLE`, row locks, retry/idempotency, constraints, School isolation, encryption, backup restore, Audit Log/history preservation, and RPO/RTO drill | `OPEN` | `OPEN` | `OPEN` |

### Returned Evidence Reconciliation - 2026-08-12

The repository, attachments available to this task, current P0-07 D01/D10 state, and governance-alignment evidence were rechecked after the decision sheet was issued. `PO-REP-2026-08-12-D10`, effective 2026-08-13, now supplies the Product Owner policy input for backup scope, monthly generation, no automatic age expiry/destruction, holds, System Admin operation, controlled raw export/restore, and auditability. It selects no provider/product/region/platform and does not supply the separately required `A` infrastructure acceptance, `S` protection approval, or `O` implementability confirmation, so P0-08-D09 remains partially unresolved. No returned document contains a complete accountable P0-08 selected value/sign-off or D11 provider-specific pass evidence. The P0-07 Product Owner record `PO-REP-2026-08-12-D01` approves OBEC as the organizational data owner for the P0-07 storage classification, but explicitly leaves provider and region to P0-08; it still does not resolve D01 or D02.

The authoritative `OWNER-STATEMENT-2026-08-14` boundary is now reconciled above. It supersedes the private-product authority interpretation only: Private Business is accountable, SESAO is advisory, and bootstrap data is synthetic/anonymized. The additional `OWNER-STATEMENT-2026-08-14-D01` input selects managed Prisma Postgres Free tier in Singapore, PostgreSQL + Prisma ORM, and Private Business contracting/accountability. It does not resolve RPO, RTO, HA, backup/PITR, restore, encryption/key custody, provider SLA, D02 operator duties, or D11 technical proof.

| ID | Authoritative response/evidence actually supplied | Reconciliation against required authority | Status |
| --- | --- | --- | --- |
| `P0-08-D01` | Product Owner decision input selects managed PostgreSQL, Prisma Postgres Free tier, Singapore region, PostgreSQL + Prisma ORM, Private Business as product/infrastructure authority and contracting authority, synthetic/anonymized data only, and no real School financial or personal data. Effective 2026-08-14. | Selected value is recorded. Provider-specific PostgreSQL/Prisma compatibility, service terms, network/data-residency proof, and required `O`/`S`/`P` verification remain required; Free tier does not imply RPO/RTO, HA, backup/PITR, restore, encryption/key custody, or SLA. | `SELECTED; VERIFICATION OPEN` |
| `P0-08-D02` | The effective 2026-08-14 owner statement makes Private Business / Product Owner the product, infrastructure, test-data governance, and risk authority. The earlier P0-07 D01 classification does not make OBEC the private product or infrastructure owner. No database operator, support owner, escalation owner, or provider responsibility split was supplied. | Accountable authority is identified, but the exact D02 operating model and required `O`/`S` duty acceptances are absent. | `OPEN` |
| `P0-08-D03` | No returned decision separately approves or rejects offline reads, queued writes, local persistence, synchronization, connected drafts, or manual recovery. | Required `P` decision and `S`/`O` review are absent; existing fail-closed safe state remains. | `OPEN` |
| `P0-08-D04` | No approved RPO, measurement boundary, covered components, calendar interpretation, exception, or escalation returned. | Required `A` decision, `P` loss-tolerance input, and `O` feasibility proof are absent. | `OPEN` |
| `P0-08-D05` | No approved RTO, measurement boundary, degraded-mode rule, calendar, escalation, or business validation authority returned. | Required `A` decision, `P` recovery-priority input, and `O` feasibility proof are absent. | `OPEN` |
| `P0-08-D06` | No returned encryption control decision or accepted provider/configuration evidence for transit, storage, backup, restore copies, or evidence objects. | Required `S` decision, `O` proof, and any `A` residual-risk acceptance are absent. | `OPEN` |
| `P0-08-D07` | No secret owner, key owner, custodian, rotation/revocation authority, emergency path, recovery path, or audit evidence returned. | Required `A` accountable ownership/delegation, `S` custody design, and `O` duty acceptance are absent. | `OPEN` |
| `P0-08-D08` | No backup/PITR service, schedule, consistency method, monitoring, escalation, secondary-copy strategy, protected-content decision, or access boundary returned. | Required `A` authorization and `O`/`S`/`P` inputs are absent. | `OPEN` |
| `P0-08-D09` | `PO-REP-2026-08-12-D10` supplies the `R`/Product Owner policy input: one monthly generation, no automatic age expiry/destruction, specified holds, System Admin operation, controlled raw export/restore, and auditable outcomes. It selects no provider/product/region/platform. | Required `A` infrastructure acceptance, `S` deletion/immutability protection approval, and `O` implementability/propagation confirmation remain absent. | `PARTIALLY RESOLVED — POLICY INPUT APPROVED` |
| `P0-08-D10` | No restore operator, recovery lead, security approver, business validator, restore environment, runbook, drill frequency, copy disposition, or sign-off path returned. | Required `A` delegation and `O`/`S`/`P` duty acceptance are absent. | `OPEN` |
| `P0-08-D11` | Prisma Postgres is selected by D01, but no provider-specific migration, `SERIALIZABLE`, row-lock, retry/idempotency, constraint, School-isolation, encryption, backup/restore, Audit Log/history, or RPO/RTO drill result was returned. | Required technical proof and `A`/`O`/`S`/`P` acceptance are absent. Production authorization cannot pass. | `OPEN` |

### Required Sign-Off

| Authority | Decision | Name/reference | Date | Conditions |
| --- | --- | --- | --- | --- |
| `A`: Private Business accountable Product/Infrastructure Owner | D01 selected; D02/D04/D05/D07-D11 decisions `OPEN` | `OWNER-STATEMENT-2026-08-14-D01`; `OWNER-STATEMENT-2026-08-14`; ADR-0015 | `2026-08-14` | Must approve assigned decisions and authorize production only after D11 passes; D01 selection does not approve provider capability claims |
| `P`: Private Business / Product Owner | Authority identified; D03 and assigned business acceptances `OPEN` | `OWNER-STATEMENT-2026-08-14`; ADR-0015 | `2026-08-14` | Must decide D03 and accept business inputs/validation assigned under D01, D04, D05, D08, D10, and D11 |
| `O`: Named operations owner | `OPEN` | `OPEN` | `OPEN` | Accept the exact operator, support, backup, monitoring, incident, restore, drill, and evidence-production duties assigned in D01-D11 |
| `S`: Named security owner | `OPEN` | `OPEN` | `OPEN` | Approve D06 and security portions of D01-D03 and D07-D11; accept key/access/recovery-security responsibilities |
| `R`: P0-07 records/retention authority | `OPEN` | `PO-REP-2026-08-12-D10` | 2026-08-13 | Existing policy input remains limited to D09; this task does not modify P0-07 |

## Acceptance Audit

| P0-08 acceptance element | Result | Evidence or gap |
| --- | --- | --- |
| PostgreSQL hosting model, environment separation, operator, and ownership documented | Partially satisfied | D01 selects Prisma Postgres Free tier in Singapore and Private Business accountability; operator/support split and provider evidence remain D02/D11 gaps |
| Connectivity/offline boundary distinguishes reads, queued writes, local persistence, synchronization, and recovery | Satisfied as fail-closed draft | No offline business-data behavior is approved; exact Product Owner decision remains P0-08-D03 |
| RPO explicitly documented | Satisfied as open candidate | Blueprint candidate `<= 24 hours`; approval remains P0-08-D04 |
| RTO explicitly documented | Satisfied as open candidate | Blueprint candidate `<= 4 hours`; approval remains P0-08-D05 |
| Encryption and key/secret ownership documented | Satisfied as approval requirements | Exact controls, provider, owners, and rotation remain P0-08-D06/D07 |
| Backup content, frequency, retention, encryption, ownership, restore, verification, and protection documented | Satisfied as approval requirements | Daily/quarterly Blueprint targets recorded; service/retention/owners/protection remain P0-08-D08 through D10 and P0-07-D10 |
| Serializable transaction support confirmed | Satisfied only at architecture level | PostgreSQL/Prisma requirement is approved; selected-service proof remains P0-08-D11 |
| Financial, audit, evidence, authentication/authorization, School-isolation, and fail-closed risks evaluated | Satisfied for design | Safety evaluation and restore correctness requirements |
| Accountable approval makes production boundary enforceable | **Not satisfied; re-verified 2026-08-14** | D01 is selected, but P0-08-D02-D08, D10-D11 and required duty/sign-off rows remain open; no provider-specific D11 proof exists |

**P0-08 status:** `BLOCKED`. The approved PostgreSQL/Prisma and NextAuth choices remain unchanged, but production hosting, connectivity policy, recovery objectives, encryption/key ownership, backup service, and operational ownership cannot be approved from current repository evidence.

**Exact next action:** Private Business / Product Owner must next decide D02-D05 and D06-D10, including named operations/security owners and explicit Free-tier suitability constraints; then the technical owner must attach Prisma Postgres-specific D11 evidence in a non-production verification environment. Until then, every unresolved decision remains `OPEN` and no production use or real School data is authorized.
