-- This follows the enum addition in its own migration because PostgreSQL does
-- not permit a newly added enum value in constraints until after commit.

ALTER TABLE "OutboxDeliveryAttempt"
  DROP CONSTRAINT "OutboxDeliveryAttempt_outcome_shape_check";

ALTER TABLE "OutboxDeliveryAttempt"
  ADD CONSTRAINT "OutboxDeliveryAttempt_outcome_shape_check" CHECK (
    ("outcome" = 'ABANDONED' AND "failureCode" = 'LEASE_EXPIRED' AND "nextAvailableAt" IS NULL)
    OR ("outcome" = 'DELIVERED' AND "failureCode" IS NULL AND "nextAvailableAt" IS NULL)
    OR ("outcome" = 'RETRY_SCHEDULED' AND "failureCode" IS NOT NULL AND "nextAvailableAt" IS NOT NULL)
    OR ("outcome" = 'DEAD_LETTERED' AND "failureCode" IS NOT NULL AND "nextAvailableAt" IS NULL)
  );

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
    AND OLD."leaseExpiresAt" <= NEW."leasedAt"
    AND NEW."deliveryAttempts" = OLD."deliveryAttempts" + 1 THEN
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

CREATE OR REPLACE FUNCTION "p1_09_assert_outbox_abandoned_lease_attempt"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."status" = 'PROCESSING' AND NEW."status" = 'PROCESSING'
    AND OLD."leaseExpiresAt" <= NEW."leasedAt" THEN
    IF NOT EXISTS (
      SELECT 1
      FROM "OutboxDeliveryAttempt"
      WHERE "messageId" = NEW."id"
        AND "attemptNumber" = NEW."deliveryAttempts"
        AND "workerId" = OLD."leaseOwner"
        AND "outcome" = 'ABANDONED'
        AND "failureCode" = 'LEASE_EXPIRED'
        AND "nextAvailableAt" IS NULL
    ) THEN
      RAISE EXCEPTION 'Expired outbox lease reclaim requires an immutable abandoned attempt'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "OutboxMessage_assert_abandoned_lease_attempt"
AFTER UPDATE ON "OutboxMessage"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_09_assert_outbox_abandoned_lease_attempt"();

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

  IF NEW."outcome" = 'ABANDONED'
    AND (message_status <> 'PROCESSING' OR NEW."failureCode" <> 'LEASE_EXPIRED' OR NEW."nextAvailableAt" IS NOT NULL) THEN
    RAISE EXCEPTION 'Abandoned lease attempt requires a reclaimed processing outbox message'
      USING ERRCODE = '23514';
  ELSIF NEW."outcome" = 'DELIVERED' AND message_status <> 'DELIVERED' THEN
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
