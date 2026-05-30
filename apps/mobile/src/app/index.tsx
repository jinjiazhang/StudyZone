import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';

export default function Index() {
  const token = useAuthStore((s) => s.accessToken);
  return <Redirect href={token ? '/(tabs)/learn' : '/login'} />;
}
