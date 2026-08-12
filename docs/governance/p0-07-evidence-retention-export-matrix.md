# P0-07 Evidence Retention and Export Matrix

**Status:** Draft approval pack; Product Owner/accountable-reviewer approval required
**Decision authority:** SESAO Narathiwat Product Owner / accountable reviewer
**Authorization authority:** [P0-04 Final Authorization Matrix](./p0-04-authorization-matrix.md)
**Prepared:** 2026-08-10
**Decision package verified:** 2026-08-12
**Pilot scope:** All 17 SESAO Narathiwat Schools, each retaining its independent School record boundary

This document inventories the evidence created or referenced by the current Blueprint and P0-04 Authorization Matrix and proposes enforceable storage, privacy, retention, export, deletion, and audit rules for the pilot. It does not amend P0-04. Where no supplied legal or policy source establishes a retention period, the period is `OPEN - PRODUCT OWNER INPUT REQUIRED`; the application must not invent a duration.

## Approval State and Fail-Closed Rule

P0-07 is not complete until the Product Owner/accountable reviewer approves every `OPEN` decision and signs the matrix. Until then:

- no automated evidence deletion or destructive expiry is permitted;
- no export category is enabled in production;
- immutable historical records and their integrity metadata remain preserved;
- an `OPEN` retention value is not interpreted as permanent legal retention;
- a later approved retention rule applies prospectively and must define treatment of evidence already held;
- legal hold, investigation, unresolved correction, open obligation, active audit, stale/replacement dependency, and pending appeal or dispute suspend otherwise eligible destruction.

This temporary preservation rule is a fail-closed pilot control, not a claimed statutory retention period.

## Storage Boundary

| Storage class | Content | Required controls |
| --- | --- | --- |
| `DB-STRUCTURED` | Canonical financial records, evidence metadata/references, approvals, assignments, policy resolutions, report metadata, audit events, export-attempt metadata | PostgreSQL through Prisma; organization-scoped relations; restrictive deletion; immutable revisions where required; encryption at rest/in transit; backup under P0-08 |
| `OBJECT-PRIVATE` | Uploaded scans, images, PDFs, signed forms, generated report/export artifacts when the approved category permits storage | Private encrypted object storage; no public bucket or permanent public URL; opaque object key; integrity hash, media type, byte size, uploader, School/organization scope, evidence category, created time, source date, and malware-scan status; access only through short-lived authorized retrieval |
| `EXTERNAL-CONTROLLED` | Physical originals, bank statements, cash-count/custody proof, government-system records, or other artifacts the Blueprint keeps outside the application | Store a structured reference only: issuing/custodian organization, document type/number, source date, physical or system location, responsible custodian, verification status/time/actor, integrity hash when a digital copy is available, and access instructions that contain no secret |
| `SOURCE-REPOSITORY` | Supplied historical policy/research sources already preserved in `reseach/` | Read-only historical source; preserve original bytes and recorded hash; do not modify through P0-07 |

Evidence content must never be embedded in object keys, URLs, correlation IDs, display codes, notification text, or System Logs. Short-lived access must be re-authorized at retrieval time and must not outlive the configured expiry. Maximum upload size, allowed media types, malware-scanning service, access-link lifetime, and object-storage/key owner remain `OPEN - PRODUCT OWNER INPUT REQUIRED` (P0-07-D01 through D04).

## Privacy Classification

| Class | Meaning | Minimum handling |
| --- | --- | --- |
| `PUBLIC` | Official source already lawfully public and approved for public release | Integrity and source attribution still required; public status does not make internal annotations public |
| `INTERNAL` | Non-public operational metadata with no sensitive evidence content | Authenticated access within the exact authorized organizational/command boundary |
| `CONFIDENTIAL` | School financial, commercial, report, policy-publication, or governance evidence | Private storage, least privilege, School/assigned scope, audited access/export, redaction where an aggregate does not require detail |
| `RESTRICTED` | Personal identity/contact data, credentials/authentication data, bank/account/payee data, signatures, appointment evidence, workpapers/findings, or other content whose disclosure creates heightened privacy, security, or audit risk | Named-role and exact-record authorization, re-authentication for sensitive export, no public links, no System Log content, redaction/minimization, separately recorded access/export outcome |

Classification is content-driven. A category marked `CONFIDENTIAL` becomes `RESTRICTED` when an artifact contains a personal identifier, signature, bank/account detail, credential/authentication data, protected finding, or similarly sensitive field.

## Retention Rule Codes

