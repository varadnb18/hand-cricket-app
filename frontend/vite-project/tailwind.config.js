/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 1.5s infinite',
        'pulse-fast': 'pulse 0.8s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'ball-bowl': 'ballBowl 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'ball-reveal': 'ballReveal 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ballBowl: {
          '0%': { transform: 'scale(0.5) translateY(-150px) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(0.8) translateY(20px) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0) rotate(360deg)', opacity: '1' },
        },
        ballReveal: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
