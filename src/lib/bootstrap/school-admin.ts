import type { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { randomUUID } from "node:crypto"
import { z } from "zod"

import { requireFreshAuthentication } from "../auth/session.ts"
import { normalizeAccountIdentifier } from "../auth/credentials.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"
import { SYSTEM_ADMIN_BOOTSTRAP_ID } from "./constants.ts"
import { PILOT_ESAO_ORGANIZATION_ID } from "./sesao-auditor.ts"

export const SCHOOL_ADMIN_BOOTSTRAP_ID = "p1-21"
export const SCHOOL_ADMIN_BOOTSTRAP_COMMAND = "AUTH-09"
export const SCHOOL_ADMIN_ROLE = "SCHOOL_ADMIN"
export const ESAO_ADMIN_APPROVAL_LABEL = "ESAO Admin"

const uuid = z.string().uuid()
const hash = z.string().regex(/^[0-9a-f]{64}$/)
const syntheticAccountIdentifier = z
  .string()
  .trim()
  .email()
  .max(320)
  .refine((value) => value.toLowerCase().endsWith("@synthetic.test"))

const actorSchema = z.object({
  identityId: uuid,
  membershipId: uuid,
  accountIdentifier: z.string().trim().min(1).max(320),
  authorizationVersion: z.number().int().positive(),
  membershipAuthorizationVersion: z.number().int().positive(),
  authenticatedAt: z.number().int().nonnegative(),
}).strict()

const manifestRowSchema = z.object({
  schoolId: uuid,
  accountIdentifier: syntheticAccountIdentifier,
  personName: z.string().trim().min(1).max(200),
  roleCode: z.literal(SCHOOL_ADMIN_ROLE),
}).strict()

const approvalSchema = z.object({
  externalApprovalRecordId: z.string().trim().min(1).max(128),
  approvalAuthorityLabel: z.literal(ESAO_ADMIN_APPROVAL_LABEL),
  approvalAuthorityIdentity: z.string().trim().min(1).max(320),
  approvalEvidenceReference: z.string().trim().min(1).max(512),
  approvalEvidenceHash: hash,
  manifestDigest: hash,
  configurationId: uuid,
  actor: actorSchema,
}).strict()

const commandSchema = z.object({
  actor: actorSchema,
  approval: approvalSchema,
  manifest: z.array(manifestRowSchema).length(17),
}).strict()

export class SchoolAdminBootstrapError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SchoolAdminBootstrapError"
  }
}

export class SchoolAdminBootstrapReplayError extends SchoolAdminBootstrapError {
  constructor() {
    super("P1-21 School Admin bootstrap has already been executed")
    this.name = "SchoolAdminBootstrapReplayError"
  }
}

export class SchoolAdminBootstrapFreshAuthenticationRequiredError extends SchoolAdminBootstrapError {
  constructor() {
    super("Fresh System Admin authentication is required")
    this.name = "SchoolAdminBootstrapFreshAuthenticationRequiredError"
  }
}

export class SchoolAdminBootstrapApprovalError extends SchoolAdminBootstrapError {
  constructor(message: string) {
    super(message)
    this.name = "SchoolAdminBootstrapApprovalError"
  }
}

type Transaction = Prisma.TransactionClient
type Actor = z.infer<typeof actorSchema>
type Command = z.infer<typeof commandSchema>

function digest(value: object) {
  return calculateJsonIntegrityDigest(value as never)
}

type ManifestRow = z.infer<typeof manifestRowSchema>

function canonicalManifest(rows: readonly ManifestRow[]): ManifestRow[] {
  return [...rows]
    .map((row): ManifestRow => ({
      schoolId: row.schoolId,
      accountIdentifier: normalizeAccountIdentifier(row.accountIdentifier),
      personName: row.personName.trim(),
      roleCode: "SCHOOL_ADMIN",
    }))
    .sort((left, right) => left.schoolId.localeCompare(right.schoolId))
}

