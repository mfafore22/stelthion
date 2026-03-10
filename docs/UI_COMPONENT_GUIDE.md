# UI Component Guide

How to find, use, and extend UI components. How to work with translations (i18n).
Audience: mid-level developers familiar with React and TypeScript.

---

## 1. Finding the Right Component

### Component root

All components live under:

```
apps/web/src/components/
```

The directory is organized by feature domain. Before building anything new, check:
1. `components/ui/` — 35 shadcn/ui primitives (the base building blocks)
2. The matching domain folder (e.g. `components/mall/` for anything mall-related)

### Domain directories at a glance

| Directory | What lives there |
|---|---|
| `ui/` | Primitive components: Button, Input, Dialog, Card, Badge, Tabs, Select, Tooltip, Table, Switch, Slider, Progress, Accordion, Separator, Sheet, Drawer, Textarea, Checkbox, ScrollArea, DropdownMenu, AlertDialog, Alert, Label — plus custom primitives: MetricCard, Sparkline, VacancyGradientBar, LanguageSelector, TimeRangeSelector, VariableControl |
| `shell/` | App-level layout: `LeftNav.tsx`, `TopBar.tsx` |
| `dashboard/` | Dashboard panels: `DashboardTopBar`, `TimelinePanel`, `HypergraphInsightsCard`, `AssistantDock`, `AssistantSearchBar` |
| `dashboard-panels/` | Slide-out panels: `AgentsManagementPanel`, `DataSourcesLayersPanel`, `WorldModelConfigPanel` |
| `mall/` | Shopping mall analytics: `FootfallChart`, `FootfallAnalysis`, `TenantPerformanceTable`, `FloorHeatmap`, `ScenarioPlanner`, `PortfolioMap`, `WeatherKPI`, `EventsCalendar`, `ZoneBreakdownSidebar`, and ~25 more |
| `retail/` | Retail dashboard: `RetailDashboard`, `ZonePerformanceTable`, `PromotionsManager`, `RetailScenarioPlannerSurface`, `RetailResultsPanel` |
| `retail-intelligence/` | AI retail insights: `RetailIntelligencePanel`, `RetailAgentPanel`, `RetailHotspotDeck`, `RetailRecommendationCard` |
| `scenario-planner/` | Scenario planning engine: `UniversalScenarioPlanner` (main, 138 KB), `ScenarioPlannerPane`, `ScenarioReviewModal`, `RecommendationsPanel`, `ActiveScenariosDisplay` — plus subdirs `components/`, `configurator/`, `map/`, `panels/`, `primitives/`, `results/` |
| `scenarios/` | Scenario tiles and modals: `ScenarioTiles`, `ScenarioEditModal`, `DustStormVisualization`, `DemoController` |
| `unified-scenarios/` | Unified execution: `UnifiedScenarioExecutor`, `SystemStatusMonitor` |
| `concierge/` | AI chat interface: `ConciergePanel`, `ConversationPanel`, `MessageBubble`, `MessageInput`, `ConversationList`, `AgentSelectionModal`, `ToolExecutionPanel` |
| `intelligence/` | Agent configuration: `AgentEditorPanel`, `AgentConfigForm`, `AgentListItem` |
| `agents/` | Map-layer agents: `AirportPowerMonitorLayer`, `SectorAgents` |
| `night-patrol/` | Security patrol: `NightPatrolMainView`, `NightPatrolTriageGrid`, `NightPatrolEnhancedDrawer`, `NightPatrolControlBar`, `NightPatrolBatchBar`, `NightPatrolSummaryBar`, `NightPatrolSnapshotCard` |
| `demo/` | Aviation proof-of-concept: `DemoInterface`, `MainCanvas`, `ApronCanvas`, `AOmsBoard`, `CausalInsightsPanel`, `EvidencePanel`, `DecisionControls`, `StageSelector` |
| `map/` | Geospatial layers: `ForecastLayer`, `RadarLayer`, `SatelliteLayer`, `PredictiveConesLayer`, `VisibilityCanvasLayer` |
| `operations/` | Operations view: `MapboxMap`, `OperationalControls` |
| `transit/` | Transit panels: `TransitTrafficPanel`, `ValidationReportPanel` |
| `demographics/` | Demographics panel: `DemographicsPanel` |
| `shoppermind/` | Shopper insights: `IdeaCard`, `IdeaDrawer`, `SalesActionCard`, `TrendBullet` |
| `property/` | Property KPI card: `PropertyKPICard` |
| `admin/` | Admin modals: `InviteUserModal`, `UserDetailDrawer` |
| `announcements/` | System banners: `AnnouncementBanner` |
| `providers/` | Context providers: `I18nProvider`, `SessionProvider` |
| `visualizations/` | Sector overlays: `SectorOverlays` |
| `AssetPreview/` | Asset preview: `AssetPreview` |

