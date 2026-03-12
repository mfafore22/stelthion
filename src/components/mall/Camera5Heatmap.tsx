/**
 * Camera 5 Heatmap Component
 * Real-time visualization of escalator landing zone from surveillance footage
 *
 * Data source: ml/retail-context/imports/camera-footage-training/processed/people_counts/camera5_timeseries.json
 * Coverage: West escalator landing (25 sqm) + stairs approach (15 sqm)
 * Sample: Wednesday Nov 12, 2025, 1:00-1:03 PM
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMallIdentity } from '@/hooks/mall/useMallIdentity';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface Camera5HeatmapProps {
  mallId: string;
  area?: string;
  height?: number;
}

interface ZoneData {
  zone_id: string;
  zone_name: string;
  count: number;
  density_per_sqm: number;
}

interface TimeBucket {
  timestamp: string;
  frame_number: number;
  zones: ZoneData[];
}

interface HeatmapData {
  mall_id: string;
  area: string;
  start_time: string;
  end_time: string;
  interval_seconds: number;
  time_buckets: TimeBucket[];
  zone_definitions: Array<{
    zone_id: string;
    zone_name: string;
    area_sqm: number;
    zone_type: string;
  }>;
}

export function Camera5Heatmap({
  mallId,
  area = 'station_plaza',
  height = 600
}: Camera5HeatmapProps) {
  const identity = useMallIdentity(mallId);

  // Camera heatmap requires live sensor integration — not yet available
  if (mallId !== 'ideapark') {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="mb-3 text-4xl">📹</div>
            <p className="text-sm font-medium">Camera Heatmap Not Available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Live camera analytics are not yet activated for this property.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const [data, setData] = useState<HeatmapData | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch heatmap data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/mall/${mallId}/heatmap?area=${area}&interval=1`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data: ${response.statusText}`);
        }

        const heatmapData = await response.json();
        setData(heatmapData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mallId, area]);

  // Playback control
  useEffect(() => {
    if (isPlaying && data) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= data.time_buckets.length - 1) {
            setIsPlaying(false);
            return 0; // Loop back to start
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed); // Adjust speed
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, data]);

  /**
   * Get heatmap color based on density
   * Universal scale: Blue (cold) → Green → Yellow → Orange → Red (hot)
   */
  const getDensityColor = (densityPerSqm: number): string => {
    // Density scale for people/m²:
    // 0.0 - 0.1: Very sparse (blue)
    // 0.1 - 0.2: Sparse (cyan)
    // 0.2 - 0.3: Moderate (green)
    // 0.3 - 0.5: Busy (yellow)
    // 0.5 - 0.8: Very busy (orange)
    // 0.8+: Crowded (red)

    if (densityPerSqm >= 0.8) return 'bg-red-500/80 border-red-600';
    if (densityPerSqm >= 0.5) return 'bg-orange-500/80 border-orange-600';
    if (densityPerSqm >= 0.3) return 'bg-yellow-500/80 border-yellow-600';
    if (densityPerSqm >= 0.2) return 'bg-green-500/80 border-green-600';
    if (densityPerSqm >= 0.1) return 'bg-cyan-500/80 border-cyan-600';
    return 'bg-blue-500/80 border-blue-600';
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading heatmap data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="mb-3 text-4xl">⚠️</div>
            <p className="text-sm font-medium text-red-600">Error loading heatmap</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.time_buckets.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="mb-3 text-4xl">📊</div>
            <p className="text-sm font-medium">No heatmap data available</p>
            <p className="text-xs text-muted-foreground mt-1">Process Camera 5 footage to see heatmap</p>
          </div>
        </div>
      </Card>
    );
  }

  const currentBucket = data.time_buckets[currentFrame];
  const totalFrames = data.time_buckets.length;
  const totalDuration = totalFrames; // Assuming 1 frame per second

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: identity.colors.primary }}>
          Live Heatmap - Escalator Landing
        </h2>
        <p className="text-sm text-muted-foreground">
          {identity.name} · 4th Floor Station Plaza · Camera 5
        </p>
      </div>

      {/* Playback Controls */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Timeline slider */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                {formatTimestamp(currentBucket.timestamp)}
              </span>
              <span className="text-muted-foreground">
                {formatDuration(currentFrame)} / {formatDuration(totalDuration)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={totalFrames - 1}
              value={currentFrame}
              onChange={(e) => {
                setCurrentFrame(parseInt(e.target.value));
                setIsPlaying(false); // Pause when manually scrubbing
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentFrame(0)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  backgroundColor: isPlaying ? undefined : identity.colors.primary,
                  color: isPlaying ? undefined : 'white'
                }}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentFrame(totalFrames - 1)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Speed:</span>
              {[0.5, 1, 2, 5].map(speed => (
                <Button
                  key={speed}
                  size="sm"
                  variant={playbackSpeed === speed ? 'default' : 'outline'}
                  onClick={() => setPlaybackSpeed(speed)}
                  className="w-12"
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Heatmap Visualization */}
      <Card className="p-6">
        <div className="relative rounded-lg bg-gray-100 dark:bg-gray-900" style={{ height }}>
          {/* Legend */}
          <div className="absolute right-4 top-4 space-y-2 rounded-md bg-white dark:bg-gray-800 p-3 shadow-md z-10">
            <div className="text-xs font-semibold mb-2">Density (people/m²)</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded border border-red-600 bg-red-500/80" />
                <span>0.8+ (Crowded)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded border border-orange-600 bg-orange-500/80" />
                <span>0.5-0.8 (Very busy)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded border border-yellow-600 bg-yellow-500/80" />
                <span>0.3-0.5 (Busy)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded border border-green-600 bg-green-500/80" />
                <span>0.2-0.3 (Moderate)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded border border-cyan-600 bg-cyan-500/80" />
                <span>0.1-0.2 (Sparse)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded border border-blue-600 bg-blue-500/80" />
                <span>&lt;0.1 (Very sparse)</span>
              </div>
            </div>
          </div>

          {/* Zone visualization */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full h-full max-w-4xl">
              {/* Escalator Landing Zone (larger, left) */}
              {currentBucket.zones.find(z => z.zone_id === 'escalator_landing_west') && (
                <div
                  className={cn(
                    'absolute cursor-pointer rounded-lg border-4 transition-all duration-300',
                    getDensityColor(
                      currentBucket.zones.find(z => z.zone_id === 'escalator_landing_west')!.density_per_sqm
                    ),
                    hoveredZone === 'escalator_landing_west' && 'scale-105 shadow-xl ring-4 ring-white/50'
                  )}
                  style={{
                    left: '10%',
                    top: '25%',
                    width: '50%',
                    height: '50%',
                  }}
                  onMouseEnter={() => setHoveredZone('escalator_landing_west')}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <div className="text-sm font-semibold text-white drop-shadow-lg">
                      Escalator Landing
                    </div>
                    <div className="mt-2 text-4xl font-bold text-white drop-shadow-lg">
                      {currentBucket.zones.find(z => z.zone_id === 'escalator_landing_west')!.count}
                    </div>
                    <div className="mt-1 text-xs text-white drop-shadow-lg">
                      {currentBucket.zones.find(z => z.zone_id === 'escalator_landing_west')!.density_per_sqm.toFixed(2)} p/m²
                    </div>
                  </div>
                </div>
              )}

              {/* Stairs Approach Zone (smaller, right) */}
              {currentBucket.zones.find(z => z.zone_id === 'stairs_approach_west') && (
                <div
                  className={cn(
                    'absolute cursor-pointer rounded-lg border-4 transition-all duration-300',
                    getDensityColor(
                      currentBucket.zones.find(z => z.zone_id === 'stairs_approach_west')!.density_per_sqm
                    ),
                    hoveredZone === 'stairs_approach_west' && 'scale-105 shadow-xl ring-4 ring-white/50'
                  )}
                  style={{
                    left: '65%',
                    top: '25%',
                    width: '30%',
                    height: '50%',
                  }}
                  onMouseEnter={() => setHoveredZone('stairs_approach_west')}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <div className="text-sm font-semibold text-white drop-shadow-lg">
                      Stairs Approach
                    </div>
                    <div className="mt-2 text-4xl font-bold text-white drop-shadow-lg">
                      {currentBucket.zones.find(z => z.zone_id === 'stairs_approach_west')!.count}
                    </div>
                    <div className="mt-1 text-xs text-white drop-shadow-lg">
                      {currentBucket.zones.find(z => z.zone_id === 'stairs_approach_west')!.density_per_sqm.toFixed(2)} p/m²
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hover tooltip */}
          {hoveredZone && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-white dark:bg-gray-800 p-4 shadow-xl z-20">
              {(() => {
                const zone = currentBucket.zones.find(z => z.zone_id === hoveredZone);
                const zoneDef = data.zone_definitions.find(z => z.zone_id === hoveredZone);
                if (!zone || !zoneDef) return null;

                return (
                  <div className="space-y-2 text-sm min-w-[200px]">
                    <div className="font-semibold text-base">{zone.zone_name}</div>
                    <div className="flex justify-between gap-6">
                      <span className="text-muted-foreground">People count:</span>
                      <span className="font-medium">{zone.count}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-muted-foreground">Density:</span>
                      <span className="font-medium">{zone.density_per_sqm.toFixed(2)} people/m²</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-muted-foreground">Area:</span>
                      <span className="font-medium">{zoneDef.area_sqm} m²</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{zoneDef.zone_type}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total People (Frame)</div>
          <div className="text-2xl font-bold" style={{ color: identity.colors.primary }}>
            {currentBucket.zones.reduce((sum, z) => sum + z.count, 0)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Avg Density</div>
          <div className="text-2xl font-bold" style={{ color: identity.colors.primary }}>
            {(currentBucket.zones.reduce((sum, z) => sum + z.density_per_sqm, 0) / currentBucket.zones.length).toFixed(2)}
            <span className="text-sm ml-1">p/m²</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Frame</div>
          <div className="text-2xl font-bold" style={{ color: identity.colors.primary }}>
            {currentFrame + 1}
            <span className="text-sm ml-1">/ {totalFrames}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
