-- P1-19: dedicated configured SESAO Auditor capability and provenance.

CREATE TYPE "SesaoAuditorConfigurationStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "SesaoAuditorChangeAction" AS ENUM ('APPOINT', 'REVOKE');

CREATE TABLE "SesaoAuditorBootstrap" (
    "id" TEXT NOT NULL DEFAULT 'p1-19',
    "esaoOrganizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SesaoAuditorBootstrap_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SesaoAuditorBootstrap_singleton_check" CHECK ("id" = 'p1-19')
);
CREATE UNIQUE INDEX "SesaoAuditorBootstrap_esaoOrganizationId_key" ON "SesaoAuditorBootstrap"("esaoOrganizationId");
ALTER TABLE "SesaoAuditorBootstrap" ADD CONSTRAINT "SesaoAuditorBootstrap_esaoOrganizationId_fkey"
  FOREIGN KEY ("esaoOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "SesaoAuditorConfiguration" (
    "id" UUID NOT NULL,
    "bootstrapId" TEXT,
    "identityId" UUID NOT NULL,
    "personNameSnapshot" VARCHAR(200) NOT NULL,
    "roleCode" VARCHAR(32) NOT NULL DEFAULT 'SESAO_AUDITOR',
    "esaoOrganizationId" UUID NOT NULL,
    "status" "SesaoAuditorConfigurationStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "configurationSource" VARCHAR(32) NOT NULL DEFAULT 'INITIAL_BOOTSTRAP',
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SesaoAuditorConfiguration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SesaoAuditorConfiguration_role_check" CHECK ("roleCode" = 'SESAO_AUDITOR'),
    CONSTRAINT "SesaoAuditorConfiguration_status_dates_check" CHECK (("status" = 'ACTIVE' AND "revokedAt" IS NULL) OR ("status" = 'REVOKED' AND "revokedAt" IS NOT NULL)),
    CONSTRAINT "SesaoAuditorConfiguration_source_check" CHECK ("configurationSource" IN ('INITIAL_BOOTSTRAP', 'APPROVED_APPOINTMENT')),
    CONSTRAINT "SesaoAuditorConfiguration_integrityDigest_key" UNIQUE ("integrityDigest")
);
CREATE UNIQUE INDEX "SesaoAuditorConfiguration_identity_active_key" ON "SesaoAuditorConfiguration"("identityId") WHERE "status" = 'ACTIVE';
CREATE INDEX "SesaoAuditorConfiguration_identityId_status_idx" ON "SesaoAuditorConfiguration"("identityId", "status");
CREATE INDEX "SesaoAuditorConfiguration_esaoOrganizationId_status_idx" ON "SesaoAuditorConfiguration"("esaoOrganizationId", "status");
ALTER TABLE "SesaoAuditorConfiguration"
  ADD CONSTRAINT "SesaoAuditorConfiguration_bootstrapId_fkey" FOREIGN KEY ("bootstrapId") REFERENCES "SesaoAuditorBootstrap"("id") ON DELETE RESTRICT ON UPDATE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT "SesaoAuditorConfiguration_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SesaoAuditorConfiguration_esaoOrganizationId_fkey" FOREIGN KEY ("esaoOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "SesaoAuditorSchoolScope" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SesaoAuditorSchoolScope_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SesaoAuditorSchoolScope_configurationId_schoolId_key" UNIQUE ("configurationId", "schoolId")
);
CREATE INDEX "SesaoAuditorSchoolScope_schoolId_configurationId_idx" ON "SesaoAuditorSchoolScope"("schoolId", "configurationId");
ALTER TABLE "SesaoAuditorSchoolScope"
  ADD CONSTRAINT "SesaoAuditorSchoolScope_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SesaoAuditorConfiguration"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SesaoAuditorSchoolScope_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "SesaoAuditorProvenance" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "action" "SesaoAuditorChangeAction" NOT NULL,
    "externalApprovalRecordId" VARCHAR(128) NOT NULL,
    "approvalAuthorityLabel" VARCHAR(128) NOT NULL,
    "approvalAuthorityIdentity" VARCHAR(320) NOT NULL,
    "approvalEvidenceReference" VARCHAR(512) NOT NULL,
    "approvalEvidenceHash" CHAR(64) NOT NULL,
    "subjectIdentityId" UUID NOT NULL,
    "subjectAccountIdentifier" VARCHAR(320) NOT NULL,
    "subjectPersonName" VARCHAR(200) NOT NULL,
    "subjectRoleCode" VARCHAR(32) NOT NULL,
    "subjectEsaoOrganizationId" UUID NOT NULL,
    "technicalExecutorIdentityId" UUID NOT NULL,
    "technicalExecutorMembershipId" UUID NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SesaoAuditorProvenance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SesaoAuditorProvenance_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "SesaoAuditorProvenance_externalApprovalRecordId_action_key" UNIQUE ("externalApprovalRecordId", "action"),
    CONSTRAINT "SesaoAuditorProvenance_configurationId_action_key" UNIQUE ("configurationId", "action"),
    CONSTRAINT "SesaoAuditorProvenance_role_check" CHECK ("subjectRoleCode" = 'SESAO_AUDITOR'),
    CONSTRAINT "SesaoAuditorProvenance_evidence_check" CHECK (length(trim("externalApprovalRecordId")) > 0 AND "approvalAuthorityLabel" = 'Private Business / Product Owner' AND length(trim("approvalAuthorityIdentity")) > 0 AND length(trim("approvalEvidenceReference")) > 0 AND "approvalEvidenceHash" ~ '^[0-9a-f]{64}$')
);
CREATE INDEX "SesaoAuditorProvenance_subjectIdentityId_action_executedAt_idx" ON "SesaoAuditorProvenance"("subjectIdentityId", "action", "executedAt");
ALTER TABLE "SesaoAuditorProvenance"
  ADD CONSTRAINT "SesaoAuditorProvenance_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "SesaoAuditorConfiguration"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SesaoAuditorProvenance_subjectIdentityId_fkey" FOREIGN KEY ("subjectIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SesaoAuditorProvenance_subjectEsaoOrganizationId_fkey" FOREIGN KEY ("subjectEsaoOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SesaoAuditorProvenance_technicalExecutorIdentityId_fkey" FOREIGN KEY ("technicalExecutorIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SesaoAuditorProvenance_technicalExecutorMembershipId_fkey" FOREIGN KEY ("technicalExecutorMembershipId") REFERENCES "ApprovedMembership"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_19_prevent_auditor_mutation"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'SesaoAuditorConfiguration' AND TG_OP = 'UPDATE'
     AND current_setting('p1_19.allow_revoke', true) = '1'
     AND OLD."identityId" = NEW."identityId"
     AND OLD."personNameSnapshot" = NEW."personNameSnapshot"
     AND OLD."roleCode" = NEW."roleCode"
     AND OLD."esaoOrganizationId" = NEW."esaoOrganizationId"
     AND OLD."bootstrapId" IS NOT DISTINCT FROM NEW."bootstrapId"
     AND OLD."configurationSource" = NEW."configurationSource"
     AND OLD."integrityDigest" = NEW."integrityDigest"
     AND OLD."status" = 'ACTIVE' AND NEW."status" = 'REVOKED'
     AND OLD."revokedAt" IS NULL AND NEW."revokedAt" IS NOT NULL THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'SESAO Auditor bootstrap configuration, scope, and provenance are immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE OR REPLACE FUNCTION "p1_19_assert_auditor_configuration"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  scope_count INTEGER;
BEGIN
  IF NEW."roleCode" <> 'SESAO_AUDITOR' OR NEW."personNameSnapshot" = '' THEN
    RAISE EXCEPTION 'SESAO Auditor configuration shape is invalid' USING ERRCODE = '23514';
  END IF;
  IF NEW."configurationSource" = 'INITIAL_BOOTSTRAP' AND NEW."bootstrapId" <> 'p1-19' THEN
    RAISE EXCEPTION 'Initial Auditor configuration requires the sealed bootstrap' USING ERRCODE = '23514';
  END IF;
  IF NEW."configurationSource" = 'APPROVED_APPOINTMENT' AND NEW."bootstrapId" IS NOT NULL THEN
    RAISE EXCEPTION 'Post-bootstrap Auditor appointment cannot reference initial bootstrap' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO scope_count FROM "SesaoAuditorSchoolScope" WHERE "configurationId" = NEW."id";
  IF scope_count <> 17 THEN
    RAISE EXCEPTION 'SESAO Auditor configuration requires the immutable 17-school scope' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM "SesaoAuditorSchoolScope" scope
    JOIN "School" school ON school."organizationId" = scope."schoolId"
    JOIN "Organization" school_org ON school_org."id" = school."organizationId"
    WHERE scope."configurationId" = NEW."id"
      AND (NOT school."directoryIsActive" OR school_org."parentOrganizationId" <> NEW."esaoOrganizationId")
  ) THEN
    RAISE EXCEPTION 'SESAO Auditor scope must contain only active Schools of the configured ESAO' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "p1_19_assert_auditor_provenance"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE configuration_status "SesaoAuditorConfigurationStatus";
BEGIN
  SELECT "status" INTO configuration_status FROM "SesaoAuditorConfiguration" WHERE "id" = NEW."configurationId";
  IF NEW."action" = 'APPOINT' AND configuration_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Auditor appointment provenance requires active configuration' USING ERRCODE = '23514';
  END IF;
  IF NEW."action" = 'REVOKE' AND configuration_status <> 'REVOKED' THEN
    RAISE EXCEPTION 'Auditor revocation provenance requires revoked configuration' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "SesaoAuditorBootstrap_prevent_mutation" BEFORE UPDATE OR DELETE ON "SesaoAuditorBootstrap" FOR EACH ROW EXECUTE FUNCTION "p1_19_prevent_auditor_mutation"();
CREATE TRIGGER "SesaoAuditorConfiguration_prevent_mutation" BEFORE UPDATE OR DELETE ON "SesaoAuditorConfiguration" FOR EACH ROW EXECUTE FUNCTION "p1_19_prevent_auditor_mutation"();
CREATE TRIGGER "SesaoAuditorSchoolScope_prevent_mutation" BEFORE UPDATE OR DELETE ON "SesaoAuditorSchoolScope" FOR EACH ROW EXECUTE FUNCTION "p1_19_prevent_auditor_mutation"();
CREATE TRIGGER "SesaoAuditorProvenance_prevent_mutation" BEFORE UPDATE OR DELETE ON "SesaoAuditorProvenance" FOR EACH ROW EXECUTE FUNCTION "p1_19_prevent_auditor_mutation"();
CREATE CONSTRAINT TRIGGER "SesaoAuditorConfiguration_assert_shape" AFTER INSERT ON "SesaoAuditorConfiguration" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "p1_19_assert_auditor_configuration"();
CREATE CONSTRAINT TRIGGER "SesaoAuditorProvenance_assert_shape" AFTER INSERT ON "SesaoAuditorProvenance" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "p1_19_assert_auditor_provenance"();

CREATE OR REPLACE FUNCTION "p1_19_assert_auditor_bootstrap"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE configuration_count INTEGER;
BEGIN
  IF NEW."id" <> 'p1-19' THEN
    RAISE EXCEPTION 'SESAO Auditor bootstrap is a singleton' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO configuration_count FROM "SesaoAuditorConfiguration" WHERE "bootstrapId" = NEW."id" AND "configurationSource" = 'INITIAL_BOOTSTRAP';
  IF configuration_count < 1 THEN
    RAISE EXCEPTION 'SESAO Auditor bootstrap requires at least one initial configuration' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Organization" WHERE "id" = NEW."esaoOrganizationId" AND "type" = 'ESAO' AND "status" = 'ACTIVE') THEN
    RAISE EXCEPTION 'SESAO Auditor bootstrap requires an active ESAO' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE CONSTRAINT TRIGGER "SesaoAuditorBootstrap_assert_shape" AFTER INSERT ON "SesaoAuditorBootstrap" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "p1_19_assert_auditor_bootstrap"();
