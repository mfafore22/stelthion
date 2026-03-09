# GUI Standard: Tenant Portfolio Overview
**Status**: ✅ APPROVED STANDARD
**Date**: 2025-11-21
**Version**: 1.0

> **IMPORTANT**: This document defines the standard GUI implementation for tenant-based portfolio overview. Revert to this specification in case of breakage until a new standard is approved.

---

## Overview

Multi-tenant portfolio system with tenant-specific URL routing, proper authentication flows, and isolated property views.

## URL Structure

### Tenant Routes
- **Multi-property tenants**: `/tenant/[tenantId]/portfolio`
  - Realidea: `/tenant/realidea/portfolio` (15 properties)
  - Koy Ideapark Oy: `/tenant/koy-ideapark-oy/portfolio` (1 property)

### Legacy Routes (maintained for backward compatibility)
- `/mall/portfolio` - General portfolio (filters by user.companyName)
- `/mall/[mallId]/dashboard` - Single mall executive dashboard

## Authentication & Login Flow

### Login Redirect Logic
Location: `apps/web/src/app/mall/login/page.tsx:46-56`

The redirect is now fully dynamic — derived from `isMultiProperty` and `companyName` returned by the login API, so new tenants do not require code changes.

```typescript
const { mallId, companyName, isMultiProperty } = data;

// Multi-property tenants → tenant portfolio page (slug derived from company name)
if (isMultiProperty) {
  const tenantSlug = companyName.toLowerCase().replace(/\s+/g, '-');
  router.push(`/tenant/${tenantSlug}/portfolio`);
} else {
  // Single-property operators → their mall detail page
  router.push(`/mall/${mallId}`);
}
```

To make a tenant multi-property: set `isMultiProperty: true` in `apps/web/src/app/api/mall/auth/login/route.ts`.

### Session Provider
All tenant routes wrapped in SessionProvider via layout:
- `apps/web/src/app/tenant/layout.tsx` - Provides SessionContext + MallConciergeWrapper

## Tenant Isolation & Property Filtering

### Realidea Properties (15 total)
**Excludes**: Itis, Jumbo, Ideapark Lempäälä

```typescript
// Filter logic in /tenant/[tenantId]/portfolio/page.tsx:433-451
if (tenantName === 'Realidea') {
  return REALIDEA_PROPERTIES.filter(
    property => property.id !== 'itis' && property.id !== 'jumbo' && property.id !== 'ideapark'
  );
}
```

**Security**: Ideapark Lempäälä is owned by "Koy Ideapark Oy" (separate tenant) and must never be exposed to Realidea.

### Koy Ideapark Oy Properties (1 total)
**Includes**: Only Ideapark Lempäälä

```typescript
if (tenantName === 'Koy Ideapark Oy') {
  return REALIDEA_PROPERTIES.filter(property => property.id === 'ideapark');
}
```

## Terminology Standards

### Stelthion Synexis™ Context Model
- **Context Model Label**: "Stelthion Synexis™"
- **Usage**: Replaces "ML predictions" in status labels
- **Example**: "LIVE (Stelthion Synexis™ active)"

### Synexis™ Signals
- **Detailed Insights Label**: "Synexis™ Signals"
- **Usage**: Used for detailed insight panels and contextual predictions
- **Example**: Insight cards showing parking patterns, weather impacts, etc.

### Status Label Location
- `apps/web/src/app/mall/portfolio/page.tsx:834`
- `apps/web/src/app/tenant/[tenantId]/portfolio/page.tsx:851`

```typescript
<p className="font-medium text-bo-neutral-900 tracking-wide">
  LIVE (Stelthion Synexis™ active)
</p>
```

## Navigation Structure

### Left Navigation (MallLeftNav)
Location: `apps/web/src/components/mall/shell/MallLeftNav.tsx:98-130`

#### Portfolio Link Behavior
```typescript
// Multi-property tenants
if (user.companyName === 'Realidea') {
  route: '/tenant/realidea/portfolio',
  description: 'Portfolio Overview - All Realidea Properties',
}

// Single-property operators
else {
  route: `/mall/${user.mallId}/dashboard`,
  description: `${user.mallDisplayName} Dashboard`,
}
```

### Navigation Items
1. **Portfolio** - Dynamic route based on tenant type
2. **Properties** - Individual mall detail pages (future)
3. **Campaigns** - Placeholder page (future implementation)
4. **Analytics** - Placeholder page (future implementation)

## User Flow

### Realidea User Journey
```
Login (Realidea credentials)
  ↓
/tenant/realidea/portfolio (15 properties with map)
  ↓ Click property card
/mall/{mallId}/dashboard (e.g., Mall of Tripla)
  ↓ Click Portfolio icon in left nav
Back to /tenant/realidea/portfolio
  ↓ Click Campaigns
/mall/campaigns (placeholder: "Feature coming soon")
  ↓ Click Portfolio icon
Back to /tenant/realidea/portfolio
```

### Single-Property User Journey
```
Login (single-property credentials)
  ↓
/mall/{mallId}/dashboard (their mall only)
  ↓ Click Portfolio icon
Stays on /mall/{mallId}/dashboard (no multi-property view)
```

## Placeholder Pages

