import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/auth/server-session"
import { prisma } from "@/lib/database/client"
import {
  listSchoolAccountRequests,
  SchoolAccountRequestAuthorizationError,
  SchoolAccountRequestDecisionError,
  SchoolAccountRequestDuplicateError,
  SchoolAccountRequestError,
  SchoolAccountRequestFreshAuthenticationRequiredError,
  SchoolAccountRequestRateLimitedError,
  SchoolAccountRequestValidationError,
  submitSchoolAccountRequest,
} from "@/lib/onboarding/finance-officer-request"
import { PILOT_ESAO_ORGANIZATION_ID } from "@/lib/authorization/esao-admin"

export const dynamic = "force-dynamic"

function errorResponse(error: unknown) {
  if (error instanceof SchoolAccountRequestValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
  if (error instanceof SchoolAccountRequestRateLimitedError) return NextResponse.json({ error: error.message }, { status: 429 })
  if (error instanceof SchoolAccountRequestDuplicateError || error instanceof SchoolAccountRequestDecisionError) return NextResponse.json({ error: error.message }, { status: 409 })
  if (error instanceof SchoolAccountRequestAuthorizationError || error instanceof SchoolAccountRequestFreshAuthenticationRequiredError) return NextResponse.json({ error: error.message }, { status: 403 })
  if (error instanceof SchoolAccountRequestError) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ error: "Account request could not be processed" }, { status: 500 })
}

async function activeSessionActor(session: Awaited<ReturnType<typeof getActiveSession>>, organizationId: string) {
  const user = session?.user
  if (!user?.id || !user.accountIdentifier || typeof user.authorizationVersion !== "number" || typeof user.authenticatedAt !== "number") return null
  const membership = await prisma.approvedMembership.findFirst({
    where: {
      identityId: user.id,
      organizationId,
      status: "ACTIVE",
      effectiveFrom: { lte: new Date() },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
    },
    select: { id: true, authorizationVersion: true },
  })
  if (!membership) return null
  return {
    identityId: user.id,
    membershipId: membership.id,
    accountIdentifier: user.accountIdentifier,
    authorizationVersion: user.authorizationVersion,
    membershipAuthorizationVersion: membership.authorizationVersion,
    authenticatedAt: user.authenticatedAt,
  }
}

export async function POST(request: Request) {
  const session = await getActiveSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  try {
    const body = await request.json() as { schoolId?: unknown }
    if (typeof body.schoolId !== "string") return NextResponse.json({ error: "schoolId is required" }, { status: 400 })
    const actor = await activeSessionActor(session, body.schoolId)
    if (!actor) return NextResponse.json({ error: "Active same-School School Admin membership required" }, { status: 403 })
    const result = await submitSchoolAccountRequest(prisma, { ...body, actor })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: Request) {
  const session = await getActiveSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  try {
    const url = new URL(request.url)
    const schoolId = url.searchParams.get("schoolId") ?? undefined
    const actor = await activeSessionActor(session, PILOT_ESAO_ORGANIZATION_ID)
    if (!actor) return NextResponse.json({ error: "Active ESAO Admin membership required" }, { status: 403 })
    const result = await listSchoolAccountRequests(prisma, { actor, schoolId }, new Date())
    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
