import assert from "node:assert/strict"
import test from "node:test"

import {
  canSelectWorkspace,
  deferredCapabilitiesForWorkspace,
  navigationForWorkspace,
  roleLabelsForWorkspace,
  type SchoolWorkspace,
} from "../../src/components/app-shell/navigation.ts"

const financeWorkspace: SchoolWorkspace = {
  id: "school-finance",
  name: "โรงเรียนทดสอบการเงิน",
  smisCode: "10000001",
  roles: ["FINANCE_OFFICER"],
}

const adminDirectorWorkspace: SchoolWorkspace = {
  id: "school-admin-director",
  name: "โรงเรียนทดสอบผู้ดูแล",
  smisCode: "10000002",
  roles: ["SCHOOL_ADMIN", "SCHOOL_DIRECTOR"],
}

test("P1-11 exposes only implemented shell navigation for every workspace", () => {
  assert.deepEqual(
    navigationForWorkspace(financeWorkspace).map((item) => item.id),
    ["overview"],
  )
  assert.deepEqual(
    navigationForWorkspace(adminDirectorWorkspace).map((item) => item.id),
    ["overview", "director-controls"],
  )
})

test("P1-11 keeps role-specific commands out of navigation until their owning feature exists", () => {
  assert.deepEqual(
    deferredCapabilitiesForWorkspace(financeWorkspace).map((capability) => capability.id),
    ["financial-records"],
  )
  assert.deepEqual(
    deferredCapabilitiesForWorkspace(adminDirectorWorkspace).map((capability) => capability.id),
    ["school-account-request"],
  )
})

test("P1-11 workspace switching permits only the server-provided workspace set", () => {
  const workspaces = [financeWorkspace, adminDirectorWorkspace]

  assert.equal(canSelectWorkspace(workspaces, financeWorkspace.id), true)
  assert.equal(canSelectWorkspace(workspaces, adminDirectorWorkspace.id), true)
  assert.equal(canSelectWorkspace(workspaces, "other-school"), false)
})

test("P1-11 uses Thai role labels without inferring another role", () => {
  assert.deepEqual(roleLabelsForWorkspace(financeWorkspace), ["เจ้าหน้าที่การเงิน"])
  assert.deepEqual(roleLabelsForWorkspace(adminDirectorWorkspace), [
    "ผู้ดูแลระบบระดับสถานศึกษา",
    "ผู้อำนวยการสถานศึกษา",
  ])
})
