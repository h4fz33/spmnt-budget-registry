import "server-only"

import { getServerSession } from "next-auth"

import { authOptions } from "./options"
import { requireFreshAuthentication } from "./session"

export async function getActiveSession() {
  return getServerSession(authOptions)
}

export async function getFreshAuthentication(maximumAgeMs?: number) {
  const session = await getActiveSession()
  return requireFreshAuthentication(session, Date.now(), maximumAgeMs) ? session : null
}
