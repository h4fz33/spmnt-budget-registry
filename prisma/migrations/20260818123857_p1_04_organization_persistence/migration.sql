-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('PLATFORM', 'ESAO', 'SCHOOL');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SchoolRole" AS ENUM ('FINANCE_OFFICER', 'SCHOOL_ADMIN', 'SCHOOL_DIRECTOR');

-- CreateEnum
CREATE TYPE "RoleAssignmentStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'REVOKED', 'SUPERSEDED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "FiscalYearStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ActingReasonCode" AS ENUM ('MEDICAL_LEAVE', 'OFFICIAL_TRAVEL', 'PERSONAL_LEAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "SubstituteDirectorAuthorityVariant" AS ENUM ('ACTING_DIRECTOR', 'ACTING_ESAO', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "SubstituteDirectorAuthorityStatus" AS ENUM ('SCHEDULED', 'IN_FORCE', 'REVOKED', 'EXPIRED', 'SUPERSEDED', 'INVALIDATED', 'ENDED_ON_RETURN', 'CONVERTED');

-- CreateEnum
CREATE TYPE "DirectorAvailabilityStatus" AS ENUM ('UNAVAILABLE', 'RESUMED', 'DIRECTOR_ASSIGNMENT_ENDED');

-- AlterTable
ALTER TABLE "DatabaseBootstrap" ALTER COLUMN "id" SET DEFAULT 'p1-03';

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT,
    "parentOrganizationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "organizationId" UUID NOT NULL,
    "smisCode" VARCHAR(32) NOT NULL,
    "moeCode" VARCHAR(32) NOT NULL,
    "directoryIsActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("organizationId")
);

