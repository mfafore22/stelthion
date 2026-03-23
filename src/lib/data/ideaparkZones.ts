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
  /** Finnish display name shown on the dashboard */
  nameFi: string;
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
  /**
   * om_location prefix numbers from lempaala.ideapark.fi that belong to
   * this zone. The prefix is the integer part of the "wing.unit" code,
   * e.g. "8.05" → prefix 8.
   */
  locationPrefixes: number[];
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

// ─── Ground floor zone definitions ────────────────────────────────────────────
//
// SVG viewBox matches image pixel dimensions: "0 0 1504 704" (Ideapark 1.png).
// paddingBottom on the container: 46.8% (= 704/1504).
// Image is rendered object-contain with no padding, so SVG px = image px.
//
// Building footprint in image:  x: 105–1195  y: 155–625
// Upper section (rectangular):  y: 155–355   (main shopping gallery)
// Lower arc (concourse):        y: 355–625   (curved south face)
//   Arc formula: y(x) = 355 + 270 × (1 − ((x − 645) / 545)²)
//   Key outer arc y-values:
//     x=200 → 445,  x=300 → 517,  x=400 → 570,  x=500 → 606
//     x=600 → 623,  x=645 → 625,  x=700 → 622,  x=800 → 603
//     x=900 → 566,  x=1000 → 511, x=1100 → 437, x=1185 → 360
// Detached Auto Arena:           x: 1220–1455, y: 490–615
//
export const IDEAPARK_ZONES: IdeaparkZone[] = [
  // ── Upper section — 7 zones ──────────────────────────────────────────────
  {
    id: 'west-anchor',
    name: 'West Anchor',
    nameFi: 'Läntinen ankkuri',
    category: 'Anchor',
    area_sqm: 15000,
    // Citymarket — large big-box block at far left
    svgPoints: '52,110 215,110 215,355 52,355',
    capacity: 7500,
    baseVisitors: 374,
    labelX: 133,
    labelY: 232,
    locationPrefixes: [1],
  },
  {
    id: 'west-gallery',
    name: 'West Gallery',
    nameFi: 'Läntinen galleria',
    category: 'Fashion',
    area_sqm: 7000,
    // Prisma Ideapark, Budget Sport
    svgPoints: '215,110 432,110 432,355 215,355',
    capacity: 3500,
    baseVisitors: 175,
    labelX: 323,
    labelY: 232,
    locationPrefixes: [2, 9],
  },
  {
    id: 'center-gallery',
    name: 'Central Gallery',
    nameFi: 'Keskusgalleria',
    category: 'Fashion',
    area_sqm: 8000,
    // Bläk Boks, Halonen
    svgPoints: '432,90 750,90 750,355 432,355',
    capacity: 4000,
    baseVisitors: 200,
    labelX: 591,
    labelY: 222,
    locationPrefixes: [6, 10],
  },
  {
    id: 'east-gallery',
    name: 'East Gallery',
    nameFi: 'Itäinen galleria',
    category: 'Fashion',
    area_sqm: 7000,
    // Clas Ohlson, FIDA Second Hand, JYSK, Kekäle
    svgPoints: '750,90 1008,90 1008,355 750,355',
    capacity: 3500,
    baseVisitors: 175,
    labelX: 879,
    labelY: 222,
    locationPrefixes: [5, 11],
  },
  {
    id: 'east-anchor',
    name: 'East Anchor',
    nameFi: 'Itäinen ankkuri',
    category: 'Anchor',
    area_sqm: 10000,
    // Minimani — traced from floor plan walls:
    // left x=974 (y=114→371), top y=114 (x=974→1078),
    // right x=1078 (shared with Autoareena left wall), bottom y=371.
    svgPoints: '974,114 1078,114 1078,371 974,371',
    capacity: 5000,
    baseVisitors: 250,
    labelX: 1026,
    labelY: 243,
    locationPrefixes: [4],
  },
  {
    id: 'autoareena',
    name: 'Ideapark Autoareena',
    nameFi: 'Ideapark Autoareena',
    category: 'Auto',
    area_sqm: 14000,
    // Ideapark Autoareena — large automotive retail block, upper-right
    // Left wall: x=1078 (y=115→393), top inner face: y=115, right: x=1379 (y=115→155),
    // outer diagonal: (1379,155)→(1209,393), bottom: y=393 (x=1078→1209).
    svgPoints: '1078,115 1379,115 1379,155 1209,393 1078,393',
    capacity: 2000,
    baseVisitors: 140,
    labelX: 1230,
    labelY: 250,
    locationPrefixes: [3, 12],
  },
  {
    id: 'east-strip',
    name: 'East Strip',
    nameFi: 'Itäinen kaistale',
    category: 'Fashion',
    area_sqm: 4500,
    // Tommy Hilfiger, Intersport Ideapark, Guess — right-side corridor
    svgPoints: '960,280 1200,280 1200,430 960,430',
    capacity: 2250,
    baseVisitors: 112,
    labelX: 1080,
    labelY: 355,
    locationPrefixes: [],
  },
  // ── Lower arc section — 4 zones ──────────────────────────────────────────
  {
    id: 'west-arc',
    name: 'West Concourse',
    nameFi: 'Läntinen käytävä',
    category: 'Fashion',
    area_sqm: 9000,
    // Kauppahuone Riveri, New Yorker, Only, Sinsay, Apteekki, Finlayson,
    // Stadium, Luhta Brand Store, H&M
    // Arc: x=105→y=355, x=200→y=445, x=300→y=517, x=430→y=583
    svgPoints: '52,355 430,355 430,583 400,570 300,517 200,445 105,390 52,355',
    capacity: 4500,
    baseVisitors: 225,
    labelX: 240,
    labelY: 475,
    locationPrefixes: [],
  },
  {
    id: 'center-hub',
    name: 'Event Square',
    nameFi: 'Tapahtumatori',
    category: 'Mixed',
    area_sqm: 5500,
    // Juve Sport, Marc O'Polo, Cafe Deliss, Seoul Good, Suomen Kultajousi,
    // CHANGE Lingerie, Ståhlberg Home Bakery, Flying Tiger, Subway, & Burgers, VileThai
    // Central element (info desk) at approx x:640, y:420 — label placed below it
    svgPoints: '430,355 820,355 820,440 430,440',
    capacity: 2750,
    baseVisitors: 138,
    labelX: 640,
    labelY: 458,
    locationPrefixes: [8],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    nameFi: 'Ravintolamaailma',
    category: 'F&B',
    area_sqm: 6500,
    // Ståhlberg Home Bakery, Subway, & Burgers, VileThai, Kotipizza, Cafe Deliss,
    // HESBURGER, Burger King, RAX PizzaBuffet — restaurant corridor left + outer arc centre
    // Left side covers the inline restaurant units (x:295–430) top to bottom of arc,
    // right side covers the food arc (x:430–820, y:440–625). Tapahtumatori renders on top.
    svgPoints: '295,355 430,355 430,440 820,440 820,603 700,621 645,625 500,606 430,583 295,500',
    capacity: 3250,
    baseVisitors: 163,
    labelX: 555,
    labelY: 415,
    locationPrefixes: [7],
  },
  {
    id: 'east-arc',
    name: 'East Concourse',
    nameFi: 'Itäinen käytävä',
    category: 'Mixed',
    area_sqm: 9000,
    // KAPPAHL, Pentik, My Bag, Gant, Cropp, Bik Bok, Dressmann, Lindex,
    // Marimekko Outlet, Unikulma, iittala outlet
    // Arc: x=820→y=603, x=900→y=566, x=1000→y=511, x=1100→y=437, x=1185→y=360
    svgPoints: '820,355 1185,355 1100,437 1000,511 900,566 820,603',
    capacity: 4500,
    baseVisitors: 225,
    labelX: 1000,
    labelY: 472,
    locationPrefixes: [20],
  },
];

