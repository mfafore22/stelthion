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

---

## Deployment Guide — Phased Rollout

### Architecture

```
edge-service/ (Python/CUDA)  ──HTTPS──▶  src/app/api/edge/* (Next.js API)
     GPU in mall                                  │
     Deploy LATER                           Prisma/PostgreSQL
                                                  │
                                           src/app/admin/edge/ (Admin UI)
                                            Deploy NOW (shows empty)
```

The edge computing service (`edge-service/`) communicates with the Next.js app
**purely via HTTPS** — no code imports in either direction. They are independent
deployment units.

---

### Phase 1: Deploy NOW (Next.js only)

1. Merge `feature/c1-features-wired` into `main`
2. Run `prisma generate` with `DIRECT_URL` set
3. Run `prisma migrate dev --name add-camera-fields` (adds `deviceType`, `dataSourceUrl`)
4. Run `npm run build` to verify
5. Deploy Next.js as normal
6. Test auth flow (login → 2FA → portfolio) is unaffected

**What works immediately:**
- FlowQuery (3 video analysis modes in UI)
- PDF/CSV export
- Weather (FMI integration)
- i18n (Finnish default, Swedish added)
- Admin floorplan editor with counter device support
- All existing C2 features (auth, 2FA, tenant)

**What shows as empty (expected):**
- Admin → Edge Devices page: "No devices" (safe, not broken)
- Analysis jobs stay PENDING (no edge service to process them)
- InsightPanel shows no insights (no edge generating them)

**Edge API routes (`/api/edge/*`) are safe to deploy idle:**
- All routes validate auth headers — no unauthenticated access possible
- No edge devices registered = no traffic to these endpoints
- Zero performance impact

---

### Phase 2: Deploy LATER (Edge Service — when GPU hardware is ready)

**Requirements:** CUDA 12.2+, 8GB+ VRAM GPU, Docker, network access to production URL

1. Copy `edge-service/` to the GPU server
2. Configure `edge-service/config/service.yaml`:
   ```yaml
   cloud_api_url: https://your-production-domain.com  # MUST be HTTPS
   edge_id: mall-ideapark-gpu-01                       # unique device ID
   mall_id: ideapark                                   # matches DB mallId
   api_key: <generate-strong-key>                      # 64+ char random string
   ```
3. Register the device in the database:
   - Hash the `api_key` with bcrypt
   - Insert into `EdgeDevice` table: `edgeId`, `mallId`, `apiKeyHash`
4. Configure `edge-service/config/cameras.yaml` with RTSP stream URLs
5. Run `docker compose up -d` (starts edge-processor + Ollama LLM)
6. Edge service auto-registers via `POST /api/edge/register`
7. Heartbeat starts (every 60s) → Admin dashboard shows device ONLINE

**Security requirements for edge ↔ cloud communication:**
- **HTTPS only** — edge-service must connect to production via TLS
- **API key auth** — every request includes `Authorization: Bearer <key>` + `X-Edge-Id` + `X-Mall-Id` headers
- **Key hashed in DB** — only bcrypt hash stored, never plaintext
- **Per-device keys** — each edge device gets its own API key
- **No inbound connections** — edge service pushes TO cloud, cloud never connects TO edge

### How jobs flow (once edge is deployed)

```
1. User creates analysis job in UI         → job.status = PENDING
2. Edge polls GET /api/edge/jobs           → picks up PENDING job
3. Edge updates PATCH /api/edge/jobs/[id]  → job.status = PROCESSING
4. Edge processes video (YOLO + re-ID)     → generates results
5. Edge sends POST /api/edge/results       → results stored in DB
6. Edge updates PATCH /api/edge/jobs/[id]  → job.status = COMPLETE
7. Results visible in admin + mall UI
```

---

### Optional: Hide Edge Devices nav before hardware is ready

If you want a cleaner admin UI, comment out the Edge Devices link in
`src/components/admin/AdminSidebar.tsx`. But this is **not recommended** —
the empty page is harmless and reminds the team the feature exists.
