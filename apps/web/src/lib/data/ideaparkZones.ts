/**
 * Ideapark Lempäälä — Floor Plan Zone Definitions & Visitor Data
 *
 * SVG coordinates use viewBox="0 0 1000 450".
 * The floor plan image (1028×466 px, aspect ~2.21:1) fills the container
 * (paddingBottom 45% → ~2.22:1) almost exactly with object-contain + p-3.
 * Image content offset: ~12px on all sides in viewBox coords.
 *
 * Building footprint in viewBox:  x: 50–858,  y: 30–419
 * Upper / lower division:         y ≈ 210
 * Detached Auto Arena:            x: 863–948, y: 353–423
 *
 * Zone layout:
 *  Upper section (y 30–205): 3 large rectangular anchor/retail zones
 *  Lower curved concourse:   outer curve is parabolic, lowest at (454, 419)
 *    – West Concourse (left arc)
 *    – Central Hub    (pedestrian spine + kiosks)
 *    – Food Court     (centre bottom, follows curve)
 *    – East Concourse (right arc, mirrors west)
 *  Detached: Auto Arena (separate building, bottom-right)
 *
 * Visitor numbers derived from Finnish mall camera-count baseline,
 * scaled to Ideapark's 7,500,000 annual visitors.
 * Scale factor: 7,500,000 / 9,400,000 = 0.7979
 * Whole-mall baseline hourly throughput: 2,838 × 0.7979 ≈ 2,265 visitors/hr
 */

export interface IdeaparkZone {
  id: string;
  name: string;
  category: 'Anchor' | 'Fashion' | 'F&B' | 'Entertainment' | 'Auto' | 'Leisure' | 'Mixed';
  area_sqm: number;
  /** SVG polygon points, viewBox 0 0 1000 450 */
  svgPoints: string;
  /** Peak comfortable capacity (area × 0.5 person/m²) */
  capacity: number;
  /** Baseline visitors/hr at Friday 12:00 */
  baseVisitors: number;
  /** Label centre position */
  labelX: number;
  labelY: number;
}

// ─── Hourly multipliers — Friday 12:00 = 1.0 baseline ─────────────────────────
export const HOURLY_MULTIPLIERS: Record<number, number> = {
  10: 0.50,
  11: 0.75,
  12: 1.00,
  13: 0.86,
  14: 0.90,
  15: 0.95,
  16: 1.28,
  17: 1.20,
  18: 1.00,
  19: 0.75,
  20: 0.50,
  21: 0.30,
};

// ─── Day-of-week multipliers — Friday = 1.0 ───────────────────────────────────
export const DAY_MULTIPLIERS: Record<number, number> = {
  0: 1.20, // Sunday
  1: 0.95, // Monday
  2: 0.95, // Tuesday
  3: 0.95, // Wednesday
  4: 0.95, // Thursday
  5: 1.00, // Friday
  6: 1.30, // Saturday
};

