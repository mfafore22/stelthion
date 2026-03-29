/**
 * Ideapark Lempäälä — Zone Adjacency Graph
 *
 * Encodes which zones are physically connected (walkable without passing
 * through an intermediate zone). Each edge has a base transition probability
 * representing the share of visitors who walk from one zone to the adjacent one.
 *
 * Ground floor zones (11):
 *   west-anchor, west-gallery, center-gallery, east-gallery, east-anchor,
 *   entertainment, west-arc, center-hub, food-court, east-arc, auto-arena
 *
 * Upper floor zones (7):
 *   upper-gallery, upper-west-wing, upper-west-corridor, upper-central,
 *   upper-east-corridor, upper-east-wing, upper-south-arc
 *
 * Cross-floor links via escalators/elevators:
 *   center-gallery ↔ upper-central  (main escalators)
 *   west-gallery   ↔ upper-west-corridor
 *   east-gallery   ↔ upper-east-corridor
 */

export interface AdjacencyEdge {
  /** Adjacent zone id */
  target: string;
  /** Base transition probability (0–1). All edges from a zone sum to ~1. */
  weight: number;
  /** True if this is a cross-floor link */
  crossFloor?: boolean;
}

/**
 * Adjacency map: zoneId → list of adjacent zones with transition weights.
 * Weights are calibrated so higher-traffic neighbours get larger shares.
 */
export const IDEAPARK_ADJACENCY: Record<string, AdjacencyEdge[]> = {
  // ── Ground floor ────────────────────────────────────────────────────────
  'west-anchor': [
    { target: 'west-gallery', weight: 0.45 },
    { target: 'west-arc', weight: 0.55 },
  ],
  'west-gallery': [
    { target: 'west-anchor', weight: 0.25 },
    { target: 'center-gallery', weight: 0.35 },
    { target: 'west-arc', weight: 0.15 },
    { target: 'center-hub', weight: 0.10 },
    { target: 'upper-west-corridor', weight: 0.15, crossFloor: true },
  ],
  'center-gallery': [
    { target: 'west-gallery', weight: 0.22 },
    { target: 'east-gallery', weight: 0.22 },
    { target: 'center-hub', weight: 0.26 },
    { target: 'food-court', weight: 0.10 },
    { target: 'upper-central', weight: 0.20, crossFloor: true },
  ],
  'east-gallery': [
    { target: 'center-gallery', weight: 0.30 },
    { target: 'east-anchor', weight: 0.20 },
    { target: 'entertainment', weight: 0.10 },
    { target: 'east-arc', weight: 0.15 },
    { target: 'center-hub', weight: 0.10 },
    { target: 'upper-east-corridor', weight: 0.15, crossFloor: true },
  ],
  'east-anchor': [
    { target: 'east-gallery', weight: 0.45 },
    { target: 'entertainment', weight: 0.25 },
    { target: 'east-arc', weight: 0.30 },
  ],
  'entertainment': [
    { target: 'east-anchor', weight: 0.40 },
    { target: 'east-gallery', weight: 0.35 },
    { target: 'east-arc', weight: 0.25 },
  ],
  'west-arc': [
    { target: 'west-anchor', weight: 0.30 },
    { target: 'west-gallery', weight: 0.20 },
    { target: 'center-hub', weight: 0.30 },
    { target: 'food-court', weight: 0.20 },
  ],
  'center-hub': [
    { target: 'west-gallery', weight: 0.15 },
    { target: 'center-gallery', weight: 0.25 },
    { target: 'east-gallery', weight: 0.10 },
    { target: 'west-arc', weight: 0.15 },
    { target: 'food-court', weight: 0.20 },
    { target: 'east-arc', weight: 0.15 },
  ],
  'food-court': [
    { target: 'center-hub', weight: 0.35 },
    { target: 'west-arc', weight: 0.20 },
    { target: 'east-arc', weight: 0.20 },
    { target: 'center-gallery', weight: 0.25 },
  ],
  'east-arc': [
    { target: 'east-anchor', weight: 0.25 },
    { target: 'entertainment', weight: 0.10 },
    { target: 'east-gallery', weight: 0.15 },
    { target: 'center-hub', weight: 0.30 },
    { target: 'food-court', weight: 0.20 },
  ],
  'auto-arena': [
    // Detached building — visitors arrive/depart by car, minimal walk-through
    // Modelled as weakly connected to the east side
    { target: 'east-arc', weight: 0.60 },
    { target: 'east-anchor', weight: 0.40 },
  ],

  // ── Upper floor ─────────────────────────────────────────────────────────
  'upper-gallery': [
    { target: 'upper-west-wing', weight: 0.20 },
    { target: 'upper-west-corridor', weight: 0.20 },
    { target: 'upper-central', weight: 0.25 },
    { target: 'upper-east-corridor', weight: 0.20 },
    { target: 'upper-east-wing', weight: 0.15 },
  ],
  'upper-west-wing': [
    { target: 'upper-gallery', weight: 0.35 },
    { target: 'upper-west-corridor', weight: 0.40 },
    { target: 'upper-south-arc', weight: 0.25 },
  ],
  'upper-west-corridor': [
    { target: 'upper-west-wing', weight: 0.20 },
    { target: 'upper-gallery', weight: 0.20 },
    { target: 'upper-central', weight: 0.30 },
    { target: 'upper-south-arc', weight: 0.15 },
    { target: 'west-gallery', weight: 0.15, crossFloor: true },
  ],
  'upper-central': [
    { target: 'upper-west-corridor', weight: 0.20 },
    { target: 'upper-east-corridor', weight: 0.20 },
    { target: 'upper-gallery', weight: 0.20 },
    { target: 'upper-south-arc', weight: 0.15 },
    { target: 'center-gallery', weight: 0.25, crossFloor: true },
  ],
  'upper-east-corridor': [
    { target: 'upper-central', weight: 0.30 },
    { target: 'upper-east-wing', weight: 0.20 },
    { target: 'upper-gallery', weight: 0.20 },
    { target: 'upper-south-arc', weight: 0.15 },
    { target: 'east-gallery', weight: 0.15, crossFloor: true },
  ],
  'upper-east-wing': [
    { target: 'upper-east-corridor', weight: 0.40 },
    { target: 'upper-gallery', weight: 0.35 },
    { target: 'upper-south-arc', weight: 0.25 },
  ],
  'upper-south-arc': [
    { target: 'upper-west-wing', weight: 0.15 },
    { target: 'upper-west-corridor', weight: 0.20 },
    { target: 'upper-central', weight: 0.25 },
    { target: 'upper-east-corridor', weight: 0.20 },
    { target: 'upper-east-wing', weight: 0.20 },
  ],
};

/** Get all zone ids in the adjacency graph */
export function getAllZoneIds(): string[] {
  return Object.keys(IDEAPARK_ADJACENCY);
}

/** Check if two zones are directly adjacent */
export function areAdjacent(a: string, b: string): boolean {
  return IDEAPARK_ADJACENCY[a]?.some((e) => e.target === b) ?? false;
}