### Campaigns Page
Location: `apps/web/src/app/mall/campaigns/page.tsx`

**Features**:
- Shows mall shell (MallLeftNav + MallTopBar)
- Megaphone icon (orange)
- "Campaigns Feature Coming Soon" heading
- Shows current mall context
- Does NOT redirect

### Analytics Page
Location: `apps/web/src/app/mall/analytics/page.tsx`

**Features**:
- Shows mall shell (MallLeftNav + MallTopBar)
- LineChart icon (blue)
- "Analytics Feature Coming Soon" heading
- Shows current mall context
- Does NOT redirect

## Key Files & Line Numbers

### Core Implementation
| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/src/app/tenant/layout.tsx` | All | SessionProvider wrapper for tenant routes |
| `apps/web/src/app/tenant/[tenantId]/portfolio/page.tsx` | 398-451 | Tenant portfolio page with dynamic filtering |
| `apps/web/src/app/mall/login/page.tsx` | 42-53 | Conditional redirect based on company |
| `apps/web/src/components/mall/shell/MallLeftNav.tsx` | 98-130 | Dynamic portfolio link routing |

### Status Labels
| File | Line | Content |
|------|------|---------|
| `apps/web/src/app/mall/portfolio/page.tsx` | 834 | "LIVE (Stelthion Synexis™ active)" |
| `apps/web/src/app/tenant/[tenantId]/portfolio/page.tsx` | 851 | "LIVE (Stelthion Synexis™ active)" |

### Placeholder Pages
| File | Purpose |
|------|---------|
| `apps/web/src/app/mall/campaigns/page.tsx` | Campaigns placeholder with mall shell |
| `apps/web/src/app/mall/analytics/page.tsx` | Analytics placeholder with mall shell |

## Tenant Mapping

```typescript
const TENANT_MAP: Record<string, string> = {
  'realidea': 'Realidea',
  'koy-ideapark-oy': 'Koy Ideapark Oy',
};
```

## Visual Design Standards

### Portfolio Overview Layout
- **Sidebar**: 480px width, 500px map height
- **Main Content**: Responsive grid of property cards
- **KPI Cards**: 4-card layout (Visitors, Growth, Weather, Alerts)
- **Map**: Mapbox GL with brand-colored property markers

### Color Accents
- **Green**: Current visitors, live status
- **Blue**: Network growth
- **Orange**: Weather impact
- **Red**: Active alerts

### Map Features
- Interactive property pins with brand colors
- Click to select/highlight property
- Shows all authorized properties for tenant
- Height: 500px (increased from 240px)

## Testing Checklist

### Login Flow
- [ ] Realidea login redirects to `/tenant/realidea/portfolio`
- [ ] Koy Ideapark Oy login redirects to `/tenant/koy-ideapark-oy/portfolio`
- [ ] Single-property login redirects to `/mall/{mallId}/dashboard`

### Tenant Isolation
- [ ] Realidea sees exactly 15 properties (excludes Itis, Jumbo, Ideapark)
- [ ] Koy Ideapark Oy sees only Ideapark
- [ ] No cross-tenant data leakage

### Navigation
- [ ] Portfolio icon takes Realidea users to `/tenant/realidea/portfolio`
- [ ] Portfolio icon takes single-property users to their mall dashboard
- [ ] Campaigns link shows placeholder page (no redirect)
- [ ] Analytics link shows placeholder page (no redirect)

### Labels
- [ ] Status shows "LIVE (Stelthion Synexis™ active)" not "ML predictions"
- [ ] All tooltips use correct company names
- [ ] Map shows correct number of properties for tenant

## Rollback Procedure

If breakage occurs:

1. **Verify these files exist**:
   ```
   apps/web/src/app/tenant/layout.tsx
   apps/web/src/app/tenant/[tenantId]/portfolio/page.tsx
   ```

2. **Check login redirect** (line 42-53 in login/page.tsx):
   ```typescript
   if (companyName === 'Realidea') {
     router.push('/tenant/realidea/portfolio');
   }
   ```

3. **Check status labels** (lines 834/851):
   ```
   "LIVE (Stelthion Synexis™ active)"
   ```

4. **Check tenant filtering** (lines 438-441):
   ```typescript
   property.id !== 'itis' && property.id !== 'jumbo' && property.id !== 'ideapark'
   ```

5. **Verify SessionProvider** in `apps/web/src/app/tenant/layout.tsx`

## Known Issues / Future Enhancements

### Current Limitations
- Events tab still needs image preview restoration (w-32 h-24 format from commit 13ae420)
- Weather shows "Data: Simulated" instead of real FMI data (deprioritized)
- WebSocket console error in concierge (non-blocking)

### Planned Features
- Per-mall campaigns implementation
- Per-mall analytics implementation
- Properties page (individual mall detail view)

## Git Commit Reference

This standard reflects the state of the codebase after implementing tenant-based routing with the following changes:

**Key Commits**:
- Tenant portfolio route implementation
- Login redirect conditional logic
- Status label terminology update ("Stelthion Synexis™")
- Placeholder pages for Campaigns/Analytics
- Dynamic left navigation routing

---

**Last Updated**: 2025-11-21
**Approved By**: User
**Next Review**: When changing portfolio GUI standards
