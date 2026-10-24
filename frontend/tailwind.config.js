/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep Midnight Forest & Jade Undertones for Dark Mode
        void: {
          950: '#030b06', // Primary midnight emerald dark canvas
          900: '#07160d', // Dark forest card background
          850: '#0b1f13', // Elevated card / modal
          800: '#102a1b', // Interactive container
          700: '#163825', // Border tone
          600: '#225236', // Border active
        },
        forest: {
          950: '#020905',
          900: '#05140b',
          800: '#0a2213',
          700: '#11351e',
          600: '#194c2c',
          500: '#10b981',
          400: '#34d399',
        },
        // High-Vibrancy Streetwear Accent Palette
        neon: {
          emerald: '#00FF88', // Electric Emerald Green
          mint: '#10B981',    // Bottega Jade Mint
          lime: '#CCFF00',    // Acid Cyber Lime
          cyan: '#00F0FF',    // Electric Tokyo Cyan
          orange: '#FF5500',  // Hazard Sunset Tangerine
          pink: '#FF007F',    // Hyper Neon Magenta
          purple: '#A855F7',  // Cyber Royal Violet
          violet: '#8B5CF6',  // Deep Lavender
          amber: '#F59E0B',   // Warm Gold Amber
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Courier New', 'monospace'],
        display: ['Impact', 'Haettenschweiler', 'Arial Black', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
