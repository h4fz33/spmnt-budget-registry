"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { AlertCircleIcon, KeyRoundIcon, RefreshCwIcon, SendIcon, UserRoundCogIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type School = Readonly<{ id: string; name: string; smisCode: string }>
type Membership = Readonly<{
  id: string
  identityId: string
  status: string
  identity: Readonly<{ displayName: string; accountIdentifier: string; accountStatus: string }>
  roleAssignments: readonly Readonly<{ id: string; role: string; status: string }>[]
}>
type Role = Readonly<{
  id: string
  role: string
  status: string
  membership: Readonly<{ identity: Readonly<{ displayName: string; accountIdentifier: string }> }>
}>
type Authority = Readonly<{ id: string; variant: string; status: string; effectiveFrom: string }>
type Credential = Readonly<{ id: string; operationType: string; status: string; identity: Readonly<{ displayName: string; accountIdentifier: string }> }>
type OrganizationSnapshot = Readonly<{ memberships: readonly Membership[]; roles: readonly Role[]; authorities: readonly Authority[]; credentials: readonly Credential[] }>
type AccountRequest = Readonly<{ id: string; status: string; targetDisplayName: string; requestedRole: string }>
type TechnicalSnapshot = Readonly<{
  approvedRequests: readonly Readonly<{ id: string; target: Readonly<{ displayName: string; accountIdentifier: string }>; school: Readonly<{ smisCode: string; organization: Readonly<{ nameTh: string }> }> }>[]
  recoveryApprovals: readonly Readonly<{ id: string; reasonCode: string; identity: Readonly<{ displayName: string; accountIdentifier: string }> }>[]
  credentials: readonly Credential[]
}>
type RequestDecision = Readonly<{ requestId: string; action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION" }>

const actingReasons = ["MEDICAL_LEAVE", "OFFICIAL_TRAVEL", "PERSONAL_LEAVE", "OTHER"]

function membershipLabel(membership: Membership) {
  return `${membership.identity.displayName} (${membership.identity.accountIdentifier})`
}

export function OrganizationLifecyclePanel({ schools, technical }: Readonly<{ schools: readonly School[]; technical: boolean }>) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "")
  const [snapshot, setSnapshot] = useState<OrganizationSnapshot | TechnicalSnapshot | null>(null)
  const [requests, setRequests] = useState<readonly AccountRequest[]>([])
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [decision, setDecision] = useState<RequestDecision | null>(null)
  const [decisionDetail, setDecisionDetail] = useState("")
  const [decisionReference, setDecisionReference] = useState("")

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const lifecycleUrl = technical ? "/api/admin/organization-lifecycle" : `/api/admin/organization-lifecycle?schoolId=${encodeURIComponent(schoolId)}`
      const lifecycleResponse = await fetch(lifecycleUrl, { cache: "no-store" })
      const lifecycleBody = await lifecycleResponse.json() as (OrganizationSnapshot | TechnicalSnapshot) & { error?: string }
      if (!lifecycleResponse.ok) throw new Error(lifecycleBody.error ?? "ไม่สามารถโหลดข้อมูลได้")
      setSnapshot(lifecycleBody)
      if (!technical) {
        const requestResponse = await fetch(`/api/admin/school-account-requests?schoolId=${encodeURIComponent(schoolId)}`, { cache: "no-store" })
        const requestBody = await requestResponse.json() as (readonly AccountRequest[]) & { error?: string }
        if (!requestResponse.ok) throw new Error(requestBody.error ?? "ไม่สามารถโหลดคิวคำขอได้")
        setRequests(requestBody)
      }
      setMessage("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้")
    } finally {
      setBusy(false)
    }
  }, [schoolId, technical])

  useEffect(() => { void load() }, [load])

  async function postLifecycle(action: string, payload: Record<string, unknown>) {
    setBusy(true)
    try {
      const response = await fetch("/api/admin/organization-lifecycle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      })
      const body = await response.json() as { error?: string; token?: string }
      if (!response.ok) throw new Error(body.error ?? "คำสั่งไม่สำเร็จ")
      await load()
      setMessage(body.token ? `รหัสครั้งเดียว: ${body.token}` : "ดำเนินการสำเร็จ")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "คำสั่งไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  function decideRequest(requestId: string, action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION") {
    setDecision({ requestId, action })
    setDecisionDetail("")
    setDecisionReference("")
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!decision || !decisionDetail.trim() || decision.action === "APPROVE" && !decisionReference.trim()) return
    const body: Record<string, unknown> = { action: decision.action, reason: { code: `P1_16_REQUEST_${decision.action}`, detail: decisionDetail.trim() } }
    if (decision.action === "APPROVE") body.verification = { outcome: "VERIFIED", reference: decisionReference.trim() }
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/school-account-requests/${encodeURIComponent(decision.requestId)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? "ไม่สามารถตัดสินคำขอได้")
      setDecision(null)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถตัดสินคำขอได้")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
      <header className="border-b border-border pb-5">
        <p className="text-xs text-muted-foreground">การควบคุมสิทธิ์และสมาชิกภาพ</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold">{technical ? "การดำเนินการข้อมูลรับรองทางเทคนิค" : "คิวจัดการองค์กร"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{technical ? "System Admin · ดำเนินการเฉพาะรายการที่ ESAO อนุมัติแล้ว" : "ESAO Admin · ขอบเขต 17 โรงเรียน"}</p>
      </header>

      {technical ? <TechnicalQueue snapshot={snapshot as TechnicalSnapshot | null} busy={busy} onIssue={(action, id) => void postLifecycle(action, action === "ISSUE_ACTIVATION" ? { requestId: id, reason: { code: "P1_16_ACTIVATION", detail: "Execute exact ESAO-approved request" } } : { approvalId: id, reason: { code: "P1_16_RECOVERY", detail: "Execute exact ESAO recovery approval" } })} /> : <>
        <section className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
          <label className="grid min-w-72 gap-1 text-sm font-medium">โรงเรียน
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name} · {school.smisCode}</option>)}</select>
          </label>
          <Button variant="outline" onClick={() => void load()} disabled={busy || !schoolId}><RefreshCwIcon className={busy ? "animate-spin" : ""} />โหลดสถานะ</Button>
        </section>
        <OrganizationQueues schoolId={schoolId} schools={schools} snapshot={snapshot as OrganizationSnapshot | null} busy={busy} onSubmit={postLifecycle} />
        <section aria-labelledby="request-queue-heading" className="border-t border-border pt-5">
          <h2 id="request-queue-heading" className="font-heading text-lg font-semibold">คิวคำขอบัญชีเจ้าหน้าที่การเงิน</h2>
          {decision ? <form className="mt-4 grid gap-3 border border-border p-4" onSubmit={submitDecision} aria-labelledby="request-decision-heading">
            <h3 id="request-decision-heading" className="font-heading text-base font-semibold">บันทึกผลการตัดสิน</h3>
            <label className="grid gap-1 text-sm font-medium">รายละเอียดเหตุผล<Input value={decisionDetail} onChange={(event) => setDecisionDetail(event.target.value)} required /></label>
            {decision.action === "APPROVE" ? <label className="grid gap-1 text-sm font-medium">อ้างอิงการตรวจสอบบัญชีทดสอบ<Input value={decisionReference} onChange={(event) => setDecisionReference(event.target.value)} required /></label> : null}
            <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}><SendIcon />ยืนยัน</Button><Button type="button" variant="outline" onClick={() => setDecision(null)} disabled={busy}>ยกเลิก</Button></div>
          </form> : null}
          <RequestQueue requests={requests} busy={busy} onDecide={decideRequest} />
        </section>
      </>}
      {message ? <p className="flex items-start gap-2 border-l-2 border-primary pl-3 text-sm" aria-live="polite"><AlertCircleIcon className="mt-0.5 size-4 shrink-0" />{message}</p> : null}
    </main>
  )
}

