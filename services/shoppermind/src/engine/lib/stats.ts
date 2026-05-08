export function movingAverage<T>(
  series: T[],
  field: keyof T,
  window?: number,
): number {
  if (series.length === 0) return 0;
  const slice = window ? series.slice(-window) : series;
  const values = slice.map((s) => Number(s[field]) || 0);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function medianAbsoluteDeviation<T>(
  series: T[],
  field: keyof T,
): number {
  if (series.length === 0) return 0;
  const values = series.map((s) => Number(s[field]) || 0);
  const m = median(values);
  const deviations = values.map((v) => Math.abs(v - m));
  return median(deviations);
}

export function normalise(value: number, min = 0, max = 1): number {
  if (max === min) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  return (clamped - min) / (max - min);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aMag += a[i] * a[i];
    bMag += b[i] * b[i];
  }
  const denom = Math.sqrt(aMag) * Math.sqrt(bMag);
  return denom === 0 ? 0 : dot / denom;
}

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
