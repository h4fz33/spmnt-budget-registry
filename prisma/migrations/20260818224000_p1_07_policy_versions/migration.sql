-- P1-07: effective-dated policy publication and immutable resolution history.
CREATE TYPE "PolicyVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED');
CREATE TYPE "PolicyPublisherDesignationStatus" AS ENUM ('CURRENT', 'STANDBY', 'SUPERSEDED');

CREATE TABLE "PolicyPublisherDesignation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "status" "PolicyPublisherDesignationStatus" NOT NULL,
    "officialPageUrl" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "namedPersonResult" TEXT NOT NULL,
    "conflictOutcome" TEXT NOT NULL,
    "evidenceReference" TEXT NOT NULL,
    "evidenceHash" CHAR(64) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyPublisherDesignation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PolicyPublisherDesignation_official_page_check" CHECK ("officialPageUrl" ~ '^https://[^[:space:]]+$'),
    CONSTRAINT "PolicyPublisherDesignation_evidence_hash_check" CHECK ("evidenceHash" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "PolicyPublisherDesignation_evidence_detail_check" CHECK (
      length(trim("namedPersonResult")) > 0
      AND length(trim("conflictOutcome")) > 0
      AND length(trim("evidenceReference")) > 0
    ),
    CONSTRAINT "PolicyPublisherDesignation_status_dates_check" CHECK (
      ("status" IN ('CURRENT', 'STANDBY') AND "supersededAt" IS NULL)
      OR ("status" = 'SUPERSEDED' AND "supersededAt" IS NOT NULL AND "supersededAt" >= "effectiveFrom")
    )
);

CREATE TABLE "PolicyVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyVersionId" VARCHAR(128) NOT NULL,
    "organizationId" UUID NOT NULL,
    "status" "PolicyVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "supersedesId" UUID,
    "publisherDesignationId" UUID NOT NULL,
    "publisherIdentityId" UUID NOT NULL,
    "sourceIntegrityDigest" CHAR(64) NOT NULL,
    "integrityDigest" CHAR(64) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PolicyVersion_policyVersionId_key" UNIQUE ("policyVersionId"),
    CONSTRAINT "PolicyVersion_supersedesId_key" UNIQUE ("supersedesId"),
    CONSTRAINT "PolicyVersion_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "PolicyVersion_identifier_check" CHECK ("policyVersionId" ~ '^POL-[A-Z0-9]+(-[A-Z0-9]+)*$'),
    CONSTRAINT "PolicyVersion_source_digest_check" CHECK ("sourceIntegrityDigest" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "PolicyVersion_integrity_digest_check" CHECK ("integrityDigest" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "PolicyVersion_effective_range_check" CHECK (
      "effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom"
    ),
    CONSTRAINT "PolicyVersion_status_check" CHECK (
      ("status" = 'DRAFT' AND "activatedAt" IS NULL AND "effectiveTo" IS NULL)
      OR ("status" = 'ACTIVE' AND "activatedAt" IS NOT NULL AND "effectiveTo" IS NULL)
      OR ("status" = 'SUPERSEDED' AND "activatedAt" IS NOT NULL AND "effectiveTo" IS NOT NULL)
    )
);

CREATE TABLE "PolicyVersionSourceEvidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyVersionId" UUID NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "sourceRevision" TEXT,
    "contentHash" CHAR(64) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersionSourceEvidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PolicyVersionSourceEvidence_policyVersionId_sourceReference_contentHash_key"
      UNIQUE ("policyVersionId", "sourceReference", "contentHash"),
    CONSTRAINT "PolicyVersionSourceEvidence_reference_check" CHECK (length(trim("sourceReference")) > 0),
    CONSTRAINT "PolicyVersionSourceEvidence_content_hash_check" CHECK ("contentHash" ~ '^[0-9a-f]{64}$')
);

CREATE TABLE "PolicyVersionSchoolScope" (
    "policyVersionId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersionSchoolScope_pkey" PRIMARY KEY ("policyVersionId", "schoolId")
);

