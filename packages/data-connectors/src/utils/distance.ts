import type { Coordinates } from '@uvidai/shared';

/** Earth radius in metres (WGS-84) */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Haversine distance in metres between two WGS-84 coordinates.
 * O(1), suitable for short distances (ignores Earth ellipsoid).
 */
export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(x));
}
