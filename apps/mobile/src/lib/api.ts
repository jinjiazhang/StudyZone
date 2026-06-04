import { StudyZoneClient } from '@studyzone/api-client';
import Constants from 'expo-constants';
import { useAuth } from './auth';

const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';

export const api = new StudyZoneClient({
  baseUrl,
  getAccessToken: () => useAuth.getState().accessToken,
  onUnauthorized: () => useAuth.getState().clear(),
});
