import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import type { SimilarityResult } from '@/services/ai/ai.service';
import { AppBadge, AppCard, AppEmptyState, AppIcon } from '@/components';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type Route = RouteProp<{ SimilarResults: { results: SimilarityResult[]; preview: string } }>;

export function SimilarResultsScreen() {
  const route = useRoute<Route>();
  const { results, preview } = route.params;

  return (
    <View style={styles.root}>
      <View style={styles.previewWrap}>
        <Image source={{ uri: preview }} style={styles.preview} />
        <View style={styles.previewText}>
          <Text style={styles.previewTitle}>Imagen consultada</Text>
          <Text style={styles.previewSub}>{results.length} {results.length === 1 ? 'coincidencia' : 'coincidencias'} en el catálogo</Text>
        </View>
      </View>
      <FlatList
        data={results}
        keyExtractor={(r) => r.product_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AppEmptyState icon="search" title="Sin coincidencias visuales" subtitle="Prueba con otra foto o un ángulo más claro de la prenda." />
        }
        renderItem={({ item }) => (
          <AppCard padded style={styles.row}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <AppIcon name="image" size={18} color={colors.mute} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name || item.sku}</Text>
              {item.category ? <Text style={styles.meta}>{item.category}</Text> : null}
              <View style={styles.scoreRow}>
                <AppBadge label={`Similitud ${(item.score * 100).toFixed(0)}%`} tone="accent" />
              </View>
            </View>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  previewWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  preview: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  previewText: { flex: 1 },
  previewTitle: { fontWeight: fontWeight.semibold, fontSize: fontSize.base, color: colors.ink },
  previewSub: { color: colors.mute, fontSize: fontSize.sm, marginTop: 2 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm, flexGrow: 1 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumb: { width: 60, height: 60, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontWeight: fontWeight.semibold, fontSize: fontSize.base, color: colors.ink },
  meta: { color: colors.mute, fontSize: fontSize.xs },
  scoreRow: { marginTop: 4, flexDirection: 'row' },
});
