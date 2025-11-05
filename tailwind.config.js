/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFE5F2',
          100: '#FFC2E0',
          200: '#FF99CC',
          300: '#FF70B8',
          400: '#FF47A4',
          500: '#FF0083',
          600: '#DB006F',
          700: '#B7005C',
          800: '#930049',
          900: '#6E0035',
        },
      },
    },
  },
  plugins: [],
};
