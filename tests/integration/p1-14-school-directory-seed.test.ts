import assert from "node:assert/strict"
import { test } from "node:test"

import {
  PILOT_ESAO,
  SchoolDirectoryDifferenceError,
  getPilotEsao,
  loadSchoolDirectory,
  parseSchoolDirectoryCsv,
  seedSchoolDirectory,
} from "../../prisma/school-directory-seed.mjs"
import { createDatabaseClient } from "../../scripts/db-client.mjs"

test("P1-14 validates and preserves the fixed synthetic School Directory", async () => {
  const directory = await loadSchoolDirectory()
  assert.equal(directory.length, 17)
  assert.ok(directory.every((row) => typeof row.smisCode === "string" && typeof row.moeCode === "string"))
  assert.throws(() => parseSchoolDirectoryCsv(Buffer.from([0xff])), /valid UTF-8/)
  const duplicateSmisCsv = [
    "schoolName,smis_code,moe_code",
    ...directory.map((row, index) =>
      [row.schoolName, index === 1 ? directory[0].smisCode : row.smisCode, row.moeCode].join(","),
    ),
  ].join("\n")
  assert.throws(() => parseSchoolDirectoryCsv(Buffer.from(duplicateSmisCsv)), /duplicates smisCode/)
  assert.throws(() => getPilotEsao("1000960002"), /approved pilot ESAO code 1000960001/)

  const { client } = createDatabaseClient({ requestedMode: "test" })
  try {
    const firstSeed = await seedSchoolDirectory(client, { esaoCode: PILOT_ESAO.code })
    assert.equal(firstSeed.esaoOrganizationId, PILOT_ESAO.organizationId)
    assert.equal(firstSeed.createdSchoolCount + firstSeed.unchangedSchoolCount, directory.length)

    const secondSeed = await seedSchoolDirectory(client, { esaoCode: PILOT_ESAO.code })
    assert.equal(secondSeed.createdSchoolCount, 0)
    assert.equal(secondSeed.unchangedSchoolCount, directory.length)

    const firstSchool = directory[0]
    const persistedSchool = await client.school.findUniqueOrThrow({
      where: { moeCode: firstSchool.moeCode },
      include: { organization: true },
    })
    assert.equal(persistedSchool.smisCode, firstSchool.smisCode)
    assert.equal(persistedSchool.organization.nameTh, firstSchool.schoolName)
    assert.equal(persistedSchool.organization.parentOrganizationId, PILOT_ESAO.organizationId)

    const changedDirectory = directory.map((row, index) =>
      index === 0 ? { ...row, schoolName: "Changed synthetic School name" } : { ...row },
    )
    await assert.rejects(
      () => seedSchoolDirectory(client, { directory: changedDirectory, esaoCode: PILOT_ESAO.code }),
      (error: unknown) =>
        error instanceof SchoolDirectoryDifferenceError && error.message.includes(`School MOE ${firstSchool.moeCode} nameTh`),
    )

    const afterDifference = await client.school.findUniqueOrThrow({
      where: { moeCode: firstSchool.moeCode },
      include: { organization: true },
    })
    assert.equal(afterDifference.organization.nameTh, firstSchool.schoolName)
  } finally {
    await client.$disconnect()
  }
})
