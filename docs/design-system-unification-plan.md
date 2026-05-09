# Unify the Stelthion UI Design System with the Arena 3.3 Briefing

## Context

The product UI lives in five coexisting style "eras" (hero/login, material KPIs, minimal admin tables, premium ShopperMind glass, and forked header chrome). The most recent additions — ShopperMind macro, admin/shoppermind activity & feedback, AggregateCard — read as the most premium and pleasant, and they share a coherent vocabulary: warm `bo-neutral-*` base, `bo-primary` forest-green, glass-morphism, hover-lift, semantic shadow scale.

The Arena 3.3 sales briefing PDF is a different register of the same brand: deep charcoal surface, cream typography, a single warm tan/khaki accent, full-mono voice, numbered uppercase section labels (`01 · NATIVE`), giant figure typography, audio-waveform motif, italic emphasis on key phrases. It is a "briefing/operating-system" voice for top-of-funnel, exec, and marketing artefacts.

**Goal of this pass**: define one token + typography spine that renders correctly in *both* registers and ship the smallest set of shared primitives that lock in the brand voice. Operational UI stays light-warm (where it belongs for daily-use clarity); the cinematic dark register becomes a parallel `data-theme="ink"` mode used for briefing surfaces, export views, and selective marketing chrome. The presentation's typographic discipline (numbered mono section labels, key-stat figures, tan accent for premium voice) is promoted *into* the product so both artefacts feel like one system.

**Confirmed direction (from clarification):**
- Briefing-only dark mode — no full product dark theme yet.
- Tan = new brand-tier accent for premium surfaces; forest-green stays primary, navy stays data accent.
- Mono leads on labels, figures, technical signals; Inter keeps body and table cells.
- Scope = tokens + 4 primitives + briefing theme + light migration of 3-4 high-visibility surfaces. Defer AdminHeader/MallTopBar consolidation and full migration to a follow-up.

## Approach

### Phase 1 — Extend tokens in [src/app/globals.css](src/app/globals.css)

Add to the existing `:root` and `@theme inline` blocks (do **not** restructure existing tokens; additive only):

**New brand tan scale** (premium accent):
- `--brand-tan-50: #F5EFDD` through `--brand-tan-900: #6B5F3D` (8 stops)
- `--brand-tan-DEFAULT: #C7B88A` (matches the PDF accent)
- Tailwind aliases: `--color-brand-tan-{50…900}` so `text-brand-tan-500`, `bg-brand-tan-50` work.

**Ink surface tokens** (briefing palette):
- `--ink-surface: #15130F` (deep charcoal, slightly warm)
- `--ink-surface-raised: #1E1B16`
- `--ink-foreground: #ECE6D5` (cream body)
- `--ink-foreground-muted: #9A9385`
- `--ink-divider: #2C2823`
- `--ink-pulse: #C7B88A` (waveform/accent line, = brand-tan)

**Ink theme block** (sibling to `:root`, opt-in via attribute):
```css
[data-theme="ink"] {
  --background: var(--ink-surface);
  --foreground: var(--ink-foreground);
  --card: var(--ink-surface-raised);
  --border: var(--ink-divider);
  --muted-foreground: var(--ink-foreground-muted);
  --accent: var(--brand-tan-DEFAULT);
  /* keep --primary as bo-primary so success/state colors still read */
}
```

**Typography utilities** (in `@layer utilities`):
- `.label-section` — `font-mono`, `text-[11px]`, `tracking-[0.18em]`, `uppercase`, `text-bo-neutral-500` (light) / `text-brand-tan-DEFAULT` (under `[data-theme="ink"]`). Used for the `01 · NATIVE` pattern.
- `.label-section-index` — same, but `text-bo-neutral-400` for the leading numeral.
- `.figure-display` — `font-mono`, `text-5xl md:text-6xl lg:text-7xl`, `font-medium`, `tracking-tight`. For giant key stats.
- `.text-pulse` — applies the waveform stroke color.

Do **not** add new fonts. JetBrains Mono is already loaded and is close enough to the presentation mono; adding another font is unjustified weight.

### Phase 2 — Four shared primitives (each ≤100 lines per the file-size cap)

Create these as small CVA-based primitives alongside the existing shadcn-style components in [src/components/ui/](src/components/ui/):

1. **[src/components/ui/section-label.tsx](src/components/ui/section-label.tsx)** — `<SectionLabel index="01" label="NATIVE" hint="100% GenAI FIRST" />`
   - Renders `01 · NATIVE` in `.label-section`, optional hint slot in `text-foreground` weight medium.
   - Theme-aware via the `[data-theme="ink"]` cascade — no theme prop.
   - Replaces ~12 instances of inline `<p className="text-xs uppercase tracking-wide …">` patterns spotted across [src/app/admin/shoppermind/](src/app/admin/shoppermind/) and [src/components/mall/shoppermind/](src/components/mall/shoppermind/).

