-- P1-10: durable, fiscal-year-bound scoped-number allocation.
-- Allocation is performed inside the caller's serializable transaction. The
-- sequence has no independent database sequence, so a rolled-back command
-- cannot leave a committed number gap.

CREATE TABLE "ScopedNumberSequence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "buddhistFiscalYear" INTEGER NOT NULL,
    "registerCode" VARCHAR(32) NOT NULL,
    "nextValue" BIGINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopedNumberSequence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ScopedNumberSequence_schoolId_buddhistFiscalYear_registerCode_key"
      UNIQUE ("schoolId", "buddhistFiscalYear", "registerCode"),
    CONSTRAINT "ScopedNumberSequence_register_code_check"
      CHECK ("registerCode" ~ '^[A-Z][A-Z0-9_]{0,31}$'),
    CONSTRAINT "ScopedNumberSequence_next_value_check"
      CHECK ("nextValue" >= 1 AND "nextValue" <= 9007199254740991)
);

CREATE INDEX "ScopedNumberSequence_schoolId_buddhistFiscalYear_idx"
  ON "ScopedNumberSequence" ("schoolId", "buddhistFiscalYear");

ALTER TABLE "ScopedNumberSequence"
  ADD CONSTRAINT "ScopedNumberSequence_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("organizationId")
  ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT "ScopedNumberSequence_fiscal_year_fkey"
  FOREIGN KEY ("schoolId", "buddhistFiscalYear") REFERENCES "FiscalYear"("schoolId", "buddhistYear")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "ScopedNumberAllocation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sequenceId" UUID NOT NULL,
    "value" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScopedNumberAllocation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ScopedNumberAllocation_sequenceId_value_key" UNIQUE ("sequenceId", "value"),
    CONSTRAINT "ScopedNumberAllocation_value_check"
      CHECK ("value" >= 1 AND "value" < 9007199254740991)
);

CREATE INDEX "ScopedNumberAllocation_sequenceId_createdAt_idx"
  ON "ScopedNumberAllocation" ("sequenceId", "createdAt");

ALTER TABLE "ScopedNumberAllocation"
  ADD CONSTRAINT "ScopedNumberAllocation_sequenceId_fkey"
  FOREIGN KEY ("sequenceId") REFERENCES "ScopedNumberSequence"("id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE OR REPLACE FUNCTION "p1_10_assert_scoped_number_sequence_transition"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Scoped number sequences cannot be deleted'
      USING ERRCODE = '55000';
  END IF;

  IF NEW."schoolId" IS DISTINCT FROM OLD."schoolId"
    OR NEW."buddhistFiscalYear" IS DISTINCT FROM OLD."buddhistFiscalYear"
    OR NEW."registerCode" IS DISTINCT FROM OLD."registerCode"
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'Scoped number sequence identity is immutable'
      USING ERRCODE = '55000';
  END IF;

  IF NEW."nextValue" <> OLD."nextValue" + 1 THEN
    RAISE EXCEPTION 'Scoped number sequences may advance by exactly one'
      USING ERRCODE = '55000';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "ScopedNumberSequence_assert_transition"
BEFORE UPDATE OR DELETE ON "ScopedNumberSequence"
FOR EACH ROW EXECUTE FUNCTION "p1_10_assert_scoped_number_sequence_transition"();

CREATE OR REPLACE FUNCTION "p1_10_prevent_scoped_number_allocation_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Scoped number allocations are immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "ScopedNumberAllocation_prevent_update"
BEFORE UPDATE ON "ScopedNumberAllocation"
FOR EACH ROW EXECUTE FUNCTION "p1_10_prevent_scoped_number_allocation_mutation"();
CREATE TRIGGER "ScopedNumberAllocation_prevent_delete"
BEFORE DELETE ON "ScopedNumberAllocation"
FOR EACH ROW EXECUTE FUNCTION "p1_10_prevent_scoped_number_allocation_mutation"();

-- This deferred assertion makes the append-only allocation ledger the source
-- of truth for nextValue. The allocator may advance and append in one caller
-- transaction, but direct writes cannot commit a gap or duplicate position.
CREATE OR REPLACE FUNCTION "p1_10_assert_scoped_numbering_consistency"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_sequence_id UUID;
  sequence_next_value BIGINT;
  allocation_count BIGINT;
  maximum_value BIGINT;
BEGIN
  IF TG_TABLE_NAME = 'ScopedNumberSequence' THEN
    target_sequence_id := NEW."id";
  ELSE
    target_sequence_id := NEW."sequenceId";
  END IF;

  SELECT "nextValue"
  INTO sequence_next_value
  FROM "ScopedNumberSequence"
  WHERE "id" = target_sequence_id;

  SELECT COUNT(*), COALESCE(MAX("value"), 0)
  INTO allocation_count, maximum_value
  FROM "ScopedNumberAllocation"
  WHERE "sequenceId" = target_sequence_id;

  IF sequence_next_value <> allocation_count + 1
    OR maximum_value <> allocation_count THEN
    RAISE EXCEPTION 'Scoped number sequence and allocation ledger are inconsistent'
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "ScopedNumberSequence_assert_consistency"
AFTER INSERT OR UPDATE ON "ScopedNumberSequence"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_10_assert_scoped_numbering_consistency"();

CREATE CONSTRAINT TRIGGER "ScopedNumberAllocation_assert_consistency"
AFTER INSERT ON "ScopedNumberAllocation"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "p1_10_assert_scoped_numbering_consistency"();

CREATE OR REPLACE FUNCTION "p1_10_prevent_scoped_numbering_truncate"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Scoped number records cannot be truncated'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "ScopedNumberSequence_prevent_truncate"
BEFORE TRUNCATE ON "ScopedNumberSequence"
FOR EACH STATEMENT EXECUTE FUNCTION "p1_10_prevent_scoped_numbering_truncate"();
CREATE TRIGGER "ScopedNumberAllocation_prevent_truncate"
BEFORE TRUNCATE ON "ScopedNumberAllocation"
FOR EACH STATEMENT EXECUTE FUNCTION "p1_10_prevent_scoped_numbering_truncate"();
