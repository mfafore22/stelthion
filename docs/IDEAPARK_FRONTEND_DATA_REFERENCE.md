# Ideapark Lempäälä — Frontend Data Reference

> **Purpose:** This document extracts ALL mocked, static, and hardcoded data currently
> embedded in the frontend codebase. Use this as the authoritative reference when
> migrating this data into proper database tables and syncing with live Ideapark sources.
>
> **Generated:** 2026-03-17
> **Source codebase:** `Stelthion_Production1/src/`

---

## Table of Contents

1. [Footfall Estimation Model](#1-footfall-estimation-model)
2. [Floor Plan Zones — Ground Floor](#2-floor-plan-zones--ground-floor)
3. [Floor Plan Zones — Upper Floor](#3-floor-plan-zones--upper-floor)
4. [Zone Visitor Calculation Logic](#4-zone-visitor-calculation-logic)
5. [Ground Floor Store Positions](#5-ground-floor-store-positions)
6. [Ground Floor Entrances](#6-ground-floor-entrances)
7. [Store Zone Mapping (CMS Prefixes)](#7-store-zone-mapping-cms-prefixes)
8. [Transport — Nysse Bus Routes](#8-transport--nysse-bus-routes)
9. [Transport — VR Rail Connections](#9-transport--vr-rail-connections)
10. [Catchment Demographics](#10-catchment-demographics)
11. [Household Statistics](#11-household-statistics)
12. [Parking Data](#12-parking-data)
13. [Nearby Venue Events](#13-nearby-venue-events)
14. [Postal Code Boundaries](#14-postal-code-boundaries)
15. [Tenant Performance (Mock)](#15-tenant-performance-mock)
16. [Scenario Planner Constants](#16-scenario-planner-constants)
17. [UI Constants & Color Maps](#17-ui-constants--color-maps)
18. [Brand Identity Profile](#18-brand-identity-profile)
19. [Computed Functions to Replace](#19-computed-functions-to-replace)

---

## 1. Footfall Estimation Model

**Source file:** `src/lib/data/footfall.ts`
**Data origin:** Ideapark publicly reported ~5M annual visits, extrapolated mathematically.
**Replace with:** Real sensor/camera count data from Ideapark.

### Core Constants

| Constant | Value | Derivation |
|----------|-------|-----------|
| Annual visits | 5,000,000 | Publicly reported |
| Operating days/year | 360 | — |
| Avg daily visitors | ~13,900 | 5M / 360 |
| Peak Saturday multiplier | 1.30x | → ~18,100/day |
| Peak hour share | ~12% of daily | 15:00–16:00 |
| Avg dwell time | 1.8 hours | — |
| **PEAK_VISITORS** (simultaneous) | **3,900** | 13,900 × 0.12 / (1/1.8) |
| Weekend peak simultaneous | ~5,070 | 3,900 × 1.30 |

### Hourly Traffic Pattern (HOURLY_PATTERN)

Normalised to peak = 1.0. Ideapark opens 10:00–21:00 Mon–Sat, 12:00–18:00 Sun.

| Hour | Factor | Hour | Factor |
|------|--------|------|--------|
| 00–09 | 0.00 | 14 | 0.88 |
| 10 | 0.08 | 15 | 0.96 |
| 11 | 0.32 | **16** | **1.00** (peak) |
| 12 | 0.58 | 17 | 0.97 |
| 13 | 0.74 | 18 | 0.82 |
| — | — | 19 | 0.60 |
| — | — | 20 | 0.28 |
| — | — | 21 | 0.10 |
| — | — | 22–23 | 0.00 |

### Dwell Time by Hour (DWELL_BY_HOUR, minutes)

| Hour | Dwell | Hour | Dwell |
|------|-------|------|-------|
| 10 | 58 | 15 | 42 |
| 11 | 54 | 16 | 43 |
| 12 | 50 | 17 | 45 |
| 13 | 47 | 18 | 48 |
| 14 | 44 | 19 | 52 |
| — | — | 20 | 55 |
| **Default** | **47** | — | — |

### Conversion Rate by Hour (CONVERSION_BY_HOUR, %)

| Hour | Rate | Hour | Rate |
|------|------|------|------|
| 10 | 18.2 | 15 | **26.0** (peak) |
| 11 | 20.5 | 16 | 25.6 |
| 12 | 22.1 | 17 | 24.3 |
| 13 | 23.8 | 18 | 22.0 |
| 14 | 25.4 | 19 | 19.8 |
| — | — | 20 | 18.5 |
| **Default** | **23.4** | — | — |

### Static KPI Deltas (from PropertyDetail.tsx)

| KPI | Hardcoded Delta |
|-----|----------------|
| vsPlanned | +8.7% |
| weatherBoost | +3.2% |
| dwellDelta | +12% |
| conversionDelta | +5.2% |

---

## 2. Floor Plan Zones — Ground Floor

**Source file:** `src/lib/data/ideaparkZones.ts`
**SVG viewBox:** `0 0 1504 704` (matches Ideapark 1.png pixel dimensions 1:1)
**Data origin:** Calibrated to 7.5M annual visitors (scaled from Finnish mall camera baseline: 7.5M / 9.4M = 0.7979)
**Whole-mall baseline hourly throughput:** 2,838 × 0.7979 = ~2,265 visitors/hr

### Hourly Multipliers (HOURLY_MULTIPLIERS, Friday 12:00 = 1.0)

| Hour | Mult | Hour | Mult |
|------|------|------|------|
| 10 | 0.50 | 16 | 1.28 |
| 11 | 0.75 | 17 | 1.20 |
| **12** | **1.00** | 18 | 1.00 |
| 13 | 0.86 | 19 | 0.75 |
| 14 | 0.90 | 20 | 0.50 |
| 15 | 0.95 | 21 | 0.30 |

### Day-of-Week Multipliers (DAY_MULTIPLIERS, Friday = 1.0)

| Day | Multiplier |
|-----|-----------|
| Sunday (0) | 1.20 |
| Monday (1) | 0.95 |
| Tuesday (2) | 0.95 |
| Wednesday (3) | 0.95 |
| Thursday (4) | 0.95 |
| Friday (5) | 1.00 |
| Saturday (6) | 1.30 |

### Ground Floor Zones (11 zones)

| ID | Name (EN) | Name (FI) | Category | Area (m²) | Capacity | Base Visitors/hr | SVG Points | Label (x,y) | CMS Prefixes |
|----|-----------|-----------|----------|-----------|----------|-----------------|------------|-------------|-------------|
| west-anchor | West Anchor | Läntinen ankkuri | Anchor | 15,000 | 7,500 | 374 | 52,110 215,110 215,355 52,355 | 133,232 | [1] |
| west-gallery | West Gallery | Läntinen galleria | Fashion | 7,000 | 3,500 | 175 | 215,110 432,110 432,355 215,355 | 323,232 | [2, 9] |
| center-gallery | Central Gallery | Keskusgalleria | Fashion | 8,000 | 4,000 | 200 | 432,90 750,90 750,355 432,355 | 591,222 | [6, 10] |
| east-gallery | East Gallery | Itäinen galleria | Fashion | 7,000 | 3,500 | 175 | 750,90 1008,90 1008,355 750,355 | 879,222 | [5, 11] |
| east-anchor | East Anchor | Itäinen ankkuri | Anchor | 10,000 | 5,000 | 250 | 974,114 1078,114 1078,371 974,371 | 1026,243 | [4] |
| autoareena | Ideapark Autoareena | Ideapark Autoareena | Auto | 14,000 | 2,000 | 140 | 1078,115 1379,115 1379,155 1209,393 1078,393 | 1230,250 | [3, 12] |
| east-strip | East Strip | Itäinen kaistale | Fashion | 4,500 | 2,250 | 112 | 960,280 1200,280 1200,430 960,430 | 1080,355 | [] |
| west-arc | West Concourse | Läntinen käytävä | Fashion | 9,000 | 4,500 | 225 | 52,355 430,355 430,583 400,570 300,517 200,445 105,390 52,355 | 240,475 | [] |
| center-hub | Event Square | Tapahtumatori | Mixed | 5,500 | 2,750 | 138 | 430,355 820,355 820,440 430,440 | 640,458 | [8] |
| food-court | Food Court | Ravintolamaailma | F&B | 6,500 | 3,250 | 163 | 295,355 430,355 430,440 820,440 820,603 700,621 645,625 500,606 430,583 295,500 | 555,415 | [7] |
| east-arc | East Concourse | Itäinen käytävä | Mixed | 9,000 | 4,500 | 225 | 820,355 1185,355 1100,437 1000,511 900,566 820,603 | 1000,472 | [20] |

**Capacity formula:** area_sqm × 0.5 person/m²

---

## 3. Floor Plan Zones — Upper Floor

**SVG viewBox:** `0 0 1518 688` (matches Ideapark 2.png)
**Note:** CMS locationPrefixes are all empty — infotaulu CMS does not expose floor level.

| ID | Name (EN) | Name (FI) | Category | Area (m²) | Capacity | Base Visitors/hr | SVG Points | Label (x,y) |
|----|-----------|-----------|----------|-----------|----------|-----------------|------------|-------------|
| upper-gallery | Upper Gallery | Yläkerta galleria | Fashion | 8,000 | 4,000 | 200 | 120,168 1400,168 1400,280 120,280 | 760,224 |
| upper-west-wing | Upper West Wing | Läntinen siipi | Leisure | 12,000 | 3,000 | 150 | 120,285 355,285 355,510 120,510 | 237,397 |
| upper-west-corridor | Upper West Corridor | Läntinen käytävä | Fashion | 5,000 | 2,500 | 125 | 360,285 560,285 560,480 360,480 | 460,382 |
| upper-central | Upper Central | Keskusaukio | Mixed | 5,500 | 2,750 | 138 | 565,285 955,285 955,480 565,480 | 760,382 |
| upper-east-corridor | Upper East Corridor | Itäinen käytävä | Fashion | 5,000 | 2,500 | 125 | 960,285 1160,285 1160,480 960,480 | 1060,382 |
| upper-east-wing | Upper East Wing | Itäinen siipi | Leisure | 12,000 | 3,000 | 150 | 1165,285 1400,285 1400,510 1165,510 | 1282,397 |
| upper-south-arc | Upper South Arc | Eteläinen kaari | F&B | 4,500 | 2,250 | 113 | 360,510 1160,510 1060,545 960,570 860,585 760,590 660,585 560,570 460,545 360,510 | 760,555 |

---

## 4. Zone Visitor Calculation Logic

**Source file:** `src/lib/data/ideaparkZones.ts` — `getZoneVisitors()` function

```
visitors = baseVisitors × HOURLY_MULTIPLIERS[hour] × DAY_MULTIPLIERS[dayOfWeek] × variance
predicted = baseVisitors × HOURLY_MULTIPLIERS[hour] × DAY_MULTIPLIERS[dayOfWeek]
delta = ((visitors - predicted) / predicted) × 100   (%)
density = visitors / area_sqm

variance = 0.92 + ((charCodeAt(zone.id[0]) + hour × 3) % 13) / 13 × 0.16
         → range: 0.92 – 1.08 (deterministic per zone+hour, no random flicker)
```

### Heat Color Thresholds (visitors / capacity ratio)

| Ratio | Color | Label |
|-------|-------|-------|
| < 0.15 | #3b82f6 (blue) | Very quiet |
| < 0.30 | #22c55e (green) | Moderate |
| < 0.50 | #eab308 (yellow) | Busy |
| < 0.70 | #f97316 (orange) | Very busy |
| >= 0.70 | #ef4444 (red) | Crowded |

---

## 5. Ground Floor Store Positions

**Source file:** `src/lib/data/ideaparkStorePositions.ts`
**SVG coordinate space:** viewBox `0 0 1504 704`
**Traced from:** Ideapark 1.png floor plan image (blue-pixel cluster analysis)

| Name | Slug | Zone ID | x | y | w | h |
|------|------|---------|---|---|---|---|
| Citymarket | citymarket | west-anchor | 52 | 110 | 163 | 245 |
| Prisma Ideapark | prisma-ideapark | west-gallery | 215 | 110 | 217 | 145 |
| Budget Sport | budget-sport | west-gallery | 215 | 255 | 217 | 100 |
| Bläk Boks | blak-boks | center-gallery | 432 | 90 | 190 | 265 |
| Halonen | halonen | center-gallery | 622 | 110 | 130 | 245 |
| Clas Ohlson | clas-ohlson | east-gallery | 700 | 90 | 120 | 75 |
| FIDA Second Hand | fida-second-hand | east-gallery | 820 | 165 | 140 | 95 |
| JYSK | jysk | east-gallery | 752 | 260 | 206 | 95 |
| Kekäle | kekale | east-gallery | 958 | 90 | 50 | 80 |
| Minimani | minimani | east-anchor | 974 | 114 | 104 | 257 |
| Ideapark Autoareena | autoareena | autoareena | 1150 | 230 | 160 | 40 |
| Tommy Hilfiger | tommy-hilfiger | east-strip | 1000 | 280 | 105 | 70 |
| Intersport Ideapark | intersport-ideapark | east-strip | 820 | 358 | 140 | 58 |
| Guess | guess | east-strip | 1105 | 280 | 95 | 95 |
| Juve Sport | juve-sport | center-hub | 406 | 328 | 42 | 42 |
| Marc O'Polo | marc-o-polo | center-hub | 542 | 340 | 52 | 38 |
| Suomen Kultajousi | suomen-kultajousi | center-hub | 700 | 372 | 68 | 30 |
| CHANGE Lingerie | change-lingerie | center-hub | 900 | 408 | 72 | 40 |
| Cafe Deliss | cafe-deliss | food-court | 594 | 340 | 52 | 38 |
| Seoul Good | seoul-good | food-court | 648 | 340 | 52 | 38 |
| Stahlberg Home Bakery | stahlberg-home-bakery | food-court | 320 | 390 | 80 | 42 |
| Flying Tiger | flying-tiger | food-court | 310 | 355 | 55 | 38 |
| Subway | subway | food-court | 428 | 390 | 40 | 38 |
| & Burgers | burgers | food-court | 468 | 390 | 48 | 38 |
| VileThai | vilethai | food-court | 542 | 400 | 52 | 40 |
| Kotipizza | kotipizza | food-court | 594 | 400 | 52 | 45 |
| HESBURGER | hesburger | food-court | 648 | 400 | 60 | 58 |
| Burger King | burger-king | food-court | 648 | 460 | 60 | 58 |
| RAX PizzaBuffet | rax-pizzabuffet | food-court | 712 | 440 | 65 | 55 |
| Kauppahuone Riveri | kauppahuone-riveri | west-arc | 52 | 455 | 125 | 110 |
| New Yorker | new-yorker | west-arc | 177 | 455 | 118 | 100 |
| Only | only | west-arc | 180 | 358 | 42 | 45 |
| Sinsay | sinsay | west-arc | 296 | 500 | 90 | 110 |
| Apteekki | apteekki | west-arc | 386 | 455 | 68 | 75 |
| Finlayson | finlayson | west-arc | 454 | 455 | 68 | 65 |
| Stadium | stadium | west-arc | 366 | 505 | 130 | 100 |
| Luhta Brand Store | luhta-brand-store | west-arc | 470 | 540 | 100 | 70 |
| H&M | hm | west-arc | 572 | 555 | 90 | 80 |
| Dressmann | dressmann | east-arc | 665 | 555 | 90 | 75 |
| Lindex | lindex | east-arc | 710 | 488 | 88 | 40 |
| KAPPAHL | kappahl | east-arc | 710 | 395 | 118 | 90 |
| Pentik | pentik | east-arc | 830 | 395 | 80 | 80 |
| My Bag | my-bag | east-arc | 910 | 395 | 42 | 50 |
| Gant | gant | east-arc | 910 | 495 | 55 | 45 |
| Cropp | cropp | east-arc | 970 | 490 | 42 | 45 |
| Bik Bok | bik-bok | east-arc | 790 | 560 | 42 | 30 |
| Marimekko Outlet | marimekko-outlet | east-arc | 1058 | 432 | 21 | 57 |
| Unikulma | unikulma | east-arc | 1020 | 512 | 172 | 50 |
| iittala outlet | iittala-outlet | east-arc | 960 | 530 | 58 | 55 |

---

## 6. Ground Floor Entrances

**Source file:** `src/lib/data/ideaparkStorePositions.ts`

| ID | Label (FI) | x | y | Direction |
|----|-----------|---|---|-----------|
| entrance-west | Lansisisaankaynti | 120 | 415 | S |
| entrance-center1 | Keskussisaankaynti 1 | 360 | 440 | S |
| entrance-center2 | Keskussisaankaynti 2 | 530 | 450 | S |
| entrance-east | Itasisaankaynti | 1050 | 430 | S |

---

## 7. Store Zone Mapping (CMS Prefixes)

**Source file:** `src/lib/data/ideaparkStores.ts`
**Live data source:** `https://lempaala.ideapark.fi?infotaulu=1` (WordPress CMS)

Each store in the CMS has an `om_location` field like `"8.05"`. The integer prefix maps to a zone:

| CMS Prefix | Zone ID | Zone Name (FI) |
|-----------|---------|----------------|
| 1 | west-anchor | Lantinen ankkuri |
| 2 | west-gallery | Lantinen galleria |
| 3 | autoareena | Ideapark Autoareena |
| 4 | east-anchor | Itainen ankkuri |
| 5 | east-gallery | Itainen galleria |
| 6 | center-gallery | Keskusgalleria |
| 7 | food-court | Ravintolamaailma |
| 8 | center-hub | Tapahtumatori |
| 9 | west-gallery | Lantinen galleria |
| 10 | center-gallery | Keskusgalleria |
| 11 | east-gallery | Itainen galleria |
| 12 | autoareena | Ideapark Autoareena |
| 20 | east-arc | Itainen kaytava |

**Unmapped prefixes:** east-strip, west-arc have no CMS prefix assignment.
**Upper floor zones:** No prefix mapping — CMS does not expose floor level.

---

## 8. Transport — Nysse Bus Routes

**Source file:** `src/lib/data/ideaparkTransport.ts`
**Data origin:** Nysse (Tampere regional transport) timetables

### Bus Routes

| Route | Frequency (buses/hr) | Destination | Origin | Travel Time | First | Last |
|-------|---------------------|-------------|--------|-------------|-------|------|
| 50 | 3 | Tampere (Keskustori) | Lempaala | 45 min | 06:00 | 22:00 |
| 59 | 2 | Tampere (Pyynikki) | Lempaala | 50 min | 06:30 | 21:00 |
| 60 | 2 | Tampere (Lentavanniemi) | Lempaala | 55 min | 07:00 | 20:30 |

### Bus Stops

| ID | Name | Code |
|----|------|------|
| nysse:ideapark-p | Ideapark pysakki | IP1 |
| nysse:lempaala-as | Lempaala asema | LA1 |

### Aggregate Metrics

| Metric | Value |
|--------|-------|
| Stops within 500m | 3 |
| Accessibility score | 52 / 100 |
| Public transit share | 8% |

---

## 9. Transport — VR Rail Connections

**Source file:** `src/lib/data/ideaparkTransport.ts`
**Nearest station:** Lempaala asema (Helsinki–Tampere main line, ~2 km from Ideapark)

### Rail Routes

| Destination | Daily Trains | Travel Time | Train Types |
|-------------|-------------|-------------|-------------|
| Tampere | 14 | 25 min | IC, Taajamajuna |
| Helsinki | 14 | 95 min | IC, Pendolino |
| Turku | 6 | 130 min | IC |
| Oulu | 6 | 330 min | IC, Night train |

### Tourism Impact

| Metric | Value |
|--------|-------|
| Estimated daily tourists | 120 |

### Seasonal Variation Multipliers (by month)

| Month | Multiplier | Month | Multiplier |
|-------|-----------|-------|-----------|
| Jan | 0.85 | Jul | 1.20 |
| Feb | 0.88 | Aug | 1.10 |
| Mar | 0.92 | Sep | 1.00 |
| Apr | 0.98 | Oct | 0.95 |
| May | 1.05 | Nov | 1.08 |
| Jun | 1.15 | Dec | 1.25 |

---

## 10. Catchment Demographics

**Source file:** `src/lib/data/ideaparkTransport.ts`
**Data origin:** Statistics Finland — Lempaala / Tampere south region
**Primary profile:** family-suburban
**Spending potential index:** 62 / 100

### 5-Minute Drive Zone (Lempaala centre + Marjamaki)

| Metric | Value |
|--------|-------|
| Postal codes | 37550, 37560 |
| Population | 8,200 |
| Age 0–14 | 1,640 (20%) |
| Age 15–24 | 1,230 (15%) |
| Age 25–44 | 2,460 (30%) |
| Age 45–64 | 1,968 (24%) |
| Age 65+ | 902 (11%) |
| Households | 3,400 |
| Median household income | EUR 48,000/yr |
| Avg disposable income | EUR 35,000/yr |
| High income share (>EUR 60k) | 18% |
| Employment rate | 74% |
| Students | 820 |
| Top sectors | Manufacturing, Retail, Healthcare, Education |

### 10-Minute Drive Zone (Lempaala municipality + Saaksjarvi + Kulju)

| Metric | Value |
|--------|-------|
| Postal codes | 37550, 37530, 37510, 37560 |
| Population | 23,500 |
| Age 0–14 | 4,935 (21%) |
| Age 15–24 | 3,290 (14%) |
| Age 25–44 | 7,285 (31%) |
| Age 45–64 | 5,640 (24%) |
| Age 65+ | 2,350 (10%) |
| Households | 9,800 |
| Median household income | EUR 50,000/yr |
| Avg disposable income | EUR 37,000/yr |
| High income share | 20% |
| Employment rate | 76% |
| Students | 2,350 |
| Top sectors | Manufacturing, Logistics, Retail, Construction, Healthcare |

### 15-Minute Drive Zone (Pirkkala + south Tampere)

| Metric | Value |
|--------|-------|
| Postal codes | 33960, 37550, 37530, 37510, 33800, 33820 |
| Population | 58,000 |
| Age 0–14 | 11,600 (20%) |
| Age 15–24 | 8,120 (14%) |
| Age 25–44 | 17,980 (31%) |
| Age 45–64 | 13,920 (24%) |
| Age 65+ | 6,380 (11%) |
| Households | 24,000 |
| Median household income | EUR 52,000/yr |
| Avg disposable income | EUR 39,000/yr |
| High income share | 22% |
| Employment rate | 78% |
| Students | 7,540 |
| Top sectors | Tech, Manufacturing, Healthcare, Retail, Logistics |

### 30-Minute Drive Zone (Greater Tampere area)

| Metric | Value |
|--------|-------|
| Postal codes | 33100, 33200, 33300, 33400, 33500, 33700, 33710, 33720, 33730, 33800, 33820, 33840, 33850, 33870, 33900, 37200, 37800 |
| Population | 215,000 |
| Age 0–14 | 36,550 (17%) |
| Age 15–24 | 36,550 (17%) — university city |
| Age 25–44 | 73,100 (34%) |
| Age 45–64 | 47,300 (22%) |
| Age 65+ | 21,500 (10%) |
| Households | 102,000 |
| Median household income | EUR 54,000/yr |
| Avg disposable income | EUR 40,500/yr |
| High income share | 25% |
| Employment rate | 79% |
| Students | 38,700 |
| Top sectors | Tech, Healthcare, Education, Manufacturing, Professional services |

---

## 11. Household Statistics

**Source file:** `src/lib/data/household.ts`
**Data origin:** Statistics Finland (Tilastokeskus) — Lempaala & surroundings, 2023

### Summary

| Metric | Value |
|--------|-------|
| Total households | 48,320 |
| Average household size | 2.41 |
| Ownership rate | 68.4% |
| Predominant type | family-suburban |

### By Postal Code

| Postal Code | Area | Total | 1-person | 2-person | 3-person | 4-person | 5+ person | Avg Size | Owned | Rented | Own% |
|-------------|------|-------|----------|----------|----------|----------|-----------|----------|-------|--------|------|
| 37550 | Lempaala keskusta | 5,820 | 1,690 | 1,940 | 1,120 | 780 | 290 | 2.38 | 3,980 | 1,840 | 68.4% |
| 37530 | Saaksjarvi | 7,140 | 1,570 | 2,210 | 1,780 | 1,210 | 370 | 2.62 | 5,260 | 1,880 | 73.7% |
| 37510 | Kulju | 4,980 | 1,180 | 1,550 | 1,230 | 780 | 240 | 2.55 | 3,560 | 1,420 | 71.5% |
| 37560 | Ideapark / Marjamaki | 3,210 | 590 | 940 | 890 | 610 | 180 | 2.71 | 2,480 | 730 | 77.3% |
| 33960 | Pirkkala | 8,640 | 2,010 | 2,680 | 2,110 | 1,420 | 420 | 2.58 | 6,110 | 2,530 | 70.7% |
| 37200 | Valkeakoski | 9,820 | 3,140 | 3,390 | 1,890 | 1,020 | 380 | 2.18 | 6,140 | 3,680 | 62.5% |
| 33800 | Tampere etela | 8,710 | 3,820 | 2,660 | 1,330 | 720 | 180 | 1.98 | 4,640 | 4,070 | 53.3% |

---

## 12. Parking Data

**Source file:** `src/lib/data/ideaparkTransport.ts`
**Data origin:** lempaala.ideapark.fi/en/info-2/
**Type:** One large free outdoor surface lot

### Static Configuration

| Metric | Value |
|--------|-------|
| Total capacity | 3,000 spaces |
| Public spaces | 3,000 |
| Monthly contracts | 0 |
| EV charging spots | 57 total (40x 22kW basic + 17x 150kW fast) |
| Hourly rate | EUR 0 (free) |
| Daily max | EUR 0 |
| Monthly contract | EUR 0 |
| Car arrival share | 88% |
| Default occupancy | 675 (23%) |

### Hourly Utilization Curve (avgUtilization %)

| Hour | Util% | Hour | Util% |
|------|-------|------|-------|
| 09 | 12 | 15 | **78** (peak) |
| 10 | 22 | 16 | 75 |
| 11 | 38 | 17 | 65 |
| 12 | 52 | 18 | 52 |
| 13 | 62 | 19 | 40 |
| 14 | 72 | 20 | 25 |
| — | — | 21 | 12 |

### Day-of-Week Parking Multipliers (applied to utilization)

| Day | Multiplier |
|-----|-----------|
| Sunday | 0.90 |
| Saturday | 1.15 |
| Weekdays (Mon–Fri) | 0.95 |

### Parking Snapshot Computation

```
adjUtil = min(95, baseUtil[hour] × dayMultiplier)
occupied = round((adjUtil / 100) × (capacity - monthlyContracts)) + variation(±5)
utilization = (totalOccupied / totalCapacity) × 100
```

---

## 13. Nearby Venue Events

**Source file:** `src/lib/data/ideaparkEvents.ts`
**Data origin:** Nokia Arena, Tampere-talo, Tampereen Messu ja Urheilu schedules (static)
**Note:** Dates are computed as `today + N days` — they shift dynamically.

### Venues

| ID | Name | Distance | Type |
|----|------|----------|------|
| nokia-arena | Nokia Arena | 22 km | arena (22,000-seat) |
| tampere-talo | Tampere-talo | 22 km | concert-hall |
| tampere-messu | Tampereen Messu ja Urheilu | 21 km | exhibition-center |

### Events (relative dates from today)

| ID | Title | Venue | Day Offset | Time | Category | Attendance |
|----|-------|-------|-----------|------|----------|------------|
| na-tappara-ilves | Tappara vs Ilves — Liiga | Nokia Arena | +2 | 18:30–21:00 | sports | 15,000 |
| th-tampere-philharmonic | Tampere Filharmonikot — Sibelius-gaala | Tampere-talo | +4 | 19:00–21:30 | concert | 1,800 |
| tesc-koti-ja-asuminen | Koti & Asuminen — Tampere | Tampereen Messu | +5 to +7 | 10:00–18:00 | exhibition | 22,000 |
| na-concert-1 | Nightwish — Decades World Tour | Nokia Arena | +7 | 19:00–22:30 | concert | 19,000 |
| th-stand-up | Pirkanmaan Stand-Up -festivaali | Tampere-talo | +10 to +11 | 19:00–22:00 | festival | 3,200 |
| na-tappara-karpat | Tappara vs Karpat — Liiga | Nokia Arena | +12 | 18:30–21:00 | sports | 14,200 |
| tesc-auto-tampere | Tampere Auto Show | Tampereen Messu | +16 to +18 | 10:00–19:00 | exhibition | 35,000 |
| na-concert-2 | Sunrise Avenue — Farewell Tour | Nokia Arena | +19 | 19:30–23:00 | concert | 16,000 |
| th-chamber-music | Pohjoismainen Kamarimusiikkifestivaali | Tampere-talo | +22 to +24 | 18:00–21:00 | concert | 950 |
| na-ilves-lukko | Ilves vs Lukko — Liiga | Nokia Arena | +26 | 17:00–19:30 | sports | 11,500 |
| tesc-eramessut | Eramessut — Kalastus ja Metsastys | Tampereen Messu | +28 to +30 | 10:00–18:00 | exhibition | 18,000 |

---

## 14. Postal Code Boundaries

**Source file:** `src/lib/services/postalCodeBoundaries.ts`
**Format:** Simplified WGS84 rectangular polygons (approximate, not real MML data)

| Code | Name | Center [lng, lat] | Bounding Box [lng, lat] |
|------|------|--------------------|------------------------|
| 37550 | Lempaala keskusta | 23.757, 61.316 | SW: 23.730, 61.300 — NE: 23.785, 61.332 |
| 37530 | Saaksjarvi | 23.780, 61.345 | SW: 23.755, 61.332 — NE: 23.810, 61.360 |
| 37510 | Kulju | 23.820, 61.300 | SW: 23.795, 61.285 — NE: 23.850, 61.318 |
| 37560 | Ideapark / Marjamaki | 23.730, 61.360 | SW: 23.705, 61.348 — NE: 23.758, 61.374 |
| 33960 | Pirkkala | 23.648, 61.465 | SW: 23.610, 61.447 — NE: 23.690, 61.483 |
| 37200 | Valkeakoski | 24.027, 61.265 | SW: 23.990, 61.248 — NE: 24.065, 61.282 |
| 33800 | Tampere etela | 23.763, 61.483 | SW: 23.720, 61.463 — NE: 23.808, 61.503 |

**Map centre for Ideapark:** `[23.7592, 61.4033]` (from CatchmentMap.tsx)

---

## 15. Tenant Performance (Mock)

**Source file:** `src/components/mall/TenantPerformanceTable.tsx`
**Status:** Completely fake — no real data behind these numbers.

| Category (FI) | Monthly Visits | Avg Dwell (min) | Monthly Sales (EUR) | Outlook (%) |
|--------------|---------------|-----------------|--------------------|----|
| Muoti (Fashion) | 12,450 | 28 | 42,300 | +12% |
| Ravintolat & Kahvilat (F&B) | 8,920 | 52 | 38,600 | +8% |
| Elektroniikka (Electronics) | 4,230 | 18 | 28,100 | 0% |
| Ruokakauppa (Grocery) | 9,870 | 32 | 52,800 | +6% |
| Palvelut (Services) | 2,770 | 22 | 12,400 | -3% |

---

## 16. Scenario Planner Constants

**Source file:** `src/components/mall/ScenarioPlanner.tsx`
**Status:** All hardcoded mock values for what-if modeling.

### Campaign Presets

| ID | Name | Visitor Uplift |
|----|------|---------------|
| blackfriday | Black Friday 2025 | +35% |
| christmas | Christmas Shopping | +28% |
| summer | Summer Sale | +18% |
| easter | Easter Campaign | +12% |

### Computation Constants

| Constant | Value | Notes |
|----------|-------|-------|
| Base daily visitors | 38,240 | Hardcoded |
| Revenue per visitor | EUR 8.94 | Average spend |
| Staffing ratio | 1 : 500 | 1 staff per 500 visitors |
| Current parking utilization | 87% | Baseline for scenario |
| Weather "optimal" multiplier | 1.06 | +6% |
| Weather "poor" multiplier | 0.92 | -8% |
| Weather "normal" multiplier | 1.00 | No change |

### Scenario Formula

```
predicted = baseVisitors × weatherImpact × campaignImpact
campaignImpact = 1 + (presetUplift OR customUplift) / 100
revenue = predicted × 8.94
staffing = predicted / 500
parking = (predicted / baseVisitors) × 87
```

---

## 17. UI Constants & Color Maps

### Store Category Colors (ZoneStoreList.tsx)

| Category (FI) | Background | Text |
|--------------|-----------|------|
| Aikuisten muoti | #fdf2f8 | #9d174d |
| Kahvilat & ravintolat | #fff7ed | #c2410c |
| Kauneus & terveys | #f0fdfa | #0f766e |
| Autoilu | #eff6ff | #1d4ed8 |
| Palvelut | #f8fafc | #475569 |
| Lapsille | #fefce8 | #a16207 |
| Koti & sisustus | #fdf4ff | #7e22ce |
| Korut, asusteet & laukut | #fff1f2 | #be123c |
| Paivittaistavarat & tekniikka | #f0f9ff | #0369a1 |
| Aikuisten jalkineet | #fff7ed | #9a3412 |
| Urheilu & harrastukset | #f0fdf4 | #15803d |
| *(fallback)* | #f1f5f9 | #334155 |

### Drive-Time Zone Colors (CatchmentMap.tsx)

| Minutes | Color | Opacity |
|---------|-------|---------|
| 5 | #22c55e (green) | 0.6 |
| 10 | #3b82f6 (blue) | 0.6 |
| 15 | #f97316 (orange) | 0.6 |
| 20 | #f59e0b (amber) | 0.6 |
| 30 | #ef4444 (red) | 0.6 |
| *(fallback)* | #9ca3af (gray) | 0.6 |

### Footfall Hour Labels (FootfallAnalysis.tsx)

`10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00, 21:00`

---

## 18. Brand Identity Profile

**Source file:** `data/malls/brandProfiles.json`

### Ideapark Lempaala

| Property | Value |
|----------|-------|
| Name | Ideapark Lempaala |
| Logo | /ideapark-logo.png |
| Primary color | #328d2e (green) |
| Secondary color | #7cb928 (lime green) |
| Accent color | #214990 (navy) |
| Warning color | #f7966b |
| Error color | #f04e54 |
| Background | #F8F6F3 |
| Gradient from | #264d21 |
| Gradient to | #1a3a15 |
| Font family | Inter, sans-serif |
| Heading weight | 700 |

---

## 19. Computed Functions to Replace

These functions currently generate data on-the-fly from the static constants above. They need to be replaced with database queries or real API integrations:

| Function | File | What It Does | Replace With |
|----------|------|-------------|-------------|
| `estimateCurrentFootfall()` | footfall.ts | Time-based visitor count from PEAK_VISITORS × HOURLY_PATTERN | Real sensor/camera count API |
| `getCurrentFootfall()` | footfall.ts | Returns KPI snapshot (visitors, dwell, conversion) | Real-time KPI aggregation service |
| `getZoneVisitors()` | ideaparkZones.ts | Calculates per-zone visitor count from baseVisitors × multipliers | Per-zone camera/sensor feeds |
| `getHeatColor()` | ideaparkZones.ts | Maps visitor/capacity ratio to hex color | Keep as UI utility (pure presentation) |
| `getIdeaparkParkingSnapshot()` | ideaparkTransport.ts | Time-aware parking occupancy with random variance | Real parking sensor API |
| `getIdeaparkLiveDepartures()` | ideaparkTransport.ts | Generates fake train/bus departures with random delays | Nysse Digitransit API + VR real-time API |
| `getIdeaparkUpcomingEvents()` | ideaparkEvents.ts | Returns 11 events with relative dates | Tampere Linked Events API / Nokia Arena API |
| `getHouseholdData()` | household.ts | Returns static household stats | Statistics Finland (Tilastokeskus) API or periodic import |
| `fetchPostalCodeBoundaries()` | postalCodeBoundaries.ts | Returns simplified rectangular polygons | MML (National Land Survey) WFS API for real boundaries |
| `normaliseStore()` / `parseInfotauluResponse()` | ideaparkStores.ts | Parses WordPress CMS store data | Keep but cache in DB; sync periodically from CMS |

---

## 20. Live Data Source URLs (for integration)

| Source | URL / API | Data Type |
|--------|----------|-----------|
| Ideapark store catalog | `https://lempaala.ideapark.fi?infotaulu=1` | JSON (WordPress) |
| Nysse real-time | Digitransit API (Waltti GTFS-RT) | Bus departures |
| VR real-time | rata.digitraffic.fi | Train departures |
| Weather | OpenWeatherMap or FMI Open Data | Current + forecast |
| Events | Tampere Linked Events API | Venue events |
| Postal boundaries | MML Paikkatietoikkuna WFS | GeoJSON polygons |
| Statistics Finland | stat.fi PxWeb API | Demographics |
| Parking | Ideapark parking system (TBD) | Occupancy |

---

*End of document. All values are extracted verbatim from the codebase as of 2026-03-17.*
