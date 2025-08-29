import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env.js';
const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET || 'fallback-secret-key');
export async function generateToken(payload) {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
    return jwt;
}
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    }
    catch (error) {
        throw new Error('Invalid token');
    }
}
export async function decodeToken(token) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    }
    catch (error) {
        return null;
    }
}
