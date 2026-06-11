import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { useCart } from '@/hooks/useCart';
import { presentLocalNotification } from '@/services/notifications/notifications.service';
import type { Branch } from '@/models';
import { AppButton, AppCard, AppIcon, AppLoadingState, ScreenContainer, SectionHeader } from '@/components';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

const BRANCHES_QUERY = gql`query Branches { branches { id code name } }`;

const CREATE_SALE = gql`
  mutation CreateSale($input: CreateSaleInput!) {
    createSale(input: $input) { id status total currency }
  }
`;

const CONFIRM_SALE = gql`
  mutation ConfirmSale($saleId: UUID!) {
    confirmSale(saleId: $saleId) { id code status }
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
      Alert.alert('Selecciona una sucursal');
      return;
    }
    try {
      const saleRes = await createSale({
        variables: { input: { branchId, items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) } },
      });
      const saleId: string | undefined = saleRes.data?.createSale?.id;
      if (!saleId) {
        Alert.alert('No se pudo crear el pedido', 'Inténtalo de nuevo en unos momentos.');
        return;
      }
      const confirmRes = await confirmSale({ variables: { saleId } });
      const order = confirmRes.data?.confirmSale;
      if (!order) {
        Alert.alert('No se pudo confirmar el pedido', 'Inténtalo de nuevo en unos momentos.');
        return;
      }
      await clear();
      void presentLocalNotification(
        'Pedido confirmado',
        `Tu orden ${order.code} fue registrada. ¡Gracias por tu compra!`,
        { event: 'order-confirmed', orderCode: order.code },
      );
      Alert.alert('Orden confirmada', `Código de orden: ${order.code}`, [
        { text: 'Ver órdenes', onPress: () => navigation.navigate('Orders') },
      ]);
    } catch {
      Alert.alert('No se pudo completar el pedido', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  if (loadingBranches) return <AppLoadingState label="Cargando sucursales…" />;

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Sucursal" subtitle="Elige dónde recoger tu pedido" />
      <View style={styles.branches}>
        {data?.branches.map((b) => {
          const active = branchId === b.id;
          return (
            <Pressable key={b.id} style={[styles.branch, active && styles.branchSelected]} onPress={() => setBranchId(b.id)}>
              <AppIcon name="location" size={18} color={active ? colors.paper : colors.accent} />
              <Text style={[styles.branchText, active && styles.branchTextSelected]}>
                {b.name} ({b.code})
              </Text>
              {active ? <AppIcon name="check" size={18} color={colors.paper} /> : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Resumen" />
      <AppCard style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Productos</Text>
          <Text style={styles.summaryValue}>{items.length}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.summaryLabelTotal}>Total</Text>
          <Text style={styles.summaryValueTotal}>BOB {total.toFixed(2)}</Text>
        </View>
      </AppCard>

      <AppButton label="Confirmar pedido" icon="check" onPress={place} loading={creating || confirming} fullWidth style={styles.confirm} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  branches: { gap: spacing.sm },
  branch: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.white },
  branchSelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  branchText: { flex: 1, color: colors.ink, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  branchTextSelected: { color: colors.paper },
  summary: { gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.mute, fontSize: fontSize.sm },
  summaryValue: { color: colors.ink, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  summaryTotal: { paddingTop: 8, borderTopColor: colors.line, borderTopWidth: 1 },
  summaryLabelTotal: { color: colors.ink, fontWeight: fontWeight.bold, fontSize: fontSize.md },
  summaryValueTotal: { color: colors.accent, fontWeight: fontWeight.bold, fontSize: fontSize.md },
  confirm: { marginTop: spacing.xs },
});
