import "server-only"

import { getActiveSession, getFreshAuthentication } from "@/lib/auth/server-session"
import { prisma } from "@/lib/database/client"

import {
  authorizeSchoolCommand,
  type AuthorizationRequest,
} from "./school-authorization.ts"

export async function authorizeCurrentSession(request: AuthorizationRequest) {
  return authorizeSchoolCommand(prisma, await getActiveSession(), request)
}

export async function authorizeCurrentFreshSession(request: AuthorizationRequest, maximumAgeMs?: number) {
  return authorizeSchoolCommand(prisma, await getFreshAuthentication(maximumAgeMs), request)
}
