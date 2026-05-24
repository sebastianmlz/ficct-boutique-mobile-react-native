import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';

const ORDERS_QUERY = gql`
  query MyOrders { orders(limit: 50) { id code status createdAt } }
`;

interface OrderRow {
  id: string;
  code: string;
  status: string;
  createdAt: string;
}

export function OrdersScreen() {
  const { data, loading, error } = useQuery<{ orders: OrderRow[] }>(ORDERS_QUERY);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (error) return <View style={styles.center}><Text style={styles.err}>{error.message}</Text></View>;

  return (
    <FlatList
      data={data?.orders ?? []}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>Sin órdenes todavía.</Text></View>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.code}>{item.code}</Text>
          <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString('es-BO')}</Text>
          <View style={styles.statusBadge}><Text style={styles.statusText}>{item.status}</Text></View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  err: { color: '#b91c1c' },
  empty: { color: '#78716c' },
  list: { padding: 12, gap: 8 },
  row: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, padding: 12 },
  code: { fontWeight: '700', fontSize: 15 },
  meta: { color: '#78716c', marginTop: 2, fontSize: 12 },
  statusBadge: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { color: '#047857', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