### Searching for a component

**By feature** — navigate to the matching directory listed above.

**By component name** — search across all component files:
```bash
grep -r "ComponentName" apps/web/src/components/
# or use your IDE's go-to-symbol: Cmd+T / Ctrl+T
```

**By what it renders** — search for a prop or className:
```bash
grep -r "footfall" apps/web/src/components/ --include="*.tsx"
```

---

## 2. Using shadcn/ui Primitives

Always start here before writing new UI from scratch.

```
apps/web/src/components/ui/
```

These are unstyled Radix UI components wrapped with Tailwind. Import directly:

```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

Adding a new primitive that doesn't exist yet:
```bash
npx shadcn@latest add <component-name>
# Config: apps/web/components.json
```

---

## 3. Design Themes

Three themes are active in the codebase. Use Tailwind class prefixes to target them.

| Theme | Use case | Class prefix examples |
|---|---|---|
| **Aurora** | Aviation / DOH airport UI | `aurora-bg`, `aurora-surface`, `aurora-border`, `aurora-highlight`, `aurora-accent` |
| **Mall** | Shopping mall analytics | `mall-primary`, `mall-success`, `mall-warning`, `mall-danger` |
| **BO** | Nordic aesthetic (Bang & Olufsen inspired) | `bo-neutral-*`, `bo-beige-*`, `bo-primary`, `bo-accent` |

Design token files:
```
apps/web/src/styles/tokens/
apps/web/src/styles/aurora-theme.css
apps/web/tailwind.config.ts      ← full token definitions here
```

Tailwind config path aliases:
```
@/* → apps/web/src/*
```

---

## 4. Storybook Stories

Several components have Storybook story files (`*.stories.tsx`) alongside them:

```
components/dashboard/AssistantDock.stories.tsx
components/dashboard/AssistantSearchBar.stories.tsx
components/dashboard/TimelinePanel.stories.tsx
components/scenario-planner/ScenarioActionBar.stories.tsx
```

Run Storybook (if configured):
```bash
npm run storybook
```

---

## 5. State Management

**Zustand stores** — for global/shared state:
```
apps/web/src/stores/
```

**React contexts** — for subtree-scoped state:
```
apps/web/src/contexts/
apps/web/src/components/concierge/ConciergeContext.tsx
```

**Data fetching** — use `swr` for server data:
```tsx
import useSWR from "swr";
const { data, error, isLoading } = useSWR("/api/mall/kpi", fetcher);
```

---

## 6. i18n — Translations

### Overview

| Item | Value |
|---|---|
| Library | `react-i18next` + `i18next` |
| Languages | 16 (see table below) |
| Translation files | `apps/web/src/locales/<lang>/` |
| Namespaces | 10 (see table below) |
| Config | `apps/web/src/lib/i18n/config.ts` |
| Provider | `apps/web/src/components/providers/I18nProvider.tsx` |
| Persistence | `localStorage` key: `stelthion-language` |

### Supported languages

| Code | Language | Locale | Currency |
|---|---|---|---|
| `en` | English | en-US | EUR |
| `fi` | Finnish | fi-FI | EUR |
| `sv` | Swedish | sv-SE | SEK |
| `no` | Norwegian | nb-NO | NOK |
| `da` | Danish | da-DK | DKK |
| `es` | Spanish | es-ES | EUR |
| `de` | German | de-DE | EUR |
| `et` | Estonian | et-EE | EUR |
| `lv` | Latvian | lv-LV | EUR |
| `nl` | Dutch | nl-NL | EUR |
| `fr` | French | fr-FR | EUR |
| `it` | Italian | it-IT | EUR |
| `pl` | Polish | pl-PL | PLN |
| `lt` | Lithuanian | lt-LT | EUR |
| `pt` | Portuguese | pt-PT | EUR |
| `cs` | Czech | cs-CZ | CZK |

### Namespaces

| Namespace | Covers |
|---|---|
| `common` | Shared UI text (buttons, labels, status) |
| `navigation` | Nav menu items and page titles |
| `concierge` | AI chat interface strings |
| `mall` | Mall analytics (KPIs, zones, floors) |
| `retail` | Retail dashboard, promotions |
| `scenario` | Scenario planner labels |
| `forms` | Form labels and validation messages |
| `errors` | Error messages and fallbacks |
| `kpi` | Metric/KPI labels and units |
| `admin` | Admin panel (users, tenants) |
| `shoppermind` | Shopper insights — **English + Finnish only** |

### Using translations in a component

```tsx
import { useTranslation } from "react-i18next";

export function FootfallCard() {
  const { t } = useTranslation("mall");
  return <h2>{t("footfall.title")}</h2>;
}
```

For multiple namespaces in one component:
```tsx
const { t: tCommon } = useTranslation("common");
const { t: tMall } = useTranslation("mall");
```

Formatting utilities (numbers, currency, dates):
```tsx
import { formatCurrency, formatNumber, formatDate } from "@/lib/i18n/formatting";
```

### Adding a new translation key

1. Add the key to `apps/web/src/locales/en/<namespace>.json` first
2. Copy the key to **all 16** language files at `apps/web/src/locales/<lang>/<namespace>.json`
   - Exception: `shoppermind.json` only needs `en` and `fi`
3. Use a dot-separated path for nesting: `"footfall.daily.peak": "Daily Peak Footfall"`

### Adding a new namespace

1. Create `<namespace>.json` in every language directory under `apps/web/src/locales/`
2. Register the namespace in `apps/web/src/lib/i18n/config.ts`
3. Import as: `const { t } = useTranslation("<namespace>")`

### Adding a new language

1. Open `apps/web/src/lib/i18n/config.ts`
   - Add the language code and locale string to the supported languages list
   - Add the currency mapping
2. Create directory `apps/web/src/locales/<lang-code>/`
3. Copy all 10 namespace JSON files from `apps/web/src/locales/en/` and translate them
4. Add a flag/label entry in `apps/web/src/components/ui/language-selector.tsx`
5. The `I18nProvider` will pick up the new language automatically

---

## 7. Adding a New Component

1. **Pick the right directory** — match the feature domain from the table in section 1.
2. **Check for an existing primitive** — look in `components/ui/` first.
3. **File naming** — `PascalCase.tsx` (e.g. `ZoneHeatmap.tsx`).
4. **Add translations** — no hardcoded English strings in JSX. Use `useTranslation`.
5. **Apply theme classes** — use the `mall-*`, `aurora-*`, or `bo-*` Tailwind classes from section 3.
6. **Export** — if adding a primitive to `components/ui/`, export it from `components/ui/index.ts`.

---

## 8. Ideapark Mall — Floor Plan Heatmap (KoyIdeaparkAb)

Added in March 2026. Only visible when `mallId === 'ideapark'`.

### New files

| File | Purpose |
|---|---|
| `apps/web/src/components/mall/FootfallAnalysis.tsx` | Interactive floor-plan heatmap with time slider |
| `apps/web/src/lib/data/ideaparkZones.ts` | Zone polygon coordinates and visitor model |
| `public/assets/malls/ideapark/floorplan-ground.png` | Ground floor plan image (add manually — not in git due to LFS constraints) |

### How it works

`PropertyDetail.tsx` shows a segmented toggle — **Footfall Chart** / **Footfall Analysis** — above the right column of the Performance tab. This toggle is only rendered when `mall.id === 'ideapark'`.

```tsx
// In PropertyDetail.tsx (Performance tab, col-span-2 div)
const [footfallView, setFootfallView] = useState<'chart' | 'analysis'>('chart');

{mall.id === 'ideapark' && (
  <div className="flex items-center gap-1 p-1 bg-bo-neutral-100 rounded-lg w-fit mb-4">
    <button onClick={() => setFootfallView('chart')} ...>{t('detail.footfallChart')}</button>
    <button onClick={() => setFootfallView('analysis')} ...>{t('detail.footfallAnalysis')}</button>
  </div>
)}

{footfallView === 'analysis' && mall.id === 'ideapark'
  ? <FootfallAnalysis mallId={mall.id} />
  : <FootfallChart mallId={mall.id} />}
```

### FootfallAnalysis component

Props: `{ mallId: string }`

State:
- `floor`: `'ground' | 'upper'` — floor selector (upper shows placeholder)
- `hour`: `number` (10–21) — time slider drives zone visitor counts
- `selectedZone`: `string | null` — click a zone polygon to open the popup

Zone data comes from `getZoneVisitors(zoneId, hour, dayOfWeek)` in `ideaparkZones.ts`. The function returns `{ visitors, predicted, delta }` using the same hourly multiplier tables as the Tripla visitor model, scaled by the Ideapark annual figure (7.5M / 9.4M = 0.798).

Heat colour scale:

| Ratio (visitors / capacity) | Colour |
|---|---|
| < 0.3 | Blue — quiet |
| 0.3–0.5 | Green — moderate |
| 0.5–0.7 | Yellow — busy |
| 0.7–0.9 | Orange — very busy |
| ≥ 0.9 | Red — crowded |

### Adding the floor plan image

The PNG is not stored in git (LFS constraints on the target repo). To deploy:

```bash
# Copy the image from the project's tmp/ directory
cp tmp/Ideapark\ 1.png apps/web/public/assets/malls/ideapark/floorplan-ground.png
```

Or host it on the project's CDN and update the `src` in `FootfallAnalysis.tsx`:
```tsx
<Image src="/assets/malls/ideapark/floorplan-ground.png" ... />
```

### Adding a new Ideapark zone

1. Open `apps/web/src/lib/data/ideaparkZones.ts`
2. Add a new entry to the `IDEAPARK_ZONES` array with:
   - `id`, `name`, `category`, `areaSqm`, `baseVisitorsPerHour`, `capacity`
   - `svgPoints` — polygon coordinates in `viewBox="0 0 1000 450"` space
3. The `getZoneVisitors()` function will pick it up automatically.

---

## 9. Mall UI — Internationalisation (EN/FI)

### What changed (March 2026)

All mall UI components were migrated from hardcoded Finnish strings to the `react-i18next` system. The language selector in `MallTopBar` now correctly switches the entire mall UI between **English** and **Finnish**.

### Components wired to translations

Every component in `apps/web/src/components/mall/` now calls `useTranslation('mall')`:

| Component | Key groups used |
|---|---|
| `PropertyDetail.tsx` | `tabs.*`, `detail.*`, `alertsStream.*` |
| `PropertyKPIs.tsx` | `kpi.*` |
| `MallTopBar.tsx` | `topbar.*`, `navigation.*` |
| `WeatherNextPanel.tsx` | `weather.*` |
| `AlertsStream.tsx` | `alertsStream.*` |
| `ScenarioShortcuts.tsx` | `shortcuts.*` |
| `FootfallChart.tsx` | `footfall.*` |
| `FootfallAnalysis.tsx` | `detail.footfallAnalysis`, `footfall.*` |
| `TenantPerformanceTable.tsx` | `tenants.*` |
| `TenantMixChart.tsx` | `tenants.*` |
| `TopCategoriesTable.tsx` | `tenants.*` |
| `CampaignCard.tsx` | `campaigns.*` |
| `mall/login/page.tsx` | `login.*` |

### New keys in `mall` namespace

Added to both `apps/web/src/locales/en/mall.json` and `fi/mall.json`:

| Key group | Keys |
|---|---|
| `tabs` | `overview`, `performance`, `location`, `tenants`, `events`, `weather`, `campaigns` |
| `detail` | `totalShops`, `topCategory`, `foodBeverage`, `fashionRetail`, `shops`, `footfallChart`, `footfallAnalysis`, `infoLocation`, `infoDataSource`, `infoUpdated`, `loading`, `loadFailed`, `notFound`, `locationLoading`, `locationNotAvailable`, `eventsNotAvailable` |
| `kpi` | `currentVisitors`, `vsPlan`, `dwellTime`, `vsBaseline`, `conversionRate`, `vsLastWeek`, `activeAlerts`, `allSystemsNormal` |
| `alertsStream` | `title`, `allNormal`, `noAlerts`, `parkingClosed`, `parkingLevel` (with `{{id}}`, `{{utilization}}`), `parkingNormal` |
| `shortcuts` | `title`, `weather.name`, `weather.description`, `campaign.name`, `campaign.description`, `tenant.name`, `tenant.description` |
| `weather` | `title`, `loading`, `serviceUnavailable`, `temperature`, `precipitation`, `comfortIndex`, `wind`, `footfallImpact`, `forecast`, `historicalCorrelation`, `correlationText`, `temp.*`, `comfort.*`, `impact.*`, `forecastMsg.*` |
| `footfall` | `chartTitle`, `actual`, `predicted`, `weatherImpact` |
| `topbar` | `export`, `exportFormat`, `pdfReport`, `csvData`, `excelWorkbook`, `userId`, `logout`, `userMenu`, `dateLabel`, `timeLabel` |
| `login` | `subtitle`, `userId`, `userIdPlaceholder`, `password`, `passwordPlaceholder`, `signIn`, `signingIn`, `authorizedOnly`, `loginFailed`, `loginError` |
| `tenants` (extended) | `performanceByCategory`, `visitors`, `dwell`, `outlook`, `stable`, `vsPlan`, `topTenants`, `tenantMixByCategory`, `distribution` (with `{{count}}`), `topCategories`, `spaces`, `percentOfTotal`, `showingOf` (with `{{limit}}`, `{{total}}`) |
| `transport` (extended) | `publicTransitConnections`, `arrivingByPublicTransit` |

### Pattern: dynamic keys in useMemo

When `t()` is called inside `useMemo`, include `t` in the dependency array:

```tsx
const alerts = useMemo(() => {
  return parkingData.map(p => ({
    message: t('alertsStream.parkingLevel', { id: p.id, utilization: p.util }),
  }));
}, [parkingData, t]);  // ← t must be here
```

### Pattern: PAGE_TITLES map with translations

`MallTopBar` defines `PAGE_TITLES` **inside** the component body so `t()` is in scope:

```tsx
export function MallTopBar({ ... }) {
  const { t } = useTranslation('mall');

  const PAGE_TITLES: Record<string, string> = {
    '/mall': t('navigation.dashboard.label'),
    '/mall/properties': t('navigation.properties.label'),
    // ...
  };
}
```

---

## Related Docs

- [UI_GUIDE.md](UI_GUIDE.md) — layout rules, spacing, interaction conventions
- [MASTER_UI_FORMAT_PROTECTION.md](MASTER_UI_FORMAT_PROTECTION.md) — format protection rules
- [ARCHITECTURE.md](ARCHITECTURE.md) — system architecture overview
