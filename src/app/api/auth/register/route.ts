import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { usersTable, authMethodsTable, emailVerificationTable } from '@/db/schema';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';
import * as jose from 'jose';

interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  verificationCode: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequest;
    const { email, password, displayName, firstName, lastName, phone, verificationCode } = body;

    if (!email || !password || !displayName || !verificationCode) {
      return NextResponse.json({ error: '邮箱、密码、显示名称和验证码不能为空' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少需要8个字符' }, { status: 400 });
    }

    const db = await getDb();

    // 验证验证码
    const verification = await db
      .select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.email, email),
          eq(emailVerificationTable.code, verificationCode),
          eq(emailVerificationTable.used, false)
        )
      );

    if (!verification || verification.length === 0) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }

    const verificationRecord = verification[0];

    // 检查验证码是否过期
    if (new Date() > new Date(verificationRecord.expires_at)) {
      return NextResponse.json({ error: '验证码已过期' }, { status: 400 });
    }

    // 检查邮箱是否已注册
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: '邮箱已被注册' }, { status: 400 });
    }

    // 检查显示名称是否已存在
    const existingDisplayName = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, displayName))
      .limit(1);

    if (existingDisplayName.length > 0) {
      return NextResponse.json({ error: '显示名称已被使用' }, { status: 400 });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    // 标记验证码为已使用
    await db
      .update(emailVerificationTable)
      .set({ used: true })
      .where(eq(emailVerificationTable.id, verificationRecord.id));

    // 创建用户
    await db.insert(usersTable).values({
      id: userId,
      email,
      username: displayName,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 创建认证方式记录
    await db.insert(authMethodsTable).values({
      id: crypto.randomUUID(),
      userId,
      provider: 'email',
      hashed_password: hashedPassword,
      created_at: new Date(),
    });

    // 生成JWT token让用户自动登录
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT({ 
      userId: userId,
      email: email,
      username: displayName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secretKey);

    // 创建响应并设置cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: userId,
        email: email,
        username: displayName,
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
    console.error('注册错误:', error);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}