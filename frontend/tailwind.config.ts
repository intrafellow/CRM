import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          base: 'rgba(255,255,255,0.08)',
          stroke: 'rgba(255,255,255,0.18)'
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.35)'
      },
      borderRadius: {
        xl2: '1rem'
      }
    }
  },
  plugins: []
} satisfies Config
