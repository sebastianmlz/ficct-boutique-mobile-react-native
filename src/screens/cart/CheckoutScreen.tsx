import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { useCart } from '@/hooks/useCart';
import type { Branch } from '@/models';

const BRANCHES_QUERY = gql`query Branches { branches { id code name } }`;

const CREATE_SALE = gql`
  mutation CreateSale($input: CreateSaleInput!) {
    createSale(input: $input) {
      id
      status
      total
      currency
    }
  }
`;

const CONFIRM_SALE = gql`
  mutation ConfirmSale($saleId: UUID!) {
    confirmSale(saleId: $saleId) {
      id
      code
      status
    }
  }
`;

type Nav = NavigationProp<{ Orders: undefined }>;

export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { items, clear, total } = useCart();
  const { data, loading: loadingBranches } = useQuery<{ branches: Branch[] }>(BRANCHES_QUERY);
  const [createSale, { loading: creating }] = useMutation(CREATE_SALE);
  const [confirmSale, { loading: confirming }] = useMutation(CONFIRM_SALE);
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (data?.branches && data.branches.length > 0 && !branchId) {
      setBranchId(data.branches[0].id);
    }
  }, [data, branchId]);

  const place = async (): Promise<void> => {
    if (!branchId) {
      Alert.alert('Seleccione una sucursal');
      return;
    }
    try {
      const saleRes = await createSale({
        variables: {
          input: {
            branchId,
            items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          },
        },
      });
      const saleId: string | undefined = saleRes.data?.createSale?.id;
      if (!saleId) {
        Alert.alert('Error', saleRes.errors?.[0]?.message ?? 'No se pudo crear la venta');
        return;
      }
      const confirmRes = await confirmSale({ variables: { saleId } });
      const order = confirmRes.data?.confirmSale;
      if (!order) {
        Alert.alert('Error', confirmRes.errors?.[0]?.message ?? 'No se pudo confirmar la venta');
        return;
      }
      await clear();
      Alert.alert('Orden confirmada', `Código de orden: ${order.code}`, [
        { text: 'Ver órdenes', onPress: () => navigation.navigate('Orders') },
      ]);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  if (loadingBranches) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>Sucursal</Text>
      <View style={{ gap: 8 }}>
        {data?.branches.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={[styles.branch, branchId === b.id && styles.branchSelected]}
            onPress={() => setBranchId(b.id)}
          >
            <Text style={[styles.branchText, branchId === b.id && styles.branchTextSelected]}>
              {b.name} ({b.code})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Resumen</Text>
      <View style={styles.summary}>
        <Text>Productos: {items.length}</Text>
        <Text>Total: BOB {total.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.confirm} onPress={place} disabled={creating || confirming}>
        {creating || confirming ? (
          <ActivityIndicator color="#fafaf9" />
        ) : (
          <Text style={styles.confirmText}>Confirmar pedido</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  branch: { borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  branchSelected: { borderColor: '#1c1917', backgroundColor: '#1c1917' },
  branchText: { color: '#1c1917', fontWeight: '600' },
  branchTextSelected: { color: '#fafaf9' },
  summary: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  confirm: { marginTop: 24, backgroundColor: '#9a3412', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fafaf9', fontWeight: '700' },
});
