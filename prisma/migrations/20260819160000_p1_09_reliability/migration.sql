-- P1-09: durable command replay and transactional-outbox infrastructure.
-- Every business command retains one successful response under an exact scoped
-- key. Notifications and long-running work leave the command transaction as
-- immutable outbox messages with leased, retry-safe delivery attempts.

CREATE TYPE "OutboxMessageStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'DEAD_LETTER');
CREATE TYPE "OutboxDeliveryOutcome" AS ENUM ('DELIVERED', 'RETRY_SCHEDULED', 'DEAD_LETTERED');

CREATE TABLE "CommandIdempotencyRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorIdentityId" UUID NOT NULL,
    "actorMembershipId" UUID NOT NULL,
    "scopeKind" "AuditScopeKind" NOT NULL,
    "scopeOrganizationId" UUID,
    "scopeSchoolId" UUID,
    "scopeKey" VARCHAR(160) NOT NULL,
    "commandCode" VARCHAR(64) NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "requestIntegrityDigest" CHAR(64) NOT NULL,
    "responseBody" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandIdempotencyRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommandIdempotencyRecord_scoped_key" UNIQUE ("actorIdentityId", "scopeKey", "commandCode", "idempotencyKey"),
    CONSTRAINT "CommandIdempotencyRecord_scope_shape_check" CHECK (
      ("scopeKind" = 'PLATFORM' AND "scopeOrganizationId" IS NULL AND "scopeSchoolId" IS NULL AND "scopeKey" = 'PLATFORM')
      OR ("scopeKind" = 'ORGANIZATION' AND "scopeOrganizationId" IS NOT NULL AND "scopeSchoolId" IS NULL AND "scopeKey" = 'ORGANIZATION:' || "scopeOrganizationId"::TEXT)
      OR ("scopeKind" = 'SCHOOL' AND "scopeOrganizationId" IS NOT NULL AND "scopeSchoolId" = "scopeOrganizationId" AND "scopeKey" = 'SCHOOL:' || "scopeSchoolId"::TEXT)
    ),
    CONSTRAINT "CommandIdempotencyRecord_command_code_check" CHECK (
      "commandCode" ~ '^[A-Z][A-Z0-9-]{2,63}$'
    ),
    CONSTRAINT "CommandIdempotencyRecord_key_check" CHECK (
      "idempotencyKey" ~ '^[A-Za-z0-9._:-]{8,128}$'
    ),
    CONSTRAINT "CommandIdempotencyRecord_request_digest_check" CHECK (
      "requestIntegrityDigest" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "CommandIdempotencyRecord_response_check" CHECK (
      jsonb_typeof("responseBody") IS NOT NULL
    )
);

