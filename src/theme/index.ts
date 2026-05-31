// FICCT Boutique — shared design tokens (React Native).
//
// These values intentionally mirror the Angular admin design tokens
// (tailwind.config.js + styles.css) so the customer app and the admin web
// share one brand system: same palette, radii, spacing rhythm and type scale.
import { Platform, TextStyle } from 'react-native';

export const colors = {
  // Brand (identical hex to Angular `boutique.*`)
  ink: '#1c1917', // primary text + primary buttons
  paper: '#fafaf9', // app background (warm off-white)
  accent: '#9a3412', // terracotta — brand accent
  accentSoft: '#fed7aa', // soft peach — accent surfaces
  mute: '#78716c', // secondary text
  line: '#e7e5e4', // hairline borders
  white: '#ffffff',
  surface: '#ffffff', // cards
  surfaceAlt: '#f5f5f4', // placeholders / subtle fills
  inkSoft: '#44403c', // stone-700

  // Status language (matches Angular badge palette)
  successBg: '#ecfdf5',
  successFg: '#047857',
  warnBg: '#fffbeb',
  warnFg: '#b45309',
  neutralBg: '#f5f5f4',
  neutralFg: '#57534e',
  dangerBg: '#fef2f2',
  dangerFg: '#b91c1c',
  danger: '#b91c1c',
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

// 4px spacing rhythm — same scale used by the admin.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

// Display/serif family for the wordmark and section titles — echoes the admin's
// "DM Serif Display". Falls back to the platform serif on native.
export const fonts = {
  display: Platform.select({ web: 'Georgia, "DM Serif Display", "Times New Roman", serif', default: 'serif' }),
  body: Platform.select({ web: 'Inter, system-ui, -apple-system, sans-serif', default: undefined }),
} as const;

export const shadow = {
  card: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(28,25,23,0.06), 0 1px 3px rgba(28,25,23,0.05)' } as object,
    default: {
      shadowColor: '#1c1917',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
  }),
} as const;

export const theme = { colors, radius, spacing, fontSize, fontWeight, fonts, shadow };
export default theme;
