/**
 * UI Consistency Utilities
 * Centralized functions to ensure consistent styling across the application
 */

import { designSystem } from './design-system'

// Standardized color classes
export const colors = {
  // Text colors
  text: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    accent: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-orange-400',
    error: 'text-red-400',
  },
  
  // Background colors
  background: {
    primary: 'bg-slate-900',
    secondary: 'bg-slate-800',
    glass: 'bg-white/10',
    glassHover: 'bg-white/15',
    glassBorder: 'border-white/20',
  },
  
  // Glass effects
  glass: {
    light: 'bg-white/5 backdrop-blur-md border border-white/10',
    medium: 'bg-white/10 backdrop-blur-md border border-white/20',
    heavy: 'bg-white/15 backdrop-blur-md border border-white/30',
  }
}

// Standardized spacing classes
export const spacing = {
  // Container spacing
  container: 'p-6',
  containerSm: 'p-4',
  containerLg: 'p-8',
  
  // Section spacing
  section: 'py-6',
  sectionSm: 'py-4',
  sectionLg: 'py-8',
  
  // Card spacing
  card: 'p-6',
  cardSm: 'p-4',
  cardLg: 'p-8',
  
  // Button spacing
  button: 'px-4 py-2',
  buttonSm: 'px-3 py-1.5',
  buttonLg: 'px-6 py-3',
  
  // Input spacing
  input: 'px-3 py-2',
  inputSm: 'px-2 py-1.5',
  inputLg: 'px-4 py-3',
  
  // Gap spacing
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
  
  // Space between elements
  space: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  }
}

// Standardized border radius
export const radius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
}

// Standardized shadows
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  glass: 'shadow-glass',
  glassLight: 'shadow-glass-light',
  glassHeavy: 'shadow-glass-heavy',
}

// Standardized transitions
export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  normal: 'transition-all duration-200 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
}

// Standardized typography
export const typography = {
  // Headings
  h1: 'text-4xl font-bold text-white',
  h2: 'text-3xl font-semibold text-white',
  h3: 'text-2xl font-semibold text-white',
  h4: 'text-xl font-medium text-white',
  h5: 'text-lg font-medium text-white',
  h6: 'text-base font-medium text-white',
  
  // Body text
  body: 'text-base text-slate-300',
  bodySm: 'text-sm text-slate-300',
  bodyLg: 'text-lg text-slate-300',
  
  // Muted text
  muted: 'text-sm text-slate-400',
  mutedSm: 'text-xs text-slate-400',
  mutedLg: 'text-base text-slate-400',
  
  // Accent text
  accent: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-orange-400',
  error: 'text-red-400',
}

// Standardized form elements
export const forms = {
  input: 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
  textarea: 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-vertical',
  select: 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
  label: 'block text-sm font-medium text-slate-300 mb-1',
  error: 'text-sm text-red-400 mt-1',
  help: 'text-sm text-slate-400 mt-1',
}

// Standardized card styles
export const cards = {
  glass: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-glass',
  glassHover: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-glass hover:bg-white/15 transition-all duration-200',
  solid: 'bg-slate-800 border border-slate-700 rounded-xl shadow-md',
  solidHover: 'bg-slate-800 border border-slate-700 rounded-xl shadow-md hover:bg-slate-750 transition-all duration-200',
}

// Standardized button styles
export const buttons = {
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

// Standardized badge styles
export const badges = {
  default: 'bg-slate-700 text-slate-300 border border-slate-600',
  primary: 'bg-blue-600/30 text-blue-100 border border-blue-500/30',
  success: 'bg-green-600/30 text-green-100 border border-green-500/30',
  warning: 'bg-orange-600/30 text-orange-100 border border-orange-500/30',
  destructive: 'bg-red-600/30 text-red-100 border border-red-500/30',
  outline: 'bg-transparent text-slate-300 border border-white/20',
}

// Standardized table styles
export const tables = {
  container: 'w-full overflow-hidden rounded-lg border border-white/10',
  header: 'bg-white/5 border-b border-white/10',
  headerCell: 'px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider',
  row: 'border-b border-white/5 hover:bg-white/5 transition-colors duration-150',
  cell: 'px-4 py-3 text-sm text-slate-300',
  cellMuted: 'px-4 py-3 text-sm text-slate-400',
}

// Standardized modal styles
export const modals = {
  overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
  content: 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-white/20 rounded-xl shadow-2xl max-w-lg w-full mx-4',
  header: 'px-6 py-4 border-b border-white/10',
  body: 'px-6 py-4',
  footer: 'px-6 py-4 border-t border-white/10 flex justify-end gap-2',
}

// Standardized loading states
export const loading = {
  spinner: 'animate-spin rounded-full border-2 border-white/20 border-t-white',
  skeleton: 'animate-pulse bg-white/10 rounded',
  dots: 'flex space-x-1',
  dot: 'w-2 h-2 bg-white/40 rounded-full animate-pulse',
}

// Utility functions
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getResponsiveText(size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'): string {
  const sizes = {
    xs: 'text-xs sm:text-sm md:text-base',
    sm: 'text-sm sm:text-base md:text-lg',
    base: 'text-base sm:text-lg md:text-xl',
    lg: 'text-lg sm:text-xl md:text-2xl',
    xl: 'text-xl sm:text-2xl md:text-3xl',
    '2xl': 'text-2xl sm:text-3xl md:text-4xl',
    '3xl': 'text-3xl sm:text-4xl md:text-5xl',
  }
  return sizes[size]
}

export function getResponsiveSpacing(size: 'sm' | 'md' | 'lg'): string {
  const sizes = {
    sm: 'p-4 sm:p-6',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-10',
  }
  return sizes[size]
}

export function getGlassEffect(intensity: 'light' | 'medium' | 'heavy' = 'medium'): string {
  const effects = {
    light: 'bg-white/5 backdrop-blur-md border border-white/10',
    medium: 'bg-white/10 backdrop-blur-md border border-white/20',
    heavy: 'bg-white/15 backdrop-blur-md border border-white/30',
  }
  return effects[intensity]
}

export function getButtonVariant(variant: keyof typeof buttons): string {
  return buttons[variant]
}

export function getCardStyle(style: 'glass' | 'glassHover' | 'solid' | 'solidHover' = 'glass'): string {
  return cards[style]
}

export function getBadgeVariant(variant: keyof typeof badges): string {
  return badges[variant]
}

// Standardized component class combinations
export const componentClasses = {
  // Page containers
  pageContainer: cn(spacing.container, colors.background.primary),
  pageHeader: cn(spacing.section, 'border-b border-white/10'),
  pageContent: cn(spacing.section),
  
  // Card components
  card: cn(cards.glass, spacing.card),
  cardHover: cn(cards.glassHover, spacing.card),
  
  // Form components
  formGroup: cn(spacing.space.md),
  formField: cn(spacing.space.sm),
  
  // Button groups
  buttonGroup: cn('flex gap-2'),
  buttonGroupVertical: cn('flex flex-col gap-2'),
  
  // Navigation
  navItem: cn('px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors duration-200'),
  navItemActive: cn('px-3 py-2 rounded-md text-white bg-white/10'),
  
  // Tables
  table: cn(tables.container),
  tableHeader: cn(tables.header),
  tableRow: cn(tables.row),
  
  // Modals
  modal: cn(modals.content),
  modalHeader: cn(modals.header),
  modalBody: cn(modals.body),
  modalFooter: cn(modals.footer),
}
