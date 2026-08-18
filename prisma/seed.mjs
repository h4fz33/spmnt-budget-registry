import { createDatabaseClient } from "../scripts/db-client.mjs"

let database
try {
  database = createDatabaseClient()
  const { client, runtime } = database
  const result = await client.databaseBootstrap.upsert({
    where: { id: "p1-03" },
    create: {
      id: "p1-03",
      seedMarker: "P1-03-SYNTHETIC",
    },
    update: {
      seedMarker: "P1-03-SYNTHETIC",
    },
  })

  console.info(`Synthetic database seed applied for ${runtime.mode}: ${result.seedMarker}.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : "Database seed failed")
  process.exitCode = 1
} finally {
  await database?.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "Database seed disconnect failed")
    process.exitCode = 1
  })
}
