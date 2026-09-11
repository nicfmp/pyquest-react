/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF7F0',
        'paper-soft': '#F1ECE0',
        ink: '#161D18',
        'ink-soft': '#4B564F',
        forest: '#2F6B4F',
        'forest-deep': '#1E4A36',
        amber: '#E7A83C',
        sage: '#C9DCC9',
        line: '#DDD5C2',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        blink: { '50%': { opacity: '0' } },
        fillxp: { to: { width: '64%' } },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
        fillxp: 'fillxp 1.8s ease-out .4s forwards',
      },
    },
  },
  plugins: [],
}
