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
          canvas: '#FFFFFF',      // Pure bright white
          bg: '#F8FAFC',          // Crisp light slate background
          surface: '#FFFFFF',     // Clean white card surface
          card: '#F1F5F9',        // Slate-100 sub-card & input wells
          elevated: '#E2E8F0',    // Slate-200 hover & elevated layer
          secondary: '#F1F5F9',   // Secondary button background
          border: '#E2E8F0',      // Crisp light border
          borderLight: '#CBD5E1', // Border focus / divider
          ink: '#0F172A',         // High-contrast slate-900 text
          textSecondary: '#475569',// Slate-600 readable secondary text
          textMuted: '#64748B',   // Slate-500 helper text
          primary: '#2563EB',     // Royal Blue primary accent
          active: '#0284C7',      // Bright ocean blue
          accent: '#0EA5E9',      // Sky blue accent
          success: '#059669',     // Emerald green
          watch: '#D97706',       // Amber warning
          critical: '#DC2626',    // Bright critical red
          assumption: '#7C3AED',  // Vibrant purple
        },
        hazard: {
          red: '#DC2626',
          orange: '#EA580C',
          yellow: '#CA8A04',
          cyan: '#0891B2',
          blue: '#2563EB',
          deep: '#1D4ED8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 4px 14px 0 rgba(2, 132, 199, 0.22)',
        'glow-blue': '0 4px 14px 0 rgba(37, 99, 235, 0.22)',
        'glow-red': '0 4px 14px 0 rgba(220, 38, 38, 0.22)',
        'glow-amber': '0 4px 14px 0 rgba(217, 119, 6, 0.22)',
        'card-dark': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        'card-elevated': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
