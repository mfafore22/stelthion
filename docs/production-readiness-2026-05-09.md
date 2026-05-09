# Production readiness review — Stelthion repo

Date: 2026-05-09
Branch reviewed: `frontend/visual-system-shoppermind-macro-20260504`

Scope: `/Users/kimmoi/NewStelthion/Stelthion_production_candidate2` — main Next.js app, `services/shoppermind`, `services/venuemind`, three `packages/*` workspaces. Findings are anchored to file paths.

## 0. #1 finding — Platform authority is incorrectly derived from tenant identity

**This is the most severe issue in the codebase and must be fixed before any external go-live.**

Stelthion super-admin authority is currently signalled by membership in a specific customer row (`customerId === 'ideapark'`), not by a platform-level role on the user. The five sites that encode this:

- `src/lib/admin-customer.ts:29` (`getActiveCustomer`)
- `src/lib/admin-customer.ts:65` (`getSelectedCustomer`)
- `src/lib/admin-customer.ts:160` (`requireOwnedCustomer`)
- `src/lib/admin-customer.ts:186` (`listSelectableCustomers`)
- `src/app/api/admin/select-customer/route.ts:21`

The doc comment at `admin-customer.ts:18` makes the intent explicit: *"Stelthion super-admins (users on the seed `ideapark` customer)"*. Consequence: **Ideapark is not an isolated tenant** — any `ADMIN` user provisioned under `customerId='ideapark'` gets cross-tenant access to every other customer's data via the active-customer cookie + `listSelectableCustomers`. This violates the basic SaaS isolation requirement (Realidea must not be able to read Ideapark; Ideapark must not be able to read Realidea).

**Fix — branch `security/platform-admin-tenant-isolation` (do this first, ahead of OTP/CSRF/CSP work):**

1. **Schema migration**: add a `PlatformRole` enum (`NONE`, optionally `SUPPORT`, `SUPER_ADMIN`) and `platformRole PlatformRole @default(NONE)` on `User`. Keep `customerId` non-null in v1 to limit the blast radius (treat home customer as a presentation default, not an authority); migrate to nullable later.
2. **No automatic backfill in production.** A blanket `customerId='ideapark'` → `SUPER_ADMIN` migration would carry the current privilege leak forward. Instead:
   - Local/demo seed: promote known dev admin emails as part of the seed script.
   - Production: ship the migration as `platformRole: NONE` for everyone, then promote named platform accounts via a one-off, audited script or manual DB action that records who was promoted, when, and by whom.