-- CreateTable
CREATE TABLE "AuthenticatedIdentity" (
    "id" UUID NOT NULL,
    "accountIdentifier" VARCHAR(320) NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "authorizationVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthenticatedIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovedMembership" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "approvedByIdentityId" UUID,
    "authorizationVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovedMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolRoleAssignment" (
    "id" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "status" "RoleAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "grantReason" TEXT NOT NULL,
    "evidenceReference" TEXT,
    "grantedByIdentityId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "buddhistYear" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "status" "FiscalYearStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveDirectorAvailability" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "directorRoleAssignmentId" UUID NOT NULL,
    "status" "DirectorAvailabilityStatus" NOT NULL DEFAULT 'UNAVAILABLE',
    "unavailableFrom" TIMESTAMP(3) NOT NULL,
    "resumedAt" TIMESTAMP(3),
    "recordedByIdentityId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveDirectorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstituteDirectorAuthority" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "variant" "SubstituteDirectorAuthorityVariant" NOT NULL,
    "status" "SubstituteDirectorAuthorityStatus" NOT NULL,
    "appointingIdentityId" UUID NOT NULL,
    "subjectRoleAssignmentId" UUID NOT NULL,
    "availabilityId" UUID,
    "actingReasonCode" "ActingReasonCode",
    "reasonDetail" TEXT,
    "temporaryBasis" TEXT,
    "commandScope" TEXT[] DEFAULT ARRAY['AUTH-09', 'AUTH-11', 'AUTH-12', 'AUTH-18']::TEXT[],
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "recordVersion" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" UUID,
    "integrityDigest" CHAR(64) NOT NULL,
    "evidenceReference" TEXT,
    "evidenceContentHash" CHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstituteDirectorAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstituteDirectorAuthorityLifecycle" (
    "id" UUID NOT NULL,
    "authorityId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" "SubstituteDirectorAuthorityStatus" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "actorIdentityId" UUID,
    "reason" TEXT NOT NULL,
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstituteDirectorAuthorityLifecycle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_parentOrganizationId_idx" ON "Organization"("parentOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "School_smisCode_key" ON "School"("smisCode");

-- CreateIndex
CREATE UNIQUE INDEX "School_moeCode_key" ON "School"("moeCode");

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticatedIdentity_accountIdentifier_key" ON "AuthenticatedIdentity"("accountIdentifier");

-- CreateIndex
CREATE INDEX "ApprovedMembership_identityId_organizationId_idx" ON "ApprovedMembership"("identityId", "organizationId");

-- CreateIndex
CREATE INDEX "ApprovedMembership_organizationId_status_idx" ON "ApprovedMembership"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovedMembership_id_organizationId_key" ON "ApprovedMembership"("id", "organizationId");

-- CreateIndex
CREATE INDEX "SchoolRoleAssignment_membershipId_schoolId_role_status_idx" ON "SchoolRoleAssignment"("membershipId", "schoolId", "role", "status");

-- CreateIndex
CREATE INDEX "SchoolRoleAssignment_schoolId_role_status_idx" ON "SchoolRoleAssignment"("schoolId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRoleAssignment_id_schoolId_key" ON "SchoolRoleAssignment"("id", "schoolId");

-- CreateIndex
CREATE INDEX "FiscalYear_schoolId_startsOn_endsOn_idx" ON "FiscalYear"("schoolId", "startsOn", "endsOn");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_schoolId_buddhistYear_key" ON "FiscalYear"("schoolId", "buddhistYear");

-- CreateIndex
CREATE INDEX "ActiveDirectorAvailability_schoolId_status_idx" ON "ActiveDirectorAvailability"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveDirectorAvailability_id_schoolId_key" ON "ActiveDirectorAvailability"("id", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SubstituteDirectorAuthority_supersedesId_key" ON "SubstituteDirectorAuthority"("supersedesId");

-- CreateIndex
CREATE INDEX "SubstituteDirectorAuthority_schoolId_variant_status_effecti_idx" ON "SubstituteDirectorAuthority"("schoolId", "variant", "status", "effectiveFrom", "expiresAt");

-- CreateIndex
CREATE INDEX "SubstituteDirectorAuthority_subjectRoleAssignmentId_schoolI_idx" ON "SubstituteDirectorAuthority"("subjectRoleAssignmentId", "schoolId");

-- CreateIndex
CREATE INDEX "SubstituteDirectorAuthorityLifecycle_authorityId_occurredAt_idx" ON "SubstituteDirectorAuthorityLifecycle"("authorityId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubstituteDirectorAuthorityLifecycle_authorityId_revision_key" ON "SubstituteDirectorAuthorityLifecycle"("authorityId", "revision");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentOrganizationId_fkey" FOREIGN KEY ("parentOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApprovedMembership" ADD CONSTRAINT "ApprovedMembership_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApprovedMembership" ADD CONSTRAINT "ApprovedMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApprovedMembership" ADD CONSTRAINT "ApprovedMembership_approvedByIdentityId_fkey" FOREIGN KEY ("approvedByIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SchoolRoleAssignment" ADD CONSTRAINT "SchoolRoleAssignment_membershipId_schoolId_fkey" FOREIGN KEY ("membershipId", "schoolId") REFERENCES "ApprovedMembership"("id", "organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SchoolRoleAssignment" ADD CONSTRAINT "SchoolRoleAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SchoolRoleAssignment" ADD CONSTRAINT "SchoolRoleAssignment_grantedByIdentityId_fkey" FOREIGN KEY ("grantedByIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ActiveDirectorAvailability" ADD CONSTRAINT "ActiveDirectorAvailability_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ActiveDirectorAvailability" ADD CONSTRAINT "ActiveDirectorAvailability_directorRoleAssignmentId_school_fkey" FOREIGN KEY ("directorRoleAssignmentId", "schoolId") REFERENCES "SchoolRoleAssignment"("id", "schoolId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ActiveDirectorAvailability" ADD CONSTRAINT "ActiveDirectorAvailability_recordedByIdentityId_fkey" FOREIGN KEY ("recordedByIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubstituteDirectorAuthority" ADD CONSTRAINT "SubstituteDirectorAuthority_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubstituteDirectorAuthority" ADD CONSTRAINT "SubstituteDirectorAuthority_appointingIdentityId_fkey" FOREIGN KEY ("appointingIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubstituteDirectorAuthority" ADD CONSTRAINT "SubstituteDirectorAuthority_subjectRoleAssignmentId_school_fkey" FOREIGN KEY ("subjectRoleAssignmentId", "schoolId") REFERENCES "SchoolRoleAssignment"("id", "schoolId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubstituteDirectorAuthority" ADD CONSTRAINT "SubstituteDirectorAuthority_availabilityId_schoolId_fkey" FOREIGN KEY ("availabilityId", "schoolId") REFERENCES "ActiveDirectorAvailability"("id", "schoolId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubstituteDirectorAuthority" ADD CONSTRAINT "SubstituteDirectorAuthority_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "SubstituteDirectorAuthority"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubstituteDirectorAuthorityLifecycle" ADD CONSTRAINT "SubstituteDirectorAuthorityLifecycle_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "SubstituteDirectorAuthority"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubstituteDirectorAuthorityLifecycle" ADD CONSTRAINT "SubstituteDirectorAuthorityLifecycle_actorIdentityId_fkey" FOREIGN KEY ("actorIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- P1-04 integrity controls that Prisma cannot model directly. The triggers
-- preserve history while allowing future lifecycle services to update only the
-- current status/end fields and append immutable lifecycle rows.
ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_parent_shape_check"
  CHECK (
    ("type" IN ('PLATFORM', 'ESAO') AND "parentOrganizationId" IS NULL)
    OR ("type" = 'SCHOOL' AND "parentOrganizationId" IS NOT NULL)
  );

ALTER TABLE "AuthenticatedIdentity"
  ADD CONSTRAINT "AuthenticatedIdentity_normalized_identifier_check"
  CHECK (
    "accountIdentifier" = lower(btrim("accountIdentifier"))
    AND length("accountIdentifier") > 0
  ),
  ADD CONSTRAINT "AuthenticatedIdentity_authorization_version_check"
  CHECK ("authorizationVersion" > 0);

ALTER TABLE "ApprovedMembership"
  ADD CONSTRAINT "ApprovedMembership_effective_range_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom"),
  ADD CONSTRAINT "ApprovedMembership_authorization_version_check"
  CHECK ("authorizationVersion" > 0);

ALTER TABLE "SchoolRoleAssignment"
  ADD CONSTRAINT "SchoolRoleAssignment_effective_range_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom");

ALTER TABLE "FiscalYear"
  ADD CONSTRAINT "FiscalYear_dates_check"
  CHECK (
    "startsOn" = make_date("buddhistYear" - 543, 10, 1)
    AND "endsOn" = make_date("buddhistYear" - 542, 9, 30)
    AND "endsOn" > "startsOn"
  );

ALTER TABLE "ActiveDirectorAvailability"
  ADD CONSTRAINT "ActiveDirectorAvailability_lifecycle_check"
  CHECK (
    ("status" = 'UNAVAILABLE' AND "resumedAt" IS NULL)
    OR ("status" = 'RESUMED' AND "resumedAt" > "unavailableFrom")
    OR ("status" = 'DIRECTOR_ASSIGNMENT_ENDED' AND "resumedAt" IS NULL)
  );

ALTER TABLE "SubstituteDirectorAuthority"
  ALTER COLUMN "commandScope" SET NOT NULL,
  ADD CONSTRAINT "SubstituteDirectorAuthority_fixed_command_scope_check"
  CHECK ("commandScope" = ARRAY['AUTH-09', 'AUTH-11', 'AUTH-12', 'AUTH-18']::TEXT[]),
  ADD CONSTRAINT "SubstituteDirectorAuthority_effective_range_check"
  CHECK ("expiresAt" IS NULL OR "expiresAt" > "effectiveFrom"),
  ADD CONSTRAINT "SubstituteDirectorAuthority_version_check"
  CHECK ("recordVersion" > 0),
  ADD CONSTRAINT "SubstituteDirectorAuthority_integrity_digest_check"
  CHECK ("integrityDigest" ~ '^[0-9A-Fa-f]{64}$'),
  ADD CONSTRAINT "SubstituteDirectorAuthority_evidence_hash_check"
  CHECK ("evidenceContentHash" IS NULL OR "evidenceContentHash" ~ '^[0-9A-Fa-f]{64}$'),
  ADD CONSTRAINT "SubstituteDirectorAuthority_reason_shape_check"
  CHECK (
    (
      "variant" IN ('ACTING_DIRECTOR', 'ACTING_ESAO')
      AND "actingReasonCode" IS NOT NULL
      AND "temporaryBasis" IS NULL
      AND "availabilityId" IS NOT NULL
      AND (
        "actingReasonCode" <> 'OTHER'
        OR length(btrim(coalesce("reasonDetail", ''))) > 0
      )
    )
    OR (
      "variant" = 'TEMPORARY'
      AND "actingReasonCode" IS NULL
      AND length(btrim(coalesce("temporaryBasis", ''))) > 0
      AND "expiresAt" IS NOT NULL
    )
  );

ALTER TABLE "SubstituteDirectorAuthorityLifecycle"
  ADD CONSTRAINT "SubstituteDirectorAuthorityLifecycle_revision_check"
  CHECK ("revision" > 0),
  ADD CONSTRAINT "SubstituteDirectorAuthorityLifecycle_integrity_digest_check"
  CHECK ("integrityDigest" ~ '^[0-9A-Fa-f]{64}$'),
  ADD CONSTRAINT "SubstituteDirectorAuthorityLifecycle_reason_check"
  CHECK (length(btrim("reason")) > 0);

CREATE UNIQUE INDEX "ApprovedMembership_one_active_identity_organization"
  ON "ApprovedMembership" ("identityId", "organizationId")
  WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "SchoolRoleAssignment_one_active_director_per_school"
  ON "SchoolRoleAssignment" ("schoolId")
  WHERE "role" = 'SCHOOL_DIRECTOR' AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "ActiveDirectorAvailability_one_unavailable_per_school"
  ON "ActiveDirectorAvailability" ("schoolId")
  WHERE "status" = 'UNAVAILABLE';

CREATE UNIQUE INDEX "SubstituteDirectorAuthority_one_in_force_tier_per_school"
  ON "SubstituteDirectorAuthority" (
    "schoolId",
    (CASE WHEN "variant" IN ('ACTING_DIRECTOR', 'ACTING_ESAO') THEN 'ACTING' ELSE 'TEMPORARY' END)
  )
  WHERE "status" = 'IN_FORCE';

CREATE OR REPLACE FUNCTION "p1_04_assert_organization_shape"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."type" = 'SCHOOL' AND NOT EXISTS (
    SELECT 1
    FROM "Organization" parent
    WHERE parent."id" = NEW."parentOrganizationId"
      AND parent."type" = 'ESAO'
  ) THEN
    RAISE EXCEPTION 'School organization must have an ESAO parent'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE'
    AND (NEW."type" IS DISTINCT FROM OLD."type"
      OR NEW."parentOrganizationId" IS DISTINCT FROM OLD."parentOrganizationId")
    AND EXISTS (SELECT 1 FROM "School" school WHERE school."organizationId" = NEW."id") THEN
    RAISE EXCEPTION 'School organization type and parent are immutable'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "Organization_assert_shape"
BEFORE INSERT OR UPDATE ON "Organization"
FOR EACH ROW EXECUTE FUNCTION "p1_04_assert_organization_shape"();

CREATE OR REPLACE FUNCTION "p1_04_assert_school_organization"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "Organization" organization
    JOIN "Organization" parent ON parent."id" = organization."parentOrganizationId"
    WHERE organization."id" = NEW."organizationId"
      AND organization."type" = 'SCHOOL'
      AND parent."type" = 'ESAO'
  ) THEN
    RAISE EXCEPTION 'School profile requires a School organization under an ESAO'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "School_assert_organization"
BEFORE INSERT OR UPDATE ON "School"
FOR EACH ROW EXECUTE FUNCTION "p1_04_assert_school_organization"();

CREATE OR REPLACE FUNCTION "p1_04_assert_role_assignment"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  subject_identity UUID;
BEGIN
  SELECT membership."identityId"
  INTO subject_identity
  FROM "ApprovedMembership" membership
  WHERE membership."id" = NEW."membershipId"
    AND membership."organizationId" = NEW."schoolId"
    AND membership."status" = 'ACTIVE';

  IF subject_identity IS NULL THEN
    RAISE EXCEPTION 'School role requires an active membership for the exact School'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."status" IN ('SCHEDULED', 'ACTIVE') THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(subject_identity::TEXT, 0));

    IF EXISTS (
      SELECT 1
      FROM "SchoolRoleAssignment" existing
      WHERE existing."id" <> NEW."id"
        AND existing."membershipId" = NEW."membershipId"
        AND existing."role" = NEW."role"
        AND existing."status" IN ('SCHEDULED', 'ACTIVE')
        AND tsrange(existing."effectiveFrom", existing."effectiveTo", '[)')
            && tsrange(NEW."effectiveFrom", NEW."effectiveTo", '[)')
    ) THEN
      RAISE EXCEPTION 'Overlapping School role assignment is prohibited'
        USING ERRCODE = '23P01';
    END IF;

    IF NEW."role" IN ('FINANCE_OFFICER', 'SCHOOL_ADMIN') AND EXISTS (
      SELECT 1
      FROM "SchoolRoleAssignment" existing_role
      JOIN "ApprovedMembership" existing_membership
        ON existing_membership."id" = existing_role."membershipId"
      WHERE existing_role."id" <> NEW."id"
        AND existing_membership."identityId" = subject_identity
        AND existing_role."membershipId" <> NEW."membershipId"
        AND existing_role."status" IN ('SCHEDULED', 'ACTIVE')
        AND (
          (NEW."role" = 'FINANCE_OFFICER' AND existing_role."role" = 'SCHOOL_ADMIN')
          OR (NEW."role" = 'SCHOOL_ADMIN' AND existing_role."role" = 'FINANCE_OFFICER')
        )
        AND tsrange(existing_role."effectiveFrom", existing_role."effectiveTo", '[)')
            && tsrange(NEW."effectiveFrom", NEW."effectiveTo", '[)')
    ) THEN
      RAISE EXCEPTION 'Finance Officer and School Admin may coexist only on one membership'
        USING ERRCODE = '23514';
    END IF;

    IF NEW."role" = 'SCHOOL_DIRECTOR' THEN
      PERFORM pg_advisory_xact_lock(hashtextextended(NEW."schoolId"::TEXT, 1));

      IF EXISTS (
        SELECT 1
        FROM "SchoolRoleAssignment" existing_director
        WHERE existing_director."id" <> NEW."id"
          AND existing_director."schoolId" = NEW."schoolId"
          AND existing_director."role" = 'SCHOOL_DIRECTOR'
          AND existing_director."status" IN ('SCHEDULED', 'ACTIVE')
          AND tsrange(existing_director."effectiveFrom", existing_director."effectiveTo", '[)')
              && tsrange(NEW."effectiveFrom", NEW."effectiveTo", '[)')
      ) THEN
        RAISE EXCEPTION 'Overlapping active School Director assignments are prohibited'
          USING ERRCODE = '23P01';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "SchoolRoleAssignment_assert_scope_and_overlap"