export function calculateSchoolAdminManifestDigest(
  esaoOrganizationId: string,
  rows: readonly z.infer<typeof manifestRowSchema>[],
) {
  return digest({ version: 1, esaoOrganizationId, manifest: canonicalManifest(rows) })
}

function parseCommand(input: unknown): Command {
  const parsed = commandSchema.safeParse(input)
  if (!parsed.success) {
    throw new SchoolAdminBootstrapError("P1-21 School Admin bootstrap input is invalid")
  }
  return {
    ...parsed.data,
    actor: { ...parsed.data.actor, accountIdentifier: normalizeAccountIdentifier(parsed.data.actor.accountIdentifier) },
    approval: {
      ...parsed.data.approval,
      approvalAuthorityIdentity: parsed.data.approval.approvalAuthorityIdentity.trim(),
      actor: { ...parsed.data.approval.actor, accountIdentifier: normalizeAccountIdentifier(parsed.data.approval.actor.accountIdentifier) },
    },
    manifest: canonicalManifest(parsed.data.manifest),
  }
}

function assertFreshSystemAdmin(actor: Actor, now: Date) {
  const session = {
    expires: new Date(now.getTime() + 60_000).toISOString(),
    user: {
      id: actor.identityId,
      accountIdentifier: actor.accountIdentifier,
      authorizationVersion: actor.authorizationVersion,
      authenticatedAt: actor.authenticatedAt,
    },
  }
  if (!requireFreshAuthentication(session, now.getTime())) {
    throw new SchoolAdminBootstrapFreshAuthenticationRequiredError()
  }
}

async function requireSystemAdmin(transaction: Transaction, actor: Actor, now: Date) {
  assertFreshSystemAdmin(actor, now)
  const bootstrap = await transaction.systemAdminBootstrap.findUnique({
    where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
    select: {
      identityId: true,
      membershipId: true,
      identity: { select: { accountIdentifier: true, accountStatus: true, authorizationVersion: true } },
      membership: {
        select: {
          identityId: true,
          organizationId: true,
          status: true,
          authorizationVersion: true,
          effectiveFrom: true,
          effectiveTo: true,
          organization: { select: { type: true, status: true } },
        },
      },
    },
  })
  if (
    !bootstrap ||
    bootstrap.identityId !== actor.identityId ||
    bootstrap.membershipId !== actor.membershipId ||
    bootstrap.identity.accountIdentifier !== actor.accountIdentifier ||
    bootstrap.identity.accountStatus !== "ACTIVE" ||
    bootstrap.identity.authorizationVersion !== actor.authorizationVersion ||
    bootstrap.membership.identityId !== actor.identityId ||
    bootstrap.membership.authorizationVersion !== actor.membershipAuthorizationVersion ||
    bootstrap.membership.status !== "ACTIVE" ||
    bootstrap.membership.effectiveFrom > now ||
    (bootstrap.membership.effectiveTo !== null && bootstrap.membership.effectiveTo <= now) ||
    bootstrap.membership.organization.type !== "PLATFORM" ||
    bootstrap.membership.organization.status !== "ACTIVE"
  ) {
    throw new SchoolAdminBootstrapError("Only the active System Admin may execute P1-21")
  }
  return bootstrap
}

async function exactPilotSchools(transaction: Transaction) {
  const schools = await transaction.school.findMany({
    where: {
      directoryIsActive: true,
      organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" },
    },
    select: { organizationId: true },
    orderBy: { organizationId: "asc" },
  })
  if (schools.length !== 17) {
    throw new SchoolAdminBootstrapApprovalError("P1-21 requires exactly 17 active pilot Schools")
  }
  return schools.map((school) => school.organizationId)
}

function assertExactSchoolScope(expected: readonly string[], rows: readonly { schoolId: string }[]) {
  const supplied = rows.map((row) => row.schoolId)
  if (new Set(supplied).size !== 17 || expected.some((schoolId, index) => schoolId !== supplied[index])) {
    throw new SchoolAdminBootstrapApprovalError("P1-21 manifest must contain exactly one row for every active pilot School")
  }
}

