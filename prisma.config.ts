import "./scripts/load-env.mjs";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types prisma/seed.mjs",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