BEFORE INSERT OR UPDATE ON "SchoolRoleAssignment"
FOR EACH ROW EXECUTE FUNCTION "p1_04_assert_role_assignment"();

CREATE OR REPLACE FUNCTION "p1_04_assert_director_availability"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  assignment_role "SchoolRole";
BEGIN
  SELECT role_assignment."role"
  INTO assignment_role
  FROM "SchoolRoleAssignment" role_assignment
  WHERE role_assignment."id" = NEW."directorRoleAssignmentId"
    AND role_assignment."schoolId" = NEW."schoolId";

  IF assignment_role IS DISTINCT FROM 'SCHOOL_DIRECTOR'::"SchoolRole" THEN
    RAISE EXCEPTION 'Director availability requires a School Director assignment in the same School'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "ActiveDirectorAvailability_assert_director_assignment"
BEFORE INSERT OR UPDATE ON "ActiveDirectorAvailability"
FOR EACH ROW EXECUTE FUNCTION "p1_04_assert_director_availability"();

CREATE OR REPLACE FUNCTION "p1_04_assert_substitute_authority"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  subject_identity UUID;
  subject_role "SchoolRole";
  subject_role_status "RoleAssignmentStatus";
  membership_status "MembershipStatus";
  availability_status "DirectorAvailabilityStatus";
  available_director_identity UUID;
  authority_tier TEXT;
