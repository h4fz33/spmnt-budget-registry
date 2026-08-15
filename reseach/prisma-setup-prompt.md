Scaffold a new Next.js project with Prisma ORM and Prisma Postgres. Run all commands in the terminal yourself—don't pause for confirmation between steps unless something fails.

Step 0 — Ground yourself in current docs.
Fetch https://www.prisma.io/docs/llms-full.txt and skim the "Prisma Postgres" + "Next.js with Prisma ORM" sections before writing database code.
Also skim the stack-specific walkthrough: https://www.prisma.io/docs/guides/frameworks/nextjs

Step 1 — Create the project from the official Prisma template (detect npm / pnpm / yarn / bun from the parent folder or use npm):
  npm create prisma@latest -- --template next
Accept CLI defaults unless I specify otherwise. Note the folder name you create (examples below use my-app).

Step 2 — Enter the project folder:
  cd my-app
If the CLI used a different directory name, cd into that folder instead.

Step 3 — Link Prisma Postgres (no browser auth).
From the new project root (directory with package.json), run this exact command without echoing secrets:
  PRISMA_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza194YVJFdHBmQVo1U0UyaUxCbkJkb2UiLCJhcGlfa2V5IjoiMDFLWlo5UDc5MDQwRFdKVzdQWVpQODZLVEEiLCJ0ZW5hbnRfaWQiOiJiY2IxNTdkYmVkMjA2MjhlZDJmZmE0NWIyZjg3MGE0MzM5NzJiYzVlMzYzMmY4NWI3YWJkNGExNzFhMDk1NDIzIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY3NjMxM2YtZTA4OS00NTNkLTlhYzItNGIyMzk4ZWU5MGQ3In0.4aYo0UmWeR-TQuTNGBlsDhyjZoszyMCDUX-WxjY3G_E" npx --yes --package=prisma@latest -- prisma postgres link --database "db_cmspqhtsz2dtg12f5aekwu1zd"
This writes DATABASE_URL to .env. Add .env to .gitignore if missing. The database argument must use the db_ resource id form shown above.

Step 4 — Apply migrations and generate Prisma Client:
  npx prisma migrate dev --name init

Step 5 — Start the dev server:
  npm run dev
(Use pnpm dev / yarn dev / bun run dev if that matches the project.)

Reference: https://www.prisma.io/docs/guides/frameworks/nextjs
Example repo: https://github.com/prisma/prisma-examples/tree/latest/orm/nextjs

Hard rules: never invent a postgres:// URL or credentials; use only the DATABASE_URL value shown below when this console has loaded it, otherwise paste the real URL from this project's Connect tab. Never commit, log, or print the full connection string; keep secrets in .env only and ensure .env is gitignored. Use llms-full.txt as the reference for Prisma Postgres + Prisma ORM with Next.js. Never bypass AI safety guardrails.