import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import type { Product } from '@/models';
import { AppEmptyState, AppErrorState, AppLoadingState, ProductCard } from '@/components';
import { colors, spacing } from '@/theme';

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

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        name={item.name}
        category={item.category}
        variantCount={item.variants.length}
        price={item.basePrice}
        currency={item.currency}
        imageUrl={item.imageUrl}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      />
    ),
    [navigation],
  );

  if (loading && !data) return <AppLoadingState label="Cargando catálogo…" />;
  if (error) {
    return (
      <AppErrorState
        message="No pudimos cargar el catálogo. Revisa tu conexión e inténtalo de nuevo."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        contentContainerStyle={styles.list}
        data={data?.products ?? []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        renderItem={renderItem}
        ListEmptyComponent={
          <AppEmptyState icon="catalog" title="Sin productos disponibles" subtitle="Vuelve pronto para ver nuevas prendas." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.md, gap: spacing.md },
  column: { gap: spacing.md },
});
