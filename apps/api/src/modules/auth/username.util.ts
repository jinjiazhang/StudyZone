/**
 * Username helpers shared by registration and the data migration backfill.
 *
 * Usernames are the public handle (Duolingo-style @username): case-insensitively
 * unique, `^[a-zA-Z0-9_]{3,20}$`. We preserve the user's chosen casing for
 * display but enforce uniqueness on `lower(username)` via a DB functional index.
 */

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

/**
 * Derive a username base from an arbitrary display nickname. Keeps ASCII
 * alphanumerics + underscore, lowercases, trims to 18 chars (leaving room for a
 * numeric suffix), and falls back to `user` when nothing usable remains (e.g.
 * a purely non-ASCII nickname like "天天").
 */
export function slugifyUsername(nickname: string): string {
  const slug = nickname
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '')
    .slice(0, 18);
  if (slug.length >= 3) return slug;
  // Pad short/empty slugs so they satisfy the 3-char minimum.
  return (slug || 'user').padEnd(3, '0');
}

/**
 * Resolve a unique username from a base, given a predicate that reports whether
 * a candidate is already taken (case-insensitive). Tries the base first, then
 * `base1`, `base2`, … truncating the base so the result never exceeds 20 chars.
 */
export async function resolveUniqueUsername(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugifyUsername(base);
  if (!(await isTaken(root))) return root;
  for (let i = 1; ; i += 1) {
    const suffix = String(i);
    const candidate = root.slice(0, 20 - suffix.length) + suffix;
    if (!(await isTaken(candidate))) return candidate;
  }
}
