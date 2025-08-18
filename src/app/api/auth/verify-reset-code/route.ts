import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { emailVerificationTable } from '@/db/schema';
import { getDb } from '@/lib/db';

interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyResetCodeRequest;
    const email = body?.email;
    const code = body?.code;

    if (!email || !code) {
      return NextResponse.json({ error: '邮箱和验证码不能为空' }, { status: 400 });
    }

    const db = await getDb();

    // 验证验证码
    const existingCode = await db.select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.email, email),
          eq(emailVerificationTable.code, code),
          eq(emailVerificationTable.used, false)
        )
      )
      .limit(1);

    if (existingCode.length === 0) {
      return NextResponse.json({ error: '验证码无效' }, { status: 400 });
    }

    const verification = existingCode[0];
    
    // 检查验证码是否过期
    if (new Date() > verification.expires_at) {
      return NextResponse.json({ error: '验证码已过期' }, { status: 400 });
    }

    // 标记验证码为已使用
    await db.update(emailVerificationTable)
      .set({ used: true })
      .where(eq(emailVerificationTable.id, verification.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('验证重置验证码错误:', error);
    return NextResponse.json({ error: '验证验证码失败' }, { status: 500 });
  }
}