BEGIN
  SELECT membership."identityId", role_assignment."role", role_assignment."status", membership."status"
  INTO subject_identity, subject_role, subject_role_status, membership_status
  FROM "SchoolRoleAssignment" role_assignment
  JOIN "ApprovedMembership" membership ON membership."id" = role_assignment."membershipId"
  WHERE role_assignment."id" = NEW."subjectRoleAssignmentId"
    AND role_assignment."schoolId" = NEW."schoolId";

  IF subject_identity IS NULL
    OR subject_role NOT IN ('FINANCE_OFFICER', 'SCHOOL_ADMIN')
    OR subject_role_status NOT IN ('SCHEDULED', 'ACTIVE')
    OR membership_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Substitute authority requires an active same-School Finance Officer or School Admin role'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."appointingIdentityId" = subject_identity THEN
    RAISE EXCEPTION 'A substitute authority actor cannot appoint themselves'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."availabilityId" IS NOT NULL THEN
    SELECT availability."status", membership."identityId"
    INTO availability_status, available_director_identity
    FROM "ActiveDirectorAvailability" availability
    JOIN "SchoolRoleAssignment" director_assignment
      ON director_assignment."id" = availability."directorRoleAssignmentId"
    JOIN "ApprovedMembership" membership
      ON membership."id" = director_assignment."membershipId"
    WHERE availability."id" = NEW."availabilityId"
      AND availability."schoolId" = NEW."schoolId";

    IF availability_status IS DISTINCT FROM 'UNAVAILABLE'::"DirectorAvailabilityStatus" THEN
      RAISE EXCEPTION 'Substitute authority availability must be currently unavailable'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW."variant" = 'ACTING_DIRECTOR'
    AND NEW."appointingIdentityId" IS DISTINCT FROM available_director_identity THEN
    RAISE EXCEPTION 'Director-created Acting authority must name the unavailable active Director as actor'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."supersedesId" IS NOT NULL AND EXISTS (
    SELECT 1
    FROM "SubstituteDirectorAuthority" predecessor
    WHERE predecessor."id" = NEW."supersedesId"
      AND (
        predecessor."schoolId" <> NEW."schoolId"
        OR (predecessor."variant" IN ('ACTING_DIRECTOR', 'ACTING_ESAO'))
           <> (NEW."variant" IN ('ACTING_DIRECTOR', 'ACTING_ESAO'))
      )
  ) THEN
    RAISE EXCEPTION 'Substitute authority supersession must remain in the same School and tier'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."status" IN ('SCHEDULED', 'IN_FORCE') THEN
    authority_tier := CASE
      WHEN NEW."variant" IN ('ACTING_DIRECTOR', 'ACTING_ESAO') THEN 'ACTING'
      ELSE 'TEMPORARY'
    END;
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW."schoolId"::TEXT || authority_tier, 2));

    IF EXISTS (
      SELECT 1
      FROM "SubstituteDirectorAuthority" existing
      WHERE existing."id" <> NEW."id"
        AND existing."schoolId" = NEW."schoolId"
        AND existing."status" IN ('SCHEDULED', 'IN_FORCE')
        AND (
          (authority_tier = 'ACTING' AND existing."variant" IN ('ACTING_DIRECTOR', 'ACTING_ESAO'))
          OR (authority_tier = 'TEMPORARY' AND existing."variant" = 'TEMPORARY')
        )
        AND tsrange(existing."effectiveFrom", existing."expiresAt", '[)')
            && tsrange(NEW."effectiveFrom", NEW."expiresAt", '[)')
    ) THEN
      RAISE EXCEPTION 'Overlapping Substitute Director Authority records are prohibited within a tier'
        USING ERRCODE = '23P01';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "SubstituteDirectorAuthority_assert_scope_and_overlap"
