# Space Optimizer — Backend Handoff

This document is the spec for the backend half of the Space Optimizer feature. The frontend lands in C2 first (under `src/app/mall/space-optimizer/`, `src/app/demo/realidea/`, `src/components/mall/space-optimizer/`, `src/lib/space-optimizer/types.ts` + mock fixture). It runs end-to-end against a local mock fixture so you can review the UI without any backend code present.

When you ship the backend per this doc, the frontend switches from mock → live by flipping the default mode in `src/lib/space-optimizer/fetcher.ts`. Nothing else in the UI needs to change.

> **Commit hygiene:** keep backend in commits separate from the frontend commit. The frontend commit only touches `src/app/mall/space-optimizer/`, `src/app/demo/realidea/`, `src/components/mall/space-optimizer/`, `src/lib/space-optimizer/{types,fetcher,mock-fixture}.ts`, the mall i18n JSON files, and `src/components/mall/shell/MallLeftNav.tsx` (one nav-item addition).

---

## Hard guard-rails

- **Do not edit auth / 2FA layers.** No changes to `src/auth.ts`, `src/auth.config.ts`, `src/lib/auth/*`, NextAuth config, session middleware, login/OTP routes, or any 2FA helper.
- **Prisma migrations are additive only.** Three nullable columns on `FloorplanZone`. Run `npx prisma migrate dev --create-only` first and review the SQL before applying.
- Never run `prisma migrate reset` or `prisma db push --accept-data-loss` against any non-local database.

---

## 1. Schema additions

`prisma/schema.prisma`, append to the existing `FloorplanZone` model (between `baseVisitors` and `publishedAt`):

```prisma
model FloorplanZone {
  id           String    @id @default(cuid())
  mallId       String
  floor        String
  zoneId       String
  name         String
  nameFi       String
  category     String
  subcategory  String?
  drawShape    String    @default("polygon")
  svgPoints    String
  labelX       Float
  labelY       Float
  capacity     Int
  areaSqm      Int
  baseVisitors Int       @default(0)

  // ── NEW: tenant / lease fields (all nullable, additive) ──
  tenantName     String?
  monthlyRentEur Decimal?  @db.Decimal(12, 2)
  leaseEndsOn    DateTime?

  publishedAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  mall    Mall     @relation(fields: [mallId], references: [mallId], onDelete: Cascade)
  cameras Camera[]

  @@unique([mallId, floor, zoneId])
}
```

Generate the migration with a name that reflects the change, not a feature:

```sh
npx prisma migrate dev --create-only --name add_zone_tenant_fields
```

The generated SQL should be only:

```sql
ALTER TABLE "FloorplanZone" ADD COLUMN "tenantName" TEXT;
ALTER TABLE "FloorplanZone" ADD COLUMN "monthlyRentEur" DECIMAL(12,2);
ALTER TABLE "FloorplanZone" ADD COLUMN "leaseEndsOn" TIMESTAMP(3);
```

If the generated SQL contains anything else, stop and review.

## 2. Plan-feature flag

`src/lib/plan-gate.ts` — extend `PlanFeatures`:

```ts
export type PlanFeatures = {
  shoppermind: boolean;
  edgeVision: boolean;
  concierge: boolean;
  spaceAllocation: boolean; // NEW
  maxMalls: number;
};

const DEFAULT_FEATURES: PlanFeatures = {
  shoppermind: false,
  edgeVision: false,
  concierge: false,
  spaceAllocation: false, // NEW
  maxMalls: 1,
};

export function parsePlanFeatures(raw: unknown): PlanFeatures {
  if (!raw || typeof raw !== 'object') return DEFAULT_FEATURES;
  const f = raw as Record<string, unknown>;
  return {
    shoppermind: Boolean(f.shoppermind),
    edgeVision: Boolean(f.edgeVision),
    concierge: Boolean(f.concierge),
    spaceAllocation: Boolean(f.spaceAllocation), // NEW
    maxMalls: typeof f.maxMalls === 'number' ? f.maxMalls : 1,
  };
}
```

The `/api/mall/my-features` route already serves whatever `PlanFeatures` returns, so the new flag flows to the frontend automatically.

## 3. Seed additions (Realidea / Sello)

`prisma/seed.ts` — add a second customer block after the Ideapark block (after line 117, before the `console.log('🌱 Seeding complete!')`). Idempotent upserts following the same pattern Ideapark uses.

