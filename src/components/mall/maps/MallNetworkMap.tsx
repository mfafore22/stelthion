/**
 * Mall Network Map Component
 *
 * Interactive Mapbox map showing all properties in a management company's portfolio
 * Features:
 * - Property pins color-coded by status (LIVE, ALPHA, BETA, PLANNED)
 * - Click to select property
 * - Hover tooltips with property name and city
 * - Auto-fit bounds to show all properties
 * - Optional catchment zone overlay (simulated 5km radius)
 *
 * **IMPORTANT - Environment Setup:**
 * This component requires a Mapbox access token to function.
 *
 * 1. Get a free token at https://account.mapbox.com/access-tokens/
 * 2. Add to your .env.local file:
 *    ```
 *    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
 *    ```
 * 3. Restart your development server
 *
 * Without a valid token, the component will render a placeholder with instructions.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface PropertyLocation {
  id: string;
  name: string;
  city: string;
  status: 'live' | 'alpha' | 'beta' | 'planned';
  coordinates: [number, number]; // [longitude, latitude]
  brandColor?: string; // Optional mall-specific brand color
}

export interface MallNetworkMapProps {
  /**
   * Array of properties to display on the map
   */
  properties: PropertyLocation[];
  /**
   * Callback when a property is clicked
   */
  onPropertyClick?: (propertyId: string) => void;
  /**
   * Currently selected property ID
   */
  selectedPropertyId?: string;
  /**
   * Show simulated catchment zones around properties
   * @default false
   */
  showCatchmentZones?: boolean;
  /**
   * Map height
   * @default '400px'
   */
  height?: string;
  /**
   * Mapbox access token
   */
  accessToken: string;
}

const STATUS_COLORS = {
  live: '#00D4AA',      // Success green
  alpha: '#1976d2',     // Info blue
  beta: '#f57c00',      // Warning orange
  planned: '#94a3b8',   // Neutral gray
};

/**
 * Simple seeded PRNG (Mulberry32) for deterministic random numbers
 * Returns a function that generates numbers in [0, 1) range
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate deterministic hash from string (for seeding)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate simulated catchment zone polygon around a property
 * Creates a circular polygon with slight irregularity for realism
 * Uses seeded PRNG based on propertyId for deterministic rendering (SSR-safe)
 */
function generateCatchmentZone(
  center: [number, number],
  propertyId: string,
  radiusKm: number = 5,
  points: number = 32
): [number, number][] {
  const coords: [number, number][] = [];
  const earthRadiusKm = 6371;

  // Create deterministic random number generator seeded by propertyId
  const seed = hashString(propertyId);
  const random = createSeededRandom(seed);

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;

    // Add slight irregularity (±15%) using seeded random for determinism
    const irregularity = 0.85 + random() * 0.3;
    const actualRadius = radiusKm * irregularity;

    // Convert to lat/lng offset
    const dx = actualRadius / earthRadiusKm;
    const dy = actualRadius / (earthRadiusKm * Math.cos((Math.PI / 180) * center[1]));

    const lng = center[0] + (dy * Math.cos(angle) * (180 / Math.PI));
    const lat = center[1] + (dx * Math.sin(angle) * (180 / Math.PI));

    coords.push([lng, lat]);
  }

  // Close the polygon
  coords.push(coords[0]);

  return coords;
}

export function MallNetworkMap({
  properties,
  onPropertyClick,
  selectedPropertyId,
  showCatchmentZones = false,
  height = '400px',
  accessToken,
}: MallNetworkMapProps) {
  const { t } = useTranslation('mall');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Early return if no access token - prevents Mapbox initialization errors
  if (!accessToken || accessToken.trim() === '') {
    return (
      <div className="relative">
        <div
          className="rounded-mall-lg overflow-hidden border border-mall-neutral-200 bg-mall-neutral-50 flex flex-col items-center justify-center"
          style={{ height }}
        >
          <svg
            className="w-12 h-12 text-mall-neutral-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm font-medium text-mall-neutral-600 mb-1">{t('map.unavailable', 'Map Unavailable')}</p>
          <p className="text-xs text-mall-neutral-500 text-center px-4">
            {t('map.addToken', 'Add NEXT_PUBLIC_MAPBOX_TOKEN to display catchment map')}
          </p>
        </div>
      </div>
    );
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [24.9384, 60.1695], // Center on Helsinki, Finland
      zoom: 8,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [accessToken]);

  // Update markers when properties change
  useEffect(() => {
    if (!map.current || !mapLoaded || properties.length === 0) return;

    // Remove existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add markers for each property
    properties.forEach((property) => {
      if (!map.current) return;

      // Use brand color if provided, otherwise fallback to status color
      const markerColor = property.brandColor || STATUS_COLORS[property.status];

      // Create marker element
      const el = document.createElement('div');
      el.className = 'mall-map-marker';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = markerColor;
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.2s';

      // Selected state
      if (selectedPropertyId === property.id) {
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.border = '4px solid white';
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
      }

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
      });

      el.addEventListener('mouseleave', () => {
        if (selectedPropertyId !== property.id) {
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        }
      });

      // Click handler
      el.addEventListener('click', () => {
        onPropertyClick?.(property.id);
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(
        `<div style="padding: 8px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${property.name}</div>
          <div style="font-size: 12px; color: #64748b;">${property.city}</div>
        </div>`
      );

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(property.coordinates)
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (properties.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach((property) => {
        bounds.extend(property.coordinates);
      });
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    } else if (properties.length === 1) {
      map.current.setCenter(properties[0].coordinates);
      map.current.setZoom(12);
    }
  }, [properties, mapLoaded, selectedPropertyId, onPropertyClick]);

  // Manage catchment zone polygons
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const sourceId = 'catchment-zones';
    const layerId = 'catchment-zones-fill';
    const layerBorderId = 'catchment-zones-border';

    if (showCatchmentZones && properties.length > 0) {
      // Generate GeoJSON for all catchment zones
      const features = properties.map((property) => {
        const zoneCoords = generateCatchmentZone(property.coordinates, property.id, 5); // 5km radius

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [zoneCoords],
          },
          properties: {
            propertyId: property.id,
            propertyName: property.name,
            status: property.status,
            brandColor: property.brandColor || STATUS_COLORS[property.status],
          },
        };
      });

      const geojson = {
        type: 'FeatureCollection' as const,
        features,
      };

      // Remove existing layers and source if they exist
      if (map.current.getLayer(layerBorderId)) {
        map.current.removeLayer(layerBorderId);
      }
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }

      // Add source and layers
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });

      // Add fill layer
      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['get', 'brandColor'], // Use brand color from feature properties
          'fill-opacity': 0.15,
        },
      });

      // Add border layer
      map.current.addLayer({
        id: layerBorderId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': ['get', 'brandColor'], // Use brand color from feature properties
          'line-width': 2,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2],
        },
      });

      // Move markers above catchment zones
      markers.current.forEach((marker) => {
        const element = marker.getElement();
        if (element) {
          element.style.zIndex = '10';
        }
      });
    } else {
      // Remove layers and source when toggled off
      if (map.current.getLayer(layerBorderId)) {
        map.current.removeLayer(layerBorderId);
      }
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    }
  }, [showCatchmentZones, properties, mapLoaded]);

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        style={{ height }}
        className="rounded-mall-lg overflow-hidden border border-mall-neutral-200"
      />
      {!mapLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-mall-neutral-100 rounded-mall-lg"
          style={{ height }}
        >
          <p className="text-sm text-mall-neutral-500">Loading map...</p>
        </div>
      )}
    </div>
  );
}