ALTER TABLE "CommandIdempotencyRecord"
  ADD CONSTRAINT "CommandIdempotencyRecord_actorIdentityId_fkey"
  FOREIGN KEY ("actorIdentityId") REFERENCES "AuthenticatedIdentity"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "CommandIdempotencyRecord_actorMembershipId_fkey"
  FOREIGN KEY ("actorMembershipId") REFERENCES "ApprovedMembership"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "CommandIdempotencyRecord_scopeOrganizationId_fkey"
  FOREIGN KEY ("scopeOrganizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "CommandIdempotencyRecord_scopeSchoolId_fkey"
  FOREIGN KEY ("scopeSchoolId") REFERENCES "School"("organizationId")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE INDEX "CommandIdempotencyRecord_actorMembershipId_completedAt_idx"
  ON "CommandIdempotencyRecord" ("actorMembershipId", "completedAt");
CREATE INDEX "CommandIdempotencyRecord_scopeKey_completedAt_idx"
  ON "CommandIdempotencyRecord" ("scopeKey", "completedAt");

CREATE TABLE "OutboxMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "messageType" VARCHAR(64) NOT NULL,
    "aggregateType" VARCHAR(64) NOT NULL,
    "aggregateId" VARCHAR(128) NOT NULL,
    "payload" JSONB NOT NULL,
    "payloadIntegrityDigest" CHAR(64) NOT NULL,
    "deduplicationKey" VARCHAR(128) NOT NULL,
    "status" "OutboxMessageStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" VARCHAR(128),
    "leasedAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "deadLetteredAt" TIMESTAMP(3),
    "lastFailureCode" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OutboxMessage_deduplicationKey_key" UNIQUE ("deduplicationKey"),
    CONSTRAINT "OutboxMessage_message_type_check" CHECK (
      "messageType" ~ '^[A-Z][A-Z0-9._-]{2,63}$'
    ),
    CONSTRAINT "OutboxMessage_aggregate_type_check" CHECK (
      "aggregateType" ~ '^[A-Za-z][A-Za-z0-9._-]{0,63}$'
    ),
    CONSTRAINT "OutboxMessage_aggregate_id_check" CHECK (
      "aggregateId" ~ '^[A-Za-z0-9._:-]{1,128}$'
    ),
    CONSTRAINT "OutboxMessage_payload_digest_check" CHECK (
      "payloadIntegrityDigest" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "OutboxMessage_deduplication_key_check" CHECK (
      "deduplicationKey" ~ '^[A-Za-z0-9._:-]{8,128}$'
    ),
    CONSTRAINT "OutboxMessage_lease_owner_check" CHECK (
      "leaseOwner" IS NULL OR "leaseOwner" ~ '^[A-Za-z0-9._:-]{1,128}$'
    ),
    CONSTRAINT "OutboxMessage_failure_code_check" CHECK (
      "lastFailureCode" IS NULL OR "lastFailureCode" ~ '^[A-Z][A-Z0-9._:-]{1,127}$'
    ),
    CONSTRAINT "OutboxMessage_delivery_attempts_check" CHECK (
      "deliveryAttempts" >= 0
    ),
    CONSTRAINT "OutboxMessage_status_shape_check" CHECK (
      ("status" = 'PENDING' AND "leaseOwner" IS NULL AND "leasedAt" IS NULL AND "leaseExpiresAt" IS NULL AND "deliveredAt" IS NULL AND "deadLetteredAt" IS NULL)
      OR ("status" = 'PROCESSING' AND "leaseOwner" IS NOT NULL AND "leasedAt" IS NOT NULL AND "leaseExpiresAt" IS NOT NULL AND "leaseExpiresAt" > "leasedAt" AND "deliveredAt" IS NULL AND "deadLetteredAt" IS NULL)
      OR ("status" = 'DELIVERED' AND "leaseOwner" IS NULL AND "leasedAt" IS NULL AND "leaseExpiresAt" IS NULL AND "deliveredAt" IS NOT NULL AND "deadLetteredAt" IS NULL)
      OR ("status" = 'DEAD_LETTER' AND "leaseOwner" IS NULL AND "leasedAt" IS NULL AND "leaseExpiresAt" IS NULL AND "deliveredAt" IS NULL AND "deadLetteredAt" IS NOT NULL)
    )
);

CREATE INDEX "OutboxMessage_status_availableAt_leaseExpiresAt_idx"
  ON "OutboxMessage" ("status", "availableAt", "leaseExpiresAt");
CREATE INDEX "OutboxMessage_aggregateType_aggregateId_createdAt_idx"
  ON "OutboxMessage" ("aggregateType", "aggregateId", "createdAt");

CREATE TABLE "OutboxDeliveryAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "workerId" VARCHAR(128) NOT NULL,
    "outcome" "OutboxDeliveryOutcome" NOT NULL,
    "failureCode" VARCHAR(128),
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "nextAvailableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxDeliveryAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OutboxDeliveryAttempt_messageId_attemptNumber_key" UNIQUE ("messageId", "attemptNumber"),
    CONSTRAINT "OutboxDeliveryAttempt_number_check" CHECK ("attemptNumber" > 0),
    CONSTRAINT "OutboxDeliveryAttempt_worker_id_check" CHECK (
      "workerId" ~ '^[A-Za-z0-9._:-]{1,128}$'
    ),
    CONSTRAINT "OutboxDeliveryAttempt_failure_code_check" CHECK (
      "failureCode" IS NULL OR "failureCode" ~ '^[A-Z][A-Z0-9._:-]{1,127}$'
    ),
    CONSTRAINT "OutboxDeliveryAttempt_outcome_shape_check" CHECK (
      ("outcome" = 'DELIVERED' AND "failureCode" IS NULL AND "nextAvailableAt" IS NULL)
      OR ("outcome" = 'RETRY_SCHEDULED' AND "failureCode" IS NOT NULL AND "nextAvailableAt" IS NOT NULL)
      OR ("outcome" = 'DEAD_LETTERED' AND "failureCode" IS NOT NULL AND "nextAvailableAt" IS NULL)
    )
);

