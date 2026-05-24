import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import type { SimilarityResult } from '@/services/ai/ai.service';

type Route = RouteProp<{ SimilarResults: { results: SimilarityResult[]; preview: string } }>;

export function SimilarResultsScreen() {
  const route = useRoute<Route>();
  const { results, preview } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.previewWrap}>
        <Image source={{ uri: preview }} style={styles.preview} />
        <Text style={styles.previewLabel}>Imagen consultada</Text>
      </View>
      <FlatList
        data={results}
        keyExtractor={(r) => r.product_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: '#78716c' }}>Sin coincidencias visuales en el catálogo.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ color: '#78716c', fontSize: 11 }}>Sin imagen</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || item.sku}</Text>
              <Text style={styles.meta}>{item.category}</Text>
              <Text style={styles.score}>Similitud {(item.score * 100).toFixed(0)}%</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: { padding: 12, alignItems: 'center' },
  preview: { width: 96, height: 96, borderRadius: 12, backgroundColor: '#f5f5f4' },
  previewLabel: { color: '#78716c', marginTop: 4, fontSize: 12 },
  list: { padding: 12, gap: 8 },
  empty: { padding: 24, alignItems: 'center' },
  row: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f5f5f4' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700' },
  meta: { color: '#78716c', fontSize: 12, marginTop: 2 },
  score: { marginTop: 6, fontWeight: '700', color: '#9a3412' },
});
