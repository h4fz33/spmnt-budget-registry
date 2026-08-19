-- P1-08: immutable audit-event metadata with a globally ordered hash chain.
-- The record intentionally stores no credentials, evidence content, or generic
-- request payload. Authorization policy resolution remains P1-06 work.

CREATE TYPE "AuditScopeKind" AS ENUM ('PLATFORM', 'ORGANIZATION', 'SCHOOL');
CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'DENIED', 'FAILED');

CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sequence" BIGINT NOT NULL,
    "actorIdentityId" UUID NOT NULL,
    "actorMembershipId" UUID NOT NULL,
    "actorAuthorizationVersion" INTEGER NOT NULL,
    "actorMembershipAuthorizationVersion" INTEGER NOT NULL,
    "scopeKind" "AuditScopeKind" NOT NULL,
    "scopeOrganizationId" UUID,
    "scopeSchoolId" UUID,
    "commandCode" VARCHAR(64) NOT NULL,
    "targetType" VARCHAR(64) NOT NULL,
    "targetId" VARCHAR(128) NOT NULL,
    "outcome" "AuditOutcome" NOT NULL,
    "reasonCode" VARCHAR(128) NOT NULL,
    "correlationId" VARCHAR(128),
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "previousIntegrityDigest" CHAR(64),
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_sequence_key" UNIQUE ("sequence"),
    CONSTRAINT "AuditLog_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "AuditLog_sequence_check" CHECK ("sequence" > 0),
    CONSTRAINT "AuditLog_actor_version_check" CHECK (
      "actorAuthorizationVersion" > 0
      AND "actorMembershipAuthorizationVersion" > 0
    ),
    CONSTRAINT "AuditLog_command_code_check" CHECK (
      "commandCode" ~ '^[A-Z][A-Z0-9-]{2,63}$'
    ),
    CONSTRAINT "AuditLog_target_type_check" CHECK (
      "targetType" ~ '^[A-Za-z][A-Za-z0-9._-]{0,63}$'
    ),
    CONSTRAINT "AuditLog_target_id_check" CHECK (
      "targetId" ~ '^[A-Za-z0-9._:-]{1,128}$'
    ),
    CONSTRAINT "AuditLog_reason_code_check" CHECK (
      "reasonCode" ~ '^[A-Z][A-Z0-9._:-]{1,127}$'
    ),
    CONSTRAINT "AuditLog_correlation_id_check" CHECK (
      "correlationId" IS NULL
      OR "correlationId" ~ '^[A-Za-z0-9._:-]{1,128}$'
    ),
    CONSTRAINT "AuditLog_previous_digest_shape_check" CHECK (
      "previousIntegrityDigest" IS NULL
      OR "previousIntegrityDigest" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "AuditLog_integrity_digest_shape_check" CHECK (
      "integrityDigest" ~ '^[0-9a-f]{64}$'
    )
);

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorIdentityId_fkey"
  FOREIGN KEY ("actorIdentityId") REFERENCES "AuthenticatedIdentity"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorMembershipId_fkey"
  FOREIGN KEY ("actorMembershipId") REFERENCES "ApprovedMembership"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_scopeOrganizationId_fkey"
  FOREIGN KEY ("scopeOrganizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_scopeSchoolId_fkey"
  FOREIGN KEY ("scopeSchoolId") REFERENCES "School"("organizationId")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE INDEX "AuditLog_scope_sequence_idx"
  ON "AuditLog" ("scopeKind", "scopeOrganizationId", "scopeSchoolId", "sequence");

CREATE INDEX "AuditLog_actor_sequence_idx"
  ON "AuditLog" ("actorIdentityId", "sequence");

CREATE INDEX "AuditLog_target_sequence_idx"
  ON "AuditLog" ("targetType", "targetId", "sequence");

CREATE OR REPLACE FUNCTION "p1_08_assert_audit_log_insert"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  predecessor_digest TEXT;
BEGIN
  -- The service acquires the same transaction-scoped lock before deriving the
  -- predecessor. This serializes chain creation without weakening P1-03's
  -- SERIALIZABLE transaction boundary.
  PERFORM pg_advisory_xact_lock(hashtextextended('SchoolBanchee AuditLog chain', 8));

  IF NEW."scopeKind" = 'PLATFORM'
    AND (NEW."scopeOrganizationId" IS NOT NULL OR NEW."scopeSchoolId" IS NOT NULL) THEN
    RAISE EXCEPTION 'Platform audit scope cannot name an organization or School'
      USING ERRCODE = '23514';
  ELSIF NEW."scopeKind" = 'ORGANIZATION'
    AND (NEW."scopeOrganizationId" IS NULL OR NEW."scopeSchoolId" IS NOT NULL) THEN
    RAISE EXCEPTION 'Organization audit scope requires only an organization'
      USING ERRCODE = '23514';
  ELSIF NEW."scopeKind" = 'SCHOOL'
    AND (
      NEW."scopeOrganizationId" IS NULL
      OR NEW."scopeSchoolId" IS NULL
      OR NEW."scopeOrganizationId" IS DISTINCT FROM NEW."scopeSchoolId"
    ) THEN
    RAISE EXCEPTION 'School audit scope requires the exact School organization'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "AuthenticatedIdentity" identity
    JOIN "ApprovedMembership" membership ON membership."id" = NEW."actorMembershipId"
    WHERE identity."id" = NEW."actorIdentityId"
      AND identity."accountStatus" = 'ACTIVE'
      AND identity."authorizationVersion" = NEW."actorAuthorizationVersion"
      AND membership."identityId" = identity."id"
      AND membership."status" = 'ACTIVE'
      AND membership."authorizationVersion" = NEW."actorMembershipAuthorizationVersion"
      AND membership."effectiveFrom" <= NEW."occurredAt"
      AND (membership."effectiveTo" IS NULL OR membership."effectiveTo" > NEW."occurredAt")
  ) THEN
    RAISE EXCEPTION 'Audit event requires an active effective actor membership and current authorization versions'
      USING ERRCODE = '42501';
  END IF;

  IF NEW."sequence" = 1 THEN
    IF NEW."previousIntegrityDigest" IS NOT NULL THEN
      RAISE EXCEPTION 'First audit event cannot name a predecessor digest'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    SELECT "integrityDigest"
    INTO predecessor_digest
    FROM "AuditLog"
    WHERE "sequence" = NEW."sequence" - 1;

    IF predecessor_digest IS NULL THEN
      RAISE EXCEPTION 'Audit event sequence must immediately follow an existing event'
        USING ERRCODE = '23514';
    END IF;

    IF NEW."previousIntegrityDigest" IS DISTINCT FROM predecessor_digest THEN
      RAISE EXCEPTION 'Audit event predecessor digest does not match the prior event'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "AuditLog_assert_insert_integrity"
BEFORE INSERT ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION "p1_08_assert_audit_log_insert"();

CREATE OR REPLACE FUNCTION "p1_08_prevent_audit_log_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit Log records are append-only and cannot be changed or deleted'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "AuditLog_prevent_update"
BEFORE UPDATE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION "p1_08_prevent_audit_log_mutation"();

CREATE TRIGGER "AuditLog_prevent_delete"
BEFORE DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION "p1_08_prevent_audit_log_mutation"();
