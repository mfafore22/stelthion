import React, { useMemo } from 'react';

/**
 * Heatmap data structure matching the expected format from security camera analysis
 */
interface HeatmapZone {
  zone_id: string;
  zone_name?: string;
  density_per_sqm: number;
  count?: number;
}

interface HeatmapData {
  zones: HeatmapZone[];
  timestamp?: string;
}

interface MallCardHeatmapProps {
  mallId: string;
  data?: HeatmapData | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  className?: string;
}

/**
 * Get heatmap color based on density (persons per sqm)
 * Universal color scale: blue (cold) → yellow → orange → red (hot)
 */
const getHeatColor = (density: number): string => {
  if (density < 0.2) return '#3B82F6'; // Cool blue
  if (density < 0.5) return '#60A5FA'; // Light blue
  if (density < 1.0) return '#FBBF24'; // Yellow
  if (density < 1.5) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

/**
 * Get contrasting text color for a hex background
 * Uses relative luminance to determine if white or dark text is more readable
 */
const getContrastText = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.55 ? '#1e293b' : '#ffffff';
};

/**
 * Check if timestamp is recent (within 5 minutes) for "Live" badge
 */
const isRecentTimestamp = (timestamp: string): boolean => {
  const age = Date.now() - new Date(timestamp).getTime();
  return age < 5 * 60 * 1000; // 5 minutes
};

/**
 * Format timestamp for display (HH:MM)
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * MallCardHeatmap - Heatmap preview thumbnail for mall cards
 *
 * Shows a simplified heatmap visualization or placeholder when data is not available.
 * Ready for data ingestion when security camera footage analysis arrives.
 */
export function MallCardHeatmap({
  mallId,
  data,
  colors,
  className = '',
}: MallCardHeatmapProps) {
  // Generate deterministic placeholder pattern based on mallId (fixes hydration mismatch)
  const placeholderPattern = useMemo(() => {
    const hash = mallId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array(12)
      .fill(0)
      .map((_, i) => ((hash + i * 7) % 10) / 10 * 0.5 + 0.2); // Range: 0.2-0.7
  }, [mallId]);

  // If no data, show placeholder
  if (!data || !data.zones || data.zones.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="aspect-video rounded-lg bg-gradient-to-br from-bo-neutral-100 to-bo-neutral-200 flex flex-col items-center justify-center p-4 border-2"
          style={{
            borderColor: colors.primary + '20', // 20% opacity
          }}
        >
          {/* Placeholder grid pattern with mall brand secondary color */}
          <div className="grid grid-cols-4 gap-1 mb-2 opacity-30">
            {placeholderPattern.map((opacity, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: colors.secondary,
                  opacity: opacity,
                }}
              />
            ))}
          </div>

          <p
            className="text-xs text-center font-medium tracking-wide"
            style={{ color: colors.primary }}
          >
            Heatmap Preview
          </p>
          <p className="text-xs text-bo-neutral-500 text-center mt-1">
            Awaiting data
          </p>
        </div>
      </div>
    );
  }

  // Render actual heatmap with data
  const maxZones = 12; // Display max 12 zones in grid
  const displayZones = data.zones.slice(0, maxZones);

  // Sort by density for better visualization
  const sortedZones = [...displayZones].sort((a, b) => b.density_per_sqm - a.density_per_sqm);

  return (
    <div className={`relative ${className}`}>
      <div
        className="aspect-video rounded-lg bg-bo-neutral-50 overflow-hidden border-2"
        style={{
          borderColor: colors.primary + '30', // 30% opacity
        }}
      >
        {/* Heatmap grid */}
        <div className="grid grid-cols-4 gap-0.5 p-2 h-full">
          {sortedZones.map((zone, index) => {
            const color = getHeatColor(zone.density_per_sqm); // Universal blue→red scale
            const opacity = Math.min(zone.density_per_sqm / 2, 1); // Max opacity at 2 persons/sqm

            return (
              <div
                key={zone.zone_id}
                className="rounded-sm transition-all duration-300 ease-bo-out hover:scale-105 hover:z-10 relative group"
                style={{
                  backgroundColor: color,
                  opacity: opacity * 0.8 + 0.2, // Min 20% opacity
                }}
                title={`${zone.zone_name || zone.zone_id}: ${zone.density_per_sqm.toFixed(2)} p/sqm`}
              >
                {/* Tooltip on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span
                    className="text-[10px] font-bold drop-shadow-lg"
                    style={{ color: getContrastText(color) }}
                  >
                    {zone.count || Math.round(zone.density_per_sqm * 10)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Fill empty cells if fewer than maxZones */}
          {[...Array(Math.max(0, maxZones - sortedZones.length))].map((_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-sm bg-bo-neutral-100 opacity-20"
            />
          ))}
        </div>

        {/* Data timestamp indicator - shows "Live" or actual time */}
        {data.timestamp && (
          <div
            className="absolute bottom-1 right-1 text-white text-[9px] px-1.5 py-0.5 rounded font-medium shadow-bo-sm"
            style={{
              backgroundColor: isRecentTimestamp(data.timestamp)
                ? colors.accent
                : 'rgba(0, 0, 0, 0.8)',
            }}
          >
            {isRecentTimestamp(data.timestamp) ? 'Live' : formatTimestamp(data.timestamp)}
          </div>
        )}
      </div>

      {/* Label below heatmap with brand color */}
      <p
        className="text-xs text-center mt-2 font-medium tracking-wide"
        style={{ color: colors.primary }}
      >
        Floor Heatmap
      </p>
    </div>
  );
}

/**
 * Generate mock heatmap data for testing
 * Remove this function when real data is available
 */
export function generateMockHeatmapData(mallId: string): HeatmapData {
  const zoneCount = 12;
  const zones: HeatmapZone[] = [];

  for (let i = 0; i < zoneCount; i++) {
    zones.push({
      zone_id: `zone_${i + 1}`,
      zone_name: `Zone ${i + 1}`,
      density_per_sqm: Math.random() * 2, // 0-2 persons per sqm
      count: Math.floor(Math.random() * 50) + 5,
    });
  }

  return {
    zones,
    timestamp: new Date().toISOString(),
  };
}
