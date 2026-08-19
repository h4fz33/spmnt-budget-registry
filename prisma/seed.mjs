import { createDatabaseClient } from "../scripts/db-client.mjs"
import { applySchoolDirectorySeed, loadSchoolDirectory } from "./school-directory-seed.mjs"

let database
try {
  database = createDatabaseClient()
  const { client, runtime } = database
  const directory = await loadSchoolDirectory()
  const result = await client.$transaction(async (transaction) => {
    const bootstrap = await transaction.databaseBootstrap.upsert({
      where: { id: "p1-03" },
      create: {
        id: "p1-03",
        seedMarker: "P1-03-SYNTHETIC",
      },
      update: {
        seedMarker: "P1-03-SYNTHETIC",
      },
    })
    const schoolDirectory = await applySchoolDirectorySeed(transaction, {
      directory,
      esaoCode: process.env.SCHOOL_SEED_ESAO_CODE?.trim(),
    })

    return { bootstrap, schoolDirectory }
  })

  console.info(
    `Synthetic database seed applied for ${runtime.mode}: ${result.bootstrap.seedMarker}; ` +
      `School Directory created ${result.schoolDirectory.createdSchoolCount}, unchanged ${result.schoolDirectory.unchangedSchoolCount}.`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : "Database seed failed")
  process.exitCode = 1
} finally {
  await database?.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "Database seed disconnect failed")
    process.exitCode = 1
  })
}
