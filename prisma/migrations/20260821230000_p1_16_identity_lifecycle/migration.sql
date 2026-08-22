-- P1-16: controlled credential operations and ESAO-approved recovery.

CREATE TYPE "CredentialOperationType" AS ENUM ('ACTIVATION', 'RECOVERY');
CREATE TYPE "CredentialOperationStatus" AS ENUM ('ISSUED', 'CONSUMED', 'EXPIRED', 'REVOKED');
CREATE TYPE "CredentialRecoveryApprovalStatus" AS ENUM ('APPROVED', 'CONSUMED', 'REVOKED');

CREATE TABLE "CredentialRecoveryApproval" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "approvedByIdentityId" UUID NOT NULL,
    "approvedByMembershipId" UUID NOT NULL,
    "status" "CredentialRecoveryApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "reasonCode" VARCHAR(64) NOT NULL,
    "reasonDetail" VARCHAR(2000) NOT NULL,
    "approvalReference" VARCHAR(512) NOT NULL,
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "CredentialRecoveryApproval_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CredentialRecoveryApproval_integrity_check" CHECK ("integrityDigest" ~ '^[0-9A-Fa-f]{64}$'),
    CONSTRAINT "CredentialRecoveryApproval_text_check" CHECK (
      length(btrim("reasonCode")) > 0
      AND length(btrim("reasonDetail")) > 0
      AND length(btrim("approvalReference")) > 0
    ),
    CONSTRAINT "CredentialRecoveryApproval_status_shape_check" CHECK (
      ("status" = 'APPROVED' AND "consumedAt" IS NULL)
      OR ("status" = 'CONSUMED' AND "consumedAt" IS NOT NULL)
      OR ("status" = 'REVOKED' AND "consumedAt" IS NULL)
    )
);

CREATE TABLE "CredentialOperation" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "operationType" "CredentialOperationType" NOT NULL,
    "status" "CredentialOperationStatus" NOT NULL DEFAULT 'ISSUED',
    "tokenHash" CHAR(64) NOT NULL,
    "issuedByIdentityId" UUID NOT NULL,
    "recoveryApprovalId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredentialOperation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CredentialOperation_tokenHash_key" UNIQUE ("tokenHash"),
    CONSTRAINT "CredentialOperation_token_hash_check" CHECK ("tokenHash" ~ '^[0-9A-Fa-f]{64}$'),
    CONSTRAINT "CredentialOperation_expiry_check" CHECK ("expiresAt" > "createdAt"),
    CONSTRAINT "CredentialOperation_recovery_shape_check" CHECK (
      ("operationType" = 'ACTIVATION' AND "recoveryApprovalId" IS NULL)
      OR ("operationType" = 'RECOVERY' AND "recoveryApprovalId" IS NOT NULL)
    ),
    CONSTRAINT "CredentialOperation_status_shape_check" CHECK (
      ("status" = 'ISSUED' AND "consumedAt" IS NULL)
      OR ("status" = 'CONSUMED' AND "consumedAt" IS NOT NULL)
      OR ("status" IN ('EXPIRED', 'REVOKED') AND "consumedAt" IS NULL)
    )
);

CREATE INDEX "CredentialRecoveryApproval_identityId_status_createdAt_idx"
  ON "CredentialRecoveryApproval"("identityId", "status", "createdAt");
CREATE INDEX "CredentialOperation_identityId_operationType_status_expiresAt_idx"
  ON "CredentialOperation"("identityId", "operationType", "status", "expiresAt");

ALTER TABLE "CredentialRecoveryApproval"
  ADD CONSTRAINT "CredentialRecoveryApproval_identityId_fkey"
    FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "CredentialRecoveryApproval_approvedByIdentityId_fkey"
    FOREIGN KEY ("approvedByIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "CredentialRecoveryApproval_approvedByMembershipId_fkey"
    FOREIGN KEY ("approvedByMembershipId") REFERENCES "ApprovedMembership"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "CredentialOperation"
  ADD CONSTRAINT "CredentialOperation_identityId_fkey"
    FOREIGN KEY ("identityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "CredentialOperation_issuedByIdentityId_fkey"
    FOREIGN KEY ("issuedByIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "CredentialOperation_recoveryApprovalId_fkey"
    FOREIGN KEY ("recoveryApprovalId") REFERENCES "CredentialRecoveryApproval"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_16_prevent_credential_recovery_approval_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'P1-16 recovery approvals are immutable history records' USING ERRCODE = '55000';
  END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id"
     OR NEW."identityId" IS DISTINCT FROM OLD."identityId"
     OR NEW."approvedByIdentityId" IS DISTINCT FROM OLD."approvedByIdentityId"
     OR NEW."approvedByMembershipId" IS DISTINCT FROM OLD."approvedByMembershipId"
     OR NEW."reasonCode" IS DISTINCT FROM OLD."reasonCode"
     OR NEW."reasonDetail" IS DISTINCT FROM OLD."reasonDetail"
     OR NEW."approvalReference" IS DISTINCT FROM OLD."approvalReference"
     OR NEW."integrityDigest" IS DISTINCT FROM OLD."integrityDigest"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'P1-16 recovery approval scope is immutable' USING ERRCODE = '23514';
  END IF;
  IF NOT ((OLD."status" = 'APPROVED' AND NEW."status" IN ('CONSUMED', 'REVOKED')) OR OLD."status" = NEW."status") THEN
    RAISE EXCEPTION 'P1-16 recovery approval lifecycle transition is invalid' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "CredentialRecoveryApproval_prevent_mutation"
BEFORE UPDATE OR DELETE ON "CredentialRecoveryApproval"
FOR EACH ROW EXECUTE FUNCTION "p1_16_prevent_credential_recovery_approval_mutation"();

CREATE OR REPLACE FUNCTION "p1_16_prevent_credential_operation_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'P1-16 credential operations are immutable history records' USING ERRCODE = '55000';
  END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id"
     OR NEW."identityId" IS DISTINCT FROM OLD."identityId"
     OR NEW."operationType" IS DISTINCT FROM OLD."operationType"
     OR NEW."tokenHash" IS DISTINCT FROM OLD."tokenHash"
     OR NEW."issuedByIdentityId" IS DISTINCT FROM OLD."issuedByIdentityId"
     OR NEW."recoveryApprovalId" IS DISTINCT FROM OLD."recoveryApprovalId"
     OR NEW."expiresAt" IS DISTINCT FROM OLD."expiresAt"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'P1-16 credential operation scope is immutable' USING ERRCODE = '23514';
  END IF;
  IF NOT ((OLD."status" = 'ISSUED' AND NEW."status" IN ('CONSUMED', 'EXPIRED', 'REVOKED')) OR OLD."status" = NEW."status") THEN
    RAISE EXCEPTION 'P1-16 credential operation lifecycle transition is invalid' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "CredentialOperation_prevent_mutation"
BEFORE UPDATE OR DELETE ON "CredentialOperation"
FOR EACH ROW EXECUTE FUNCTION "p1_16_prevent_credential_operation_mutation"();
