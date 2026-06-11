import { Platform } from 'react-native';

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

/**
 * Visual search against MS2: uploads an image as multipart/form-data (web
 * appends a real Blob, native appends the `{ uri, name, type }` object) with
 * `top_k=6` and an optional bearer token. Content-Type is left unset so fetch
 * generates the multipart boundary automatically.
 * @param image Selected image with `uri`, `name`, and MIME `type`.
 * @returns The list of similar products ranked by score.
 * @throws Error if the AI service responds with a non-OK status.
 */
export async function searchSimilarImages(image: { uri: string; name: string; type: string }): Promise<SimilarityResult[]> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // On web the picker yields a blob:/data: URI — fetch the bytes and append a
    // real Blob so the multipart body carries the file (the { uri, name, type }
    // object form only produces a valid upload on native).
    const blob = await (await fetch(image.uri)).blob();
    form.append('image', blob, image.name);
  } else {
    // React Native (native) expects { uri, name, type } objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.append('image', { uri: image.uri, name: image.name, type: image.type } as any);
  }
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