BEFORE INSERT OR UPDATE ON "SubstituteDirectorAuthority"
FOR EACH ROW EXECUTE FUNCTION "p1_04_assert_substitute_authority"();

CREATE OR REPLACE FUNCTION "p1_04_prevent_history_delete"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'P1-04 history records cannot be deleted'
    USING ERRCODE = '55000';
END;
$$;

CREATE OR REPLACE FUNCTION "p1_04_preserve_immutable_columns"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'AuthenticatedIdentity' AND NEW."accountIdentifier" IS DISTINCT FROM OLD."accountIdentifier" THEN
    RAISE EXCEPTION 'Authenticated identity identifier is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'School'
    AND (NEW."smisCode" IS DISTINCT FROM OLD."smisCode" OR NEW."moeCode" IS DISTINCT FROM OLD."moeCode") THEN
    RAISE EXCEPTION 'School identifiers are immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'ApprovedMembership'
    AND (NEW."identityId" IS DISTINCT FROM OLD."identityId"
      OR NEW."organizationId" IS DISTINCT FROM OLD."organizationId"
      OR NEW."effectiveFrom" IS DISTINCT FROM OLD."effectiveFrom"
      OR NEW."approvedByIdentityId" IS DISTINCT FROM OLD."approvedByIdentityId") THEN
    RAISE EXCEPTION 'Approved Membership scope is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'SchoolRoleAssignment'
    AND (NEW."membershipId" IS DISTINCT FROM OLD."membershipId"
      OR NEW."schoolId" IS DISTINCT FROM OLD."schoolId"
      OR NEW."role" IS DISTINCT FROM OLD."role"
      OR NEW."effectiveFrom" IS DISTINCT FROM OLD."effectiveFrom"
      OR NEW."grantReason" IS DISTINCT FROM OLD."grantReason"
      OR NEW."evidenceReference" IS DISTINCT FROM OLD."evidenceReference"
      OR NEW."grantedByIdentityId" IS DISTINCT FROM OLD."grantedByIdentityId") THEN
    RAISE EXCEPTION 'School role assignment scope is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'FiscalYear'
    AND (NEW."schoolId" IS DISTINCT FROM OLD."schoolId"
      OR NEW."buddhistYear" IS DISTINCT FROM OLD."buddhistYear"
      OR NEW."startsOn" IS DISTINCT FROM OLD."startsOn"
      OR NEW."endsOn" IS DISTINCT FROM OLD."endsOn") THEN
    RAISE EXCEPTION 'Fiscal Year boundaries are immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'ActiveDirectorAvailability'
    AND (NEW."schoolId" IS DISTINCT FROM OLD."schoolId"
      OR NEW."directorRoleAssignmentId" IS DISTINCT FROM OLD."directorRoleAssignmentId"
      OR NEW."unavailableFrom" IS DISTINCT FROM OLD."unavailableFrom"
      OR NEW."recordedByIdentityId" IS DISTINCT FROM OLD."recordedByIdentityId") THEN
    RAISE EXCEPTION 'Director availability scope is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'SubstituteDirectorAuthority'
    AND (NEW."schoolId" IS DISTINCT FROM OLD."schoolId"
      OR NEW."variant" IS DISTINCT FROM OLD."variant"
      OR NEW."appointingIdentityId" IS DISTINCT FROM OLD."appointingIdentityId"
      OR NEW."subjectRoleAssignmentId" IS DISTINCT FROM OLD."subjectRoleAssignmentId"
      OR NEW."availabilityId" IS DISTINCT FROM OLD."availabilityId"
      OR NEW."actingReasonCode" IS DISTINCT FROM OLD."actingReasonCode"
      OR NEW."reasonDetail" IS DISTINCT FROM OLD."reasonDetail"
      OR NEW."temporaryBasis" IS DISTINCT FROM OLD."temporaryBasis"
      OR NEW."commandScope" IS DISTINCT FROM OLD."commandScope"
      OR NEW."effectiveFrom" IS DISTINCT FROM OLD."effectiveFrom"
      OR NEW."expiresAt" IS DISTINCT FROM OLD."expiresAt"
      OR NEW."recordVersion" IS DISTINCT FROM OLD."recordVersion"
      OR NEW."supersedesId" IS DISTINCT FROM OLD."supersedesId"
      OR NEW."integrityDigest" IS DISTINCT FROM OLD."integrityDigest"
      OR NEW."evidenceReference" IS DISTINCT FROM OLD."evidenceReference"
      OR NEW."evidenceContentHash" IS DISTINCT FROM OLD."evidenceContentHash") THEN
    RAISE EXCEPTION 'Substitute authority record is immutable apart from lifecycle status' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "AuthenticatedIdentity_preserve_identifier"
