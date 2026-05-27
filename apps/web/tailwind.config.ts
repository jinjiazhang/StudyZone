import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sz: {
          // Core Duolingo-inspired palette
          green: '#58CC02', // feather green – primary CTA
          'green-dark': '#58A700', // mask green – pressed/border bottom
          'green-soft': '#D7FFB8',
          mint: '#A8E6CF',
          orange: '#FF9600',
          'orange-dark': '#CC7900',
          gold: '#FFC800',
          'gold-dark': '#E5A500',
          rose: '#FF4B4B',
          'rose-dark': '#E63946',
          sky: '#1CB0F6',
          'sky-dark': '#0E8FCC',
          purple: '#CE82FF',
          'purple-dark': '#A560E6',
          ink: '#3C3C3C',
          'ink-soft': '#777777',
          mist: '#F7F7F7',
          cream: '#FFF9E5',
          line: '#E5E5E5',
        },
      },
      fontFamily: {
        sans: [
          '"Nunito"',
          '"Inter"',
          '"Noto Sans SC"',
          '"PingFang SC"',
          'system-ui',
          'sans-serif',
        ],
        display: ['"Nunito"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        heavy: '900',
      },
      boxShadow: {
        // Hard "stacked" button bottom – the duo signature look
        pop: '0 4px 0 0 rgba(0,0,0,0.10)',
        'pop-lg': '0 6px 0 0 rgba(0,0,0,0.10)',
        'pop-green': '0 4px 0 0 #58A700',
        'pop-green-lg': '0 6px 0 0 #58A700',
        'pop-orange': '0 4px 0 0 #CC7900',
        'pop-gold': '0 4px 0 0 #E5A500',
        'pop-sky': '0 4px 0 0 #0E8FCC',
        'pop-rose': '0 4px 0 0 #E63946',
        'pop-purple': '0 4px 0 0 #A560E6',
        'pop-ink': '0 4px 0 0 rgba(60,60,60,0.18)',
        card: '0 2px 0 0 rgba(0,0,0,0.06), 0 1px 4px rgba(15,23,42,0.06)',
        node: '0 6px 0 0 rgba(0,0,0,0.10)',
      },
      borderRadius: {
        chunky: '1rem',
        'chunky-lg': '1.5rem',
        'chunky-xl': '2rem',
      },
      backgroundImage: {
        'sz-grid':
          "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
        'sz-rainbow':
          'linear-gradient(135deg, #58CC02 0%, #1CB0F6 50%, #CE82FF 100%)',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        jiggle: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '50%': { transform: 'translateX(6px)' },
          '75%': { transform: 'translateX(-3px)' },
        },
        wiggle: {
          '0%,100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        confetti: {
          '0%': { transform: 'translateY(-10px) rotate(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(120vh) rotate(540deg)', opacity: '0' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(88,204,2,0.6)' },
          '50%': { boxShadow: '0 0 0 16px rgba(88,204,2,0)' },
        },
      },
      animation: {
        bounceIn: 'bounceIn 0.4s ease-out',
        jiggle: 'jiggle 0.35s ease-in-out',
        wiggle: 'wiggle 1.6s ease-in-out infinite',
        confetti: 'confetti 2.4s ease-in forwards',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
