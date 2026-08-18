-- AlterTable
ALTER TABLE "AuthenticatedIdentity" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" VARCHAR(60);

ALTER TABLE "AuthenticatedIdentity"
  ADD CONSTRAINT "AuthenticatedIdentity_password_shape_check"
  CHECK (
    ("passwordHash" IS NULL AND "passwordChangedAt" IS NULL)
    OR (
      "passwordHash" ~ E'^\\$2[aby]\\$10\\$[./A-Za-z0-9]{53}$'
      AND "passwordChangedAt" IS NOT NULL
    )
  );

CREATE OR REPLACE FUNCTION "p1_05_assert_identity_security_change"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."authorizationVersion" < OLD."authorizationVersion" THEN
    RAISE EXCEPTION 'Authorization version cannot decrease'
      USING ERRCODE = '23514';
  END IF;

  IF (
    NEW."accountStatus" IS DISTINCT FROM OLD."accountStatus"
    OR NEW."passwordHash" IS DISTINCT FROM OLD."passwordHash"
    OR NEW."passwordChangedAt" IS DISTINCT FROM OLD."passwordChangedAt"
  ) AND NEW."authorizationVersion" <= OLD."authorizationVersion" THEN
    RAISE EXCEPTION 'Account status and credential changes must invalidate existing authorization versions'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "AuthenticatedIdentity_assert_security_change_version"
BEFORE UPDATE ON "AuthenticatedIdentity"
FOR EACH ROW EXECUTE FUNCTION "p1_05_assert_identity_security_change"();
