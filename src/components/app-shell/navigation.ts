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
  id: "overview"
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

export function navigationForWorkspace(_workspace: SchoolWorkspace) {
  // The Phase 1 shell exposes only routes that exist today. Role-specific
  // commands remain out of navigation until their owning feature is complete.
  return shellNavigation
}

export function deferredCapabilitiesForWorkspace(workspace: SchoolWorkspace) {
  return deferredCapabilities.filter((capability) => hasRequiredRole(workspace.roles, capability.requiredRoles))
}

export function canSelectWorkspace(workspaces: readonly SchoolWorkspace[], workspaceId: string) {
  return workspaces.some((workspace) => workspace.id === workspaceId)
}

export function roleLabelsForWorkspace(workspace: SchoolWorkspace) {
  return workspace.roles.map((role) => SCHOOL_ROLE_LABELS[role])
}
