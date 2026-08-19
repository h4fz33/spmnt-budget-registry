import type { PrismaClient } from "../../../generated/prisma/client"

import { SYSTEM_ADMIN_BOOTSTRAP_ID } from "../bootstrap/constants.ts"

export type ActiveSystemAdmin = Readonly<{
  identityId: string
  membershipId: string
  platformOrganizationId: string
  accountIdentifier: string
  authorizationVersion: number
}>

export async function resolveActiveSystemAdmin(
  database: PrismaClient,
  input: Readonly<{ identityId: string; authorizationVersion: number; now?: Date }>,
): Promise<ActiveSystemAdmin | null> {
  const now = input.now ?? new Date()
  if (!input.identityId || !Number.isSafeInteger(input.authorizationVersion) || input.authorizationVersion < 1 || !Number.isFinite(now.getTime())) {
    return null
  }

  const bootstrap = await database.systemAdminBootstrap.findUnique({
    where: { id: SYSTEM_ADMIN_BOOTSTRAP_ID },
    select: {
      identityId: true,
      membershipId: true,
      platformOrganizationId: true,
      identity: {
        select: {
          accountIdentifier: true,
          accountStatus: true,
          authorizationVersion: true,
        },
      },
      membership: {
        select: {
          id: true,
          identityId: true,
          organizationId: true,
          status: true,
          effectiveFrom: true,
          effectiveTo: true,
          organization: { select: { type: true, status: true } },
        },
      },
    },
  })

  if (
    !bootstrap ||
    bootstrap.identityId !== input.identityId ||
    bootstrap.identity.accountStatus !== "ACTIVE" ||
    bootstrap.identity.authorizationVersion !== input.authorizationVersion ||
    bootstrap.membershipId !== bootstrap.membership.id ||
    bootstrap.membership.identityId !== bootstrap.identityId ||
    bootstrap.membership.organizationId !== bootstrap.platformOrganizationId ||
    bootstrap.membership.status !== "ACTIVE" ||
    bootstrap.membership.effectiveFrom > now ||
    (bootstrap.membership.effectiveTo !== null && bootstrap.membership.effectiveTo <= now) ||
    bootstrap.membership.organization.type !== "PLATFORM" ||
    bootstrap.membership.organization.status !== "ACTIVE"
  ) {
    return null
  }

  return Object.freeze({
    identityId: bootstrap.identityId,
    membershipId: bootstrap.membershipId,
    platformOrganizationId: bootstrap.platformOrganizationId,
    accountIdentifier: bootstrap.identity.accountIdentifier,
    authorizationVersion: bootstrap.identity.authorizationVersion,
  })
}
