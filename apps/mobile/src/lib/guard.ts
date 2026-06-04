import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { checkSession } from './session';
import { useAuth } from './auth';

/**
 * Tab-screen focus guard.
 *
 * On every focus (initial entry and tab switches):
 *  - if the auth store is hydrated and there is no access token, redirect to /login
 *  - otherwise, invalidate the supplied react-query keys so the screen pulls fresh data
 *
 * Use inside any tab screen that needs both behaviors:
 *
 *   useTabGuard([['courses'], ['me']]);
 */
export function useTabGuard(queryKeys: QueryKey[]): void {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Stable signature so re-renders that produce a fresh array literal don't
  // churn the focus callback. Keys are short string tuples, so JSON.stringify
  // is fine here.
  const keysSignature = JSON.stringify(queryKeys);

  useFocusEffect(
    useCallback(() => {
      const { accessToken, hydrated } = useAuth.getState();
      let cancelled = false;

      // Defensive: if SecureStore hasn't rehydrated yet, don't bounce on a
      // false negative. In practice tabs are only reachable via index.tsx
      // which gates on hydration, so this branch is rarely hit.
      if (!hydrated) return;

      if (!accessToken) {
        router.replace('/login');
        return;
      }

      async function refreshAfterSessionCheck() {
        try {
          const valid = await checkSession();
          if (cancelled) return;

          if (!valid) {
            router.replace('/login');
            return;
          }

          for (const key of queryKeys) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        } catch {
          if (!cancelled) {
            for (const key of queryKeys) {
              queryClient.invalidateQueries({ queryKey: key });
            }
          }
        }
      }

      refreshAfterSessionCheck();

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, queryClient, keysSignature]),
  );
}
