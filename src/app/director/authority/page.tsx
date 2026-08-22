import { redirect } from "next/navigation"

import { DirectorAuthorityPanel } from "@/components/organization/director-authority-panel"
import { getActiveSession } from "@/lib/auth/server-session"
import { PILOT_ESAO_ORGANIZATION_ID } from "@/lib/authorization/esao-admin"
import { prisma } from "@/lib/database/client"

export const dynamic = "force-dynamic"

export default async function DirectorAuthorityPage() {
  const session = await getActiveSession()
  if (!session?.user?.id) redirect("/")
  const now = new Date()
  const assignments = await prisma.schoolRoleAssignment.findMany({
    where: {
      role: "SCHOOL_DIRECTOR",
      status: "ACTIVE",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      membership: {
        identityId: session.user.id,
        status: "ACTIVE",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        organization: { type: "SCHOOL", status: "ACTIVE", parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, school: { directoryIsActive: true } },
      },
    },
    select: { schoolId: true, school: { select: { smisCode: true, organization: { select: { nameTh: true } } } } },
    orderBy: { schoolId: "asc" },
  })
  const schools = [...new Map(assignments.map((assignment) => [assignment.schoolId, { id: assignment.schoolId, name: assignment.school.organization.nameTh, smisCode: assignment.school.smisCode }])).values()]
  if (schools.length === 0) redirect("/")
  return <DirectorAuthorityPanel principal={session.user.name?.trim() || "ผู้อำนวยการสถานศึกษา"} schools={schools} />
}
