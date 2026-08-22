import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/auth/server-session"
import { prisma } from "@/lib/database/client"
import {
  createSubstituteDirectorAuthority,
  listDirectorAuthorityState,
  OrganizationLifecycleAuthorizationError,
  OrganizationLifecycleConflictError,
  OrganizationLifecycleError,
  OrganizationLifecycleFreshAuthenticationRequiredError,
  OrganizationLifecycleValidationError,
  transitionSubstituteDirectorAuthority,
  type LifecycleActor,
} from "@/lib/organization/lifecycle"

export const dynamic = "force-dynamic"

function responseFor(error: unknown) {
  if (error instanceof OrganizationLifecycleValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
  if (error instanceof OrganizationLifecycleConflictError) return NextResponse.json({ error: error.message }, { status: 409 })
  if (error instanceof OrganizationLifecycleAuthorizationError || error instanceof OrganizationLifecycleFreshAuthenticationRequiredError) return NextResponse.json({ error: error.message }, { status: 403 })
  if (error instanceof OrganizationLifecycleError) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ error: "Director authority action could not be processed" }, { status: 500 })
}

async function actorForSchool(session: Awaited<ReturnType<typeof getActiveSession>>, schoolId: string) {
  const user = session?.user
  if (!user?.id || !user.accountIdentifier || typeof user.authorizationVersion !== "number" || typeof user.authenticatedAt !== "number") return null
  const now = new Date()
  const membership = await prisma.approvedMembership.findFirst({
    where: {
      identityId: user.id,
      organizationId: schoolId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
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
  } satisfies LifecycleActor
}

export async function GET(request: Request) {
  const session = await getActiveSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  const schoolId = new URL(request.url).searchParams.get("schoolId")
  if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 })
  try {
    const actor = await actorForSchool(session, schoolId)
    if (!actor) return NextResponse.json({ error: "Active School membership required" }, { status: 403 })
    return NextResponse.json(await listDirectorAuthorityState(prisma, { actor, schoolId }))
  } catch (error) {
    return responseFor(error)
  }
}

export async function POST(request: Request) {
  const session = await getActiveSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  try {
    const body = await request.json() as { action?: unknown; schoolId?: unknown; authorityId?: unknown; variant?: unknown; reason?: unknown }
    const action = String(body.action ?? "")
    let schoolId: string | null = typeof body.schoolId === "string" ? body.schoolId : null
    if (action === "TRANSITION_AUTHORITY" && typeof body.authorityId === "string") {
      const authority = await prisma.substituteDirectorAuthority.findUnique({ where: { id: body.authorityId }, select: { schoolId: true, variant: true } })
      if (!authority || authority.variant !== "ACTING_DIRECTOR") return NextResponse.json({ error: "Only the School Director Acting authority is available here" }, { status: 403 })
      schoolId = authority.schoolId
    }
    if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 })
    const actor = await actorForSchool(session, schoolId)
    if (!actor) return NextResponse.json({ error: "Active School membership required" }, { status: 403 })
    const { action: _action, ...payload } = body
    const input = { ...payload, actor, schoolId }
    if (action === "CREATE_AUTHORITY") {
      if (body.variant !== "ACTING_DIRECTOR") return NextResponse.json({ error: "School Director self-service supports Acting Director authority only" }, { status: 403 })
      return NextResponse.json(await createSubstituteDirectorAuthority(prisma, input), { status: 201 })
    }
    if (action === "TRANSITION_AUTHORITY") return NextResponse.json(await transitionSubstituteDirectorAuthority(prisma, { actor, authorityId: body.authorityId, reason: payload.reason }), { status: 201 })
    return NextResponse.json({ error: "Unsupported director authority action" }, { status: 400 })
  } catch (error) {
    return responseFor(error)
  }
}
