import { redirect } from "next/navigation"

import { OrganizationLifecyclePanel } from "@/components/organization/organization-lifecycle-panel"
import { getActiveSession } from "@/lib/auth/server-session"
import { prisma } from "@/lib/database/client"
import { PILOT_ESAO_ORGANIZATION_ID } from "@/lib/authorization/esao-admin"

export const dynamic = "force-dynamic"

export default async function OrganizationAdministrationPage() {
  const session = await getActiveSession()
  if (!session?.user?.id) redirect("/")
  const [configuration, bootstrap] = await Promise.all([
    prisma.esaoAdminConfiguration.findFirst({ where: { identityId: session.user.id, esaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, roleCode: "ESAO_ADMIN", status: "ACTIVE", effectiveFrom: { lte: new Date() }, revokedAt: null }, include: { schoolScopes: { select: { schoolId: true } } } }),
    prisma.systemAdminBootstrap.findFirst({ where: { identityId: session.user.id }, select: { id: true } }),
  ])
  if (!configuration && !bootstrap) redirect("/")
  const schools = await prisma.school.findMany({
    where: {
      directoryIsActive: true,
      organization: { parentOrganizationId: PILOT_ESAO_ORGANIZATION_ID, type: "SCHOOL", status: "ACTIVE", ...(configuration ? { id: { in: configuration.schoolScopes.map((scope) => scope.schoolId) } } : {}) },
    },
    select: { organizationId: true, smisCode: true, organization: { select: { nameTh: true } } },
    orderBy: { organizationId: "asc" },
  })
  return <OrganizationLifecyclePanel technical={Boolean(bootstrap)} schools={schools.map((school) => ({ id: school.organizationId, name: school.organization.nameTh, smisCode: school.smisCode }))} />
}
