/**
 * Standardized Design System for LMS
 * Ensures consistent colors, spacing, and effects across all components
 */

export const designSystem = {
  // Color Palette - Standardized
  colors: {
    primary: {
      blue: {
        50: '#eff6ff',
        100: '#dbeafe', 
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb', // Main primary
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      purple: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea', // Main secondary
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
      },
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a', // Success
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626', // Error/Destructive
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      orange: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c', // Warning
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
    },
    neutral: {
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      white: {
        pure: '#ffffff',
        glass: 'rgba(255, 255, 255, 0.1)',
        glassHover: 'rgba(255, 255, 255, 0.2)',
        glassBorder: 'rgba(255, 255, 255, 0.2)',
      }
    }
  },

  // Spacing System - Standardized
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '2.5rem',  // 40px
    '4xl': '3rem',    // 48px
    '5xl': '4rem',    // 64px
    '6xl': '5rem',    // 80px
  },

  // Border Radius - Standardized
  radius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows - Standardized
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },

  // Transitions - Standardized
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Glass Effects - Standardized
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    heavy: 'rgba(255, 255, 255, 0.2)',
    border: 'rgba(255, 255, 255, 0.2)',
    backdrop: 'blur(16px)',
  },

  // Gradients - Standardized
  gradients: {
    primary: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
    success: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    warning: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    error: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  }
}

// Standardized Button Variants
export const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md',
  secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-md',
  warning: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md',
  destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
  outline: 'border-2 border-white/30 text-slate-300 hover:bg-white/10 bg-transparent',
  ghost: 'hover:bg-white/10 text-slate-300 bg-transparent',
  link: 'text-blue-400 underline-offset-4 hover:underline hover:text-blue-300 bg-transparent',
  glass: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md',
  gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md',
}

// Standardized Spacing Classes
export const spacingClasses = {
  container: 'p-6',
  section: 'py-6',
  card: 'p-6',
  button: 'px-4 py-2',
  input: 'px-3 py-2',
  small: 'p-4',
  large: 'p-8',
  gap: {
    sm: 'gap-2',
    md: 'gap-4', 
    lg: 'gap-6',
    xl: 'gap-8',
  },
  space: {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6', 
    xl: 'space-y-8',
  }
}

// Standardized Glass Card Styles
export const glassCardStyles = 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-glass'

// Standardized Animation Classes
export const animations = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  scaleIn: 'animate-scale-in',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
}

// Utility function to get consistent button classes
export function getButtonClasses(variant: keyof typeof buttonVariants, size: 'sm' | 'md' | 'lg' = 'md') {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2'
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  }
  
  return `${baseClasses} ${buttonVariants[variant]} ${sizeClasses[size]}`
}

// Utility function to get consistent card classes
export function getCardClasses(padding: 'sm' | 'md' | 'lg' = 'md') {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8'
  }
  
  return `${glassCardStyles} ${paddingClasses[padding]}`
}
