-- P1-20: exact Policy Publisher designation and atomic alternate replacement.

CREATE TYPE "PolicyPublisherDesignationAction" AS ENUM ('DESIGNATE', 'REPLACE');

CREATE TABLE "PolicyPublisherDesignationProvenance" (
    "id" UUID NOT NULL,
    "action" "PolicyPublisherDesignationAction" NOT NULL,
    "externalApprovalRecordId" VARCHAR(128) NOT NULL,
    "approvalAuthorityLabel" VARCHAR(128) NOT NULL,
    "approvalAuthorityIdentity" VARCHAR(320) NOT NULL,
    "approvalEvidenceReference" VARCHAR(512) NOT NULL,
    "approvalEvidenceHash" CHAR(64) NOT NULL,
    "scopeEvidenceReference" VARCHAR(512) NOT NULL,
    "scopeEvidenceHash" CHAR(64) NOT NULL,
    "organizationId" UUID NOT NULL,
    "currentDesignationId" UUID NOT NULL,
    "standbyDesignationId" UUID NOT NULL,
    "technicalExecutorIdentityId" UUID NOT NULL,
    "technicalExecutorMembershipId" UUID NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyPublisherDesignationProvenance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PolicyPublisherDesignationProvenance_externalApprovalRecordId_key" UNIQUE ("externalApprovalRecordId"),
    CONSTRAINT "PolicyPublisherDesignationProvenance_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "PolicyPublisherDesignationProvenance_distinct_designations_check" CHECK ("currentDesignationId" <> "standbyDesignationId"),
    CONSTRAINT "PolicyPublisherDesignationProvenance_approval_check" CHECK (
      length(trim("externalApprovalRecordId")) > 0
      AND "approvalAuthorityLabel" = 'Private Business / Product Owner'
      AND length(trim("approvalAuthorityIdentity")) > 0
      AND length(trim("approvalEvidenceReference")) > 0
      AND "approvalEvidenceHash" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "PolicyPublisherDesignationProvenance_scope_check" CHECK (
      length(trim("scopeEvidenceReference")) > 0
      AND "scopeEvidenceHash" ~ '^[0-9a-f]{64}$'
    )
);

CREATE INDEX "PolicyPublisherDesignationProvenance_organizationId_action_executedAt_idx"
  ON "PolicyPublisherDesignationProvenance" ("organizationId", "action", "executedAt");

ALTER TABLE "PolicyPublisherDesignationProvenance"
  ADD CONSTRAINT "PolicyPublisherDesignationProvenance_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "PolicyPublisherDesignationProvenance_currentDesignationId_fkey"
    FOREIGN KEY ("currentDesignationId") REFERENCES "PolicyPublisherDesignation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "PolicyPublisherDesignationProvenance_standbyDesignationId_fkey"
    FOREIGN KEY ("standbyDesignationId") REFERENCES "PolicyPublisherDesignation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "PolicyPublisherDesignationProvenance_technicalExecutorIdentityId_fkey"
    FOREIGN KEY ("technicalExecutorIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "PolicyPublisherDesignationProvenance_technicalExecutorMembershipId_fkey"
    FOREIGN KEY ("technicalExecutorMembershipId") REFERENCES "ApprovedMembership"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_20_prevent_policy_publisher_provenance_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Policy Publisher designation provenance is immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE OR REPLACE FUNCTION "p1_20_assert_policy_publisher_provenance"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_identity UUID;
  standby_identity UUID;
  current_status "PolicyPublisherDesignationStatus";
  standby_status "PolicyPublisherDesignationStatus";
  current_organization UUID;
  standby_organization UUID;
  active_school_count INTEGER;
BEGIN
  SELECT "identityId", "status", "organizationId"
  INTO current_identity, current_status, current_organization
  FROM "PolicyPublisherDesignation"
  WHERE "id" = NEW."currentDesignationId";

  SELECT "identityId", "status", "organizationId"
  INTO standby_identity, standby_status, standby_organization
  FROM "PolicyPublisherDesignation"
  WHERE "id" = NEW."standbyDesignationId";

  IF current_identity IS NULL
    OR standby_identity IS NULL
    OR current_identity = standby_identity
    OR current_status <> 'CURRENT'::"PolicyPublisherDesignationStatus"
    OR standby_status <> 'STANDBY'::"PolicyPublisherDesignationStatus"
    OR current_organization <> NEW."organizationId"
    OR standby_organization <> NEW."organizationId" THEN
    RAISE EXCEPTION 'Policy Publisher provenance requires one current and one distinct standby designation in the same organization'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO active_school_count
  FROM "School" school
  JOIN "Organization" school_organization ON school_organization."id" = school."organizationId"
  WHERE school."directoryIsActive"
    AND school_organization."type" = 'SCHOOL'
    AND school_organization."status" = 'ACTIVE'
    AND school_organization."parentOrganizationId" = NEW."organizationId";

  IF active_school_count <> 17 THEN
    RAISE EXCEPTION 'Policy Publisher designation requires the immutable 17-school pilot scope'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "SystemAdminBootstrap" bootstrap
    JOIN "AuthenticatedIdentity" identity ON identity."id" = bootstrap."identityId"
    JOIN "ApprovedMembership" membership ON membership."id" = bootstrap."membershipId"
    WHERE bootstrap."identityId" = NEW."technicalExecutorIdentityId"
      AND bootstrap."membershipId" = NEW."technicalExecutorMembershipId"
      AND identity."accountStatus" = 'ACTIVE'
      AND membership."status" = 'ACTIVE'
      AND membership."effectiveFrom" <= NEW."executedAt"
      AND (membership."effectiveTo" IS NULL OR membership."effectiveTo" > NEW."executedAt")
  ) THEN
    RAISE EXCEPTION 'Policy Publisher designation requires the active System Admin technical executor'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "ApprovedMembership"
    WHERE "identityId" = current_identity
      AND "organizationId" = NEW."organizationId"
      AND "status" = 'ACTIVE'
      AND "effectiveFrom" <= NEW."executedAt"
      AND ("effectiveTo" IS NULL OR "effectiveTo" > NEW."executedAt")
  ) OR NOT EXISTS (
    SELECT 1 FROM "ApprovedMembership"
    WHERE "identityId" = standby_identity
      AND "organizationId" = NEW."organizationId"
      AND "status" = 'ACTIVE'
      AND "effectiveFrom" <= NEW."executedAt"
      AND ("effectiveTo" IS NULL OR "effectiveTo" > NEW."executedAt")
  ) THEN
    RAISE EXCEPTION 'Policy Publisher designation subjects require active ESAO memberships'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "AuditLog" audit
    WHERE audit."commandCode" = 'AUTH-08'
      AND audit."targetType" = 'PolicyPublisherDesignationProvenance'
      AND audit."targetId" = NEW."id"::TEXT
      AND audit."outcome" = 'SUCCESS'
      AND audit."actorIdentityId" = NEW."technicalExecutorIdentityId"
      AND audit."actorMembershipId" = NEW."technicalExecutorMembershipId"
      AND audit."scopeKind" = 'PLATFORM'
  ) THEN
    RAISE EXCEPTION 'Policy Publisher designation requires matching System Admin execution audit evidence'
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER "PolicyPublisherDesignationProvenance_prevent_mutation"
BEFORE UPDATE OR DELETE ON "PolicyPublisherDesignationProvenance"
FOR EACH ROW EXECUTE FUNCTION "p1_20_prevent_policy_publisher_provenance_mutation"();

CREATE CONSTRAINT TRIGGER "PolicyPublisherDesignationProvenance_assert_shape"
AFTER INSERT ON "PolicyPublisherDesignationProvenance"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_20_assert_policy_publisher_provenance"();