BEFORE UPDATE ON "AuthenticatedIdentity"
FOR EACH ROW EXECUTE FUNCTION "p1_04_preserve_immutable_columns"();

CREATE TRIGGER "School_preserve_identifiers"
BEFORE UPDATE ON "School"
FOR EACH ROW EXECUTE FUNCTION "p1_04_preserve_immutable_columns"();

CREATE TRIGGER "ApprovedMembership_preserve_scope"
BEFORE UPDATE ON "ApprovedMembership"
FOR EACH ROW EXECUTE FUNCTION "p1_04_preserve_immutable_columns"();

CREATE TRIGGER "SchoolRoleAssignment_preserve_scope"
BEFORE UPDATE ON "SchoolRoleAssignment"
FOR EACH ROW EXECUTE FUNCTION "p1_04_preserve_immutable_columns"();

CREATE TRIGGER "FiscalYear_preserve_boundaries"
BEFORE UPDATE ON "FiscalYear"
FOR EACH ROW EXECUTE FUNCTION "p1_04_preserve_immutable_columns"();

CREATE TRIGGER "ActiveDirectorAvailability_preserve_scope"
BEFORE UPDATE ON "ActiveDirectorAvailability"
FOR EACH ROW EXECUTE FUNCTION "p1_04_preserve_immutable_columns"();

