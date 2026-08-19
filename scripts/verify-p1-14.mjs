import assert from "node:assert/strict"

import { getPilotEsao, loadSchoolDirectory } from "../prisma/school-directory-seed.mjs"
import { createDatabaseClient } from "./db-client.mjs"

const directory = await loadSchoolDirectory()
const esao = getPilotEsao(process.env.SCHOOL_SEED_ESAO_CODE?.trim())
const database = createDatabaseClient({ requestedMode: "test" })

try {
  const parent = await database.client.organization.findUniqueOrThrow({
    where: { id: esao.organizationId },
  })
  assert.deepEqual(
    {
      type: parent.type,
      status: parent.status,
      nameTh: parent.nameTh,
      nameEn: parent.nameEn,
      parentOrganizationId: parent.parentOrganizationId,
    },
    {
      type: "ESAO",
      status: "ACTIVE",
      nameTh: esao.nameTh,
      nameEn: esao.nameEn,
      parentOrganizationId: null,
    },
    "P1-14 parent ESAO does not match the approved explicit configuration",
  )

  const persistedSchools = await database.client.school.findMany({
    where: { moeCode: { in: directory.map((row) => row.moeCode) } },
    include: { organization: true },
  })
  assert.equal(persistedSchools.length, directory.length, "P1-14 School Directory is incomplete")

  const schoolsByMoeCode = new Map(persistedSchools.map((school) => [school.moeCode, school]))
  for (const row of directory) {
    const school = schoolsByMoeCode.get(row.moeCode)
    assert.ok(school, `P1-14 School Directory is missing MOE ${row.moeCode}`)
    assert.equal(school.smisCode, row.smisCode, `P1-14 SMIS mismatch for MOE ${row.moeCode}`)
    assert.equal(school.organization.nameTh, row.schoolName, `P1-14 name mismatch for MOE ${row.moeCode}`)
    assert.equal(
      school.organization.parentOrganizationId,
      esao.organizationId,
      `P1-14 parent mismatch for MOE ${row.moeCode}`,
    )
  }

  console.info("P1-14 School Directory verification passed.")
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-14 School Directory verification failed")
  process.exitCode = 1
} finally {
  await database.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-14 verifier disconnect failed")
    process.exitCode = 1
  })
}
