-- P1-18: evidence-backed synthetic ESAO Admin application configuration.
-- This preserves an application capability only; it does not create an
-- external governmental appointment or a School role.

CREATE TYPE "EsaoAdminConfigurationStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "EsaoAdminChangeAction" AS ENUM ('APPOINT', 'REVOKE');

CREATE TABLE "EsaoAdminConfiguration" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "personNameSnapshot" VARCHAR(200) NOT NULL,
    "roleCode" VARCHAR(32) NOT NULL DEFAULT 'ESAO_ADMIN',
    "esaoOrganizationId" UUID NOT NULL,
    "status" "EsaoAdminConfigurationStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "configurationSource" VARCHAR(32) NOT NULL DEFAULT 'APPROVED_APPOINTMENT',
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EsaoAdminConfiguration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EsaoAdminConfiguration_role_check" CHECK ("roleCode" = 'ESAO_ADMIN'),
    CONSTRAINT "EsaoAdminConfiguration_status_dates_check" CHECK (("status" = 'ACTIVE' AND "revokedAt" IS NULL) OR ("status" = 'REVOKED' AND "revokedAt" IS NOT NULL)),
    CONSTRAINT "EsaoAdminConfiguration_source_check" CHECK ("configurationSource" = 'APPROVED_APPOINTMENT'),
    CONSTRAINT "EsaoAdminConfiguration_integrityDigest_key" UNIQUE ("integrityDigest")
);
CREATE UNIQUE INDEX "EsaoAdminConfiguration_identity_active_key" ON "EsaoAdminConfiguration"("identityId") WHERE "status" = 'ACTIVE';
CREATE INDEX "EsaoAdminConfiguration_identityId_status_idx" ON "EsaoAdminConfiguration"("identityId", "status");
CREATE INDEX "EsaoAdminConfiguration_esaoOrganizationId_status_idx" ON "EsaoAdminConfiguration"("esaoOrganizationId", "status");
ALTER TABLE "EsaoAdminConfiguration"
  ADD CONSTRAINT "EsaoAdminConfiguration_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "EsaoAdminConfiguration_esaoOrganizationId_fkey" FOREIGN KEY ("esaoOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "EsaoAdminSchoolScope" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EsaoAdminSchoolScope_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EsaoAdminSchoolScope_configurationId_schoolId_key" UNIQUE ("configurationId", "schoolId")
);
CREATE INDEX "EsaoAdminSchoolScope_schoolId_configurationId_idx" ON "EsaoAdminSchoolScope"("schoolId", "configurationId");
ALTER TABLE "EsaoAdminSchoolScope"
  ADD CONSTRAINT "EsaoAdminSchoolScope_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "EsaoAdminConfiguration"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "EsaoAdminSchoolScope_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "EsaoAdminProvenance" (
    "id" UUID NOT NULL,
    "configurationId" UUID NOT NULL,
    "action" "EsaoAdminChangeAction" NOT NULL,
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
    CONSTRAINT "EsaoAdminProvenance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EsaoAdminProvenance_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "EsaoAdminProvenance_externalApprovalRecordId_action_key" UNIQUE ("externalApprovalRecordId", "action"),
    CONSTRAINT "EsaoAdminProvenance_configurationId_action_key" UNIQUE ("configurationId", "action"),
    CONSTRAINT "EsaoAdminProvenance_role_check" CHECK ("subjectRoleCode" = 'ESAO_ADMIN'),
    CONSTRAINT "EsaoAdminProvenance_evidence_check" CHECK (length(trim("externalApprovalRecordId")) > 0 AND "approvalAuthorityLabel" = 'Private Business / Product Owner' AND length(trim("approvalAuthorityIdentity")) > 0 AND length(trim("approvalEvidenceReference")) > 0 AND "approvalEvidenceHash" ~ '^[0-9a-f]{64}$')
);
CREATE INDEX "EsaoAdminProvenance_subjectIdentityId_action_executedAt_idx" ON "EsaoAdminProvenance"("subjectIdentityId", "action", "executedAt");
ALTER TABLE "EsaoAdminProvenance"
  ADD CONSTRAINT "EsaoAdminProvenance_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "EsaoAdminConfiguration"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "EsaoAdminProvenance_subjectIdentityId_fkey" FOREIGN KEY ("subjectIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "EsaoAdminProvenance_subjectEsaoOrganizationId_fkey" FOREIGN KEY ("subjectEsaoOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "EsaoAdminProvenance_technicalExecutorIdentityId_fkey" FOREIGN KEY ("technicalExecutorIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "EsaoAdminProvenance_technicalExecutorMembershipId_fkey" FOREIGN KEY ("technicalExecutorMembershipId") REFERENCES "ApprovedMembership"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_18_prevent_esao_admin_mutation"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Scope and provenance tables must never evaluate configuration-only OLD/NEW
  -- fields. Their update/delete path is an unconditional deny.
  IF TG_TABLE_NAME <> 'EsaoAdminConfiguration' OR TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'ESAO Admin configuration, scope, and provenance are immutable'
      USING ERRCODE = '55000';
  END IF;

  IF current_setting('p1_18.allow_revoke', true) = '1'
     AND OLD."identityId" = NEW."identityId"
     AND OLD."personNameSnapshot" = NEW."personNameSnapshot"
     AND OLD."roleCode" = NEW."roleCode"
     AND OLD."esaoOrganizationId" = NEW."esaoOrganizationId"
     AND OLD."effectiveFrom" = NEW."effectiveFrom"
     AND OLD."configurationSource" = NEW."configurationSource"
     AND OLD."integrityDigest" = NEW."integrityDigest"
     AND OLD."createdAt" = NEW."createdAt"
     AND OLD."status" = 'ACTIVE' AND NEW."status" = 'REVOKED'
     AND OLD."revokedAt" IS NULL AND NEW."revokedAt" IS NOT NULL THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'ESAO Admin configuration, scope, and provenance are immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE OR REPLACE FUNCTION "p1_18_assert_esao_admin_configuration"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  scope_count INTEGER;
  appointment_count INTEGER;
  revoke_count INTEGER;
BEGIN
  IF NEW."roleCode" <> 'ESAO_ADMIN' OR NEW."personNameSnapshot" = '' OR NEW."configurationSource" <> 'APPROVED_APPOINTMENT' THEN
    RAISE EXCEPTION 'ESAO Admin configuration shape is invalid' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "Organization"
    WHERE "id" = NEW."esaoOrganizationId" AND "type" = 'ESAO' AND "status" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'ESAO Admin configuration requires an active ESAO' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO scope_count FROM "EsaoAdminSchoolScope" WHERE "configurationId" = NEW."id";
  IF scope_count <> 17 THEN
    RAISE EXCEPTION 'ESAO Admin configuration requires the immutable 17-school scope' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM "EsaoAdminSchoolScope" scope
    JOIN "School" school ON school."organizationId" = scope."schoolId"
    JOIN "Organization" school_org ON school_org."id" = school."organizationId"
    WHERE scope."configurationId" = NEW."id"
      AND (NOT school."directoryIsActive" OR school_org."parentOrganizationId" <> NEW."esaoOrganizationId" OR school_org."type" <> 'SCHOOL' OR school_org."status" <> 'ACTIVE')
  ) THEN
    RAISE EXCEPTION 'ESAO Admin scope must contain only active Schools of the configured ESAO' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO appointment_count FROM "EsaoAdminProvenance" WHERE "configurationId" = NEW."id" AND "action" = 'APPOINT';
  IF appointment_count <> 1 THEN
    RAISE EXCEPTION 'ESAO Admin configuration requires exactly one appointment provenance record' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO revoke_count FROM "EsaoAdminProvenance" WHERE "configurationId" = NEW."id" AND "action" = 'REVOKE';
  IF (NEW."status" = 'ACTIVE' AND revoke_count <> 0) OR (NEW."status" = 'REVOKED' AND revoke_count <> 1) THEN
    RAISE EXCEPTION 'ESAO Admin configuration status and revocation provenance do not match' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "p1_18_assert_esao_admin_provenance"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  configuration_status "EsaoAdminConfigurationStatus";
