export function generateStudentCode(firstName: string, lastName: string): string {
  // Get first initials (up to 2 characters)
  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()
  
  // Get today's date in format YYMMDD
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  const dateCode = `${year}${month}${day}`
  
  // For now, we'll use a simple increment. In a real system, you'd check the database
  // to see how many students were created today and increment from there
  const increment = '01'
  
  return `${firstInitial}${lastInitial}${dateCode}${increment}`
}

export function validateStudentCode(code: string): boolean {
  // Basic validation: should be 10 characters (2 initials + 6 date + 2 increment)
  if (code.length !== 10) return false
  
  // Check if it follows the pattern: 2 uppercase letters + 6 digits + 2 digits
  const pattern = /^[A-Z]{2}\d{6}\d{2}$/
  return pattern.test(code)
}

export function parseStudentCode(code: string): {
  initials: string
  date: string
  increment: string
} | null {
  if (!validateStudentCode(code)) return null
  
  return {
    initials: code.slice(0, 2),
    date: code.slice(2, 8),
    increment: code.slice(8, 10)
  }
}
