import { env } from '@/config/env';
import { inMemoryToken } from '@/services/auth/token-storage';

export interface SimilarityResult {
  product_id: string;
  name: string;
  category: string;
  image_url: string;
  sku: string;
  score: number;
}

export async function searchSimilarImages(image: { uri: string; name: string; type: string }): Promise<SimilarityResult[]> {
  const form = new FormData();
  // React Native expects { uri, name, type } objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append('image', { uri: image.uri, name: image.name, type: image.type } as any);
  form.append('top_k', '6');

  const token = inMemoryToken.get();
  const resp = await fetch(`${env.aiApiUrl}/ai/similarity/search/`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // do NOT set Content-Type — fetch sets the multipart boundary automatically
    },
    body: form,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI service ${resp.status}: ${text.slice(0, 200)}`);
  }
  const data = (await resp.json()) as { results: SimilarityResult[] };
  return data.results;
}
