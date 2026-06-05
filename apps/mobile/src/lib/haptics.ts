import * as Haptics from 'expo-haptics';
import { usePrefs } from './prefs';

/**
 * Semantic haptics wrapper. Screens call intent-named helpers (not raw
 * impact/notification styles) so the feel stays consistent and can be globally
 * tuned or muted in one place.
 *
 * The on/off state is the persisted `haptics` pref (Settings → 震动反馈), read
 * live so the toggle takes effect immediately. All calls are fire-and-forget
 * and swallow errors — haptics must never block or crash UI, and they no-op on
 * devices/simulators without a haptics engine.
 */

function enabled() {
  return usePrefs.getState().haptics;
}

function run(fn: () => Promise<unknown>) {
  if (!enabled()) return;
  void fn().catch(() => {});
}

/** Light tick — selecting an option, tapping a token. */
export function hapticSelect() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium thunk — pressing a primary CTA (continue / submit). */
export function hapticPress() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Answer was correct. */
export function hapticCorrect() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Answer was wrong. */
export function hapticWrong() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

/** A heart was lost (heavier than a normal wrong answer). */
export function hapticHeartLost() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** Lesson finished — a small celebratory double-tap of success. */
export function hapticLessonComplete() {
  if (!enabled()) return;
  void (async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 140));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }
  })();
}

/** Lesson failed (out of hearts). */
export function hapticDefeat() {
  if (!enabled()) return;
  void (async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await new Promise((r) => setTimeout(r, 120));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // ignore
    }
  })();
}
