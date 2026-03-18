# Mini CRM

Lightweight CRM workspace for small teams moving off spreadsheets.

## Current status

- C4Flow research, spec, and beads phases are complete
- CODE phase is in progress
- Wave 1 implementation includes:
  - Next.js app scaffold
  - workspace shell and proxy
  - Prisma schema and initial migration scaffold
  - dashboard, contacts, companies, deals, and tasks shell routes

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run db:generate`
- `npm run db:push`
- `npm run db:seed`

## Environment

Copy `.env.example` and set `DATABASE_URL` for local Prisma work.
