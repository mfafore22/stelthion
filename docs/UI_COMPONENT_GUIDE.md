# Stelthion UI Component Guide

> **For:** Developer refactoring the codebase and migrating frontend data to databases.
> **Generated:** 2026-03-17
> **Codebase:** `/src/` (Next.js 16 App Router)

---

## Table of Contents

1. [Application Layout Overview](#1-application-layout-overview)
2. [Admin Panel — Floorplan Editor & Video Analysis](#2-admin-panel)
3. [Mall Dashboard — Property Detail (7 Tabs)](#3-mall-dashboard)
4. [Footfall Heatmap — Interactive Zone Visualization](#4-footfall-heatmap)
5. [Video Analysis Components](#5-video-analysis-components)
6. [Navigation Shell (MallLeftNav + MallTopBar)](#6-navigation-shell)
7. [Shared UI Library](#7-shared-ui-library)
8. [Hooks & Services](#8-hooks--services)
9. [Internationalization (i18n)](#9-internationalization)
10. [File Path Reference](#10-file-path-reference)

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

The admin panel is a new feature for managing mall floorplans and running video
analysis jobs. It lives entirely under `/admin/*` and requires ADMIN role.

### 2.1 Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)

Vertical navigation with 4 items:

| Item | Route | Icon |
|------|-------|------|
| Dashboard | `/admin/dashboard` | LayoutDashboard |
| Floorplan | `/admin/floorplan/ideapark` | Map |
| Analysis Jobs | `/admin/jobs` | ClipboardList |
| Results & Journeys | `/admin/results` | Route |

- Width: `w-56` with right border
- Active state: accent-600 background, white text, slight upward translation
- Header shows "Video Analysis" title with video icon

### 2.2 Admin Header (`src/components/admin/AdminHeader.tsx`)

Simple 80px header bar:
- Left: Stelthion brandmark + "Admin Video Analysis" title
- Right: Compact language selector (EN/FI)
- Restores language preference from localStorage on mount

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
- Erase (Eraser) — remove elements

**Properties Panel** (`src/components/admin/PropertiesPanel.tsx`):
Context-sensitive form that changes based on what's selected:

- **Zone selected:** zoneId, name (EN), nameFi (FI), category dropdown, capacity,
  area (sqm), baseVisitors, label position (x,y), SVG polygon points (textarea)
- **Store selected:** name, slug, parent zone, bounding box (x, y, w, h)
- **Camera selected:** label, position (x, y), angle (degrees), FOV (degrees),
  range (meters), stream URL, active checkbox

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

// Camera — pin on the floor plan
interface CameraData {
  label: string;
  x: number; y: number;  // Position
  angleDeg: number;       // Viewing angle (0-360)
  fovDeg: number;         // Field of view (degrees)
  rangeM: number;         // Detection range (meters)
  streamUrl: string;      // RTSP/HLS stream URL
  active: boolean;        // Whether camera is active
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

## 5. Video Analysis Components

These four components appear in the "Video Analysis" tab of PropertyDetail.

### 5.1 AnalysisScheduler (`src/components/mall/AnalysisScheduler.tsx`)

Form to create new video analysis jobs:
- Select camera (from `/api/floorplan/{mallId}/cameras`)
- Pick footage date, start/end time (30-min intervals)
- Choose journey count (1, 5, 10, 15, 20 tracked individuals)
- Submit → `POST /api/analysis/jobs`
- Shows last 5 recent jobs with status badges below the form
- Auto-refreshes job list every 15 seconds via SWR

### 5.2 AnalysisResults (`src/components/mall/AnalysisResults.tsx`)

Viewer for completed job results:
- Dropdown to select from completed jobs
- Hourly tabs auto-detected from result data
- Table: Zone ID | Visitor Count | Density (per m²)
- Total visitors footer row

### 5.3 JourneyPlanner (`src/components/mall/JourneyPlanner.tsx`)

Advanced journey analysis form:
- Select origin zone, camera, destination zone from dropdowns
- Zones come from published floorplan data (ground + upper)
- Pick date, time range, journey count
- Submit creates a job with `originZoneId` and `destinationZoneId`
- Results show:
  - Headline: "X of Y tracked visitors reached [destination]"
  - Intermediate zones visited (ranked by frequency)
  - Individual paths: Zone → Zone → Zone with color coding

### 5.4 JourneyResults (`src/components/mall/JourneyResults.tsx`)

Simpler journey viewer (no origin/destination selection):
- Dropdown of completed jobs with journey data
- 3 summary cards: tagged count, re-identified count, recognition rate
- Movement paths list: numbered sequences of zones with arrows

---

## 6. Navigation Shell

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

## 7. Shared UI Library

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
- `language-selector.tsx` — EN/FI toggle (compact variant used in admin)

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

## 8. Hooks & Services

### Custom hooks (`src/hooks/`):
- `useAuth.tsx` — Authentication state management
- `usePublishedFloorplan.ts` — Fetches published floorplan from DB (zones + stores for both floors), SWR with 5-min refresh, returns null if no DB data

### Mall hooks (`src/hooks/mall/`):
- `useMallData.ts` — `useMalls()` for list, `useMallDetail(mallId)` for single mall
- `useMallIdentity.ts` — Brand colors, gradient, typography from brandProfiles.json
- `useEvents.ts` — Fetch events for a mall
- `useWeather.ts` — Fetch weather data

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

## 9. Internationalization

### Setup: `src/lib/i18n/index.ts`
- Languages: English (`en`) and Finnish (`fi`)
- Namespaces: `mall` and `admin`
- Detection: `localStorage` → `navigator` → fallback `en`
- Locale files: `src/locales/{lang}/{namespace}.json`

### Locale files:
- `src/locales/en/mall.json` — Mall dashboard strings (~200 keys)
- `src/locales/fi/mall.json` — Finnish mall strings
- `src/locales/en/admin.json` — Admin panel strings (~100 keys)
- `src/locales/fi/admin.json` — Finnish admin strings

### Usage pattern:
```tsx
const { t } = useTranslation('mall');
// or
const { t } = useTranslation('admin');

<span>{t('tabs.overview')}</span>
```

---

## 10. File Path Reference

### Admin Panel
```
src/app/admin/layout.tsx                          — Auth guard + shell layout
src/app/admin/page.tsx                            — Redirect to /admin/dashboard
src/app/admin/dashboard/page.tsx                  — Server: fetch stats
src/app/admin/dashboard/client.tsx                — Client: render stat cards
src/app/admin/jobs/page.tsx                       — Server: fetch jobs
src/app/admin/jobs/client.tsx                     — Client: render job table
src/app/admin/floorplan/[mallId]/page.tsx         — Floorplan editor page
src/app/admin/results/[jobId]/page.tsx            — Job results viewer

src/components/admin/FloorplanEditor.tsx           — Interactive SVG editor
src/components/admin/AdminSidebar.tsx               — Left navigation
src/components/admin/AdminHeader.tsx                — Top header
src/components/admin/ToolPalette.tsx                — Drawing tool selector
src/components/admin/PropertiesPanel.tsx            — Property editor panel
```

### Admin API Routes
```
src/app/api/admin/floorplan/[mallId]/zones/route.ts     — CRUD zones
src/app/api/admin/floorplan/[mallId]/stores/route.ts    — CRUD stores
src/app/api/admin/floorplan/[mallId]/cameras/route.ts   — CRUD cameras
src/app/api/admin/floorplan/[mallId]/save/route.ts      — Atomic save (all)
src/app/api/admin/floorplan/[mallId]/publish/route.ts   — Publish to live
src/app/api/admin/floorplan/[mallId]/snapshots/route.ts — Backup snapshots
src/app/api/admin/jobs/route.ts                         — List/update jobs
```

### Analysis API Routes
```
src/app/api/analysis/jobs/route.ts                — Create/list analysis jobs
src/app/api/analysis/results/[jobId]/route.ts     — Get job results
src/app/api/analysis/journeys/[jobId]/route.ts    — Get/create journey data
```

### Public Floorplan API
```
src/app/api/floorplan/[mallId]/route.ts           — Get published floorplan
src/app/api/floorplan/[mallId]/cameras/route.ts   — Get published cameras
```

### Mall Dashboard
```
src/app/mall/[mallId]/page.tsx                    — Mall detail page
src/components/mall/PropertyDetail.tsx             — 8-tab main component
src/components/mall/FootfallAnalysis.tsx            — Interactive heatmap
src/components/mall/AnalysisScheduler.tsx           — Schedule analysis jobs
src/components/mall/AnalysisResults.tsx             — View zone visitor counts
src/components/mall/JourneyPlanner.tsx              — Journey origin→destination
src/components/mall/JourneyResults.tsx              — Journey path viewer
src/components/mall/shell/MallLeftNav.tsx           — Left icon navigation
src/components/mall/shell/MallTopBar.tsx            — Top bar with controls
```

### Data & Services
```
src/lib/data/footfall.ts                          — Visitor estimation model
src/lib/data/ideaparkZones.ts                     — Zone definitions + SVG
src/lib/data/ideaparkStorePositions.ts            — Store bounding boxes
src/lib/data/ideaparkStores.ts                    — CMS zone mapping
src/lib/data/ideaparkTransport.ts                 — Transport + parking + demographics
src/lib/data/ideaparkEvents.ts                    — Event schedule
src/lib/data/household.ts                         — Household statistics
src/lib/services/floorplanBackup.ts               — Snapshot service
src/lib/services/postalCodeBoundaries.ts          — Postal code polygons
src/hooks/usePublishedFloorplan.ts                — Floorplan data hook
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
src/locales/en/admin.json                         — English admin strings
src/locales/fi/admin.json                         — Finnish admin strings
src/lib/i18n/index.ts                             — i18n setup
```
