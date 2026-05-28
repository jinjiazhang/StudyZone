import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StudyZoneClient } from '@studyzone/api-client';

interface AuthState {
  accessToken: string | null;
  email: string | null;
  set: (data: { accessToken: string; email: string }) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      email: null,
      set: ({ accessToken, email }) => set({ accessToken, email }),
      clear: () => set({ accessToken: null, email: null }),
    }),
    { name: 'studyzone-admin-auth', storage: createJSONStorage(() => localStorage) },
  ),
);

const baseUrl =
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000';

export const api = new StudyZoneClient({
  baseUrl,
  getAccessToken: () => useAuth.getState().accessToken,
  onUnauthorized: () => {
    useAuth.getState().clear();
    window.location.href = '/admin/login';
  },
});
