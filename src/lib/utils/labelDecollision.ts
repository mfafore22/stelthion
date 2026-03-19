/**
 * Shared label de-collision utility for SVG floorplan components.
 *
 * Used by:
 *  - Admin FloorplanEditor (src/components/admin/FloorplanEditor.tsx)
 *  - Mall FootfallAnalysis (src/components/mall/FootfallAnalysis.tsx)
 *
 * Algorithm: 5-phase solver
 *  1. Width estimation (proportional character-class lookup)
 *  2. Initial placement (inside shape or above/below)
 *  3. Two-axis iterative push-apart with priority weighting
 *  4. Viewport boundary clamping
 *  5. Leader line waypoint generation
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LabelInput {
  /** Unique identifier (e.g. 'zone-0', 'store-3') */
  id: string;
  /** Anchor point — shape centroid or stored labelX/Y */
  anchorX: number;
  anchorY: number;
  /** Label text (used for width estimation) */
  text: string;
  /** 'zone' = higher priority (displaced less); 'store' = lower priority */
  tier: 'zone' | 'store';
  /** Font size in SVG px (13 for zones, 7–7.5 for stores) */
  fontSize: number;
  /** Font weight (600 for zones, 500 for stores) */
  fontWeight?: number;
  /** Pill height override; defaults to tier-based value */
  pillHeight?: number;
  /** Whether the label text fits inside its shape */
  fitsInside: boolean;
  /** Shape bounding box for initial placement heuristic */
  shapeBounds?: { minX: number; minY: number; w: number; h: number };
}

export interface LabelOutput {
  id: string;
  /** Final label pill rect */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Original anchor for leader line endpoint */
  anchorX: number;
  anchorY: number;
  /** True if the label was displaced from its original anchor position */
  displaced: boolean;
  /** Display text (may be truncated with … for very long names) */
  displayText: string;
  /** Optional dogleg waypoint [wx, wy] for leader line routing */
  leaderWaypoint?: [number, number];
}

export interface DecollisionOptions {
  /** SVG viewBox width */
  viewBoxWidth: number;
  /** SVG viewBox height */
  viewBoxHeight: number;
  /** Boundary margin in SVG units (default: 8) */
  margin?: number;
  /** Max solver passes (default: 40) */
  maxPasses?: number;
  /** Default pill heights per tier */
  pillHeights?: { zone: number; store: number };
  /** Horizontal padding inside pill per tier */
  pillPadding?: { zone: number; store: number };
  /** Max label width as fraction of viewBox width before truncation (default: 0.25) */
  maxWidthFraction?: number;
}

// ─── Geometry helpers ───────────────────────────────────────────────────────

