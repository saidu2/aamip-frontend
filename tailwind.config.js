/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050810',
          900: '#0A0E1A',
          800: '#0F1628',
          700: '#141E35',
          600: '#1A2640',
          500: '#1E2D4A',
        },
        gold: {
          300: '#F0D98A',
          400: '#E8C97A',
          500: '#C9A84C',
          600: '#A8862E',
          700: '#856A1A',
        },
        slate: {
          border: '#2A3A55',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
