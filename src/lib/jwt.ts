import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { sessionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

// Access Token (15分钟)
export async function signJWT(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // 15分钟有效期，提高安全性
    .sign(secret);
  
  return jwt;
}

// 为了兼容 OAuth 回调，添加 generateJWT 函数
export async function generateJWT(payload: { userId: string; email: string }): Promise<string> {
  const jwt = await new SignJWT({ 
    userId: payload.userId,
    email: payload.email,
    displayName: '',
    emailVerified: false
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7天有效期
    .sign(secret);
  
  return jwt;
}

// Refresh Token (7天)
export async function signRefreshToken(userId: string): Promise<string> {
  const refreshToken = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7天有效期
    .sign(secret);
  
  return refreshToken;
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

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
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
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  });
}

export async function setRefreshCookie(refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('refresh_token');
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('refresh_token')?.value || null;
}

// 创建会话并存储refresh token到数据库
export async function createSession(userId: string): Promise<string> {
  const refreshToken = await signRefreshToken(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后

  const db = await getDb();
  await db.insert(sessionsTable).values({
    id: refreshToken,
    userId,
    expiresAt,
  });

  await setRefreshCookie(refreshToken);
  return refreshToken;
}

// 删除会话（登出时使用）
export async function deleteSession(refreshToken: string) {
  const db = await getDb();
  await db.delete(sessionsTable).where(eq(sessionsTable.id, refreshToken));
}