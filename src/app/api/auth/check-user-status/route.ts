import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { usersTable, authMethodsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email: string };

    if (!email) {
      return NextResponse.json(
        { error: '邮箱地址不能为空' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // 查询用户是否存在
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (user.length === 0) {
      // 情况 C：邮箱未注册
      return NextResponse.json({
        exists: false,
        status: 'not_registered',
        message: '该邮箱未注册'
      });
    }

    // 查询用户的认证方式
    const authMethod = await db.select()
      .from(authMethodsTable)
      .where(
        and(
          eq(authMethodsTable.userId, user[0].id),
          eq(authMethodsTable.provider, 'email')
        )
      )
      .limit(1);

    if (authMethod.length > 0 && authMethod[0].hashed_password) {
      // 情况 A：已注册且设置了密码
      return NextResponse.json({
        exists: true,
        status: 'password_user',
        message: '该邮箱已注册，请输入密码登录',
        hasPassword: true
      });
    } else {
      // 情况 B：已注册但没有设置密码（纯魔法链接用户）
      return NextResponse.json({
        exists: true,
        status: 'magic_link_only',
        message: '该邮箱已注册，我们将发送登录链接到您的邮箱',
        hasPassword: false
      });
    }

  } catch (error) {
    console.error('检查用户状态失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}