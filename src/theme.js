import { Platform } from 'react-native';

// Black-and-green identity carried over from PassKeep 1.x, refined: a deep
// green-tinted black, hairline borders instead of glow, one mint accent.
export const colors = {
  bg: '#090D0B',
  panel: '#0F1512',
  raised: '#16201B',
  line: '#1F2D26',
  lineStrong: '#2C4137',
  text: '#E8F0EA',
  muted: '#8A9C90',
  faint: '#5A6A61',
  accent: '#3DEB8B',
  accentDim: 'rgba(61, 235, 139, 0.13)',
  onAccent: '#04140B',
  danger: '#FF6B6B',
  dangerDim: 'rgba(255, 107, 107, 0.13)',
  warn: '#F2B84B',
  warnDim: 'rgba(242, 184, 75, 0.13)',
  overlay: 'rgba(3, 6, 4, 0.78)',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const MAX_WIDTH = 720;

// Loaded in App.js via expo-font. Used for the wordmark and secret values only.
export const mono = 'SpaceMono';

export const type = {
  display: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  small: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
};

export const noOutline = Platform.select({ web: { outlineStyle: 'none' }, default: {} });

export const TINTS = [
  ['#12301F', '#5CE6A0'],
  ['#102B35', '#5CC8F0'],
  ['#291F3A', '#B79BFF'],
  ['#35281A', '#F2B063'],
  ['#351C24', '#F08DA6'],
  ['#20301A', '#B0E06A'],
];
