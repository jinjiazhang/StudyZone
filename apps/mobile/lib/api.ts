import { StudyZoneClient } from '@studyzone/api-client';
import Constants from 'expo-constants';
import { useAuthStore } from './auth-store';

/**
 * Resolution order:
 *   1. EXPO_PUBLIC_API_URL — set via .env.local for per-developer override
 *      (e.g. your LAN IP when testing on a real device).
 *   2. expo.extra.apiUrl in app.json — the committed default (localhost).
 *   3. Hard fallback.
 */
const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';

export const api = new StudyZoneClient({
  baseUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
});
