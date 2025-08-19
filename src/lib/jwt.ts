import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || 'your-secret-key'
);

export interface JWTPayload {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  googleId?: string;
  exp?: number;
}

export async function signJWT(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // 2小时有效期，平衡安全性和用户体验
    .sign(secret);
  
  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
  return {
    userId: payload.userId as string,
    email: payload.email as string,
    displayName: payload.displayName as string,
    emailVerified: payload.emailVerified as boolean,
  };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2, // 2 hours
    path: '/',
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}