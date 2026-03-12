# Customer Brand Integration Guide

How to reflect a customer's brand identity in the Stelthion Mall Intelligence Platform while preserving the Stelthion product identity.

---

## Principles

1. **Stelthion identity stays fixed.** The brandmark (`/stelthion-brandmark.png`) in the top-left of the TopBar is always present and never replaced. The platform is *powered by Stelthion*; the customer brand colours the experience.
2. **One CSS file, full cascade.** All colour changes live in `src/app/globals.css`. Token classes (`bo-primary-*`, `bo-accent-*`, etc.) are used throughout the component tree — updating the tokens is sufficient for the vast majority of the UI.
3. **Minimum touch-points.** Three files need updating per customer onboarding: `globals.css`, `brandProfiles.json`, and optionally the chart component if it contains hardcoded hex values.

---

## Token Mapping

The design token system maps customer brand roles to platform tokens:

| Customer brand role | Platform token | Used by |
|---|---|---|
| Primary brand colour | `bo-primary-500` | Active nav, CTA buttons, Concierge toggle, active tab underline, focus ring |
| Primary tints (50–400) | `bo-primary-50..400` | Hover states, backgrounds, borders |
| Primary shades (600–800) | `bo-primary-600..800` | Pressed states, darker accents |
| Corporate secondary / link colour | `bo-accent-600` | Info badges, links, transport codes, accent borders |
| Accent tints | `bo-accent-50..300` | Light info backgrounds |
| Semantic success | `bo-success-dark / light` | Positive delta indicators, live badge |
| Semantic warning | `bo-warning-dark / light` | Caution indicators, beta badge |
| Semantic error | `bo-error-dark / light` | Negative delta, error states, destructive actions |
| Chart line 1 (actual) | `--chart-1` | FootfallChart actual line |
| Chart line 2 (predicted) | `--chart-2` | FootfallChart predicted line |
| Chart line 5 (accent line) | `--chart-5` | FootfallChart weather impact line |

Neutral greys (`bo-neutral-*`) are intentionally **not** customer-branded — they provide a stable, readable background regardless of the customer's palette.

---

## Step-by-Step: Onboarding a New Customer Brand

### 1. Extract brand colours

Visit the customer's website and inspect CSS custom properties or computed styles. You need:

- **Primary brand colour** — dominant accent used in CTAs, navigation highlights
- **Secondary colour** — used for supporting accents or a second brand hue
- **Corporate blue / link colour** — often used in navigation bars and hyperlinks
- **Warning / promotional colour** — orange, amber, or similar
- **Alert / error colour** — red variant

