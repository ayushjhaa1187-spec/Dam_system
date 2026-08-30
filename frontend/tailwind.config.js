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
        hc: {
          canvas: '#060B14',      // Deepest background
          bg: '#0A1120',          // Page background
          surface: '#101B33',     // Card surface
          card: '#132240',        // Elevated card
          elevated: '#182B52',    // Higher elevation / hover
          border: '#1E3563',      // Slate blue border
          borderLight: '#2A4782', // Lighter border
          ink: '#F0F6FC',         // Primary text
          textSecondary: '#8B9BB4',// Secondary muted text
          textMuted: '#586A84',   // Muted helper text
          primary: '#2563EB',     // Blue primary accent
          active: '#0EA5E9',      // Cyan / electric blue
          accent: '#38BDF8',      // Light sky blue
          success: '#10B981',     // Emerald safe / online
          watch: '#F59E0B',       // Amber medium risk / warning
          critical: '#EF4444',    // Red high risk / danger
          assumption: '#8B5CF6',  // Purple / model highlight
        },
        hazard: {
          red: '#EF4444',
          orange: '#F97316',
          yellow: '#EAB308',
          cyan: '#06B6D4',
          blue: '#0284C7',
          deep: '#0369A1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(14, 165, 233, 0.35)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'card-dark': '0 8px 24px -4px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
