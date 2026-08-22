"use client"

import Link from "next/link"
import { type ReactNode, useState } from "react"
import {
  Building2Icon,
  CircleAlertIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UserRoundCogIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  canSelectWorkspace,
  navigationForWorkspace,
  roleLabelsForWorkspace,
  type SchoolWorkspace,
} from "./navigation"

type ShellPrincipal = Readonly<{
  displayName: string
}>

type ApplicationShellProps = Readonly<{
  principal: ShellPrincipal
  workspaces: readonly SchoolWorkspace[]
}>

function initialsFor(name: string) {
  return name.trim().slice(0, 2) || "ผ"
}

function RoleBadge({ label }: Readonly<{ label: string }>) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-md border border-border bg-background px-2 text-xs text-foreground">
      {label}
    </span>
  )
}

function WorkspaceSwitcher({
  activeWorkspace,
  workspaces,
  onWorkspaceChange,
}: Readonly<{
  activeWorkspace: SchoolWorkspace
  workspaces: readonly SchoolWorkspace[]
  onWorkspaceChange: (workspaceId: string) => void
}>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="เปลี่ยนพื้นที่ทำงาน"
        render={
          <Button variant="outline" size="lg" className="max-w-[20rem] justify-start text-left sm:min-w-72">
            <Building2Icon />
            <span className="min-w-0 truncate">{activeWorkspace.name}</span>
          </Button>
        }>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-72">
        <DropdownMenuLabel>พื้นที่ทำงานที่ได้รับอนุญาต</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={activeWorkspace.id}
          onValueChange={(workspaceId) => {
            if (canSelectWorkspace(workspaces, workspaceId)) {
              onWorkspaceChange(workspaceId)
            }
          }}>
          {workspaces.map((workspace) => (
            <DropdownMenuRadioItem key={workspace.id} value={workspace.id}>
              <span className="min-w-0">
                <span className="block truncate">{workspace.name}</span>
                <span className="block text-[0.6875rem] text-muted-foreground">รหัส SMIS {workspace.smisCode}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function WorkspaceSidebar({
  principal,
  activeWorkspace,
}: Readonly<{
  principal: ShellPrincipal
  activeWorkspace: SchoolWorkspace
}>) {
  const navigation = navigationForWorkspace(activeWorkspace)

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 py-4">
        <Link href="/" className="flex items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <LandmarkIcon className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-heading text-sm font-semibold">SchoolBanchee</span>
            <span className="block truncate text-[0.6875rem] text-sidebar-foreground/70">ระบบควบคุมการเงินสถานศึกษา</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนู</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive
                    tooltip={item.label}
                    render={<Link href={item.href} aria-current="page" />}>
                    {item.id === "director-controls" ? <UserRoundCogIcon /> : <LayoutDashboardIcon />}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>สิทธิ์ในพื้นที่นี้</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1 px-2 pb-2">
            {roleLabelsForWorkspace(activeWorkspace).map((role) => (
              <RoleBadge key={role} label={role} />
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initialsFor(principal.displayName)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-xs">{principal.displayName}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function WorkspaceOverview({ activeWorkspace }: Readonly<{ activeWorkspace: SchoolWorkspace }>) {
  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
      <section aria-labelledby="workspace-heading" className="border-b border-border pb-5">
        <p className="text-xs text-muted-foreground">พื้นที่ทำงานสถานศึกษา</p>
        <h1 id="workspace-heading" className="mt-1 font-heading text-2xl font-semibold text-foreground">
          {activeWorkspace.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">รหัส SMIS {activeWorkspace.smisCode}</p>
      </section>

      <section aria-labelledby="access-heading" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="access-heading" className="font-heading text-base font-semibold">สิทธิ์การใช้งานปัจจุบัน</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {roleLabelsForWorkspace(activeWorkspace).map((role) => (
                  <RoleBadge key={role} label={role} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <aside aria-label="สถานะข้อมูล" className="border border-border bg-muted/35 p-5">
          <p className="text-xs text-muted-foreground">ขอบเขตข้อมูล</p>
          <p className="mt-1 text-sm font-medium">ข้อมูลทดสอบสังเคราะห์</p>
          <p className="mt-2 text-xs/relaxed text-muted-foreground">การดำเนินการทางธุรกิจจะแสดงเมื่อโมดูลและสิทธิ์ที่เกี่ยวข้องพร้อมใช้งาน</p>
        </aside>
      </section>

      <section aria-labelledby="empty-actions-heading" className="border border-dashed border-border bg-background p-6">
        <div className="flex items-start gap-3">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 id="empty-actions-heading" className="font-heading text-base font-semibold">ยังไม่มีรายการที่เปิดใช้งาน</h2>
            <p className="mt-1 text-sm text-muted-foreground">หน้านี้แสดงเฉพาะพื้นที่ทำงานที่ได้รับอนุญาตในขณะนี้</p>
          </div>
        </div>
        <Link href="/admin/organization" className="mt-4 inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted">
          จัดการวงจรชีวิตองค์กร
        </Link>
      </section>
    </div>
  )
}

export function ApplicationShell({ principal, workspaces }: ApplicationShellProps) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaces[0]?.id ?? "")
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0]

  if (!activeWorkspace) {
    return <NoWorkspaceState principal={principal} />
  }

  return (
    <SidebarProvider>
      <WorkspaceSidebar principal={principal} activeWorkspace={activeWorkspace} />
      <SidebarInset>
        <header className="flex min-h-14 items-center gap-3 border-b border-border px-4 md:px-6 lg:px-8">
          <SidebarTrigger aria-label="เปิดหรือปิดเมนู" title="เปิดหรือปิดเมนู" />
          <WorkspaceSwitcher
            activeWorkspace={activeWorkspace}
            workspaces={workspaces}
            onWorkspaceChange={setActiveWorkspaceId}
          />
          <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <UserRoundIcon className="size-4" aria-hidden="true" />
            <span className="max-w-40 truncate">{principal.displayName}</span>
          </div>
        </header>
        <WorkspaceOverview activeWorkspace={activeWorkspace} />
      </SidebarInset>
    </SidebarProvider>
  )
}

export function SessionRequiredState() {
  return (
    <ShellStateFrame>
      <CircleAlertIcon className="size-5 text-destructive" aria-hidden="true" />
      <h1 className="mt-3 font-heading text-xl font-semibold">ต้องเข้าสู่ระบบก่อนเข้าใช้งาน</h1>
      <p className="mt-2 text-sm text-muted-foreground">ไม่พบเซสชันที่ใช้งานได้สำหรับพื้นที่ทำงานนี้</p>
    </ShellStateFrame>
  )
}

export function NoWorkspaceState({ principal }: Readonly<{ principal: ShellPrincipal }>) {
  return (
    <ShellStateFrame>
      <Building2Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-3 font-heading text-xl font-semibold">ยังไม่มีพื้นที่ทำงานที่ได้รับอนุญาต</h1>
      <p className="mt-2 text-sm text-muted-foreground">{principal.displayName} ไม่มีการเป็นสมาชิกสถานศึกษาที่มีผลในขณะนี้</p>
    </ShellStateFrame>
  )
}

export function UnavailableWorkspaceState() {
  return (
    <ShellStateFrame>
      <CircleAlertIcon className="size-5 text-destructive" aria-hidden="true" />
      <h1 className="mt-3 font-heading text-xl font-semibold">ไม่สามารถโหลดพื้นที่ทำงานได้</h1>
      <p className="mt-2 text-sm text-muted-foreground">กรุณาลองใหม่อีกครั้ง</p>
      <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
        <RefreshCwIcon />
        ลองใหม่
      </Button>
    </ShellStateFrame>
  )
}

export function ShellLoadingState() {
  return (
    <div className="min-h-svh bg-background p-4 md:p-6">
      <div className="mx-auto max-w-[90rem] space-y-5">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-32" />
      </div>
    </div>
  )
}

function ShellStateFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-4">
      <section className="w-full max-w-lg border border-border bg-card p-6 shadow-sm" aria-live="polite">
        {children}
      </section>
    </main>
  )
}
