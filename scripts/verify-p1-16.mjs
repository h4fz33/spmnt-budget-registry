import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { assertAuditLogIntegrity } from "../src/lib/audit/core.ts"
import { createDatabaseClient } from "./db-client.mjs"

const constraintNames = [
  "CredentialRecoveryApproval_pkey",
  "CredentialRecoveryApproval_integrity_check",
  "CredentialRecoveryApproval_text_check",
  "CredentialRecoveryApproval_status_shape_check",
  "CredentialOperation_pkey",
  "CredentialOperation_tokenHash_key",
  "CredentialOperation_token_hash_check",
  "CredentialOperation_expiry_check",
  "CredentialOperation_recovery_shape_check",
  "CredentialOperation_status_shape_check",
].map((name) => name.slice(0, 63))

const triggerNames = [
  "CredentialRecoveryApproval_prevent_mutation",
  "CredentialOperation_prevent_mutation",
]

const directorSurfaceChecks = [
  ["src/app/api/director/authority/route.ts", ["listDirectorAuthorityState", "ACTING_DIRECTOR", "transitionSubstituteDirectorAuthority"]],
  ["src/app/director/authority/page.tsx", ["DirectorAuthorityPanel", "SCHOOL_DIRECTOR"]],
  ["src/components/organization/director-authority-panel.tsx", ["/api/director/authority", "RETURN", "MEDICAL_LEAVE"]],
  ["src/components/app-shell/navigation.ts", ["/director/authority", "director-controls"]],
]

const database = createDatabaseClient({ requestedMode: "test" })
try {
  for (const [relativePath, requiredTerms] of directorSurfaceChecks) {
    const source = await readFile(path.join(process.cwd(), relativePath), "utf8")
    for (const term of requiredTerms) assert.match(source, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }
  const [constraints, triggers, operations, approvals, auditRecords] = await Promise.all([
    database.client.$queryRaw`SELECT conname AS "name" FROM pg_constraint WHERE conname = ANY(${constraintNames})`,
    database.client.$queryRaw`SELECT trigger."tgname" AS "name" FROM pg_trigger trigger JOIN pg_class relation ON relation."oid" = trigger."tgrelid" JOIN pg_namespace namespace ON namespace."oid" = relation."relnamespace" WHERE namespace."nspname" = 'public' AND NOT trigger."tgisinternal" AND trigger."tgname" = ANY(${triggerNames})`,
    database.client.credentialOperation.findMany({ select: { status: true, operationType: true, tokenHash: true, recoveryApprovalId: true, expiresAt: true, createdAt: true, consumedAt: true } }),
    database.client.credentialRecoveryApproval.findMany({ select: { status: true, integrityDigest: true, consumedAt: true } }),
    database.client.auditLog.findMany({ orderBy: { sequence: "asc" } }),
  ])

  assert.deepEqual(constraints.map((row) => row.name).sort(), constraintNames.sort())
  assert.deepEqual(triggers.map((row) => row.name).sort(), triggerNames.sort())
  assert.equal(operations.every((operation) => /^[0-9a-f]{64}$/i.test(operation.tokenHash) && operation.expiresAt > operation.createdAt), true)
  assert.equal(operations.every((operation) => (operation.operationType === "ACTIVATION") === (operation.recoveryApprovalId === null)), true)
  assert.equal(operations.every((operation) => (operation.status === "CONSUMED") === (operation.consumedAt !== null)), true)
  assert.equal(approvals.every((approval) => /^[0-9a-f]{64}$/i.test(approval.integrityDigest) && (approval.status === "CONSUMED") === (approval.consumedAt !== null)), true)
  assertAuditLogIntegrity(auditRecords)
  console.info("P1-16 organization lifecycle verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-16 verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-16 verifier disconnect failed")
    process.exitCode = 1
  })
}
