import { OAuth2RequestError } from 'arctic';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { google } from '@/lib/auth';
import { signJWT, setAuthCookie, createSession } from '@/lib/jwt';

interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;
  const codeVerifier = cookieStore.get('google_code_verifier')?.value;

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_request', request.url));
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`
      }
    });
    const googleUser: GoogleUser = await googleUserResponse.json();

    const db = await getDb();
    
    // 检查用户是否已存在
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, googleUser.email))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      // 更新现有用户的 Google ID
      userId = existingUser[0].id;
      await db
        .update(usersTable)
        .set({
          google_id: googleUser.sub,
          email_verified: googleUser.email_verified,
          updated_at: new Date()
        })
        .where(eq(usersTable.id, userId));
    } else {
      // 创建新用户 - 使用随机UUID作为ID
      userId = crypto.randomUUID();
      await db.insert(usersTable).values({
        id: userId,
        email: googleUser.email,
        display_name: googleUser.name,
        avatar_url: googleUser.picture,
        google_id: googleUser.sub,
        email_verified: googleUser.email_verified,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // 创建JWT令牌
    const jwtPayload = {
      userId,
      email: googleUser.email,
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      emailVerified: googleUser.email_verified,
      googleId: googleUser.sub,
    };

    const token = await signJWT(jwtPayload);
    await setAuthCookie(token);
    
    // 创建refresh token会话
    await createSession(userId);
    
    const response = NextResponse.redirect(new URL('/', request.url));
    
    return response;

  } catch (e) {
    console.error('Google OAuth error:', e);
    if (e instanceof OAuth2RequestError) {
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}