| Code | Rule | Deletion/expiry behavior | Source status |
| --- | --- | --- | --- |
| `R-IMMUTABLE` | Preserve the canonical record, all revisions, links, attribution, hashes, and replacement history permanently within the application's historical record; no destructive expiry | No hard delete or cascade delete. Correction, supersession, revocation, stale status, replacement, and archive add history rather than overwrite it. Binary handling still requires owner approval where the canonical record can retain an external reference instead. | Project control required by Blueprint invariants and P0-04; not asserted as a statutory duration |
| `R-SOURCE-LIFE` | Preserve an unchanged policy/source artifact and integrity metadata for every Policy Version or authorization decision that depends on it | Never delete while referenced; supersession preserves the prior source/version. Final disposition beyond the application lifetime requires Product Owner and records-authority approval. | ADR-0006/0011 and `AUTH-08`/`AUTH-22`; no legal duration supplied |
| `R-BUSINESS-OPEN` | Retain while the business record, obligation, correction, audit, report replacement chain, dispute, or legal hold is active, then for an approved closed-record period | Destruction is disabled until the closed-record period and disposal authority are approved. | B.E. 2515/Blueprint establish the record/control need, not a verified retention duration |
| `R-ACCOUNT-OPEN` | Retain through the registration/account/membership/appointment lifecycle and then for an approved post-closure period | No destructive expiry until P0-10 and P0-07 approve exact states, duration, and deletion/anonymization behavior. | P0-04 and ADR-0003/0008/0010/0011 establish history; duration unsupported |
| `R-AUDIT-OPEN` | Retain audit evidence for the active cycle, follow-up, replacement history, dispute/legal hold, and then an approved audit-record period | Finalized cycles and their structured evidence remain immutable. No destructive expiry until an audit retention period and disposition authority are approved. | Blueprint audit invariants and ADR-0012; duration unsupported |
| `R-SECURITY-OPEN` | Retain security/diagnostic metadata only for the approved operational security period | Content-minimized rotation/deletion required after the approved period; until approved, production logging/export remains limited to the minimum fields in this matrix and no sensitive payload may be logged. | Security need is project-derived; duration unsupported |
| `R-EXPORT-EPHEMERAL` | Retain generated export artifact only for an approved short download window; retain the export-attempt record under its applicable audit rule | Artifact expires and is securely deleted after the approved window; no production export until the window is approved. | Blueprint expiring-access requirement; duration unsupported |

## Evidence Inventory and Retention Matrix

`Access` below describes runtime access and is subordinate to the exact command, evidence, state, and scope checks in P0-04. Product Owner approval of this matrix does not grant an application role.

