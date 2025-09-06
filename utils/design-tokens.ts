// Design Tokens for Auraium LMS
// Centralizes all color, spacing, and styling constants

export const designTokens = {
  // Color Palette
  colors: {
    primary: {
      blue: {
        50: 'rgb(239, 246, 255)',
        100: 'rgb(219, 234, 254)',
        300: 'rgb(147, 197, 253)',
        400: 'rgb(96, 165, 250)',
        500: 'rgb(59, 130, 246)', // Main blue
        600: 'rgb(37, 99, 235)',
        700: 'rgb(29, 78, 216)',
      },
      purple: {
        50: 'rgb(250, 245, 255)',
        100: 'rgb(243, 232, 255)',
        300: 'rgb(196, 181, 253)',
        400: 'rgb(167, 139, 250)',
        500: 'rgb(139, 92, 246)', // Main purple
        600: 'rgb(124, 58, 237)',
        700: 'rgb(109, 40, 217)',
      },
      gradient: 'bg-gradient-to-r from-blue-600 to-purple-600'
    },
    semantic: {
      success: {
        300: 'rgb(134, 239, 172)',
        400: 'rgb(74, 222, 128)',
        500: 'rgb(34, 197, 94)', // Main green
        600: 'rgb(22, 163, 74)',
        700: 'rgb(21, 128, 61)',
      },
      warning: {
        300: 'rgb(253, 186, 116)',
        400: 'rgb(251, 146, 60)',
        500: 'rgb(245, 158, 11)', // Main orange
        600: 'rgb(217, 119, 6)',
        700: 'rgb(180, 83, 9)',
      },
      danger: {
        300: 'rgb(252, 165, 165)',
        400: 'rgb(248, 113, 113)',
        500: 'rgb(239, 68, 68)', // Main red
        600: 'rgb(220, 38, 38)',
        700: 'rgb(185, 28, 28)',
      }
    },
    glass: {
      primary: 'bg-white/10',
      secondary: 'bg-white/5',
      hover: 'bg-white/20',
      border: 'border-white/20',
      borderStrong: 'border-white/30'
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-400',
      muted: 'text-slate-500'
    }
  },

  // Typography Scale
  typography: {
    headings: {
      h1: 'text-3xl font-bold text-white',
      h2: 'text-2xl font-semibold text-white',
      h3: 'text-xl font-medium text-white',
      h4: 'text-lg font-medium text-white'
    },
    body: {
      large: 'text-lg text-slate-300',
      base: 'text-base text-slate-300',
      small: 'text-sm text-slate-400',
      xs: 'text-xs text-slate-500'
    }
  },

  // Spacing System
  spacing: {
    card: {
      padding: 'p-6',
      paddingSmall: 'p-4',
      paddingLarge: 'p-8'
    },
    grid: {
      gap: 'gap-4',
      gapSmall: 'gap-3',
      gapLarge: 'gap-6'
    },
    vertical: {
      small: 'space-y-3',
      base: 'space-y-4',
      large: 'space-y-6',
      xl: 'space-y-8'
    }
  },

  // Button Variants
  buttons: {
    primary: {
      solid: 'bg-blue-600 hover:bg-blue-700 text-white',
      outline: 'border-2 border-blue-600 text-blue-300 hover:bg-blue-600/10',
      glass: 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
    },
    secondary: {
      glass: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
      outline: 'border-2 border-white/30 text-slate-300 hover:bg-white/10'
    },
    success: {
      solid: 'bg-green-600 hover:bg-green-700 text-white',
      glass: 'bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30'
    },
    warning: {
      solid: 'bg-orange-600 hover:bg-orange-700 text-white',
      glass: 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30'
    },
    danger: {
      solid: 'bg-red-600 hover:bg-red-700 text-white',
      glass: 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30'
    }
  },

  // Card Variants
  cards: {
    glass: 'rounded-xl border border-white/20 bg-white/10 backdrop-blur shadow-[0_8px_32px_rgba(2,6,23,0.45)]',
    glassHover: 'transition-all duration-200 hover:bg-white/15 hover:border-white/30',
    stat: 'rounded-lg p-4 border border-white/10 bg-white/5',
    statHover: 'transition-all duration-200 hover:bg-white/10'
  },

  // Icon Colors for Consistency
  iconColors: {
    blue: 'text-blue-300',
    purple: 'text-purple-300',
    green: 'text-green-300',
    orange: 'text-orange-300',
    red: 'text-red-300',
    slate: 'text-slate-400'
  }
}

// Helper functions
export const getButtonClasses = (variant: keyof typeof designTokens.buttons, style: string = 'solid') => {
  const buttonBase = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variantClasses = designTokens.buttons[variant]?.[style as keyof typeof designTokens.buttons.primary] || designTokens.buttons.secondary.glass
  return `${buttonBase} ${variantClasses}`
}

export const getCardClasses = (variant: 'glass' | 'stat' = 'glass', hover: boolean = false) => {
  const baseClass = designTokens.cards[variant]
  const hoverClass = hover ? designTokens.cards[`${variant}Hover` as keyof typeof designTokens.cards] : ''
  return `${baseClass} ${hoverClass}`
}

export const getTextClasses = (level: 'primary' | 'secondary' | 'tertiary' | 'muted' = 'secondary') => {
  return designTokens.text[level]
}

export const getHeadingClasses = (level: 'h1' | 'h2' | 'h3' | 'h4' = 'h2') => {
  return designTokens.typography.headings[level]
}