ALTER TABLE "OutboxDeliveryAttempt"
  ADD CONSTRAINT "OutboxDeliveryAttempt_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "OutboxMessage"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE INDEX "OutboxDeliveryAttempt_messageId_occurredAt_idx"
  ON "OutboxDeliveryAttempt" ("messageId", "occurredAt");

CREATE OR REPLACE FUNCTION "p1_09_assert_idempotency_record"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  membership_organization UUID;
  membership_organization_type "OrganizationType";
BEGIN
  SELECT membership."organizationId", organization."type"
  INTO membership_organization, membership_organization_type
  FROM "AuthenticatedIdentity" identity
  JOIN "ApprovedMembership" membership ON membership."id" = NEW."actorMembershipId"
  JOIN "Organization" organization ON organization."id" = membership."organizationId"
  WHERE identity."id" = NEW."actorIdentityId"
    AND membership."identityId" = identity."id"
    AND identity."accountStatus" = 'ACTIVE'
    AND membership."status" = 'ACTIVE'
    AND membership."effectiveFrom" <= NEW."completedAt"
    AND (membership."effectiveTo" IS NULL OR membership."effectiveTo" > NEW."completedAt");

  IF membership_organization IS NULL THEN
    RAISE EXCEPTION 'Idempotency record requires an active effective actor membership'
      USING ERRCODE = '42501';
  END IF;

  IF NEW."scopeKind" = 'PLATFORM' AND membership_organization_type <> 'PLATFORM' THEN
    RAISE EXCEPTION 'Platform idempotency scope requires a platform membership'
      USING ERRCODE = '42501';
  ELSIF NEW."scopeKind" = 'ORGANIZATION'
    AND membership_organization IS DISTINCT FROM NEW."scopeOrganizationId" THEN
    RAISE EXCEPTION 'Organization idempotency scope requires the exact membership organization'
      USING ERRCODE = '42501';
  ELSIF NEW."scopeKind" = 'SCHOOL'
    AND membership_organization IS DISTINCT FROM NEW."scopeSchoolId" THEN
    RAISE EXCEPTION 'School idempotency scope requires the exact School membership'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "CommandIdempotencyRecord_assert_scope"
BEFORE INSERT ON "CommandIdempotencyRecord"
FOR EACH ROW EXECUTE FUNCTION "p1_09_assert_idempotency_record"();

CREATE OR REPLACE FUNCTION "p1_09_prevent_idempotency_record_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Completed idempotency records are immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "CommandIdempotencyRecord_prevent_update"
BEFORE UPDATE ON "CommandIdempotencyRecord"
FOR EACH ROW EXECUTE FUNCTION "p1_09_prevent_idempotency_record_mutation"();
CREATE TRIGGER "CommandIdempotencyRecord_prevent_delete"
BEFORE DELETE ON "CommandIdempotencyRecord"
FOR EACH ROW EXECUTE FUNCTION "p1_09_prevent_idempotency_record_mutation"();

CREATE OR REPLACE FUNCTION "p1_09_assert_outbox_message_transition"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Outbox messages cannot be deleted'
      USING ERRCODE = '55000';
  END IF;

  IF NEW."messageType" IS DISTINCT FROM OLD."messageType"
    OR NEW."aggregateType" IS DISTINCT FROM OLD."aggregateType"
    OR NEW."aggregateId" IS DISTINCT FROM OLD."aggregateId"
    OR NEW."payload" IS DISTINCT FROM OLD."payload"
    OR NEW."payloadIntegrityDigest" IS DISTINCT FROM OLD."payloadIntegrityDigest"
    OR NEW."deduplicationKey" IS DISTINCT FROM OLD."deduplicationKey"
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'Outbox message identity and payload are immutable'
      USING ERRCODE = '55000';
  END IF;

  IF OLD."status" = 'PENDING' AND NEW."status" = 'PROCESSING'
    AND NEW."deliveryAttempts" = OLD."deliveryAttempts" THEN
    RETURN NEW;
  END IF;

  IF OLD."status" = 'PROCESSING' AND NEW."status" = 'PROCESSING'
    AND OLD."leaseExpiresAt" <= CURRENT_TIMESTAMP
    AND NEW."deliveryAttempts" = OLD."deliveryAttempts" THEN
    RETURN NEW;
  END IF;

  IF OLD."status" = 'PROCESSING'
    AND NEW."status" IN ('PENDING', 'DELIVERED', 'DEAD_LETTER')
    AND NEW."deliveryAttempts" = OLD."deliveryAttempts" + 1 THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Outbox messages may only be claimed once or completed from an active lease'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "OutboxMessage_assert_transition"
