# Stash — Quickstart (local run)

Requirements: Node 18+, pnpm (`npm i -g pnpm`)

```bash
# 1. env files (dono apps me)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
#    DATABASE_URL me apna Supabase connection string dalo (?sslmode=require ke saath)
#    Supabase.com -> project -> Settings -> Database -> connection string

# 2. install + run
pnpm install
pnpm dev          # pehli baar api build hota hai, thoda slow

# 3. kholo
#    http://localhost:3000  -> Sign Up -> login
```

Notes:
- API alag port pe nahi chalta — web ke andar in-process hai (`/api/*`).
- Purane version ka local data hai to pehle `scripts/migrate-v2.sql` chalao (psql "$DATABASE_URL" -f scripts/migrate-v2.sql).
- Deploy guide: DEPLOY.md (Vercel + Supabase, $0).
