import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authTokensTable, usersTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { SignJWT } from 'jose';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const redirectUrl = searchParams.get('redirect') || '/';

    if (!token) {
      return NextResponse.json(
        { error: '无效的登录链接' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // 查找令牌
    const authToken = await db.select()
      .from(authTokensTable)
      .where(
        and(
          eq(authTokensTable.token, token),
          eq(authTokensTable.type, 'magic_link')
        )
      )
      .limit(1);

    if (authToken.length === 0) {
      return NextResponse.json(
        { error: '登录链接无效或已过期' },
        { status: 400 }
      );
    }

    const tokenData = authToken[0];

    // 检查是否过期
    if (new Date() > tokenData.expires_at) {
      return NextResponse.json(
        { error: '登录链接已过期' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, tokenData.userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const userData = user[0];

    // 更新邮箱验证状态（如果是新用户）
    if (!userData.email_verified) {
      await db.update(usersTable)
        .set({ email_verified: true })
        .where(eq(usersTable.id, userData.id));
    }

    // 删除已使用的令牌
    await db.delete(authTokensTable).where(eq(authTokensTable.id, tokenData.id));

    // 生成JWT令牌
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const authTokenString = await new SignJWT({
      userId: userData.id,
      email: userData.email,
      displayName: userData.display_name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(secret));

    // 创建响应并重定向
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // 设置HTTP-only cookie
    response.cookies.set('auth_token', authTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7天
    });

    return response;

  } catch (error) {
    console.error('魔法链接登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}