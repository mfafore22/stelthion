# Deploy Notes

Notes for the developer pushing changes to production. Newest at the top.

---

## Phase 3A — 2026-04-21 — Server bright line + auth-route case typo fix

### Action required at deploy time

**None blocking, but read this before redeploying:** This commit fixes a latent
production bug. Three import paths under `src/app/api/` were using the wrong
case (`@/lib/email/sendOtp` instead of `sendOTP`). The mismatch was invisible
on macOS (case-insensitive APFS) but **would have caused `npm run build` to
fail inside the Docker image** (`node:20-alpine`, case-sensitive Linux FS).

The currently-running production container was built before the offending
imports were added (commits `18860a7` and `408a327`). It therefore does not
contain the broken routes. **The first redeploy after Phase 3A will be the
first time `/api/admin/users`, `/api/two-factor/send`, and
`/api/two-factor/disable` actually ship to production.**

Before redeploying:

1. Confirm `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `RESEND_API_KEY` are
   set in the production environment. The build only needs `DATABASE_URL` and
   `DIRECT_URL` to load Prisma config; runtime needs all four.
2. Smoke-test these endpoints after the deploy:
   - `POST /api/two-factor/send` — issues an email OTP. Verify a real OTP
     email arrives (not just console-logged).
   - `POST /api/two-factor/disable` — accepts an OTP and disables 2FA on the
     calling user.
   - `GET /api/admin/users` — admin-only listing.
   - `POST /api/admin/users` — admin-only create-user; should also send a
     welcome email.
3. Confirm the existing 2FA login flow still works end-to-end (login →
   password → OTP → session). Nothing in `src/auth.ts`, `src/auth.config.ts`,
   `src/proxy.ts`, or `src/lib/email/sendOTP.ts` was modified, so the failure
   surface is limited to the three routes above.

### What else changed (no deploy impact)

- New canonical Prisma client path: `src/server/db/client.ts`. The old path
  `src/app/lib/prisma.ts` is now a one-line re-export shim — all 67 existing
  importers continue to work unmodified.
- `src/contexts/AdminMallContext.tsx` is the new home for the admin mall
  context (was at `src/lib/hooks/useAdminMall.tsx`, which is now a shim).
- `src/lib/data/postalCodeBoundaries.ts` is the new home for postal code data
  (was at `src/lib/services/postalCodeBoundaries.ts`, now a shim).
- New ESLint rule blocks runtime Prisma imports in `src/components/**`,
  `src/hooks/**`, `src/contexts/**`. Type-only imports (`import type`) remain
  allowed pending the Phase E DTO layer.
- `src/server/` is the new bright line: anything importing Prisma at runtime
  belongs there. Migration of the remaining ~67 importers happens in later
  phases.

### Rollback

`git revert` of this single commit is safe. The shims preserve all existing
import paths, so reverting only removes the new canonical files and the
ESLint rule — no other file needs to change.
