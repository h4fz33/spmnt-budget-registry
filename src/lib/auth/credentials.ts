import bcrypt from "bcryptjs"
import { z } from "zod"

import type { PrismaClient } from "../../../generated/prisma/client"

export const PASSWORD_COST = 10
export const MINIMUM_PASSWORD_LENGTH = 8

const credentialInputSchema = z.object({
  accountIdentifier: z.string().trim().min(1).max(320),
  password: z.string().min(MINIMUM_PASSWORD_LENGTH).max(128),
})

const passwordSchema = credentialInputSchema.shape.password
const dummyPasswordHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

export type AuthenticatedPrincipal = Readonly<{
  id: string
  name: string
  accountIdentifier: string
  authorizationVersion: number
  authenticatedAt: number
}>

export function normalizeAccountIdentifier(value: string) {
  return value.trim().toLowerCase()
}

export async function hashPassword(password: string) {
  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) {
    throw new Error(`Password must be ${MINIMUM_PASSWORD_LENGTH} to 128 characters`)
  }

  return bcrypt.hash(parsed.data, PASSWORD_COST)
}

export async function authenticateCredentials(
  database: PrismaClient,
  input: unknown,
  now = new Date(),
): Promise<AuthenticatedPrincipal | null> {
  const parsed = credentialInputSchema.safeParse(input)
  const accountIdentifier = parsed.success ? normalizeAccountIdentifier(parsed.data.accountIdentifier) : undefined
  const identity = accountIdentifier
    ? await database.authenticatedIdentity.findUnique({
        where: { accountIdentifier },
        select: {
          id: true,
          accountIdentifier: true,
          displayName: true,
          accountStatus: true,
          passwordHash: true,
          authorizationVersion: true,
          memberships: {
            where: {
              status: "ACTIVE",
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
            },
            select: { id: true },
            take: 1,
          },
        },
      })
    : null

  // Compare against a fixed cost-10 hash when lookup/validation fails so the
  // credentials route does not reveal whether an identifier is valid.
  const passwordMatches = await bcrypt.compare(
    parsed.success ? parsed.data.password : "",
    identity?.passwordHash ?? dummyPasswordHash,
  )

  if (
    !identity ||
    !passwordMatches ||
    identity.accountStatus !== "ACTIVE" ||
    identity.memberships.length !== 1
  ) {
    return null
  }

  return Object.freeze({
    id: identity.id,
    name: identity.displayName,
    accountIdentifier: identity.accountIdentifier,
    authorizationVersion: identity.authorizationVersion,
    authenticatedAt: now.getTime(),
  })
}

export async function resolveActivePrincipal(
  database: PrismaClient,
  identityId: string,
  authorizationVersion: number,
  now = new Date(),
): Promise<Omit<AuthenticatedPrincipal, "authenticatedAt"> | null> {
  if (!Number.isSafeInteger(authorizationVersion) || authorizationVersion < 1) {
    return null
  }

  const identity = await database.authenticatedIdentity.findUnique({
    where: { id: identityId },
    select: {
      id: true,
      accountIdentifier: true,
      displayName: true,
      accountStatus: true,
      authorizationVersion: true,
      memberships: {
        where: {
          status: "ACTIVE",
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
        select: { id: true },
        take: 1,
      },
    },
  })

  if (
    !identity ||
    identity.accountStatus !== "ACTIVE" ||
    identity.authorizationVersion !== authorizationVersion ||
    identity.memberships.length !== 1
  ) {
    return null
  }

  return {
    id: identity.id,
    name: identity.displayName,
    accountIdentifier: identity.accountIdentifier,
    authorizationVersion: identity.authorizationVersion,
  }
}
