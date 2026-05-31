// ProductCard — catalog/result tile. Memoized so list scrolling doesn't
// re-render unchanged cards. Square image with a branded placeholder, name,
// category + variant meta, and price. Optional badge (e.g. similarity score).
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '@/theme';
import { AppCard } from './AppCard';
import { AppBadge } from './AppBadge';
import { AppIcon } from './AppIcon';

interface Props {
  name: string;
  category?: string;
  variantCount?: number;
  price?: number;
  currency?: string;
  imageUrl?: string | null;
  badge?: string;
  onPress?: () => void;
}

function ProductCardBase({ name, category, variantCount, price, currency = 'BOB', imageUrl, badge, onPress }: Props) {
  return (
    <AppCard onPress={onPress} padded={false} style={styles.card}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <AppIcon name="image" size={22} color={colors.mute} />
          </View>
        )}
        {badge ? (
          <View style={styles.badge}>
            <AppBadge label={badge} tone="accent" />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {category != null ? (
          <Text style={styles.meta} numberOfLines={1}>
            {category}
            {variantCount != null ? ` · ${variantCount} ${variantCount === 1 ? 'variante' : 'variantes'}` : ''}
          </Text>
        ) : null}
        {price != null ? (
          <Text style={styles.price}>
            {currency} {price.toFixed(2)}
          </Text>
        ) : null}
      </View>
    </AppCard>
  );
}

export const ProductCard = React.memo(ProductCardBase);

const styles = StyleSheet.create({
  card: { flex: 1 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1 },
  placeholder: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  body: { padding: spacing.md, gap: 3 },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.ink, lineHeight: 18 },
  meta: { fontSize: fontSize.xs, color: colors.mute },
  price: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.ink, marginTop: 2 },
});

export default ProductCard;