| ID | Evidence category and examples | Classification | Access | Organization / School scope | Storage | Retention | Legal/policy source available | Exportability | Deletion / expiry | Audit-log requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `EV-01` | Registration application identity fields, School/role request, acknowledgements, review reason and outcome | `RESTRICTED` | Applicant receives only non-enumerating submission outcome; System Admin platform lifecycle under `AUTH-02`; ESAO Admin membership decision under `AUTH-03` | One application and selected School; System Admin platform metadata boundary; ESAO Admin all-17-School decision boundary | `DB-STRUCTURED`; approved supporting artifact only in `OBJECT-PRIVATE` | `R-ACCOUNT-OPEN` | ADR-0003 and `AUTH-01` through `AUTH-03`; no duration supplied | Prohibited pending P0-10/P0-07 approval; never include password hash, credential, token, or recovery secret | State transition, restricted anonymization, and post-closure period are open; no hard delete while decision/history is referenced | Submission outcome, decision actor, subject, School, old/new state, reason, time, and denied attempts; never log credential content |
| `EV-02` | Authentication/security evidence: sign-in/out, recovery, suspension, session-security outcome, authorization revision | `RESTRICTED` | System Admin only within `AUTH-02`/`AUTH-28` operational boundary; subject-facing access requires later policy | Platform/account scope; no School financial content | `DB-STRUCTURED` security event metadata; secrets remain in dedicated credential stores, never evidence artifacts | `R-SECURITY-OPEN` | ADR-0003 and Blueprint security controls; no duration supplied | Prohibited export; approved diagnostic report may contain redacted metadata only after P0-07 approval | Rotate/delete only under approved security schedule; credentials/tokens are never retained in logs | Record outcome, actor/subject opaque IDs, reason code, time, IP/device data only if separately approved; no password, token, secret, or request body |
| `EV-03` | Membership, School-role, Director, verifier, Auditor assignment, bootstrap, appointment, revocation, Policy Publisher designation/current-status evidence | `RESTRICTED` | Only actors and technical executors named by `AUTH-03` through `AUTH-09`, `AUTH-25`; subject access is not implied | Exact membership/appointment/assignment; fixed School or all-17-School scope defined by the command | `DB-STRUCTURED`; appointment/order artifact in `OBJECT-PRIVATE` or `SOURCE-REPOSITORY`; official-page check as controlled reference/snapshot | `R-IMMUTABLE` plus `R-SOURCE-LIFE` for relied-on source artifacts | P0-04, ADR-0008/0010/0011/0012; no legal duration supplied | `EX-MEMBERSHIP` only for authorized administrative evidence after approval; raw appointment/signature bulk export prohibited | Revocation/ replacement ends authority but never deletes history; preserve old/new assignment and evidence linkage | Actor/authority/executor, subject, exact scope, evidence reference/hash, old/new state, reason, time, outcome, denied/replay attempts |
| `EV-04` | Policy source, hash, citation, official status/scope check, effective range, publication validation and resolution history | `PUBLIC` source text when already official-public; internal annotations `CONFIDENTIAL`; personal designation fields `RESTRICTED` | Current Policy Publisher for `AUTH-22`; System Admin only exact `AUTH-08` technical application; historical application reads only where separately authorized | All 17 Schools for publication; exact Policy Version and source | `SOURCE-REPOSITORY` or `OBJECT-PRIVATE` unchanged artifact plus `DB-STRUCTURED` metadata | `R-SOURCE-LIFE` and `R-IMMUTABLE` for publication/resolution history | ADR-0006/0011; `AUTH-08`, `AUTH-22`, `AUTH-23` | `EX-POLICY` permits unchanged public source plus approved non-sensitive citation metadata; internal checks/designation data excluded | Supersede, never retire/delete; preserve original bytes/hash and historical resolutions | Actor, designation/current-status/scope evidence, source/hash, effective range, validation, prior/new version, outcome, denied mutation/overlap attempts |
| `EV-05` | Financial source documents: claims/requests, procurement/payment evidence, receipts, vouchers, State-Income remittance, Contract-Security receipt/return, Withheld-Tax recognition/remittance, Internal Money-Position Transfer, and direct-payment confirmation | `CONFIDENTIAL`, elevated to `RESTRICTED` for personal, bank/account, payee, signature, or commercial detail | Finance Officer for permitted own-School workflow; School Director for required approval/review; assigned SESAO Auditor only when referenced by exact active Assessment; no ESAO Admin/System Admin/ESAO Reviewer access | One School and Financial Event; Auditor exact assigned Assessment/School/period | Metadata in `DB-STRUCTURED`; artifact in `OBJECT-PRIVATE` or reference in `EXTERNAL-CONTROLLED` | `R-BUSINESS-OPEN`; canonical Document Record, hash/reference, revision and event link are `R-IMMUTABLE` after posting | B.E. 2515 baseline and Ministry of Finance B.E. 2562 overlay establish documentary control; no verified retention duration | `EX-SCHOOL-RECORDS` only after approval, own-School scope, field redaction and re-authentication; external artifact export requires category permission | Posted record/reference never hard-deleted; corrected/archived state preserves original. Binary disposition period is open and must preserve reviewability | Create/view/replace-reference/verify/export actions, actor, School/event, category, hash/version, outcome; no document content in log |
| `EV-06` | Official Advance agreement, estimate, purpose/activity/travel, eligibility/prior-advance check, settlement and unused-return evidence | `RESTRICTED` | Finance Officer own School; active School Director approval under `AUTH-12`; assigned Auditor only for exact Assessment evidence | One School, recipient, advance and settlement chain | Same as `EV-05` | `R-BUSINESS-OPEN`; posted advance/settlement history `R-IMMUTABLE` | B.E. 2515/Blueprint establish control and evidence; no duration supplied; P0-03 decisions remain untouched | `EX-SCHOOL-RECORDS` after approval with recipient/personal redaction unless strictly required | Never delete while outstanding/overdue, under correction, audit, dispute or hold; settled-history duration open | Eligibility/policy checks, preparer, Director approver, recipient reference, due control, evidence hash/reference, settlement, outcome |
| `EV-07` | Receipt Book inventory, serial range, custodian, issue/handover, return, used/void/unused/cancelled numbers and reconciliation | `CONFIDENTIAL`, elevated to `RESTRICTED` for custodian/signature data | Finance Officer own School under `AUTH-13`; assigned Auditor only for exact Assessment evidence | One School, fiscal year, book and serial range | `DB-STRUCTURED`; custody artifact private/external reference | `R-IMMUTABLE` for serial and status history; artifact under `R-BUSINESS-OPEN` | B.E. 2515 and `AUTH-13`; no duration supplied | `EX-SCHOOL-REPORT` for authorized custody/usage report; raw signed handover artifact excluded unless specifically permitted | Used/voided/cancelled numbers never reused or deleted; artifact disposition period open | Issue actor, custodian reference, range, evidence hash/reference, fiscal year, state/reconciliation, time, outcome |
| `EV-08` | Approvals, signatures, Daily Balance preparation/verification/approval evidence, daily inspection and discrepancy evidence | `RESTRICTED` | Exact own-School actors under `AUTH-16` through `AUTH-18`; assigned Auditor only when referenced by exact Assessment | One School, date/report/revision | `DB-STRUCTURED`; signed/external artifact private or controlled reference | Structured approval and revision history `R-IMMUTABLE`; artifact `R-BUSINESS-OPEN` | B.E. 2515, Blueprint, P0-04; no duration supplied | Included only in `EX-SCHOOL-REPORT` or `EX-SCHOOL-RECORDS` after approval; redact identity/signature unless official report requires it | Cannot overwrite or detach prior approval; stale/replacement preserves history; binary period open | Every prepare/verify/approve/deny action with actor, assignment revision, report revision, evidence reference, discrepancies, time, outcome |
| `EV-09` | Bank statement reference, bank reconciliation, monthly reconciliation/close package, obligations, exceptions and acceptance evidence | `RESTRICTED` | Finance Officer/School Admin only as authorized for own-School preparation; active School Director acceptance under `AUTH-19`; assigned Auditor only for exact Assessment evidence | One School and period/revision | `DB-STRUCTURED`; bank artifact remains `EXTERNAL-CONTROLLED` by default or approved `OBJECT-PRIVATE` | `R-BUSINESS-OPEN`; accepted close/reconciliation/replacement history `R-IMMUTABLE` | B.E. 2515/Blueprint and `AUTH-19`; no duration supplied | `EX-SCHOOL-REPORT` after approval; raw bank statement/account details prohibited unless an explicit restricted artifact category is later approved | No deletion while reconciliation/report is active, stale, disputed, under correction/audit/hold; period open | Preparer/acceptor, source and close revisions, external reference, obligations/discrepancies, stale propagation, time, outcome |
| `EV-10` | Linked/Privileged Correction proposal, reason, evidence, Director approval, executor, adjustment and stale dependencies | `RESTRICTED` | Proposer and active School Director/executor only under `AUTH-20`/`AUTH-21`; later oversight access requires an approved role | One School, closed source record and correction chain | `DB-STRUCTURED`; artifact private/external reference | `R-IMMUTABLE` | Blueprint invariant 10/11, P0-04 `AUTH-20`/`AUTH-21`; no legal duration supplied | Included in authorized `EX-AUDIT-REVIEW` or own-School record/report export only after approval; raw evidence bulk export prohibited | Original and correction chain never deleted, rewritten, replaced or re-parented | Proposal, source revision, reason/evidence hash/reference, Director, executor, linked adjustment, stale propagation, outcome and denied attempts |
| `EV-11` | Annual Self-Assessment evidence, findings, corrective actions, responses, submission/acceptance | `CONFIDENTIAL`, elevated to `RESTRICTED` for personal/finding content | Own-School authorized users; any ESAO access must follow a future exact approved command because `AUTH-24` is denied | One School and fiscal-year cycle | `DB-STRUCTURED`; artifact private/external reference | `R-BUSINESS-OPEN`; finalized revisions/report history immutable | B.E. 2515/Blueprint; no duration supplied | Own-School `EX-SCHOOL-REPORT` after approval; cross-School/aggregate export prohibited in initial pilot | No deletion while action/finding open or under audit/hold; finalized and replacement history preserved; artifact period open | Actor, cycle/item, evidence revision, finding/action change, submission/acceptance, export, outcome |
| `EV-12` | Audit Assessment Cycle, assignment history, workpapers, samples, observations, evidence references, findings, management responses, follow-up/re-test, score/result/rank snapshot and acceptance | `RESTRICTED` | Active assigned SESAO Auditor for exact Assessment under `AUTH-26`/`27`/`31`/`32`/`33`; School users only their authorized finalized report/response workflow; ESAO Admin assignment metadata only; ESAO Reviewer denied | Exact Assessment, School, period and resolved checklist/policy versions | `DB-STRUCTURED`; artifact private/external reference | `R-AUDIT-OPEN`; finalized structured cycle/workpapers/findings/snapshots/report and assignment history `R-IMMUTABLE` | Blueprint audit invariants and ADR-0012; B.E. 2544 instrument applicability remains blocked by BLK-004; no duration supplied | `EX-AUDIT-REPORT` and `EX-ASSIGNED-AUDIT-PACK` only after approval and exact scope; cross-School summary/ranking prohibited | Completion ends command authority but never deletes history; corrections create stale/replacement/follow-up revisions; artifact period open | Every assignment/content/finding/finalize/accept/view/export outcome with actor, assignment revision, exact scope, evidence/version and denied attempts |
| `EV-13` | Generated Daily/Monthly/Annual/financial/audit reports, exact filters, source/policy revisions, artifact metadata, stale/replacement chain | `CONFIDENTIAL` or `RESTRICTED` according to contained fields | Same authorization as underlying report category; no broader access from artifact possession | Exact School/report scope; assigned Assessment for audit report | Metadata `DB-STRUCTURED`; artifact `OBJECT-PRIVATE` | Metadata and stale/replacement chain `R-IMMUTABLE`; artifact `R-BUSINESS-OPEN` or `R-AUDIT-OPEN` | Blueprint reporting invariants; no duration supplied | Only the matching approved export category; classification and redaction carry into artifact | Never silently overwrite; mark Stale and create Replacement Report. Artifact disposition must not break reproducibility/review obligations | Generator, scope/filters, source/policy revisions, artifact hash, stale/replacement link, export event and outcome |
| `EV-14` | Append-only Audit Log for meaningful financial, governance, authorization, policy and export actions | `RESTRICTED` | Separately permissioned. P0-04 grants no generic raw-log reader/exporter; scoped application history may be shown only within the underlying command/data boundary | Platform metadata plus exact organization/School/target scope on each event | `DB-STRUCTURED` append-only with tamper evidence and separate permissions | `R-IMMUTABLE`; audit-retention duration/disposition beyond application lifetime remains Product Owner/records-authority input | Blueprint invariant 17 and P1-08; no legal audit-retention duration supplied | Raw/bulk Audit Log export prohibited. `EX-AUDIT-REVIEW` may render a scoped, redacted report only after exact access approval | No update/delete/cascade; correction is a new linked event; preserve tamper chain | Audit Log is itself the required immutable evidence; access and export attempts are also audited without recursive payload copying |
| `EV-15` | Export request/attempt, category, scope, acknowledgement, requester, result, correlation/display code and artifact metadata | `CONFIDENTIAL`, elevated to `RESTRICTED` when target/category or failure metadata is sensitive | Requester within approved category; System Admin only content-free diagnostics under `AUTH-28` | Same scope as requested export; failed diagnostic lookup cannot widen it | Attempt metadata `DB-STRUCTURED`; artifact `OBJECT-PRIVATE` only after approval | Attempt history `R-IMMUTABLE`; artifact `R-EXPORT-EPHEMERAL` | Blueprint export invariants; no duration supplied | Metadata is not a separate user export. Artifact follows the requested approved category | Securely expire artifact after approved window; retain attempt, hash/size/category/scope/result without exported content | Category, scope, requester, re-auth/acknowledgement result, artifact hash/size, correlation/display code, outcome; never log content |
| `EV-16` | System Logs, health/backup/job diagnostics, failed-export diagnostics and support correlation metadata | `INTERNAL`, elevated to `RESTRICTED` only for approved minimized security identifiers | System Admin under `AUTH-28` only | Platform operations; opaque scoped identifiers where needed, never business content | Dedicated operational log store, separate from evidence and Audit Log | `R-SECURITY-OPEN` | Blueprint and `AUTH-28`; no duration supplied | `EX-DIAGNOSTIC` only after approval and redaction; no financial/evidence content | Rotate/delete under approved period; until approval, collect only minimum allowlisted fields | Log access/config changes are audited. System Logs must not contain document/evidence bodies, names, emails, signatures, bank data, amounts, purposes, findings, report rows, tokens, secrets, request/response bodies, URLs with sensitive query values, or object contents |
| `EV-17` | Backup copies containing database evidence and report metadata | Inherit highest contained classification (`RESTRICTED`) | Backup operators under P0-08 only; restore access does not grant business viewing | Whole approved deployment; restoration must re-establish School/role boundaries | Encrypted backup service selected by P0-08 | Retention rotation and destruction `OPEN - PRODUCT OWNER INPUT REQUIRED` under P0-08/P0-07; immutable source history must survive restore | Blueprint backup requirement; no duration supplied | Prohibited export; restore only to approved controlled environment | Crypto-shred/secure destruction only under approved backup schedule and hold rules; restoration must preserve hashes/links/audit history | Backup/restore actor, job, scope, snapshot ID, integrity result, time, outcome; no evidence content in health logs |

