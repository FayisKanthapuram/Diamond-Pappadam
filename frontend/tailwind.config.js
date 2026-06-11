/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#c2dbff',
          300: '#94c1ff',
          400: '#5e9eff',
          500: '#387aff',
          600: '#1f5eff',
          700: '#174cd9',
          800: '#163fb0',
          900: '#17378c',
        },
      },
    },
  },
  plugins: [],
};
