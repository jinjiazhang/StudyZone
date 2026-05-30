import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useAuthStore } from './auth-store';

/**
 * Tab-screen focus guard.
 *
 * On every focus (initial entry and tab switches):
 *  - if the auth store is hydrated and there is no access token, redirect to /login
 *  - otherwise, invalidate the supplied react-query keys so the screen pulls fresh data
 *
 * Use inside any tab screen that needs both behaviors:
 *
 *   useTabFocusGuard([['courses'], ['me']]);
 */
export function useTabFocusGuard(queryKeys: QueryKey[]): void {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Stable signature so re-renders that produce a fresh array literal don't
  // churn the focus callback. Keys are short string tuples, so JSON.stringify
  // is fine here.
  const keysSignature = JSON.stringify(queryKeys);

  useFocusEffect(
    useCallback(() => {
      const { accessToken, hydrated } = useAuthStore.getState();

      // Defensive: if SecureStore hasn't rehydrated yet, don't bounce on a
      // false negative. In practice tabs are only reachable via index.tsx
      // which gates on hydration, so this branch is rarely hit.
      if (hydrated && !accessToken) {
        router.replace('/login');
        return;
      }

      for (const key of queryKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, queryClient, keysSignature]),
  );
}
