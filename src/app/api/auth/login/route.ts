import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { usersTable, authMethodsTable } from '@/db/schema';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/crypto';
import * as jose from 'jose';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    const db = await getDb();

    // 获取用户信息
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const userData = user[0];

    // 获取密码
    const authMethod = await db.select()
      .from(authMethodsTable)
      .where(
        and(
          eq(authMethodsTable.userId, userData.id),
          eq(authMethodsTable.provider, 'email')
        )
      )
      .limit(1);

    if (authMethod.length === 0) {
      return NextResponse.json({ error: '认证方式不存在' }, { status: 404 });
    }

    const storedPassword = authMethod[0].hashed_password;
    if (!storedPassword) {
      return NextResponse.json({ error: '密码未设置' }, { status: 400 });
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, storedPassword);
    if (!isValidPassword) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // 生成JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT({ 
      userId: userData.id,
      email: userData.email,
      username: userData.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secretKey);

    // 创建响应并设置cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24小时
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}