import React from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import type { Product } from '@/models';

const PRODUCTS_QUERY = gql`
  query MobileProducts {
    products(limit: 50) {
      id
      sku
      name
      category
      basePrice
      currency
      imageUrl
      isActive
      variants { id size color }
    }
  }
`;

type Nav = NavigationProp<{ ProductDetail: { productId: string } }>;

export function CatalogScreen() {
  const navigation = useNavigation<Nav>();
  const { data, loading, error, refetch } = useQuery<{ products: Product[] }>(PRODUCTS_QUERY);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={data?.products ?? []}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>Sin productos disponibles.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={{ color: '#78716c' }}>Sin imagen</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.meta}>{item.category} • {item.variants.length} variantes</Text>
          <Text style={styles.price}>{item.currency} {item.basePrice.toFixed(2)}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  err: { color: '#b91c1c', textAlign: 'center', marginBottom: 12 },
  retry: { backgroundColor: '#1c1917', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fafaf9' },
  empty: { color: '#78716c' },
  list: { padding: 12, gap: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: { backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  meta: { fontSize: 11, color: '#78716c', paddingHorizontal: 10, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 8 },
});
