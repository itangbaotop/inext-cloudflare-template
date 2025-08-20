import { Google } from "arctic";

export const google = new Google(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
);

// 简化auth.ts，移除Lucia配置，因为我们改用JWT
import { getAuthToken, verifyJWT } from './jwt';
import { getDb } from './db';
import { usersTable, authMethodsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  googleId?: string;
  githubId?: string;
  provider?: string;
  createdAt?: Date;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (userResult.length === 0) return null;

  const user = userResult[0];
  
  // 获取用户的认证方式
  const authMethods = await db
    .select()
    .from(authMethodsTable)
    .where(eq(authMethodsTable.userId, user.id))
    .limit(1);

  const authMethod = authMethods[0];
  const provider = authMethod?.provider || (user.google_id ? 'google' : 'local');

  return {
    id: user.id,
    email: user.email || '',
    displayName: user.display_name || '未设置名称',
    avatarUrl: user.avatar_url,
    emailVerified: Boolean(user.email_verified),
    googleId: user.google_id,
    githubId: provider === 'github' ? authMethod?.provider_id : undefined,
    provider: provider,
    createdAt: user.created_at,
  };
}

export async function createUser(userData: {
  email: string;
  displayName: string;
  avatar?: string;
  provider: string;
  providerId: string;
}) {
  const db = await getDb();
  
  // 生成用户ID
  const userId = crypto.randomUUID();
  
  const [newUser] = await db
    .insert(usersTable)
    .values({
      id: userId,
      email: userData.email,
      display_name: userData.displayName,
      avatar_url: userData.avatar,
      email_verified: true, // OAuth 用户默认验证邮箱
      google_id: userData.provider === 'google' ? userData.providerId : null,
      created_at: new Date(),
    })
    .returning();

  // 记录认证方式
  await db.insert(authMethodsTable).values({
    id: crypto.randomUUID(),
    userId: userId,
    provider: userData.provider,
    provider_id: userData.providerId,
  });

  return {
    id: newUser.id,
    email: newUser.email || '',
    displayName: newUser.display_name || '未设置名称',
    avatarUrl: newUser.avatar_url,
    emailVerified: Boolean(newUser.email_verified),
    googleId: newUser.google_id,
    provider: userData.provider,
    createdAt: newUser.created_at,
  };
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const db = await getDb();
  
  // 获取用户信息和认证方式
  const userResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1);

  if (userResult.length === 0) return null;

  const user = userResult[0];
  
  // 获取用户的认证方式
  const authMethods = await db
    .select()
    .from(authMethodsTable)
    .where(eq(authMethodsTable.userId, user.id))
    .limit(1);

  const authMethod = authMethods[0];
  const provider = authMethod?.provider || (user.google_id ? 'google' : 'local');

  return {
    id: user.id,
    email: user.email || '',
    displayName: user.display_name || '未设置名称',
    avatarUrl: user.avatar_url,
    emailVerified: Boolean(user.email_verified),
    googleId: user.google_id,
    githubId: provider === 'github' ? authMethod?.provider_id : undefined,
    provider: provider,
    createdAt: user.created_at,
  };
}