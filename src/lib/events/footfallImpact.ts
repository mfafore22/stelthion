/**
 * Event footfall impact model — gravity-based, mall-agnostic.
 *
 * Estimates how many additional visitors a nearby event drives to a mall.
 * Uses an exponential distance-decay (gravity model):
 *
 *   additionalVisitors = attendance × BASE_CAPTURE_RATE × categoryMultiplier × exp(−d / DECAY_KM)
 *
 * Constants are calibrated for Finnish suburban retail (10–30 km catchment).
 * No mall-specific baseline is required, making this reusable across all accounts.
 */

export type EventCategory =
  | 'concert'
  | 'sports'
  | 'conference'
  | 'exhibition'
  | 'festival'
  | 'other';

/** Fraction of event attendees who visit a nearby mall, at zero distance. */
const BASE_CAPTURE_RATE = 0.05;

/**
 * Distance constant for exponential decay (km).
 * At DECAY_KM the capture rate is ~37% of base; at 2×DECAY_KM it is ~14%.
 * Calibrated so a venue 22 km away (e.g. Nokia Arena → Ideapark) yields ~2–3%.
 */
const DECAY_KM = 15;

/**
 * Category multipliers.
 * Sports fans and exhibition visitors combine trips with retail more readily;
 * conference delegates (business travel) do so less.
 */
const CATEGORY_MULTIPLIER: Record<EventCategory, number> = {
  sports:      1.3,  // pre/post-game dining & shopping
  exhibition:  1.2,  // browsing mindset transfers to retail
  concert:     1.1,  // early arrivals often shop nearby
  festival:    0.8,  // tend to stay at the festival grounds
  conference:  0.7,  // business travellers use suburban malls less
  other:       1.0,
};

/**
 * Estimate additional mall visitors driven by a nearby event.
 *
 * @param expectedAttendance  Number of people attending the event
 * @param distanceKm          Road distance from the venue to the mall
 * @param category            Event type
 * @returns Additional visitor count (rounded to nearest whole number)
 */
export function calcAdditionalVisitors(
  expectedAttendance: number,
  distanceKm: number,
  category: EventCategory,
): number {
  if (expectedAttendance <= 0 || distanceKm < 0) return 0;
  const multiplier = CATEGORY_MULTIPLIER[category] ?? 1.0;
  const decayFactor = Math.exp(-distanceKm / DECAY_KM);
  return Math.round(expectedAttendance * BASE_CAPTURE_RATE * multiplier * decayFactor);
}

/**
 * Footfall impact as a percentage of a mall's typical daily footfall.
 * Use this when the caller knows the baseline visitor count.
 *
 * @param expectedAttendance  Number of people attending the event
 * @param distanceKm          Road distance from the venue to the mall
 * @param category            Event type
 * @param baselineFootfall    Mall's typical daily visitor count
 * @returns Percentage uplift (e.g. 2.6 means +2.6%), one decimal place
 */
export function calcFootfallImpactPct(
  expectedAttendance: number,
  distanceKm: number,
  category: EventCategory,
  baselineFootfall: number,
): number {
  if (baselineFootfall <= 0) return 0;
  const additional = calcAdditionalVisitors(expectedAttendance, distanceKm, category);
  return Math.round((additional / baselineFootfall) * 1000) / 10;
}
