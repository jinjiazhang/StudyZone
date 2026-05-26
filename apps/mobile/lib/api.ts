import { StudyZoneClient } from '@studyzone/api-client';
import Constants from 'expo-constants';
import { useAuthStore } from './auth-store';

const baseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:4000';

export const api = new StudyZoneClient({
  baseUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
});
