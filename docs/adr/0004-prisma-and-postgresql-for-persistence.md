# Prisma and PostgreSQL for Persistence

**Status:** accepted

ADR-0002 is superseded. After reconsidering the persistence choice with professional input, SchoolBanchee uses PostgreSQL through Prisma for the shared production write model. The financial domain relies on normalized organization/fiscal-year boundaries, foreign keys, restrictive deletion, exact numeric money, unique constraints, and serializable transactions with targeted row locks; PostgreSQL expresses and verifies those controls directly. Prisma migrations are the required schema-change path, and financial posting retries PostgreSQL serialization conflicts under an idempotency key. This changes only the persistence implementation, not the canonical registry, NextAuth, approval-gated registration, School Directory, or financial-domain rules.
