import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { useCart } from '@/hooks/useCart';
import { AppButton, AppCard, AppEmptyState, AppIcon, AppLoadingState } from '@/components';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type Nav = NavigationProp<{ Checkout: undefined }>;

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { items, subtotal, tax, total, remove, updateQuantity, hydrated } = useCart();

  if (!hydrated) return <AppLoadingState label="Cargando carrito…" />;
  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <AppEmptyState icon="cart" title="Tu carrito está vacío" subtitle="Explora el catálogo y agrega tus prendas favoritas." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.variantId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AppCard padded style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.productName}</Text>
                <Text style={styles.meta}>{item.size} · {item.color}</Text>
                <Text style={styles.meta}>{item.quantity} × BOB {item.unitPrice.toFixed(2)}</Text>
              </View>
              <Text style={styles.line}>BOB {(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
            <View style={styles.controls}>
              <View style={styles.stepper}>
                <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.variantId, item.quantity - 1)}>
                  <AppIcon name="minus" size={16} color={colors.ink} />
                </Pressable>
                <Text style={styles.qty}>{item.quantity}</Text>
                <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.variantId, item.quantity + 1)}>
                  <AppIcon name="plus" size={16} color={colors.ink} />
                </Pressable>
              </View>
              <Pressable style={styles.remove} onPress={() => remove(item.variantId)}>
                <AppIcon name="trash" size={16} color={colors.danger} />
                <Text style={styles.removeText}>Quitar</Text>
              </Pressable>
            </View>
          </AppCard>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totals}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>BOB {subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totals}>
          <Text style={styles.totalsLabel}>IVA (13%)</Text>
          <Text style={styles.totalsValue}>BOB {tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totals, styles.grand]}>
          <Text style={styles.totalsLabelTotal}>Total</Text>
          <Text style={styles.totalsValueTotal}>BOB {total.toFixed(2)}</Text>
        </View>
        <AppButton label="Confirmar pedido" icon="chevronRight" onPress={() => navigation.navigate('Checkout')} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  emptyWrap: { flex: 1, backgroundColor: colors.paper, justifyContent: 'center' },
  list: { padding: spacing.md, gap: spacing.md },
  card: { gap: spacing.md },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  name: { fontWeight: fontWeight.semibold, fontSize: fontSize.base, color: colors.ink },
  meta: { color: colors.mute, fontSize: fontSize.xs },
  line: { fontWeight: fontWeight.bold, fontSize: fontSize.base, color: colors.ink },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyBtn: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  qty: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, minWidth: 16, textAlign: 'center', color: colors.ink },
  remove: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  removeText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  footer: { padding: spacing.lg, borderTopColor: colors.line, borderTopWidth: 1, backgroundColor: colors.white, gap: 6 },
  totals: { flexDirection: 'row', justifyContent: 'space-between' },
  totalsLabel: { color: colors.mute, fontSize: fontSize.sm },
  totalsValue: { color: colors.ink, fontSize: fontSize.sm },
  grand: { marginTop: 4, marginBottom: spacing.md, paddingTop: 8, borderTopColor: colors.line, borderTopWidth: 1 },
  totalsLabelTotal: { fontWeight: fontWeight.bold, fontSize: fontSize.md, color: colors.ink },
  totalsValueTotal: { fontWeight: fontWeight.bold, fontSize: fontSize.md, color: colors.accent },
});
