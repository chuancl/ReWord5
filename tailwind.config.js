/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{ts,tsx}" // Scan root files like App.tsx if any
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          900: '#0c4a6e',
        }
      },
      animation: {
        'in': 'in 0.2s ease-out',
        'out': 'out 0.2s ease-in',
      },
      keyframes: {
        in: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        out: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        }
      }
    },
  },
  plugins: [],
}