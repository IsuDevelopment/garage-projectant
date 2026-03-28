---
description: "Database architecture, Prisma workflow, and deployment rules for the 3D configurator"
applyTo: "**/prisma/**,**/src/lib/db.ts,**/src/app/api/**,**/src/app/admin/**"
---

# Database

## Stack
- **Engine:** PostgreSQL (hosted on Neon.tech for production/Vercel)
- **ORM:** Prisma (`@prisma/client` + `prisma` CLI)
- **Config:** `prisma.config.ts` (Prisma 6+ style — no `package.json#prisma` for config)
- **Schema:** `prisma/schema.prisma`
- **Seed:** `prisma/seed.ts` (run via `npm run db:seed` / `tsx prisma/seed.ts`)

## Connection
- `DATABASE_URL` env var — always a PostgreSQL connection string.
- Format: `postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require`
- Local dev: set in `.env` (not committed).
- Vercel: set in project Environment Variables for Production (and optionally Preview).
- Neon uses serverless driver; standard `?sslmode=require` suffix is required.

## Key Models (domain summary)
| Model | Purpose |
|---|---|
| `User` | Auth accounts; role is `SUPER_ADMIN` or `CLIENT` |
| `Client` | Tenant — has `apiKey`, `slug`, per-client `visualSettings` (JSON) |
| `GlobalSettings` | Single-row (`id = 'default'`), global `visualSettings` override |
| `Feature` | Master feature catalogue (materials, roof types, gates, etc.) |
| `ClientFeature` | Junction: which features a client has enabled + custom pricing |
| `SubscriptionPlan` / `PlanFeature` | Marketing bundles grouping features |
| `ApiKeyLog` | Audit trail for public API access by apiKey |
| `Account`, `Session`, `VerificationToken` | NextAuth adapter tables — do not modify manually |

## CLI Commands
```bash
npm run db:generate   # prisma generate — regenerate client types
npm run db:push       # prisma db push — sync schema to DB without migrations (dev only)
npm run db:migrate    # prisma migrate dev — create + apply migration (dev)
npm run db:seed       # tsx prisma/seed.ts — seed features + super admin
npm run db:studio     # prisma studio — visual DB browser
```

## Build Pipeline (Vercel)
- `build` script runs `prisma generate && next build`.
- This ensures the generated Prisma Client always matches the current schema on every deploy.
- **Never remove `prisma generate` from the build command.**

## Seed Behaviour
- Upserts all master features from the `MASTER_FEATURES` array.
- Creates a `SUPER_ADMIN` user only when `SUPER_ADMIN_PASSWORD` env var is set.
- Email defaults to `admin@example.com`; override with `SUPER_ADMIN_EMAIL`.
- Safe to re-run (idempotent upserts).

## Rules for Schema Changes
1. Add/modify models in `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name descriptive-name` to create a migration.
3. Run `npx prisma generate` to update TypeScript types.
4. Update seed if new required data exists.
5. On Vercel, migrations are applied via `prisma migrate deploy` (not `dev`).

## What to Avoid
- Never use `prisma db push` in production — it can drop data.
- Never hardcode connection strings in source code.
- Do not modify NextAuth adapter tables (`Account`, `Session`, `VerificationToken`) unless upgrading NextAuth.
- Do not add raw SQL queries — use Prisma Client API.
- Do not skip `prisma generate` after schema changes — the build will fail with stale types.
