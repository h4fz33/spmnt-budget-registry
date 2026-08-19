import type { PrismaClient } from "../../../generated/prisma/client"
import { z } from "zod"

import { hashPassword, normalizeAccountIdentifier } from "../auth/credentials.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"

import {
  SYSTEM_ADMIN_BOOTSTRAP_COMMAND,
  SYSTEM_ADMIN_BOOTSTRAP_ID,
  SYSTEM_ADMIN_BOOTSTRAP_REASON,
  SYSTEM_ADMIN_PLATFORM_NAME,
  SYSTEM_ADMIN_PLATFORM_ORGANIZATION_ID,
} from "./constants.ts"

const bootstrapInputSchema = z
  .object({
    accountIdentifier: z.string().trim().min(1).max(320),
    password: z.string().min(8).max(128),
  })
  .strict()

const normalizedEmailSchema = z.string().email().max(320)

export class FirstSystemAdminBootstrapError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FirstSystemAdminBootstrapError"
  }
}

export class FirstSystemAdminBootstrapAlreadyExistsError extends FirstSystemAdminBootstrapError {
  constructor() {
    super("Initial System Admin bootstrap has already completed")
    this.name = "FirstSystemAdminBootstrapAlreadyExistsError"
  }
}

export class FirstSystemAdminBootstrapUnsafeStateError extends FirstSystemAdminBootstrapError {
  constructor(message: string) {
    super(message)
    this.name = "FirstSystemAdminBootstrapUnsafeStateError"
  }
}

function parseBootstrapInput(input: unknown) {
  const parsed = bootstrapInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new FirstSystemAdminBootstrapError("Initial System Admin bootstrap input is invalid")
  }

  const accountIdentifier = normalizeAccountIdentifier(parsed.data.accountIdentifier)
  if (!normalizedEmailSchema.safeParse(accountIdentifier).success) {
    throw new FirstSystemAdminBootstrapError("Initial System Admin bootstrap email is invalid")
  }

  return Object.freeze({ accountIdentifier, password: parsed.data.password })
}

export type FirstSystemAdminBootstrapResult = Readonly<{
  identityId: string
  membershipId: string
  platformOrganizationId: string
  auditEventId: string
}>

export async function bootstrapFirstSystemAdmin(
  database: PrismaClient,
  input: unknown,
): Promise<FirstSystemAdminBootstrapResult> {
  const parsed = parseBootstrapInput(input)
  const passwordHash = await hashPassword(parsed.password)
  const occurredAt = new Date()

  return withSerializableRetry(
    () =>
      database.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(hashtextextended('SchoolBanchee first System Admin bootstrap', 8))
          `

          const existingBootstrap = await transaction.systemAdminBootstrap.findUnique({
            where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
            select: { id: true },
          })
          if (existingBootstrap) {
            throw new FirstSystemAdminBootstrapAlreadyExistsError()
          }

          const [reservedPlatform, existingIdentity] = await Promise.all([
            transaction.organization.findUnique({
              where: { id: SYSTEM_ADMIN_PLATFORM_ORGANIZATION_ID },
              select: { id: true },
            }),
            transaction.authenticatedIdentity.findUnique({
              where: { accountIdentifier: parsed.accountIdentifier },
              select: { id: true },
            }),
          ])
          if (reservedPlatform) {
            throw new FirstSystemAdminBootstrapUnsafeStateError(
              "Reserved System Admin platform organization exists without its bootstrap record",
            )
          }
          if (existingIdentity) {
            throw new FirstSystemAdminBootstrapUnsafeStateError(
              "Bootstrap email already belongs to an existing identity",
            )
          }

          const platformOrganization = await transaction.organization.create({
            data: {
              id: SYSTEM_ADMIN_PLATFORM_ORGANIZATION_ID,
              type: "PLATFORM",
              status: "ACTIVE",
              nameTh: SYSTEM_ADMIN_PLATFORM_NAME,
              nameEn: SYSTEM_ADMIN_PLATFORM_NAME,
            },
          })
          const identity = await transaction.authenticatedIdentity.create({
            data: {
              accountIdentifier: parsed.accountIdentifier,
              displayName: "Initial System Administrator",
              accountStatus: "ACTIVE",
              passwordHash,
              passwordChangedAt: occurredAt,
            },
          })
          const membership = await transaction.approvedMembership.create({
            data: {
              identityId: identity.id,
              organizationId: platformOrganization.id,
              status: "ACTIVE",
              effectiveFrom: occurredAt,
            },
          })
          const auditEvent = await recordAuditEventInTransaction(transaction, {
            actorIdentityId: identity.id,
            actorMembershipId: membership.id,
            scope: { kind: "PLATFORM" },
            commandCode: SYSTEM_ADMIN_BOOTSTRAP_COMMAND,
            targetType: "SystemAdminBootstrap",
            targetId: SYSTEM_ADMIN_BOOTSTRAP_ID,
            outcome: "SUCCESS",
            reasonCode: SYSTEM_ADMIN_BOOTSTRAP_REASON,
            correlationId: "p1-17:initial-system-admin",
            occurredAt,
          })
          const bootstrap = await transaction.systemAdminBootstrap.create({
            data: {
              id: SYSTEM_ADMIN_BOOTSTRAP_ID,
              identityId: identity.id,
              membershipId: membership.id,
              platformOrganizationId: platformOrganization.id,
            },
          })

          return Object.freeze({
            identityId: bootstrap.identityId,
            membershipId: bootstrap.membershipId,
            platformOrganizationId: bootstrap.platformOrganizationId,
            auditEventId: auditEvent.id,
          })
        },
        { isolationLevel: "Serializable" },
      ),
    { operationKey: "P1-17-FIRST-SYSTEM-ADMIN-BOOTSTRAP" },
  )
}
