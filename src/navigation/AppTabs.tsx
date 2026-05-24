import React from 'react';
import { Text } from 'react-native';
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

const CatalogStack = createNativeStackNavigator();
function CatalogNavigator() {
  return (
    <CatalogStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fafaf9' }, headerTintColor: '#1c1917' }}>
      <CatalogStack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Catálogo' }} />
      <CatalogStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalle' }} />
    </CatalogStack.Navigator>
  );
}

const CartStack = createNativeStackNavigator();
function CartNavigator() {
  return (
    <CartStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fafaf9' }, headerTintColor: '#1c1917' }}>
      <CartStack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrito' }} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Pago' }} />
      <CartStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Mis órdenes' }} />
    </CartStack.Navigator>
  );
}

const AIStack = createNativeStackNavigator();
function AINavigator() {
  return (
    <AIStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fafaf9' }, headerTintColor: '#1c1917' }}>
      <AIStack.Screen name="CameraSearch" component={CameraSearchScreen} options={{ title: 'Búsqueda visual' }} />
      <AIStack.Screen name="SimilarResults" component={SimilarResultsScreen} options={{ title: 'Resultados' }} />
    </AIStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1c1917',
        tabBarInactiveTintColor: '#78716c',
      }}
    >
      <Tab.Screen
        name="Catalogo"
        component={CatalogNavigator}
        options={{ title: 'Catálogo', tabBarIcon: () => <Text>👗</Text> }}
      />
      <Tab.Screen
        name="Buscar"
        component={AINavigator}
        options={{ title: 'Buscar', tabBarIcon: () => <Text>📷</Text> }}
      />
      <Tab.Screen
        name="Carrito"
        component={CartNavigator}
        options={{ title: 'Carrito', tabBarIcon: () => <Text>🛍️</Text> }}
      />
      <Tab.Screen
        name="Sucursales"
        component={BranchesScreen}
        options={{ title: 'Sucursales', tabBarIcon: () => <Text>📍</Text> }}
      />
      <Tab.Screen
        name="Notificaciones"
        component={NotificationsScreen}
        options={{ title: 'Avisos', tabBarIcon: () => <Text>🔔</Text> }}
      />
    </Tab.Navigator>
  );
}
