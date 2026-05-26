import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sz: {
          green: '#3FB984',
          mint: '#A8E6CF',
          orange: '#F97316',
          gold: '#FACC15',
          rose: '#F43F5E',
          sky: '#3B82F6',
          ink: '#1F2937',
          mist: '#F5F7FA',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        pop: '0 4px 0 0 rgba(0,0,0,0.1)',
        card: '0 2px 12px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        chunky: '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
