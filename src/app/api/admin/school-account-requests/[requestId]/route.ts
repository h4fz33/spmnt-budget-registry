import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/auth/server-session"
import { prisma } from "@/lib/database/client"
import {
  approveSchoolAccountRequest,
  rejectSchoolAccountRequest,
  requestSchoolAccountCorrection,
  resubmitSchoolAccountRequest,
  SchoolAccountRequestAuthorizationError,
  SchoolAccountRequestDecisionError,
  SchoolAccountRequestDuplicateError,
  SchoolAccountRequestError,
  SchoolAccountRequestFreshAuthenticationRequiredError,
  SchoolAccountRequestTransitionError,
  SchoolAccountRequestValidationError,
  withdrawSchoolAccountRequest,
} from "@/lib/onboarding/finance-officer-request"
import { PILOT_ESAO_ORGANIZATION_ID } from "@/lib/authorization/esao-admin"

export const dynamic = "force-dynamic"

function errorResponse(error: unknown) {
  if (error instanceof SchoolAccountRequestValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
  if (error instanceof SchoolAccountRequestDuplicateError || error instanceof SchoolAccountRequestDecisionError || error instanceof SchoolAccountRequestTransitionError) return NextResponse.json({ error: error.message }, { status: 409 })
  if (error instanceof SchoolAccountRequestAuthorizationError || error instanceof SchoolAccountRequestFreshAuthenticationRequiredError) return NextResponse.json({ error: error.message }, { status: 403 })
  if (error instanceof SchoolAccountRequestError) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ error: "Account request could not be processed" }, { status: 500 })
}

async function actorForRequest(
  session: Awaited<ReturnType<typeof getActiveSession>>,
  requestId: string,
  action: unknown,
) {
  const user = session?.user
  if (!user?.id || !user.accountIdentifier || typeof user.authorizationVersion !== "number" || typeof user.authenticatedAt !== "number") return null
  const request = await prisma.schoolAccountRequest.findUnique({ where: { id: requestId }, select: { schoolId: true } })
  if (!request) return { request: null, actor: null }
  const organizationId = ["REQUEST_CORRECTION", "APPROVE", "REJECT"].includes(String(action))
    ? PILOT_ESAO_ORGANIZATION_ID
    : request.schoolId
  const now = new Date()
  const membership = await prisma.approvedMembership.findFirst({
    where: {
      identityId: user.id,
      organizationId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    select: { id: true, authorizationVersion: true },
  })
  return {
    request,
    actor: membership
      ? {
          identityId: user.id,
          membershipId: membership.id,
          accountIdentifier: user.accountIdentifier,
          authorizationVersion: user.authorizationVersion,
          membershipAuthorizationVersion: membership.authorizationVersion,
          authenticatedAt: user.authenticatedAt,
        }
      : null,
  }
}

export async function POST(request: Request, context: { params: { requestId: string } }) {
  const session = await getActiveSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  try {
    const requestId = context.params.requestId
    const body = await request.json() as { action?: unknown } & Record<string, unknown>
    const action = body.action
    const { action: _action, ...payload } = body
    const resolved = await actorForRequest(session, requestId, action)
    if (!resolved?.request) return NextResponse.json({ error: "School Account Request not found" }, { status: 404 })
    if (!resolved.actor) return NextResponse.json({ error: "Active request-management membership required" }, { status: 403 })
    const input = { ...payload, requestId, actor: resolved.actor }
    let result
    if (action === "REQUEST_CORRECTION") result = await requestSchoolAccountCorrection(prisma, input)
    else if (action === "RESUBMIT") result = await resubmitSchoolAccountRequest(prisma, input)
    else if (action === "WITHDRAW") result = await withdrawSchoolAccountRequest(prisma, input)
    else if (action === "APPROVE") result = await approveSchoolAccountRequest(prisma, input)
    else if (action === "REJECT") result = await rejectSchoolAccountRequest(prisma, input)
    else return NextResponse.json({ error: "Unsupported account-request action" }, { status: 400 })
    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}
