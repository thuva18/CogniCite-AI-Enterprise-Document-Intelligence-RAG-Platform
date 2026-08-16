/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep obsidian and slate surfaces
        'surface-0': '#070a12',
        'surface-1': '#0b1120',
        'surface-2': '#111a2e',
        'surface-3': '#17233d',
        'surface-4': '#1e2d4d',
        
        // Refined brand accents
        'brand': {
          50:  '#f0f5ff',
          100: '#e0ebff',
          200: '#c2d7fe',
          300: '#94bcfe',
          400: '#6097fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'accent': {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
        'glow-card': 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'brand-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glass': '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 6px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glow-sm': '0 0 12px rgba(59, 130, 246, 0.35)',
        'glow-md': '0 0 24px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 48px rgba(99, 102, 241, 0.25)',
        'brand':   '0 4px 24px rgba(59, 130, 246, 0.35)',
      },
    },
  },
  plugins: [],
}