For each colour, derive a full scale (50 → 800) using a tool such as [Radix UI palette generator](https://www.radix-ui.com/colors/custom) or a CSS colour `oklch()` lightness ladder.

### 2. Update `src/app/globals.css`

Replace the `:root` semantic variables and the `@theme inline` token blocks:

#### `:root` block — semantic variables
```css
:root {
  --primary:             /* customer primary */;
  --primary-foreground:  #FFFFFF; /* or dark if primary is light */
  --accent:              /* customer secondary / link colour */;
  --accent-foreground:   #FFFFFF;
  --destructive:         /* customer error colour */;
  --ring:                /* primary-400 tint for focus rings */;
  --chart-1:             /* primary */;
  --chart-2:             /* secondary / lime */;
  --chart-5:             /* accent / navy */;
  --sidebar-primary:     /* primary */;
  --sidebar-ring:        /* primary-400 tint */;
}
```

#### `@theme inline` block — token palette
```css
/* bo-primary — [Customer] primary colour scale */
--color-bo-primary-50:  /* lightest tint */;
--color-bo-primary-100: /* ... */;
--color-bo-primary-200: /* ... */;
--color-bo-primary-300: /* ... */;
--color-bo-primary-400: /* ... */;
--color-bo-primary-500: /* primary brand colour */;
--color-bo-primary-600: /* one step darker */;
--color-bo-primary-700: /* two steps darker */;
--color-bo-primary-800: /* darkest shade */;

/* bo-accent — [Customer] secondary/corporate colour scale */
--color-bo-accent-50:   /* lightest tint */;
--color-bo-accent-100:  /* ... */;
--color-bo-accent-200:  /* ... */;
--color-bo-accent-300:  /* ... */;
--color-bo-accent-600:  /* secondary brand colour */;
--color-bo-accent-700:  /* one step darker */;

/* bo-info (align with accent) */
--color-bo-info-100:    /* accent-100 */;
--color-bo-info-300:    /* accent-300 */;
--color-bo-info-400:    /* accent mid */;
--color-bo-info-dark:   /* accent-600 */;
--color-bo-info-light:  /* accent-50 */;

/* bo-warning (customer warm/promo colour) */
--color-bo-warning-dark:  /* saturated warning */;
--color-bo-warning-light: /* pale tint */;

/* bo-error (customer alert colour) */
--color-bo-error-dark:  /* saturated error */;
--color-bo-error-light: /* pale tint */;
```

#### Inline utility classes to update
Within the same file, update these rgba() values to reference the new primary and accent:

| Utility | `rgba()` to update |
|---|---|
| `.bg-bo-glass-primary` | primary at 0.07 opacity |
| `.bg-bo-gradient-muted` | accent at 0.12 opacity |
| `.bg-bo-corner-glow::before` | primary at 0.07 opacity |
| `.bo-tab-trigger` border | primary at 0.15 opacity |
| `.bo-tab-trigger:hover` border | primary at 0.25 opacity |
| `.bo-tab-trigger[data-state="active"]` | primary at 0.10/0.35 opacity |
| `.bo-tab-trigger[data-state="active"]::after` gradient | primary → secondary |
| `.bo-interactive-box` border | primary at 0.15/0.25 opacity |
| `.bo-transport-code` background/border | accent at 0.85/0.3 opacity |
| `--shadow-bo-glass` | primary at 0.10/0.06 opacity |
| `--shadow-bo-glass-strong` | primary at 0.14/0.08 opacity |
| `.mall-map-marker` background | primary-500 hex |

### 3. Update `data/malls/brandProfiles.json`

Add a profile keyed by `mallId` (matches the URL segment `/mall/[mallId]`):

```json
{
  "profiles": {
    "your-mall-id": {
      "name": "Display Name",
      "logo": "/logo.png",
      "colors": {
        "primary":    "#hex",
        "secondary":  "#hex",
        "accent":     "#hex",
        "warning":    "#hex",
        "error":      "#hex",
        "background": "#F8F6F3"
      },
      "gradient": {
        "from": "#darkest-primary-shade",
        "to":   "#darker-primary-shade"
      },
      "typography": {
        "fontFamily":   "Inter, sans-serif",
        "headingWeight": 700
      }
    }
  }
}
```

### 4. Update chart hardcoded hex values

`src/components/mall/FootfallChart.tsx` uses hardcoded `stroke` hex values on `<Line>` elements. Update these to match the new brand palette:

```tsx
// Actual footfall line → primary brand colour
stroke="#328d2e"   // → customer primary-500

// Predicted line → secondary / lime
stroke="#7cb928"   // → customer secondary or primary-300

// Weather impact line → accent / navy
stroke="#214990"   // → customer accent-600
```

### 5. (Optional) Deep audit for any remaining hardcoded hex

Run a targeted search for inline colours in mall components:

```bash
grep -r '#[0-9a-fA-F]\{3,6\}' src/components/mall/ --include="*.tsx"
```

Common candidates:
- `src/components/mall/CatchmentMap.tsx` — zone fill colours
- `src/components/mall/ui/TrendShape.tsx` — trend line colours
- `src/components/mall/FootfallAnalysis.tsx` — zone bar colours

These use semantic Tailwind colours (green-500, blue-500, etc.) and generally do not need updating unless the customer's brand conflicts with the semantic meaning.

---

## What NOT to change

| Element | Reason |
|---|---|
| `bo-neutral-*` scale | Neutral foundation — customer-independent, ensures readable body text and surfaces at all times |
| `/stelthion-brandmark.png` in TopBar | Platform identity — always present, always in position |
| `/logo.png` Stelthion wordmark | Platform identity |
| `--background` (`#F8F6F3`) | Warm off-white page background — works with all brand palettes |
| Glass morphism base colours | Transparent — they pick up the brand tint automatically via `bo-primary` changes |
| Typography — Inter font | Platform font, consistent across tenants |

---

## Current Customer: Ideapark Lempäälä

| Token | Value | Source |
|---|---|---|
| `bo-primary-500` | `#328d2e` | Forest green — dominant brand colour |
| `bo-primary-300` | `#6DC36A` | Green mid-tint |
| `bo-accent-600` | `#214990` | Navy blue — navigation/corporate |
| `bo-warning-dark` | `#d4633a` | Derived from warm orange `#f7966b` |
| `bo-error-dark` | `#f04e54` | Coral red — promotional/alert |
| `bo-success-dark` | `#5a8a1e` | Lime green `#7cb928` shade |
| Chart actual line | `#328d2e` | Primary green |
| Chart predicted line | `#7cb928` | Lime green secondary |
| Chart weather line | `#214990` | Navy accent |

Brand reference: [https://lempaala.ideapark.fi/](https://lempaala.ideapark.fi/)
Tagline: *"Kuin toinen maailma"* (Like another world)
