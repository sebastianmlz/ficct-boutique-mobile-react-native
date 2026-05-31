import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';

import { haversineKm, useUserLocation } from '@/hooks/useLocation';
import type { Branch } from '@/models';
import { AppBadge, AppCard, AppErrorState, AppIcon, AppLoadingState, SectionHeader } from '@/components';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

const BRANCHES_QUERY = gql`
  query BranchesMobile {
    branches { id code name address latitude longitude phone }
  }
`;

export function BranchesScreen() {
  const { data, loading, error, refetch } = useQuery<{ branches: Branch[] }>(BRANCHES_QUERY);
  const { coords, loading: gpsLoading, error: gpsError } = useUserLocation();

  if (loading) return <AppLoadingState label="Cargando sucursales…" />;
  if (error) return <AppErrorState message="No pudimos cargar las sucursales. Inténtalo de nuevo." onRetry={() => refetch()} />;

  const branches = (data?.branches ?? []).map((b) => {
    let distance: number | null = null;
    if (coords && b.latitude !== null && b.longitude !== null) {
      distance = haversineKm(coords, { latitude: b.latitude, longitude: b.longitude });
    }
    return { ...b, distance };
  });
  branches.sort((a, b) => (a.distance ?? Number.MAX_VALUE) - (b.distance ?? Number.MAX_VALUE));

  return (
    <View style={styles.root}>
      <FlatList
        data={branches}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <SectionHeader title="Sucursales" subtitle="Encuentra la boutique FICCT más cercana" />
            {gpsLoading ? (
              <View style={styles.notice}>
                <AppIcon name="navigation" size={16} color={colors.mute} />
                <Text style={styles.noticeText}>Obteniendo tu ubicación para ordenar por distancia…</Text>
              </View>
            ) : gpsError || !coords ? (
              <View style={styles.notice}>
                <AppIcon name="mapOff" size={16} color={colors.accent} />
                <Text style={styles.noticeText}>Ubicación no disponible. Mostramos todas las sucursales.</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <AppCard padded style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.code}>{item.code}</Text>
              <View style={styles.line}>
                <AppIcon name="location" size={14} color={colors.mute} />
                <Text style={styles.lineText}>{item.address}</Text>
              </View>
              {item.phone ? (
                <View style={styles.line}>
                  <AppIcon name="phone" size={14} color={colors.mute} />
                  <Text style={styles.lineText}>{item.phone}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.distance}>
              {item.distance !== null ? (
                <AppBadge label={`${item.distance.toFixed(1)} km`} tone="neutral" />
              ) : (
                <Text style={styles.noGps}>Sin ubicación</Text>
              )}
            </View>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.md, gap: spacing.sm, paddingTop: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.xs },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  noticeText: { flex: 1, color: colors.inkSoft, fontSize: fontSize.sm },
  card: { flexDirection: 'row', gap: spacing.md },
  info: { flex: 1, gap: 3 },
  name: { fontWeight: fontWeight.bold, fontSize: fontSize.base, color: colors.ink },
  code: { color: colors.mute, fontSize: fontSize.xs, letterSpacing: 1 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  lineText: { color: colors.inkSoft, fontSize: fontSize.sm, flex: 1 },
  distance: { alignItems: 'flex-end', justifyContent: 'center' },
  noGps: { color: colors.mute, fontSize: fontSize.xs },
});
