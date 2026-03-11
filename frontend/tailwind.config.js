/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8f7ff',
          100: '#f0edff',
          200: '#e6deff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4c5bbc',
          800: '#3a428f',
          900: '#2d3466',
        }
      }
    },
  },
  plugins: [],
}
