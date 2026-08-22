-- P1-21: one-time exact School Admin bootstrap for the immutable 17-school pilot.

CREATE TYPE "SchoolAdminBootstrapStatus" AS ENUM ('APPROVED', 'EXECUTED');
CREATE TYPE "SchoolAdminBootstrapAction" AS ENUM ('APPROVE', 'EXECUTE');

CREATE TABLE "SchoolAdminBootstrap" (
    "id" TEXT NOT NULL DEFAULT 'p1-21',
    "esaoOrganizationId" UUID NOT NULL,
    "status" "SchoolAdminBootstrapStatus" NOT NULL DEFAULT 'APPROVED',
    "manifestDigest" CHAR(64) NOT NULL,
    "executorIdentityId" UUID,
    "executorMembershipId" UUID,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAdminBootstrap_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SchoolAdminBootstrap_singleton_check" CHECK ("id" = 'p1-21'),
    CONSTRAINT "SchoolAdminBootstrap_digest_check" CHECK ("manifestDigest" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "SchoolAdminBootstrap_status_shape_check" CHECK (
      ("status" = 'APPROVED' AND "executedAt" IS NULL AND "executorIdentityId" IS NULL AND "executorMembershipId" IS NULL)
      OR ("status" = 'EXECUTED' AND "executedAt" IS NOT NULL AND "executorIdentityId" IS NOT NULL AND "executorMembershipId" IS NOT NULL)
    )
);

ALTER TABLE "SchoolAdminBootstrap"
  ADD CONSTRAINT "SchoolAdminBootstrap_esaoOrganizationId_fkey"
    FOREIGN KEY ("esaoOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrap_executorIdentityId_fkey"
    FOREIGN KEY ("executorIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrap_executorMembershipId_fkey"
    FOREIGN KEY ("executorMembershipId") REFERENCES "ApprovedMembership"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "SchoolAdminBootstrapManifestRow" (
    "id" UUID NOT NULL,
    "bootstrapId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "schoolId" UUID NOT NULL,
    "accountIdentifier" VARCHAR(320) NOT NULL,
    "personName" VARCHAR(200) NOT NULL,
    "roleCode" VARCHAR(32) NOT NULL DEFAULT 'SCHOOL_ADMIN',
    "rowDigest" CHAR(64) NOT NULL,
    "identityId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "roleAssignmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAdminBootstrapManifestRow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SchoolAdminBootstrapManifestRow_row_check" CHECK ("rowNumber" BETWEEN 1 AND 17),
    CONSTRAINT "SchoolAdminBootstrapManifestRow_role_check" CHECK ("roleCode" = 'SCHOOL_ADMIN'),
    CONSTRAINT "SchoolAdminBootstrapManifestRow_account_check" CHECK ("accountIdentifier" = lower("accountIdentifier") AND "accountIdentifier" ~ '^[^@[:space:]]+@synthetic[.]test$'),
    CONSTRAINT "SchoolAdminBootstrapManifestRow_name_check" CHECK (length(trim("personName")) > 0),
    CONSTRAINT "SchoolAdminBootstrapManifestRow_digest_check" CHECK ("rowDigest" ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX "SchoolAdminBootstrapManifestRow_bootstrapId_rowNumber_key" ON "SchoolAdminBootstrapManifestRow"("bootstrapId", "rowNumber");
CREATE UNIQUE INDEX "SchoolAdminBootstrapManifestRow_bootstrapId_schoolId_key" ON "SchoolAdminBootstrapManifestRow"("bootstrapId", "schoolId");
CREATE UNIQUE INDEX "SchoolAdminBootstrapManifestRow_bootstrapId_accountIdentifier_key" ON "SchoolAdminBootstrapManifestRow"("bootstrapId", "accountIdentifier");
CREATE UNIQUE INDEX "SchoolAdminBootstrapManifestRow_bootstrapId_rowDigest_key" ON "SchoolAdminBootstrapManifestRow"("bootstrapId", "rowDigest");
CREATE INDEX "SchoolAdminBootstrapManifestRow_schoolId_accountIdentifier_idx" ON "SchoolAdminBootstrapManifestRow"("schoolId", "accountIdentifier");

ALTER TABLE "SchoolAdminBootstrapManifestRow"
  ADD CONSTRAINT "SchoolAdminBootstrapManifestRow_bootstrapId_fkey"
    FOREIGN KEY ("bootstrapId") REFERENCES "SchoolAdminBootstrap"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrapManifestRow_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrapManifestRow_identityId_fkey"
    FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrapManifestRow_membershipId_schoolId_fkey"
    FOREIGN KEY ("membershipId", "schoolId") REFERENCES "ApprovedMembership"("id", "organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrapManifestRow_roleAssignmentId_schoolId_fkey"
    FOREIGN KEY ("roleAssignmentId", "schoolId") REFERENCES "SchoolRoleAssignment"("id", "schoolId") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "SchoolAdminBootstrapProvenance" (
    "id" UUID NOT NULL,
    "bootstrapId" TEXT NOT NULL,
    "action" "SchoolAdminBootstrapAction" NOT NULL,
    "externalApprovalRecordId" VARCHAR(128) NOT NULL,
    "approvalAuthorityLabel" VARCHAR(128) NOT NULL,
    "approvalAuthorityIdentity" VARCHAR(320) NOT NULL,
    "approvalEvidenceReference" VARCHAR(512) NOT NULL,
    "approvalEvidenceHash" CHAR(64) NOT NULL,
    "approvalConfigurationId" UUID NOT NULL,
    "manifestDigest" CHAR(64) NOT NULL,
    "actorIdentityId" UUID NOT NULL,
    "actorMembershipId" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAdminBootstrapProvenance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SchoolAdminBootstrapProvenance_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "SchoolAdminBootstrapProvenance_externalApprovalRecordId_action_key" UNIQUE ("externalApprovalRecordId", "action"),
    CONSTRAINT "SchoolAdminBootstrapProvenance_bootstrapId_action_key" UNIQUE ("bootstrapId", "action"),
    CONSTRAINT "SchoolAdminBootstrapProvenance_digest_check" CHECK ("manifestDigest" ~ '^[0-9a-f]{64}' AND "approvalEvidenceHash" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "SchoolAdminBootstrapProvenance_approval_check" CHECK (
      length(trim("externalApprovalRecordId")) > 0
      AND "approvalAuthorityLabel" = 'ESAO Admin'
      AND length(trim("approvalAuthorityIdentity")) > 0
      AND length(trim("approvalEvidenceReference")) > 0
    )
);

CREATE INDEX "SchoolAdminBootstrapProvenance_actorIdentityId_action_occurredAt_idx"
  ON "SchoolAdminBootstrapProvenance"("actorIdentityId", "action", "occurredAt");

ALTER TABLE "SchoolAdminBootstrapProvenance"
  ADD CONSTRAINT "SchoolAdminBootstrapProvenance_bootstrapId_fkey"
    FOREIGN KEY ("bootstrapId") REFERENCES "SchoolAdminBootstrap"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrapProvenance_approvalConfigurationId_fkey"
    FOREIGN KEY ("approvalConfigurationId") REFERENCES "EsaoAdminConfiguration"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrapProvenance_actorIdentityId_fkey"
    FOREIGN KEY ("actorIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAdminBootstrapProvenance_actorMembershipId_fkey"
    FOREIGN KEY ("actorMembershipId") REFERENCES "ApprovedMembership"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_21_prevent_school_admin_bootstrap_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'SchoolAdminBootstrap' AND TG_OP = 'UPDATE'
     AND OLD."id" = NEW."id"
     AND OLD."esaoOrganizationId" = NEW."esaoOrganizationId"
     AND OLD."manifestDigest" = NEW."manifestDigest"
     AND OLD."approvedAt" = NEW."approvedAt"
     AND OLD."createdAt" = NEW."createdAt"
     AND OLD."status" = 'APPROVED'
     AND NEW."status" = 'EXECUTED'
     AND NEW."executedAt" IS NOT NULL
     AND NEW."executorIdentityId" IS NOT NULL
     AND NEW."executorMembershipId" IS NOT NULL THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'P1-21 School Admin bootstrap records are immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "SchoolAdminBootstrap_prevent_mutation"
BEFORE UPDATE OR DELETE ON "SchoolAdminBootstrap"
FOR EACH ROW EXECUTE FUNCTION "p1_21_prevent_school_admin_bootstrap_mutation"();
CREATE TRIGGER "SchoolAdminBootstrapManifestRow_prevent_mutation"
BEFORE UPDATE OR DELETE ON "SchoolAdminBootstrapManifestRow"
FOR EACH ROW EXECUTE FUNCTION "p1_21_prevent_school_admin_bootstrap_mutation"();
CREATE TRIGGER "SchoolAdminBootstrapProvenance_prevent_mutation"
BEFORE UPDATE OR DELETE ON "SchoolAdminBootstrapProvenance"
FOR EACH ROW EXECUTE FUNCTION "p1_21_prevent_school_admin_bootstrap_mutation"();

CREATE OR REPLACE FUNCTION "p1_21_assert_school_admin_bootstrap"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_status "SchoolAdminBootstrapStatus";
  row_count INTEGER;
  school_count INTEGER;
  approval_count INTEGER;
  execution_count INTEGER;
  approval_actor UUID;
  approval_membership UUID;
  approval_configuration UUID;
  executor_identity UUID;
  executor_membership UUID;
BEGIN
  SELECT "status", "executorIdentityId", "executorMembershipId"
    INTO current_status, executor_identity, executor_membership
    FROM "SchoolAdminBootstrap" WHERE "id" = NEW."id";

  SELECT count(*) INTO row_count FROM "SchoolAdminBootstrapManifestRow" WHERE "bootstrapId" = NEW."id";
  IF row_count <> 17 THEN
    RAISE EXCEPTION 'P1-21 requires exactly 17 manifest rows' USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO school_count
  FROM "School" school
  JOIN "Organization" school_org ON school_org."id" = school."organizationId"
  WHERE school."directoryIsActive" AND school_org."type" = 'SCHOOL'
    AND school_org."status" = 'ACTIVE' AND school_org."parentOrganizationId" = NEW."esaoOrganizationId";
  IF school_count <> 17 OR NOT EXISTS (
    SELECT 1 FROM "Organization" WHERE "id" = NEW."esaoOrganizationId" AND "type" = 'ESAO' AND "status" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'P1-21 requires the active 17-school pilot ESAO scope' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SchoolAdminBootstrapManifestRow" row
    JOIN "School" school ON school."organizationId" = row."schoolId"
    JOIN "Organization" school_org ON school_org."id" = school."organizationId"
    WHERE row."bootstrapId" = NEW."id"
      AND (NOT school."directoryIsActive" OR school_org."type" <> 'SCHOOL'
        OR school_org."status" <> 'ACTIVE' OR school_org."parentOrganizationId" <> NEW."esaoOrganizationId"
        OR row."roleCode" <> 'SCHOOL_ADMIN')
  ) THEN
    RAISE EXCEPTION 'P1-21 manifest rows must be one active School Admin per active pilot School' USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO approval_count
    FROM "SchoolAdminBootstrapProvenance"
    WHERE "bootstrapId" = NEW."id" AND "action" = 'APPROVE';
  SELECT "actorIdentityId", "actorMembershipId", "approvalConfigurationId"
    INTO approval_actor, approval_membership, approval_configuration
    FROM "SchoolAdminBootstrapProvenance"
    WHERE "bootstrapId" = NEW."id" AND "action" = 'APPROVE'
    LIMIT 1;
  SELECT count(*) INTO execution_count
    FROM "SchoolAdminBootstrapProvenance"
    WHERE "bootstrapId" = NEW."id" AND "action" = 'EXECUTE';

  IF current_status = 'APPROVED' AND (approval_count <> 1 OR execution_count <> 0) THEN
    RAISE EXCEPTION 'P1-21 approved state requires exactly one approval provenance record' USING ERRCODE = '23514';
  END IF;
  IF current_status = 'EXECUTED' AND (approval_count <> 1 OR execution_count <> 1) THEN
    RAISE EXCEPTION 'P1-21 executed state requires separate approval and execution provenance records' USING ERRCODE = '23514';
  END IF;

  IF approval_configuration IS NULL OR NOT EXISTS (
    SELECT 1
    FROM "EsaoAdminConfiguration" config
    JOIN "AuthenticatedIdentity" approver ON approver."id" = config."identityId"
    JOIN "ApprovedMembership" membership ON membership."identityId" = approver."id"
    WHERE config."id" = approval_configuration AND config."identityId" = approval_actor
      AND config."roleCode" = 'ESAO_ADMIN' AND config."configurationSource" = 'APPROVED_APPOINTMENT'
      AND config."status" = 'ACTIVE' AND config."esaoOrganizationId" = NEW."esaoOrganizationId"
      AND approver."accountStatus" = 'ACTIVE' AND membership."id" = approval_membership
      AND membership."organizationId" = NEW."esaoOrganizationId" AND membership."status" = 'ACTIVE'
      AND membership."effectiveFrom" <= now()
      AND (membership."effectiveTo" IS NULL OR membership."effectiveTo" > now())
  ) THEN
    RAISE EXCEPTION 'P1-21 approval must be attributable to the active ESAO Admin configuration' USING ERRCODE = '42501';
  END IF;

  IF current_status = 'EXECUTED' AND NOT EXISTS (
    SELECT 1
    FROM "SystemAdminBootstrap" system_admin
    JOIN "AuthenticatedIdentity" identity ON identity."id" = system_admin."identityId"
    JOIN "ApprovedMembership" membership ON membership."id" = system_admin."membershipId"
    JOIN "Organization" platform ON platform."id" = membership."organizationId"
    WHERE system_admin."identityId" = executor_identity AND system_admin."membershipId" = executor_membership
      AND identity."accountStatus" = 'ACTIVE' AND membership."status" = 'ACTIVE'
      AND membership."effectiveFrom" <= now() AND (membership."effectiveTo" IS NULL OR membership."effectiveTo" > now())
      AND platform."type" = 'PLATFORM' AND platform."status" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'P1-21 execution requires the active System Admin technical executor' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SchoolAdminBootstrapManifestRow" row
    JOIN "AuthenticatedIdentity" identity ON identity."id" = row."identityId"
    JOIN "ApprovedMembership" membership ON membership."id" = row."membershipId"
    JOIN "SchoolRoleAssignment" assignment ON assignment."id" = row."roleAssignmentId"
    WHERE row."bootstrapId" = NEW."id"
      AND (identity."accountStatus" <> 'ACTIVE' OR identity."passwordHash" IS NOT NULL
        OR identity."passwordChangedAt" IS NOT NULL
        OR membership."identityId" <> identity."id" OR membership."status" <> 'ACTIVE'
        OR membership."effectiveTo" IS NOT NULL OR membership."approvedByIdentityId" <> approval_actor
        OR assignment."membershipId" <> membership."id" OR assignment."schoolId" <> row."schoolId"
        OR assignment."role" <> 'SCHOOL_ADMIN' OR assignment."status" <> 'ACTIVE'
        OR assignment."grantedByIdentityId" <> approval_actor
        OR (SELECT count(*) FROM "ApprovedMembership" m WHERE m."identityId" = identity."id") <> 1
        OR (SELECT count(*) FROM "SchoolRoleAssignment" a WHERE a."membershipId" = membership."id") <> 1)
  ) THEN
    RAISE EXCEPTION 'P1-21 resulting accounts must have one active School membership and only SCHOOL_ADMIN' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "AuditLog" audit
    WHERE audit."commandCode" = 'AUTH-09' AND audit."targetType" = 'SchoolAdminBootstrap'
      AND audit."targetId" = NEW."id" AND audit."outcome" = 'SUCCESS'
      AND audit."actorIdentityId" = approval_actor AND audit."actorMembershipId" = approval_membership
      AND audit."scopeKind" = 'ORGANIZATION' AND audit."scopeOrganizationId" = NEW."esaoOrganizationId"
      AND audit."reasonCode" = 'SCHOOL_ADMIN_BOOTSTRAP_APPROVED'
      AND audit."correlationId" = (SELECT "externalApprovalRecordId" FROM "SchoolAdminBootstrapProvenance" WHERE "bootstrapId" = NEW."id" AND "action" = 'APPROVE')
  ) THEN
    RAISE EXCEPTION 'P1-21 approval requires matching ESAO Admin audit evidence' USING ERRCODE = '23514';
  END IF;
  IF current_status = 'EXECUTED' AND NOT EXISTS (
    SELECT 1 FROM "AuditLog" audit
    WHERE audit."commandCode" = 'AUTH-09' AND audit."targetType" = 'SchoolAdminBootstrap'
      AND audit."targetId" = NEW."id" AND audit."outcome" = 'SUCCESS'
      AND audit."actorIdentityId" = executor_identity AND audit."actorMembershipId" = executor_membership
      AND audit."scopeKind" = 'PLATFORM' AND audit."reasonCode" = 'SCHOOL_ADMIN_BOOTSTRAP_EXECUTED'
      AND audit."correlationId" = (SELECT "externalApprovalRecordId" FROM "SchoolAdminBootstrapProvenance" WHERE "bootstrapId" = NEW."id" AND "action" = 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'P1-21 execution requires matching System Admin audit evidence' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "p1_21_assert_school_admin_provenance"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE current_status "SchoolAdminBootstrapStatus";
BEGIN
  SELECT "status" INTO current_status FROM "SchoolAdminBootstrap" WHERE "id" = NEW."bootstrapId";
  IF NEW."manifestDigest" <> (SELECT "manifestDigest" FROM "SchoolAdminBootstrap" WHERE "id" = NEW."bootstrapId") THEN
    RAISE EXCEPTION 'P1-21 provenance manifest digest does not match the sealed bootstrap' USING ERRCODE = '23514';
  END IF;
  IF NEW."action" = 'APPROVE' AND current_status NOT IN ('APPROVED', 'EXECUTED') THEN
    RAISE EXCEPTION 'P1-21 approval provenance has an invalid bootstrap state' USING ERRCODE = '23514';
  END IF;
  IF NEW."action" = 'EXECUTE' AND current_status <> 'EXECUTED' THEN
    RAISE EXCEPTION 'P1-21 execution provenance requires an executed bootstrap' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "SchoolAdminBootstrap_assert_shape"
AFTER INSERT OR UPDATE ON "SchoolAdminBootstrap"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "p1_21_assert_school_admin_bootstrap"();
CREATE CONSTRAINT TRIGGER "SchoolAdminBootstrapProvenance_assert_shape"
AFTER INSERT ON "SchoolAdminBootstrapProvenance"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "p1_21_assert_school_admin_provenance"();