BEGIN
  SELECT "status" INTO configuration_status FROM "EsaoAdminConfiguration" WHERE "id" = NEW."configurationId";
  IF (NEW."action" = 'APPOINT' AND configuration_status <> 'ACTIVE') OR (NEW."action" = 'REVOKE' AND configuration_status <> 'REVOKED') THEN
    RAISE EXCEPTION 'ESAO Admin provenance action does not match configuration status' USING ERRCODE = '23514';
  END IF;
  IF NEW."subjectRoleCode" <> 'ESAO_ADMIN' OR NEW."subjectIdentityId" = NEW."technicalExecutorIdentityId" THEN
    RAISE EXCEPTION 'ESAO Admin provenance subject or executor is invalid' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM "AuditLog" audit
    WHERE audit."commandCode" = 'AUTH-06'
      AND audit."targetType" = 'EsaoAdminConfiguration'
      AND audit."targetId" = NEW."configurationId"::TEXT
      AND audit."outcome" = 'SUCCESS'
      AND audit."actorIdentityId" = NEW."technicalExecutorIdentityId"
      AND audit."actorMembershipId" = NEW."technicalExecutorMembershipId"
      AND audit."scopeKind" = 'PLATFORM'
      AND audit."correlationId" = NEW."externalApprovalRecordId"
      AND audit."reasonCode" = CASE NEW."action"
        WHEN 'APPOINT'::"EsaoAdminChangeAction" THEN 'ESAO_ADMIN_CONFIGURATION_APPLIED'
        WHEN 'REVOKE'::"EsaoAdminChangeAction" THEN 'ESAO_ADMIN_CONFIGURATION_REVOKED'
      END
  ) THEN
    RAISE EXCEPTION 'ESAO Admin provenance requires matching System Admin execution audit evidence' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "EsaoAdminConfiguration_prevent_mutation" BEFORE UPDATE OR DELETE ON "EsaoAdminConfiguration" FOR EACH ROW EXECUTE FUNCTION "p1_18_prevent_esao_admin_mutation"();
CREATE TRIGGER "EsaoAdminSchoolScope_prevent_mutation" BEFORE UPDATE OR DELETE ON "EsaoAdminSchoolScope" FOR EACH ROW EXECUTE FUNCTION "p1_18_prevent_esao_admin_mutation"();
CREATE TRIGGER "EsaoAdminProvenance_prevent_mutation" BEFORE UPDATE OR DELETE ON "EsaoAdminProvenance" FOR EACH ROW EXECUTE FUNCTION "p1_18_prevent_esao_admin_mutation"();
CREATE CONSTRAINT TRIGGER "EsaoAdminConfiguration_assert_shape" AFTER INSERT OR UPDATE ON "EsaoAdminConfiguration" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "p1_18_assert_esao_admin_configuration"();
CREATE CONSTRAINT TRIGGER "EsaoAdminProvenance_assert_shape" AFTER INSERT ON "EsaoAdminProvenance" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "p1_18_assert_esao_admin_provenance"();
