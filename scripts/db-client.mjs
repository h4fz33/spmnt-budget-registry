import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client.ts"
import { getDatabaseRuntime } from "./db-runtime.mjs"

export function createDatabaseClient(options = {}) {
  const runtime = getDatabaseRuntime(options)
  const adapter = new PrismaPg(runtime.databaseUrl)
  const client = new PrismaClient({
    adapter,
    transactionOptions: {
      isolationLevel: "Serializable",
    },
  })

  return { client, runtime }
}
