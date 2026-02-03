/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cloud-white': '#F7F9FC',
        'sunny-orange': {
          50: '#FFF8F1',
          100: '#FFECD9',
          200: '#FFD1B0',
          300: '#FFB07D',
          400: '#FF8C42', // Base color from PRD
          500: '#F5701C',
          600: '#D4560D',
          DEFAULT: '#FF8C42',
        },
        'graphite-gray': '#636E72',
      }
    },
  },
  plugins: [],
}
