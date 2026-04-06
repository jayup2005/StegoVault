/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070d',
        panel: '#0d1117',
        panelElevated: '#101722',
        panelLine: '#1a2332',
        cyan: '#00d4ff',
        success: '#00ff9d',
        danger: '#ff3366',
        amber: '#ffaa00',
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
