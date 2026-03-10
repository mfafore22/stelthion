# IMPORTANT: Master UI Format Protection
### Subtitle: Source of Truth for Page Layouts, Titles, and Interaction Patterns (UX Framework: Stelthion React/Next.js + Tailwind-based design system)

**Last Updated:** 2025-11-24  
**Status:** ACTIVE RULE

---

## Master Rules
- Preserve the master format for all tenants. UI is consistent; only data changes. Tenant isolation is enforced at the data layer, not by altering UI structure.
- Never remove features without explicit approval. Core portfolio/analytics/synexis/weather/map components must remain.
- Page titles sit below the top bar; use `ml-[80px] mt-[80px] p-8` with `max-w-[1600px]` (Properties page is the reference).
- Use existing shell components: `MallLeftNav`, `MallTopBar`, `MallKPICard`, card/grid patterns, and title hierarchy (H1 → H2 → H3).

## Ideapark Floor Plan Heatmap (KoyIdeaparkAb — `mallId: ideapark`)

- **Performance tab toggle** — Segmented `[Footfall Chart] [Footfall Analysis]` control rendered above the right column of the Performance tab, **only when `mall.id === 'ideapark'`**. Default state: `'chart'`.
- **FootfallAnalysis component** — Renders `public/assets/malls/ideapark/floorplan-ground.png` with an SVG overlay of 9 coloured zone polygons. Time slider (10:00–21:00) drives visitor density calculations via `getZoneVisitors()` from `ideaparkZones.ts`. Upper Level floor shows a placeholder card.
- **Heat colour scale** — Blue (quiet) → Green (moderate) → Yellow (busy) → Orange (very busy) → Red (crowded). Mapped by `visitors / capacity` ratio.
- **Zone popup** — Clicking a zone polygon shows an absolutely-positioned card with: zone name, current visitors, vs-plan delta, density (visitors/m²), peak hour.
- **No Tripla names** — Zero strings referencing "Tripla", "Realidea", "Mall of Tripla", "Railway Plaza", "Escalator 2", or other Tripla-specific identifiers in any Ideapark-facing view.
- **Left KPI column unchanged** — `PropertyKPIs` renders normally in both chart and analysis views.

## Mall UI Internationalisation (EN/FI)

- **Rule**: No hardcoded English or Finnish strings in any `components/mall/` file. All visible text must go through `useTranslation('mall')` + `t()`.
- **Language selector** (`CompactLanguageSelector` in `MallTopBar`) switches the entire mall UI at runtime. This only works if components use `t()`, never hardcoded strings.
- **PAGE_TITLES** must be defined **inside** the component body (not at module scope) so they can call `t()`.
- **useMemo with t()** — always include `t` in the dependency array when `t()` is called inside `useMemo`.
- **Dynamic strings** — use i18next interpolation: `t('alertsStream.parkingLevel', { id, utilization })`, not string concatenation.
- **Locale files** — `apps/web/src/locales/en/mall.json` (English, the master) and `fi/mall.json` (Finnish). Keep key structures identical across both files. When adding a key, add to `en` first, then copy to all language files.
- **Date formatting** — use `toLocaleDateString()` without a hardcoded locale string (e.g. `'fi-FI'`); let the browser honour the selected language.
- **Number formatting** — use `Intl.NumberFormat()` without a hardcoded locale.

## ShopperMind Layout Requirements
- **Header**: Brain icon + H1 “ShopperMind”, subtitle: “Foresight for every mall with actionable forecasts”.
- **Top controls**: Reference Period (Last Month/Quarter), Forecast Horizon (Next Month/Quarter), Category dropdown.
- **Sections**:
  - Sales (2 cards: All Sales, Category Sales) with CTAs to Idea Drawer.
  - Confidence (Consumer & Business): KPI badges and dual line chart (actual solid, projected dashed, consistent chart styling).
  - Trends: Source note; bullets per region/category with “Create 3 campaign ideas” CTA.
  - Synexis Signals meaning/action card with CTAs to ideas/trends.
- **Translations**: All strings via `shoppermind` namespace (EN/FI); no hardcoded English.
- **Demo indicators**: If data is simulated/fallback, show a badge (e.g., BTS demo mode).

## Consistent Spacing & Titles
- Main content: `ml-[80px] mt-[80px] p-8`, `max-w-[1600px] mx-auto`.
- Titles below top bar; no extra `ml-20` wrappers.
- H1: `text-2xl font-semibold tracking-tight`; H2/H3 as section/subsection.

## Chart & KPI Standards
- Use standard card containers; chart styling should match existing chart components (grid, legend, colors).
- KPI cards must include `trendPercentage` to render gradients (MallKPICard).
- Source badges on cards where applicable.

## Navigation & Shell
- Top bar: logo, temporal controls, language codes, Ask Stelthion, user menu, export.
- Left nav: Portfolio, Properties, Analytics, Campaigns, Scenarios, Assistants, ShopperMind.

---

## Verification Checklist
- Layout matches Properties spacing; titles below top bar.
- UI features intact (maps, KPIs, heatmaps, synexis signals where applicable).
- Data filtering only; no UI simplification per tenant.
- All text uses locale files; EN/FI parity for ShopperMind.
- Demo data clearly labeled.
- Trend/Confidence charts use consistent styling.

---

## Verification Additions (March 2026)

- [ ] Ideapark Performance tab shows segmented `[Footfall Chart] [Footfall Analysis]` toggle
- [ ] Toggling to Footfall Analysis shows floor plan image with coloured zone overlays
- [ ] Time slider (10:00–21:00) updates zone colours correctly
- [ ] Clicking a zone shows popup with visitors, delta, density, peak hour
- [ ] Upper Level button shows placeholder card (no 404)
- [ ] All mall UI text switches language when EN/FI selector is changed
- [ ] No hardcoded Finnish or English strings in any `components/mall/` component
- [ ] `t` is in `useMemo` dependency arrays where applicable

## Version History (condensed)
- **2026-03-08**: Ideapark floor plan heatmap (`FootfallAnalysis`), full EN/FI i18n for all mall components, new `mall` namespace keys (tabs, detail, kpi, alertsStream, shortcuts, weather, footfall, topbar, login, tenants, transport).
- **2025-11-24**: Added ShopperMind layout requirements, translations namespace note, demo badge guidance.
- **2025-11-23**: KPI gradient requirement (`trendPercentage`), FMI weather parsing fixes, weather alerts integration, Mapbox token config.
- **2025-11-22**: Top bar restructuring, page title hierarchy (titles below bar), portfolio KPI adjustments (removed portfolio-level weather impact).
- **2025-11-19**: Protection rule created after accidental UI simplification; mandate to keep full feature set and layout.

