import type { Prisma, PrismaClient } from "../../../generated/prisma/client"
import { randomUUID } from "node:crypto"
import { z } from "zod"

import { hashPassword, normalizeAccountIdentifier } from "../auth/credentials.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"
import { recordAuditEventInTransaction } from "../audit/core.ts"
import { calculateJsonIntegrityDigest } from "../reliability/contract.ts"
import { SYSTEM_ADMIN_BOOTSTRAP_ID } from "./constants.ts"

export const SESA0_AUDITOR_BOOTSTRAP_ID = "p1-19"
export const SESA0_AUDITOR_ROLE = "SESAO_AUDITOR"
export const PILOT_ESAO_ORGANIZATION_ID = "10009600-0001-5000-8000-000000000001"
export const PILOT_ESAO_CODE = "1000960001"
export const SESA0_AUDITOR_BOOTSTRAP_COMMAND = "AUTH-07"
export const SESA0_AUDITOR_BOOTSTRAP_REASON = "INITIAL_SESAO_AUDITOR_BOOTSTRAP"
export const PRIVATE_PRODUCT_OWNER_LABEL = "Private Business / Product Owner"

const accountSchema = z.object({
  accountIdentifier: z.string().trim().min(1).max(320),
  password: z.string().min(8).max(128),
  personName: z.string().trim().min(1).max(200),
}).strict()

const inputSchema = z.object({ accounts: z.array(accountSchema).min(1).max(100) }).strict()
const emailSchema = z.string().email().max(320)

export class SesaoAuditorBootstrapError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SesaoAuditorBootstrapError"
  }
}

export class SesaoAuditorBootstrapAlreadyExistsError extends SesaoAuditorBootstrapError {
  constructor() { super("Initial SESAO Auditor bootstrap has already completed") }
}
export class SesaoAuditorBootstrapUnsafeStateError extends SesaoAuditorBootstrapError {
  constructor(message: string) { super(message) }
}

function parseInput(input: unknown) {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) throw new SesaoAuditorBootstrapError("SESAO Auditor bootstrap input is invalid")
  const accounts = parsed.data.accounts.map((account) => ({
    accountIdentifier: normalizeAccountIdentifier(account.accountIdentifier),
    password: account.password,
    personName: account.personName,
  }))
  if (accounts.some((account) => !emailSchema.safeParse(account.accountIdentifier).success)) {
    throw new SesaoAuditorBootstrapError("SESAO Auditor bootstrap account identifier is invalid")
  }
  if (new Set(accounts.map((account) => account.accountIdentifier)).size !== accounts.length) {
    throw new SesaoAuditorBootstrapError("SESAO Auditor bootstrap accounts must be unique")
  }
  return Object.freeze({ accounts })
}

export type SesaoAuditorBootstrapResult = Readonly<{
  bootstrapId: string
  configurationIds: readonly string[]
  identityIds: readonly string[]
  auditEventId: string
}>

type Transaction = Prisma.TransactionClient

export async function bootstrapSesaoAuditors(
  database: PrismaClient,
  input: unknown,
): Promise<SesaoAuditorBootstrapResult> {
  const parsed = parseInput(input)
  const hashed = await Promise.all(parsed.accounts.map(async (account) => ({ ...account, passwordHash: await hashPassword(account.password) })))
  const occurredAt = new Date()

  return withSerializableRetry(
    () => database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('SchoolBanchee P1-19 Auditor bootstrap', 8))`
      const existing = await transaction.sesaoAuditorBootstrap.findUnique({ where: { id: SESA0_AUDITOR_BOOTSTRAP_ID } })
      if (existing) throw new SesaoAuditorBootstrapAlreadyExistsError()

      const systemAdmin = await transaction.systemAdminBootstrap.findUnique({
        where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
        select: { identityId: true, membershipId: true },
      })
      if (!systemAdmin) throw new SesaoAuditorBootstrapUnsafeStateError("P1-19 requires the sealed System Admin bootstrap")

      const esao = await transaction.organization.findUnique({ where: { id: PILOT_ESAO_ORGANIZATION_ID }, select: { id: true, type: true, status: true } })
      if (!esao || esao.type !== "ESAO" || esao.status !== "ACTIVE") {
        throw new SesaoAuditorBootstrapUnsafeStateError(`Approved pilot ESAO ${PILOT_ESAO_CODE} is missing or inactive`)
      }
      const schools = await transaction.school.findMany({
        where: { directoryIsActive: true, organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE" } },
        select: { organizationId: true }, orderBy: { organizationId: "asc" },
      })
      if (schools.length !== 17) throw new SesaoAuditorBootstrapUnsafeStateError("P1-19 requires exactly 17 active pilot Schools")

      await transaction.sesaoAuditorBootstrap.create({ data: { id: SESA0_AUDITOR_BOOTSTRAP_ID, esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID } })
      const configurationIds: string[] = []
      const identityIds: string[] = []
      for (const account of hashed) {
        const occupied = await transaction.authenticatedIdentity.findUnique({ where: { accountIdentifier: account.accountIdentifier }, select: { id: true } })
        if (occupied) throw new SesaoAuditorBootstrapUnsafeStateError("SESAO Auditor bootstrap account already exists")
        const identity = await transaction.authenticatedIdentity.create({
          data: { accountIdentifier: account.accountIdentifier, displayName: account.personName, accountStatus: "ACTIVE", passwordHash: account.passwordHash, passwordChangedAt: occurredAt },
        })
        const membership = await transaction.approvedMembership.create({ data: { identityId: identity.id, organizationId: PILOT_ESAO_ORGANIZATION_ID, status: "ACTIVE", effectiveFrom: occurredAt } })
        const configurationId = randomUUID()
        const integrityDigest = calculateJsonIntegrityDigest({
          version: 1, configurationId, identityId: identity.id, accountIdentifier: account.accountIdentifier,
          personName: account.personName, roleCode: SESA0_AUDITOR_ROLE, esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
          schoolIds: schools.map((school) => school.organizationId), source: "INITIAL_BOOTSTRAP",
        } as never)
        await transaction.sesaoAuditorConfiguration.create({
          data: {
            id: configurationId, bootstrapId: SESA0_AUDITOR_BOOTSTRAP_ID, identityId: identity.id,
            personNameSnapshot: account.personName, roleCode: SESA0_AUDITOR_ROLE, esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID,
            configurationSource: "INITIAL_BOOTSTRAP", integrityDigest,
            schoolScopes: { create: schools.map((school) => ({ schoolId: school.organizationId })) },
          },
        })
        configurationIds.push(configurationId)
        identityIds.push(identity.id)
        void membership
      }
      const auditEvent = await recordAuditEventInTransaction(transaction, {
        actorIdentityId: systemAdmin.identityId,
        actorMembershipId: systemAdmin.membershipId,
        scope: { kind: "PLATFORM" },
        commandCode: SESA0_AUDITOR_BOOTSTRAP_COMMAND,
        targetType: "SesaoAuditorBootstrap",
        targetId: SESA0_AUDITOR_BOOTSTRAP_ID,
        outcome: "SUCCESS",
        reasonCode: SESA0_AUDITOR_BOOTSTRAP_REASON,
        correlationId: "p1-19:initial-sesao-auditor-bootstrap",
        occurredAt,
      })
      return Object.freeze({ bootstrapId: SESA0_AUDITOR_BOOTSTRAP_ID, configurationIds, identityIds, auditEventId: auditEvent.id })
    }, { isolationLevel: "Serializable" }),
    { operationKey: "P1-19-SESAO-AUDITOR-BOOTSTRAP" },
  )
}