2. **[src/components/ui/key-stat.tsx](src/components/ui/key-stat.tsx)** — `<KeyStat value="15,000+" caption="guests per event" />`
   - `figure-display` value, mono caption in `text-muted-foreground`.
   - Variants: `size: 'md' | 'lg' | 'xl'` — md for KPI cards, xl for briefing.
   - Replaces the duplicated big-number patterns in [src/components/mall/PortfolioKPIs.tsx](src/components/mall/PortfolioKPIs.tsx) and the dashboard KPI trio in [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx).

3. **[src/components/ui/briefing-shell.tsx](src/components/ui/briefing-shell.tsx)** — page-level wrapper for cinematic surfaces.
   - Sets `data-theme="ink"` on its root, renders top strip with brand mark + `× ARENA 3.3`-style tag slot, an SVG waveform divider, and a content slot with the presentation's vertical rhythm.
   - Used by the new briefing route and any future exec/print surfaces.

4. **[src/components/ui/status-badge.tsx](src/components/ui/status-badge.tsx)** — unifies the inline `bg-emerald-50 text-emerald-700` / `bg-red-50 text-red-700` pills scattered across tables.
   - `tone: 'success' | 'warn' | 'error' | 'neutral' | 'accent'` (`accent` = brand-tan, for premium-tier callouts).
   - Resolves the duplication flagged in the audit at [src/app/admin/shoppermind/feedback/FeedbackTable.tsx](src/app/admin/shoppermind/feedback/FeedbackTable.tsx) and [src/app/admin/shoppermind/activity/ActivityTable.tsx](src/app/admin/shoppermind/activity/ActivityTable.tsx).

### Phase 3 — Apply primitives + first briefing surface

**a. Promote to existing premium surfaces** (light theme, low-risk):
- [src/components/mall/shoppermind/ShopperMindHeader.tsx](src/components/mall/shoppermind/ShopperMindHeader.tsx) — replace inline section heads with `<SectionLabel>`; replace any inline figure patterns with `<KeyStat>`.
- [src/app/mall/shoppermind/page.tsx](src/app/mall/shoppermind/page.tsx) — adopt `<SectionLabel>` for tab/section heads.
- [src/components/mall/PortfolioKPIs.tsx](src/components/mall/PortfolioKPIs.tsx) — adopt `<KeyStat>`. Keeps current colored icon backgrounds.
- [src/app/page.tsx](src/app/page.tsx) (landing) — add a tan accent line + `<SectionLabel>` above the headline. Subtle, no full repaint.

**b. New briefing surface** at [src/app/briefing/arena-3-3/page.tsx](src/app/briefing/arena-3-3/page.tsx):
- Uses `<BriefingShell>` + `<SectionLabel>` + `<KeyStat>`.
- Renders the 13-page deck content as a web page (Stakes, Challenge, Shift, Platform, How It Works, Architecture, Outcomes, Without/With, ROI table, Total Impact, Closing, Contact).
- Lives behind a route guard — gated by existing auth, not public.
- Print-friendly via `@media print` rules in globals.css (page-break per section).
- This is the proof point for the briefing-only dark mode and the artefact that demonstrates "the operating system for iconic venues" voice.