function OrganizationQueues({ schoolId, schools, snapshot, busy, onSubmit }: Readonly<{ schoolId: string; schools: readonly School[]; snapshot: OrganizationSnapshot | null; busy: boolean; onSubmit: (action: string, payload: Record<string, unknown>) => Promise<void> }>) {
  const memberships = useMemo(() => snapshot?.memberships ?? [], [snapshot])
  const activeMemberships = memberships.filter((membership) => membership.status === "ACTIVE" && membership.identity.accountStatus === "ACTIVE")
  const roles = snapshot?.roles ?? []
  const authorities = snapshot?.authorities ?? []
  const [action, setAction] = useState("SUSPEND_MEMBERSHIP")
  const [targetId, setTargetId] = useState("")
  const [membershipId, setMembershipId] = useState("")
  const [recordId, setRecordId] = useState("")
  const [toSchoolId, setToSchoolId] = useState("")
  const [variant, setVariant] = useState("ACTING_ESAO")
  const [reasonCode, setReasonCode] = useState("P1_16_ACTION")
  const [detail, setDetail] = useState("")
  const [evidenceReference, setEvidenceReference] = useState("")
  const [effectiveFrom, setEffectiveFrom] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [temporaryBasis, setTemporaryBasis] = useState("")

  const selectedMembership = useMemo(() => memberships.find((membership) => membership.id === membershipId), [memberships, membershipId])
  const requiresTarget = ["GRANT_SCHOOL_ADMIN", "REVOKE_SCHOOL_ADMIN", "ASSIGN_DIRECTOR", "APPROVE_RECOVERY"].includes(action)
  const requiresMembership = ["SUSPEND_MEMBERSHIP", "REMOVE_MEMBERSHIP", "ASSIGN_MEMBERSHIP_SCHOOL"].includes(action)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const reason = { code: reasonCode, detail }
    const payload: Record<string, unknown> = { reason }
    if (requiresMembership) payload.membershipId = membershipId
    if (requiresTarget) payload.targetIdentityId = targetId
    if (["GRANT_SCHOOL_ADMIN", "REVOKE_SCHOOL_ADMIN", "ASSIGN_DIRECTOR", "REVOKE_DIRECTOR", "CREATE_AUTHORITY"].includes(action)) payload.schoolId = schoolId
    if (action === "ASSIGN_MEMBERSHIP_SCHOOL") Object.assign(payload, { identityId: selectedMembership?.identityId, fromMembershipId: membershipId, toSchoolId, evidence: evidenceReference ? { reference: evidenceReference } : undefined })
    if (["GRANT_SCHOOL_ADMIN", "REVOKE_SCHOOL_ADMIN"].includes(action)) payload.evidence = evidenceReference ? { reference: evidenceReference } : undefined
    if (action === "ASSIGN_DIRECTOR") payload.appointmentEvidence = { reference: evidenceReference }
    if (action === "REVOKE_DIRECTOR") Object.assign(payload, { roleAssignmentId: recordId, evidence: { reference: evidenceReference } })
    if (action === "APPROVE_RECOVERY") payload.approvalReference = evidenceReference
    if (action === "CREATE_AUTHORITY") Object.assign(payload, { targetRoleAssignmentId: recordId, variant, effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : new Date().toISOString(), expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, temporaryBasis: temporaryBasis || undefined, evidence: evidenceReference ? { reference: evidenceReference } : undefined })
    if (action === "TRANSITION_AUTHORITY") payload.authorityId = recordId
    void onSubmit(action, payload)
  }

  return <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
    <div className="space-y-5">
      <QueueTable title="สมาชิกภาพและบทบาท" headers={["บัญชี", "สถานะ", "บทบาท"]} rows={memberships.map((membership) => [membershipLabel(membership), membership.status, membership.roleAssignments.map((role) => role.role).join(", ") || "-"])} />
      <QueueTable title="AUTH-14" headers={["ชนิด", "สถานะ", "มีผลตั้งแต่"]} rows={authorities.map((authority) => [authority.variant, authority.status, new Date(authority.effectiveFrom).toLocaleString("th-TH")])} />
    </div>
    <form className="border border-border p-4" onSubmit={submit}>
      <div className="flex items-center gap-2"><UserRoundCogIcon className="size-4 text-primary" /><h2 className="font-heading text-base font-semibold">คำสั่ง ESAO</h2></div>
      <label className="mt-4 grid gap-1 text-sm font-medium">คำสั่ง<select className="h-9 rounded-md border border-input bg-background px-2" value={action} onChange={(event) => { const nextAction = event.target.value; setAction(nextAction); if (nextAction === "CREATE_AUTHORITY") setReasonCode("MEDICAL_LEAVE") }}><option value="SUSPEND_MEMBERSHIP">ระงับสมาชิกภาพ</option><option value="REMOVE_MEMBERSHIP">ถอนสมาชิกภาพ</option><option value="ASSIGN_MEMBERSHIP_SCHOOL">ย้ายสถานศึกษา</option><option value="GRANT_SCHOOL_ADMIN">เพิ่มผู้ดูแลสถานศึกษา</option><option value="REVOKE_SCHOOL_ADMIN">ถอนผู้ดูแลสถานศึกษา</option><option value="ASSIGN_DIRECTOR">กำหนดผู้อำนวยการ</option><option value="REVOKE_DIRECTOR">ถอนผู้อำนวยการ</option><option value="APPROVE_RECOVERY">อนุมัติกู้คืนบัญชี</option><option value="CREATE_AUTHORITY">สร้าง AUTH-14</option><option value="TRANSITION_AUTHORITY">เปลี่ยนสถานะ AUTH-14</option></select></label>
      {requiresMembership ? <label className="mt-3 grid gap-1 text-sm font-medium">สมาชิกภาพ<select className="h-9 rounded-md border border-input bg-background px-2" value={membershipId} onChange={(event) => setMembershipId(event.target.value)} required><option value="">เลือกรายการ</option>{activeMemberships.map((membership) => <option key={membership.id} value={membership.id}>{membershipLabel(membership)}</option>)}</select></label> : null}
      {requiresTarget ? <label className="mt-3 grid gap-1 text-sm font-medium">ผู้รับสิทธิ์<select className="h-9 rounded-md border border-input bg-background px-2" value={targetId} onChange={(event) => setTargetId(event.target.value)} required><option value="">เลือกบัญชี</option>{activeMemberships.map((membership) => <option key={membership.identityId} value={membership.identityId}>{membershipLabel(membership)}</option>)}</select></label> : null}
      {action === "ASSIGN_MEMBERSHIP_SCHOOL" ? <label className="mt-3 grid gap-1 text-sm font-medium">สถานศึกษาปลายทาง<select className="h-9 rounded-md border border-input bg-background px-2" value={toSchoolId} onChange={(event) => setToSchoolId(event.target.value)} required><option value="">เลือกสถานศึกษา</option>{schools.filter((school) => school.id !== schoolId).map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label> : null}
      {["REVOKE_DIRECTOR", "CREATE_AUTHORITY", "TRANSITION_AUTHORITY"].includes(action) ? <RecordSelector action={action} roles={roles} authorities={authorities} value={recordId} onChange={setRecordId} /> : null}
      {action === "CREATE_AUTHORITY" ? <><label className="mt-3 grid gap-1 text-sm font-medium">ชนิด AUTH-14<select className="h-9 rounded-md border border-input bg-background px-2" value={variant} onChange={(event) => setVariant(event.target.value)}><option value="ACTING_ESAO">Acting โดย ESAO</option><option value="TEMPORARY">Temporary</option></select></label><label className="mt-3 grid gap-1 text-sm font-medium">เริ่มมีผล<Input type="datetime-local" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label>{variant === "TEMPORARY" ? <><label className="mt-3 grid gap-1 text-sm font-medium">สิ้นสุดผล<Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} required /></label><label className="mt-3 grid gap-1 text-sm font-medium">เหตุฐาน Temporary<Input value={temporaryBasis} onChange={(event) => setTemporaryBasis(event.target.value)} required /></label></> : null}</> : null}
      <label className="mt-3 grid gap-1 text-sm font-medium">รหัสเหตุผล{action === "CREATE_AUTHORITY" && variant !== "TEMPORARY" ? <select className="h-9 rounded-md border border-input bg-background px-2" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>{actingReasons.map((code) => <option key={code} value={code}>{code}</option>)}</select> : <Input value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} required />}</label>
      <label className="mt-3 grid gap-1 text-sm font-medium">รายละเอียดเหตุผล<Input value={detail} onChange={(event) => setDetail(event.target.value)} required /></label>
      {["ASSIGN_DIRECTOR", "REVOKE_DIRECTOR", "ASSIGN_MEMBERSHIP_SCHOOL", "APPROVE_RECOVERY"].includes(action) ? <label className="mt-3 grid gap-1 text-sm font-medium">อ้างอิงหลักฐาน<Input value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} required /></label> : null}
      <Button className="mt-5 w-full" type="submit" disabled={busy}><SendIcon />บันทึกคำสั่ง</Button>
    </form>
  </section>
}

