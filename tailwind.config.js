/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // semantic tokens driven by CSS variables (see index.css)
        background: 'rgb(var(--background) / <alpha-value>)',
        sidebar: 'rgb(var(--sidebar) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-muted': 'rgb(var(--card-muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        positive: 'rgb(var(--positive) / <alpha-value>)',
        negative: 'rgb(var(--negative) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        // fixed chart palette (same in both themes)
        chart: {
          blue: '#2f6bff',
          violet: '#8b5cf6',
          yellow: '#f5c043',
          teal: '#2dd4bf',
          emerald: '#10b981',
          rose: '#f43f5e',
          indigo: '#6366f1',
          orange: '#fb923c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        // sombra azul suave e direcional (elevação), no lugar do halo neon
        glow: '0 6px 16px -8px rgb(47 107 255 / 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
