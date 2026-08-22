"use client"

import { useState } from "react"
import { CheckCircle2Icon, KeyRoundIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CredentialConsumptionForm() {
  const [accountIdentifier, setAccountIdentifier] = useState("")
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmation) {
      setMessage("รหัสผ่านยืนยันไม่ตรงกัน")
      return
    }
    setBusy(true)
    try {
      const response = await fetch("/api/credential/consume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountIdentifier, token, password }),
      })
      const body = await response.json() as { error?: string }
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถตั้งรหัสผ่านได้")
      setToken("")
      setPassword("")
      setConfirmation("")
      setMessage("ตั้งรหัสผ่านเรียบร้อยแล้ว")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถตั้งรหัสผ่านได้")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background p-4">
      <form className="w-full max-w-md border border-border bg-card p-6 shadow-sm" onSubmit={(event) => void submit(event)}>
        <KeyRoundIcon className="size-5 text-primary" aria-hidden="true" />
        <h1 className="mt-3 font-heading text-xl font-semibold">ตั้งรหัสผ่านบัญชี</h1>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">บัญชีผู้ใช้<Input className="mt-1" value={accountIdentifier} onChange={(event) => setAccountIdentifier(event.target.value)} autoComplete="username" required /></label>
          <label className="block text-sm font-medium">รหัสใช้งานครั้งเดียว<Input className="mt-1" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="one-time-code" required /></label>
          <label className="block text-sm font-medium">รหัสผ่านใหม่<Input className="mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <label className="block text-sm font-medium">ยืนยันรหัสผ่าน<Input className="mt-1" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
        </div>
        <Button className="mt-5 w-full" type="submit" disabled={busy}>{busy ? "กำลังบันทึก" : "ตั้งรหัสผ่าน"}</Button>
        {message ? <p className="mt-4 flex items-start gap-2 text-sm" aria-live="polite"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />{message}</p> : null}
      </form>
    </main>
  )
}