## Export Category Matrix

Approval of an export category permits only the named output and never grants new read access. Every export re-checks active account, membership/assignment, exact organization scope, category, record state, redaction rule, and source revision at execution time. Sensitive categories require fresh re-authentication. Generated artifacts use `R-EXPORT-EPHEMERAL`; the exact download window is P0-07-D04.

| Code | Category | Permitted requester and scope | Allowed content | Required controls | Pilot state |
| --- | --- | --- | --- | --- | --- |
| `EX-SCHOOL-REPORT` | Official School report package | Finance Officer or School Admin only where their approved command permits generation; active School Director for own School | Approved report types and required official signatures/metadata; no unrelated raw attachments | Own-School filter, source revision, redaction, fresh re-authentication for restricted content, artifact hash, export audit | `OPEN - PRODUCT OWNER APPROVAL REQUIRED` |
| `EX-SCHOOL-RECORDS` | School financial record/evidence package | Authorized own-School user only; assigned Auditor access uses `EX-ASSIGNED-AUDIT-PACK`, not this category | Selected canonical record fields and specifically authorized supporting artifacts | Explicit field/artifact allowlist, date/event scope, personal/bank redaction, fresh re-authentication and acknowledgement | `OPEN - PRODUCT OWNER APPROVAL REQUIRED` |
| `EX-AUDIT-REPORT` | Finalized School Financial Accounting Audit Report | School users for their own authorized finalized report; active/responsible Auditor for exact assigned Assessment | Final report, source/checklist/policy revision, approved findings/responses/result and required acceptance history | Finalized/non-stale state or explicit stale watermark, no unrelated workpapers, exact School/Assessment, re-authentication | `OPEN - PRODUCT OWNER APPROVAL REQUIRED` |
| `EX-ASSIGNED-AUDIT-PACK` | Audit workpaper/evidence package | Active assigned SESAO Auditor only for exact Assessment while command access remains active | Explicitly selected workpapers, evidence references/artifacts, findings and follow-up needed for authorized audit work | Exact assignment revision, School/period, restrictive field/artifact allowlist, re-authentication, watermark/hash, audit | `OPEN - PRODUCT OWNER APPROVAL REQUIRED` |
| `EX-AUDIT-REVIEW` | Scoped Audit Review Report | No generic requester is approved by P0-04; requester/access must be explicitly approved without reopening P0-04 decisions | Redacted report of permitted approvals, corrections, voids, disagreements, stale reports, exports and policy changes; never raw log dump | Separately permissioned query, exact scope, redaction, no before/after evidence payloads, re-authentication | `PROHIBITED UNTIL ACCESS OWNER IS APPROVED` |
| `EX-MEMBERSHIP` | Membership/assignment administrative evidence | ESAO Admin for exact authorized administrative boundary; System Admin only its platform/technical-executor records | Membership state/role history and evidence metadata; appointment artifact only if specifically allowed | No financial/audit content, exact subject/scope, personal minimization, re-authentication, audit | `OPEN - PRODUCT OWNER APPROVAL REQUIRED` |
| `EX-POLICY` | Policy source/citation package | Current Policy Publisher for authorized Policy Version; public source may be delivered only with approved metadata | Unchanged public source, hash, citation, effective/scope metadata; exclude internal current-status conflict notes and personal designation evidence | Source-integrity validation, exact version/scope, no source mutation, audit | `OPEN - PRODUCT OWNER APPROVAL REQUIRED` |
| `EX-DIAGNOSTIC` | Redacted operational diagnostic bundle | System Admin under `AUTH-28` | Allowlisted technical versions, timestamps, job/error codes, correlation IDs and health results | Automated secret/PII/evidence-content scrubbing, no request/response bodies, no object URLs/content, audited generation | `OPEN - PRODUCT OWNER APPROVAL REQUIRED` |

