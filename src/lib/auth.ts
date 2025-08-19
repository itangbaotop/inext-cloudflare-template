import { Google } from "arctic";

export const google = new Google(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
);

// 简化auth.ts，移除Lucia配置，因为我们改用JWT
import { getAuthToken, verifyJWT } from './jwt';
import { getDb } from './db';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  googleId?: string;
  createdAt?: Date;
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const db = await getDb();
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1);

  if (user.length === 0) return null;

  return {
    id: user[0].id,
    email: user[0].email || '',
    displayName: user[0].display_name || '未设置名称',
    avatarUrl: user[0].avatar_url,
    emailVerified: Boolean(user[0].email_verified),
    googleId: user[0].google_id,
    createdAt: user[0].created_at,
  };
}