/**
 * Catchment Map Component
 * Interactive Mapbox visualization with real postal code boundaries from Statistics Finland
 */

'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { CatchmentDemographics } from '@/lib/types/transport';
import { fetchPostalCodeBoundaries, type PostalCodeBoundary } from '@/lib/services/postalCodeBoundaries';

interface CatchmentMapProps {
  demographics: CatchmentDemographics;
  selectedZone: number | null;
  onZoneSelect: (zoneIndex: number | null) => void;
  onPostalCodeClick?: (postalCode: string) => void;
  mallId: string;
  mallName: string;
}

// Default centers for known malls [lng, lat]
const MALL_CENTERS: Record<string, [number, number]> = {
  tripla: [24.9318, 60.1995],
  ideapark: [23.7592, 61.4033],
  sello: [24.8092, 60.2176],
};

export function CatchmentMap({ demographics, selectedZone, onZoneSelect, onPostalCodeClick, mallId, mallName }: CatchmentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showPropertyBoundaries, setShowPropertyBoundaries] = useState(true);
  const [postalBoundaries, setPostalBoundaries] = useState<PostalCodeBoundary[]>([]);
  const [loadingBoundaries, setLoadingBoundaries] = useState(false);
  const [selectedPostalCode, setSelectedPostalCode] = useState<string | null>(null);
  const [hasInitiallyFitted, setHasInitiallyFitted] = useState(false); // Track if we've done initial fit
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mmlApiKey = process.env.NEXT_PUBLIC_MML_API_KEY;

  // Mall center (fallback to Tripla if unknown)
  const mallCenter: [number, number] = MALL_CENTERS[mallId] || MALL_CENTERS.tripla;

  // Zone colors - matching drive time zones
  const zoneColors: Record<number, { color: string; opacity: number }> = {
    5: { color: '#22c55e', opacity: 0.6 },   // Green - increased opacity
    10: { color: '#3b82f6', opacity: 0.6 },  // Blue - increased opacity
    15: { color: '#f97316', opacity: 0.6 },  // Orange - increased opacity
    20: { color: '#f59e0b', opacity: 0.6 },  // Amber (between orange and red)
    30: { color: '#ef4444', opacity: 0.6 },  // Red - increased opacity
  };

  // Helper to safely get zone color with fallback
  const getZoneColor = (driveTimeMinutes: number): { color: string; opacity: number } => {
    return zoneColors[driveTimeMinutes] || { color: '#9ca3af', opacity: 0.6 }; // Gray fallback
  };

  // Memoize postal codes to prevent infinite loops
  const allPostalCodes = useMemo(
    () => demographics.zones.flatMap(zone => zone.postalCodes),
    [demographics.zones]
  );

  // Fetch postal code boundaries from Statistics Finland
  useEffect(() => {
    if (!allPostalCodes.length) return;

    setLoadingBoundaries(true);
    fetchPostalCodeBoundaries(allPostalCodes)
      .then(boundaries => {
        console.log('[CatchmentMap] Loaded', boundaries.length, 'postal boundaries');
        setPostalBoundaries(boundaries);
      })
      .catch(error => {
        console.error('[CatchmentMap] Failed to load postal boundaries:', error);
      })
      .finally(() => {
        setLoadingBoundaries(false);
      });
  }, [allPostalCodes]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: mallCenter,
      zoom: 11,
      attributionControl: false,
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl({ showZoom: true }), 'top-right');

    // Add mall marker
    new mapboxgl.Marker({ color: '#1e40af' })
      .setLngLat(mallCenter)
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${mallName}</strong>`))
      .addTo(map);

    map.on('load', () => {
      console.log('[CatchmentMap] Map loaded');

      // Add MML property boundaries overlay (if API key is available)
      if (mmlApiKey) {
        console.log('[CatchmentMap] Adding MML property boundaries with API key:', mmlApiKey.substring(0, 8) + '...');

        map.addSource('mml-properties', {
          type: 'raster',
          tiles: [
            `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/kiinteistojaotus/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.png?api-key=${mmlApiKey}`,
          ],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 18,
        });

        map.addLayer({
          id: 'property-boundaries',
          type: 'raster',
          source: 'mml-properties',
          paint: {
            'raster-opacity': 0.4,
          },
        });

        console.log('[CatchmentMap] MML property boundaries layer added');
      } else {
        console.warn('[CatchmentMap] No MML API key found - property boundaries disabled');
      }

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [token, mmlApiKey, mallCenter, mallName]);

  // Add postal code boundaries when both map is loaded AND boundaries are fetched
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || postalBoundaries.length === 0) return;

    const map = mapRef.current;

    // Remove existing layers if they exist (for updates)
    if (map.getLayer('postal-fill')) map.removeLayer('postal-fill');
    if (map.getLayer('postal-outline')) map.removeLayer('postal-outline');
    if (map.getLayer('postal-labels')) map.removeLayer('postal-labels');
    if (map.getSource('postal-boundaries')) map.removeSource('postal-boundaries');

    console.log('[CatchmentMap] Adding', postalBoundaries.length, 'postal code boundaries to map');

    // Create a GeoJSON FeatureCollection from the boundaries
    // Filter to show only selected zone (or all if none selected)
    const postalFeaturesWithZones = postalBoundaries
      .filter(boundary => {
        // If a zone is selected, only show boundaries from that zone
        if (selectedZone !== null) {
          const selectedZoneData = demographics.zones[selectedZone];
          return selectedZoneData?.postalCodes.includes(boundary.code);
        }
        // Otherwise show all boundaries
        return true;
      })
      .map(boundary => {
        // Find which zone this postal code belongs to
        const zone = demographics.zones.find(z => z.postalCodes.includes(boundary.code));
        const zoneIndex = demographics.zones.findIndex(z => z.postalCodes.includes(boundary.code));
        const zoneColor = zone ? getZoneColor(zone.driveTimeMinutes) : getZoneColor(5);

        return {
          type: 'Feature' as const,
          geometry: boundary.geometry,
          properties: {
            postalCode: boundary.code,
            name: boundary.name,
            zoneIndex,
            driveTimeMinutes: zone?.driveTimeMinutes || 0,
            color: zoneColor.color,
            opacity: zoneColor.opacity,
          },
        };
      });

    const postalCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: postalFeaturesWithZones,
    };

    // Add source
    map.addSource('postal-boundaries', {
      type: 'geojson',
      data: postalCollection,
    });

    // Add fill layer - place it above the base map but below labels
    map.addLayer({
      id: 'postal-fill',
      type: 'fill',
      source: 'postal-boundaries',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': [
          'case',
          ['==', ['get', 'postalCode'], selectedPostalCode || ''],
          0.4, // Highlighted opacity when selected
          ['get', 'opacity'], // Default opacity
        ],
      },
    }, 'road-label-simple'); // Insert before road labels

    // Add outline layer
    map.addLayer({
      id: 'postal-outline',
      type: 'line',
      source: 'postal-boundaries',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': [
          'case',
          ['==', ['get', 'postalCode'], selectedPostalCode || ''],
          3, // Thicker line when selected
          1.5, // Default line width
        ],
        'line-opacity': [
          'case',
          ['==', ['get', 'postalCode'], selectedPostalCode || ''],
          1, // Full opacity when selected
          0.6, // Default opacity
        ],
      },
    });

    // Add labels for postal codes
    map.addLayer({
      id: 'postal-labels',
      type: 'symbol',
      source: 'postal-boundaries',
      layout: {
        'text-field': ['get', 'postalCode'],
        'text-size': 11,
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': '#1e293b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
        'text-opacity': 0.8,
      },
    });

    console.log('[CatchmentMap] Postal boundary layers added successfully');

    // Fit map to show all postal code boundaries - ONLY on initial load, not when switching zones
    if (!hasInitiallyFitted) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        postalBoundaries.forEach(boundary => {
          if (boundary.geometry.type === 'Polygon') {
            boundary.geometry.coordinates[0].forEach((coord: number[]) => {
              bounds.extend(coord as [number, number]);
            });
          } else if (boundary.geometry.type === 'MultiPolygon') {
            boundary.geometry.coordinates.forEach((polygon: number[][][]) => {
              polygon[0].forEach((coord: number[]) => {
                bounds.extend(coord as [number, number]);
              });
            });
          }
        });
        map.fitBounds(bounds, { padding: 50, duration: 1000 });
        setHasInitiallyFitted(true); // Mark that we've done the initial fit
      } catch (error) {
        console.error('[CatchmentMap] Error fitting bounds:', error);
      }
    }

    // Add click handler for postal codes
    const handlePostalClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const postalCode = feature.properties?.postalCode;

        if (postalCode) {
          console.log('[CatchmentMap] Clicked postal code:', postalCode);
          setSelectedPostalCode(postalCode);
          onPostalCodeClick?.(postalCode);
        }
      }
    };

    map.on('click', 'postal-fill', handlePostalClick);

    // Change cursor on hover
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('mouseenter', 'postal-fill', handleMouseEnter);
    map.on('mouseleave', 'postal-fill', handleMouseLeave);

    // Show tooltip on hover
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
    });

    const handleMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const postalCode = feature.properties?.postalCode;
        const name = feature.properties?.name;

        popup
          .setLngLat(e.lngLat)
          .setHTML(`<div class="text-xs"><strong>${postalCode}</strong><br/>${name}</div>`)
          .addTo(map);
      }
    };

    const handleMouseLeavePopup = () => {
      popup.remove();
    };

    map.on('mousemove', 'postal-fill', handleMouseMove);
    map.on('mouseleave', 'postal-fill', handleMouseLeavePopup);

    // Cleanup event listeners
    return () => {
      map.off('click', 'postal-fill', handlePostalClick);
      map.off('mouseenter', 'postal-fill', handleMouseEnter);
      map.off('mouseleave', 'postal-fill', handleMouseLeave);
      map.off('mousemove', 'postal-fill', handleMouseMove);
      map.off('mouseleave', 'postal-fill', handleMouseLeavePopup);
    };
  }, [mapLoaded, postalBoundaries, selectedZone, selectedPostalCode, onPostalCodeClick, demographics, zoneColors, hasInitiallyFitted]);

  // Update postal code highlighting when selection changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getSource('postal-boundaries')) return;

    // Force repaint to update conditional styling
    mapRef.current.setPaintProperty('postal-fill', 'fill-opacity', [
      'case',
      ['==', ['get', 'postalCode'], selectedPostalCode || ''],
      0.4,
      ['get', 'opacity'],
    ]);

    mapRef.current.setPaintProperty('postal-outline', 'line-width', [
      'case',
      ['==', ['get', 'postalCode'], selectedPostalCode || ''],
      3,
      1.5,
    ]);

    mapRef.current.setPaintProperty('postal-outline', 'line-opacity', [
      'case',
      ['==', ['get', 'postalCode'], selectedPostalCode || ''],
      1,
      0.6,
    ]);
  }, [selectedPostalCode]);

  // Toggle property boundaries visibility
  useEffect(() => {
    if (!mapRef.current || !mmlApiKey) return;

    const map = mapRef.current;
    if (map.getLayer('property-boundaries')) {
      map.setLayoutProperty(
        'property-boundaries',
        'visibility',
        showPropertyBoundaries ? 'visible' : 'none'
      );
    }
  }, [showPropertyBoundaries, mmlApiKey]);

  if (!token) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center bg-bo-neutral-100 text-bo-neutral-600 rounded-2xl border border-bo-neutral-200">
        <div className="text-center">
          <p className="font-medium mb-2">Map Unavailable</p>
          <p className="text-sm">Add NEXT_PUBLIC_MAPBOX_TOKEN to display catchment map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[500px] w-full rounded-2xl overflow-hidden shadow-bo border border-bo-neutral-200" />

      {/* Loading indicator */}
      {loadingBoundaries && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-bo-neutral-200">
          <div className="flex items-center gap-2 text-sm text-bo-neutral-700">
            <div className="animate-spin h-4 w-4 border-2 border-bo-primary-600 border-t-transparent rounded-full" />
            <span>Loading postal code boundaries...</span>
          </div>
        </div>
      )}

      {/* Zone Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-bo-neutral-200 max-w-[280px]">
        <div className="text-xs font-semibold text-bo-neutral-950 mb-3">Drive-Time Zones</div>
        <div className="space-y-2">
          {demographics.zones.map((zone, index) => {
            const zoneColor = getZoneColor(zone.driveTimeMinutes);
            const formatNumber = (num: number) => {
              if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
              if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
              return num.toString();
            };

            return (
              <button
                key={zone.driveTimeMinutes}
                onClick={() => onZoneSelect(selectedZone === index ? null : index)}
                className={`flex items-center gap-2 text-xs w-full text-left transition-all duration-200 p-2 rounded-lg ${
                  selectedZone === index
                    ? 'bg-bo-primary-50 ring-2 ring-bo-primary-300'
                    : 'hover:bg-bo-neutral-50'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: zoneColor.color,
                    borderColor: zoneColor.color,
                    opacity: selectedZone === index ? 1 : 0.7,
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium text-bo-neutral-950">{zone.driveTimeMinutes} min</div>
                  <div className="text-bo-neutral-600">{formatNumber(zone.population.total)} residents</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Property Boundaries Toggle */}
        {mmlApiKey && (
          <div className="mt-4 pt-3 border-t border-bo-neutral-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-bo-neutral-700 hover:text-bo-neutral-950 transition-colors">
              <input
                type="checkbox"
                checked={showPropertyBoundaries}
                onChange={(e) => setShowPropertyBoundaries(e.target.checked)}
                className="w-4 h-4 rounded border-bo-neutral-300 text-bo-primary-600 focus:ring-bo-primary-500 focus:ring-offset-0 focus:ring-2"
              />
              <span className="font-medium">Property Boundaries</span>
            </label>
            <div className="text-xs text-bo-neutral-500 ml-6 mt-1">Finnish cadastral data</div>
          </div>
        )}

        {/* Postal code info */}
        {postalBoundaries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-bo-neutral-200 text-xs text-bo-neutral-600">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Click any postal code area for details</span>
            </div>
          </div>
        )}

        {/* Data Source Attribution */}
        <div className="mt-3 pt-3 border-t border-bo-neutral-200">
          <p className="text-xs text-bo-neutral-500 leading-tight">
            Map © Mapbox, © OpenStreetMap<br />
            Boundaries © Statistics Finland
          </p>
        </div>
      </div>
    </div>
  );
}