**c. Cleanup of token-bypass inline values flagged in the audit:**
- [src/app/change-password/page.tsx:1](src/app/change-password/page.tsx#L1) — `bg-[#fafafa]` → `bg-bo-neutral-50`.
- [src/app/mall/[mallId]/page.tsx:1](src/app/mall/[mallId]/page.tsx#L1) — `bg-[#F8F6F3]` → `bg-bo-neutral-50`.
- [src/app/mall/shoppermind/review/page.tsx](src/app/mall/shoppermind/review/page.tsx) — same replacement (2 instances).
- Inline status pills in feedback/activity tables → `<StatusBadge>`.

**Memory-aware constraints applied:**
- Every new file capped at ≤100 lines per the UI file-size rule. `<BriefingShell>` is the most at risk; if it grows, split the waveform SVG into a sibling `briefing-waveform.tsx`.
- No em dashes in any rendered UI text — section labels and captions use `·` separators (matches the presentation) or colons.
- Finnish text in section labels: must verify `ä`, `ö` render under `tracking-[0.18em]` + `uppercase` without clipping. Test specifically on `mall/shoppermind` whose locale already has Finnish strings.

### What this pass deliberately does NOT do (deferred)

- Consolidating [src/components/admin/AdminHeader.tsx](src/components/admin/AdminHeader.tsx) and [src/components/mall/MallTopBar.tsx](src/components/mall/MallTopBar.tsx) onto a shared shell.
- Full ShopperMind activity/feedback table style migration beyond the StatusBadge swap.
- Full product dark mode (no theme toggle in product chrome — only briefing routes opt in).
- Documentation site for the design system. A short comment block at the top of globals.css naming the four primitives is enough for now.

## Critical files

**Modify:**
- [src/app/globals.css](src/app/globals.css) — additive tokens, ink theme block, typography utilities. ~80 lines added.
- [src/components/mall/shoppermind/ShopperMindHeader.tsx](src/components/mall/shoppermind/ShopperMindHeader.tsx)
- [src/app/mall/shoppermind/page.tsx](src/app/mall/shoppermind/page.tsx)
- [src/components/mall/PortfolioKPIs.tsx](src/components/mall/PortfolioKPIs.tsx)
- [src/app/page.tsx](src/app/page.tsx)
- [src/app/change-password/page.tsx](src/app/change-password/page.tsx)
- [src/app/mall/[mallId]/page.tsx](src/app/mall/[mallId]/page.tsx)
- [src/app/mall/shoppermind/review/page.tsx](src/app/mall/shoppermind/review/page.tsx)
- [src/app/admin/shoppermind/feedback/FeedbackTable.tsx](src/app/admin/shoppermind/feedback/FeedbackTable.tsx)
- [src/app/admin/shoppermind/activity/ActivityTable.tsx](src/app/admin/shoppermind/activity/ActivityTable.tsx)

**Create:**
- [src/components/ui/section-label.tsx](src/components/ui/section-label.tsx)
- [src/components/ui/key-stat.tsx](src/components/ui/key-stat.tsx)
- [src/components/ui/briefing-shell.tsx](src/components/ui/briefing-shell.tsx)
- [src/components/ui/status-badge.tsx](src/components/ui/status-badge.tsx)
- [src/app/briefing/arena-3-3/page.tsx](src/app/briefing/arena-3-3/page.tsx)

**Reuse (do not refactor):**
- Existing `bo-neutral-*`, `bo-primary-*`, `bo-accent-*` scales in [src/app/globals.css](src/app/globals.css).
- Existing `.bo-surface`, `.bo-glass-*`, `.hover-lift`, `.shadow-bo-*` utilities.
- Existing [src/components/ui/card.tsx](src/components/ui/card.tsx), [src/components/ui/badge.tsx](src/components/ui/badge.tsx), [src/components/ui/button.tsx](src/components/ui/button.tsx) — primitives layer above them, do not modify.

## Verification

1. **Boot dev server** (`npm run dev` or whatever the project uses; check `package.json scripts` first).
2. **Walk the surfaces** in light theme:
   - `/` (landing) — verify the new `<SectionLabel>` accent reads correctly above the headline; no layout shift.
   - `/login` — visual sanity only (no changes this pass beyond cleanup).
   - `/dashboard` — KPI trio renders with `<KeyStat>`; numbers align; trendlines unaffected.
   - `/mall/[mallId]` — `bg-bo-neutral-50` resolves; no color drift vs. the previous `bg-[#F8F6F3]`.
   - `/mall/shoppermind` — section heads converted to `<SectionLabel>`; tab nav unaffected; verify Finnish strings render without clipping under uppercase + tracking.
   - `/admin/shoppermind/feedback` and `/activity` — verdict badges now use `<StatusBadge>`; tones map 1:1 to old colors.
3. **Walk the briefing route** `/briefing/arena-3-3`:
   - Renders in `data-theme="ink"`. Surface = `--ink-surface`, text = `--ink-foreground`, accents = `--brand-tan-DEFAULT`.
   - All 13 sections present; numbered section labels match the PDF voice.
   - Confirm no green/navy bleed-through (ink theme should override `--accent`).
   - Print preview (Cmd-P) — page breaks land at section boundaries.
4. **Type-check**: `npx tsc --noEmit` — all four new primitives must compile clean with explicit prop types.
5. **Lint**: project's lint script — ensure no inline hex strings remain in the modified files.
6. **Side-by-side check**: open the briefing route next to the PDF on screen. Compare:
   - Section label rhythm (numeral, separator, uppercase tracking).
   - Tan accent saturation against the PDF's `#C7B88A`-ish accent.
   - Figure typography weight and tracking on `15,000+`, `€2.5 - 3.3M`, etc.
   - Adjust tan stops if perceived saturation drifts on screen vs. paper.
7. **Memory-rule sweep before completion**:
   - No em dashes introduced in any new JSX or in globals.css comment block.
   - No mallId hardcoded literals in new files (briefing route is mall-agnostic; if it ever needs one, route through `isMallId`).
   - Finnish locale strings verified on at least one premium surface using the new `<SectionLabel>`.