function RecordSelector({ action, roles, authorities, value, onChange }: Readonly<{ action: string; roles: readonly Role[]; authorities: readonly Authority[]; value: string; onChange: (value: string) => void }>) {
  return <label className="mt-3 grid gap-1 text-sm font-medium">รายการ<select className="h-9 rounded-md border border-input bg-background px-2" value={value} onChange={(event) => onChange(event.target.value)} required><option value="">เลือกรายการ</option>{action === "TRANSITION_AUTHORITY" ? authorities.filter((authority) => ["SCHEDULED", "IN_FORCE"].includes(authority.status)).map((authority) => <option key={authority.id} value={authority.id}>{authority.variant} · {authority.status}</option>) : action === "REVOKE_DIRECTOR" ? roles.filter((role) => role.role === "SCHOOL_DIRECTOR" && role.status === "ACTIVE").map((role) => <option key={role.id} value={role.id}>{role.membership.identity.displayName}</option>) : roles.filter((role) => ["FINANCE_OFFICER", "SCHOOL_ADMIN"].includes(role.role) && role.status === "ACTIVE").map((role) => <option key={role.id} value={role.id}>{role.membership.identity.displayName} · {role.role}</option>)}</select></label>
}

function TechnicalQueue({ snapshot, busy, onIssue }: Readonly<{ snapshot: TechnicalSnapshot | null; busy: boolean; onIssue: (action: "ISSUE_ACTIVATION" | "ISSUE_RECOVERY", id: string) => void }>) {
  return <section className="grid gap-5 xl:grid-cols-2"><QueueTable title="รายการเปิดใช้งานที่อนุมัติแล้ว" headers={["บัญชี", "สถานศึกษา", "ดำเนินการ"]} rows={(snapshot?.approvedRequests ?? []).map((request) => [request.target.displayName, `${request.school.organization.nameTh} · ${request.school.smisCode}`, <Button key={request.id} size="sm" disabled={busy} onClick={() => onIssue("ISSUE_ACTIVATION", request.id)}><KeyRoundIcon />ออกข้อมูลเปิดใช้งาน</Button>])} /><QueueTable title="รายการกู้คืนที่ ESAO อนุมัติแล้ว" headers={["บัญชี", "เหตุผล", "ดำเนินการ"]} rows={(snapshot?.recoveryApprovals ?? []).map((approval) => [approval.identity.displayName, approval.reasonCode, <Button key={approval.id} size="sm" disabled={busy} onClick={() => onIssue("ISSUE_RECOVERY", approval.id)}><KeyRoundIcon />ออกข้อมูลกู้คืน</Button>])} /><QueueTable title="ประวัติข้อมูลรับรองล่าสุด" headers={["บัญชี", "ชนิด", "สถานะ"]} rows={(snapshot?.credentials ?? []).map((credential) => [credential.identity.displayName, credential.operationType, credential.status])} /></section>
}

