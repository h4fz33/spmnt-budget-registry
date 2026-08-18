import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

import type { PrismaClient } from "../../../generated/prisma/client"
import {
  type AuthenticatedPrincipal,
  resolveActivePrincipal,
} from "./credentials.ts"

export const SENSITIVE_ACTION_AUTH_MAX_AGE_MS = 5 * 60 * 1000

export function tokenForAuthenticatedPrincipal(principal: AuthenticatedPrincipal): JWT {
  return {
    sub: principal.id,
    name: principal.name,
    accountIdentifier: principal.accountIdentifier,
    authorizationVersion: principal.authorizationVersion,
    authenticatedAt: principal.authenticatedAt,
    invalidated: false,
  }
}

export async function refreshAuthenticationToken(
  database: PrismaClient,
  token: JWT,
  now = new Date(),
): Promise<JWT> {
  const identityId = token.sub
  const authorizationVersion = token.authorizationVersion
  const authenticatedAt = token.authenticatedAt
  if (
    typeof identityId !== "string" ||
    typeof authorizationVersion !== "number" ||
    typeof authenticatedAt !== "number" ||
    !Number.isSafeInteger(authorizationVersion) ||
    !Number.isSafeInteger(authenticatedAt)
  ) {
    return { ...token, invalidated: true }
  }

  const principal = await resolveActivePrincipal(database, identityId, authorizationVersion, now)
  if (!principal) {
    return { ...token, invalidated: true }
  }

  return {
    ...token,
    name: principal.name,
    accountIdentifier: principal.accountIdentifier,
    authorizationVersion: principal.authorizationVersion,
    invalidated: false,
  }
}

export function sessionFromAuthenticationToken(token: JWT, expires: string): Session | null {
  const identityId = token.sub
  const accountIdentifier = token.accountIdentifier
  const authorizationVersion = token.authorizationVersion
  const authenticatedAt = token.authenticatedAt
  if (
    token.invalidated ||
    typeof identityId !== "string" ||
    typeof accountIdentifier !== "string" ||
    typeof authorizationVersion !== "number" ||
    typeof authenticatedAt !== "number" ||
    !Number.isSafeInteger(authorizationVersion) ||
    !Number.isSafeInteger(authenticatedAt)
  ) {
    return null
  }

  return {
    expires,
    user: {
      id: identityId,
      name: typeof token.name === "string" ? token.name : null,
      accountIdentifier,
      authorizationVersion,
      authenticatedAt,
    },
  }
}

export function hasFreshAuthentication(
  authenticatedAt: number,
  now = Date.now(),
  maximumAgeMs = SENSITIVE_ACTION_AUTH_MAX_AGE_MS,
) {
  return (
    Number.isSafeInteger(authenticatedAt) &&
    Number.isSafeInteger(now) &&
    Number.isSafeInteger(maximumAgeMs) &&
    maximumAgeMs > 0 &&
    authenticatedAt <= now &&
    now - authenticatedAt <= maximumAgeMs
  )
}

export function requireFreshAuthentication(
  session: Session | null,
  now = Date.now(),
  maximumAgeMs = SENSITIVE_ACTION_AUTH_MAX_AGE_MS,
) {
  return Boolean(session?.user && hasFreshAuthentication(session.user.authenticatedAt, now, maximumAgeMs))
}
