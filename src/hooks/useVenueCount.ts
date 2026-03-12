'use client';

/**
 * useVenueCount — live people-count hook for VenueSafe
 *
 * Polls GET /api/venue/[venueId]/count every 5 seconds.
 * Maintains a 30-minute rolling history (360 data points).
 * Generates VenueAlert objects when thresholds are crossed.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { VenueAlert, VenueZone } from '@/lib/venue/types';
import { getCapacityStatus } from '@/lib/venue/types';

const POLL_INTERVAL_MS = 5_000;
const HISTORY_MAX = 360; // 30 min × 60 s / 5 s

export interface StreamSummary {
  camera_id: string;
  source: string;
  camera_type: string;
  display_mode: string;
  latest_count: number | null;
  last_snapshot: string | null;
}

export interface CountPoint {
  /** Unix timestamp (ms) */
  t: number;
  count: number;
}

export interface VenueCountState {
  /** Latest per-camera data from VenueSec */
  streams: StreamSummary[];
  /** Sum of people_visible across all streams */
  totalVisible: number;
  /** Per-zone totals: zoneId → count */
  zoneCounts: Record<string, number>;
  /** Rolling 30-min history */
  history: CountPoint[];
  /** Whether the last poll succeeded */
  isConnected: boolean;
  /** ISO timestamp of last successful update */
  lastUpdated: string | null;
  /** Active alerts */
  alerts: VenueAlert[];
}

interface UseVenueCountOptions {
  zones: VenueZone[];
  safetyCapacity: number;
  /** Override poll interval (ms) — for testing */
  pollIntervalMs?: number;
}

export function useVenueCount(
  venueId: string,
  { zones, safetyCapacity, pollIntervalMs = POLL_INTERVAL_MS }: UseVenueCountOptions
): VenueCountState {
  const [state, setState] = useState<VenueCountState>({
    streams: [],
    totalVisible: 0,
    zoneCounts: {},
    history: [],
    isConnected: false,
    lastUpdated: null,
    alerts: [],
  });

  // Track previous alert conditions to avoid duplicates
  const prevAlertConditions = useRef<Set<string>>(new Set());

  const buildZoneCounts = useCallback(
    (streams: StreamSummary[]): Record<string, number> => {
      const counts: Record<string, number> = {};
      for (const zone of zones) {
        counts[zone.zoneId] = zone.cameraIds.reduce((sum, camId) => {
          const s = streams.find((st) => st.camera_id === camId);
          return sum + (s?.latest_count ?? 0);
        }, 0);
      }
      return counts;
    },
    [zones]
  );

  const buildAlerts = useCallback(
    (
      totalVisible: number,
      zoneCounts: Record<string, number>,
      streams: StreamSummary[]
    ): VenueAlert[] => {
      const alerts: VenueAlert[] = [];
      const now = new Date().toISOString();

      // Venue-level alert
      const venueStatus = getCapacityStatus(totalVisible, safetyCapacity);
      const venueConditionKey = `venue:${venueStatus}`;
      if (venueStatus !== 'safe' && !prevAlertConditions.current.has(venueConditionKey)) {
        alerts.push({
          id: `venue-${Date.now()}`,
          type: 'venue_near_limit',
          severity: venueStatus === 'over_limit' ? 'critical' : 'warning',
          message:
            venueStatus === 'over_limit'
              ? `Venue OVER safety limit: ${totalVisible.toLocaleString()} / ${safetyCapacity.toLocaleString()}`
              : `Venue near safety limit: ${totalVisible.toLocaleString()} / ${safetyCapacity.toLocaleString()} (${Math.round((totalVisible / safetyCapacity) * 100)}%)`,
          timestamp: now,
        });
      }

      // Per-zone alerts
      for (const zone of zones) {
        const count = zoneCounts[zone.zoneId] ?? 0;
        const pct = count / zone.capacity;
        const zoneConditionKey = `zone:${zone.zoneId}:${pct >= zone.criticalThreshold ? 'critical' : pct >= zone.warningThreshold ? 'warning' : 'safe'}`;

        if (pct >= zone.warningThreshold && !prevAlertConditions.current.has(zoneConditionKey)) {
          alerts.push({
            id: `zone-${zone.zoneId}-${Date.now()}`,
            type: 'zone_overcrowding',
            severity: pct >= zone.criticalThreshold ? 'critical' : 'warning',
            message:
              pct >= zone.criticalThreshold
                ? `${zone.name} CRITICAL: ${count} / ${zone.capacity} (${Math.round(pct * 100)}%)`
                : `${zone.name} near capacity: ${count} / ${zone.capacity} (${Math.round(pct * 100)}%)`,
            timestamp: now,
            zoneId: zone.zoneId,
          });
        }
      }

      // Camera offline alerts (streams with null latest_count that were previously active)
      for (const stream of streams) {
        if (stream.latest_count === null) {
          const offlineKey = `camera:${stream.camera_id}:offline`;
          if (!prevAlertConditions.current.has(offlineKey)) {
            alerts.push({
              id: `cam-offline-${stream.camera_id}-${Date.now()}`,
              type: 'camera_offline',
              severity: 'warning',
              message: `Camera offline: ${stream.camera_id}`,
              timestamp: now,
              cameraId: stream.camera_id,
            });
          }
        }
      }

      // Update tracked conditions
      const newConditions = new Set<string>();
      const venueKey = `venue:${venueStatus}`;
      if (venueStatus !== 'safe') newConditions.add(venueKey);
      for (const zone of zones) {
        const count = zoneCounts[zone.zoneId] ?? 0;
        const pct = count / zone.capacity;
        if (pct >= zone.criticalThreshold) newConditions.add(`zone:${zone.zoneId}:critical`);
        else if (pct >= zone.warningThreshold) newConditions.add(`zone:${zone.zoneId}:warning`);
      }
      for (const s of streams) {
        if (s.latest_count === null) newConditions.add(`camera:${s.camera_id}:offline`);
      }
      prevAlertConditions.current = newConditions;

      return alerts;
    },
    [zones, safetyCapacity]
  );

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/venue/${venueId}/count`, { cache: 'no-store' });
      if (!res.ok) {
        setState((prev) => ({ ...prev, isConnected: false }));
        return;
      }

      const data: { totalVisible: number; streams: StreamSummary[]; timestamp: string } =
        await res.json();

      const zoneCounts = buildZoneCounts(data.streams);
      const newAlerts = buildAlerts(data.totalVisible, zoneCounts, data.streams);
      const point: CountPoint = { t: Date.now(), count: data.totalVisible };

      setState((prev) => {
        const newHistory = [...prev.history, point].slice(-HISTORY_MAX);
        return {
          streams: data.streams,
          totalVisible: data.totalVisible,
          zoneCounts,
          history: newHistory,
          isConnected: true,
          lastUpdated: data.timestamp,
          alerts: newAlerts.length > 0
            ? [
                ...newAlerts,
                // Keep last 20 historical alerts
                ...prev.alerts.slice(0, 20 - newAlerts.length),
              ]
            : prev.alerts,
        };
      });
    } catch {
      setState((prev) => ({ ...prev, isConnected: false }));
    }
  }, [venueId, buildZoneCounts, buildAlerts]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, pollIntervalMs);
    return () => clearInterval(id);
  }, [poll, pollIntervalMs]);

  return state;
}
