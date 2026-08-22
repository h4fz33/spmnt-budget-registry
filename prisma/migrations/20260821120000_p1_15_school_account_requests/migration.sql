-- P1-15: synthetic School Admin-submitted Finance Officer account requests.

CREATE TYPE "SchoolAccountRequestStatus" AS ENUM (
  'SUBMITTED',
  'PENDING_ESAO_REVIEW',
  'NEEDS_CORRECTION',
  'RESUBMITTED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TYPE "SchoolAccountRequestAction" AS ENUM (
  'SUBMIT',
  'PENDING_REVIEW',
  'REQUEST_CORRECTION',
  'RESUBMIT',
  'APPROVE',
  'REJECT',
  'WITHDRAW'
);

CREATE TYPE "SchoolAccountRequestVerificationOutcome" AS ENUM (
  'VERIFIED',
  'NEEDS_CORRECTION',
  'NOT_VERIFIED'
);

CREATE TABLE "SchoolAccountRequest" (
    "id" UUID NOT NULL,
    "requesterIdentityId" UUID NOT NULL,
    "requesterMembershipId" UUID NOT NULL,
    "targetIdentityId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "requestedRole" "SchoolRole" NOT NULL DEFAULT 'FINANCE_OFFICER',
    "targetAccountIdentifier" VARCHAR(320) NOT NULL,
    "targetDisplayName" VARCHAR(200) NOT NULL,
    "submissionReasonCode" VARCHAR(64) NOT NULL,
    "submissionReasonDetail" VARCHAR(2000) NOT NULL,
    "status" "SchoolAccountRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "lastReasonCode" VARCHAR(64) NOT NULL,
    "lastReasonDetail" VARCHAR(2000) NOT NULL,
    "verificationOutcome" "SchoolAccountRequestVerificationOutcome",
    "verificationReference" VARCHAR(512),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingReviewAt" TIMESTAMP(3),
    "terminalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAccountRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SchoolAccountRequest_role_check" CHECK ("requestedRole" = 'FINANCE_OFFICER'),
    CONSTRAINT "SchoolAccountRequest_target_distinct_check" CHECK ("targetIdentityId" <> "requesterIdentityId"),
    CONSTRAINT "SchoolAccountRequest_account_check" CHECK (
      "targetAccountIdentifier" = lower(btrim("targetAccountIdentifier"))
      AND "targetAccountIdentifier" ~ '^[^@[:space:]]+@synthetic[.]test$'
    ),
    CONSTRAINT "SchoolAccountRequest_text_check" CHECK (
      length(trim("targetDisplayName")) > 0
      AND length(trim("submissionReasonCode")) > 0
      AND length(trim("submissionReasonDetail")) > 0
      AND length(trim("lastReasonCode")) > 0
      AND length(trim("lastReasonDetail")) > 0
    ),
    CONSTRAINT "SchoolAccountRequest_revision_check" CHECK ("revision" > 0),
    CONSTRAINT "SchoolAccountRequest_verification_check" CHECK (
      ("verificationOutcome" IS NULL AND "verificationReference" IS NULL)
      OR ("verificationOutcome" IS NOT NULL AND "verificationReference" IS NOT NULL AND length(trim("verificationReference")) > 0)
    ),
    CONSTRAINT "SchoolAccountRequest_status_shape_check" CHECK (
      (("status" = 'SUBMITTED' AND "pendingReviewAt" IS NULL AND "terminalAt" IS NULL AND "verificationOutcome" IS NULL)
      OR ("status" = 'PENDING_ESAO_REVIEW' AND "pendingReviewAt" IS NOT NULL AND "terminalAt" IS NULL AND "verificationOutcome" IS NULL)
      OR ("status" = 'NEEDS_CORRECTION' AND "pendingReviewAt" IS NOT NULL AND "terminalAt" IS NULL AND "verificationOutcome" IS NOT NULL)
      OR ("status" = 'RESUBMITTED' AND "pendingReviewAt" IS NOT NULL AND "terminalAt" IS NULL AND "verificationOutcome" IS NULL)
      OR ("status" IN ('APPROVED', 'REJECTED') AND "terminalAt" IS NOT NULL AND "verificationOutcome" IS NOT NULL)
      OR ("status" = 'WITHDRAWN' AND "terminalAt" IS NOT NULL AND "verificationOutcome" IS NULL))
    )
);