```ts
// ── REALIDEA / SELLO ──────────────────────────────────────
// Skip if already seeded (idempotency guard, mirrors Ideapark).
const existingRealidea = await prisma.customer.findUnique({ where: { id: 'realidea' } });
if (!existingRealidea) {
  // Plan with spaceAllocation enabled.
  const realideaPlan = await prisma.plan.upsert({
    where: { name: 'Realidea Suite' },
    update: {
      features: {
        shoppermind: true,
        edgeVision: false,
        concierge: true,
        spaceAllocation: true,
        maxMalls: 4,
      },
    },
    create: {
      name: 'Realidea Suite',
      features: {
        shoppermind: true,
        edgeVision: false,
        concierge: true,
        spaceAllocation: true,
        maxMalls: 4,
      },
    },
  });

  const realidea = await prisma.customer.create({
    data: { id: 'realidea', name: 'Realidea Oy', planId: realideaPlan.id },
  });

  await prisma.user.upsert({
    where: { email: 'realidea-demo@stelthion.com' },
    update: {},
    create: {
      email: 'realidea-demo@stelthion.com',
      password: hashedPassword, // reuses the bcrypt'd dev password from above
      name: 'Realidea Demo',
      role: 'ADMIN',
      customerId: realidea.id,
    },
  });

  await prisma.mall.upsert({
    where: { mallId: 'sello' },
    update: { name: 'Sello', city: 'Espoo', totalShops: 170 },
    create: {
      mallId: 'sello',
      name: 'Sello',
      city: 'Espoo',
      totalShops: 170,
      status: 'LIVE',
      customerId: realidea.id,
    },
  });

  await prisma.mallStats.create({
    data: {
      mallId: 'sello',
      currentVisitors: 5400,
      annualVisitors: 22000000,
      annualSales: 540000000,
      dwellTime: 96,
      conversionRate: 24.8,
    },
  });

  await prisma.mallBranding.create({
    data: {
      mallId: 'sello',
      primaryColor: '#264653',
      secondaryColor: '#2A9D8F',
      accentColor: '#E76F51',
      gradientFrom: '#264653',
      gradientTo: '#1d3640',
    },
  });

  // Sello market mapping — reuse helsinki-fi (Espoo is greater Helsinki).
  await prisma.mallMarketMapping.upsert({
    where: { mallId: 'sello' },
    update: { marketId: 'helsinki-fi' },
    create: { mallId: 'sello', marketId: 'helsinki-fi' },
  });

  // Categories tuned to Sello's real mix (heavier Fashion + F&B).
  const sellocats = [
    { mallId: 'sello', name: 'Fashion',            shopCount: 58, percentage: 34.1 },
    { mallId: 'sello', name: 'Food & Beverage',    shopCount: 28, percentage: 16.5 },
    { mallId: 'sello', name: 'Beauty & Health',    shopCount: 22, percentage: 12.9 },
    { mallId: 'sello', name: 'Sports',             shopCount: 14, percentage: 8.2 },
    { mallId: 'sello', name: 'Home & Living',      shopCount: 16, percentage: 9.4 },
    { mallId: 'sello', name: 'Children',           shopCount: 10, percentage: 5.9 },
    { mallId: 'sello', name: 'Daily Goods & Tech', shopCount: 12, percentage: 7.1 },
    { mallId: 'sello', name: 'Services',           shopCount: 10, percentage: 5.9 },
  ];
  for (const cat of sellocats) {
    await prisma.mallCategory.upsert({
      where: { mallId_name: { mallId: cat.mallId, name: cat.name } },
      update: { shopCount: cat.shopCount, percentage: cat.percentage },
      create: cat,
    });
  }

  // 12 representative zones, two floors. Square polygons on a 1000×1000 canvas.
  const zones: Array<Omit<Parameters<typeof prisma.floorplanZone.create>[0]['data'], 'id' | 'createdAt' | 'updatedAt'>> = [
    { mallId: 'sello', floor: 'L1', zoneId: 'L1-A', name: 'Fashion North',     nameFi: 'Muoti pohjoinen',  category: 'Fashion',            svgPoints: '50,50 350,50 350,300 50,300',     labelX: 200, labelY: 175, capacity: 220, areaSqm: 1600, baseVisitors: 14000, tenantName: 'Lindex Concept Store', monthlyRentEur: 28000 as unknown as never, leaseEndsOn: new Date('2026-08-31') },
    { mallId: 'sello', floor: 'L1', zoneId: 'L1-B', name: 'Fashion South',     nameFi: 'Muoti etelä',      category: 'Fashion',            svgPoints: '400,50 700,50 700,300 400,300',   labelX: 550, labelY: 175, capacity: 200, areaSqm: 1500, baseVisitors: 11500, tenantName: 'Vero Moda',            monthlyRentEur: 24000 as unknown as never, leaseEndsOn: new Date('2025-12-31') },
    { mallId: 'sello', floor: 'L1', zoneId: 'L1-C', name: 'Anchor Sports',     nameFi: 'Urheilu',          category: 'Sports',             svgPoints: '750,50 950,50 950,300 750,300',   labelX: 850, labelY: 175, capacity: 240, areaSqm: 1900, baseVisitors: 12200, tenantName: 'XXL Sports & Outdoor', monthlyRentEur: 42000 as unknown as never, leaseEndsOn: new Date('2028-03-31') },
    { mallId: 'sello', floor: 'L1', zoneId: 'L1-D', name: 'Beauty Pod',        nameFi: 'Kauneuden tila',   category: 'Beauty & Health',    svgPoints: '50,350 250,350 250,500 50,500',   labelX: 150, labelY: 425, capacity: 90,  areaSqm: 320,  baseVisitors: 7200,  tenantName: 'KICKS',                monthlyRentEur: 9800  as unknown as never, leaseEndsOn: new Date('2026-04-30') },
    { mallId: 'sello', floor: 'L1', zoneId: 'L1-E', name: 'Wellness Corner',   nameFi: 'Hyvinvointinurkka',category: 'Beauty & Health',    svgPoints: '300,350 500,350 500,500 300,500', labelX: 400, labelY: 425, capacity: 70,  areaSqm: 260,  baseVisitors: 4900,  tenantName: 'Life Apteekki',        monthlyRentEur: 7800  as unknown as never, leaseEndsOn: new Date('2026-10-31') },
    { mallId: 'sello', floor: 'L1', zoneId: 'L1-F', name: 'Tech & Mobile',     nameFi: 'Teknologia',       category: 'Daily Goods & Tech', svgPoints: '550,350 750,350 750,500 550,500', labelX: 650, labelY: 425, capacity: 110, areaSqm: 480,  baseVisitors: 6800,  tenantName: 'Power',                monthlyRentEur: 12500 as unknown as never, leaseEndsOn: new Date('2027-06-30') },
    { mallId: 'sello', floor: 'L1', zoneId: 'L1-G', name: 'Children Play',     nameFi: 'Leikkialue',       category: 'Children',           svgPoints: '800,350 950,350 950,500 800,500', labelX: 875, labelY: 425, capacity: 60,  areaSqm: 220,  baseVisitors: 3800,  tenantName: 'Stadium Junior',       monthlyRentEur: 5400  as unknown as never, leaseEndsOn: new Date('2026-02-28') },
    { mallId: 'sello', floor: 'L2', zoneId: 'L2-A', name: 'Food Court',        nameFi: 'Ruokatori',        category: 'Food & Beverage',    svgPoints: '50,50 400,50 400,300 50,300',     labelX: 225, labelY: 175, capacity: 360, areaSqm: 1100, baseVisitors: 18500, tenantName: 'Sello Food Court',     monthlyRentEur: 38000 as unknown as never, leaseEndsOn: new Date('2030-12-31') },
    { mallId: 'sello', floor: 'L2', zoneId: 'L2-B', name: 'Casual Dining',     nameFi: 'Ravintolat',       category: 'Food & Beverage',    svgPoints: '450,50 700,50 700,300 450,300',   labelX: 575, labelY: 175, capacity: 220, areaSqm: 720,  baseVisitors: 9100,  tenantName: 'Vapiano',              monthlyRentEur: 18500 as unknown as never, leaseEndsOn: new Date('2027-09-30') },
    { mallId: 'sello', floor: 'L2', zoneId: 'L2-C', name: 'Home & Living',     nameFi: 'Koti',             category: 'Home & Living',      svgPoints: '750,50 950,50 950,300 750,300',   labelX: 850, labelY: 175, capacity: 140, areaSqm: 980,  baseVisitors: 4400,  tenantName: 'IKEA Pop-Up',          monthlyRentEur: 16000 as unknown as never, leaseEndsOn: new Date('2026-06-30') },
    { mallId: 'sello', floor: 'L2', zoneId: 'L2-D', name: 'Services Hub',      nameFi: 'Palvelukeskus',    category: 'Services',           svgPoints: '50,350 350,350 350,500 50,500',   labelX: 200, labelY: 425, capacity: 100, areaSqm: 410,  baseVisitors: 5500,  tenantName: 'R-Kioski + Posti',     monthlyRentEur: 8200  as unknown as never, leaseEndsOn: new Date('2029-01-31') },
    { mallId: 'sello', floor: 'L2', zoneId: 'L2-E', name: 'Auto Showroom',     nameFi: 'Autonäyttely',     category: 'Auto',               svgPoints: '400,350 700,350 700,500 400,500', labelX: 550, labelY: 425, capacity: 60,  areaSqm: 540,  baseVisitors: 1800,  tenantName: 'Used EV Pop-Up',       monthlyRentEur: 6500  as unknown as never, leaseEndsOn: new Date('2025-11-30') },
  ];

  for (const z of zones) {
    await prisma.floorplanZone.upsert({
      where: { mallId_floor_zoneId: { mallId: z.mallId, floor: z.floor, zoneId: z.zoneId } },
      update: z,
      create: z,
    });
  }

  console.log('✅ Realidea: Sello mall seeded with 12 zones');
}
```

