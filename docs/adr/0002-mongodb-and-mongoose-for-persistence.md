# MongoDB and Mongoose for Persistence

**Status:** superseded by ADR-0004

SchoolBanchee uses MongoDB through Mongoose, with `MONGODB_URI` and `MONGODB_DB_NAME` supplied only by environment configuration. Financial posting spans canonical events, registries, cross-checks, obligations, projections, and audit records, so every development, test, and production deployment must support MongoDB multi-document transactions through a replica set or sharded cluster; a standalone MongoDB server is not a valid runtime. Mongoose schemas, collection validators, unique compound indexes, organization-scoped references, optimistic revisions, conditional updates, and transaction retry tests replace the relational foreign-key and serializable-row-lock assumptions in the original blueprint.