File format is not an Export Category. PDF, CSV, XLSX, or another format may be enabled only for a category whose field and artifact allowlist supports that format. A client acknowledgement is not approval and does not expand authority.

## Prohibited Exports

The pilot prohibits:

1. Any cross-School financial, membership, assessment, finding, report, or evidence export not explicitly authorized by one approved category and requester scope.
2. ESAO Reviewer, cross-School comparison, ranking, or aggregate-summary export while `AUTH-24` remains `DEFERRED-AND-DENIED`.
3. Raw or bulk Audit Log export, database dumps, backups, object-store bucket/archive export, or unrestricted evidence archive.
4. Credentials, password hashes, tokens, session cookies, recovery secrets, encryption keys, full authentication request/response bodies, or security answers in any export.
5. System Logs containing or exporting evidence bodies, financial row data, personal names/emails, signatures, bank/account data, purposes, findings, report rows, or object contents.
6. Unredacted personal identifiers in ESAO aggregates or reports unless a later approved category explicitly requires and authorizes each field.
7. Draft, incomplete, stale, superseded, or replaced report export without an explicit state label and category rule permitting that state.
8. External controlled artifacts, bank statements, appointment signatures, raw audit samples, or workpaper attachments merely because their metadata/reference is viewable.
9. Export through a public/permanent URL, email attachment, notification payload, support ticket, or diagnostic bundle outside the approved controlled delivery path.
10. Export by System Admin, ESAO Admin, Policy Publisher, SESAO Auditor, School Admin, Finance Officer, or School Director outside the exact P0-04 command/data boundary; role name alone never authorizes export.