function RequestQueue({ requests, busy, onDecide }: Readonly<{ requests: readonly AccountRequest[]; busy: boolean; onDecide: (id: string, action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION") => void }>) {
  return <QueueTable title="" headers={["ผู้ขอ", "บทบาท", "สถานะ", "การตัดสิน"]} rows={requests.map((request) => [request.targetDisplayName, request.requestedRole, request.status, <span key={request.id} className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => void onDecide(request.id, "APPROVE")}>อนุมัติ</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void onDecide(request.id, "REQUEST_CORRECTION")}>ขอแก้ไข</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void onDecide(request.id, "REJECT")}>ปฏิเสธ</Button></span>])} empty="ไม่มีคำขอรอการตัดสิน" />
}

function QueueTable({ title, headers, rows, empty = "ไม่มีรายการ" }: Readonly<{ title: string; headers: readonly string[]; rows: readonly (readonly ReactNode[])[]; empty?: string }>) {
  return <div className="overflow-x-auto border border-border"><table className="w-full text-left text-sm">{title ? <caption className="border-b border-border p-3 text-left font-heading font-semibold">{title}</caption> : null}<thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="p-3">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3">{cell}</td>)}</tr>)}{rows.length === 0 ? <tr><td className="p-3 text-muted-foreground" colSpan={headers.length}>{empty}</td></tr> : null}</tbody></table></div>
}
