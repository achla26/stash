# Stash — Free Deploy Guide ($0 total)

Architecture: **ek hi Vercel project**. Web = Next.js, API = same Hono code jo Next ke
serverless route (`app/api/[[...path]]/route.ts`) ke andar chalta hai. DB = Supabase free.
Locally tested: bina alag API server ke saare endpoints PASS.

## 0. Code GitHub pe push

```bash
cd stash
git init
git add .
git commit -m "Stash v1"
# GitHub pe naya repo banao (naam: stash), phir:
git remote add origin https://github.com/<YOUR-USERNAME>/stash.git
git branch -M main
git push -u origin main
```

(.gitignore already node_modules/.next/dist/.env cover karta hai — secrets push nahi honge.)

## 1. Supabase — free DB

1. supabase.com → **New project** (Free plan), koi bhi region, DB password set karo.
2. Project Settings → Database → **Connection string (URI)** copy karo
   (Transaction pooler wali), aur end me `?sslmode=require` laga do.
   Example: `postgresql://postgres.xxx:PASSWORD@aws-0-...pooler.supabase.com:6543/postgres?sslmode=require`
3. Tables banao — apne machine pe (node installed ho):

```bash
cd stash/packages/database
DATABASE_URL='<supabase-string>' npx drizzle-kit push
```

Bas — schema ready.

## 2. Vercel — free hosting

1. vercel.com → **Add New... → Project** → GitHub repo import karo.
2. Settings:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js (auto-detect)
   - **Package Manager:** pnpm (auto-detect from `packageManager` field; warna pnpm 9 select karo)
   - **Build Command:** `pnpm --filter @repo/api build && next build`
3. **Environment Variables** (Production + Preview dono):

| Name | Value |
|---|---|
| `DATABASE_URL` | Supabase string (`?sslmode=require` ke saath) |
| `ACCESS_TOKEN_SECRET` | koi bhi lambi random string |
| `REFRESH_TOKEN_SECRET` | dusri random string |

4. **Deploy** → 1-2 min me live: `https://stash-xxx.vercel.app`

## 3. Account banao (one-time)

Site kholo → **Sign Up** → apna email/password. Yahi tumhara private account hai.

## 4. Phone pe app ki tarah install (PWA)

- **Android (Chrome):** menu (⋮) → *Add to Home screen / Install app*
- **iPhone (Safari):** Share → *Add to Home Screen*

HTTPS + manifest + service worker already hai — icon ke saath install hoga,
aur ek baar online kholne ke baad **offline bhi khulta hai** (visited pages/data).

## Local development (sabse aasan — 1 terminal)

1. Prerequisites: **Node 20+** aur pnpm: `npm i -g pnpm@9`
2. Unzip ke baad: `cd stash && pnpm install`
3. DB (Supabase free — local run ke liye bhi yahi, koi Postgres install nahi):
   - supabase.com → New project → Settings → Database → connection URI copy karo,
     end me `?sslmode=require` lagao
   - Tables: `cd packages/database` → `DATABASE_URL="URI" npx drizzle-kit push`
4. Env files banao (dono jagah same 3 values):
   - `apps/api/.env` ← `apps/api/.env.example` copy karke values bharo
   - `apps/web/.env`  ← same content
5. Chalao: `cd apps/web && pnpm dev`
6. Kholo: **http://localhost:3000** → Sign Up (ek baar) → ready

(API ka code Next ke andar serverless-style chalta hai — alag server ki zaroorat nahi.
Purana 2-server mode chahiye to: terminal 1 `pnpm --filter @repo/api dev`,
terminal 2 `cd apps/web && API_PROXY_URL=http://localhost:4000 pnpm dev`.)

## Smoke test deploy ke baad

- `/` → login pe redirect
- signup/login → dashboard
- link save karo → auto title/description aaye
- DevTools → Application → Manifest + SW registered
- network band karke reload → cached dashboard dikhe
