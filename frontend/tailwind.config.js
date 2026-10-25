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
        // NOMIKI Pinterest Palette (Creme, Sand, Dusty Pink, Burgundy)
        creme: {
          50: '#FAF8F5',
          100: '#F6F1EB',
          200: '#EEE4DA', // Base CREME (#EEE4DA)
          300: '#E4D6C7',
          400: '#DAC6B3',
          500: '#C7B09A',
        },
        sand: {
          50: '#FAF7F2',
          100: '#F3EDE2',
          200: '#E6DCCF',
          300: '#D8C4AC', // Base SAND (#D8C4AC)
          400: '#C5AE91',
          500: '#B09575',
          600: '#947A5A',
        },
        dusty: {
          50: '#FAF6F5',
          100: '#F2E8E6',
          200: '#E3D0CD',
          300: '#D4B8B4',
          400: '#C8A49F', // Base DUSTY PINK (#C8A49F)
          500: '#B68D87',
          600: '#9E746E',
          700: '#7E554F',
        },
        burgundy: {
          50: '#F9ECEE',
          100: '#F2D3D7',
          200: '#E2A2AB',
          300: '#CB6976',
          400: '#8E1E2A',
          500: '#6B141C',
          600: '#4D0E13', // Base BURGUNDY (#4D0E13)
          700: '#3D0A0E',
          800: '#2C0609',
          900: '#1F0406',
          950: '#140204',
        },
        // Playful Dopamine & Y2K Harajuku Palette
        playful: {
          pink: '#FF4D8D',
          hotpink: '#FF1493',
          lime: '#CCFF00',
          purple: '#2B0938',
          lilac: '#E8D5FF',
          candy: '#FFF0F5',
          cream: '#FFF9F0',
          yellow: '#FFE600',
        },
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
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['Space Grotesk', 'JetBrains Mono', 'Menlo', 'monospace'],
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