3. **JWT plumbing**: in `src/auth.ts:30` copy `platformRole` onto the token in the `jwt` callback so guards don't take a per-request DB hit. This is role plumbing, not a bypass — it is consistent with the existing rule against committing 2FA/OTP bypasses.
4. **Helper**: `isPlatformAdmin(session)` reading the token claim. Replace all five `customerId === 'ideapark'` checks with this.
5. **Customer scope is data scope only.** Platform admins must still operate inside an explicitly selected customer context (the existing `ACTIVE_CUSTOMER_COOKIE` flow); platform role grants the right to *select* a customer, not to skip scoping.
6. **Tests prove isolation**: two-tenant fixture (Ideapark + Realidea), assert 403 on every mall-bound API when the cookie/scope mismatches the session's customer, plus one positive test that a `SUPER_ADMIN` user can switch via the cookie.
7. **Public mall APIs that leak data without auth** must be fixed in the same branch — see §4 below.
8. **Sibling cross-tenant admin route**: `src/app/api/admin/customers/[id]/venues/route.ts` only calls `requireAdmin()` and then performs raw SQL inserts/reads keyed off the URL `id` param. Any `ADMIN`-role user can write into any customer's venues. Fix by switching to `requireOwnedCustomer(id)` (matches the sibling `…/malls` route) and re-testing under the new `platformRole` model so non-platform admins are blocked entirely.
9. **Edge control-plane gap** (data plane is fine — see note below):
   - **Data plane is tenant-neutral**: `EdgeDevice` inherits tenant transitively via `mallId → Mall.customerId`. Ingestion routes (`/api/edge/footfall`, `behavior`, `insights`, `journeys`, `alerts`, `verification-snapshots`, `heartbeat`) trust `auth.mallId` returned by `validateEdgeAuth` (`src/lib/auth/edge-auth.ts`), which authenticates per device via bearer key + `X-Edge-Id` + `X-Mall-Id`. No tenant baked into the code path. The same Stelthion API can serve any customer's edge fleet.
   - **`/api/edge/register` is the real gap**: only `requireAdmin()` plus `prisma.mall.findUnique({ mallId })` — verifies the mall exists but not that it belongs to the caller's customer. A tenant admin who knows another tenant's `mallId` can provision an edge device against it (and rotate `apiKeyHash`). Add `requireMallAccess(mallId)` to this route as part of the platform-admin branch.
   - **`/api/admin/edge/devices` is scoped, but inherits the broken `activeCustomerMallIds()` helper**: GET/PATCH/DELETE all gate on `mallIds.includes(existing.mallId)` (`route.ts:78, 120`), so it is *not* directly unscoped. It must, however, be regression-tested after `platformRole` lands, since `activeCustomerMallIds()` resolves through the same active-customer model that §0 is rewriting.
   - **Bcrypt-on-every-edge-request is a perf cliff** at scale (~50 ms/auth on cost-10): switch to HMAC-SHA256 with a per-device secret, or cache successful auth results for ~30 s, before scaling beyond a single tenant's fleet. Already noted in §6 — calling out here for visibility.

Until this branch is shipped and tests prove tenant isolation, the platform should not onboard a second real customer.

### Tracked secret-address hygiene

The personal mailbox flagged as a credential in saved memory (`feedback_personal_email_no_commit.md`) appears in two **tracked** files:

- `prisma/seed.ts:32` and `:123` — hardcodes a personal mailbox as the seeded Ideapark super-admin email and prints a static seed password to stdout.
- `docs/space-optimizer-backend-handoff.md:372` — references the same mailbox as a manual QA login.

