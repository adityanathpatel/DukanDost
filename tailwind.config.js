/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF9F6',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1E293B',
          muted: '#64748B',
          light: '#94A3B8',
        },
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        pastel: {
          lavender: {
            light: '#F5F3FF',
            DEFAULT: '#EDE9FE',
            border: '#DDD6FE',
            text: '#5B21B6',
            hover: '#E0E7FF',
          },
          orange: {
            light: '#FFF7ED',
            DEFAULT: '#FFEDD5',
            border: '#FED7AA',
            text: '#C2410C',
          },
          blue: {
            light: '#F0F9FF',
            DEFAULT: '#E0F2FE',
            border: '#BAE6FD',
            text: '#0369A1',
          },
          pink: {
            light: '#FFF1F2',
            DEFAULT: '#FFE4E6',
            border: '#FECDD3',
            text: '#BE123C',
          },
          green: {
            light: '#F0FDF4',
            DEFAULT: '#DCFCE7',
            border: '#BBF7D0',
            text: '#15803D',
          },
        },
        dukaan: {
          green: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
          },
          amber: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
          },
          red: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans Devanagari"',
          'sans-serif',
        ],
      },
      boxShadow: {
        'thumb': '0 4px 14px 0 rgba(0, 0, 0, 0.08)',
        'card': '0 2px 10px -2px rgba(0, 0, 0, 0.04), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'float': '0 12px 32px -4px rgba(15, 23, 42, 0.3)',
        'pastel': '0 8px 20px -4px rgba(91, 33, 182, 0.12)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      minHeight: {
        'touch': '48px',
        'touch-lg': '56px',
      },
      minWidth: {
        'touch': '48px',
        'touch-lg': '56px',
      },
    },
  },
  plugins: [],
};
