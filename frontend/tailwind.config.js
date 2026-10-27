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
          50:  '#f0faf4',
          100: '#dcf5e7',
          200: '#b8eacf',
          300: '#7fd5a8',
          400: '#43b87b',
          500: '#1f9a57',
          600: '#167a42',
          700: '#145f34',
          800: '#134c2c',
          900: '#103f25',
          950: '#08221430',
        },
        forest: {
          DEFAULT: '#1a6b3a',
          dark:    '#0f4524',
          mid:     '#216b45',
          light:   '#2d8a57',
          pale:    '#e8f5ed',
          faint:   '#f0faf4',
        },
        ink: {
          DEFAULT: '#111827',
          muted:   '#374151',
          subtle:  '#6b7280',
          faint:   '#9ca3af',
        },
        surface: {
          DEFAULT: '#ffffff',
          raised:  '#f8faf9',
          muted:   '#f3f4f6',
          border:  '#e5e7eb',
          divider: '#d1d5db',
        },
        energy: {
          forecast: '#1a6b3a',
          actual:   '#2563eb',
          error:    '#dc2626',
          warning:  '#d97706',
          positive: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card:   '0 1px 4px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.10)',
        panel:  '0 2px 8px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
