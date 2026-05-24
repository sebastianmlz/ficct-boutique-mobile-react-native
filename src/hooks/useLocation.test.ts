import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm({ latitude: -17.78, longitude: -63.18 }, { latitude: -17.78, longitude: -63.18 })).toBeCloseTo(0, 3);
  });

  it('returns ~0.86 km between two nearby Santa Cruz points', () => {
    const a = { latitude: -17.78, longitude: -63.18 };
    const b = { latitude: -17.79, longitude: -63.17 };
    const d = haversineKm(a, b);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(2.0);
  });
});
