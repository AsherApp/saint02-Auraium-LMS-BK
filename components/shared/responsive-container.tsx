import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  size?: 'full' | 'content' | 'narrow' | 'wide' | 'ultrawide'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
}

const sizeClasses = {
  full: 'w-full',
  content: 'w-full max-w-7xl mx-auto',
  narrow: 'w-full max-w-4xl mx-auto', 
  wide: 'w-full max-w-9xl mx-auto',
  ultrawide: 'w-full max-w-12xl mx-auto'
}

const paddingClasses = {
  none: '',
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 md:px-8',
  lg: 'px-4 sm:px-6 md:px-8 lg:px-10',
  xl: 'px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16'
}

export function ResponsiveContainer({
  children,
  className,
  size = 'content',
  padding = 'md',
  center = false
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      sizeClasses[size],
      paddingClasses[padding],
      center && 'flex items-center justify-center',
      className
    )}>
      {children}
    </div>
  )
}

// Responsive Grid Component
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

const gapClasses = {
  sm: 'gap-3 sm:gap-4',
  md: 'gap-4 sm:gap-5 md:gap-6',
  lg: 'gap-5 sm:gap-6 md:gap-8',
  xl: 'gap-6 sm:gap-8 md:gap-10'
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid`,
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
    gapClasses[gap]
  ].filter(Boolean).join(' ')

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  )
}

// Responsive Flex Component
interface ResponsiveFlexProps {
  children: ReactNode
  className?: string
  direction?: 'col' | 'row' | 'col-reverse' | 'row-reverse'
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveFlex({
  children,
  className,
  direction = 'col',
  breakpoint = 'md',
  align = 'start',
  justify = 'start',
  gap = 'md'
}: ResponsiveFlexProps) {
  const flexClasses = cn(
    'flex',
    `flex-${direction}`,
    breakpoint && `${breakpoint}:flex-row`,
    align && `items-${align}`,
    justify && `justify-${justify}`,
    gapClasses[gap],
    className
  )

  return (
    <div className={flexClasses}>
      {children}
    </div>
  )
}

// High-DPI Image Component
interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  quality?: number
}

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  quality = 90
}: ResponsiveImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'w-full h-auto object-cover',
        'transition-transform duration-200',
        'hover:scale-105',
        className
      )}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      style={{
        imageRendering: 'crisp-edges',
        WebkitImageRendering: 'crisp-edges'
      }}
    />
  )
}

// Screen Size Detector Hook
import { useState, useEffect } from 'react'

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<{
    width: number
    height: number
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    isRetina: boolean
  }>({
    width: 0,
    height: 0,
    breakpoint: 'md',
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isRetina: false
  })

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const pixelRatio = window.devicePixelRatio || 1

      let breakpoint: typeof screenSize.breakpoint = 'xs'
      if (width >= 3840) breakpoint = '5xl'
      else if (width >= 2560) breakpoint = '4xl'
      else if (width >= 1920) breakpoint = '3xl'
      else if (width >= 1536) breakpoint = '2xl'
      else if (width >= 1280) breakpoint = 'xl'
      else if (width >= 1024) breakpoint = 'lg'
      else if (width >= 768) breakpoint = 'md'
      else if (width >= 640) breakpoint = 'sm'

      setScreenSize({
        width,
        height,
        breakpoint,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isRetina: pixelRatio >= 2
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}
