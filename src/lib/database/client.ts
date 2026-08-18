import "server-only"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../../generated/prisma/client"
import { getServerEnvironment } from "../env"

const globalForDatabase = globalThis as unknown as {
  prisma?: PrismaClient
}

function createDatabaseClient() {
  const environment = getServerEnvironment()
  const adapter = new PrismaPg(environment.databaseUrl)

  return new PrismaClient({
    adapter,
    transactionOptions: {
      isolationLevel: "Serializable",
    },
  })
}

export const prisma = globalForDatabase.prisma ?? createDatabaseClient()

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.prisma = prisma
}

export default prisma

