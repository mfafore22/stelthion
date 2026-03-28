# Stelthion UI Component Guide

> **For:** Developer refactoring the codebase and migrating frontend data to databases.
> **Updated:** 2026-03-28
> **Codebase:** `/src/` (Next.js 16 App Router)

---

## Table of Contents

1. [Application Layout Overview](#1-application-layout-overview)
2. [Admin Panel — Floorplan Editor, Video Analysis & Edge Devices](#2-admin-panel)
3. [Mall Dashboard — Property Detail (8 Tabs)](#3-mall-dashboard)
4. [Footfall Heatmap — Interactive Zone Visualization](#4-footfall-heatmap)
5. [Video Analysis Components (5 Modes)](#5-video-analysis-components)
6. [Flow Query & Sankey Visualization](#6-flow-query--sankey-visualization)
7. [Store Behavior Analysis](#7-store-behavior-analysis)
8. [AI Insights Panel](#8-ai-insights-panel)
9. [Edge Device Management](#9-edge-device-management)
10. [PDF/CSV Export](#10-pdfcsv-export)
11. [Navigation Shell (MallLeftNav + MallTopBar)](#11-navigation-shell)
12. [Shared UI Library](#12-shared-ui-library)
13. [Hooks & Services](#13-hooks--services)
14. [Internationalization (i18n)](#14-internationalization)
15. [Edge Ingestion API](#15-edge-ingestion-api)
16. [Multi-Tenant Config & Audit](#16-multi-tenant-config--audit)
17. [File Path Reference](#17-file-path-reference)

---

## 1. Application Layout Overview

The app has two distinct user experiences served from the same Next.js instance:

```
┌──────────────────────────────────────────────────────┐
│                     ADMIN PANEL                       │
│  Route: /admin/*                                      │
│  Auth: NextAuth (ADMIN role required)                 │
│  Layout: AdminSidebar (56px left) + AdminHeader (top) │
│  Purpose: Floorplan editing, video analysis jobs      │
├──────────────────────────────────────────────────────┤
│                   MALL DASHBOARD                      │
│  Route: /mall/[mallId]/*                              │
│  Auth: Custom JWT cookie (property manager login)     │
│  Layout: MallLeftNav (80px) + MallTopBar (80px)       │
│  Purpose: Footfall analytics, tenant insights, KPIs   │
└──────────────────────────────────────────────────────┘
```

### Layout Nesting

**Admin:**
```
src/app/admin/layout.tsx
  ├── AdminSidebar (fixed left, w-56)
  └── flex-1 column
       ├── AdminHeader (h-20, border-bottom)
       ├── Brand Identity Banner (gradient, logo)
       └── <main> scrollable content area
```

**Mall:**
```
src/app/mall/[mallId]/page.tsx
  ├── MallLeftNav (fixed left, w-[80px])
  ├── MallTopBar (fixed top, h-[80px], left offset 80px)
  └── Main content (ml-[80px] mt-[80px])
       └── PropertyDetail (the main 7-tab component)
```

---

## 2. Admin Panel

The admin panel manages mall floorplans, video analysis jobs, and edge devices.
It lives entirely under `/admin/*` and requires ADMIN role.

### 2.1 Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)

Vertical navigation with 5 items + mall selector:

| Item | Route | Icon |
|------|-------|------|
| Dashboard | `/admin/dashboard` | LayoutDashboard |
| Floorplan | `/admin/floorplan/{mallId}` | Map |
| Analysis Jobs | `/admin/jobs` | ClipboardList |
| Results & Journeys | `/admin/results` | Route |
| **Edge Devices** | `/admin/edge` | Cpu |

- Mall selector dropdown when multiple malls are available
- Width: `w-56` with right border
- Active state: accent-600 background, white text, slight upward translation

### 2.2 Admin Header (`src/components/admin/AdminHeader.tsx`)

Simple 80px header bar:
- Left: Stelthion brandmark + "Admin Video Analysis" title
- Right: Compact language selector (EN/FI/SV)
- Restores language preference from localStorage on mount

### 2.2a Admin Brand Banner (`src/components/admin/AdminBrandBanner.tsx`)

Dynamic brand identity banner:
- Fetches active mall info from `/api/admin/malls`
- Gradient background from `getMallIdentity()` (brandProfiles.json)
- Text color auto-calculated from contrast
- Displays mall logo + name + city

### 2.3 Admin Dashboard (`src/app/admin/dashboard/`)

Split into `page.tsx` (server component) and `client.tsx` (client component):
- **Server side:** Queries Prisma for counts of zones, stores, cameras, jobs by status
- **Client side:** Renders stat cards linking to Floorplan, Jobs, Results pages
- Shows job status breakdown: PENDING, PROCESSING, COMPLETE counts

### 2.4 Floorplan Editor (`src/components/admin/FloorplanEditor.tsx`)

This is the most complex new component. It provides an interactive SVG canvas
for editing mall floor plans — drawing zone polygons, placing store rectangles,
and positioning security cameras.

**How it works:**

The editor renders a floor plan image (PNG) as the background layer, with an SVG
overlay on top. All zones, stores, and cameras are SVG elements that can be
selected, moved, and edited.

**Three-panel layout:**
```
┌──────┬─────────────────────────┬──────┐
│ Tool │                         │Props │
│Palette│    SVG Canvas          │Panel │
│ (w-14)│  (floor plan + overlay)│(w-72)│
│      │                         │      │
└──────┴─────────────────────────┴──────┘
         ↑ Top toolbar (save, undo, zoom)
```

**Tool Palette** (`src/components/admin/ToolPalette.tsx`):
- Select (MousePointer2) — click to select elements
- Zone (Pentagon) — draw zone polygons
- Store (RectangleHorizontal) — place store bounding boxes
- Camera (Video) — place camera pins
- **Counter** (Footprints) — place footfall counter devices
- Erase (Eraser) — remove elements

**Properties Panel** (`src/components/admin/PropertiesPanel.tsx`):
Context-sensitive form that changes based on what's selected:

- **Zone selected:** zoneId, name (EN), nameFi (FI), category dropdown, capacity,
  area (sqm), baseVisitors, label position (x,y), SVG polygon points (textarea)
- **Store selected:** name, slug, parent zone, bounding box (x, y, w, h)
- **Camera/Counter selected:** deviceType (camera/counter), label, position (x, y),
  angle (degrees), FOV (degrees), range (meters), stream URL, dataSourceUrl
  (counter data endpoint), active checkbox

**Data types used by the editor:**
```typescript
// Zone — polygon on the floor plan
interface ZoneData {
  zoneId: string;        // e.g. "west-anchor"
  name: string;          // English name
  nameFi: string;        // Finnish name
  category: string;      // e.g. "Aikuisten muoti"
  svgPoints: string;     // SVG polygon points "x1,y1 x2,y2 ..."
  labelX: number;        // Label center X
  labelY: number;        // Label center Y
  capacity: number;      // Max visitor capacity
  areaSqm: number;       // Floor area in square meters
  baseVisitors: number;  // Baseline visitors/hr (Friday 12:00)
}

// Store — rectangle on the floor plan
interface StoreData {
  name: string;
  slug: string;          // URL slug matching ideapark.fi CMS
  zoneId: string;        // Parent zone FK
  x: number; y: number;  // Top-left corner
  w: number; h: number;  // Width and height
}

// Camera or Counter — pin on the floor plan
interface CameraData {
  label: string;
  x: number; y: number;    // Position
  deviceType?: string;      // "camera" | "counter" (nullable)
  angleDeg: number;         // Viewing angle (0-360)
  fovDeg: number;           // Field of view (degrees)
  rangeM: number;           // Detection range (meters)
  streamUrl: string;        // RTSP/HLS stream URL
  dataSourceUrl?: string;   // URL/API endpoint for counter data ingestion
  active: boolean;          // Whether device is active
}
```

**Floor configurations (hardcoded):**
```
Ground floor: viewBox="0 0 1504 704", image: /assets/malls/ideapark/floorplan-ground.png
Upper floor:  viewBox="0 0 1518 688", image: /assets/malls/ideapark/floorplan-upper.png
```

**Save workflow:**
1. User clicks Save button in top toolbar
2. A snapshot of current DB state is created (via `floorplanBackup.ts`)
3. Zones, stores, cameras are sent as separate API calls
4. API endpoint: `PUT /api/admin/floorplan/{mallId}/save` (atomic transaction)

**Undo system:**
- Stack-based — every create/update/delete pushes to undo stack
- Redo available if last action was undo

### 2.5 Jobs Page (`src/app/admin/jobs/`)

- Server component fetches up to 100 jobs ordered by creation date
- Client component renders a table with: camera label, footage date, time range,
  journey count, status badge, created timestamp
- Each row links to the results page for that job

### 2.6 Results Page (`src/app/admin/results/[jobId]/page.tsx`)

Displays detailed results for a single analysis job:

1. **Job header:** camera, date, time range, status badge, metadata
2. **Zone visitor counts:** hourly tabs, table with zoneId / count / density
3. **Journey tracking** (if journeyCount > 0):
   - Summary: tagged count, re-identified count, recognition rate
   - Movement paths: zone → zone → zone sequences with timestamps
4. **Store Behavior** (if mode === STORE_BEHAVIOR):
   - Walk-by / stop / enter metrics per store
   - Aggregated bar chart visualization

### 2.7 Edge Devices Page (`src/app/admin/edge/page.tsx`)

Admin dashboard for monitoring edge device fleet:
- Fetches device list from `/api/admin/edge/devices` (SWR, 30s refresh)
- Status display: ONLINE (green Wifi), OFFLINE (gray WifiOff), ERROR (red AlertTriangle)
- Shows: edgeId, mall, version, GPU info, last heartbeat, status badge
- Device management actions (enable/disable)

---

## 3. Mall Dashboard

### 3.1 PropertyDetail (`src/components/mall/PropertyDetail.tsx`)

This is the central component of the mall dashboard. It renders 8 tabs
(originally 7, plus the new "Video Analysis" tab).

**Props:** `{ mallId: string, showPredicted?: boolean }`

**Data it fetches on mount:**
- Mall detail via `useMallDetail(mallId)` hook
- Brand identity via `useMallIdentity(mallId)` hook
- Live footfall via `getCurrentFootfall()` — refreshed every 5 minutes
- Transport: `GET /api/transport/{mallId}`
- Demographics: `GET /api/demographics/{mallId}`
- Parking: `GET /api/parking/{mallId}`
- Departures: `GET /api/departures/{mallId}`
- Events: `GET /api/events/{mallId}`

**Header section (above tabs):**
- Brand identity banner with gradient background, mall name, city badge, logo
- 4 KPI summary cards: Total Shops, Top Category, Food & Beverage, Home & Living

**Tab structure:**

| Tab | Components Used | Data Source |
|-----|----------------|-------------|
| Overview | TenantMixChart, TopCategoriesTable | Mall detail API |
| Performance | PropertyKPIs, FootfallAnalysis OR FootfallChart, WeatherNextPanel, EventsPanel, TenantPerformanceTable, AlertsStream, ScenarioShortcuts | Static footfall model + APIs |
| Location | TransportAccessibilityKPI, ParkingStatusKPI, DemographicsKPI, CatchmentMap | Transport/Demographics/Parking APIs |
| Tenants | TenantMixChart, TopCategoriesTable, TenantPerformanceTable | Mall detail API + hardcoded mock |
| Events | EventsCalendar | Events API (static schedule) |
| Weather | WeatherNextPanel | Weather API |
| Campaigns | CampaignCard | Hardcoded |
| **Video Analysis** (NEW) | AnalysisScheduler, AnalysisResults, JourneyResults, JourneyPlanner | Analysis APIs + DB |

**Important:** The Performance tab has a toggle between "Chart" view and
"Analysis" view. The Analysis view shows the interactive FootfallAnalysis
heatmap. This toggle only appears for mallId === 'ideapark'.

---

## 4. Footfall Heatmap

### FootfallAnalysis (`src/components/mall/FootfallAnalysis.tsx`)

This is the interactive floor plan heatmap. It is the most visually complex
component in the mall dashboard.

**What it shows:**
- Floor plan image with colored zone overlays
- Each zone is an SVG polygon colored by visitor density (blue→green→yellow→orange→red)
- Store pins (small circles) at each store's location within zones
- Entrance markers (light blue arrows) at building entrances
- A time slider (10:00–21:00) that recalculates all zone visitor counts
- Play button that animates through hours automatically

**How zone colors work:**
```
visitors / capacity ratio:
  < 15%  → #3b82f6 (blue)   = Very quiet
  < 30%  → #22c55e (green)  = Moderate
  < 50%  → #eab308 (yellow) = Busy
  < 70%  → #f97316 (orange) = Very busy
  >= 70% → #ef4444 (red)    = Crowded
```

**Data source priority:**
1. First tries to load **published floorplan from DB** via `usePublishedFloorplan()`
   - Fetches: `GET /api/floorplan/{mallId}?floor=ground` and `?floor=upper`
2. Falls back to **static data files** if DB has no published data:
   - `IDEAPARK_ZONES` / `IDEAPARK_UPPER_ZONES` from `ideaparkZones.ts`
   - `GROUND_FLOOR_STORES` / `GROUND_FLOOR_ENTRANCES` from `ideaparkStorePositions.ts`

**Visitor calculation (currently hardcoded, needs DB replacement):**
```
visitors = zone.baseVisitors × hourlyMultiplier × dayMultiplier × variance
```
See `getZoneVisitors()` in `src/lib/data/ideaparkZones.ts`.

**Interactive features:**
- Click zone → selection popup with stats (visitors, delta, density, area)
- Click zone → ZoneStoreList sidebar appears below map with stores in that zone
- Zoom: mouse wheel or +/- buttons (1x to 4x)
- Pan: drag when zoomed in
- Floor toggle: ground / upper floor switch
- Time slider: drag or play button for hourly animation

---

## 5. Video Analysis Components (3 User-Facing Modes)

The video analysis system is orchestrated by `VideoAnalysis.tsx`
(`src/components/mall/video-analysis/VideoAnalysis.tsx`). It renders a mode
selector bar with 3 user-facing modes and conditionally shows sub-components.

### Mode Bar (3 modes visible to users)

| Mode | Icon | Description |
|------|------|-------------|
| `ZONE_COUNT` | Eye | Zone footfall counter — single camera |
| `JOURNEY_MAP` | Route | Multi-zone journey visualization |
| `FLOW_QUERY` | GitBranch | Visitor flow analysis between zones |

**Hidden/auto-detected modes** (exist in type system but not in mode bar):
- `AB_TRACKING` — auto-detected when 2 cameras selected (merged into flow query UX)
- `STORE_BEHAVIOR` — used in results viewer only

Mode is auto-inferred from selection (`inferMode()` in types.ts):
- 1 camera selected → ZONE_COUNT
- 2 cameras → AB_TRACKING (auto)
- 2+ zones → JOURNEY_MAP
- Explicit FLOW_QUERY mode + 1+ zone → FLOW_QUERY

### Layout by mode

**ZONE_COUNT / JOURNEY_MAP:** Full-width floorplan with SelectionSummary,
VideoAnalysisConfig form, results area, and JobHistory below.

**FLOW_QUERY:** 3-column grid — FlowQuerySidebar (1/3) + FootfallAnalysis
with FlowSankeyOverlay (2/3). Zone clicks set origin/destination.

### 5.1 Sub-components

- **SelectionSummary** — Shows selected cameras/zones with deselect buttons
- **VideoAnalysisConfig** — Date/time/journey-count form, submit button
- **ZoneCountResult** — Hourly visitor counts table for ZONE_COUNT jobs
- **TrackingResult** — Camera A→B tracking stats for AB_TRACKING results
- **JourneyMapResult** — Zone sequence paths for JOURNEY_MAP results
- **JobHistory** — List of past jobs with status badges, click to view results

### 5.2 FlowQuerySidebar (`src/components/mall/FlowQuerySidebar.tsx`)

Flow analysis form panel with automatic direction inference:
- **Props:** `mallId`, `origin`, `destination`, `onOriginChange`, `onDestinationChange`, `zones?`
- Single zone selected → outbound flow; two zones → between-zones flow
- Date/time range selector (default: today, 10:00–11:00, 30-min intervals)
- Submits to `POST /api/flow-query/{mallId}`
- Bilingual (EN/FI)

### 5.3 FlowQueryResults (`src/components/mall/FlowQueryResults.tsx`)

Displays narrative analysis + horizontal bar breakdown:
- **Props:** `data: FlowQueryResponse`, `onReset`
- Bilingual narrative; direction labels (outbound/inbound/between)
- Horizontal bars with visitor counts (9-color palette)

### 5.4 FlowSankeyOverlay (`src/components/mall/FlowSankeyOverlay.tsx`)

SVG overlay drawing animated bezier flow arrows on the floorplan:
- **Props:** `data: FlowQueryResponse`, `floor: 'ground' | 'upper'`
- Quadratic bezier curves, animated pulse at origin
- Stroke width proportional to visitor count

### 5.5 ZoneStorePicker (`src/components/mall/ZoneStorePicker.tsx`)

Searchable dropdown for zone/store selection:
- **Props:** `value`, `onChange`, `exclude?`, `placeholder?`, `label?`, `zones?`
- Grouped by floor; store selection resolves to parent zone
- Falls back to static zone data if no external zones provided

### 5.6 StoreBehaviorResult (`src/components/mall/video-analysis/StoreBehaviorResult.tsx`)

Visualizes store behavioral metrics (results viewer only):
- **Props:** `behaviors: StoreBehavior[]`, `dateStr`, `timeRange`
- Aggregates by store: walkBy, stop, enter counts + rates
- Horizontal bar chart (Recharts), animated via Framer Motion

### 5.7 InsightPanel (`src/components/mall/video-analysis/InsightPanel.tsx`)

LLM-generated insights display:
- **Props:** `jobId: string`
- Fetches/generates via `/api/analysis/insights/{jobId}`
- Alert-level styling: critical (red), warning (amber), info (blue)
- Source indicator: CPU-edge or Server

---

## 6. Edge Device Management

### Edge Admin Page (`src/app/admin/edge/page.tsx`)

Admin dashboard for monitoring edge device fleet:
- Fetches from `/api/admin/edge/devices` (SWR, 30s refresh)
- Status: ONLINE (green Wifi), OFFLINE (gray WifiOff), ERROR (red AlertTriangle)
- Columns: edgeId, mall, version, GPU info, last heartbeat, status badge

---

## 7. PDF/CSV Export

### reportGenerator (`src/lib/export/reportGenerator.ts`)

Client-side report generation:
- **PDF:** Branded Stelthion cover, floorplan screenshot (html2canvas), zone visitor
  table, flow analysis narrative, LLM insights
- **CSV:** Raw tabular data download
- **Dependencies:** jsPDF, jspdf-autotable, html2canvas
- Integrated into MallTopBar export dropdown

---

## 8. Navigation Shell

### MallLeftNav (`src/components/mall/shell/MallLeftNav.tsx`)

Fixed 80px vertical icon-only sidebar:

| Item | Icon | Route |
|------|------|-------|
| Portfolio | Building2 or Boxes | `/tenant/{slug}/portfolio` or `/mall/{mallId}` |
| Properties | Building | `/mall/properties` (hidden for single-property) |
| Campaigns | Megaphone | `/mall/campaigns` |
| Analytics | BarChart3 | `/mall/analytics` |
| Scenarios | FlaskConical | `/mall/scenarios` |
| Assistants | Bot | `/mall/assistants` |
| ShopperMind | Brain | `/mall/shoppermind` |

- Single-property users see mall name instead of "Portfolio"
- Active item: dark background, white text, slight lift animation
- Radix Tooltip on hover shows label + description
- Optional management company badge at bottom

### MallTopBar (`src/components/mall/shell/MallTopBar.tsx`)

Fixed 80px horizontal header (offset 80px from left):

| Section | Contents |
|---------|----------|
| Left | Stelthion brandmark (176×176 scaled) |
| Center | Date input + Time input (temporal navigation) |
| Right | AI Concierge toggle (with badge), Language selector, Export dropdown (PDF/CSV/Excel), User profile menu (company, userId, logout) |

- Glass effect background with bottom border
- z-index 40 (above content, below modals)

---

## 9. Shared UI Library

All foundational UI primitives live in `src/components/ui/`:

### Radix UI-based components:
`accordion.tsx`, `alert-dialog.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`,
`checkbox.tsx`, `collapsible-card.tsx`, `dialog.tsx`, `drawer.tsx`,
`dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `progress.tsx`,
`scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `slider.tsx`,
`switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`

### Custom components:
- `alert.tsx` / `alert-banner.tsx` — Status alerts
- `metric-card.tsx` — KPI display card
- `sparkline.tsx` — Inline trend chart
- `variable-control.tsx` — Slider with label
- `VacancyGradientBar.tsx` — Visual vacancy indicator
- `language-selector.tsx` — EN/FI/SV toggle (compact variant used in admin)

### Mall-specific UI (`src/components/mall/ui/`):
- `MallKPICard.tsx` — Styled KPI card with gradient, accent color, trend
- `MallButton.tsx` — Mall-branded button
- `MallBadge.tsx` — Status badge
- `MallInput.tsx` — Themed input field
- `MallCard.tsx` — Info card with status
- `MallCardHeatmap.tsx` — Card variant with heatmap overlay
- `TrendShape.tsx` — Mini sparkline indicator

### Styling conventions:
- Color tokens: `bo-neutral-*`, `bo-primary-*`, `bo-accent-*`, `bo-warning-*`
- Shadows: `shadow-bo-sm`, `shadow-bo-md`, `shadow-bo-lg`, `shadow-bo-glass`
- Animations: `ease-bo-out-expo`, `duration-300`

---

## 10. Hooks & Services

### Custom hooks (`src/hooks/`):
- `useAuth.tsx` — Authentication state management
- `usePublishedFloorplan.ts` — Fetches published floorplan from DB (zones + stores for both floors), SWR with 5-min refresh, returns null if no DB data
- `useWeather.ts` — Lightweight wrapper for weather + forecast data (10-min refresh)

### Mall hooks (`src/hooks/mall/`):
- `useMallData.ts` — `useMallDetail(mallId)` for single mall detail
- `useMallIdentity.ts` — Brand colors, gradient, typography from brandProfiles.json
- `useEvents.ts` — Fetch events for a mall
- `useWeather.ts` — Real-time weather with seasonal/time-of-day variations and foot traffic impact

### Services (`src/lib/services/`):
- `floorplanBackup.ts` — Creates JSON snapshots of floorplan state before saves, auto-prunes to last 20 snapshots
- `postalCodeBoundaries.ts` — Returns simplified WGS84 polygon boundaries for catchment postal codes (hardcoded, needs MML API replacement)

### Data files (`src/lib/data/`):
- `footfall.ts` — Visitor estimation model (5M annual, hourly curves)
- `ideaparkZones.ts` — 18 zone definitions with SVG polygons and visitor baselines
- `ideaparkStorePositions.ts` — 49 store bounding boxes + 4 entrances
- `ideaparkStores.ts` — CMS zone-mapping helpers (prefix → zone ID)
- `ideaparkTransport.ts` — Bus routes, rail connections, demographics, parking
- `ideaparkEvents.ts` — 11 nearby venue events (relative dates)
- `household.ts` — 7 postal code household statistics

**ALL data files contain hardcoded Ideapark-specific data that needs to be migrated
to database tables. See `docs/IDEAPARK_FRONTEND_DATA_REFERENCE.md` for the
complete data extraction with every value documented.**

---

## 11. Internationalization

### Setup: `src/lib/i18n/index.ts`
- Languages: English (`en`), Finnish (`fi`), Swedish (`sv`)
- Default language: Finnish (`fi`)
- Fallback language: English (`en`)
- Namespaces: `mall` and `admin`
- Detection: `localStorage` only (key: `stelthion-language`), no browser auto-detect
- Config: `src/lib/i18n/config.ts` (16 supported languages, currency/locale maps)

### Locale files:
- `src/locales/en/mall.json` — English mall strings
- `src/locales/fi/mall.json` — Finnish mall strings
- `src/locales/sv/mall.json` — Swedish mall strings
- `src/locales/en/admin.json` — English admin strings
- `src/locales/fi/admin.json` — Finnish admin strings
- `src/locales/sv/admin.json` — Swedish admin strings

### Usage pattern:
```tsx
const { t } = useTranslation('mall');
// or
const { t } = useTranslation('admin');

<span>{t('tabs.overview')}</span>
```

---

## 12. Edge Ingestion API

Edge devices (GPU boxes in malls) push data to these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/edge/register` | POST | Bootstrap device with edgeId, mallId, apiKey |
| `/api/edge/heartbeat` | POST | Keep-alive + status update |
| `/api/edge/footfall` | POST | Visitor count readings with dwell time |
| `/api/edge/behavior` | POST | Store behavior observations (walkBy, stop, enter) |
| `/api/edge/results` | POST | Analysis results from edge processing |
| `/api/edge/journeys` | POST | Journey session data |
| `/api/edge/insights` | POST | LLM-generated insights with alert levels |
| `/api/edge/alerts` | POST | Real-time alerts |
| `/api/edge/jobs` | GET | Poll for pending jobs to process |

All edge endpoints authenticate via API key hash stored in EdgeDevice model.

---

## 13. Multi-Tenant Config & Audit

### Tenant Registry (`src/config/tenant-registry.ts`)
- Dynamic multi-tenant configuration via `TENANTS_JSON` env var
- Supports isolated tenants without code changes

### Mall Auth (`src/config/mall-auth.ts`)
- Secure mall property authentication with bcrypt hashing
- DEMO_MODE fallback password support (must be removed before production)

### Audit Logger (`src/lib/audit/logger.server.ts`)
- Server-side audit logging for security events
- Event types: AUTH, CROSS_TENANT_ACCESS, DATA_EXPORT, CONFIG_CHANGE, SESSION
- Optional file persistence

### Admin Auth Helper (`src/lib/admin-auth.ts`)
- `requireAdmin()` — validates ADMIN role on protected API routes
- Returns `{ user }` or `{ error: NextResponse }` pattern

---

## 14. File Path Reference

### Admin Panel
```
src/app/admin/layout.tsx                          — Auth guard + shell layout
src/app/admin/page.tsx                            — Redirect to /admin/dashboard
src/app/admin/dashboard/page.tsx                  — Server: fetch stats
src/app/admin/dashboard/client.tsx                — Client: render stat cards
src/app/admin/jobs/page.tsx                       — Server: fetch jobs
src/app/admin/jobs/client.tsx                     — Client: render job table
src/app/admin/floorplan/[mallId]/page.tsx         — Floorplan editor page
src/app/admin/results/[jobId]/page.tsx            — Job results viewer (+ STORE_BEHAVIOR)
src/app/admin/edge/page.tsx                       — Edge device management

src/components/admin/FloorplanEditor.tsx           — Interactive SVG editor (+ counter support)
src/components/admin/AdminSidebar.tsx               — Left navigation (+ Edge Devices)
src/components/admin/AdminHeader.tsx                — Top header (EN/FI/SV)
src/components/admin/AdminBrandBanner.tsx           — Dynamic brand identity banner
src/components/admin/ToolPalette.tsx                — Drawing tool selector (+ counter)
src/components/admin/PropertiesPanel.tsx            — Property editor panel (+ deviceType, dataSourceUrl)
```

### Admin API Routes
```
src/app/api/admin/floorplan/[mallId]/zones/route.ts     — CRUD zones
src/app/api/admin/floorplan/[mallId]/stores/route.ts    — CRUD stores
src/app/api/admin/floorplan/[mallId]/cameras/route.ts   — GET + PATCH cameras (deviceType, dataSourceUrl)
src/app/api/admin/floorplan/[mallId]/save/route.ts      — Atomic save (all)
src/app/api/admin/floorplan/[mallId]/publish/route.ts   — Publish to live
src/app/api/admin/floorplan/[mallId]/snapshots/route.ts — Backup snapshots
src/app/api/admin/jobs/route.ts                         — List/update jobs
src/app/api/admin/malls/route.ts                        — List all malls (admin selector)
src/app/api/admin/edge/devices/route.ts                 — Edge device management
```

### Analysis API Routes
```
src/app/api/analysis/jobs/route.ts                — Create/list analysis jobs (auth + STORE_BEHAVIOR)
src/app/api/analysis/results/[jobId]/route.ts     — Get job results (+ behaviors)
src/app/api/analysis/journeys/[jobId]/route.ts    — Get/create journey data
src/app/api/analysis/insights/[jobId]/route.ts    — Get/generate AI insights
src/app/api/flow-query/[mallId]/route.ts          — Flow analysis between zones
src/app/api/report/narrative/route.ts             — LLM narrative generation (Ollama + fallback)
```

### Public Floorplan API
```
src/app/api/floorplan/[mallId]/route.ts           — Get published floorplan
src/app/api/floorplan/[mallId]/cameras/route.ts   — Get published cameras
```

### Mall Dashboard
```
src/app/mall/[mallId]/page.tsx                    — Mall detail page (+ export)
src/components/mall/PropertyDetail.tsx             — 8-tab main component
src/components/mall/FootfallAnalysis.tsx            — Interactive heatmap (+ overlay support)
src/components/mall/video-analysis/VideoAnalysis.tsx — Master orchestrator (3 UI modes)
src/components/mall/video-analysis/constants.ts     — Mode metadata + time slots
src/components/mall/video-analysis/types.ts         — Types + inferMode()
src/components/mall/video-analysis/StoreBehaviorResult.tsx — Store metrics chart
src/components/mall/video-analysis/InsightPanel.tsx — AI insights display
src/components/mall/FlowQuerySidebar.tsx            — Flow analysis form
src/components/mall/FlowQueryResults.tsx            — Flow narrative + bars
src/components/mall/FlowSankeyOverlay.tsx           — SVG flow arrows on floorplan
src/components/mall/ZoneStorePicker.tsx             — Zone/store dropdown
src/components/mall/AnalysisScheduler.tsx           — Schedule analysis jobs
src/components/mall/AnalysisResults.tsx             — View zone visitor counts
src/components/mall/JourneyPlanner.tsx              — Journey origin→destination
src/components/mall/JourneyResults.tsx              — Journey path viewer
src/components/mall/shell/MallLeftNav.tsx           — Left icon navigation
src/components/mall/shell/MallTopBar.tsx            — Top bar (+ export dropdown)
```

### Data & Services
```
src/lib/data/footfall.ts                          — Visitor estimation model (hour-based)
src/lib/data/ideaparkZones.ts                     — Zone definitions + SVG
src/lib/data/ideaparkStorePositions.ts            — Store bounding boxes
src/lib/data/ideaparkStores.ts                    — CMS zone mapping
src/lib/data/ideaparkTransport.ts                 — Transport + parking + demographics
src/lib/data/ideaparkEvents.ts                    — Event schedule
src/lib/data/household.ts                         — Household statistics
src/lib/services/floorplanBackup.ts               — Snapshot service
src/lib/services/postalCodeBoundaries.ts          — Postal code polygons
src/lib/export/reportGenerator.ts                 — PDF/CSV export (jsPDF + html2canvas)
src/lib/weather/utils.ts                          — Weather utility functions
src/lib/weather/fmi.ts                            — Finnish Meteorological Institute integration
src/lib/admin-auth.ts                             — requireAdmin() guard
src/lib/audit/logger.server.ts                    — Audit logging
src/config/tenant-registry.ts                     — Multi-tenant config
src/config/mall-auth.ts                           — Mall property auth
src/hooks/usePublishedFloorplan.ts                — Floorplan data hook
src/hooks/useWeather.ts                           — Weather + forecast hook
src/hooks/mall/useMallData.ts                     — useMallDetail(mallId) hook
src/hooks/mall/useWeather.ts                      — Weather with foot traffic impact
```

### Database
```
prisma/schema.prisma                              — All models (see migrations)
prisma/seed.ts                                    — Demo users seed
prisma/seed-floorplan.ts                          — Ideapark zones + stores seed
prisma/migrations/20260314203428_admin_floorplan_analysis/  — Zones, stores, cameras, jobs
prisma/migrations/20260315180122_add_floorplan_publish_fields/ — publishedAt columns
prisma/migrations/20260315181356_add_floorplan_snapshots/     — Snapshot table
prisma/migrations/20260316112227_add_journey_planner_fields/  — Origin/destination on jobs
```

### Localization
```
src/locales/en/mall.json                          — English mall strings
src/locales/fi/mall.json                          — Finnish mall strings
src/locales/sv/mall.json                          — Swedish mall strings
src/locales/en/admin.json                         — English admin strings
src/locales/fi/admin.json                         — Finnish admin strings
src/locales/sv/admin.json                         — Swedish admin strings
src/lib/i18n/index.ts                             — i18n setup (default: fi)
src/lib/i18n/config.ts                            — Language config (16 languages, currencies)
```

### Edge Ingestion API
```
src/app/api/edge/register/route.ts                — Device bootstrap
src/app/api/edge/heartbeat/route.ts               — Keep-alive + status
src/app/api/edge/footfall/route.ts                — Visitor count readings
src/app/api/edge/behavior/route.ts                — Store behavior observations
src/app/api/edge/results/route.ts                 — Analysis results from edge
src/app/api/edge/journeys/route.ts                — Journey session data
src/app/api/edge/insights/route.ts                — LLM-generated insights
src/app/api/edge/alerts/route.ts                  — Real-time alerts
src/app/api/edge/jobs/route.ts                    — Poll pending jobs
```