async function requireApprovedEsaoAdmin(
  transaction: Transaction,
  approval: Command["approval"],
  expectedSchools: readonly string[],
  now: Date,
) {
  const configuration = await transaction.esaoAdminConfiguration.findUnique({
    where: { id: approval.configurationId },
    include: {
      identity: {
        select: {
          accountIdentifier: true,
          accountStatus: true,
          authorizationVersion: true,
          memberships: {
            select: {
              id: true,
              identityId: true,
              organizationId: true,
              status: true,
              authorizationVersion: true,
              effectiveFrom: true,
              effectiveTo: true,
              organization: { select: { type: true, status: true } },
              roleAssignments: { select: { id: true } },
            },
          },
        },
      },
      schoolScopes: { select: { schoolId: true }, orderBy: { schoolId: "asc" } },
    },
  })
  const membership = configuration?.identity.memberships.find((item) => item.id === approval.actor.membershipId)
  if (
    !configuration ||
    configuration.identityId !== approval.actor.identityId ||
    configuration.status !== "ACTIVE" ||
    configuration.effectiveFrom > now ||
    configuration.roleCode !== "ESAO_ADMIN" ||
    configuration.configurationSource !== "APPROVED_APPOINTMENT" ||
    configuration.esaoOrganizationId !== PILOT_ESAO_ORGANIZATION_ID ||
    configuration.identity.accountStatus !== "ACTIVE" ||
    configuration.identity.accountIdentifier !== approval.actor.accountIdentifier ||
    configuration.identity.authorizationVersion !== approval.actor.authorizationVersion ||
    configuration.schoolScopes.length !== 17 ||
    configuration.schoolScopes.some((scope, index) => scope.schoolId !== expectedSchools[index]) ||
    !membership ||
    membership.identityId !== approval.actor.identityId ||
    membership.organizationId !== PILOT_ESAO_ORGANIZATION_ID ||
    membership.status !== "ACTIVE" ||
    membership.authorizationVersion !== approval.actor.membershipAuthorizationVersion ||
    membership.effectiveFrom > now ||
    (membership.effectiveTo !== null && membership.effectiveTo <= now) ||
    membership.organization.type !== "ESAO" ||
    membership.organization.status !== "ACTIVE" ||
    membership.roleAssignments.length !== 0
  ) {
    throw new SchoolAdminBootstrapApprovalError("Approval must be attributable to the active ESAO Admin configuration")
  }
  return { configuration, membership }
}

export type SchoolAdminBootstrapResult = Readonly<{
  bootstrapId: string
  manifestDigest: string
  identityIds: readonly string[]
  membershipIds: readonly string[]
  roleAssignmentIds: readonly string[]
  approvalProvenanceId: string
  executionProvenanceId: string
  approvalAuditEventId: string
  executionAuditEventId: string
}>

