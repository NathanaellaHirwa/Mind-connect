/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2fdf7',
          100: '#dcfce8',
          200: '#bdf6d2',
          300: '#8be9b4',
          400: '#4dd487',
          500: '#23bd69',
          600: '#1b9e56',
          700: '#187c45',
          800: '#166239',
          900: '#134f30'
        }
      }
    }
  },
  plugins: []
};