## System Log Content Contract

System Logs use an allowlist rather than attempting to redact arbitrary payloads after collection.

Allowed fields are timestamp, environment/service/component, severity, stable error/event code, request/job correlation ID, failed-export display code, route/template name without identifiers, duration, retry count, software/schema version, opaque actor/organization/target IDs when essential and separately approved, and success/failure state.

Prohibited fields are evidence/document/report content, file bytes or extracted text, financial amounts/balances/purposes, names, emails, national or employee identifiers, signatures, bank/account/payee data, audit observations/findings/responses, policy source bodies, appointment bodies, passwords/hashes/tokens/cookies/secrets/keys, full request or response bodies, SQL parameter values, and object-storage URLs or keys containing business data.

Unexpected sensitive input is recorded only as a stable validation/error code and correlation ID. Operational investigation follows the correlation ID into the separately authorized canonical evidence or Audit Log view; content is never copied into the System Log.

## Product Owner Decision Register

Every decision below is required for an enforceable approved matrix. A response must state the selected value, effective date, decision authority, and whether it applies to already-held pilot evidence.

| ID | Exact decision required | Current safe state |
| --- | --- | --- |
| `P0-07-D01` | Approve `DB-STRUCTURED`, `OBJECT-PRIVATE`, `EXTERNAL-CONTROLLED`, and `SOURCE-REPOSITORY` as the storage classes; name the object-storage service/region and organizational data owner. | Private/local design only; production artifact upload disabled |
| `P0-07-D02` | Approve allowed upload media types, maximum file size per artifact, and whether any category is reference-only with no upload. | Upload disabled |
| `P0-07-D03` | Approve malware scanning/quarantine behavior and the required integrity-hash algorithm/metadata for uploaded and external artifacts. | Upload disabled; supplied historical hashes remain unchanged |
| `P0-07-D04` | Approve short-lived evidence-access and export-download lifetimes, single-use/reuse behavior, and secure artifact deletion method. | No production artifact link/export |
| `P0-07-D05` | Supply or approve the legal/records-policy source and exact retention/disposition rule for posted financial records and supporting evidence (`EV-05` through `EV-10`, `EV-13`), including start event and treatment of corrections, stale reports, disputes and holds. | Preserve; no automated deletion; not claimed as legal permanence |
| `P0-07-D06` | Supply or approve the legal/records-policy source and exact retention/disposition rule for registration, authentication, membership, bootstrap, appointment and designation evidence (`EV-01` through `EV-03`). Coordinate rejected/withdrawn/corrected application handling with P0-10. | Preserve minimum existing history; no automated deletion/export |
| `P0-07-D07` | Supply or approve the legal/records-policy source and exact retention/disposition rule for Annual Self-Assessment and Audit Assessment evidence, workpapers, findings, samples, reports and follow-up (`EV-11`/`EV-12`). | Preserve; no automated deletion; finalized structured history immutable |
| `P0-07-D08` | Supply or approve the audit-log retention rule, disposition authority, access owner and permitted scoped Audit Review Report requester; confirm raw/bulk Audit Log export remains prohibited. | Append-only preservation; no generic reader or export |
| `P0-07-D09` | Approve System Log and authentication/security-event retention periods and minimized optional fields (such as IP/device data), with privacy/security basis. | Minimum allowlisted fields only; no sensitive evidence content/export |
| `P0-07-D10` | Approve backup retention generations/period, hold interaction, secure destruction method, operator/access owner and restore environment, coordinated with P0-08. | No P0-07 retention value invented; production decision deferred to P0-08/P0-07 approval |
| `P0-07-D11` | Approve or reject each export category and, for each approved category, the requester, record states, formats, field/artifact allowlist, required redaction, acknowledgement text, re-authentication and delivery channel. | All exports disabled |
| `P0-07-D12` | Approve the privacy classification scheme and identify any category/field that must be reclassified or subject to an additional privacy notice, consent, access-request, correction, restriction, or breach process. | Apply the most restrictive proposed class; no production export/deletion |
| `P0-07-D13` | Name the disposal approver and evidence required for a destruction run, including legal-hold clearance, deletion manifest, failure handling, backup propagation and Audit Log event. | No destructive disposal |

