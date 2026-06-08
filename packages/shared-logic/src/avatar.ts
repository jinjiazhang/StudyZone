/**
 * Avatar identity helpers shared by web and mobile so a user always renders
 * with the same fallback color/initial across clients.
 */

export const AVATAR_COLORS = ['#1CB0F6', '#58CC02', '#CE82FF', '#FF9600', '#FF4B4B', '#2FB36B'];

/** Stable string hash (djb2-ish) used to pick a deterministic avatar color. */
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic fallback color for a user id. */
export function avatarColor(id: string): string {
  return AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length] ?? '#1CB0F6';
}

/** Uppercase first character of a nickname, used as the avatar fallback glyph. */
export function avatarInitial(nickname: string): string {
  return (nickname.trim()[0] ?? '?').toUpperCase();
}
