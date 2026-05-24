import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { useCart } from '@/hooks/useCart';

type Nav = NavigationProp<{ Checkout: undefined }>;

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { items, subtotal, tax, total, remove, updateQuantity, hydrated } = useCart();

  if (!hydrated) return <View style={styles.center}><Text>Cargando…</Text></View>;
  if (items.length === 0)
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Tu carrito está vacío.</Text>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.variantId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.productName}</Text>
              <Text style={styles.meta}>{item.size} • {item.color}</Text>
              <Text style={styles.meta}>{item.quantity} × BOB {item.unitPrice.toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.line}>BOB {(item.quantity * item.unitPrice).toFixed(2)}</Text>
              <View style={styles.controls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.variantId, item.quantity - 1)}>
                  <Text style={styles.qtyText}>−</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: 8 }}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.variantId, item.quantity + 1)}>
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => remove(item.variantId)}>
                  <Text style={styles.removeText}>Quitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totals}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text>BOB {subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totals}>
          <Text style={styles.totalsLabel}>IVA (13%)</Text>
          <Text>BOB {tax.toFixed(2)}</Text>
        </View>
        <View style={styles.totals}>
          <Text style={styles.totalsLabelTotal}>Total</Text>
          <Text style={styles.totalsValueTotal}>BOB {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkout} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutText}>Confirmar pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#78716c' },
  list: { padding: 12, gap: 10 },
  row: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12 },
  name: { fontWeight: '700' },
  meta: { color: '#78716c', fontSize: 12, marginTop: 2 },
  line: { fontWeight: '700', marginBottom: 8 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700' },
  removeBtn: { marginLeft: 8 },
  removeText: { color: '#b91c1c', fontSize: 12 },
  footer: { padding: 16, borderTopColor: '#e7e5e4', borderTopWidth: 1, backgroundColor: '#fff' },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalsLabel: { color: '#78716c' },
  totalsLabelTotal: { fontWeight: '700' },
  totalsValueTotal: { fontWeight: '700' },
  checkout: { backgroundColor: '#1c1917', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  checkoutText: { color: '#fafaf9', fontWeight: '700' },
});
