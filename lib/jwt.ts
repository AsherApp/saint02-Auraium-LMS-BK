import { jwtVerify } from 'jose'

export interface JWTPayload {
  id: string
  email: string
  role: 'teacher' | 'student'
  iat?: number
  exp?: number
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET || 'your-jwt-secret')
    
    const { payload } = await jwtVerify(token, secret)
    
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'teacher' | 'student',
      iat: payload.iat as number,
      exp: payload.exp as number
    }
  } catch (error) {
    throw new Error('Invalid token')
  }
}
