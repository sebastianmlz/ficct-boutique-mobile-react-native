// We intentionally do not pull the real module to avoid loading expo-constants
// in the unit test runtime. The endpoint path is verified by a static assertion
// against the source.
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(__dirname, 'ai.service.ts'), 'utf8');

describe('ai service contract', () => {
  it('targets the /ai/similarity/search/ endpoint', () => {
    expect(source).toContain('/ai/similarity/search/');
  });

  it('exports searchSimilarImages', () => {
    expect(source).toMatch(/export\s+async\s+function\s+searchSimilarImages/);
  });
});
