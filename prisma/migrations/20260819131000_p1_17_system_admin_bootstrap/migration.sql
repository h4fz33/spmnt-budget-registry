-- P1-17: one sealed initial System Admin authority. The singleton exists only
-- after its active platform identity, membership, and immutable audit record
-- have been created in the same serializable transaction.

CREATE TABLE "SystemAdminBootstrap" (
    "id" TEXT NOT NULL DEFAULT 'p1-17',
    "identityId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "platformOrganizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAdminBootstrap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemAdminBootstrap_identityId_key" ON "SystemAdminBootstrap"("identityId");
CREATE UNIQUE INDEX "SystemAdminBootstrap_membershipId_key" ON "SystemAdminBootstrap"("membershipId");
CREATE UNIQUE INDEX "SystemAdminBootstrap_platformOrganizationId_key" ON "SystemAdminBootstrap"("platformOrganizationId");

ALTER TABLE "SystemAdminBootstrap"
  ADD CONSTRAINT "SystemAdminBootstrap_singleton_check"
  CHECK ("id" = 'p1-17');

ALTER TABLE "SystemAdminBootstrap"
  ADD CONSTRAINT "SystemAdminBootstrap_identityId_fkey"
  FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SystemAdminBootstrap_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "ApprovedMembership"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SystemAdminBootstrap_platformOrganizationId_fkey"
  FOREIGN KEY ("platformOrganizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_17_assert_system_admin_bootstrap"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "AuthenticatedIdentity" identity
    JOIN "ApprovedMembership" membership ON membership."id" = NEW."membershipId"
    JOIN "Organization" organization ON organization."id" = NEW."platformOrganizationId"
    WHERE identity."id" = NEW."identityId"
      AND membership."identityId" = identity."id"
      AND membership."organizationId" = organization."id"
      AND identity."accountStatus" = 'ACTIVE'
      AND identity."passwordHash" IS NOT NULL
      AND identity."passwordChangedAt" IS NOT NULL
      AND membership."status" = 'ACTIVE'
      AND membership."effectiveTo" IS NULL
      AND organization."type" = 'PLATFORM'
      AND organization."status" = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'System Admin bootstrap requires one active credentialed platform identity and membership'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "AuditLog" audit
    WHERE audit."actorIdentityId" = NEW."identityId"
      AND audit."actorMembershipId" = NEW."membershipId"
      AND audit."scopeKind" = 'PLATFORM'
      AND audit."commandCode" = 'AUTH-02'
      AND audit."targetType" = 'SystemAdminBootstrap'
      AND audit."targetId" = NEW."id"
      AND audit."outcome" = 'SUCCESS'
      AND audit."reasonCode" = 'INITIAL_SYSTEM_ADMIN_BOOTSTRAP'
  ) THEN
    RAISE EXCEPTION 'System Admin bootstrap requires matching immutable audit evidence'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "SystemAdminBootstrap_assert_shape"
BEFORE INSERT ON "SystemAdminBootstrap"
FOR EACH ROW EXECUTE FUNCTION "p1_17_assert_system_admin_bootstrap"();

CREATE OR REPLACE FUNCTION "p1_17_prevent_system_admin_bootstrap_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'System Admin bootstrap is immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "SystemAdminBootstrap_prevent_mutation"
BEFORE UPDATE OR DELETE ON "SystemAdminBootstrap"
FOR EACH ROW EXECUTE FUNCTION "p1_17_prevent_system_admin_bootstrap_mutation"();
