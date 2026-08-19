-- PostgreSQL TRUNCATE bypasses row-level DELETE triggers. Extend the P1-08
-- append-only guard without rewriting the already-applied base migration.

CREATE TRIGGER "AuditLog_prevent_truncate"
BEFORE TRUNCATE ON "AuditLog"
FOR EACH STATEMENT EXECUTE FUNCTION "p1_08_prevent_audit_log_mutation"();