CREATE TABLE "PolicyResolutionRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyVersionId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "subjectCode" VARCHAR(64) NOT NULL,
    "targetType" VARCHAR(64) NOT NULL,
    "targetId" VARCHAR(128) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyResolutionRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PolicyResolutionRecord_targetType_targetId_key" UNIQUE ("targetType", "targetId"),
    CONSTRAINT "PolicyResolutionRecord_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "PolicyResolutionRecord_subject_code_check" CHECK ("subjectCode" ~ '^[A-Z][A-Z0-9-]{1,63}$'),
    CONSTRAINT "PolicyResolutionRecord_target_type_check" CHECK ("targetType" ~ '^[A-Za-z][A-Za-z0-9._-]{0,63}$'),
    CONSTRAINT "PolicyResolutionRecord_target_id_check" CHECK ("targetId" ~ '^[A-Za-z0-9._:-]{1,128}$'),
    CONSTRAINT "PolicyResolutionRecord_integrity_digest_check" CHECK ("integrityDigest" ~ '^[0-9a-f]{64}$')
);

CREATE INDEX "PolicyPublisherDesignation_organizationId_status_effectiveFrom_idx"
  ON "PolicyPublisherDesignation" ("organizationId", "status", "effectiveFrom");
CREATE INDEX "PolicyPublisherDesignation_identityId_status_idx"
  ON "PolicyPublisherDesignation" ("identityId", "status");
CREATE UNIQUE INDEX "PolicyPublisherDesignation_one_current_per_organization"
  ON "PolicyPublisherDesignation" ("organizationId") WHERE "status" = 'CURRENT';
CREATE UNIQUE INDEX "PolicyPublisherDesignation_one_standby_per_organization"
  ON "PolicyPublisherDesignation" ("organizationId") WHERE "status" = 'STANDBY';

CREATE INDEX "PolicyVersion_organizationId_status_effectiveFrom_effectiveTo_idx"
  ON "PolicyVersion" ("organizationId", "status", "effectiveFrom", "effectiveTo");
CREATE INDEX "PolicyVersionSourceEvidence_policyVersionId_idx"
  ON "PolicyVersionSourceEvidence" ("policyVersionId");
CREATE INDEX "PolicyVersionSchoolScope_schoolId_policyVersionId_idx"
  ON "PolicyVersionSchoolScope" ("schoolId", "policyVersionId");
CREATE INDEX "PolicyResolutionRecord_schoolId_subjectCode_effectiveAt_idx"
  ON "PolicyResolutionRecord" ("schoolId", "subjectCode", "effectiveAt");
CREATE INDEX "PolicyResolutionRecord_policyVersionId_resolvedAt_idx"
  ON "PolicyResolutionRecord" ("policyVersionId", "resolvedAt");

ALTER TABLE "PolicyPublisherDesignation"
  ADD CONSTRAINT "PolicyPublisherDesignation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyPublisherDesignation"
  ADD CONSTRAINT "PolicyPublisherDesignation_identityId_fkey"
  FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyVersion"
  ADD CONSTRAINT "PolicyVersion_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyVersion"
  ADD CONSTRAINT "PolicyVersion_publisherDesignationId_fkey"
  FOREIGN KEY ("publisherDesignationId") REFERENCES "PolicyPublisherDesignation"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyVersion"
  ADD CONSTRAINT "PolicyVersion_publisherIdentityId_fkey"
  FOREIGN KEY ("publisherIdentityId") REFERENCES "AuthenticatedIdentity"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyVersion"
  ADD CONSTRAINT "PolicyVersion_supersedesId_fkey"
  FOREIGN KEY ("supersedesId") REFERENCES "PolicyVersion"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyVersionSourceEvidence"
  ADD CONSTRAINT "PolicyVersionSourceEvidence_policyVersionId_fkey"
  FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyVersionSchoolScope"
  ADD CONSTRAINT "PolicyVersionSchoolScope_policyVersionId_fkey"
  FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyVersionSchoolScope"
  ADD CONSTRAINT "PolicyVersionSchoolScope_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyResolutionRecord"
  ADD CONSTRAINT "PolicyResolutionRecord_policyVersionId_fkey"
  FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PolicyResolutionRecord"
  ADD CONSTRAINT "PolicyResolutionRecord_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_07_assert_policy_publisher_designation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Organization"
    WHERE "id" = NEW."organizationId" AND "type" = 'ESAO' AND "status" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Policy Publisher designation requires an active ESAO organization'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "AuthenticatedIdentity"
    WHERE "id" = NEW."identityId" AND "accountStatus" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Policy Publisher designation requires an active authenticated identity'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "PolicyPublisherDesignation_assert_scope"
