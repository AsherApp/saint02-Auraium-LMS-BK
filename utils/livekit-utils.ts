/**
 * LiveKit utility functions for better error handling and debugging
 */

export interface LiveKitError {
  message: string
  code?: string
  type?: string
}

/**
 * Check if an error is a LiveKit participant array error (which can be safely ignored)
 */
export function isParticipantArrayError(error: Error | LiveKitError): boolean {
  const message = error.message || ''
  return message.includes('Element not part of the array') || 
         message.includes('participant') ||
         message.includes('camera_placeholder') ||
         message.includes('not part of the array') ||
         message.includes('participant array')
}

/**
 * Check if an error is a LiveKit connection error
 */
export function isConnectionError(error: Error | LiveKitError): boolean {
  const message = error.message || ''
  return message.includes('connection') ||
         message.includes('network') ||
         message.includes('timeout') ||
         message.includes('websocket')
}

/**
 * Check if an error is a LiveKit authentication error
 */
export function isAuthError(error: Error | LiveKitError): boolean {
  const message = error.message || ''
  return message.includes('authentication') ||
         message.includes('token') ||
         message.includes('unauthorized') ||
         message.includes('forbidden')
}

/**
 * Get a user-friendly error message for LiveKit errors
 */
export function getLiveKitErrorMessage(error: Error | LiveKitError): string {
  if (isParticipantArrayError(error)) {
    return 'Temporary participant sync issue - this should resolve automatically'
  }
  
  if (isConnectionError(error)) {
    return 'Connection issue - please check your internet connection and try again'
  }
  
  if (isAuthError(error)) {
    return 'Authentication error - please refresh the page and try again'
  }
  
  return error.message || 'An unexpected error occurred with the live video'
}

/**
 * Generate a unique room key to force LiveKit re-renders
 */
export function generateRoomKey(roomId: string): string {
  return `${roomId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Debounce function to prevent rapid LiveKit reconnections
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Retry function with exponential backoff for LiveKit operations
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i === maxRetries - 1) {
        throw lastError
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}
