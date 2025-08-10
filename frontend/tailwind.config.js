/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], // Enables dark mode via `class`
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Theme tokens using CSS variables (define in :root and .dark)
        border: 'hsl(var(--border, 220 14% 96%))',
        input: 'hsl(var(--input, 220 14% 96%))',
        ring: 'hsl(var(--ring, 220 14% 96%))',
        background: 'hsl(var(--background, 0 0% 100%))',
        foreground: 'hsl(var(--foreground, 222 47% 11%))',

        primary: {
          DEFAULT: 'hsl(var(--primary, 240 100% 50%))',
          foreground: 'hsl(var(--primary-foreground, 0 0% 100%))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary, 210 40% 96%))',
          foreground: 'hsl(var(--secondary-foreground, 222 47% 11%))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive, 0 100% 66%))',
          foreground: 'hsl(var(--destructive-foreground, 0 0% 100%))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted, 210 20% 94%))',
          foreground: 'hsl(var(--muted-foreground, 215 20% 20%))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent, 240 100% 90%))',
          foreground: 'hsl(var(--accent-foreground, 222 47% 11%))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover, 0 0% 100%))',
          foreground: 'hsl(var(--popover-foreground, 222 47% 11%))',
        },
        card: {
          DEFAULT: 'hsl(var(--card, 0 0% 100%))',
          foreground: 'hsl(var(--card-foreground, 222 47% 11%))',
        },

        // Custom reusable background utilities
        section: {
          light: '#F5F7FA',
          dark: '#1E1E2F',
          hero: '#eef2ff',
        },
      },

      borderRadius: {
        lg: 'var(--radius, 0.5rem)',
        md: 'calc(var(--radius, 0.5rem) - 2px)',
        sm: 'calc(var(--radius, 0.5rem) - 4px)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
