import type { PrismaClient } from "../generated/prisma/client"

export type DatabaseRuntime = Readonly<{
  mode: "development" | "test"
  databaseName: string
  databaseUrl: string
  hostname: string
}>

export declare function createDatabaseClient(options?: {
  requestedMode?: "development" | "test"
}): {
  client: PrismaClient
  runtime: DatabaseRuntime
}

