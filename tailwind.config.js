/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f0e0d',
        coal: '#171513',
        umber: '#211d18',
        smoke: '#2c261f',
        gold: {
          200: '#fde9ac',
          300: '#fbd875',
          400: '#f8c53e',
          500: '#e9a81a',
          600: '#c48512',
          700: '#8f5f0c',
        },
        cream: '#f1e8d4',
        mute: '#a99d86',
        veg: '#2e9d4d',
        nonveg: '#c0392b',
      },
      fontFamily: {
        display: ['Amiri', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(248,197,62,0.25), 0 10px 40px -12px rgba(233,168,26,0.35)',
        deep: '0 30px 60px -30px rgba(0,0,0,0.9)',
      },
      keyframes: {
        steam: {
          '0%': { transform: 'translateY(40px) scaleX(1)', opacity: '0' },
          '25%': { opacity: '0.55' },
          '100%': { transform: 'translateY(-260px) scaleX(1.6)', opacity: '0' },
        },
        spinslow: {
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        steam: 'steam 9s ease-out infinite',
        spinslow: 'spinslow 60s linear infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
