/** Monday 00:00 UTC of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const day = d.getUTCDay(); // 0 = Sun
  const diff = (day + 6) % 7; // days back to Monday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}

/** Start of the week immediately before the week containing `d`. */
export function startOfPreviousWeek(d: Date): Date {
  const thisWeek = startOfWeek(d);
  return new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
