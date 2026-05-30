/**
 * StudyZone Mobile Design System
 * Mirrors the Web app's Duolingo-inspired Tailwind config.
 */

// ── Colour palette (matches tailwind.config.ts sz-* tokens) ──────────────────
export const colors = {
  green: '#58CC02',
  greenDark: '#58A700',
  greenSoft: '#D7FFB8',
  mint: '#A8E6CF',

  orange: '#FF9600',
  orangeDark: '#CC7900',

  gold: '#FFC800',
  goldDark: '#E5A500',

  rose: '#FF4B4B',
  roseDark: '#E63946',

  sky: '#1CB0F6',
  skyDark: '#0E8FCC',

  purple: '#CE82FF',
  purpleDark: '#A560E6',

  ink: '#3C3C3C',
  inkSoft: '#777777',

  mist: '#F7F7F7',
  cream: '#FFF9E5',
  line: '#E5E5E5',

  white: '#FFFFFF',
  black: '#000000',

  // Semantic aliases
  bg: '#FFFFFF',
  bgSoft: '#F7F7F7',
} as const;

// ── Typography ───────────────────────────────────────────────────────────────
export const fonts = {
  sans: 'Nunito_700Bold',
  sansBold: 'Nunito_800ExtraBold',
  heavy: 'Nunito_900Black',
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
} as const;

// ── Spacing / Radius / Shadow ────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,  // "chunky"
  xl: 24,  // "chunky-lg"
  full: 999,
} as const;

// ── Tier system (league) ─────────────────────────────────────────────────────
export const TIER_LABEL: Record<string, string> = {
  bronze: '青铜联赛',
  silver: '白银联赛',
  gold: '黄金联赛',
  sapphire: '蓝宝石联赛',
  ruby: '红宝石联赛',
  emerald: '翡翠联赛',
  diamond: '钻石联赛',
};

export const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#B8B8B8',
  gold: '#FFC800',
  sapphire: '#1CB0F6',
  ruby: '#FF4B4B',
  emerald: '#58CC02',
  diamond: '#7DD9FF',
};

export const TIER_EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  sapphire: '🔷',
  ruby: '♦️',
  emerald: '💚',
  diamond: '💎',
};
