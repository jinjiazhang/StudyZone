'use client';

import { StudyZoneClient } from '@studyzone/api-client';
import { useAuthStore } from './auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = new StudyZoneClient({
  baseUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      useAuthStore.getState().clear();
      window.location.href = '/login';
    }
  },
});
