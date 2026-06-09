import { describe, expect, it, vi } from 'vitest';

import { slugifyUsername, resolveUniqueUsername, isValidUsername } from './username.util';

describe('slugifyUsername', () => {
  it('keeps ascii alphanumerics and lowercases', () => {
    expect(slugifyUsername('Cool_Kid 99')).toBe('cool_kid99');
  });

  it('falls back to "user" for purely non-ascii nicknames', () => {
    expect(slugifyUsername('天天')).toBe('user');
  });

  it('pads short slugs to the 3-char minimum', () => {
    expect(slugifyUsername('ab')).toBe('ab0');
  });

  it('truncates to 18 chars to leave room for a suffix', () => {
    expect(slugifyUsername('a'.repeat(40))).toHaveLength(18);
  });
});

describe('resolveUniqueUsername', () => {
  it('returns the bare slug when free', async () => {
    const taken = vi.fn().mockResolvedValue(false);
    expect(await resolveUniqueUsername('Alice', taken)).toBe('alice');
  });

  it('appends an incrementing suffix on collisions', async () => {
    const used = new Set(['alice', 'alice1']);
    const taken = vi.fn(async (c: string) => used.has(c));
    expect(await resolveUniqueUsername('Alice', taken)).toBe('alice2');
  });
});

describe('isValidUsername', () => {
  it('accepts 3-20 char handles', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('abc')).toBe(true);
    expect(isValidUsername('a'.repeat(21))).toBe(false);
    expect(isValidUsername('has space')).toBe(false);
  });
});