> Note: the `as unknown as never` casts for Decimal are because Prisma's Decimal type accepts strings/numbers at runtime; if your project has a different convention for Decimal seeding, swap to that.

## 4. API contract (the part the frontend already calls)

Two routes. Both return the same `SpaceSuggestionsResponse` shape defined in `src/lib/space-optimizer/types.ts`.

### 4.1 `GET /api/space-optimizer/suggestions`

- **Auth:** required (NextAuth session). 401 if no session.
- **Plan gate:** `spaceAllocation` must be true on the user's customer plan. 403 with `{ error: 'feature_not_on_plan' }` otherwise. Use the same pattern as `/api/shoppermind/overview`.
- **Query:** `?mallId=<id>` (required). The mall must belong to the authenticated user's customer; 404 otherwise.
- **Response:** `SpaceSuggestionsResponse` (see types.ts).
- **Caching:** server-side cache 60s per (mallId, today's date). Suggestions only need to refresh once a day in v1.

### 4.2 `GET /api/demo/space-optimizer`

- **Auth:** none.
- **Query:** `?mallId=sello` (any other value → 404).
- **Response:** identical `SpaceSuggestionsResponse` produced for the seeded Realidea/Sello data, computed fresh from the engine using current ShopperMind state.

### 4.3 Admin plans editor — `/admin/plans` page already shipped on the frontend

The admin UI at `/admin/plans` lets an admin toggle each feature flag (ShopperMind, Edge Vision, Concierge, Space Optimizer) and `maxMalls` on every Plan, plus create new plans. Frontend is in [src/app/admin/plans/page.tsx](src/app/admin/plans/page.tsx). It calls the two endpoints below, which the developer must implement.

Required endpoints (both gated by `requireAdmin()` from `src/lib/admin-auth.ts`):

**`POST /api/admin/plans`** — create a plan.

```ts
// request body
{
  name: string;                   // required, unique
  priceMonthly: number | null;
  features: {
    shoppermind: boolean;
    edgeVision: boolean;
    concierge: boolean;
    spaceAllocation: boolean;
    maxMalls: number;
  };
}
// response: the created Plan row, shape { id, name, priceMonthly, features }
```

Implementation: `prisma.plan.create({ data: { name, priceMonthly, features } })`. Reject empty names with 400. Treat unique-constraint violations as 409.

**`PATCH /api/admin/plans/[id]`** — update a plan's features (or other fields).

```ts
// request body — any subset
{
  name?: string;
  priceMonthly?: number | null;
  features?: PlanFeatures;        // shape above
}
// response: the updated Plan row.
```

Implementation: `prisma.plan.update({ where: { id }, data: { ...patch } })`. The frontend currently only PATCHes `features`, but supporting `name` / `priceMonthly` lets us reuse the page later.

**`PlanFeatures` type:** add `spaceAllocation: boolean` to `PlanFeatures` in [src/lib/plan-gate.ts](src/lib/plan-gate.ts) and to the corresponding `DEFAULT_FEATURES` in [src/lib/plan-gate-server.ts](src/lib/plan-gate-server.ts) and [src/app/api/mall/my-features/route.ts](src/app/api/mall/my-features/route.ts). The frontend currently reads this flag via a tolerant runtime cast in `MallLeftNav` so the nav unlocks the moment the type + the API both ship; nothing else needs to change.

## 5. Engine architecture (reference)

Suggested layout under `src/lib/space-optimizer/`:

```
src/lib/space-optimizer/
├── types.ts             ← already in C2 (frontend imports this)
├── mock-fixture.ts      ← already in C2
├── fetcher.ts           ← already in C2
├── category-map.ts      ← phenomenon-category ↔ MallCategory weights
├── engine.ts            ← buildSuggestions(mall, trends, signals): SpaceSuggestion[]
└── signals/
    ├── types.ts         ← ZoneSignal, TrendSignal, SignalSource<T>
    ├── trend.ts         ← real, calls getShopperMindClient().listPhenomena()
    ├── pos.ts           ← mocked; documented swap-in seam
    ├── counter.ts       ← mocked; documented swap-in seam
    └── camera.ts        ← mocked; documented swap-in seam
```

Engine pipeline:

1. Pull all `FloorplanZone` rows for the mall (with the new tenant fields).
2. Resolve `marketId` via `resolveMarketIdFromMall(mallId)` from `src/lib/shoppermind-client.ts`.
3. Pull trends (real) + POS / counter / camera signals (mocked v1) via the registry.
4. Score each zone: `score = w_trend * trendAffinity(zone.category) + w_perf * normSalesPerSqm + w_traffic * normFootfall + w_dwell * normDwell − w_lease * leaseRiskPenalty`. Default weights as constants; exposed as a per-customer override field on `Plan.features.spaceAllocationWeights` later.
5. Classify each zone:
   - `EXPAND` — high score AND `trendVelocity > 0` AND state ∈ {EMERGING, ACCELERATING}
   - `CONVERT` — low score AND there exists a higher-scoring category match for this zone
   - `SUNSET` — low score AND trend FADING/DORMANT AND lease ends within 12 months
   - `MAINTAIN` — otherwise
6. Generate i18n rationale by template (en/fi/sv) — no LLM call in v1.
7. Project uplift: `baseVisitors * categoryUpliftCoefficient * confidence`. Range-bound. Mark as projection in UI.

The frontend renders whatever the engine returns; it does no scoring of its own. So weights / thresholds can be tuned without any UI work.

## 6. Concierge tool

`src/services/concierge/tools.ts` — add alongside `get_shoppermind_trends`:

```ts
{
  name: 'get_space_suggestions',
  description:
    'Returns the top space-allocation suggestions for the current mall — which zones to expand, convert, maintain, or sunset based on ShopperMind trends and operational signals.',
  parameters: {
    type: 'object',
    properties: {
      mallId: { type: 'string' },
      top:    { type: 'number', description: 'Limit the number of suggestions returned. Default 3.' },
    },
    required: ['mallId'],
  },
  // implementation calls the same engine path as /api/space-optimizer/suggestions
}
```

## 7. Verification

1. Migration generated only the three `ALTER TABLE` statements above; nothing else.
2. `npx prisma db seed` succeeds; `Customer { id: 'realidea' }` exists with 12 zones, MallStats, MallBranding, MallMarketMapping for Sello.
3. Login as `realidea-demo@stelthion.com` lands on the multi-property portfolio. Left nav shows Space Optimizer enabled.
4. `/api/space-optimizer/suggestions?mallId=sello` returns a `SpaceSuggestionsResponse` with at least one suggestion of each action type.
5. `/api/demo/space-optimizer?mallId=sello` returns the same shape unauthenticated.
6. Login as a seeded Ideapark admin (no spaceAllocation) → API returns 403 with `feature_not_on_plan`; left-nav shows the lock badge.
7. Auth regression: log out, log back in for both customers; OTP / 2FA flows behave identically to baseline.
8. The frontend's mock fixture and live API responses validate against the same `SpaceSuggestionsResponse` TypeScript type without changes.
