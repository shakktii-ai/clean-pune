/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
    "./services/**/*.{js,jsx}",
    "./utils/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        civic: {
          primary: '#0f172a', // Dark Navy primary text/elements
          blue: '#1d4ed8',    // Civic Blue
          accent: '#0284c7',  // Clear sky/teal accent
          teal: '#0f766e',    // Deep Teal
          emerald: '#059669', // Status resolved
          amber: '#d97706',   // Status in-progress
          rose: '#e11d48',    // Status urgent/escalated
          slate: '#f8fafc',   // Surface
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
