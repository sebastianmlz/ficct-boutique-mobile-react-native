import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CatalogScreen } from '@/screens/catalog/CatalogScreen';
import { ProductDetailScreen } from '@/screens/product/ProductDetailScreen';
import { CartScreen } from '@/screens/cart/CartScreen';
import { CheckoutScreen } from '@/screens/cart/CheckoutScreen';
import { OrdersScreen } from '@/screens/orders/OrdersScreen';
import { CameraSearchScreen } from '@/screens/ai-search/CameraSearchScreen';
import { SimilarResultsScreen } from '@/screens/ai-search/SimilarResultsScreen';
import { BranchesScreen } from '@/screens/branches/BranchesScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { useCart } from '@/hooks/useCart';
import { AppIcon, IconName } from '@/components/AppIcon';
import { colors, fonts, fontWeight } from '@/theme';

const headerOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.display as string, fontSize: 20 },
  contentStyle: { backgroundColor: colors.paper },
} as const;

const CatalogStack = createNativeStackNavigator();
function CatalogNavigator() {
  return (
    <CatalogStack.Navigator screenOptions={headerOptions}>
      <CatalogStack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Catálogo' }} />
      <CatalogStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalle' }} />
    </CatalogStack.Navigator>
  );
}

const CartStack = createNativeStackNavigator();
function CartNavigator() {
  return (
    <CartStack.Navigator screenOptions={headerOptions}>
      <CartStack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrito' }} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Pago' }} />
      <CartStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Mis órdenes' }} />
    </CartStack.Navigator>
  );
}

const AIStack = createNativeStackNavigator();
function AINavigator() {
  return (
    <AIStack.Navigator screenOptions={headerOptions}>
      <AIStack.Screen name="CameraSearch" component={CameraSearchScreen} options={{ title: 'Búsqueda visual' }} />
      <AIStack.Screen name="SimilarResults" component={SimilarResultsScreen} options={{ title: 'Resultados' }} />
    </AIStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

// One factory keeps every tab icon consistent (SVG via AppIcon, never emoji).
const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <AppIcon name={name} color={color} size={size ?? 22} />;

export function AppTabs() {
  // Shared cart store: the badge updates live as items are added/removed.
  const { count } = useCart();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.mute,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, height: 60, paddingBottom: 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: fontWeight.medium },
      }}
    >
      <Tab.Screen name="Catalogo" component={CatalogNavigator} options={{ title: 'Catálogo', tabBarIcon: tabIcon('catalog') }} />
      <Tab.Screen name="Buscar" component={AINavigator} options={{ title: 'Buscar', tabBarIcon: tabIcon('search') }} />
      <Tab.Screen
        name="Carrito"
        component={CartNavigator}
        options={{
          title: 'Carrito',
          tabBarIcon: tabIcon('cart'),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.paper, fontSize: 10 },
        }}
      />
      <Tab.Screen name="Sucursales" component={BranchesScreen} options={{ title: 'Sucursales', tabBarIcon: tabIcon('branches') }} />
      <Tab.Screen name="Notificaciones" component={NotificationsScreen} options={{ title: 'Avisos', tabBarIcon: tabIcon('notifications') }} />
    </Tab.Navigator>
  );
}
