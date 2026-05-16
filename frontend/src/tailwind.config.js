/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          light: '#eff6ff',
          dark: '#1e3a8a'
        },
        bg: {
          light: '#f8fafc',
          dark: '#0f172a'
        },
        surface: {
          light: '#ffffff',
          dark: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}