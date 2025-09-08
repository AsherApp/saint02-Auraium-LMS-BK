/**
 * Utility functions for handling user names consistently across the application
 */

export interface User {
  first_name?: string
  last_name?: string
  name?: string
  email?: string
}

/**
 * Get the display name for a user, prioritizing first_name + last_name over name field
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'User'
  
  // Prioritize first_name + last_name if available
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  
  // Fall back to name field if available
  if (user.name) {
    return user.name
  }
  
  // Fall back to email prefix if available
  if (user.email) {
    const emailPrefix = user.email.split('@')[0]
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
  }
  
  return 'User'
}

/**
 * Get the first name for a user
 */
export function getUserFirstName(user: User | null | undefined): string {
  if (!user) return ''
  
  if (user.first_name) {
    return user.first_name
  }
  
  if (user.name) {
    return user.name.split(' ')[0] || ''
  }
  
  if (user.email) {
    const emailPrefix = user.email.split('@')[0]
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
  }
  
  return ''
}

/**
 * Get the last name for a user
 */
export function getUserLastName(user: User | null | undefined): string {
  if (!user) return ''
  
  if (user.last_name) {
    return user.last_name
  }
  
  if (user.name) {
    const nameParts = user.name.split(' ')
    return nameParts.slice(1).join(' ') || ''
  }
  
  return ''
}

/**
 * Get initials for a user (first letter of first name + first letter of last name)
 */
export function getUserInitials(user: User | null | undefined): string {
  const firstName = getUserFirstName(user)
  const lastName = getUserLastName(user)
  
  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()
  
  return firstInitial + lastInitial
}

/**
 * Check if a user has a proper name (not just email prefix)
 */
export function hasProperName(user: User | null | undefined): boolean {
  if (!user) return false
  
  // Check if first_name and last_name are set and not just email prefixes
  if (user.first_name && user.last_name) {
    const emailPrefix = user.email?.split('@')[0] || ''
    return user.first_name !== emailPrefix && user.last_name !== 'User'
  }
  
  // Check if name field is set and not just email prefix
  if (user.name) {
    const emailPrefix = user.email?.split('@')[0] || ''
    return user.name !== emailPrefix && !user.name.includes('User')
  }
  
  return false
}
