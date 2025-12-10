# S86-1225-TrustX-Full-Stack-With-NextjsAnd-AWS-Azure-LocalTrust-ID
# Local Trust ID

**Sprint:** 1 — Project Initialization & Folder Structure  
**Project:** Local Trust ID (trust-x)

## One-line summary
A minimal Next.js + TypeScript scaffold for Local Trust ID — base app/router, components, and utility folders for future sprints.

---

## Repo layout (what you have right now)


### Purpose of each folder
- `src/app/` — Next.js App Router routes & layout (entry point for pages).  
- `src/components/` — Reusable UI bits (Header, Footer, Cards).  
- `src/lib/` — App utilities, API clients, constants.  
- `public/` — Static files served at `/` (images, favicon).  

Naming conventions:
- Components: `PascalCase` (`MyButton.tsx`)  
- Hooks: `useSomething.ts` (`useAuth.ts`)  
- Utils/libs: `camelCase` or `kebab-case` (`apiClient.ts`)

---

## Setup & run (exact commands)

1. Install
```bash
npm install
