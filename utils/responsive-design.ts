// Comprehensive Responsive Design System for Auraium LMS
// Ensures pixel-perfect design across all screen sizes and resolutions

export const breakpoints = {
  // Standard breakpoints with exact pixel values
  xs: 320,   // Small phones
  sm: 640,   // Large phones / small tablets
  md: 768,   // Tablets
  lg: 1024,  // Laptops / small desktops
  xl: 1280,  // Desktop
  '2xl': 1536, // Large desktop
  '3xl': 1920, // Full HD
  '4xl': 2560, // 2K/QHD
  '5xl': 3840, // 4K/UHD
} as const

export const responsiveDesign = {
  // Container max-widths for different screen sizes
  containers: {
    mobile: 'max-w-full px-4',
    tablet: 'max-w-3xl mx-auto px-6', 
    desktop: 'max-w-7xl mx-auto px-8',
    wide: 'max-w-[1920px] mx-auto px-12',
    ultrawide: 'max-w-[2560px] mx-auto px-16'
  },

  // Responsive grid systems
  grids: {
    cards: {
      mobile: 'grid-cols-1',
      tablet: 'grid-cols-2', 
      desktop: 'grid-cols-3',
      wide: 'grid-cols-4',
      ultrawide: 'grid-cols-5'
    },
    stats: {
      mobile: 'grid-cols-1',
      tablet: 'grid-cols-2',
      desktop: 'grid-cols-4',
      wide: 'grid-cols-4',
      ultrawide: 'grid-cols-6'
    },
    dashboard: {
      mobile: 'grid-cols-1',
      tablet: 'grid-cols-2', 
      desktop: 'grid-cols-3',
      wide: 'grid-cols-4',
      ultrawide: 'grid-cols-5'
    }
  },

  // Responsive spacing scale
  spacing: {
    padding: {
      mobile: 'p-4',
      tablet: 'p-6',
      desktop: 'p-8',
      wide: 'p-10',
      ultrawide: 'p-12'
    },
    margin: {
      mobile: 'm-4',
      tablet: 'm-6', 
      desktop: 'm-8',
      wide: 'm-10',
      ultrawide: 'm-12'
    },
    gap: {
      mobile: 'gap-3',
      tablet: 'gap-4',
      desktop: 'gap-6',
      wide: 'gap-8',
      ultrawide: 'gap-10'
    }
  },

  // Typography scaling for different screen sizes
  typography: {
    headings: {
      h1: {
        mobile: 'text-2xl font-bold',
        tablet: 'text-3xl font-bold',
        desktop: 'text-4xl font-bold',
        wide: 'text-5xl font-bold',
        ultrawide: 'text-6xl font-bold'
      },
      h2: {
        mobile: 'text-xl font-semibold',
        tablet: 'text-2xl font-semibold', 
        desktop: 'text-3xl font-semibold',
        wide: 'text-4xl font-semibold',
        ultrawide: 'text-5xl font-semibold'
      },
      h3: {
        mobile: 'text-lg font-medium',
        tablet: 'text-xl font-medium',
        desktop: 'text-2xl font-medium',
        wide: 'text-3xl font-medium',
        ultrawide: 'text-4xl font-medium'
      }
    },
    body: {
      large: {
        mobile: 'text-base',
        tablet: 'text-lg',
        desktop: 'text-xl',
        wide: 'text-2xl',
        ultrawide: 'text-3xl'
      },
      base: {
        mobile: 'text-sm',
        tablet: 'text-base',
        desktop: 'text-lg',
        wide: 'text-xl',
        ultrawide: 'text-2xl'
      },
      small: {
        mobile: 'text-xs',
        tablet: 'text-sm',
        desktop: 'text-base',
        wide: 'text-lg',
        ultrawide: 'text-xl'
      }
    }
  },

  // Component-specific responsive classes
  components: {
    button: {
      mobile: 'h-10 px-4 text-sm',
      tablet: 'h-11 px-5 text-base',
      desktop: 'h-12 px-6 text-lg',
      wide: 'h-14 px-8 text-xl',
      ultrawide: 'h-16 px-10 text-2xl'
    },
    card: {
      mobile: 'rounded-lg p-4',
      tablet: 'rounded-xl p-6',
      desktop: 'rounded-2xl p-8',
      wide: 'rounded-3xl p-10',
      ultrawide: 'rounded-3xl p-12'
    },
    sidebar: {
      mobile: 'w-16',
      tablet: 'w-64',
      desktop: 'w-72',
      wide: 'w-80',
      ultrawide: 'w-96'
    }
  }
}

// Helper function to get responsive classes
export const getResponsiveClasses = (
  property: keyof typeof responsiveDesign,
  variant: string,
  includeBreakpoints: boolean = true
) => {
  const config = responsiveDesign[property] as any
  const classes = config[variant]
  
  if (!classes || !includeBreakpoints) return classes

  // Return responsive classes with breakpoint prefixes
  return [
    classes.mobile,
    `sm:${classes.tablet}`,
    `md:${classes.desktop}`, 
    `xl:${classes.wide}`,
    `2xl:${classes.ultrawide}`
  ].join(' ')
}

// High-DPI and retina display optimizations
export const highDPIOptimizations = {
  // Image scaling for different pixel densities
  images: {
    standard: 'scale-100',
    retina: 'scale-105 hover:scale-110',
    ultra: 'scale-110 hover:scale-115'
  },
  
  // Text rendering optimizations
  text: {
    crisp: 'antialiased font-medium',
    smooth: 'subpixel-antialiased font-normal',
    ultra: 'antialiased font-light tracking-wide'
  },
  
  // Border and shadow scaling
  borders: {
    standard: 'border border-white/20',
    retina: 'border-2 border-white/25',
    ultra: 'border-[3px] border-white/30'
  },
  
  shadows: {
    standard: 'shadow-lg',
    retina: 'shadow-xl',
    ultra: 'shadow-2xl'
  }
}

// Flexible layout utilities
export const flexLayouts = {
  // Center content with responsive padding
  centerContent: 'flex items-center justify-center min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16',
  
  // Responsive flex direction
  flexResponsive: 'flex flex-col sm:flex-row',
  
  // Grid auto-fit for dynamic columns
  gridAutoFit: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  gridAutoFill: 'grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))]',
  
  // Responsive visibility
  hideMobile: 'hidden sm:block',
  hideDesktop: 'block sm:hidden',
  hideTablet: 'block md:hidden lg:block'
}

// Screen size detection utilities
export const screenSizes = {
  isMobile: '(max-width: 639px)',
  isTablet: '(min-width: 640px) and (max-width: 1023px)',
  isDesktop: '(min-width: 1024px) and (max-width: 1535px)',
  isWide: '(min-width: 1536px) and (max-width: 1919px)',
  isUltrawide: '(min-width: 1920px)',
  isRetina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  isHighDPI: '(-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi)'
}

// Touch and interaction optimizations
export const touchOptimizations = {
  // Minimum touch target sizes (44px minimum)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  touchTargetLarge: 'min-h-[48px] min-w-[48px]',
  
  // Touch-friendly spacing
  touchSpacing: 'gap-3 sm:gap-4 md:gap-6',
  
  // Hover states that work across devices
  hoverSafe: 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
  
  // Focus visible for keyboard navigation
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
}