BEFORE UPDATE OR DELETE ON "OutboxMessage"
FOR EACH ROW EXECUTE FUNCTION "p1_09_assert_outbox_message_transition"();

CREATE OR REPLACE FUNCTION "p1_09_assert_outbox_delivery_attempt"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  message_status "OutboxMessageStatus";
  message_attempts INTEGER;
  message_available_at TIMESTAMP(3);
  message_failure_code TEXT;
BEGIN
  SELECT "status", "deliveryAttempts", "availableAt", "lastFailureCode"
  INTO message_status, message_attempts, message_available_at, message_failure_code
  FROM "OutboxMessage"
  WHERE "id" = NEW."messageId";

  IF message_attempts IS DISTINCT FROM NEW."attemptNumber" THEN
    RAISE EXCEPTION 'Outbox delivery attempt must match the message attempt counter'
      USING ERRCODE = '23514';
  END IF;

  IF NEW."outcome" = 'DELIVERED' AND message_status <> 'DELIVERED' THEN
    RAISE EXCEPTION 'Delivered attempt requires a delivered outbox message'
      USING ERRCODE = '23514';
  ELSIF NEW."outcome" = 'RETRY_SCHEDULED'
    AND (message_status <> 'PENDING' OR message_available_at IS DISTINCT FROM NEW."nextAvailableAt" OR message_failure_code IS DISTINCT FROM NEW."failureCode") THEN
    RAISE EXCEPTION 'Retry attempt must match its pending outbox message'
      USING ERRCODE = '23514';
  ELSIF NEW."outcome" = 'DEAD_LETTERED'
    AND (message_status <> 'DEAD_LETTER' OR message_failure_code IS DISTINCT FROM NEW."failureCode") THEN
    RAISE EXCEPTION 'Dead-letter attempt must match its outbox message'
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "OutboxDeliveryAttempt_assert_message_state"
AFTER INSERT ON "OutboxDeliveryAttempt"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_09_assert_outbox_delivery_attempt"();

CREATE OR REPLACE FUNCTION "p1_09_prevent_outbox_delivery_attempt_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Outbox delivery attempts are immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "OutboxDeliveryAttempt_prevent_update"
BEFORE UPDATE ON "OutboxDeliveryAttempt"
FOR EACH ROW EXECUTE FUNCTION "p1_09_prevent_outbox_delivery_attempt_mutation"();
CREATE TRIGGER "OutboxDeliveryAttempt_prevent_delete"
BEFORE DELETE ON "OutboxDeliveryAttempt"
FOR EACH ROW EXECUTE FUNCTION "p1_09_prevent_outbox_delivery_attempt_mutation"();

CREATE OR REPLACE FUNCTION "p1_09_prevent_reliability_truncate"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Reliability records cannot be truncated'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "CommandIdempotencyRecord_prevent_truncate"
BEFORE TRUNCATE ON "CommandIdempotencyRecord"
FOR EACH STATEMENT EXECUTE FUNCTION "p1_09_prevent_reliability_truncate"();
CREATE TRIGGER "OutboxMessage_prevent_truncate"
BEFORE TRUNCATE ON "OutboxMessage"
FOR EACH STATEMENT EXECUTE FUNCTION "p1_09_prevent_reliability_truncate"();
CREATE TRIGGER "OutboxDeliveryAttempt_prevent_truncate"
BEFORE TRUNCATE ON "OutboxDeliveryAttempt"
FOR EACH STATEMENT EXECUTE FUNCTION "p1_09_prevent_reliability_truncate"();