## Verified Decision Status

The register was re-verified on 2026-08-12 against the current Blueprint, P0-04 Authorization Matrix, P0-08 production-infrastructure boundary and handoff, P0-06 policy catalogue/activation evidence, current ADRs, and repository-wide P0-07 decision references. No later record supplies Product Owner approval or a selected value for any row.

| Decision | Verified existing constraint | Product Owner value still required | Status |
| --- | --- | --- | --- |
| `P0-07-D01` | PostgreSQL/Prisma is selected for structured data; the Blueprint requires private encrypted object storage or a controlled external reference. P0-08 explicitly does not approve D01. | Approve/reject the four storage classes; name object-storage service, region, organizational data owner, and any reference-only boundary. | `OPEN` |
| `P0-07-D02` | No approved upload type, size, or reference-only evidence-category rule exists. | List allowed media types; maximum bytes per artifact; categories for which upload is prohibited and external reference is mandatory. | `OPEN` |
| `P0-07-D03` | Integrity metadata is required; existing supplied-source hashes must remain unchanged. No malware service or uploaded-artifact hash rule is approved. | Name scan/quarantine behavior, release/failure authority, hash algorithm, required metadata, and handling of external artifacts that cannot be hashed. | `OPEN` |
| `P0-07-D04` | Evidence references must remain private and artifact access must expire. No lifetime or deletion method is approved. | State evidence-link lifetime, export-download lifetime, single-use/reuse rule, revocation behavior, and secure artifact-deletion method. | `OPEN` |
| `P0-07-D05` | Posted/corrected financial history and replacement links are immutable application history; this is not a statutory duration. | Cite the controlling records policy; state retention period/rule, clock-start event, disposition action, retrospective treatment, and hold/dispute/correction/stale-report behavior for EV-05 through EV-10 and EV-13. | `OPEN` |
| `P0-07-D06` | P0-04 requires attributable authorization history; P0-10 still depends on P0-07 for registration-state retention. | Cite the controlling policy and decide each registration/authentication/membership/bootstrap/appointment/designation state, clock start, deletion versus anonymization, retrospective treatment, and hold behavior for EV-01 through EV-03. | `OPEN` |
| `P0-07-D07` | Finalized audit structured history is immutable; BLK-004 still prevents unverified B.E. 2544 instrument rules from becoming current policy. | Cite the controlling records policy and decide retention/disposition, clock start, retrospective treatment, sample/workpaper artifact handling, follow-up, dispute and hold behavior for EV-11 and EV-12. | `OPEN` |
| `P0-07-D08` | Audit Log is append-only, separately permissioned, and raw/bulk export is prohibited by the draft; P0-04 grants no generic raw-log reader. | Cite/approve audit retention; name disposition authority, access owner, permitted scoped Audit Review Report requester, and confirm or amend raw/bulk export prohibition without expanding P0-04. | `OPEN` |
| `P0-07-D09` | System Logs must use the content allowlist and contain no sensitive evidence content. | Cite privacy/security basis; state System Log and authentication/security-event periods, clock start, optional IP/device fields, access owner, and secure rotation/deletion behavior. | `OPEN` |
| `P0-07-D10` | P0-08-D09 and BLK-008 leave backup service/retention/ownership unresolved and explicitly defer retention to D10. | Jointly decide backup generations/period, clock start, legal-hold interaction, deletion protection, secure destruction, operator/access owner, restore environment, and treatment of expired primary evidence in backups. | `OPEN` |
| `P0-07-D11` | Eight proposed export categories exist; all remain disabled. Format is not authority, and P0-04 scope must be rechecked at execution. | Approve or reject each category individually; for each approval state requester, record state, format, field/artifact allowlist, redaction, acknowledgement, re-authentication, delivery, and retrospective scope. | `OPEN` |
| `P0-07-D12` | The four proposed privacy classes are not owner-approved; safest-class handling is only a temporary fail-closed control. | Approve/reject/revise the scheme; classify exceptions; identify required notice, consent, access, correction, restriction, breach, or other privacy process and responsible owner. | `OPEN` |
| `P0-07-D13` | No destructive disposal is permitted and immutable history cannot be silently overwritten. | Name disposal approver; define legal-hold clearance, destruction authorization/evidence, manifest fields, partial-failure/retry handling, backup propagation, verification, and Audit Log event. | `OPEN` |

