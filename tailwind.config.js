/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
      '5xl': '3840px',
    },
    extend: {
      colors: {
        primary: '#B80238',
        secondary: '#1a1a1a',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '92': '23rem',
        '96': '24rem',
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        '10xl': '104rem',
        '11xl': '112rem',
        '12xl': '120rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
        '6xl': ['3.75rem', { lineHeight: '4.25rem' }],
        '7xl': ['4.5rem', { lineHeight: '5rem' }],
        '8xl': ['6rem', { lineHeight: '6.5rem' }],
        '9xl': ['8rem', { lineHeight: '8.5rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        '4xl': '72px',
        '5xl': '96px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-in-out',
        'fade-in-down': 'fadeInDown 0.5s ease-in-out',
        'scale-in': 'scaleIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-in-out',
        'slide-in-left': 'slideInLeft 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Custom responsive utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-responsive-xs': {
          fontSize: theme('fontSize.xs'),
          '@screen sm': { fontSize: theme('fontSize.sm') },
          '@screen md': { fontSize: theme('fontSize.base') },
          '@screen lg': { fontSize: theme('fontSize.lg') },
          '@screen xl': { fontSize: theme('fontSize.xl') },
        },
        '.text-responsive-sm': {
          fontSize: theme('fontSize.sm'),
          '@screen sm': { fontSize: theme('fontSize.base') },
          '@screen md': { fontSize: theme('fontSize.lg') },
          '@screen lg': { fontSize: theme('fontSize.xl') },
          '@screen xl': { fontSize: theme('fontSize.2xl') },
        },
        '.text-responsive-base': {
          fontSize: theme('fontSize.base'),
          '@screen sm': { fontSize: theme('fontSize.lg') },
          '@screen md': { fontSize: theme('fontSize.xl') },
          '@screen lg': { fontSize: theme('fontSize.2xl') },
          '@screen xl': { fontSize: theme('fontSize.3xl') },
        },
        '.container-responsive': {
          width: '100%',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            maxWidth: theme('screens.sm'),
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen md': {
            maxWidth: theme('screens.md'),
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
          '@screen lg': {
            maxWidth: theme('screens.lg'),
            paddingLeft: theme('spacing.10'),
            paddingRight: theme('spacing.10'),
          },
          '@screen xl': {
            maxWidth: theme('screens.xl'),
            paddingLeft: theme('spacing.12'),
            paddingRight: theme('spacing.12'),
          },
          '@screen 2xl': {
            maxWidth: theme('screens.2xl'),
            paddingLeft: theme('spacing.16'),
            paddingRight: theme('spacing.16'),
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