// ─── Zone definitions ─────────────────────────────────────────────────────────
// Polygon coordinates are mapped to match the visible store/zone boundaries in
// Ideapark 1.png within SVG viewBox 0 0 1000 450.
//
// Outer arc formula (lower concourse):
//   y(x) = 205 + 214 × (1 − ((x − 454) / 404)²)
//   giving y = 205 at the left (x=50) & right (x=858) edges
//   and y = 419 at the centre (x=454).
//
export const IDEAPARK_ZONES: IdeaparkZone[] = [
  {
    id: 'west-anchor',
    name: 'West Anchor',
    category: 'Anchor',
    area_sqm: 15000,
    // Upper-left: large rectangular big-box store cluster
    svgPoints: '50,30 225,30 225,205 50,205',
    capacity: 7500,
    baseVisitors: 374,
    labelX: 137,
    labelY: 117,
  },
  {
    id: 'north-retail',
    name: 'North Retail',
    category: 'Fashion',
    area_sqm: 10000,
    // Upper-centre: mix of mid-size fashion & specialty stores
    svgPoints: '230,30 620,30 620,205 230,205',
    capacity: 5000,
    baseVisitors: 249,
    labelX: 425,
    labelY: 117,
  },
  {
    id: 'east-anchor',
    name: 'East Anchor',
    category: 'Anchor',
    area_sqm: 12000,
    // Upper-right: large anchor store + right-wing stores
    svgPoints: '625,30 858,30 858,205 625,205',
    capacity: 6000,
    baseVisitors: 299,
    labelX: 741,
    labelY: 117,
  },
  {
    id: 'west-concourse',
    name: 'West Concourse',
    category: 'Fashion',
    area_sqm: 10000,
    // Lower-left curved arc of smaller retail units.
    // Inner edge: straight at y=210.
    // Outer arc follows parabola; key points:
    //   x=325 → y≈397,  x=270 → y≈375,  x=190 → y≈338,  x=110 → y≈279
    svgPoints: '50,210 325,210 325,397 270,375 190,338 110,279 50,210',
    capacity: 5000,
    baseVisitors: 249,
    labelX: 175,
    labelY: 295,
  },
  {
    id: 'central-hub',
    name: 'Central Hub',
    category: 'Mixed',
    area_sqm: 5000,
    // Central pedestrian spine with kiosk units and circulation atrium
    svgPoints: '330,210 580,210 580,320 330,320',
    capacity: 2500,
    baseVisitors: 125,
    labelX: 455,
    labelY: 265,
  },
  {
    id: 'food-court',
    name: 'Food Court',
    category: 'F&B',
    area_sqm: 6000,
    // Centre-bottom area following the outer curve:
    //   x=330 → y≈399,  x=454 → y=419,  x=580 → y≈399
    svgPoints: '330,325 580,325 580,399 454,419 330,399',
    capacity: 3000,
    baseVisitors: 150,
    labelX: 455,
    labelY: 372,
  },
  {
    id: 'east-concourse',
    name: 'East Concourse',
    category: 'Fashion',
    area_sqm: 10000,
    // Lower-right curved arc (mirror of west concourse).
    // Outer arc key points:
    //   x=585 → y≈396,  x=650 → y≈369,  x=730 → y≈319,  x=800 → y≈273
    svgPoints: '585,210 858,210 858,235 800,273 730,319 650,369 585,396',
    capacity: 5000,
    baseVisitors: 249,
    labelX: 723,
    labelY: 295,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    category: 'Entertainment',
    area_sqm: 8000,
    // Leisure / activity zone — part of the right wing above concourse
    // (karting, bowling, minigolf area in the east wing)
    svgPoints: '863,30 960,30 960,205 863,205',
    capacity: 4000,
    baseVisitors: 199,
    labelX: 911,
    labelY: 117,
  },
  {
    id: 'auto-arena',
    name: 'Auto Arena',
    category: 'Auto',
    area_sqm: 15000,
    // Detached building (bottom-right, separate from main mall)
    // Nordic's largest indoor car dealership
    svgPoints: '863,353 948,353 948,423 863,423',
    capacity: 1500,
    baseVisitors: 167,
    labelX: 905,
    labelY: 388,
  },
];

// ─── Visitor calculator ────────────────────────────────────────────────────────
export interface ZoneVisitorData {
  visitors: number;
  predicted: number;
  delta: number;      // % vs plan — positive means above plan
  density: number;    // visitors per m²
}

/**
 * Calculate visitor count for a zone at a given hour and day of week.
 */
export function getZoneVisitors(
  zone: IdeaparkZone,
  hour: number,
  dayOfWeek: number
): ZoneVisitorData {
  const hourMultiplier = HOURLY_MULTIPLIERS[hour] ?? 0.5;
  const dayMultiplier  = DAY_MULTIPLIERS[dayOfWeek] ?? 1.0;

  // Deterministic small variance so demo feels realistic without random flicker
  const seed = (zone.id.charCodeAt(0) + hour * 3) % 13;
  const variance = 0.92 + (seed / 13) * 0.16; // 0.92–1.08

  const visitors  = Math.round(zone.baseVisitors * hourMultiplier * dayMultiplier * variance);
  const predicted = Math.round(zone.baseVisitors * hourMultiplier * dayMultiplier);
  const delta     = predicted > 0 ? Math.round(((visitors - predicted) / predicted) * 100) : 0;
  const density   = zone.area_sqm > 0 ? Number((visitors / zone.area_sqm).toFixed(3)) : 0;

  return { visitors, predicted, delta, density };
}

/**
 * Heat colour for a zone based on visitor density ratio (visitors / capacity).
 */
export function getHeatColor(visitors: number, capacity: number): string {
  const ratio = capacity > 0 ? visitors / capacity : 0;
  if (ratio < 0.15) return '#3b82f6'; // blue   — very quiet
  if (ratio < 0.30) return '#22c55e'; // green  — moderate
  if (ratio < 0.50) return '#eab308'; // yellow — busy
  if (ratio < 0.70) return '#f97316'; // orange — very busy
  return '#ef4444';                   // red    — crowded
}
