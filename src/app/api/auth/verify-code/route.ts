// src/app/api/auth/verify-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { emailVerificationTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body as { email: string; code: string };

    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const db = await getDb();
    
    // 查找验证码
    const verification = await db
      .select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.email, email),
          eq(emailVerificationTable.code, code),
          eq(emailVerificationTable.used, false)
        )
      );

    if (!verification || verification.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    const verificationRecord = verification[0];

    // 检查是否过期
    if (new Date() > new Date(verificationRecord.expires_at)) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // 标记验证码为已使用
    await db
      .update(emailVerificationTable)
      .set({ used: true })
      .where(eq(emailVerificationTable.id, verificationRecord.id));

    return NextResponse.json({ success: true, message: 'Email verified successfully' });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}