/**
 * StudyZone Mobile Design System — "友善 · 园地 · 清楚" redesign
 *
 * Visual DNA: keep the friendly gamified-learning genre (rounded, chunky,
 * mascot-led) but give StudyZone its own identity:
 *  - Green stays the brand / system / "correct" colour.
 *  - A multi-subject accent system so "我同时在学三门课" finally reads.
 *  - Calmer, warmer neutrals (subtly-toned whites/blacks) so subject colour
 *    shows up as tasteful accent rather than competing saturated slabs.
 *  - 3D layering reserved for the primary CTA + lesson nodes; content cards
 *    use a hairline + soft shadow so importance is finally legible.
 *
 * NOTE: existing token keys are preserved (only their values were refined),
 * so every screen/exercise re-skins automatically. New tokens are additive.
 */

// ── Colour palette ───────────────────────────────────────────────────────────
export const colors = {
  // Brand / system / "correct"
  green: '#58CC02',
  greenDark: '#46A302',
  greenSoft: '#E7F9D6',
  greenTint: '#F2FBE8',
  mint: '#A8E6CF',

  // Gamification accents
  orange: '#FF9D00', // streak 连胜
  orangeDark: '#CC7900',

  gold: '#FFC400', // XP
  goldDark: '#E5A500',

  rose: '#FF4B4B', // life 生命 / error
  roseDark: '#E63946',

  sky: '#1CB0F6', // gem 钻石 / interactive accent
  skyDark: '#0E8FCC',

  purple: '#9B6DFF',
  purpleDark: '#7A4ED6',

  // Warm neutrals (avoid >0.02 saturation per art direction)
  ink: '#34322E',
  inkSoft: '#7C7A74',
  inkFaint: '#AEACA4',

  mist: '#F5F6F1',
  cream: '#FFF9E5',
  line: '#E8E9E3',
  cardLine: '#E2E3DB',

  white: '#FFFFFF',
  black: '#000000',

  // Semantic aliases
  bg: '#FFFFFF',
  bgSoft: '#F5F6F1',
} as const;

// ── Multi-subject accent system ──────────────────────────────────────────────
// Backend supplies subject.color, but this is the canonical fallback palette
// and the source of truth for soft/dark tints used in covers, unit blocks,
// skill-tree nodes and progress bars.
export interface SubjectColor {
  name: string;
  color: string;
  dark: string;
  soft: string;
  glyph: string;
}

export const SUBJECT_COLORS: Record<string, SubjectColor> = {
  chinese: { name: '语文', color: '#EC4899', dark: '#C42A6E', soft: '#FCE4F0', glyph: '文' },
  math: { name: '数学', color: '#2D9CDB', dark: '#1E7AB0', soft: '#E2F1FB', glyph: '数' },
  english: { name: '英语', color: '#9B6DFF', dark: '#7A4ED6', soft: '#F0E9FE', glyph: 'En' },
  science: { name: '科学', color: '#12B886', dark: '#0E9670', soft: '#DEF6EE', glyph: '科' },
  social: { name: '文综', color: '#C77D2E', dark: '#9E6020', soft: '#F8ECDD', glyph: '综' },
} as const;

/** Resolve a subject's soft/dark tint from an arbitrary base colour. */
export function subjectTints(baseColor: string): { soft: string; dark: string } {
  const known = Object.values(SUBJECT_COLORS).find(
    (s) => s.color.toLowerCase() === baseColor.toLowerCase(),
  );
  if (known) return { soft: known.soft, dark: known.dark };
  return { soft: withAlpha(baseColor, 0.12), dark: shade(baseColor, -18) };
}

// ── Colour helpers ───────────────────────────────────────────────────────────
/** Lighten (+) or darken (−) a hex colour by a percentage of 255. */
export function shade(hex: string, pct: number): string {
  try {
    const n = parseInt(hex.slice(1), 16);
    const amt = Math.round((pct / 100) * 255);
    const r = clamp(((n >> 16) & 255) + amt);
    const g = clamp(((n >> 8) & 255) + amt);
    const b = clamp((n & 255) + amt);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}

/** Return an rgba() string for a hex colour at the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  try {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  } catch {
    return hex;
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

// ── Typography ───────────────────────────────────────────────────────────────
// Nunito carries both the rounded display and body roles (the design DNA keeps
// the genre's friendly rounded type; Baloo 2 would be the display upgrade once
// the font is bundled).
export const fonts = {
  sans: 'Nunito_700Bold',
  sansBold: 'Nunito_800ExtraBold',
  heavy: 'Nunito_900Black',
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  // Rounded display face (Duolingo-style) for numbers / Latin / brand. Chinese
  // glyphs fall back to the system CJK heavy face automatically.
  display: 'Fredoka_700Bold',
  displaySemi: 'Fredoka_600SemiBold',
} as const;

// ── Spacing / Radius ─────────────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16, // "chunky"
  xl: 24, // "chunky-lg"
  full: 999,
} as const;

// ── Elevation: the signature "3D press" reserved for primary CTAs + nodes ─────
export const elevation = {
  /** Primary chunky button: solid bottom border that compresses on press. */
  button: {
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  buttonPressed: {
    borderBottomWidth: 2,
    transform: [{ translateY: 2 }],
  },
  /** Content card: hairline + soft neutral shadow (lighter than the CTA). */
  card: {
    borderWidth: 2,
    borderColor: colors.cardLine,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
  },
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
  silver: '#9FB0BC',
  gold: '#FFC400',
  sapphire: '#1CB0F6',
  ruby: '#FF4B4B',
  emerald: '#2FB36B',
  diamond: '#56C8E6',
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
