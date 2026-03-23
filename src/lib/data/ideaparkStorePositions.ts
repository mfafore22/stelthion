/**
 * Ideapark Lempäälä — Ground Floor Store Positions
 *
 * Bounding boxes in SVG coordinate space (viewBox 0 0 1504 704),
 * which matches the floor plan image pixel dimensions 1:1.
 *
 * Label centres derived from blue-pixel cluster analysis of Ideapark 1.png.
 * Bounding boxes estimated from architectural outlines.
 *
 * zoneId values must match IdeaparkZone.id in ideaparkZones.ts.
 */

export interface StorePosition {
  /** Display name (Finnish / brand) */
  name: string;
  /** URL slug for CMS join — matches ideapark.fi store slug */
  slug: string;
  /** Zone this store belongs to */
  zoneId: string;
  /** SVG bounding box — 1504×704 coordinate space */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Entrance {
  id: string;
  /** Finnish label */
  labelFi: string;
  /** Arrow tip position (pointing into the building) */
  x: number;
  y: number;
  /** Cardinal direction the visitor enters from */
  from: 'S' | 'W' | 'E' | 'N';
}

// ─── Main entrances (south-facing, ground floor) ───────────────────────────
export const GROUND_FLOOR_ENTRANCES: Entrance[] = [
  { id: 'entrance-west',    labelFi: 'Länsisisäänkäynti',   x: 120,  y: 415, from: 'S' },
  { id: 'entrance-center1', labelFi: 'Keskussisäänkäynti 1', x: 360,  y: 440, from: 'S' },
  { id: 'entrance-center2', labelFi: 'Keskussisäänkäynti 2', x: 530,  y: 450, from: 'S' },
  { id: 'entrance-east',    labelFi: 'Itäsisäänkäynti',     x: 1050, y: 430, from: 'S' },
];

// ─── Ground floor stores ───────────────────────────────────────────────────
// Positions use label-centre coords from image analysis; boxes extend from there.
export const GROUND_FLOOR_STORES: StorePosition[] = [

  // ── Upper rectangular section ──────────────────────────────────────────

  // west-anchor
  { name: 'Citymarket',           slug: 'citymarket',            zoneId: 'west-anchor',    x: 52,   y: 110, w: 163, h: 245 },

  // west-gallery
  { name: 'Prisma Ideapark',      slug: 'prisma-ideapark',       zoneId: 'west-gallery',   x: 215,  y: 110, w: 217, h: 145 },
  { name: 'Budget Sport',         slug: 'budget-sport',          zoneId: 'west-gallery',   x: 215,  y: 255, w: 217, h: 100 },

  // center-gallery
  { name: 'Bläk Boks',            slug: 'blak-boks',             zoneId: 'center-gallery', x: 432,  y: 90,  w: 190, h: 265 },
  { name: 'Halonen',              slug: 'halonen',               zoneId: 'center-gallery', x: 622,  y: 110, w: 130, h: 245 },

  // east-gallery
  { name: 'Clas Ohlson',          slug: 'clas-ohlson',           zoneId: 'east-gallery',   x: 700,  y: 90,  w: 120, h: 75  },
  { name: 'FIDA Second Hand',     slug: 'fida-second-hand',      zoneId: 'east-gallery',   x: 820,  y: 165, w: 140, h: 95  },
  { name: 'JYSK',                 slug: 'jysk',                  zoneId: 'east-gallery',   x: 752,  y: 260, w: 206, h: 95  },
  { name: 'Kekäle',               slug: 'kekale',                zoneId: 'east-gallery',   x: 958,  y: 90,  w: 50,  h: 80  },

  // east-anchor — traced walls: x=974–1078, y=114–371
  { name: 'Minimani',             slug: 'minimani',              zoneId: 'east-anchor',    x: 974,  y: 114, w: 104, h: 257 },

  // autoareena (upper-section block — not the detached building)
  // Pin centred at (1230,250) — inside traced polygon
  { name: 'Ideapark Autoareena',  slug: 'autoareena',            zoneId: 'autoareena',     x: 1150, y: 230, w: 160, h: 40  },

  // ── Right-side corridor (east strip) ───────────────────────────────────
  { name: 'Tommy Hilfiger',       slug: 'tommy-hilfiger',        zoneId: 'east-strip',     x: 1000, y: 280, w: 105, h: 70  },
  { name: 'Intersport Ideapark',  slug: 'intersport-ideapark',   zoneId: 'east-strip',     x: 820,  y: 358, w: 140, h: 58  }, // starts below JYSK (ends y:355)
  { name: 'Guess',                slug: 'guess',                 zoneId: 'east-strip',     x: 1105, y: 280, w: 95,  h: 95  },

  // ── Center corridor / kiosks (Tapahtumatori) ───────────────────────────
  { name: 'Juve Sport',           slug: 'juve-sport',            zoneId: 'center-hub',     x: 406,  y: 328, w: 42,  h: 42  },
  { name: 'Marc O\'Polo',          slug: 'marc-o-polo',           zoneId: 'center-hub',     x: 542,  y: 340, w: 52,  h: 38  },
  { name: 'Suomen Kultajousi',    slug: 'suomen-kultajousi',     zoneId: 'center-hub',     x: 700,  y: 372, w: 68,  h: 30  },
  { name: 'CHANGE Lingerie',      slug: 'change-lingerie',       zoneId: 'center-hub',     x: 900,  y: 408, w: 72,  h: 40  },

  // ── Ravintolamaailma — restaurant corridor ──────────────────────────────
  { name: 'Cafe Deliss',          slug: 'cafe-deliss',           zoneId: 'food-court',     x: 594,  y: 340, w: 52,  h: 38  },
  { name: 'Seoul Good',           slug: 'seoul-good',            zoneId: 'food-court',     x: 648,  y: 340, w: 52,  h: 38  },
  { name: 'Ståhlberg Home Bakery', slug: 'stahlberg-home-bakery', zoneId: 'food-court',    x: 320,  y: 390, w: 80,  h: 42  },
  { name: 'Flying Tiger',          slug: 'flying-tiger',          zoneId: 'food-court',    x: 310,  y: 355, w: 55,  h: 38  },
  { name: 'Subway',                slug: 'subway',                zoneId: 'food-court',    x: 428,  y: 390, w: 40,  h: 38  },
  { name: '& Burgers',             slug: 'burgers',               zoneId: 'food-court',    x: 468,  y: 390, w: 48,  h: 38  },
  { name: 'VileThai',              slug: 'vilethai',              zoneId: 'food-court',    x: 542,  y: 400, w: 52,  h: 40  },
  { name: 'Kotipizza',             slug: 'kotipizza',             zoneId: 'food-court',    x: 594,  y: 400, w: 52,  h: 45  },
  { name: 'HESBURGER',             slug: 'hesburger',             zoneId: 'food-court',    x: 648,  y: 400, w: 60,  h: 58  }, // stops before KAPPAHL (x:710)
  { name: 'Burger King',           slug: 'burger-king',           zoneId: 'food-court',    x: 648,  y: 460, w: 60,  h: 58  }, // stops before KAPPAHL (x:710)
  { name: 'RAX PizzaBuffet',       slug: 'rax-pizzabuffet',       zoneId: 'food-court',    x: 712,  y: 440, w: 65,  h: 55  },

  // ── South arc — west side ───────────────────────────────────────────────
  { name: 'Kauppahuone Riveri',   slug: 'kauppahuone-riveri',    zoneId: 'west-arc',       x: 52,   y: 455, w: 125, h: 110 },
  { name: 'New Yorker',           slug: 'new-yorker',            zoneId: 'west-arc',       x: 177,  y: 455, w: 118, h: 100 },
  { name: 'Only',                 slug: 'only',                  zoneId: 'west-arc',       x: 180,  y: 358, w: 42,  h: 45  },
  { name: 'Sinsay',               slug: 'sinsay',                zoneId: 'west-arc',       x: 296,  y: 500, w: 90,  h: 110 },
  { name: 'Apteekki',             slug: 'apteekki',              zoneId: 'west-arc',       x: 386,  y: 455, w: 68,  h: 75  },
  { name: 'Finlayson',            slug: 'finlayson',             zoneId: 'west-arc',       x: 454,  y: 455, w: 68,  h: 65  },
  { name: 'Stadium',              slug: 'stadium',               zoneId: 'west-arc',       x: 366,  y: 505, w: 130, h: 100 },
  { name: 'Luhta Brand Store',    slug: 'luhta-brand-store',     zoneId: 'west-arc',       x: 470,  y: 540, w: 100, h: 70  },
  { name: 'H&M',                  slug: 'hm',                    zoneId: 'west-arc',       x: 572,  y: 555, w: 90,  h: 80  }, // stops before Dressmann (x:665)

  // ── South arc — east side ───────────────────────────────────────────────
  { name: 'Dressmann',            slug: 'dressmann',             zoneId: 'east-arc',       x: 665,  y: 555, w: 90,  h: 75  },
  { name: 'Lindex',               slug: 'lindex',                zoneId: 'east-arc',       x: 710,  y: 488, w: 88,  h: 40  }, // x aligned with KAPPAHL, starts just below it
  { name: 'KAPPAHL',              slug: 'kappahl',               zoneId: 'east-arc',       x: 710,  y: 395, w: 118, h: 90  }, // h trimmed so Lindex fits below
  { name: 'Pentik',               slug: 'pentik',                zoneId: 'east-arc',       x: 830,  y: 395, w: 80,  h: 80  },
  { name: 'My Bag',               slug: 'my-bag',                zoneId: 'east-arc',       x: 910,  y: 395, w: 42,  h: 50  },
  { name: 'Gant',                 slug: 'gant',                  zoneId: 'east-arc',       x: 910,  y: 495, w: 55,  h: 45  },
  { name: 'Cropp',                slug: 'cropp',                 zoneId: 'east-arc',       x: 970,  y: 490, w: 42,  h: 45  },
  { name: 'Bik Bok',              slug: 'bik-bok',               zoneId: 'east-arc',       x: 790,  y: 560, w: 42,  h: 30  },
  // Marimekko Outlet — narrow slot: left x=1058 (partition), right x=1079 (outer wall),
  // top y=432 (horizontal wall), bottom y=489 (outer wall end before arc curves away).
  { name: 'Marimekko Outlet',     slug: 'marimekko-outlet',      zoneId: 'east-arc',       x: 1058, y: 432, w: 21,  h: 57  },
  { name: 'Unikulma',             slug: 'unikulma',              zoneId: 'east-arc',       x: 1020, y: 512, w: 172, h: 50  }, // starts below Marimekko (ends y:510), spans full width
  { name: 'iittala outlet',       slug: 'iittala-outlet',        zoneId: 'east-arc',       x: 960,  y: 530, w: 58,  h: 55  }, // stops before Unikulma (x:1020)
];
