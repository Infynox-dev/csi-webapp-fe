/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './providers/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007faf',
          hover: '#18aefa',
        },
        secondary: '#18aefa',
        success: '#7bb13c',
        danger: '#e84646',
        warning: '#ffbc34',
        info: '#009efb',
        textDark: '#333333',
        textMuted: '#757575',
        bgLight: '#f7f7fa',
        borderColor: '#ececf5',
        footerBlack: '#000000',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'slide-in': 'slide-in 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-in forwards',
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
        marquee: 'marquee 20s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};
