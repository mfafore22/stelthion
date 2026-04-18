import type { MarketPolicy } from './policy-types.js';

/**
 * Default threshold matrix on the composite axis, keyed by
 * `${type}:composite:${scope}`. A market's own policy overrides specific
 * entries; anything missing falls back through this table in the policy
 * engine.
 *
 * Rationale for the default gradient:
 * - CITY scope has the lowest publish bar on every type — a market
 *   subscribed to its own city should surface city-specific signals easily.
 * - REGION / COUNTRY / GLOBAL bars rise as the locality broadens — a
 *   GLOBAL-scope TREND must clear a higher bar to earn a daily slot in a
 *   market that also receives many local signals.
 * - EVENT / CAMPAIGN bars are modestly below TREND at each scope because
 *   scheduled happenings need less accumulated signal to be actionable.
 * - INCIDENT bars are the lowest at each scope: an incident with even
 *   moderate signal strength (weather, transit disruption) is immediately
 *   decision-relevant for a property manager and fades fast on its own.
 * - GLOBAL INCIDENT is intentionally omitted — a GLOBAL-scope incident is
 *   a rare shape (a pandemic-scale event); absent an explicit entry the
 *   engine falls back to INCIDENT:composite:COUNTRY.
 */
export const DEFAULT_POLICY: MarketPolicy = {
  version: 1,
  thresholds: {
    // TREND
    'TREND:composite:CITY': { publish: 0.5, review: 0.3, reject: 0.1 },
    'TREND:composite:REGION': { publish: 0.55, review: 0.35, reject: 0.15 },
    'TREND:composite:COUNTRY': { publish: 0.6, review: 0.4, reject: 0.2 },
    'TREND:composite:GLOBAL': { publish: 0.65, review: 0.45, reject: 0.25 },

    // EVENT
    'EVENT:composite:CITY': { publish: 0.45, review: 0.25, reject: 0.1 },
    'EVENT:composite:REGION': { publish: 0.5, review: 0.3, reject: 0.15 },
    'EVENT:composite:COUNTRY': { publish: 0.55, review: 0.35, reject: 0.2 },
    'EVENT:composite:GLOBAL': { publish: 0.6, review: 0.4, reject: 0.25 },

    // CAMPAIGN
    'CAMPAIGN:composite:CITY': { publish: 0.45, review: 0.25, reject: 0.12 },
    'CAMPAIGN:composite:REGION': { publish: 0.5, review: 0.3, reject: 0.15 },
    'CAMPAIGN:composite:COUNTRY': { publish: 0.5, review: 0.3, reject: 0.15 },
    'CAMPAIGN:composite:GLOBAL': { publish: 0.55, review: 0.35, reject: 0.2 },

    // INCIDENT — lowest bars; action-relevance dominates
    'INCIDENT:composite:CITY': { publish: 0.35, review: 0.2, reject: 0.1 },
    'INCIDENT:composite:REGION': { publish: 0.4, review: 0.25, reject: 0.12 },
    'INCIDENT:composite:COUNTRY': { publish: 0.45, review: 0.3, reject: 0.15 },
  },
  lifecycleModifiers: { UPCOMING: -0.1, ACTIVE: 0, CONCLUDED: 0.2 },
  feedbackSensitivity: {
    positivePerUnit: 0.02,
    negativePerUnit: 0.03,
    maxPositiveShift: 0.08,
    maxNegativeShift: 0.1,
    windowDays: 30,
  },
};
