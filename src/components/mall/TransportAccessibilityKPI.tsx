/**
 * Transport Accessibility KPI Component
 * Displays public transport connections and accessibility metrics
 */

'use client';

import React from 'react';
import { MallCard } from './ui/MallCard';
import { Train, Bus, TramFront, Gauge, Clock, AlertCircle } from 'lucide-react';
import type { HSLAccessibility, NysseAccessibility, VRConnections, LiveDepartures } from '@/lib/types/transport';

interface TransportAccessibilityKPIProps {
  hslData?: HSLAccessibility;
  nysseData?: NysseAccessibility;
  vrData?: VRConnections;
  liveDepartures?: LiveDepartures;
}

export function TransportAccessibilityKPI({ hslData, nysseData, vrData, liveDepartures }: TransportAccessibilityKPIProps) {
  // Use either HSL (Helsinki) or Nysse (Tampere) data
  const transportData = hslData || nysseData;
  if (!transportData) {
    return null;
  }
  // Color based on accessibility score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-bo-success-dark';
    if (score >= 60) return 'text-bo-warning-dark';
    return 'text-bo-error-dark';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-bo-success-light/70 border-bo-success/15';
    if (score >= 60) return 'bg-bo-warning-light/70 border-bo-warning/15';
    return 'bg-bo-error-light/70 border-bo-error/15';
  };

  return (
    <MallCard variant="glass">
      <div className="space-y-6">
        {/* Header with Accessibility Score */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 mb-1 tracking-tight">
              Transport Accessibility
            </h3>
            <p className="text-sm text-bo-neutral-600">
              Public transit connections and mobility
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${getScoreBg(transportData.accessibilityScore)}`}>
            <div className="flex items-center gap-2">
              <Gauge className={`h-5 w-5 ${getScoreColor(transportData.accessibilityScore)}`} />
              <div>
                <div className={`text-2xl font-bold ${getScoreColor(transportData.accessibilityScore)}`}>
                  {transportData.accessibilityScore}
                </div>
                <div className="text-xs text-bo-neutral-600">Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Public Transit Share */}
        <div className="rounded-lg bg-bo-info-light/50 p-4 border border-bo-info/15">
          <div className="text-sm text-bo-neutral-600 mb-1">Visitors Arriving by Public Transit</div>
          <div className="text-3xl font-bold text-bo-info-dark">
            {transportData.publicTransitShare}%
          </div>
          <div className="mt-2 h-2 bg-bo-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-bo-info-dark rounded-full transition-all duration-300"
              style={{ width: `${transportData.publicTransitShare}%` }}
            />
          </div>
        </div>

        {/* Commuter Trains - MAJOR FEATURE (only for HSL/train stations) */}
        {transportData.commuterTrains && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-bo-neutral-950">
              <Train className="h-5 w-5 text-bo-primary-600" />
              <h4 className="font-semibold">Commuter Rail Hub</h4>
            </div>
            <div className="bo-transport-info rounded-lg p-4">
              <div className="text-sm text-bo-neutral-700 mb-2">
                <strong>{transportData.commuterTrains.station}</strong>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {transportData.commuterTrains.lines.map((line) => (
                <span
                  key={line}
                  className="bo-transport-code inline-flex items-center justify-center w-7 h-7 rounded shadow-sm"
                >
                  {line}
                </span>
                ))}
              </div>
              <div className="text-xs text-bo-neutral-600">
                <strong>{transportData.commuterTrains.frequency}</strong> trains/hour peak · Connections to{' '}
                {transportData.commuterTrains.connections.slice(0, 3).join(', ')}
                {transportData.commuterTrains.connections.length > 3 && ', ...'}
              </div>
            </div>
          </div>
        )}

        {/* Live Departures - Trains */}
        {liveDepartures && liveDepartures.trains.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-bo-neutral-950">
                <Clock className="h-5 w-5 text-bo-primary-600" />
                <h4 className="font-semibold">Local Commuter Trains</h4>
              </div>
              <div className="text-xs text-bo-neutral-500">
                Updated {new Date(liveDepartures.lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {liveDepartures.trains.slice(0, 12).map((departure, index) => {
                const isHighlighted = index < 3;
                return (
                  <div
                    key={`${departure.line}-${departure.scheduledTime}-${index}`}
                    className={`bo-interactive-box rounded-lg p-2.5 border cursor-pointer ${
                      isHighlighted
                        ? 'bg-bo-primary-100/70 border-bo-primary-400 shadow-sm'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="bo-transport-code inline-flex items-center justify-center w-6 h-6 rounded text-xs flex-shrink-0">
                          {departure.line}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-bo-neutral-950 truncate">
                            {departure.destination}
                          </div>
                          {departure.platform && (
                            <div className="text-xs text-bo-neutral-600">
                              Track {departure.platform}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {departure.delayMinutes && departure.delayMinutes > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-bo-error-dark" />
                            <div className="text-right">
                              <div className="text-xs line-through text-bo-neutral-500">
                                {departure.scheduledTime}
                              </div>
                              <div className="text-sm font-bold text-bo-error-dark">
                                {departure.realTime}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-bo-neutral-950">
                            {departure.scheduledTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Departures - Public Transportation (Buses + Trams) */}
        {liveDepartures && (liveDepartures.buses.length > 0 || (liveDepartures.trams && liveDepartures.trams.length > 0)) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-bo-neutral-950">
              <Bus className="h-5 w-5 text-bo-accent-600" />
              <h4 className="font-semibold">Public Transportation (next 15 min)</h4>
            </div>
            <div className="space-y-1.5">
              {/* Combine and sort buses and trams by scheduled time */}
              {[
                ...liveDepartures.buses.map(d => ({ ...d, mode: 'bus' as const })),
                ...(liveDepartures.trams || []).map(d => ({ ...d, mode: 'tram' as const }))
              ]
                .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                .slice(0, 12)
                .map((departure, index) => {
                const isHighlighted = index < 3;
                const isTram = departure.mode === 'tram';
                return (
                  <div
                    key={`${departure.mode}-${departure.line}-${departure.scheduledTime}-${index}`}
                    className={`bo-interactive-box rounded-lg p-2.5 border cursor-pointer ${
                      isHighlighted
                        ? 'bg-bo-accent-100/50 border-bo-accent-300'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {isTram && <TramFront className="h-3.5 w-3.5 text-bo-success-dark flex-shrink-0" />}
                          <span className="bo-transport-code inline-flex items-center justify-center min-w-[2.5rem] px-2 h-6 rounded text-xs">
                            {departure.line}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-bo-neutral-950 truncate">
                          {departure.destination}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {departure.delayMinutes && departure.delayMinutes > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-bo-warning-dark" />
                            <div className="text-sm font-bold text-bo-warning-dark">
                              {departure.realTime}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-bo-neutral-950">
                            {departure.scheduledTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-bo-neutral-600">
              {transportData.buses.stopsWithin500m} stops within 500m
              {liveDepartures.trams && liveDepartures.trams.length > 0 && ` · ${liveDepartures.trams.length} tram departures`}
            </div>
          </div>
        )}

        {/* Tram Routes (if available) */}
        {transportData.trams && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-bo-neutral-950">
              <TramFront className="h-5 w-5 text-bo-success-dark" />
              <h4 className="font-semibold">Tram Lines</h4>
            </div>
            <div className="rounded-lg bg-bo-glass-subtle p-3 border border-bo-neutral-200/30">
              <div className="flex flex-wrap gap-1 mb-2">
                {transportData.trams.routes.map((route) => (
                  <span
                    key={route}
                    className="inline-flex items-center justify-center px-2 py-1 rounded bg-bo-success-dark text-white text-xs font-bold"
                  >
                    {route}
                  </span>
                ))}
              </div>
              <div className="text-xs text-bo-neutral-600">
                {transportData.trams.nearestStop} · {transportData.trams.walkingMinutes} min walk
              </div>
            </div>
          </div>
        )}

        {/* VR Long Distance Trains - Live Departures */}
        {liveDepartures && liveDepartures.vrTrains && liveDepartures.vrTrains.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-bo-neutral-950">
                <Train className="h-5 w-5 text-bo-info-dark" />
                <h4 className="font-semibold">VR Long Distance Trains</h4>
              </div>
              <div className="text-xs text-bo-neutral-500">
                Updated {new Date(liveDepartures.lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {liveDepartures.vrTrains.slice(0, 8).map((departure, index) => {
                const isHighlighted = index < 3;
                return (
                  <div
                    key={`${departure.line}-${departure.scheduledTime}-${index}`}
                    className={`bo-interactive-box rounded-lg p-2.5 border cursor-pointer ${
                      isHighlighted
                        ? 'bg-bo-info-100/70 border-bo-info-400 shadow-sm'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="bo-transport-code inline-flex items-center justify-center min-w-[2.5rem] px-2 h-6 rounded text-xs flex-shrink-0">
                          {departure.line}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-bo-neutral-950 truncate">
                            {departure.destination}
                          </div>
                          {departure.platform && (
                            <div className="text-xs text-bo-neutral-600">
                              Track {departure.platform}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {departure.delayMinutes && departure.delayMinutes > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-bo-error-dark" />
                            <div className="text-right">
                              <div className="text-xs line-through text-bo-neutral-500">
                                {departure.scheduledTime}
                              </div>
                              <div className="text-sm font-bold text-bo-error-dark">
                                {departure.realTime}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-bo-neutral-950">
                            {departure.scheduledTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {vrData && (
              <div className="text-xs text-bo-neutral-600">
                ~{vrData.estimatedDailyTourists} daily visitors from intercity travel
              </div>
            )}
          </div>
        )}

        {/* VR Static Connections (fallback if no live data) */}
        {vrData && (!liveDepartures?.vrTrains || liveDepartures.vrTrains.length === 0) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-bo-neutral-950">
              <Train className="h-5 w-5 text-bo-info-dark" />
              <h4 className="font-semibold">VR Long Distance Trains</h4>
            </div>
            <div className="bo-transport-info rounded-lg p-3">
              <div className="text-sm text-bo-neutral-700 mb-2">
                <strong>{vrData.nearestStation}</strong> station
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {vrData.connections.slice(0, 4).map((conn) => (
                  <div key={conn.destination} className="text-bo-neutral-700">
                    <strong>{conn.destination}</strong> · {Math.round(conn.travelTimeMinutes / 60)}h
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-bo-neutral-600">
                ~{vrData.estimatedDailyTourists} daily visitors from intercity travel
              </div>
            </div>
          </div>
        )}
      </div>
    </MallCard>
  );
}