export async function executeSchoolAdminBootstrap(
  database: PrismaClient,
  input: unknown,
  now = new Date(),
): Promise<SchoolAdminBootstrapResult> {
  const value = parseCommand(input)
  const manifestDigest = calculateSchoolAdminManifestDigest(PILOT_ESAO_ORGANIZATION_ID, value.manifest)
  if (manifestDigest !== value.approval.manifestDigest) {
    throw new SchoolAdminBootstrapApprovalError("Approved manifest digest does not match the exact supplied manifest")
  }

  return withSerializableRetry(
    () => database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('SchoolBanchee P1-21 School Admin bootstrap', 8))`
      await requireSystemAdmin(transaction, value.actor, now)

      const existing = await transaction.schoolAdminBootstrap.findUnique({ where: { id: SCHOOL_ADMIN_BOOTSTRAP_ID }, select: { id: true } })
      if (existing) throw new SchoolAdminBootstrapReplayError()

      const expectedSchools = await exactPilotSchools(transaction)
      assertExactSchoolScope(expectedSchools, value.manifest)
      const approval = await requireApprovedEsaoAdmin(transaction, value.approval, expectedSchools, now)

      const occupied = await transaction.authenticatedIdentity.findMany({
        where: { accountIdentifier: { in: value.manifest.map((row) => row.accountIdentifier) } },
        select: { accountIdentifier: true },
      })
      if (occupied.length > 0) {
        throw new SchoolAdminBootstrapApprovalError("P1-21 manifest account identifier already belongs to an identity")
      }

      await transaction.schoolAdminBootstrap.create({
        data: {
          id: SCHOOL_ADMIN_BOOTSTRAP_ID,
          esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
          status: "APPROVED",
          manifestDigest,
          approvedAt: now,
          updatedAt: now,
        },
      })

      const approvalAudit = await recordAuditEventInTransaction(transaction, {
        actorIdentityId: value.approval.actor.identityId,
        actorMembershipId: value.approval.actor.membershipId,
        scope: { kind: "ORGANIZATION", organizationId: PILOT_ESAO_ORGANIZATION_ID },
        commandCode: SCHOOL_ADMIN_BOOTSTRAP_COMMAND,
        targetType: "SchoolAdminBootstrap",
        targetId: SCHOOL_ADMIN_BOOTSTRAP_ID,
        outcome: "SUCCESS",
        reasonCode: "SCHOOL_ADMIN_BOOTSTRAP_APPROVED",
        correlationId: value.approval.externalApprovalRecordId,
        occurredAt: now,
      })

      const approvalProvenanceId = randomUUID()
      await transaction.schoolAdminBootstrapProvenance.create({
        data: {
          id: approvalProvenanceId,
          bootstrapId: SCHOOL_ADMIN_BOOTSTRAP_ID,
          action: "APPROVE",
          externalApprovalRecordId: value.approval.externalApprovalRecordId,
          approvalAuthorityLabel: value.approval.approvalAuthorityLabel,
          approvalAuthorityIdentity: value.approval.approvalAuthorityIdentity,
          approvalEvidenceReference: value.approval.approvalEvidenceReference,
          approvalEvidenceHash: value.approval.approvalEvidenceHash,
          approvalConfigurationId: value.approval.configurationId,
          manifestDigest,
          actorIdentityId: value.approval.actor.identityId,
          actorMembershipId: value.approval.actor.membershipId,
          occurredAt: now,
          integrityDigest: digest({
            version: 1,
            id: approvalProvenanceId,
            bootstrapId: SCHOOL_ADMIN_BOOTSTRAP_ID,
            action: "APPROVE",
            externalApprovalRecordId: value.approval.externalApprovalRecordId,
            manifestDigest,
            actorIdentityId: value.approval.actor.identityId,
            actorMembershipId: value.approval.actor.membershipId,
            occurredAt: now.toISOString(),
          }),
        },
      })

      const identityIds: string[] = []
      const membershipIds: string[] = []
      const roleAssignmentIds: string[] = []
      for (const [index, row] of value.manifest.entries()) {
        const identity = await transaction.authenticatedIdentity.create({
          data: { accountIdentifier: row.accountIdentifier, displayName: row.personName, accountStatus: "ACTIVE" },
        })
        const membership = await transaction.approvedMembership.create({
          data: {
            identityId: identity.id,
            organizationId: row.schoolId,
            status: "ACTIVE",
            effectiveFrom: now,
            approvedByIdentityId: value.approval.actor.identityId,
          },
        })
        const roleAssignment = await transaction.schoolRoleAssignment.create({
          data: {
            membershipId: membership.id,
            schoolId: row.schoolId,
            role: SCHOOL_ADMIN_ROLE,
            status: "ACTIVE",
            effectiveFrom: now,
            grantReason: "P1-21_ESAO_APPROVED_SCHOOL_ADMIN_BOOTSTRAP",
            evidenceReference: value.approval.approvalEvidenceReference,
            grantedByIdentityId: value.approval.actor.identityId,
          },
        })
        await transaction.schoolAdminBootstrapManifestRow.create({
          data: {
            id: randomUUID(),
            bootstrapId: SCHOOL_ADMIN_BOOTSTRAP_ID,
            rowNumber: index + 1,
            schoolId: row.schoolId,
            accountIdentifier: row.accountIdentifier,
            personName: row.personName,
            roleCode: SCHOOL_ADMIN_ROLE,
            rowDigest: digest({ version: 1, rowNumber: index + 1, ...row }),
            identityId: identity.id,
            membershipId: membership.id,
            roleAssignmentId: roleAssignment.id,
          },
        })
        identityIds.push(identity.id)
        membershipIds.push(membership.id)
        roleAssignmentIds.push(roleAssignment.id)
      }

      const executionAudit = await recordAuditEventInTransaction(transaction, {
        actorIdentityId: value.actor.identityId,
        actorMembershipId: value.actor.membershipId,
        scope: { kind: "PLATFORM" },
        commandCode: SCHOOL_ADMIN_BOOTSTRAP_COMMAND,
        targetType: "SchoolAdminBootstrap",
        targetId: SCHOOL_ADMIN_BOOTSTRAP_ID,
        outcome: "SUCCESS",
        reasonCode: "SCHOOL_ADMIN_BOOTSTRAP_EXECUTED",
        correlationId: value.approval.externalApprovalRecordId,
        occurredAt: now,
      })

      await transaction.schoolAdminBootstrap.update({
        where: { id: SCHOOL_ADMIN_BOOTSTRAP_ID },
        data: { status: "EXECUTED", executorIdentityId: value.actor.identityId, executorMembershipId: value.actor.membershipId, executedAt: now, updatedAt: now },
      })

      const executionProvenanceId = randomUUID()
      await transaction.schoolAdminBootstrapProvenance.create({
        data: {
          id: executionProvenanceId,
          bootstrapId: SCHOOL_ADMIN_BOOTSTRAP_ID,
          action: "EXECUTE",
          externalApprovalRecordId: value.approval.externalApprovalRecordId,
          approvalAuthorityLabel: value.approval.approvalAuthorityLabel,
          approvalAuthorityIdentity: value.approval.approvalAuthorityIdentity,
          approvalEvidenceReference: value.approval.approvalEvidenceReference,
          approvalEvidenceHash: value.approval.approvalEvidenceHash,
          approvalConfigurationId: value.approval.configurationId,
          manifestDigest,
          actorIdentityId: value.actor.identityId,
          actorMembershipId: value.actor.membershipId,
          occurredAt: now,
          integrityDigest: digest({
            version: 1,
            id: executionProvenanceId,
            bootstrapId: SCHOOL_ADMIN_BOOTSTRAP_ID,
            action: "EXECUTE",
            externalApprovalRecordId: value.approval.externalApprovalRecordId,
            manifestDigest,
            actorIdentityId: value.actor.identityId,
            actorMembershipId: value.actor.membershipId,
            occurredAt: now.toISOString(),
          }),
        },
      })

      return Object.freeze({
        bootstrapId: SCHOOL_ADMIN_BOOTSTRAP_ID,
        manifestDigest,
        identityIds,
        membershipIds,
        roleAssignmentIds,
        approvalProvenanceId,
        executionProvenanceId,
        approvalAuditEventId: approvalAudit.id,
        executionAuditEventId: executionAudit.id,
      })
    }, { isolationLevel: "Serializable" }),
    { operationKey: "P1-21-SCHOOL-ADMIN-BOOTSTRAP" },
  )
}

export const applySchoolAdminBootstrap = executeSchoolAdminBootstrap
export const bootstrapSchoolAdmins = executeSchoolAdminBootstrap
