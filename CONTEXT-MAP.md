# Context Map

SchoolBanchee currently has one domain context. Its canonical glossary is maintained in [`reseach/CONTEXT.md`](./reseach/CONTEXT.md); the directory name is a historical repository spelling and is intentionally unchanged.

## Contexts

- [SchoolBanchee](./reseach/CONTEXT.md) - school financial control, registry, reconciliation, audit, and ESAO oversight vocabulary

## Relationships

- **SchoolBanchee -> research sources:** `reseach/manual_2515.md` and `reseach/manual_2544.md` are historical/regulatory inputs. `reseach/audit-operation-manual.md` is a partial SESAO operational-audit reference for the school financial-accounting assessment workflow. These sources inform policy versions and audit-instrument versions but are not runtime data and do not override the glossary.
- **SchoolBanchee -> BLUEPRINT:** [`BLUEPRINT.md`](./BLUEPRINT.md) defines product scope and implementation decisions using the glossary.
- **SchoolBanchee -> authorization evidence:** the glossary distinguishes Internal Audit organizational eligibility evidence from the separately approved Policy Publisher designation and application publication scope.
- **SchoolBanchee -> command authorization:** [`docs/governance/p0-04-authorization-matrix.md`](./docs/governance/p0-04-authorization-matrix.md) is the canonical command-level actor, evidence, scope, approval, review, SoD, grant/revoke, audit, and fail-closed record.
- **SchoolBanchee -> authoritative forms:** [`docs/research/p0-05-form-report-sample-register.md`](./docs/research/p0-05-form-report-sample-register.md) maps supplied OBEC/reference forms into UI and documentary structure. Form fields and printed signatures do not create application authorization; behavior remains governed by P0-03/P0-06 and commands by P0-04.
