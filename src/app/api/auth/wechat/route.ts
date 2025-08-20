import { NextRequest, NextResponse } from 'next/server';
import { WeChatAuth } from '@/lib/wechat-auth';
import { getDb } from '@/lib/db';
import { usersTable, authMethodsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateJWT } from '@/lib/jwt';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=wechat_auth_failed', request.url));
    }

    // 验证state防止CSRF攻击
    if (!state) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
    }

    // 获取access_token
    const tokenData = await WeChatAuth.getAccessToken(code);
    
    // 获取用户信息
    const userInfo = await WeChatAuth.getUserInfo(tokenData.access_token, tokenData.openid);

    const db = getDb();
    
    // 检查用户是否已存在（通过openid）
    let user = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      username: usersTable.username,
      display_name: usersTable.display_name,
      avatar_url: usersTable.avatar_url,
      email_verified: usersTable.email_verified,
      created_at: usersTable.created_at,
    })
    .from(usersTable)
    .innerJoin(authMethodsTable, eq(usersTable.id, authMethodsTable.user_id))
    .where(eq(authMethodsTable.provider_id, userInfo.openid))
    .limit(1)
    .then(rows => rows[0]);

    if (!user) {
      // 创建新用户
      const userId = crypto.randomUUID();
      const now = Date.now();
      
      await db.insert(usersTable).values({
        id: userId,
        email: `${userInfo.openid}@wechat.temp`, // 临时邮箱
        username: userInfo.nickname,
        display_name: userInfo.nickname,
        avatar_url: userInfo.headimgurl,
        email_verified: true,
        created_at: now,
        updated_at: now,
      });

      await db.insert(authMethodsTable).values({
        id: crypto.randomUUID(),
        user_id: userId,
        provider: 'wechat',
        provider_id: userInfo.openid,
        created_at: now,
      });

      user = {
        id: userId,
        email: `${userInfo.openid}@wechat.temp`,
        username: userInfo.nickname,
        display_name: userInfo.nickname,
        avatar_url: userInfo.headimgurl,
        email_verified: true,
        created_at: new Date(now),
      };
    }

    // 生成JWT token
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
      emailVerified: user.email_verified,
    });

    // 创建响应并重定向到首页
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // 设置cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('WeChat auth error:', error);
    return NextResponse.redirect(new URL('/login?error=wechat_auth_error', request.url));
  }
}

// 生成微信登录URL
export async function POST(request: NextRequest) {
  try {
    const { redirectUri } = await request.json();
    
    // 生成随机state
    const state = crypto.randomUUID();
    
    // 生成授权URL
    const authUrl = WeChatAuth.getAuthorizationUrl(state, redirectUri);
    
    return NextResponse.json({
      url: authUrl,
      state,
    });

  } catch (error) {
    console.error('Generate WeChat auth URL error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}