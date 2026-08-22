import { NextResponse } from "next/server"

import { getActiveSession } from "@/lib/auth/server-session"
import { prisma } from "@/lib/database/client"
import {
  approveCredentialRecovery,
  assignMembershipSchool,
  assignSchoolDirector,
  grantSchoolAdmin,
  issueActivationCredential,
  issueRecoveryCredential,
  listOrganizationLifecycleState,
  listTechnicalCredentialState,
  removeMembership,
  revokeSchoolAdmin,
  revokeSchoolDirector,
  suspendMembership,
  transitionSubstituteDirectorAuthority,
  createSubstituteDirectorAuthority,
  OrganizationLifecycleAuthorizationError,
  OrganizationLifecycleConflictError,
  OrganizationLifecycleCredentialError,
  OrganizationLifecycleError,
  OrganizationLifecycleFreshAuthenticationRequiredError,
  OrganizationLifecycleValidationError,
  type LifecycleActor,
} from "@/lib/organization/lifecycle"
import { PILOT_ESAO_ORGANIZATION_ID } from "@/lib/authorization/esao-admin"

export const dynamic = "force-dynamic"

function responseFor(error: unknown) {
  if (error instanceof OrganizationLifecycleValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
  if (error instanceof OrganizationLifecycleConflictError) return NextResponse.json({ error: error.message }, { status: 409 })
  if (error instanceof OrganizationLifecycleAuthorizationError || error instanceof OrganizationLifecycleFreshAuthenticationRequiredError) return NextResponse.json({ error: error.message }, { status: 403 })
  if (error instanceof OrganizationLifecycleCredentialError) return NextResponse.json({ error: error.message }, { status: 422 })
  if (error instanceof OrganizationLifecycleError) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ error: "Organization lifecycle action could not be processed" }, { status: 500 })
}

async function actorFor(session: Awaited<ReturnType<typeof getActiveSession>>, organizationId: string) {
  const user = session?.user
  if (!user?.id || !user.accountIdentifier || typeof user.authorizationVersion !== "number" || typeof user.authenticatedAt !== "number") return null
  const now = new Date()
  const membership = await prisma.approvedMembership.findFirst({
    where: { identityId: user.id, organizationId, status: "ACTIVE", effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
    select: { id: true, authorizationVersion: true },
  })
  if (!membership) return null
  return { identityId: user.id, membershipId: membership.id, accountIdentifier: user.accountIdentifier, authorizationVersion: user.authorizationVersion, membershipAuthorizationVersion: membership.authorizationVersion, authenticatedAt: user.authenticatedAt } satisfies LifecycleActor
}

async function actorForAction(session: Awaited<ReturnType<typeof getActiveSession>>, action: string, body: { schoolId?: unknown; variant?: unknown; authorityId?: unknown }) {
  const user = session?.user
  if (!user?.id) return null
  if (action === "ISSUE_ACTIVATION" || action === "ISSUE_RECOVERY") {
    const bootstrap = await prisma.systemAdminBootstrap.findFirst({ where: { identityId: user.id }, select: { membership: { select: { organizationId: true } } } })
    return bootstrap ? actorFor(session, bootstrap.membership.organizationId) : null
  }
  if (action === "CREATE_AUTHORITY" && body.variant === "ACTING_DIRECTOR" && typeof body.schoolId === "string") {
    return actorFor(session, body.schoolId)
  }
  if (action === "TRANSITION_AUTHORITY" && typeof body.authorityId === "string") {
    const authority = await prisma.substituteDirectorAuthority.findUnique({ where: { id: body.authorityId }, select: { variant: true, schoolId: true } })
    if (authority?.variant === "ACTING_DIRECTOR") return actorFor(session, authority.schoolId)
  }
  return actorFor(session, PILOT_ESAO_ORGANIZATION_ID)
}

async function systemAdminActor(session: Awaited<ReturnType<typeof getActiveSession>>) {
  const user = session?.user
  if (!user?.id) return null
  const bootstrap = await prisma.systemAdminBootstrap.findFirst({
    where: { identityId: user.id },
    select: { membership: { select: { organizationId: true } } },
  })
  return bootstrap ? actorFor(session, bootstrap.membership.organizationId) : null
}

export async function GET(request: Request) {
  const session = await getActiveSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  try {
    const technicalActor = await systemAdminActor(session)
    if (technicalActor) return NextResponse.json(await listTechnicalCredentialState(prisma, { actor: technicalActor }))
    const schoolId = new URL(request.url).searchParams.get("schoolId")
    if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 })
    const actor = await actorFor(session, PILOT_ESAO_ORGANIZATION_ID)
    if (!actor) return NextResponse.json({ error: "Active ESAO Admin membership required" }, { status: 403 })
    return NextResponse.json(await listOrganizationLifecycleState(prisma, { actor, schoolId }))
  } catch (error) {
    return responseFor(error)
  }
}

export async function POST(request: Request) {
  const session = await getActiveSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  try {
    const body = await request.json() as { action?: unknown; schoolId?: unknown; organizationId?: unknown; authorityId?: unknown }
    const action = String(body.action ?? "")
    const actor = await actorForAction(session, action, body)
    if (!actor) return NextResponse.json({ error: "Active authorized membership required" }, { status: 403 })
    const { action: _action, ...payload } = body
    const input = { ...payload, actor }
    let result: unknown
    if (action === "SUSPEND_MEMBERSHIP") result = await suspendMembership(prisma, input)
    else if (action === "REMOVE_MEMBERSHIP") result = await removeMembership(prisma, input)
    else if (action === "ASSIGN_MEMBERSHIP_SCHOOL") result = await assignMembershipSchool(prisma, input)
    else if (action === "GRANT_SCHOOL_ADMIN") result = await grantSchoolAdmin(prisma, input)
    else if (action === "REVOKE_SCHOOL_ADMIN") result = await revokeSchoolAdmin(prisma, input)
    else if (action === "ASSIGN_DIRECTOR") result = await assignSchoolDirector(prisma, input)
    else if (action === "REVOKE_DIRECTOR") result = await revokeSchoolDirector(prisma, input)
    else if (action === "CREATE_AUTHORITY") result = await createSubstituteDirectorAuthority(prisma, input)
    else if (action === "TRANSITION_AUTHORITY") result = await transitionSubstituteDirectorAuthority(prisma, input)
    else if (action === "APPROVE_RECOVERY") result = await approveCredentialRecovery(prisma, input)
    else if (action === "ISSUE_ACTIVATION") result = await issueActivationCredential(prisma, input)
    else if (action === "ISSUE_RECOVERY") result = await issueRecoveryCredential(prisma, input)
    else return NextResponse.json({ error: "Unsupported organization lifecycle action" }, { status: 400 })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return responseFor(error)
  }
}
