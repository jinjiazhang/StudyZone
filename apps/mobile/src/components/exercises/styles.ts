import { StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/lib/theme';

/**
 * Shared styles for exercise components. Mirrors the small Tailwind utility
 * classes the web app reuses across exercises (option-tile, token-chip, prompt
 * card, etc.) so each题型 can stay focused on its own structure.
 */
export const exerciseStyles = StyleSheet.create({
  container: { gap: 12 },

  // Tiny uppercase tracker label above the prompt card.
  labelSmall: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Bordered prompt card (the source sentence / question / character).
  promptCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 16,
  },
  promptBold: { fontFamily: fonts.heavy, fontSize: 20, color: colors.ink },
  giantChar: { fontFamily: fonts.heavy, fontSize: 56, color: colors.ink, textAlign: 'center' },
  mathStatement: { fontFamily: fonts.heavy, fontSize: 36, color: colors.ink, textAlign: 'center' },

  // 3D puffy option tile (used by every choice-style exercise).
  optionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  optionTileActive: {
    borderColor: colors.sky,
    backgroundColor: '#EFF6FF',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeActive: { backgroundColor: colors.sky, borderColor: colors.sky },
  optionBadgeText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.inkSoft },
  optionBadgeTextActive: { color: colors.white },
  optionText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.ink, flex: 1 },
  optionTextActive: { color: colors.skyDark },

  // Multi-line / numeric text input.
  textInput: {
    backgroundColor: colors.mist,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 14,
    fontSize: 16,
    fontFamily: fonts.sansBold,
    color: colors.ink,
    minHeight: 60,
  },

  // Audio play / 慢速 buttons used by listening + image-choice prompts.
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.sky,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  audioBtnActive: { backgroundColor: colors.sky, borderColor: colors.skyDark },
  audioBtnText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.skyDark },
  audioBtnTextActive: { color: colors.white },

  // Per-exercise primary CTA.
  submitBtn: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.greenDark,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnPressed: { borderBottomWidth: 2, transform: [{ translateY: 2 }] },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
