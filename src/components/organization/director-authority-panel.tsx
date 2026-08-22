"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { AlertCircleIcon, RefreshCwIcon, RotateCcwIcon, SendIcon, UserRoundCogIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type School = Readonly<{ id: string; name: string; smisCode: string }>
type Subject = Readonly<{
  roleAssignmentId: string
  role: "FINANCE_OFFICER" | "SCHOOL_ADMIN"
  identity: Readonly<{ displayName: string; accountIdentifier: string }>
}>
type Authority = Readonly<{
  id: string
  variant: "ACTING_DIRECTOR" | "ACTING_ESAO" | "TEMPORARY"
  status: string
  effectiveFrom: string
  expiresAt: string | null
  actingReasonCode: string | null
  reasonDetail: string | null
}>
type Snapshot = Readonly<{ school: School; subjects: readonly Subject[]; authorities: readonly Authority[] }>

const actingReasons = ["MEDICAL_LEAVE", "OFFICIAL_TRAVEL", "PERSONAL_LEAVE", "OTHER"] as const

function subjectLabel(subject: Subject) {
  const role = subject.role === "FINANCE_OFFICER" ? "เจ้าหน้าที่การเงิน" : "ผู้ดูแลระบบระดับสถานศึกษา"
  return `${subject.identity.displayName} (${subject.identity.accountIdentifier}) · ${role}`
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("th-TH") : "ไม่กำหนด"
}

export function DirectorAuthorityPanel({ principal, schools }: Readonly<{ principal: string; schools: readonly School[] }>) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "")
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [subjectId, setSubjectId] = useState("")
  const [reasonCode, setReasonCode] = useState<(typeof actingReasons)[number]>("MEDICAL_LEAVE")
  const [detail, setDetail] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!schoolId) return
    setBusy(true)
    try {
      const response = await fetch(`/api/director/authority?schoolId=${encodeURIComponent(schoolId)}`, { cache: "no-store" })
      const body = await response.json() as Snapshot & { error?: string }
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถโหลดสถานะได้")
      setSnapshot(body)
      setSubjectId((current) => body.subjects.some((subject) => subject.roleAssignmentId === current) ? current : body.subjects[0]?.roleAssignmentId ?? "")
      setMessage("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดสถานะได้")
    } finally {
      setBusy(false)
    }
  }, [schoolId])

  useEffect(() => { void load() }, [load])

  async function post(action: "CREATE_AUTHORITY" | "TRANSITION_AUTHORITY", payload: Record<string, unknown>) {
    setBusy(true)
    try {
      const response = await fetch("/api/director/authority", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) })
      const body = await response.json() as { error?: string }
      if (!response.ok) throw new Error(body.error ?? "คำสั่งไม่สำเร็จ")
      await load()
      setMessage("ดำเนินการสำเร็จ")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "คำสั่งไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!schoolId || !subjectId || !detail.trim()) return
    void post("CREATE_AUTHORITY", {
      schoolId,
      targetRoleAssignmentId: subjectId,
      variant: "ACTING_DIRECTOR",
      effectiveFrom: new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      reason: { code: reasonCode, detail: detail.trim() },
    })
  }

  const returnableAuthorities = useMemo(
    () => snapshot?.authorities.filter((authority) => authority.variant === "ACTING_DIRECTOR" && authority.status === "IN_FORCE") ?? [],
    [snapshot],
  )

  return (
    <main className="mx-auto flex w-full max-w-[72rem] flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
      <header className="border-b border-border pb-5">
        <p className="text-xs text-muted-foreground">การควบคุมอำนาจผู้อำนวยการ</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold">การแต่งตั้งรักษาการ</h1>
        <p className="mt-1 text-sm text-muted-foreground">{principal} · AUTH-14/DIRECTOR</p>
      </header>

      {schools.length > 1 ? <label className="grid max-w-xl gap-1 text-sm font-medium">สถานศึกษา
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={schoolId} onChange={(event) => setSchoolId(event.target.value)} disabled={busy}>
          {schools.map((school) => <option key={school.id} value={school.id}>{school.name} · {school.smisCode}</option>)}
        </select>
      </label> : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <form className="border border-border p-5" onSubmit={submit}>
          <div className="flex items-center gap-2"><UserRoundCogIcon className="size-4 text-primary" aria-hidden="true" /><h2 className="font-heading text-base font-semibold">สร้างผู้รักษาการ</h2></div>
          <label className="mt-4 grid gap-1 text-sm font-medium">ผู้รับหน้าที่
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required disabled={busy || !snapshot?.subjects.length}>
              <option value="">เลือกเจ้าหน้าที่การเงินหรือผู้ดูแลสถานศึกษา</option>
              {(snapshot?.subjects ?? []).map((subject) => <option key={subject.roleAssignmentId} value={subject.roleAssignmentId}>{subjectLabel(subject)}</option>)}
            </select>
          </label>
          <label className="mt-3 grid gap-1 text-sm font-medium">เหตุผล
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={reasonCode} onChange={(event) => setReasonCode(event.target.value as (typeof actingReasons)[number])} disabled={busy}>
              {actingReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </label>
          <label className="mt-3 grid gap-1 text-sm font-medium">รายละเอียดเหตุผล<Input value={detail} onChange={(event) => setDetail(event.target.value)} required disabled={busy} /></label>
          <label className="mt-3 grid gap-1 text-sm font-medium">สิ้นสุดผล (ไม่บังคับ)<Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} disabled={busy} /></label>
          <Button className="mt-5 w-full" type="submit" disabled={busy || !snapshot?.subjects.length}><SendIcon />บันทึกการแต่งตั้ง</Button>
        </form>

        <section className="border border-border p-5" aria-labelledby="authority-history-heading">
          <div className="flex items-center justify-between gap-3"><h2 id="authority-history-heading" className="font-heading text-base font-semibold">ประวัติ AUTH-14</h2><Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}><RefreshCwIcon className={busy ? "animate-spin" : ""} />โหลด</Button></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="p-2">ชนิด</th><th className="p-2">สถานะ</th><th className="p-2">เริ่ม</th><th className="p-2">สิ้นสุด</th></tr></thead><tbody>{(snapshot?.authorities ?? []).map((authority) => <tr key={authority.id} className="border-b border-border"><td className="p-2">{authority.variant}</td><td className="p-2">{authority.status}</td><td className="p-2 whitespace-nowrap">{formatDate(authority.effectiveFrom)}</td><td className="p-2 whitespace-nowrap">{formatDate(authority.expiresAt)}</td></tr>)}{!snapshot?.authorities.length ? <tr><td className="p-2 text-muted-foreground" colSpan={4}>ไม่มีรายการ</td></tr> : null}</tbody></table></div>
          {returnableAuthorities.map((authority) => <Button key={authority.id} className="mt-4 w-full" variant="outline" disabled={busy} onClick={() => void post("TRANSITION_AUTHORITY", { authorityId: authority.id, reason: { code: "RETURN", detail: "Active School Director has resumed duties" } })}><RotateCcwIcon />ยืนยันการกลับมาปฏิบัติหน้าที่</Button>)}
        </section>
      </section>

      {message ? <p className="flex items-start gap-2 border-l-2 border-primary pl-3 text-sm" aria-live="polite"><AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{message}</p> : null}
    </main>
  )
}