/** Parse an SVG polygon `points` string into an axis-aligned bounding box. */
export function getPolygonBbox(svgPoints: string): {
  minX: number; minY: number; maxX: number; maxY: number; w: number; h: number;
} {
  const coords = svgPoints
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
  if (coords.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  const xs = coords.map((c) => c.x);
  const ys = coords.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

// ─── Text width estimation ──────────────────────────────────────────────────

const NARROW = new Set('iIl1|!.:;,\'');
const WIDE = new Set('mMwWOQ@');
const SEMI_NARROW = new Set('fjtrl');

/**
 * Estimate rendered text width using proportional character-class widths.
 * Calibrated for Inter / system sans-serif.
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    if (NARROW.has(ch)) width += fontSize * 0.35;
    else if (WIDE.has(ch)) width += fontSize * 0.75;
    else if (SEMI_NARROW.has(ch)) width += fontSize * 0.4;
    else width += fontSize * 0.55;
  }
  return width;
}

// ─── Core solver ────────────────────────────────────────────────────────────

interface InternalLabel {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
  tier: 'zone' | 'store';
  displaced: boolean;
  displayText: string;
}

/**
 * De-collide a set of SVG labels so none overlap.
 *
 * Returns one LabelOutput per input, in the same order.
 */
export function decollidLabels(
  labels: LabelInput[],
  options: DecollisionOptions,
): LabelOutput[] {
  const {
    viewBoxWidth,
    viewBoxHeight,
    margin = 8,
    maxPasses = 40,
    pillHeights = { zone: 16, store: 12 },
    pillPadding = { zone: 8, store: 6 },
    maxWidthFraction = 0.25,
  } = options;

  if (labels.length === 0) return [];

  const maxLabelWidth = viewBoxWidth * maxWidthFraction;

  // ── Phase 1 & 2: Build internal rects with width estimation + placement ──

  const rects: InternalLabel[] = labels.map((lbl) => {
    const h = lbl.pillHeight ?? pillHeights[lbl.tier];
    const pad = pillPadding[lbl.tier];

    // Estimate width, truncate if needed
    let displayText = lbl.text;
    let tw = estimateTextWidth(displayText, lbl.fontSize);
    if (tw > maxLabelWidth && displayText.length > 4) {
      // Truncate with ellipsis
      while (tw > maxLabelWidth && displayText.length > 4) {
        displayText = displayText.slice(0, -2) + '…';
        tw = estimateTextWidth(displayText, lbl.fontSize);
      }
    }

    const pillW = tw + pad;

    // Initial placement
    let x: number;
    let y: number;
    let displaced = false;

    if (lbl.fitsInside) {
      // Center on anchor
      x = lbl.anchorX - pillW / 2;
      y = lbl.anchorY - h / 2;
    } else {
      displaced = true;
      x = lbl.anchorX - pillW / 2;
      // Prefer placing above the shape
      if (lbl.shapeBounds) {
        const above = lbl.shapeBounds.minY - h - 4;
        if (above >= margin) {
          y = above;
        } else {
          // Place below shape
          y = lbl.shapeBounds.minY + lbl.shapeBounds.h + 4;
        }
      } else {
        y = lbl.anchorY - h - 10;
      }
    }

    return { id: lbl.id, x, y, w: pillW, h, anchorX: lbl.anchorX, anchorY: lbl.anchorY, tier: lbl.tier, displaced, displayText };
  });

  // ── Phase 3: Two-axis iterative push-apart with priority weighting ───────

  for (let pass = 0; pass < maxPasses; pass++) {
    let moved = false;
    for (let a = 0; a < rects.length; a++) {
      for (let b = a + 1; b < rects.length; b++) {
        const la = rects[a];
        const lb = rects[b];

        // Gap of 2px between labels
        const gap = 2;
        const overlapX = la.x < lb.x + lb.w + gap && la.x + la.w + gap > lb.x;
        const overlapY = la.y < lb.y + lb.h + gap && la.y + la.h + gap > lb.y;

        if (overlapX && overlapY) {
          // Compute overlap amounts on each axis
          const oxAmount = Math.min(la.x + la.w + gap, lb.x + lb.w + gap) - Math.max(la.x, lb.x);
          const oyAmount = Math.min(la.y + la.h + gap, lb.y + lb.h + gap) - Math.max(la.y, lb.y);

          // Priority weighting: zone absorbs 20%, store absorbs 80%
          // If same tier, split 50/50
          let ratioA = 0.5;
          let ratioB = 0.5;
          if (la.tier !== lb.tier) {
            ratioA = la.tier === 'zone' ? 0.2 : 0.8;
            ratioB = lb.tier === 'zone' ? 0.2 : 0.8;
          }

          if (oxAmount < oyAmount) {
            // Push apart horizontally (shorter axis)
            const push = oxAmount / 2 + 1;
            if (la.anchorX <= lb.anchorX) {
              la.x -= push * ratioA * 2;
              lb.x += push * ratioB * 2;
            } else {
              la.x += push * ratioA * 2;
              lb.x -= push * ratioB * 2;
            }
          } else {
            // Push apart vertically
            const push = oyAmount / 2 + 1;
            if (la.anchorY <= lb.anchorY) {
              la.y -= push * ratioA * 2;
              lb.y += push * ratioB * 2;
            } else {
              la.y += push * ratioA * 2;
              lb.y -= push * ratioB * 2;
            }
          }

          la.displaced = true;
          lb.displaced = true;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // ── Phase 4: Viewport boundary clamping ──────────────────────────────────

  for (const r of rects) {
    r.x = Math.max(margin, Math.min(viewBoxWidth - r.w - margin, r.x));
    r.y = Math.max(margin, Math.min(viewBoxHeight - r.h - margin, r.y));
  }

  // Run a few more passes after clamping in case it introduced new overlaps
  for (let pass = 0; pass < 5; pass++) {
    let moved = false;
    for (let a = 0; a < rects.length; a++) {
      for (let b = a + 1; b < rects.length; b++) {
        const la = rects[a];
        const lb = rects[b];
        const gap = 2;
        const overlapX = la.x < lb.x + lb.w + gap && la.x + la.w + gap > lb.x;
        const overlapY = la.y < lb.y + lb.h + gap && la.y + la.h + gap > lb.y;
        if (overlapX && overlapY) {
          const oyAmount = Math.min(la.y + la.h + gap, lb.y + lb.h + gap) - Math.max(la.y, lb.y);
          const push = oyAmount / 2 + 1;
          if (la.anchorY <= lb.anchorY) { la.y -= push; lb.y += push; }
          else { la.y += push; lb.y -= push; }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // Final clamp
  for (const r of rects) {
    r.x = Math.max(margin, Math.min(viewBoxWidth - r.w - margin, r.x));
    r.y = Math.max(margin, Math.min(viewBoxHeight - r.h - margin, r.y));
  }

  // ── Phase 5: Leader line waypoints ───────────────────────────────────────

  // For displaced labels, check if their straight leader line crosses a zone-tier pill
  const zonePills = rects.filter((r) => r.tier === 'zone');

  const outputs: LabelOutput[] = rects.map((r) => {
    let leaderWaypoint: [number, number] | undefined;

    if (r.displaced) {
      const lx1 = r.x + r.w / 2;
      const ly1 = r.y + r.h / 2;
      const lx2 = r.anchorX;
      const ly2 = r.anchorY;

      // Simple line-rect intersection check for zone pills
      for (const zp of zonePills) {
        if (zp.id === r.id) continue;
        // Rough check: does the leader line's bounding box overlap the zone pill?
        const lineMinX = Math.min(lx1, lx2);
        const lineMaxX = Math.max(lx1, lx2);
        const lineMinY = Math.min(ly1, ly2);
        const lineMaxY = Math.max(ly1, ly2);

        if (lineMinX < zp.x + zp.w && lineMaxX > zp.x &&
            lineMinY < zp.y + zp.h && lineMaxY > zp.y) {
          // Route around: dogleg to the side of the zone pill
          const midY = (ly1 + ly2) / 2;
          const sideX = lx1 < zp.x + zp.w / 2 ? zp.x - 8 : zp.x + zp.w + 8;
          leaderWaypoint = [sideX, midY];
          break; // One dogleg is enough
        }
      }
    }

    return {
      id: r.id,
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      anchorX: r.anchorX,
      anchorY: r.anchorY,
      displaced: r.displaced,
      displayText: r.displayText,
      leaderWaypoint,
    };
  });

  return outputs;
}
