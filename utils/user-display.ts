/**
 * User display utilities for showing names, codes, and avatars
 */

export interface UserDisplayInfo {
  name?: string
  email?: string
  studentCode?: string
  teacherName?: string
  profilePicture?: string
  profile_picture_url?: string
}

/**
 * Get the best display name for a user
 * Priority: name > studentCode > email (first part)
 */
export function getUserDisplayName(user: UserDisplayInfo): string {
  if (user.name && user.name.trim()) {
    return user.name.trim()
  }
  
  if (user.studentCode && user.studentCode.trim()) {
    return user.studentCode.trim()
  }
  
  if (user.email) {
    // Return the part before @ for email
    return user.email.split('@')[0]
  }
  
  return 'User'
}

/**
 * Get user initials for avatar display
 * For names: "John Doe" -> "JD"
 * For single names: "John" -> "J"
 * For emails: "john.doe@email.com" -> "JD"
 * For student codes: "STU123" -> "ST"
 */
export function getUserInitials(user: UserDisplayInfo): string {
  if (user.name && user.name.trim()) {
    const nameParts = user.name.trim().split(' ')
    if (nameParts.length >= 2) {
      // First and last name initials
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    } else {
      // Single name - take first two characters
      return nameParts[0].substring(0, 2).toUpperCase()
    }
  }
  
  if (user.studentCode && user.studentCode.trim()) {
    // For student codes like "STU123", take first two characters
    return user.studentCode.trim().substring(0, 2).toUpperCase()
  }
  
  if (user.email) {
    const emailPart = user.email.split('@')[0]
    // Try to extract initials from email like "john.doe" -> "JD"
    if (emailPart.includes('.')) {
      const parts = emailPart.split('.')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
    }
    // Fallback to first two characters
    return emailPart.substring(0, 2).toUpperCase()
  }
  
  return 'U'
}

/**
 * Get the secondary display text (usually email or student code)
 */
export function getUserSecondaryText(user: UserDisplayInfo): string {
  if (user.studentCode && user.studentCode.trim()) {
    return `ID: ${user.studentCode}`
  }
  
  if (user.email) {
    return user.email
  }
  
  return ''
}

/**
 * Get avatar props for Avatar component
 */
export function getAvatarProps(user: UserDisplayInfo) {
  return {
    src: user.profilePicture || user.profile_picture_url || undefined,
    alt: getUserDisplayName(user),
    fallback: getUserInitials(user)
  }
}

/**
 * Get teacher display name with fallback
 */
export function getTeacherDisplayName(teacher: { name?: string; email?: string }): string {
  if (teacher.name && teacher.name.trim()) {
    return teacher.name.trim()
  }
  
  if (teacher.email) {
    return teacher.email.split('@')[0]
  }
  
  return 'Teacher'
}

/**
 * Get teacher initials
 */
export function getTeacherInitials(teacher: { name?: string; email?: string }): string {
  if (teacher.name && teacher.name.trim()) {
    const nameParts = teacher.name.trim().split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    } else {
      return nameParts[0].substring(0, 2).toUpperCase()
    }
  }
  
  if (teacher.email) {
    const emailPart = teacher.email.split('@')[0]
    if (emailPart.includes('.')) {
      const parts = emailPart.split('.')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
    }
    return emailPart.substring(0, 2).toUpperCase()
  }
  
  return 'T'
}