BEFORE INSERT OR UPDATE ON "PolicyPublisherDesignation"
FOR EACH ROW EXECUTE FUNCTION "p1_07_assert_policy_publisher_designation"();

CREATE OR REPLACE FUNCTION "p1_07_assert_policy_version"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  designated_identity UUID;
  designation_status "PolicyPublisherDesignationStatus";
  designation_organization UUID;
  expected_school_count INTEGER;
  scoped_school_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Organization"
    WHERE "id" = NEW."organizationId" AND "type" = 'ESAO' AND "status" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Policy Version requires an active ESAO organization'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."status" = 'ACTIVE' THEN
    SELECT "identityId", "status", "organizationId"
    INTO designated_identity, designation_status, designation_organization
    FROM "PolicyPublisherDesignation"
    WHERE "id" = NEW."publisherDesignationId";

    IF designation_organization IS DISTINCT FROM NEW."organizationId"
      OR designated_identity IS DISTINCT FROM NEW."publisherIdentityId"
      OR designation_status IS DISTINCT FROM 'CURRENT'::"PolicyPublisherDesignationStatus" THEN
      RAISE EXCEPTION 'Policy Version activation requires the current designated Policy Publisher'
        USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM "AuthenticatedIdentity"
      WHERE "id" = NEW."publisherIdentityId" AND "accountStatus" = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'Policy Version activation requires an active publisher identity'
        USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM "ApprovedMembership" membership
      WHERE membership."identityId" = NEW."publisherIdentityId"
        AND membership."organizationId" = NEW."organizationId"
        AND membership."status" = 'ACTIVE'
        AND membership."effectiveFrom" <= NEW."activatedAt"
        AND (membership."effectiveTo" IS NULL OR membership."effectiveTo" > NEW."activatedAt")
    ) THEN
      RAISE EXCEPTION 'Policy Version activation requires an active effective publisher membership'
        USING ERRCODE = '42501';
    END IF;

  END IF;

  IF NEW."status" IN ('ACTIVE', 'SUPERSEDED') THEN
    SELECT count(*)::INTEGER INTO expected_school_count
    FROM "School" school
    JOIN "Organization" school_organization ON school_organization."id" = school."organizationId"
    WHERE school_organization."parentOrganizationId" = NEW."organizationId"
      AND school_organization."type" = 'SCHOOL'
      AND school_organization."status" = 'ACTIVE'
      AND school."directoryIsActive";

    SELECT count(*)::INTEGER INTO scoped_school_count
    FROM "PolicyVersionSchoolScope"
    WHERE "policyVersionId" = NEW."id";

    IF expected_school_count <> 17 OR scoped_school_count <> expected_school_count
      OR EXISTS (
        SELECT school."organizationId"
        FROM "School" school
        JOIN "Organization" school_organization ON school_organization."id" = school."organizationId"
        WHERE school_organization."parentOrganizationId" = NEW."organizationId"
          AND school_organization."type" = 'SCHOOL'
          AND school_organization."status" = 'ACTIVE'
          AND school."directoryIsActive"
        EXCEPT
        SELECT "schoolId" FROM "PolicyVersionSchoolScope" WHERE "policyVersionId" = NEW."id"
      )
      OR EXISTS (
        SELECT "schoolId" FROM "PolicyVersionSchoolScope" WHERE "policyVersionId" = NEW."id"
        EXCEPT
        SELECT school."organizationId"
        FROM "School" school
        JOIN "Organization" school_organization ON school_organization."id" = school."organizationId"
        WHERE school_organization."parentOrganizationId" = NEW."organizationId"
          AND school_organization."type" = 'SCHOOL'
          AND school_organization."status" = 'ACTIVE'
          AND school."directoryIsActive"
      ) THEN
      RAISE EXCEPTION 'Policy Version scope must contain exactly every active School in the 17-School directory'
        USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM "PolicyVersionSourceEvidence" WHERE "policyVersionId" = NEW."id"
    ) THEN
      RAISE EXCEPTION 'Policy Version activation requires unchanged source evidence'
        USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
      SELECT 1 FROM "PolicyVersion" existing
      WHERE existing."id" <> NEW."id"
        AND existing."organizationId" = NEW."organizationId"
        AND existing."status" IN ('ACTIVE', 'SUPERSEDED')
        AND tsrange(existing."effectiveFrom", existing."effectiveTo", '[)')
            && tsrange(NEW."effectiveFrom", NEW."effectiveTo", '[)')
    ) THEN
      RAISE EXCEPTION 'Overlapping published Policy Versions are prohibited'
        USING ERRCODE = '23P01';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "PolicyVersion_assert_publication"
