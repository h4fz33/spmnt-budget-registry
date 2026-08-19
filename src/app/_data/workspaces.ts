import "server-only"

import { prisma } from "@/lib/database/client"
import type { SchoolWorkspace, SchoolWorkspaceRole } from "@/components/app-shell/navigation"

function isEffective(from: Date, to: Date | null, now: Date) {
  return from <= now && (to === null || to > now)
}

export async function loadCurrentSchoolWorkspaces(identityId: string, now = new Date()): Promise<SchoolWorkspace[]> {
  const memberships = await prisma.approvedMembership.findMany({
    where: {
      identityId,
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    select: {
      organization: {
        select: {
          id: true,
          nameTh: true,
          status: true,
          type: true,
          school: {
            select: {
              directoryIsActive: true,
              smisCode: true,
            },
          },
        },
      },
      roleAssignments: {
        select: {
          role: true,
          status: true,
          effectiveFrom: true,
          effectiveTo: true,
        },
      },
    },
  })

  const membershipsByOrganization = new Map<string, typeof memberships>()
  for (const membership of memberships) {
    const organizationId = membership.organization.id
    const existing = membershipsByOrganization.get(organizationId) ?? []
    existing.push(membership)
    membershipsByOrganization.set(organizationId, existing)
  }

  const workspaces: SchoolWorkspace[] = []
  for (const sameOrganizationMemberships of membershipsByOrganization.values()) {
    // P1-06 denies ambiguous memberships. Do not offer one as a UI workspace.
    if (sameOrganizationMemberships.length !== 1) {
      continue
    }

    const membership = sameOrganizationMemberships[0]
    const organization = membership.organization
    if (
      organization.type !== "SCHOOL" ||
      organization.status !== "ACTIVE" ||
      !organization.school?.directoryIsActive
    ) {
      continue
    }

    const roles = [...new Set(
      membership.roleAssignments
        .filter((assignment) => assignment.status === "ACTIVE" && isEffective(assignment.effectiveFrom, assignment.effectiveTo, now))
        .map((assignment) => assignment.role as SchoolWorkspaceRole),
    )]
    if (roles.length === 0) {
      continue
    }

    workspaces.push({
      id: organization.id,
      name: organization.nameTh,
      smisCode: organization.school.smisCode,
      roles,
    })
  }

  return workspaces.toSorted((left, right) => left.name.localeCompare(right.name, "th"))
}
