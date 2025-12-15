# TrustX – Full Stack Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

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
..

## Prisma ORM Setup & Client Initialization

Prisma ORM was integrated into the Next.js application to provide a type-safe and scalable database access layer.

### Setup Steps
- Installed and initialized Prisma
- Defined PostgreSQL models using Prisma schema
- Generated Prisma Client
- Created a singleton Prisma client to avoid multiple connections during development

### Client Initialization
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