Both must be redacted. Recommended fix: drive seed identities from `process.env` (e.g. `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) read from a gitignored `.env.local`, and replace the mailbox in the handoff doc with a placeholder. Add a CI grep guard that fails the build if the literal mailbox or seed password reappear in any tracked file.

## 1. Repository structure & agility

**Overall shape — sound.** Monorepo via npm workspaces (`packages/*`, `services/*`) with the Next.js app at the root. Service split is intentional: ShopperMind is a Fastify/BullMQ/Redis service, VenueMind is being broken out the same way, and the shared `intelligence-runtime` package holds cross-cutting primitives (rate-limit policy types, etc.). Schema decomposition into 38 Prisma models is reasonable; there are 30+ `@@index` declarations on the hot multi-column query paths and `@@unique` constraints where they should be.

**Friction points:**
- Two workspaces, two Prisma schemas. The root `prisma/schema.prisma` (723 lines, 38 models) and `services/shoppermind/prisma/schema.prisma` coexist, which is fine, but there is no documented rule for where new models go. Pick one (root vs service) for any new domain to avoid ambiguity.
- `.next/` is **1.9 GB** and `node_modules/` is **1.1 GB**. `.next/` is gitignored — verify nothing is leaking. Run `next build --debug` and watch for the `.next/standalone` size (currently 85 MB, OK).
- **Large repo-root binaries** — 1.7 MB of PNG/PDF screenshots at the repo root (`Ideapark *.png/.pdf`, `Stelthion_swirl_transparent2.png`). They are *not* gitignored and are bloating clones. Move to `docs/assets/` or a separate asset bucket and `git rm` from history if they aren't needed.
- File-size discipline: `MEMORY.md` says "UI files ≤100 lines" — current top offenders break it badly: `src/components/admin/FloorplanEditor.tsx` is 1150 lines, `src/components/mall/FootfallAnalysis.tsx` 991, `src/services/concierge/tools.ts` 715, `src/app/mall/shoppermind/phenomenon/[id]/page.tsx` 611.
- 54 `as any` / `@ts-ignore` occurrences across `src` — some are unavoidable (NextAuth session typing) but cluster around session/token mutation in `src/auth.ts`. Worth tightening with a typed `Session` declaration.

## 2. Authentication, 2FA & OTP — issues to fix before prod

The auth model is: NextAuth credentials → bcrypt → mandatory email-OTP step → JWT with `twoFactorVerified` flag. Architecture is fine; implementation has gaps.

### Critical

- **`AUTH_SECRET="placeholder-change-in-production"`** exists in the local `.env` (gitignored, not committed). `src/lib/env-check.ts:4` only checks length in `NODE_ENV=production`, so this string is currently 32+ chars and *would pass* the production gate if it were ever copied into a deploy environment. Rotate the local value and add a check that explicitly rejects `placeholder` / `change-in-production` / `dev-` substrings.
- **`SKIP_OTP_IN_DEV=true`** lives in `.env.local`. Per the saved rule, this must never reach prod — confirm CI/Vercel envs don't carry it, and add a hard server-side guard: `if (process.env.NODE_ENV === 'production' && process.env.SKIP_OTP_IN_DEV) throw new Error(...)`. Note: a grep of `src` finds no code that *reads* `SKIP_OTP_IN_DEV` — it's documented but not implemented. Decide whether to remove the comment or wire it (and gate it).
- **OTP lockout is too aggressive**: `src/app/api/two-factor/verify/route.ts:56` locks the account after **2** failed OTP attempts for 10 minutes. Real users mistype 6-digit codes constantly. Bump to 5 attempts, or 3 with a shorter lock (e.g. 60 s), and emit an audit event.
- **Login lockout is per-user-row, not per-IP**: `src/auth.ts:99` increments `failedLoginAttempts` on the User. An attacker can lock any known email out indefinitely (account-lockout DoS). Combine with the IP rate limiter and require both signals.
- **In-memory rate limiter doesn't survive multi-instance deploys**: `src/lib/auth/rate-limiter.ts:12` uses a `Map` — in Vercel/serverless or any horizontally scaled deploy, the counter resets per cold start. ShopperMind already has a Redis-backed rate-limit store (`services/shoppermind/src/http/security/redis-rate-limit-store.ts`). Move the Next.js limiter onto the same store. Also: `setInterval` at module load won't run in Vercel serverless either.
- **`/api/two-factor/disable` accepts an OTP from the *current session***: `src/app/api/two-factor/disable/route.ts` lets a logged-in user disable 2FA with just an email OTP, no current-password re-prompt. Anyone with a hijacked session token can permanently turn it off. Require current password + OTP, and audit-log the event.
- **No CSRF protection on state-changing routes**. NextAuth handles its own sign-in CSRF, but `src/app/api/change-password/route.ts`, `/api/two-factor/disable`, `/api/admin/*`, `/api/concierge/conversations/[id] DELETE` are all `POST/PATCH/DELETE` JSON endpoints behind cookie-only auth. Add a CSRF middleware (NextAuth `csrf` token, or `SameSite=Strict` on the session cookie + an `Origin` header check). Note: `src/proxy.ts:27` lets `pathname.startsWith('/api/changepassword')` through unauthenticated, but the actual route is `/api/change-password` (with hyphen). The "skip" doesn't match the real route, so this is mostly a stale code smell — clean up.

### Important

- **First-time password change loophole**: `src/app/api/change-password/route.ts:21` skips current-password check whenever `passwordChangedAt` is null. A welcome email leaks the auto-generated password (`src/lib/email/sendOTP.ts:188-195`) — anyone with access to that mailbox can change the password without knowing the current one. Acceptable, but add a tight time-window (e.g. only valid within 24 h of `createdAt`) and force this flow through a one-time signed link rather than a normal login.
- Welcome email **emails the plaintext password**. Use a one-time signed setup link instead — emails get archived, forwarded, screenshotted.
- Password minimum is **8 chars** with no complexity check (`change-password/route.ts:18`) and login allows **6** chars (`src/auth.ts:79`). Mismatch invites confusion. Pick one policy (NIST recommends ≥ 12, no complexity, blocklist-checked).
- Bcrypt cost factor is `10` everywhere — bump to `12` for 2026 hardware.
- JWT session is `8 h` (`src/auth.ts:23`) — fine, but no refresh / rotation. After password change you don't invalidate other sessions (no `tokenVersion` field on User).
- `EmailOtp` table grows forever — no TTL/cleanup job. Add a daily prune of `expiresAt < now() - 7d`.
- OTP regeneration race: `sendOTP.ts:36-47` silently returns if a recent OTP exists, but does not return the masked email — UX inconsistency. Also no per-IP throttle on `/api/two-factor/send`.
- Generated welcome passwords use `crypto.randomBytes` indexed `% chars.length` → modulo bias on a 60-char alphabet across `[0..255]`. Not exploitable in practice (60 divides into 256 unevenly but entropy is still ~5.9 bits/char × 12 = 70 bits) — fine, but use `crypto.randomInt(0, chars.length)` for cleanliness.

## 3. Database & Prisma

- **Single Prisma client singleton with PG adapter** (`src/app/lib/prisma.ts`) — correct pattern for Next.js. Connection string lacks `sslmode=require`; `env-check.ts:8` only `console.warn`s. Make it throw in prod.
- **No connection-pool sizing visible.** With the `@prisma/adapter-pg`, `pg` defaults to a 10-connection pool per process — under serverless, that multiplies by every warm instance. Configure `connection_limit` in the URL or use PgBouncer (Supabase / Neon strongly recommend it). Document expected concurrent instance count.
- **Indexes look healthy** for the hot composites (`MallEvent[mallId,startDate]`, `ConciergeMessage[conversationId,createdAt]`, `FootfallReading[mallId,date]`, etc.). But:
  - `EmailOtp` has `@@index([email, code])` — fine for lookup, but no index on `expiresAt` for the cleanup job once you add one.
  - `User.email` is unique, good. No index on `lockedUntil`/`otpLockedUntil` — usually queried by user id, OK.
- **Unbounded queries.** A handful of `findMany` calls have no `take` and no pagination:
  - `admin/customers/route.ts:15` — full customer list. Fine for now, won't scale beyond ~1k.
  - `admin/users/route.ts:17` — all users for active customer.
  - `analysis/insights/[jobId]/route.ts:37` — all insights for a job. Add `take: 500` + cursor.
  - *(Note: `concierge/conversations/route.ts` already has `take: 30` at line 23; an earlier draft of this report flagged it incorrectly.)*
  Add a `LIST_LIMIT` constant and apply universally (`take: 100, orderBy, cursor`).
- **Transactions** are used in the right places (admin floorplan save, customer-with-mall create, edge journey writes). No obvious N+1 patterns flagged in spot checks, but `findMany` + nested `include` on hot paths (e.g. concierge conversations) is worth profiling.
- **38 models, 10 migrations** — a tight ratio. No `prisma migrate reset` traces or stray `db push` evidence. Good.
- `JSON` columns are used in `Plan.features`, `MallEvent` (probably), etc. — be aware these are not validated by Prisma. Keep zod schemas next to writes.

## 4. API layer

- **96 route files**, only **35 import `auth`/`requireAuth`/`requireAdmin` directly**. The naive grep undercounts because several routes authenticate via wrapper helpers (e.g. `requireCampaignMall` at `src/lib/campaigns/api.ts` calls `auth()` internally; `requireOwnedCustomer` calls `requireAdmin()`). The genuinely missing-or-weak guards:
  - **`admin/customers/[id]/venues/route.ts:9`** — only checks `requireAdmin()`, then performs raw-SQL inserts/reads against an arbitrary `customerId` taken from the URL params. This is a real cross-tenant admin issue and **belongs in the platform-admin isolation branch (§0)**: `requireAdmin()` is satisfied by *any* `ADMIN`-role user, so a tenant admin can read or write another tenant's venues. Replace with `requireOwnedCustomer(id)` (which is what the sibling `[id]/malls` route already uses at line 10) and re-test under the new `platformRole` model so customer-scoped admins are blocked.
  - `admin/customers/[id]/plan/route.ts` — calls `getActiveCustomer()` (which checks session + ADMIN role) but skips `requireOwnedCustomer`. Apply the same `requireOwnedCustomer(id)` pattern.
  - `/api/transport/[mallId]`, `/api/parking/[mallId]`, `/api/departures/[mallId]`, `/api/weather/forecast`, `/api/floorplan/[mallId]/zones`, `/api/floorplan/[mallId]/cameras`, `/api/mall/[mallId]`, `/api/mall/[mallId]/heatmap/latest`, `/api/counters/[mallId]/profile` — `src/proxy.ts:43-51` explicitly lets these through unauthenticated. Some (weather, public departures) are reasonable; **floorplan/zones, cameras, heatmap, counters/profile must not be public** — they expose tenant operational data. Drop them from the public allowlist and wrap each route's Prisma query in `resolveScopedMall(mallId)` (the existing helper at `src/lib/customer-scope/requireMallScope.ts`; `requireMallAccess` is the `/admin/*` variant and is not the right helper for non-admin routes).
  - *(Note: `admin/customers/[id]/malls/route.ts` already uses `requireOwnedCustomer` at line 10 — earlier draft flagged it incorrectly. `/api/campaigns/{workflow,brief,estimate}` all use `requireCampaignMall` from `src/lib/campaigns/api.ts`, which calls `auth()` and scopes by `customerId` — also not a gap.)*
- **Zod validation is used in 75% of routes** (221 grep hits across ~96 files) — the strong routes (ShopperMind v1 endpoints, edge ingestion) parse with zod. The Next.js app routes mostly hand-roll `if (!x || typeof x !== 'string')`. Standardize on a `validateBody(req, schema)` helper.
- **Streaming SSE on `/api/concierge/chat`** (`src/app/api/concierge/chat/route.ts`) sets `Cache-Control: no-cache, no-store` — good. No `X-Accel-Buffering: no` for Nginx; if you proxy this, add it. No request-body size limit — large prompts could OOM.
- **No global rate limit on Next.js API routes**. The `lib/auth/rate-limiter.ts` is only used during login (and even then, I don't see it called in `src/auth.ts` — search shows only declarations). Concierge chat (which calls an LLM) has zero throttle and zero auth-tier quota. ShopperMind service has Redis-backed limits already; mirror that for the Next.js layer.
- **96 routes × 22 `console.log` + 59 `console.error`** — no structured logging in the Next.js app (ShopperMind uses pino, good). Add a logger (pino or `next-logger`) and standardize. Sensitive logs to watch: `console.error('Failed to fetch user:', error)` (`auth.ts:13`) and `console.log('📧 [WELCOME EMAIL DEV MODE]')` (`sendOTP.ts:163`) which prints **the plaintext password** — guard with `NODE_ENV !== 'production'`.

## 5. Memory, performance, bundle size

- **Heavy client deps**: `mapbox-gl`, `three`, `framer-motion`, `recharts`, `jspdf`, `xlsx`, `html2canvas`, `react-i18next` are all in the main bundle. **No `next/dynamic` usage detected** in `src` (grep returned 0). At least mapbox, three, jspdf, xlsx, html2canvas should be lazy-loaded with `dynamic(..., { ssr: false })`. This alone will likely shave hundreds of KB off the initial JS for the dashboard route.
- **Two bcrypt libs** — `bcrypt` *and* `bcryptjs` are both in `package.json`. Pick one (native `bcrypt` is faster server-side; `bcryptjs` works in edge runtimes). Mixing them costs install size and bundle.
- **`reactStrictMode: false`** in `next.config.ts` — turn it back on; Strict Mode catches a lot of useEffect/state bugs early. The cost is double-mount in dev only.
- **Image optimization**: `images.remotePatterns` only allows unsplash. Public assets like `Stelthion_landing-bg.jpg` (579 KB) and the Sello floorplans (700 KB–1 MB each) are served as raw PNG/JPG. Convert floorplans to AVIF/WebP, run `<Image priority={false}>`. The 2.3 MB `stelthion-animation/assets/player/main.js` and 1 MB `pdf.worker.min.js` should be lazy-loaded only when the animation/preview is opened.
- **Three.js + 0.183.x types** — heavy. If 3D model viewer is one route, code-split aggressively.
- **No `next.config.ts` `experimental.optimizePackageImports`** for Radix/lucide — adding `optimizePackageImports: ['lucide-react', '@radix-ui/*', 'recharts']` typically saves 50–150 KB.
- **`tsconfig.tsbuildinfo` is 661 KB** committed indirectly — fine if gitignored. Confirm.
- **No bundle analyzer in scripts** — add `@next/bundle-analyzer` and run on each PR.

## 6. Security

**Headers** (`next.config.ts`) — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy: all present and reasonable. **Missing**:
- **`Content-Security-Policy`** entirely. With Mapbox, three.js, Resend, optional Ollama, you need a CSP. Start with report-only mode.
- No `Cross-Origin-Opener-Policy: same-origin` or `Cross-Origin-Embedder-Policy` — add if you want full isolation.

**Cookie config** — using NextAuth defaults. Confirm `secure: true`, `sameSite: 'lax'` (or `strict`), `httpOnly: true` are set in production. Not visible in repo, so they rely on NextAuth defaults — those *are* correct, but pin them explicitly in `auth.config.ts` for auditability.

**Secrets in repo**:
- *(Retraction)* An earlier draft of this report claimed `.env` was tracked in git. That is incorrect — `.env` is gitignored at `.gitignore:4` and `git check-ignore` confirms it. No action needed on tracking. The on-disk `.env` content (local DB URL, `AUTH_SECRET="placeholder-change-in-production"`, `SHOPPERMIND_INTERNAL_TOKEN="dev-internal-token-0000"`) is dev-only and not in version control.
- The `AUTH_SECRET` placeholder issue stands independently: `src/lib/env-check.ts:4` only validates `.length >= 32`, and the placeholder string is 33 chars, so it would silently pass the production gate if it ever leaked into a deploy env. Add an explicit substring check that rejects `placeholder` / `change-in-production` / `dev-` style values in `NODE_ENV=production`.

**Field-level encryption** (`src/lib/crypto/field-encrypt.ts`) — AES-256-GCM with random 12-byte IV and auth tag. Looks correct. No key rotation strategy though — add a key-version prefix (`v1:iv:tag:data`) so you can rotate later.

**Edge auth** (`src/lib/auth/edge-auth.ts`) — bcrypt-compares device API key on every request. Bcrypt for hot-path service auth is **slow** (~50 ms each on cost-10). Use HMAC-SHA256 with a per-device secret instead, or cache successful auth results for 30 s.

**Cron auth** is constant-time-comparing strings via `!==` (`cron/macro-sync/route.ts:19`, `internal/footfall-export/route.ts:9`). Use `crypto.timingSafeEqual` to avoid timing leaks.

**Public-API routes** — check whether `proxy.ts:43-51` public bypasses are intentional and whether the data they expose is per-tenant scoped (likely yes via `mallId` param, but with no auth, anyone enumerating malls gets data).

**Audit logging** — `src/lib/audit/` exists and is gated by `AUDIT_FILE_LOGGING=true`. Confirm it's enabled in prod and that auth events (login, OTP success/fail, password change, 2FA disable) all flow through it.

**Dependency hygiene** — run `npm audit` (the `--legacy-peer-deps` in Dockerfile suggests peer-dep strain; review whether next-auth beta + Next 16 + React 19 are stable for prod). NextAuth `5.0.0-beta.30` is a beta — that's a flag for "production candidate" tagging.

## 7. Cross-cutting issues to address before launch

Ordered by severity. Items 1–4 are launch blockers; items 5+ are follow-up branches.

1. **Branch `security/platform-admin-tenant-isolation`** (see §0): introduce `User.platformRole`, replace all five `customerId === 'ideapark'` checks, no auto-backfill in prod, two-tenant isolation tests as the merge gate.
2. **In the same branch, fix the public mall data leaks**: drop `floorplan`, `mall/`, `counters` from the public allowlist in `src/proxy.ts:43-51`, and wrap the bare-`mallId` Prisma queries in `/api/floorplan/[mallId]/{zones,cameras}`, `/api/mall/[mallId]/heatmap/latest`, `/api/counters/[mallId]/profile` with `resolveScopedMall(mallId)` (helper already exists at `src/lib/customer-scope/requireMallScope.ts`).
3. **Rotate `AUTH_SECRET`** and add an explicit substring-blocklist check in `env-check.ts` so the placeholder cannot pass the prod gate.
4. **Pagination + `take` caps** on the unbounded `findMany` list endpoints flagged in §3 (admin/users, admin/customers, analysis/insights). Cheap, prevents tail-latency regressions and accidental large payloads.
5. **OTP / 2FA hardening branch** (follow-up): tune OTP lockout to 5 attempts, require current password to disable 2FA, replace plaintext-password welcome email with a signed setup link, add a daily prune for `EmailOtp`.
6. **CSRF + CSP branch** (follow-up): CSRF on cookie-authed POST/PATCH/DELETE endpoints, Content-Security-Policy in report-only first, `crypto.timingSafeEqual` for cron/internal token comparisons, bump bcrypt cost to 12.
7. **Rate-limiting consolidation**: move the Next.js layer onto the Redis store ShopperMind already uses (`services/shoppermind/src/http/security/redis-rate-limit-store.ts`). The in-memory `Map` won't survive serverless or multi-instance deploys.
8. **Bundle / perf branch**: code-split mapbox, three, jspdf, xlsx, html2canvas with `next/dynamic`. Re-enable `reactStrictMode`. Drop one of the two bcrypt libs. Add `@next/bundle-analyzer` to the PR pipeline.
9. **Demo-bypass hygiene**: `SKIP_OTP_IN_DEV` is documented in `.env.local` but not actually read anywhere in `src/`. Either delete the doc line, or wire it behind an explicit `ALLOW_LOCAL_DEMO_BYPASSES` flag with a hard production throw and a localhost-origin check.
10. **Logging**: replace `console.*` with a structured logger across `src` (ShopperMind already uses pino — adopt the same). Scrub the welcome-email plaintext-password log at `sendOTP.ts:163`.
11. **UI file-size lint gate** (≥ 100 lines flagged in pre-commit) — split `FloorplanEditor.tsx` (1150), `FootfallAnalysis.tsx` (991), `tools.ts` (715) before launch.
12. **Move repo-root binaries** (Ideapark PNG/PDF, swirl asset) into `docs/assets/` to slim clones.

The codebase is well-structured and most of the right primitives already exist — `resolveScopedMall`, audit logging, edge auth, field encryption, ShopperMind's rate-limit infra. The gap to production is mostly *consistency*: applying those primitives uniformly across the Next.js layer, removing the platform-vs-tenant authority conflation, and hardening the 2FA/OTP edges.
