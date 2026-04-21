// Re-export shim. Canonical location: src/lib/data/postalCodeBoundaries.ts
// This file is pure data, not a service — moved to `lib/data/` to reflect that.
// Do not add new imports from this path.
export { fetchPostalCodeBoundaries, type PostalCodeBoundary } from '@/lib/data/postalCodeBoundaries';
