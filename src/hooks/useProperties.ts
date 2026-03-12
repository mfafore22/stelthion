/**
 * useProperties Hook - Industry-Agnostic Property Data
 *
 * Replaces useAirports with a generic hook for accessing retail and manufacturing properties.
 * Returns static data from property-constants instead of fetching from an API.
 */

import { useMemo } from 'react';
import {
  RETAIL_PLACES,
  MANUFACTURING_PLACES,
  type RetailPlace,
  type ManufacturingPlace,
  type PropertyType
} from '@/data/property-constants';

// Generic property interface
export type Property = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  type: PropertyType;
  // Type-specific fields
  code?: string; // For properties with codes (if needed)
};

// Convert RetailPlace to Property
function toProperty(place: RetailPlace | ManufacturingPlace, type: PropertyType): Property {
  return {
    id: place.id,
    name: place.name,
    city: place.city,
    lat: place.lat,
    lon: place.lon,
    type,
  };
}

/**
 * Hook to get all properties (retail + manufacturing)
 */
export function useProperties() {
  const properties = useMemo(() => {
    const retail = RETAIL_PLACES.map(p => toProperty(p, 'RETAIL'));
    const manufacturing = MANUFACTURING_PLACES.map(p => toProperty(p, 'MANUFACTURING'));
    return [...retail, ...manufacturing];
  }, []);

  return {
    properties,
    loading: false,
    error: null
  };
}

/**
 * Hook to get properties by type
 */
export function usePropertiesByType(type: PropertyType) {
  const properties = useMemo(() => {
    if (type === 'RETAIL') {
      return RETAIL_PLACES.map(p => toProperty(p, 'RETAIL'));
    } else if (type === 'MANUFACTURING') {
      return MANUFACTURING_PLACES.map(p => toProperty(p, 'MANUFACTURING'));
    }
    return [];
  }, [type]);

  return {
    properties,
    loading: false,
    error: null
  };
}

/**
 * Hook to get a single property by ID
 */
export function useProperty(id: string) {
  const property = useMemo(() => {
    if (!id) return null;

    // Search in retail
    const retail = RETAIL_PLACES.find(p => p.id === id);
    if (retail) return toProperty(retail, 'RETAIL');

    // Search in manufacturing
    const manufacturing = MANUFACTURING_PLACES.find(p => p.id === id);
    if (manufacturing) return toProperty(manufacturing, 'MANUFACTURING');

    return null;
  }, [id]);

  return {
    property,
    loading: false,
    error: property === null && id ? `Property not found: ${id}` : null
  };
}

/**
 * Hook to get properties by city
 */
export function usePropertiesByCity(city: string) {
  const properties = useMemo(() => {
    const retail = RETAIL_PLACES.filter(p => p.city === city).map(p => toProperty(p, 'RETAIL'));
    const manufacturing = MANUFACTURING_PLACES.filter(p => p.city === city).map(p => toProperty(p, 'MANUFACTURING'));
    return [...retail, ...manufacturing];
  }, [city]);

  return {
    properties,
    loading: false,
    error: null
  };
}
