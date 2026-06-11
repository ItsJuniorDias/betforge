/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#F0D080',
          dark: '#8B6914',
        },
        bg: {
          DEFAULT: '#0A0B0E',
          surface: '#111318',
          surface2: '#181C23',
          surface3: '#1E2330',
          surface4: '#252A38',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        blink: 'blink 1s infinite',
        fadeIn: 'fadeIn 0.3s ease forwards',
        slideIn: 'slideIn 0.25s ease forwards',
        pulse2: 'pulse2 2s infinite',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulse2: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.03)' } },
      },
    },
  },
  plugins: [],
}
