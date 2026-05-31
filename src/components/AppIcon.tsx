// AppIcon — single icon abstraction for the whole app.
//
// Backed by Feather (the icon family Lucide is forked from), so the customer
// app and the Lucide-based admin web share the same 24px / 2px-stroke / round
// visual language. UI code references *semantic* names (e.g. "cart"), never a
// raw Feather name or an emoji, so the icon set can be swapped in one place.
import React from 'react';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme';

export type IconName =
  | 'catalog'
  | 'search'
  | 'cart'
  | 'branches'
  | 'notifications'
  | 'image'
  | 'camera'
  | 'gallery'
  | 'check'
  | 'success'
  | 'alert'
  | 'close'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'chevronRight'
  | 'back'
  | 'package'
  | 'logout'
  | 'location'
  | 'navigation'
  | 'bellOff'
  | 'creditCard'
  | 'refresh'
  | 'inbox'
  | 'info'
  | 'star'
  | 'phone'
  | 'mapOff'
  | 'tag';

const MAP: Record<IconName, React.ComponentProps<typeof Feather>['name']> = {
  catalog: 'grid',
  search: 'camera',
  cart: 'shopping-bag',
  branches: 'map-pin',
  notifications: 'bell',
  image: 'image',
  camera: 'camera',
  gallery: 'image',
  check: 'check',
  success: 'check-circle',
  alert: 'alert-triangle',
  close: 'x',
  plus: 'plus',
  minus: 'minus',
  trash: 'trash-2',
  chevronRight: 'chevron-right',
  back: 'arrow-left',
  package: 'package',
  logout: 'log-out',
  location: 'map-pin',
  navigation: 'navigation',
  bellOff: 'bell-off',
  creditCard: 'credit-card',
  refresh: 'refresh-cw',
  inbox: 'inbox',
  info: 'info',
  star: 'star',
  phone: 'phone',
  mapOff: 'map-pin',
  tag: 'tag',
};

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

export function AppIcon({ name, size = 20, color = colors.ink }: Props) {
  return <Feather name={MAP[name]} size={size} color={color} />;
}

export default AppIcon;
