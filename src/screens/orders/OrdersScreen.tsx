import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';

import { AppBadge, AppCard, AppEmptyState, AppErrorState, AppIcon, AppLoadingState } from '@/components';
import type { BadgeTone } from '@/components';
import { colors, fontSize, fontWeight, spacing } from '@/theme';

const ORDERS_QUERY = gql`
  query MyOrders { orders(limit: 50) { id code status createdAt } }
`;

interface OrderRow {
  id: string;
  code: string;
  status: string;
  createdAt: string;
}

// Customer-friendly Spanish status labels (no raw enum strings in the UI).
const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  placed: { label: 'Realizado', tone: 'accent' },
  preparing: { label: 'En preparación', tone: 'pending' },
  ready: { label: 'Listo para recoger', tone: 'active' },
  delivered: { label: 'Entregado', tone: 'active' },
  cancelled: { label: 'Cancelado', tone: 'deleted' },
};

export function OrdersScreen() {
  const { data, loading, error, refetch } = useQuery<{ orders: OrderRow[] }>(ORDERS_QUERY);

  if (loading) return <AppLoadingState label="Cargando tus órdenes…" />;
  if (error) return <AppErrorState message="No pudimos cargar tus órdenes. Inténtalo de nuevo." onRetry={() => refetch()} />;

  return (
    <View style={styles.root}>
      <FlatList
        data={data?.orders ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AppEmptyState icon="package" title="Sin órdenes todavía" subtitle="Cuando realices un pedido aparecerá aquí." />
        }
        renderItem={({ item }) => {
          const s = STATUS[item.status] ?? { label: item.status, tone: 'neutral' as BadgeTone };
          return (
            <AppCard style={styles.card}>
              <View style={styles.top}>
                <View style={styles.codeRow}>
                  <AppIcon name="package" size={18} color={colors.accent} />
                  <Text style={styles.code}>{item.code}</Text>
                </View>
                <AppBadge label={s.label} tone={s.tone} dot />
              </View>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString('es-BO')}</Text>
            </AppCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  card: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  code: { fontWeight: fontWeight.bold, fontSize: fontSize.base, color: colors.ink },
  meta: { color: colors.mute, fontSize: fontSize.xs },
});
