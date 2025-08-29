import { SignJWT, jwtVerify } from 'jose'
import { env } from '../config/env.js'

const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET || 'fallback-secret-key')

export interface JWTPayload {
  email: string
  role: 'teacher' | 'student'
  name?: string
  student_code?: string
  subscription_status?: string
  max_students_allowed?: number
  iat?: number
  exp?: number
}

export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  
  return jwt
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function decodeToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}
