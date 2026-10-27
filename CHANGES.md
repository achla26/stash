# Stash — Security Fixes & Google Login (applied 2026-10-27)

## Files modified (source of truth = git diff)

| File | Change |
|------|--------|
| `apps/api/src/routes/billing.ts` | Webhook: removed `secretPrefix` from 401 error + added 5-min timestamp replay protection |
| `apps/api/src/app.ts` | CORS: removed blanket `.vercel.app` allowance — only explicit allowlist now |
| `apps/api/src/services/pad.service.ts` | Pad passwords: salted scrypt hashing on create/update/verify; update path now verifies password hash before allowing edits |
| `apps/api/src/services/uploads.service.ts` | Uploads: magic-byte sniffing (PNG/JPEG/GIF/WebP only), client MIME never trusted |
| `apps/api/src/controllers/uploads.controller.ts` | Uploads: private cache headers, nosniff, CSP header |
| `apps/api/src/middleware/rate-limit.ts` | **NEW** — in-memory sliding-window rate limiter |
| `apps/api/src/routes/auth.ts` | Rate limiting on signup/login/forgot-password/reset-password/google |
| `apps/api/src/routes/export.ts` | Export: pad password hashes + owner tokens stripped |
| `apps/api/src/services/base.service.ts` | DB errors: generic messages to clients, details logged server-side |
| `apps/web/src/components/auth/RegisterForm.tsx` | Google button added to signup form |
| `apps/api/.env` / `apps/web/.env` | Google OAuth env placeholders added (fill in real client ID) |

## What each fix does

### 1. Webhook secret leak (critical — billing forge)
Old: failed webhook signature returned `secretPrefix` (first 6 chars of DODO_WEBHOOK_SECRET).
Anyone could call `/api/billing/webhook` repeatedly to harvest the prefix, then forge a
`payment.succeeded` event granting Pro to any user_id.
Fix: `secretPrefix` removed. Only booleans (`hasId`, `hasTs`, `hasSig`, `secretSet`, `bodyLen`).
Plus: timestamp freshness check — signatures older than 5 minutes rejected (replay protection).

### 2. CORS blanket-allow
Old: any `*.vercel.app` origin allowed with credentials.
Fix: only origins matching Host header, localhost, or explicit `CORS_ORIGIN` env list.

### 3. Pad passwords plaintext
Old: passwords stored as plaintext, compared with `!==`.
Fix: salted scrypt hash (`scrypt$salt$hash`). Legacy plaintext rows still work
(constant-time compare), migrated on next password write.

### 4. Pad edit without password (critical — auth bypass)
Old: password-protected pad with `allow_edit=true` could be edited by anyone WITHOUT
providing the password — `update()` only checked `visibility=="password" && allow_edit==true`.
Fix: `update()` now verifies the password hash (`verifyPasswordHash`) before allowing
non-owner edits. Anonymous update without password → 401. With correct password → succeeds.

### 5. Uploads stored XSS
Old: user-supplied MIME accepted, SVG allowed, stored Content-Type served back,
`Cache-Control: public, immutable` → cache poisoning.
Fix: magic bytes sniffed from content (PNG/JPEG/GIF/WebP), client MIME never trusted,
SVG blocked, `private` cache headers, `X-Content-Type-Options: nosniff`,
Content-Security-Policy header.

### 6. No rate limiting
Old: login/signup/forgot-password/reset-password — no limits (brute force, email bombing).
Fix: in-memory sliding-window rate limiter (60s window).
Limits: signup 5/min, login 10/min, forgot-password 3/min, reset-password 10/min.
Swap for Redis when scaling multi-instance.

### 7. DB error leakage
Old: raw Postgres errors passed to clients via `mapErr`.
Fix: generic "Something went wrong. Please try again." to clients; details logged server-side.

### 8. Export sensitive data
Old: `GET /api/export` dumped pad password hashes + owner tokens.
Fix: `password` and `ownerToken` stripped from pad export.

### 9. Google login (signup)
`GoogleButton` added to RegisterForm (was only in LoginForm).
Backend flow already existed (`googleLogin` — ID token verify + user create + JWTs).
Needs: real `GOOGLE_CLIENT_ID` in `apps/api/.env` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `apps/web/.env`.

## Verify (tests run against live app)

- Signup → 201, user created, JWT issued ✅
- Login → 200, session issued ✅
- Rate limit → 429 after limit ✅
- Webhook 401 → no `secretPrefix` in response ✅
- Password pad → `scrypt$salt$hash` stored in DB ✅
- Wrong password → 401 ✅, right password → 200 ✅
- Fake SVG upload → 400 rejected ✅
- Real PNG upload → 201 accepted ✅
- Anonymous pad update (allowEdit) → 401 without password ✅
- Anonymous pad update with correct password → 200 ✅
- API build → PASS ✅

## Pending (not applied — decide before production)

- Token strategy: refresh tokens in localStorage, stateless, unrevocable — consider
  opaque refresh tokens + server-side sessions
- HSTS / CSP headers on web app
- Google `tokeninfo` deprecation — migrate to Google Identity Services token verification
- Pad slug entropy (16-bit → 32-bit)
- AI chat: model name whitelist + quota race condition
