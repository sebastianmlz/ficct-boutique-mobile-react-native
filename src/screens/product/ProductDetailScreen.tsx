import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { gql, useQuery } from '@apollo/client';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import type { Product, Variant } from '@/models';
import { useCart } from '@/hooks/useCart';
import { AppBadge, AppButton, AppErrorState, AppIcon, AppLoadingState, ScreenContainer } from '@/components';
import { colors, fonts, fontSize, fontWeight, radius, spacing } from '@/theme';

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

  if (loading) return <AppLoadingState label="Cargando producto…" />;
  if (error || !data?.product) {
    return <AppErrorState title="Producto no encontrado" message="No pudimos cargar este producto. Vuelve al catálogo e inténtalo de nuevo." />;
  }

  const product = data.product;
  const totalStock = (variant: Variant) => variant.stock.reduce((s, e) => s + e.quantity, 0);

  const onAdd = async (): Promise<void> => {
    if (!selected) return;
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
    Alert.alert('Añadido al carrito', `${product.name} · ${selected.size} / ${selected.color}`);
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.imageWrap}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <AppIcon name="image" size={28} color={colors.mute} />
          </View>
        )}
      </View>

      <View style={styles.head}>
        <Text style={styles.sku}>SKU {product.sku}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>
          {product.currency} {product.basePrice.toFixed(2)}
        </Text>
        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
      </View>

      <Text style={styles.section}>Variantes</Text>
      <View style={styles.variantGrid}>
        {product.variants.map((v) => {
          const stock = totalStock(v);
          const selectedNow = selected?.id === v.id;
          const out = stock === 0;
          return (
            <Pressable
              key={v.id}
              style={[styles.variant, selectedNow && styles.variantSelected, out && styles.variantDisabled]}
              disabled={out}
              onPress={() => setSelected(v)}
            >
              <Text style={[styles.variantText, selectedNow && styles.variantTextSelected]}>
                {v.size} · {v.color}
              </Text>
              <View style={styles.variantStock}>
                <AppBadge label={out ? 'Agotado' : `${stock} en stock`} tone={out ? 'deleted' : 'active'} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppButton
        label={selected ? 'Añadir al carrito' : 'Selecciona una variante'}
        icon="cart"
        onPress={onAdd}
        disabled={!selected}
        fullWidth
        style={styles.add}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageWrap: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  head: { gap: 4 },
  sku: { color: colors.mute, fontSize: fontSize.xs, letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: fontSize.xxl, color: colors.ink, letterSpacing: -0.3 },
  price: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.accent, marginTop: 2 },
  description: { color: colors.inkSoft, marginTop: spacing.sm, lineHeight: 21, fontSize: fontSize.sm },
  section: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.ink },
  variantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  variant: { borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, gap: 6 },
  variantSelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  variantDisabled: { opacity: 0.45 },
  variantText: { color: colors.ink, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  variantTextSelected: { color: colors.paper },
  variantStock: { alignSelf: 'flex-start' },
  add: { marginTop: spacing.sm },
});
