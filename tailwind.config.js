/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2c7be5',
          50: '#e8f1ff',
          100: '#d7e7ff',
          200: '#a9caff',
          300: '#7bafff',
          400: '#4c93ff',
          500: '#2c7be5',
          600: '#205fba',
          700: '#16458a',
          800: '#0d2c5b',
          900: '#05162e'
        }
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        soft: '0 8px 20px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: [],
}