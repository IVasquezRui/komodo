/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        komodo: {
          primary: '#6D28D9',
          vibrant: '#7C3AED',
          deep: '#4C1D95',
          cta: '#10B981',
          'cta-hover': '#059669',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          lavender: '#F5F3FF',
          slate: '#F8FAFC',
          border: '#DDD6FE',
          dark: '#0D091A',
          'dark-card': '#15102B',
        },
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
        },
        slate: {
          850: '#15102B',
          950: '#0D091A',
        },
      },
      boxShadow: {
        input: '0px 2px 3px -1px rgba(109, 40, 217, 0.08), 0px 1px 0px 0px rgba(76, 29, 149, 0.04), 0px 0px 0px 1px rgba(221, 214, 254, 0.5)',
        komodo: '0 10px 25px -5px rgba(109, 40, 217, 0.25)',
        cta: '0 10px 20px -5px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
}
