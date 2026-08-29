/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hc: {
          ink: '#12304A',
          primary: '#1479C9',
          active: '#00A9C6',
          bg: '#F4F9FC',
          surface: '#FFFFFF',
          secondary: '#EAF4FA',
          border: '#D7E4EC',
          textSecondary: '#5F7180',
          success: '#178A72',
          watch: '#D98A11',
          critical: '#D94242',
          assumption: '#7667D8',
        },
        hazard: {
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          blue: '#0284c7',
          deep: '#0369a1',
        }
      }
    },
  },
  plugins: [],
}
