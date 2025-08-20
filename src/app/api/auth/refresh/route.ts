import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { usersTable, sessionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 刷新token的API端点
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ error: '未找到刷新令牌' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    // 验证refresh token
    const secretKey = new TextEncoder().encode(secret);
    let payload;
    
    try {
      const result = await jwtVerify(refreshToken, secretKey);
      payload = result.payload;
    } catch (error) {
      return NextResponse.json({ error: '无效的刷新令牌' }, { status: 401 });
    }

    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json({ error: '无效的令牌载荷' }, { status: 401 });
    }

    const db = await getDb();
    
    // 检查refresh token是否在数据库中有效
    const validSession = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, refreshToken))
      .limit(1);

    if (validSession.length === 0) {
      return NextResponse.json({ error: '会话已过期' }, { status: 401 });
    }

    // 获取用户信息
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    const userData = user[0];

    // 生成新的access token
    const newAccessToken = await new SignJWT({
      userId: userData.id,
      email: userData.email,
      displayName: userData.display_name || userData.username,
      avatarUrl: userData.avatar_url,
      emailVerified: Boolean(userData.email_verified),
      googleId: userData.google_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // 15分钟有效期
      .sign(secretKey);

    // 创建响应
    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });

    // 设置新的access token cookie
    response.cookies.set('auth_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15分钟
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Token刷新错误:', error);
    return NextResponse.json({ error: '刷新令牌失败' }, { status: 500 });
  }
}