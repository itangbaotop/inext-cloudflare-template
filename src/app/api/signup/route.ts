// src/app/api/signup/route.ts
import { usersTable, authMethodsTable } from '@/db/schema';
import { Argon2id } from 'oslo/password';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SignJWT } from 'jose';

type SignUpBody = {
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const { email, password }: SignUpBody = await request.json();

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const hashedPassword = await new Argon2id().hash(password);
  const userId = crypto.randomUUID();

  try {
    // 1. 创建用户基础信息
    await db.insert(usersTable).values({
      id: userId,
      email: email,
      username: email, // 使用邮箱作为用户名
      email_verified: true, // 因为是通过邮箱注册验证的
    });

    // 2. 创建邮箱认证方式
    await db.insert(authMethodsTable).values({
      id: crypto.randomUUID(),
      userId: userId,
      provider: 'email',
      hashed_password: hashedPassword,
    });

    // 创建 JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const payload = {
      userId: userId,
      username: email,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(new TextEncoder().encode(secret));

    // 设置 cookie
    const response = NextResponse.json({ success: true }, { status: 201 });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 小时
    });

    return response;
  } catch (error) {
    console.log('Signup error', error);
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }
}