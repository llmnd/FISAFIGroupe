/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Couleurs FISAFI (bleu + orange)
        primary: {
          50: '#f3f7fd',
          100: '#e7effb',
          200: '#cfe3f7',
          300: '#b7d7f3',
          400: '#7ecaf0',
          500: '#4c9fed',
          600: '#2563eb',
          700: '#1e40af',  // Bleu navy principal
          800: '#1e3a8a',  // Bleu foncé
          900: '#172554',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Orange FISAFI
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        neutral: {
          50: '#f9f9f9',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a1a1a1',
          500: '#696969',
          600: '#424242',
          700: '#292929',
          800: '#1a1a1a',
          900: '#0d0d0d',
        },
      },
      spacing: {
        'safe-top': 'max(1rem, env(safe-area-inset-top))',
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-left': 'max(1rem, env(safe-area-inset-left))',
        'safe-right': 'max(1rem, env(safe-area-inset-right))',
      },
      animation: {
        'in': 'slideIn 0.2s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
