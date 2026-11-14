/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        royal: {
          pink: '#EFAFC5', lavender: '#DCC6F2', purple: '#8064A2', blue: '#C7E5F8',
          gold: '#E8C878', cream: '#FFF9F3', rose: '#F6D5E1', plum: '#49354F',
          deep: '#5E4680', mint: '#CFEFDF', leaf: '#3F8F6A', coral: '#C2557A',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 6px 24px -8px rgba(73, 53, 79, 0.25)',
        glow: '0 0 0 4px rgba(232, 200, 120, 0.45)',
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pop: { '0%': { transform: 'scale(.85)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        fadeup: { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-4px)' }, '75%': { transform: 'translateX(4px)' } },
        twinkle: { '0%,100%': { opacity: 0.3 }, '50%': { opacity: 1 } },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        pop: 'pop .35s ease-out both',
        fadeup: 'fadeup .4s ease-out both',
        shake: 'shake .3s ease-in-out 2',
        twinkle: 'twinkle 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
