import { ApiClientError } from '@studyzone/api-client';
import { api } from './api';
import { useAuth } from './auth';

export async function checkSession(): Promise<boolean> {
  const { accessToken, clear } = useAuth.getState();

  if (!accessToken) return false;

  try {
    await api.me();
    return true;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      clear();
      return false;
    }

    throw error;
  }
}