CREATE INDEX "SchoolAccountRequest_schoolId_status_updatedAt_idx"
  ON "SchoolAccountRequest"("schoolId", "status", "updatedAt");
CREATE INDEX "SchoolAccountRequest_requesterIdentityId_schoolId_status_idx"
  ON "SchoolAccountRequest"("requesterIdentityId", "schoolId", "status");
CREATE INDEX "SchoolAccountRequest_targetIdentityId_status_idx"
  ON "SchoolAccountRequest"("targetIdentityId", "status");
CREATE UNIQUE INDEX "SchoolAccountRequest_targetAccountIdentifier_nonterminal_key"
  ON "SchoolAccountRequest"("targetAccountIdentifier")
  WHERE "status" NOT IN ('APPROVED', 'REJECTED', 'WITHDRAWN');
CREATE UNIQUE INDEX "SchoolAccountRequest_targetIdentityId_nonterminal_key"
  ON "SchoolAccountRequest"("targetIdentityId")
  WHERE "status" NOT IN ('APPROVED', 'REJECTED', 'WITHDRAWN');

ALTER TABLE "SchoolAccountRequest"
  ADD CONSTRAINT "SchoolAccountRequest_requesterIdentityId_fkey"
    FOREIGN KEY ("requesterIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequest_requesterMembershipId_schoolId_fkey"
    FOREIGN KEY ("requesterMembershipId", "schoolId") REFERENCES "ApprovedMembership"("id", "organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequest_targetIdentityId_fkey"
    FOREIGN KEY ("targetIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequest_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "SchoolAccountRequestHistory" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "action" "SchoolAccountRequestAction" NOT NULL,
    "commandCode" VARCHAR(64) NOT NULL,
    "fromStatus" "SchoolAccountRequestStatus",
    "toStatus" "SchoolAccountRequestStatus" NOT NULL,
    "actorIdentityId" UUID NOT NULL,
    "actorMembershipId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "targetIdentityId" UUID NOT NULL,
    "targetAccountIdentifier" VARCHAR(320) NOT NULL,
    "targetDisplayName" VARCHAR(200) NOT NULL,
    "requestedRole" "SchoolRole" NOT NULL DEFAULT 'FINANCE_OFFICER',
    "reasonCode" VARCHAR(64) NOT NULL,
    "reasonDetail" VARCHAR(2000) NOT NULL,
    "verificationOutcome" "SchoolAccountRequestVerificationOutcome",
    "verificationReference" VARCHAR(512),
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "integrityDigest" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAccountRequestHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SchoolAccountRequestHistory_requestId_revision_key" UNIQUE ("requestId", "revision"),
    CONSTRAINT "SchoolAccountRequestHistory_integrityDigest_key" UNIQUE ("integrityDigest"),
    CONSTRAINT "SchoolAccountRequestHistory_role_check" CHECK ("requestedRole" = 'FINANCE_OFFICER'),
    CONSTRAINT "SchoolAccountRequestHistory_account_check" CHECK (
      "targetAccountIdentifier" = lower(btrim("targetAccountIdentifier"))
      AND "targetAccountIdentifier" ~ '^[^@[:space:]]+@synthetic[.]test$'
    ),
    CONSTRAINT "SchoolAccountRequestHistory_text_check" CHECK (
      length(trim("targetDisplayName")) > 0
      AND length(trim("reasonCode")) > 0
      AND length(trim("reasonDetail")) > 0
      AND "commandCode" IN ('AUTH-01', 'AUTH-03')
    ),
    CONSTRAINT "SchoolAccountRequestHistory_revision_check" CHECK ("revision" > 0),
    CONSTRAINT "SchoolAccountRequestHistory_verification_check" CHECK (
      ("verificationOutcome" IS NULL AND "verificationReference" IS NULL)
      OR ("verificationOutcome" IS NOT NULL AND "verificationReference" IS NOT NULL AND length(trim("verificationReference")) > 0)
    )
);

CREATE INDEX "SchoolAccountRequestHistory_requestId_occurredAt_idx"
  ON "SchoolAccountRequestHistory"("requestId", "occurredAt");
CREATE INDEX "SchoolAccountRequestHistory_actorIdentityId_occurredAt_idx"
  ON "SchoolAccountRequestHistory"("actorIdentityId", "occurredAt");

ALTER TABLE "SchoolAccountRequestHistory"
  ADD CONSTRAINT "SchoolAccountRequestHistory_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "SchoolAccountRequest"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequestHistory_actorIdentityId_fkey"
    FOREIGN KEY ("actorIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequestHistory_actorMembershipId_fkey"
    FOREIGN KEY ("actorMembershipId") REFERENCES "ApprovedMembership"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequestHistory_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequestHistory_targetIdentityId_fkey"
    FOREIGN KEY ("targetIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "SchoolAccountRequestRateLimit" (
    "requesterIdentityId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAccountRequestRateLimit_pkey" PRIMARY KEY ("requesterIdentityId", "schoolId"),
    CONSTRAINT "SchoolAccountRequestRateLimit_attempt_check" CHECK ("attemptCount" >= 0 AND "attemptCount" <= 1000)
);

CREATE INDEX "SchoolAccountRequestRateLimit_schoolId_windowStartedAt_idx"
  ON "SchoolAccountRequestRateLimit"("schoolId", "windowStartedAt");

ALTER TABLE "SchoolAccountRequestRateLimit"
  ADD CONSTRAINT "SchoolAccountRequestRateLimit_requesterIdentityId_fkey"
    FOREIGN KEY ("requesterIdentityId") REFERENCES "AuthenticatedIdentity"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "SchoolAccountRequestRateLimit_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_15_prevent_school_account_request_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW."status" <> 'SUBMITTED' OR NEW."revision" <> 1 OR NEW."pendingReviewAt" IS NOT NULL OR NEW."terminalAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'P1-15 requests must begin in SUBMITTED state' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'P1-15 School Account Requests are immutable history records' USING ERRCODE = '55000';
  END IF;

  IF NEW."id" IS DISTINCT FROM OLD."id"
     OR NEW."requesterIdentityId" IS DISTINCT FROM OLD."requesterIdentityId"
     OR NEW."requesterMembershipId" IS DISTINCT FROM OLD."requesterMembershipId"
     OR NEW."targetIdentityId" IS DISTINCT FROM OLD."targetIdentityId"
     OR NEW."schoolId" IS DISTINCT FROM OLD."schoolId"
     OR NEW."requestedRole" IS DISTINCT FROM OLD."requestedRole"
     OR NEW."targetAccountIdentifier" IS DISTINCT FROM OLD."targetAccountIdentifier"
     OR NEW."submittedAt" IS DISTINCT FROM OLD."submittedAt"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
     OR NEW."revision" <> OLD."revision" + 1 THEN
    RAISE EXCEPTION 'P1-15 request scope and identity fields are immutable' USING ERRCODE = '23514';
  END IF;

  IF NOT (
    (OLD."status" = 'SUBMITTED' AND NEW."status" = 'PENDING_ESAO_REVIEW')
    OR (OLD."status" = 'PENDING_ESAO_REVIEW' AND NEW."status" IN ('NEEDS_CORRECTION', 'APPROVED', 'REJECTED', 'WITHDRAWN'))
    OR (OLD."status" = 'NEEDS_CORRECTION' AND NEW."status" IN ('RESUBMITTED', 'WITHDRAWN'))
    OR (OLD."status" = 'RESUBMITTED' AND NEW."status" IN ('NEEDS_CORRECTION', 'APPROVED', 'REJECTED', 'WITHDRAWN'))
  ) THEN
    RAISE EXCEPTION 'P1-15 request lifecycle transition is invalid' USING ERRCODE = '23514';
  END IF;

  IF NEW."targetDisplayName" IS DISTINCT FROM OLD."targetDisplayName"
     AND NOT (OLD."status" = 'NEEDS_CORRECTION' AND NEW."status" = 'RESUBMITTED') THEN
    RAISE EXCEPTION 'P1-15 target display name may change only during resubmission' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "SchoolAccountRequest_prevent_mutation"
BEFORE INSERT OR UPDATE OR DELETE ON "SchoolAccountRequest"
FOR EACH ROW EXECUTE FUNCTION "p1_15_prevent_school_account_request_mutation"();

CREATE OR REPLACE FUNCTION "p1_15_prevent_school_account_request_history_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'P1-15 request lifecycle history is append-only' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "SchoolAccountRequestHistory_prevent_mutation"
BEFORE UPDATE OR DELETE ON "SchoolAccountRequestHistory"
FOR EACH ROW EXECUTE FUNCTION "p1_15_prevent_school_account_request_history_mutation"();

CREATE OR REPLACE FUNCTION "p1_15_assert_school_account_request_history"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  request_row "SchoolAccountRequest";
  expected_organization UUID;
  expected_correlation TEXT;
BEGIN
  SELECT * INTO request_row FROM "SchoolAccountRequest" WHERE "id" = NEW."requestId";
  IF request_row."id" IS NULL THEN
    RAISE EXCEPTION 'P1-15 lifecycle history requires a request' USING ERRCODE = '23514';
  END IF;

  IF NEW."schoolId" <> request_row."schoolId"
     OR NEW."targetIdentityId" <> request_row."targetIdentityId"
     OR NEW."targetAccountIdentifier" <> request_row."targetAccountIdentifier"
     OR NEW."requestedRole" <> request_row."requestedRole" THEN
    RAISE EXCEPTION 'P1-15 lifecycle history snapshot does not match request scope' USING ERRCODE = '23514';
  END IF;

  IF NEW."action" = 'SUBMIT' AND (NEW."fromStatus" IS NOT NULL OR NEW."toStatus" <> 'SUBMITTED') THEN
    RAISE EXCEPTION 'P1-15 submit history shape is invalid' USING ERRCODE = '23514';
  ELSIF NEW."action" = 'PENDING_REVIEW' AND (NEW."fromStatus" <> 'SUBMITTED' OR NEW."toStatus" <> 'PENDING_ESAO_REVIEW') THEN
    RAISE EXCEPTION 'P1-15 pending-review history shape is invalid' USING ERRCODE = '23514';
  ELSIF NEW."action" = 'REQUEST_CORRECTION' AND (NEW."fromStatus" NOT IN ('PENDING_ESAO_REVIEW', 'RESUBMITTED') OR NEW."toStatus" <> 'NEEDS_CORRECTION') THEN
    RAISE EXCEPTION 'P1-15 correction history shape is invalid' USING ERRCODE = '23514';
  ELSIF NEW."action" = 'RESUBMIT' AND (NEW."fromStatus" <> 'NEEDS_CORRECTION' OR NEW."toStatus" <> 'RESUBMITTED') THEN
    RAISE EXCEPTION 'P1-15 resubmission history shape is invalid' USING ERRCODE = '23514';
  ELSIF NEW."action" = 'APPROVE' AND (NEW."fromStatus" NOT IN ('PENDING_ESAO_REVIEW', 'RESUBMITTED') OR NEW."toStatus" <> 'APPROVED') THEN
    RAISE EXCEPTION 'P1-15 approval history shape is invalid' USING ERRCODE = '23514';
  ELSIF NEW."action" = 'REJECT' AND (NEW."fromStatus" NOT IN ('PENDING_ESAO_REVIEW', 'RESUBMITTED') OR NEW."toStatus" <> 'REJECTED') THEN
    RAISE EXCEPTION 'P1-15 rejection history shape is invalid' USING ERRCODE = '23514';
  ELSIF NEW."action" = 'WITHDRAW' AND (NEW."fromStatus" NOT IN ('PENDING_ESAO_REVIEW', 'NEEDS_CORRECTION', 'RESUBMITTED') OR NEW."toStatus" <> 'WITHDRAWN') THEN
    RAISE EXCEPTION 'P1-15 withdrawal history shape is invalid' USING ERRCODE = '23514';
  END IF;

  SELECT "parentOrganizationId" INTO expected_organization
  FROM "Organization" WHERE "id" = NEW."schoolId";
  expected_correlation := NEW."requestId"::TEXT || ':' || NEW."revision"::TEXT;
  IF NOT EXISTS (
    SELECT 1
    FROM "AuditLog" audit
    WHERE audit."commandCode" = NEW."commandCode"
      AND audit."targetType" = 'SchoolAccountRequest'
      AND audit."targetId" = NEW."requestId"::TEXT
      AND audit."actorIdentityId" = NEW."actorIdentityId"
      AND audit."actorMembershipId" = NEW."actorMembershipId"
      AND audit."outcome" = 'SUCCESS'
      AND audit."correlationId" = expected_correlation
      AND (
        (NEW."commandCode" = 'AUTH-01' AND audit."scopeKind" = 'SCHOOL' AND audit."scopeOrganizationId" = NEW."schoolId" AND audit."scopeSchoolId" = NEW."schoolId")
        OR (NEW."commandCode" = 'AUTH-03' AND audit."scopeKind" = 'ORGANIZATION' AND audit."scopeOrganizationId" = expected_organization)
      )
  ) THEN
    RAISE EXCEPTION 'P1-15 lifecycle transition requires matching audit evidence' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "SchoolAccountRequestHistory_assert_shape"
AFTER INSERT ON "SchoolAccountRequestHistory"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_15_assert_school_account_request_history"();

CREATE OR REPLACE FUNCTION "p1_15_assert_school_account_request"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_status "AccountStatus";
  target_hash VARCHAR(60);
  target_password_changed TIMESTAMP(3);
  target_memberships INTEGER;
  target_roles INTEGER;
BEGIN
  SELECT "accountStatus", "passwordHash", "passwordChangedAt",
         (SELECT count(*) FROM "ApprovedMembership" membership WHERE membership."identityId" = NEW."targetIdentityId"),
         (SELECT count(*) FROM "SchoolRoleAssignment" assignment
          JOIN "ApprovedMembership" membership ON membership."id" = assignment."membershipId"
          WHERE membership."identityId" = NEW."targetIdentityId")
    INTO target_status, target_hash, target_password_changed, target_memberships, target_roles
    FROM "AuthenticatedIdentity" WHERE "id" = NEW."targetIdentityId";

  IF target_status IS NULL THEN
    RAISE EXCEPTION 'P1-15 target identity is missing' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "SchoolAccountRequestHistory" history
    WHERE history."requestId" = NEW."id"
      AND history."revision" = NEW."revision"
  ) THEN
    RAISE EXCEPTION 'P1-15 request revision requires matching immutable history' USING ERRCODE = '23514';
  END IF;

  IF NEW."status" = 'APPROVED' THEN
    IF target_status <> 'ACTIVE' OR target_hash IS NOT NULL OR target_password_changed IS NOT NULL
       OR target_memberships <> 1 OR target_roles <> 1
       OR NOT EXISTS (
         SELECT 1
         FROM "ApprovedMembership" membership
         JOIN "SchoolRoleAssignment" assignment ON assignment."membershipId" = membership."id" AND assignment."schoolId" = NEW."schoolId"
         WHERE membership."identityId" = NEW."targetIdentityId"
           AND membership."organizationId" = NEW."schoolId"
           AND membership."status" = 'ACTIVE'
           AND assignment."role" = 'FINANCE_OFFICER'
           AND assignment."status" = 'ACTIVE'
       ) THEN
      RAISE EXCEPTION 'P1-15 approval requires one active credential-free Finance Officer membership' USING ERRCODE = '23514';
    END IF;
  ELSIF target_status <> 'PENDING' OR target_hash IS NOT NULL OR target_password_changed IS NOT NULL OR target_memberships <> 0 OR target_roles <> 0 THEN
    RAISE EXCEPTION 'P1-15 non-approved request target must remain pending and membership-free' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "SchoolAccountRequest_assert_shape"
AFTER INSERT OR UPDATE ON "SchoolAccountRequest"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_15_assert_school_account_request"();
