/**
 * Centralized Date and Time Utilities
 * Provides consistent date formatting across the entire system
 */

export type DateFormat = 'date' | 'time' | 'datetime' | 'relative' | 'iso' | 'input'

export interface DateFormatOptions {
  locale?: string
  timeZone?: string
  format?: DateFormat
  fallback?: string
}

/**
 * Safely formats a date string with proper error handling
 */
export const formatDate = (
  dateString: string | null | undefined, 
  options: DateFormatOptions = {}
): string => {
  const {
    locale = 'en-US',
    timeZone = 'UTC',
    format = 'date',
    fallback = 'N/A'
  } = options

  if (!dateString) return fallback

  try {
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback
    }

    switch (format) {
      case 'date':
        return date.toLocaleDateString(locale, {
          timeZone,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      
      case 'time':
        return date.toLocaleTimeString(locale, {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      
      case 'datetime':
        return date.toLocaleString(locale, {
          timeZone,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      
      case 'relative':
        return getRelativeTime(date)
      
      case 'iso':
        return date.toISOString()
      
      case 'input':
        // Format for HTML datetime-local input
        return date.toISOString().slice(0, 16)
      
      default:
        return date.toLocaleDateString(locale, { timeZone })
    }
  } catch (error) {
    console.warn('Date formatting error:', error)
    return fallback
  }
}

/**
 * Gets relative time (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

/**
 * Formats duration in minutes to human readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Gets current date/time in ISO format
 */
export const getCurrentDateTime = (): string => {
  return new Date().toISOString()
}

/**
 * Gets current date in ISO format (date only)
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Parses a date string and returns a Date object with error handling
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Checks if a date is valid
 */
export const isValidDate = (dateString: string | null | undefined): boolean => {
  return parseDate(dateString) !== null
}

/**
 * Gets timezone offset in minutes
 */
export const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset()
}

/**
 * Converts UTC date to local timezone
 */
export const toLocalTime = (utcDateString: string): string => {
  const date = parseDate(utcDateString)
  if (!date) return 'N/A'
  
  return date.toLocaleString()
}

/**
 * Converts local date to UTC
 */
export const toUTC = (localDateString: string): string => {
  const date = parseDate(localDateString)
  if (!date) return 'N/A'
  
  return date.toISOString()
}

/**
 * Default date formatting functions for common use cases
 */
export const dateUtils = {
  // Short date format (e.g., "Jan 15, 2024")
  short: (dateString: string | null | undefined) => 
    formatDate(dateString, { format: 'date' }),
  
  // Time only (e.g., "2:30 PM")
  time: (dateString: string | null | undefined) => 
    formatDate(dateString, { format: 'time' }),
  
  // Full datetime (e.g., "Mon, Jan 15, 2024 at 2:30 PM")
  full: (dateString: string | null | undefined) => 
    formatDate(dateString, { format: 'datetime' }),
  
  // Relative time (e.g., "2 hours ago")
  relative: (dateString: string | null | undefined) => 
    formatDate(dateString, { format: 'relative' }),
  
  // ISO format for API calls
  iso: (dateString: string | null | undefined) => 
    formatDate(dateString, { format: 'iso' }),
  
  // Input format for HTML datetime-local
  input: (dateString: string | null | undefined) => 
    formatDate(dateString, { format: 'input' })
}

export default dateUtils
