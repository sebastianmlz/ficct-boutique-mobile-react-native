import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface LocationResult {
  loading: boolean;
  error: string | null;
  coords: { latitude: number; longitude: number } | null;
}

/**
 * Requests foreground location permission and resolves the device's current
 * position once on mount. Reports `loading` while in flight, an `error`
 * message if permission is denied or lookup fails, and `coords` on success.
 * Cancellation-safe: ignores async results after unmount.
 * @returns `{ loading, error, coords }` location state.
 */
export function useUserLocation(): LocationResult {
  const [coords, setCoords] = useState<LocationResult['coords']>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setError('Permiso de ubicación denegado');
            setLoading(false);
          }
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, error, coords };
}

/**
 * Great-circle distance between two coordinates using the haversine formula.
 * @param a First point `{ latitude, longitude }` in degrees.
 * @param b Second point `{ latitude, longitude }` in degrees.
 * @returns Distance in kilometers.
 */
export function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
