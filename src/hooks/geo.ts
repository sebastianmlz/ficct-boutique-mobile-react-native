// Pure geo helpers — no React Native or Expo imports. Safe to unit-test.

/**
 * Pure great-circle distance between two coordinates via the haversine formula.
 * No React Native/Expo dependencies, so it is safe to unit-test directly.
 * @param a First point `{ latitude, longitude }` in degrees.
 * @param b Second point `{ latitude, longitude }` in degrees.
 * @returns Distance in kilometers.
 */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
