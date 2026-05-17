import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Student theme — blue
        primary: {
          DEFAULT: '#1A6BFF',
          dark: '#0D4ECC',
          light: '#E8F0FF',
        },
        // Vendor theme — orange
        vendor: {
          DEFAULT: '#FF6B00',
          dark: '#CC5500',
          light: '#FFF0E6',
          accent: '#FFD60A',
          background: '#FFF8F5',
        },
        // Semantic
        accent: '#00C9A7',
        warning: '#FF9500',
        error: '#FF3B30',
        success: '#34C759',
        // Surface
        surface: '#FFFFFF',
        background: '#F5F7FA',
        // Text
        'text-primary': '#1C1C1E',
        'text-secondary': '#6E6E73',
        'text-disabled': '#AEAEB2',
        border: '#E5E5EA',
        overlay: 'rgba(0,0,0,0.4)',
        // Status
        status: {
          available: '#34C759',
          busy: '#FF9500',
          unavailable: '#FF3B30',
          pending: '#FFD60A',
        },
      },
      fontFamily: {
        display: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        md: ['17px', { lineHeight: '24px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['24px', { lineHeight: '32px' }],
        '2xl': ['28px', { lineHeight: '36px' }],
        '3xl': ['34px', { lineHeight: '42px' }],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        blue: '0 4px 24px rgba(26, 107, 255, 0.18)',
        'blue-lg': '0 8px 40px rgba(26, 107, 255, 0.22)',
        orange: '0 4px 24px rgba(255, 107, 0, 0.18)',
        'orange-lg': '0 8px 40px rgba(255, 107, 0, 0.22)',
        card: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        nav: '0 -4px 24px rgba(0,0,0,0.06)',
      },
      screens: {
        // Mobile first base: 375px
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
}

export default config