CREATE TRIGGER "SubstituteDirectorAuthority_preserve_record"
BEFORE UPDATE ON "SubstituteDirectorAuthority"
FOR EACH ROW EXECUTE FUNCTION "p1_04_preserve_immutable_columns"();

CREATE TRIGGER "Organization_prevent_delete"
BEFORE DELETE ON "Organization"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "School_prevent_delete"
BEFORE DELETE ON "School"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "AuthenticatedIdentity_prevent_delete"
BEFORE DELETE ON "AuthenticatedIdentity"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "ApprovedMembership_prevent_delete"
BEFORE DELETE ON "ApprovedMembership"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "SchoolRoleAssignment_prevent_delete"
BEFORE DELETE ON "SchoolRoleAssignment"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "FiscalYear_prevent_delete"
BEFORE DELETE ON "FiscalYear"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "ActiveDirectorAvailability_prevent_delete"
BEFORE DELETE ON "ActiveDirectorAvailability"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "SubstituteDirectorAuthority_prevent_delete"
BEFORE DELETE ON "SubstituteDirectorAuthority"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "SubstituteDirectorAuthorityLifecycle_prevent_update"
BEFORE UPDATE ON "SubstituteDirectorAuthorityLifecycle"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();

CREATE TRIGGER "SubstituteDirectorAuthorityLifecycle_prevent_delete"
BEFORE DELETE ON "SubstituteDirectorAuthorityLifecycle"
FOR EACH ROW EXECUTE FUNCTION "p1_04_prevent_history_delete"();
