import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { usersTable, authMethodsTable, emailVerificationTable } from '@/db/schema';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResetPasswordRequest;
    const email = body?.email;
    const code = body?.code;
    const newPassword = body?.newPassword;

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: '邮箱、验证码和新密码不能为空' }, { status: 400 });
    }

    // 验证密码强度
    if (newPassword.length < 8) {
      return NextResponse.json({ error: '密码至少需要8个字符' }, { status: 400 });
    }

    const db = await getDb();

    // 验证验证码是否正确（允许已使用的验证码，因为可能在验证步骤已经标记为已使用）
    const existingCode = await db.select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.email, email),
          eq(emailVerificationTable.code, code)
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

    // 如果验证码还未被标记为已使用，则标记它
    if (!verification.used) {
      await db.update(emailVerificationTable)
        .set({ used: true })
        .where(eq(emailVerificationTable.id, verification.id));
    }

    // 获取用户信息
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const userId = user[0].id;

    // 更新用户密码
    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(authMethodsTable)
      .set({ hashed_password: hashedPassword })
      .where(
        and(
          eq(authMethodsTable.userId, userId),
          eq(authMethodsTable.provider, 'email')
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('重置密码错误:', error);
    return NextResponse.json({ error: '重置密码失败' }, { status: 500 });
  }
}