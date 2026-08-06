# SchoolBanchee

School financial accounting, budget control, registry monitoring, and audit support for Thai subsidiary school units.

## Project Documentation

- [Master blueprint](./BLUEPRINT.md)
- [Development progression checklist](./DEVELOPMENT-CHECKLIST.md)
- [Domain context map](./CONTEXT-MAP.md)
- [Agent working agreement](./AGENTS.md)
- [Architecture decisions](./docs/adr/)

The application is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Application Baseline

- MongoDB through Mongoose; financial writes require a replica set or sharded cluster with transaction support.
- NextAuth for credential authentication and middleware route gating.
- Server-side organization membership and permission checks for authoritative authorization.
- Public registration remains pending until a System Admin or scoped ESAO Admin approves it.
- The initial 17-school directory is stored in [`data/schools.csv`](./data/schools.csv).

Runtime secrets and database selection belong in `.env.local` using [`.env.example`](./.env.example) as the contract. Never commit the real MongoDB URI or NextAuth secret.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Shadcn --preset bhjGw7Ehs
