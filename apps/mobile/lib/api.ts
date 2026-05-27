import { StudyZoneClient } from '@studyzone/api-client';
import Constants from 'expo-constants';
import { useAuthStore } from './auth-store';

const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';

export const api = new StudyZoneClient({
  baseUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().clear(),
});
