import { createDatabaseClient } from "./db-client.mjs"

let database
try {
  database = createDatabaseClient({ requestedMode: "test" })
  const { client, runtime } = database
  await client.$connect()
  const probe = await client.databaseBootstrap.findUnique({ where: { id: "p1-03" } })

  if (!probe || probe.seedMarker !== "P1-03-SYNTHETIC") {
    throw new Error("DatabaseBootstrap seed marker is missing or incorrect")
  }

  console.info(`P1-03 database verification passed for ${runtime.mode}.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : "P1-03 database verification failed")
  process.exitCode = 1
} finally {
  await database?.client.$disconnect().catch((error) => {
    console.error(error instanceof Error ? error.message : "P1-03 database disconnect failed")
    process.exitCode = 1
  })
}