// ─── Upper floor zone definitions ─────────────────────────────────────────────
//
// SVG viewBox matches image pixel dimensions: "0 0 1518 688" (Ideapark 2.png).
// paddingBottom on the container: 45.3% (= 688/1518).
//
// Building footprint in image:  x: 120–1400,  y: 168–590
// Layout:
//   Gallery strip (y 168–280):  full-width north-facing corridor
//   West wing  (x 120–355):     large section (leisure / big format)
//   West corridor (x 360–560):  smaller retail units, left of centre
//   Central (x 565–955):        escalator banks, atrium, services
//   East corridor (x 960–1160): smaller retail units, right of centre
//   East wing (x 1165–1400):    large section (leisure / big format)
//   South arc (y 510–590):      curved lower gallery
//
// locationPrefixes is empty — the infotaulu CMS does not expose floor level.
// Store-to-floor assignment will be added once floor data is available.
//
// South arc formula: y(x) = 510 + 80 × (1 − ((x − 760) / 400)²)
//   Key arc y-values:
//     x=360→510, x=460→545, x=560→570, x=660→585, x=760→590,
//     x=860→585, x=960→570, x=1060→545, x=1160→510
//
export const IDEAPARK_UPPER_ZONES: IdeaparkZone[] = [
  {
    id: 'upper-gallery',
    name: 'Upper Gallery',
    nameFi: 'Yläkerta galleria',
    category: 'Fashion',
    area_sqm: 8000,
    // Full-width north gallery strip
    svgPoints: '120,168 1400,168 1400,280 120,280',
    capacity: 4000,
    baseVisitors: 200,
    labelX: 760,
    labelY: 224,
    locationPrefixes: [],
  },
  {
    id: 'upper-west-wing',
    name: 'Upper West Wing',
    nameFi: 'Läntinen siipi',
    category: 'Leisure',
    area_sqm: 12000,
    // Large west section — leisure / big format retail
    svgPoints: '120,285 355,285 355,510 120,510',
    capacity: 3000,
    baseVisitors: 150,
    labelX: 237,
    labelY: 397,
    locationPrefixes: [],
  },
  {
    id: 'upper-west-corridor',
    name: 'Upper West Corridor',
    nameFi: 'Läntinen käytävä',
    category: 'Fashion',
    area_sqm: 5000,
    // Smaller units west of centre
    svgPoints: '360,285 560,285 560,480 360,480',
    capacity: 2500,
    baseVisitors: 125,
    labelX: 460,
    labelY: 382,
    locationPrefixes: [],
  },
  {
    id: 'upper-central',
    name: 'Upper Central',
    nameFi: 'Keskusaukio',
    category: 'Mixed',
    area_sqm: 5500,
    // Central atrium, escalator banks, services
    svgPoints: '565,285 955,285 955,480 565,480',
    capacity: 2750,
    baseVisitors: 138,
    labelX: 760,
    labelY: 382,
    locationPrefixes: [],
  },
  {
    id: 'upper-east-corridor',
    name: 'Upper East Corridor',
    nameFi: 'Itäinen käytävä',
    category: 'Fashion',
    area_sqm: 5000,
    // Smaller units east of centre
    svgPoints: '960,285 1160,285 1160,480 960,480',
    capacity: 2500,
    baseVisitors: 125,
    labelX: 1060,
    labelY: 382,
    locationPrefixes: [],
  },
  {
    id: 'upper-east-wing',
    name: 'Upper East Wing',
    nameFi: 'Itäinen siipi',
    category: 'Leisure',
    area_sqm: 12000,
    // Large east section — leisure / big format retail
    svgPoints: '1165,285 1400,285 1400,510 1165,510',
    capacity: 3000,
    baseVisitors: 150,
    labelX: 1282,
    labelY: 397,
    locationPrefixes: [],
  },
  {
    id: 'upper-south-arc',
    name: 'Upper South Arc',
    nameFi: 'Eteläinen kaari',
    category: 'F&B',
    area_sqm: 4500,
    // Curved south-facing lower gallery
    svgPoints: '360,510 1160,510 1060,545 960,570 860,585 760,590 660,585 560,570 460,545 360,510',
    capacity: 2250,
    baseVisitors: 113,
    labelX: 760,
    labelY: 555,
    locationPrefixes: [],
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
  if (ratio < 0.15) return '#A8D9A4'; // sage green  — very quiet  (bo-heat-low)
  if (ratio < 0.30) return '#4AA844'; // mid green   — moderate    (bo-heat-mid-low)
  if (ratio < 0.50) return '#E8B931'; // warm amber  — busy        (bo-heat-mid)
  if (ratio < 0.70) return '#E87B3A'; // tangerine   — very busy   (bo-heat-high)
  return '#D94E53';                   // muted coral — crowded     (bo-heat-max)
}
