# Stelthion Mall Intelligence Platform

A Next.js mall operator dashboard delivering real-time KPIs, footfall analytics, event impact modelling, and an AI Concierge — initially deployed for Ideapark Lempäälä.

## Tech Stack

- **Next.js 15** (App Router, standalone output)
- **TypeScript**
- **Tailwind CSS** with custom `bo-*` design tokens
- **Prisma** + **PostgreSQL** (main SaaS dashboard)
- **SWR** (data fetching with caching)
- **react-i18next** (EN/FI, localStorage-persisted)
- **Recharts** (KPI charts)
- **Mapbox GL** (catchment & postal code maps)
- **Framer Motion** (panel animations)
- **Three.js** (3D mall model viewer)

## Project Structure

```
src/
  app/
    mall/[mallId]/          # Mall operator dashboard (7-tab PropertyDetail)
    mall/login/             # Mall auth (userId + OTP 2FA)
    mall/portfolio/         # Multi-property KPI overview
    tenant/[tenantId]/      # Multi-property tenant routing
    dashboard/              # Main SaaS admin dashboard (NextAuth)
    api/                    # API routes (mall data, auth, weather, events)
  components/
    mall/                   # Mall UI — KPI cards, charts, maps, panels
    mall/shell/             # MallTopBar, MallLeftNav, MallConciergeWrapper
    mall/ui/                # MallKPICard, MallBadge, MallButton, etc.
    mall/scenarios/         # Scenario planner and results modal
    concierge/              # Stelthion Concierge panel + conversation UI
    ui/                     # Shared UI primitives (Radix-based)
  contexts/
    SessionContext.tsx      # Mall operator session (cookie-based)
  hooks/mall/               # useEvents, useMallData, useWeather
  lib/
    auth/                   # OTP store, rate limiter, session
    data/                   # Ideapark footfall, events, transport, zones
    events/                 # Gravity-based footfall impact model
    i18n/                   # i18next config, hooks, formatters
    mall/                   # Mall identity, database helpers, logos
    weather/                # Weather utils and footfall correlation
  services/concierge/       # WebSocket client, agent router, types
  locales/
    en/mall.json            # English translations
    fi/mall.json            # Finnish translations
  config/
    mall-auth.ts            # Mall credential config
    tenant-registry.ts      # Tenant-to-mall routing registry
```

## Features

### Mall Operator Dashboard (`/mall/[mallId]`)
- **Overview** — live KPIs: visitors, revenue, occupancy, weather
- **Performance** — footfall charts, floor heatmap, zone analytics
- **Location** — catchment map, postal code demographics, household data, transport accessibility
- **Tenants** — tenant mix chart, performance table, vacancy bar
- **Events** — upcoming events with venue distances, banner images, gravity-based footfall impact model
- **Weather** — current conditions, 5-day forecast, seasonal footfall correlation
- **Campaigns** — active campaign cards with ROI tracking

### Authentication
- Mall login: `userId` + bcrypt password + OTP 2FA (email)
- Cookie-based session with rate limiting and audit logging
- Main SaaS dashboard: email/password via NextAuth + PostgreSQL

### Stelthion Concierge
- Slide-in AI panel with 6 specialised agents (Sales, Footfall, Events, Parking, Trends, General)
- WebSocket streaming when `NEXT_PUBLIC_CONCIERGE_WS_URL` is set
- Full EN/FI i18n, bo-neutral UI theme

### Internationalisation
- English (default) and Finnish
- Language preference persisted to `localStorage` (`stelthion-language`)
- Locale-aware date/time/number formatting throughout

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (for main dashboard)

### Installation

```bash
git clone https://github.com/mfafore22/stelthion.git
cd stelthion
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption |
| `NEXTAUTH_URL` | Application URL (e.g. `http://localhost:3000`) |
| `IDEAPARK_PASSWORD_HASH` | bcrypt hash for mall operator password (use `\$` to escape `$`) |
| `OTP_SECRET` | Secret key for OTP generation |
| `EMAIL_FROM` | Sender address for OTP emails |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP config for OTP delivery |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL public token for catchment maps |
| `NEXT_PUBLIC_CONCIERGE_WS_URL` | WebSocket URL for AI Concierge (optional) |

### Database Setup (main dashboard only)

```bash
npx prisma db push
npx prisma generate
npm run dev
```

### Development

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
npm test           # Run Jest test suite
```

### Mall Operator Login (local demo)

```
URL:      http://localhost:3000/mall/login
userId:   KoyIdeaparkOy
password: ideapark2024
mallId:   ideapark
```

## API Routes

### Mall Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mall/[mallId]` | Mall KPIs and metadata |
| GET | `/api/events/[mallId]` | Upcoming events with venue data |
| GET | `/api/weather/current` | Current weather conditions |
| GET | `/api/weather/forecast` | 5-day forecast |
| GET | `/api/parking/[mallId]` | Parking occupancy |
| GET | `/api/transport/[mallId]` | Transport accessibility data |
| GET | `/api/demographics/[mallId]` | Postal code demographics |

### Mall Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mall/auth/login` | userId + password → OTP sent |
| POST | `/api/mall/auth/verify-otp` | OTP → session cookie |
| GET | `/api/mall/auth/session` | Current session info |

## Deployment

The app is configured for standalone Next.js output (`output: 'standalone'` in `next.config.ts`), suitable for Docker or any Node.js host.

```dockerfile
# See dockerfile in repo root
docker build -t stelthion .
docker run -p 3000:3000 --env-file .env stelthion
```

## License

Private — All rights reserved
