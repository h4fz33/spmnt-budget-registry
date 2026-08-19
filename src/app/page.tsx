import {
  ApplicationShell,
  NoWorkspaceState,
  SessionRequiredState,
  UnavailableWorkspaceState,
} from "@/components/app-shell/application-shell"
import { getActiveSession } from "@/lib/auth/server-session"
import { loadCurrentSchoolWorkspaces } from "./_data/workspaces"

export default async function Home() {
  try {
    const session = await getActiveSession()
    if (!session?.user) {
      return <SessionRequiredState />
    }

    const principal = {
      displayName: session.user.name?.trim() || "ผู้ใช้ที่ได้รับอนุมัติ",
    }
    const workspaces = await loadCurrentSchoolWorkspaces(session.user.id)

    if (workspaces.length === 0) {
      return <NoWorkspaceState principal={principal} />
    }

    return <ApplicationShell principal={principal} workspaces={workspaces} />
  } catch {
    // Session and workspace resolution must fail closed at the application boundary.
    return <UnavailableWorkspaceState />
  }
}
