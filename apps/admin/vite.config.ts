import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const adminBase = env.VITE_ADMIN_BASE ?? '/admin';
  const base = adminBase.endsWith('/') ? adminBase : `${adminBase}/`;

  return {
    base,
    plugins: [react()],
    server: { port: 3001 },
  };
});
