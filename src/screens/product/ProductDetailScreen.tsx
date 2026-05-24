import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { gql, useQuery } from '@apollo/client';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import type { Product, Variant } from '@/models';
import { useCart } from '@/hooks/useCart';

const PRODUCT_QUERY = gql`
  query MobileProduct($id: UUID!) {
    product(id: $id) {
      id
      sku
      name
      description
      category
      basePrice
      currency
      imageUrl
      variants {
        id
        size
        color
        priceOverride
        stock { id quantity branch { id name code } }
      }
    }
  }
`;

type Route = RouteProp<{ ProductDetail: { productId: string } }>;

export function ProductDetailScreen() {
  const route = useRoute<Route>();
  const { add } = useCart();
  const [selected, setSelected] = useState<Variant | null>(null);
  const { data, loading, error } = useQuery<{ product: Product }>(PRODUCT_QUERY, {
    variables: { id: route.params.productId },
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error || !data?.product) return <View style={styles.center}><Text style={styles.err}>{error?.message ?? 'Producto no encontrado'}</Text></View>;

  const product = data.product;
  const totalStock = (variant: Variant) => variant.stock.reduce((s, e) => s + e.quantity, 0);

  const onAdd = async (): Promise<void> => {
    if (!selected) {
      Alert.alert('Seleccione una variante');
      return;
    }
    const unit = selected.priceOverride ?? product.basePrice;
    await add({
      variantId: selected.id,
      productId: product.id,
      productName: product.name,
      size: selected.size,
      color: selected.color,
      unitPrice: unit,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
    Alert.alert('Añadido al carrito');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={{ color: '#78716c' }}>Sin imagen</Text>
        </View>
      )}
      <Text style={styles.sku}>SKU {product.sku}</Text>
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.price}>{product.currency} {product.basePrice.toFixed(2)}</Text>
      {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

      <Text style={styles.section}>Variantes</Text>
      <View style={styles.variantGrid}>
        {product.variants.map((v) => {
          const stock = totalStock(v);
          const selectedNow = selected?.id === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              style={[styles.variant, selectedNow && styles.variantSelected, stock === 0 && styles.variantDisabled]}
              disabled={stock === 0}
              onPress={() => setSelected(v)}
            >
              <Text style={[styles.variantText, selectedNow && styles.variantTextSelected]}>{v.size} • {v.color}</Text>
              <Text style={styles.variantStock}>{stock > 0 ? `${stock} en stock` : 'Agotado'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={onAdd} disabled={!selected}>
        <Text style={styles.addText}>Añadir al carrito</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  err: { color: '#b91c1c' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#f5f5f4' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  sku: { color: '#78716c', fontSize: 11, marginTop: 12, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  price: { fontSize: 20, fontWeight: '700', marginTop: 6, color: '#1c1917' },
  description: { color: '#44403c', marginTop: 12, lineHeight: 20 },
  section: { fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  variantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variant: { borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  variantSelected: { borderColor: '#1c1917', backgroundColor: '#1c1917' },
  variantDisabled: { opacity: 0.4 },
  variantText: { color: '#1c1917', fontWeight: '600', fontSize: 13 },
  variantTextSelected: { color: '#fafaf9' },
  variantStock: { color: '#78716c', fontSize: 11, marginTop: 2 },
  addButton: { marginTop: 28, backgroundColor: '#1c1917', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  addText: { color: '#fafaf9', fontWeight: '600', fontSize: 15 },
});
