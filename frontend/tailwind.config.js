/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'PingFang SC', 
          'Microsoft YaHei', 
          'Inter', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'sans-serif'
        ],
        serif: ['Songti SC', 'Noto Serif SC', 'Playfair Display', 'serif'],
      },
      colors: {
        background: '#000000',
        surface: '#1c1c1e',
        primary: '#f5f5f7',
        secondary: '#86868b',
        accent: '#2997ff',
        glass: 'rgba(28, 28, 30, 0.65)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.33, 1, 0.68, 1)',
        'slide-up': 'slideUp 0.9s cubic-bezier(0.32, 0.72, 0, 1)',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(50px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