BEFORE INSERT OR UPDATE ON "PolicyVersion"
FOR EACH ROW EXECUTE FUNCTION "p1_07_assert_policy_version"();

CREATE OR REPLACE FUNCTION "p1_07_assert_policy_activation_audit"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."status" IN ('ACTIVE', 'SUPERSEDED') AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" audit
    WHERE audit."commandCode" = 'AUTH-22'
      AND audit."targetType" = 'PolicyVersion'
      AND audit."targetId" = NEW."policyVersionId"
      AND audit."outcome" = 'SUCCESS'
      AND audit."actorIdentityId" = NEW."publisherIdentityId"
      AND audit."scopeKind" = 'ORGANIZATION'
      AND audit."scopeOrganizationId" = NEW."organizationId"
      AND audit."scopeSchoolId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Policy Version activation requires a matching AUTH-22 audit event in the same transaction'
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "PolicyVersion_assert_activation_audit"
AFTER INSERT OR UPDATE ON "PolicyVersion"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_07_assert_policy_activation_audit"();

CREATE OR REPLACE FUNCTION "p1_07_assert_policy_component_draft"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_version_id UUID;
  parent_status "PolicyVersionStatus";
BEGIN
  parent_version_id := NEW."policyVersionId";

  SELECT "status" INTO parent_status FROM "PolicyVersion" WHERE "id" = parent_version_id;
  IF parent_status IS DISTINCT FROM 'DRAFT'::"PolicyVersionStatus" THEN
    RAISE EXCEPTION 'Policy source and scope components may be added only while a Policy Version is a draft'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "PolicyVersionSourceEvidence_assert_draft"
BEFORE INSERT ON "PolicyVersionSourceEvidence"
FOR EACH ROW EXECUTE FUNCTION "p1_07_assert_policy_component_draft"();
CREATE TRIGGER "PolicyVersionSchoolScope_assert_draft"
BEFORE INSERT ON "PolicyVersionSchoolScope"
FOR EACH ROW EXECUTE FUNCTION "p1_07_assert_policy_component_draft"();

CREATE OR REPLACE FUNCTION "p1_07_assert_policy_resolution"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  version_organization UUID;
BEGIN
  SELECT "organizationId" INTO version_organization
  FROM "PolicyVersion" WHERE "id" = NEW."policyVersionId";

  IF version_organization IS NULL OR NOT EXISTS (
    SELECT 1
    FROM "School" school
    JOIN "Organization" school_organization ON school_organization."id" = school."organizationId"
    JOIN "PolicyVersionSchoolScope" scope
      ON scope."policyVersionId" = NEW."policyVersionId" AND scope."schoolId" = school."organizationId"
    WHERE school."organizationId" = NEW."schoolId"
      AND school_organization."parentOrganizationId" = version_organization
  ) THEN
    RAISE EXCEPTION 'Policy resolution must use a School inside the resolved Policy Version scope'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "PolicyVersion" version
    WHERE version."id" = NEW."policyVersionId"
      AND version."status" IN ('ACTIVE', 'SUPERSEDED')
      AND version."effectiveFrom" <= NEW."effectiveAt"
      AND (version."effectiveTo" IS NULL OR version."effectiveTo" > NEW."effectiveAt")
  ) THEN
    RAISE EXCEPTION 'Policy resolution must point to a Policy Version effective at the recorded time'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "PolicyResolutionRecord_assert_effective_scope"
BEFORE INSERT ON "PolicyResolutionRecord"
FOR EACH ROW EXECUTE FUNCTION "p1_07_assert_policy_resolution"();