## Product Owner Response Form

This form is deliberately blank. Completing it requires an actual Product Owner/accountable-reviewer decision; preparation of this package is not approval. Attach or cite the legal/records/privacy source for every rule that depends on one. Use `REJECTED` when a proposed class/category is not accepted and state the resulting fail-closed behavior.

### Storage and artifact controls

| Decision | Product Owner response | Source / authority reference | Effective date | Applies to evidence already held? | Conditions / owner |
| --- | --- | --- | --- | --- | --- |
| `P0-07-D01` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D02` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D03` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D04` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |

### Retention and audit controls

| Decision | Product Owner response | Legal / records / security source | Clock-start event | Effective date | Applies to evidence already held? | Holds and disposition authority |
| --- | --- | --- | --- | --- | --- | --- |
| `P0-07-D05` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D06` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D07` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D08` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D09` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D10` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |

### Export, privacy and disposal controls

| Decision | Product Owner response | Source / authority reference | Effective date | Applies to evidence already held? | Conditions / owner |
| --- | --- | --- | --- | --- | --- |
| `P0-07-D11` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | Complete the per-category form below. |
| `P0-07-D12` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `P0-07-D13` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |

For D11, record an independent decision for every category; omission keeps the category disabled.

| Export category | Decision (`APPROVED` / `REJECTED`) | Requester and exact scope | Allowed record states and content | Formats and field/artifact allowlist | Redaction / acknowledgement / re-authentication | Delivery and expiry rule |
| --- | --- | --- | --- | --- | --- | --- |
| `EX-SCHOOL-REPORT` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `EX-SCHOOL-RECORDS` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `EX-AUDIT-REPORT` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `EX-ASSIGNED-AUDIT-PACK` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `EX-AUDIT-REVIEW` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `EX-MEMBERSHIP` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `EX-POLICY` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |
| `EX-DIAGNOSTIC` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` | `OPEN` |

### Approval declaration

The signatory must confirm all of the following:

- every D01-D13 row has an explicit approved or rejected response;
- every approved retention or disposal rule cites its authority and defines clock start, holds, retrospective treatment and disposition;
- every export category has an explicit category-level decision;
- the decisions do not grant access outside P0-04 or activate `AUTH-24`;
- System Logs remain free of sensitive evidence content;
- `R-IMMUTABLE` is understood as an application-history control, not an invented statutory period.

## Sign-Off

| Authority | Decision | Name / reference | Date | Conditions |
| --- | --- | --- | --- | --- |
| SESAO Narathiwat Product Owner / accountable reviewer | `OPEN` | `OPEN` | `OPEN` | Must decide P0-07-D01 through P0-07-D13 |

## Acceptance Audit

| P0-07 acceptance check | Result | Evidence / gap |
| --- | --- | --- |
| Evidence inventory covers Blueprint and P0-04 categories | Satisfied for draft | `EV-01` through `EV-17` |
| Privacy classification and exact access/scope recorded | Satisfied for draft | Classification table and each inventory row |
| Storage, exportability, deletion/expiry and audit requirements recorded | Satisfied for draft | Storage boundary, inventory and export matrices |
| Immutable historical evidence preserved | Satisfied for draft | `R-IMMUTABLE`, `R-SOURCE-LIFE`, category-specific rules |
| Unsupported legal periods are not invented | Satisfied | Unsupported durations are `OPEN - PRODUCT OWNER INPUT REQUIRED` |
| Export categories and prohibited exports defined | Satisfied for draft | Export Category Matrix and Prohibited Exports |
| System Logs exclude sensitive evidence content | Satisfied for draft | `EV-16` and System Log Content Contract |
| P0-04 authorization boundaries preserved | Satisfied for draft | Access language is subordinate to the authoritative Matrix; `AUTH-24` remains denied; no generic role/export grant |
| Owner approval makes matrix enforceable | **Not satisfied** | P0-07-D01 through P0-07-D13 and sign-off are `OPEN` |

**P0-07 status:** `BLOCKED` pending Product Owner/accountable-reviewer decisions and sign-off. The draft matrix must not be treated as an approved retention period or enabled export policy.
