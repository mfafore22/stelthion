# Branch: feature/c1-features-wired

**Created:** 2026-03-28
**Base:** main (C2 live production)
**Purpose:** Merge C1 features into C2 without breaking production auth, 2FA, or tenant system.

---

## What this branch adds

- **Schema:** 2 nullable Camera fields (`deviceType`, `dataSourceUrl`)
- **Dependencies:** swr, html2canvas, jspdf, jspdf-autotable, @types/jspdf
- **70 new files** from C1: FlowQuery, InsightPanel, StoreBehaviorResult, ZoneStorePicker, edge admin, edge API routes, export utilities, weather FMI integration, admin-auth, audit, config, scripts
- **39 shared files** taken from C1: locales (EN/FI/SV), data/lib, 24 components, 16 API routes, 4 app pages, 2 hooks
- **3 merged files:** i18n/index.ts, analysis/jobs/route.ts, events/[mallId]/route.ts
- **i18n:** Default language changed to Finnish (`fi`), Swedish support added
- **UI_COMPONENT_GUIDE.md:** Updated to reflect all changes

## Files intentionally NOT changed (kept C2)

- `auth.ts`, `auth.config.ts` — C2 JWT + 2FA auth (working in production)
- `mall/layout.tsx` — SessionContext
- `admin/layout.tsx` — 2FA check + branding
- `mall/login/page.tsx` — C2 two-factor redirect flow
- `mall/portfolio/page.tsx` — C2 SessionContext + date picker + multi-property
- `proxy.ts` — Full auth middleware
- `next.config.ts`, `tsconfig.json` — C2 config
- `lib/prisma.ts`, `lib/definitions.ts` — C2 setup

---

## TypeScript errors and resolution

### Fixed by this branch

| Error | Cause | Fix |
|-------|-------|-----|
| `MallTopBar` props mismatch — `selectedDate` and `onDateChange` not in interface | C2's portfolio/tenant pages pass date props, but C1's MallTopBar didn't accept them | Added `selectedDate?` and `onDateChange?` as optional props to `MallTopBarProps` |
| `cameras/route.ts` PATCH missing mallId check | Camera update didn't verify camera belonged to mallId | Added `prisma.camera.findFirst({ where: { id: cameraId, mallId } })` before update |

### Pre-existing (not caused by this branch)

| Error | Cause | Notes |
|-------|-------|-------|
| `PrismaClient` not found | `prisma generate` requires `DIRECT_URL` env var (no `.env` in local C2) | Run `prisma generate` on server with credentials |
| Implicit `any` types (20+ occurrences) | C1 code uses arrow function params without type annotations | Non-blocking; strict mode not enforced |
| `sendOtp` vs `sendOTP` casing conflict | C2 has two-factor files with inconsistent casing | Pre-existing C2 issue |
| `nodemailer@8` peer dep conflict with `next-auth@beta.30` | next-auth wants `nodemailer@^7`, C2 has `@8` | Use `--legacy-peer-deps` or downgrade nodemailer |

---

## Before merging to main

1. Run `prisma generate` with `DIRECT_URL` set
2. Run `prisma migrate dev --name add-camera-fields` to add `deviceType` and `dataSourceUrl` columns
3. Run `npm run build` to verify full build passes
4. Test auth flow (login → 2FA → portfolio) is unaffected
5. Test admin floorplan editor with counter device type