CREATE OR REPLACE FUNCTION "p1_07_preserve_policy_history"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'PolicyPublisherDesignation' THEN
    IF NEW."organizationId" IS DISTINCT FROM OLD."organizationId"
      OR NEW."identityId" IS DISTINCT FROM OLD."identityId"
      OR NEW."officialPageUrl" IS DISTINCT FROM OLD."officialPageUrl"
      OR NEW."retrievedAt" IS DISTINCT FROM OLD."retrievedAt"
      OR NEW."namedPersonResult" IS DISTINCT FROM OLD."namedPersonResult"
      OR NEW."conflictOutcome" IS DISTINCT FROM OLD."conflictOutcome"
      OR NEW."evidenceReference" IS DISTINCT FROM OLD."evidenceReference"
      OR NEW."evidenceHash" IS DISTINCT FROM OLD."evidenceHash"
      OR NEW."effectiveFrom" IS DISTINCT FROM OLD."effectiveFrom"
      OR NOT (
        OLD."status" IN ('CURRENT', 'STANDBY')
        AND NEW."status" = 'SUPERSEDED'
        AND NEW."supersededAt" IS NOT NULL
      ) THEN
      RAISE EXCEPTION 'Policy Publisher designation evidence is immutable apart from supersession'
        USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'PolicyVersion' THEN
    IF OLD."status" = 'DRAFT' THEN
      IF NEW."status" NOT IN ('DRAFT', 'ACTIVE') THEN
        RAISE EXCEPTION 'Policy Version draft may only remain a draft or activate'
          USING ERRCODE = '23514';
      END IF;
    ELSIF OLD."status" = 'ACTIVE' THEN
      IF NEW."policyVersionId" IS DISTINCT FROM OLD."policyVersionId"
        OR NEW."organizationId" IS DISTINCT FROM OLD."organizationId"
        OR NEW."effectiveFrom" IS DISTINCT FROM OLD."effectiveFrom"
        OR NEW."supersedesId" IS DISTINCT FROM OLD."supersedesId"
        OR NEW."publisherDesignationId" IS DISTINCT FROM OLD."publisherDesignationId"
        OR NEW."publisherIdentityId" IS DISTINCT FROM OLD."publisherIdentityId"
        OR NEW."sourceIntegrityDigest" IS DISTINCT FROM OLD."sourceIntegrityDigest"
        OR NEW."integrityDigest" IS DISTINCT FROM OLD."integrityDigest"
        OR NEW."activatedAt" IS DISTINCT FROM OLD."activatedAt"
        OR NEW."status" <> 'SUPERSEDED'
        OR NEW."effectiveTo" IS NULL THEN
        RAISE EXCEPTION 'Active Policy Version may only be prospectively superseded'
          USING ERRCODE = '23514';
      END IF;
    ELSE
      RAISE EXCEPTION 'Superseded Policy Version is immutable'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "PolicyPublisherDesignation_preserve_history"
BEFORE UPDATE ON "PolicyPublisherDesignation"
FOR EACH ROW EXECUTE FUNCTION "p1_07_preserve_policy_history"();
CREATE TRIGGER "PolicyVersion_preserve_history"
BEFORE UPDATE ON "PolicyVersion"
FOR EACH ROW EXECUTE FUNCTION "p1_07_preserve_policy_history"();

CREATE OR REPLACE FUNCTION "p1_07_prevent_policy_history_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Policy publication and resolution history records cannot be changed or deleted'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "PolicyPublisherDesignation_prevent_delete"
BEFORE DELETE ON "PolicyPublisherDesignation"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
CREATE TRIGGER "PolicyVersion_prevent_delete"
BEFORE DELETE ON "PolicyVersion"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
CREATE TRIGGER "PolicyVersionSourceEvidence_prevent_update"
BEFORE UPDATE ON "PolicyVersionSourceEvidence"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
CREATE TRIGGER "PolicyVersionSourceEvidence_prevent_delete"
BEFORE DELETE ON "PolicyVersionSourceEvidence"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
CREATE TRIGGER "PolicyVersionSchoolScope_prevent_update"
BEFORE UPDATE ON "PolicyVersionSchoolScope"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
CREATE TRIGGER "PolicyVersionSchoolScope_prevent_delete"
BEFORE DELETE ON "PolicyVersionSchoolScope"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
CREATE TRIGGER "PolicyResolutionRecord_prevent_update"
BEFORE UPDATE ON "PolicyResolutionRecord"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
CREATE TRIGGER "PolicyResolutionRecord_prevent_delete"
BEFORE DELETE ON "PolicyResolutionRecord"
FOR EACH ROW EXECUTE FUNCTION "p1_07_prevent_policy_history_mutation"();
