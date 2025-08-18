// src/app/api/auth/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { emailVerificationTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const db = await getDb();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟有效

    // 删除该邮箱之前的验证码
    await db.delete(emailVerificationTable).where(eq(emailVerificationTable.email, email));

    // 保存新验证码
    await db.insert(emailVerificationTable).values({
      id: crypto.randomUUID(),
      email,
      code,
      expires_at: expiresAt,
    });

    // 在实际应用中，这里应该发送邮件
    // 这里为了演示，我们直接返回验证码
    console.log(`验证码已发送到 ${email}: ${code}`);

    return NextResponse.json({ 
      success: true, 
      message: '验证码已发送',
      code: process.env.NODE_ENV === 'development' ? code : undefined // 开发环境返回验证码
    });

  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}