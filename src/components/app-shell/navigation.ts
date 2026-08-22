export const SCHOOL_ROLE_LABELS = {
  FINANCE_OFFICER: "เจ้าหน้าที่การเงิน",
  SCHOOL_ADMIN: "ผู้ดูแลระบบระดับสถานศึกษา",
  SCHOOL_DIRECTOR: "ผู้อำนวยการสถานศึกษา",
} as const

export type SchoolWorkspaceRole = keyof typeof SCHOOL_ROLE_LABELS

export type SchoolWorkspace = Readonly<{
  id: string
  name: string
  smisCode: string
  roles: readonly SchoolWorkspaceRole[]
}>

export type ShellNavigationItem = Readonly<{
  id: "overview" | "director-controls"
  label: string
  href: string
}>

export type DeferredCapability = Readonly<{
  id: "school-account-request" | "financial-records" | "director-controls"
  requiredRoles: readonly SchoolWorkspaceRole[]
}>

const shellNavigation: readonly ShellNavigationItem[] = [
  {
    id: "overview",
    label: "ภาพรวมพื้นที่ทำงาน",
    href: "/",
  },
]

const directorNavigation: ShellNavigationItem = {
  id: "director-controls",
  label: "ควบคุมอำนาจผู้อำนวยการ",
  href: "/director/authority",
}

const deferredCapabilities: readonly DeferredCapability[] = [
  {
    id: "school-account-request",
    requiredRoles: ["SCHOOL_ADMIN"],
  },
  {
    id: "financial-records",
    requiredRoles: ["FINANCE_OFFICER"],
  },
  {
    id: "director-controls",
    requiredRoles: ["SCHOOL_DIRECTOR"],
  },
]

function hasRequiredRole(
  roles: readonly SchoolWorkspaceRole[],
  requiredRoles: readonly SchoolWorkspaceRole[],
) {
  return requiredRoles.some((role) => roles.includes(role))
}

export function navigationForWorkspace(workspace: SchoolWorkspace) {
  return workspace.roles.includes("SCHOOL_DIRECTOR")
    ? [...shellNavigation, directorNavigation]
    : shellNavigation
}

export function deferredCapabilitiesForWorkspace(workspace: SchoolWorkspace) {
  return deferredCapabilities.filter((capability) => capability.id !== "director-controls" && hasRequiredRole(workspace.roles, capability.requiredRoles))
}

export function canSelectWorkspace(workspaces: readonly SchoolWorkspace[], workspaceId: string) {
  return workspaces.some((workspace) => workspace.id === workspaceId)
}

export function roleLabelsForWorkspace(workspace: SchoolWorkspace) {
  return workspace.roles.map((role) => SCHOOL_ROLE_LABELS[role])
}
