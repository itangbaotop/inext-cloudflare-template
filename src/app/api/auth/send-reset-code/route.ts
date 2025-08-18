import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { usersTable, emailVerificationTable } from '@/db/schema';
import { getDb } from '@/lib/db';

interface SendResetCodeRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendResetCodeRequest;
    const email = body?.email;

    if (!email) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 });
    }

    const db = await getDb();

    // 检查邮箱是否存在
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: '邮箱未注册' }, { status: 404 });
    }

    // 生成验证码（6位数字）
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 在实际应用中，这里应该发送邮件
    console.log(`重置密码验证码已发送到 ${email}: ${code}`);

    // 存储验证码到数据库，设置10分钟过期
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(emailVerificationTable).values({
      id: crypto.randomUUID(),
      email,
      code,
      expires_at: expiresAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('发送重置验证码错误:', error);
    return NextResponse.json({ error: '发送验证码失败' }, { status: 500 });
  }
}