import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';

import { haversineKm, useUserLocation } from '@/hooks/useLocation';
import type { Branch } from '@/models';

const BRANCHES_QUERY = gql`
  query BranchesMobile {
    branches { id code name address latitude longitude phone }
  }
`;

export function BranchesScreen() {
  const { data, loading, error } = useQuery<{ branches: Branch[] }>(BRANCHES_QUERY);
  const { coords, loading: gpsLoading, error: gpsError } = useUserLocation();

  if (loading || gpsLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (error) return <View style={styles.center}><Text style={styles.err}>{error.message}</Text></View>;

  const branches = (data?.branches ?? []).map((b) => {
    let distance: number | null = null;
    if (coords && b.latitude !== null && b.longitude !== null) {
      distance = haversineKm(coords, { latitude: b.latitude, longitude: b.longitude });
    }
    return { ...b, distance };
  });
  branches.sort((a, b) => (a.distance ?? Number.MAX_VALUE) - (b.distance ?? Number.MAX_VALUE));

  return (
    <View style={{ flex: 1 }}>
      {gpsError ? <Text style={styles.gpsErr}>{gpsError}</Text> : null}
      <FlatList
        data={branches}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.address}>{item.address}</Text>
              {item.phone ? <Text style={styles.phone}>📞 {item.phone}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {item.distance !== null ? (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
                </View>
              ) : (
                <Text style={{ color: '#78716c', fontSize: 11 }}>Sin GPS</Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  err: { color: '#b91c1c' },
  gpsErr: { color: '#9a3412', padding: 12, textAlign: 'center' },
  list: { padding: 12, gap: 8 },
  row: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 12 },
  name: { fontWeight: '700', fontSize: 15 },
  code: { color: '#78716c', fontSize: 11, letterSpacing: 1 },
  address: { color: '#44403c', marginTop: 4 },
  phone: { color: '#44403c', marginTop: 2 },
  distanceBadge: { backgroundColor: '#1c1917', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  distanceText: { color: '#fafaf9', fontSize: 12, fontWeight: '700' },
});
