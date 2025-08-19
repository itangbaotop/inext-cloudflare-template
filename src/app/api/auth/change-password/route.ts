import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { usersTable, authMethodsTable } from '@/db/schema';
import { getDb } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/crypto';
import * as jose from 'jose';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 验证JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const secretKey = new TextEncoder().encode(secret);
    let payload;
    
    try {
      const result = await jose.jwtVerify(token, secretKey);
      payload = result.payload;
    } catch (error) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    const body = (await request.json()) as ChangePasswordRequest;
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '当前密码和新密码不能为空' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少6位' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: '新密码不能与当前密码相同' }, { status: 400 });
    }

    const db = await getDb();

    // 获取用户信息和当前密码
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const authMethod = await db.select()
      .from(authMethodsTable)
      .where(
        and(
          eq(authMethodsTable.userId, userId),
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

    // 验证当前密码
    const isValidPassword = await verifyPassword(currentPassword, storedPassword);
    if (!isValidPassword) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 401 });
    }

    // 哈希新密码
    const hashedNewPassword = await hashPassword(newPassword);

    // 更新密码
    await db.update(authMethodsTable)
      .set({ hashed_password: hashedNewPassword })
      .where(
        and(
          eq(authMethodsTable.userId, userId),
          eq(authMethodsTable.provider, 'email')
        )
      );

    return NextResponse.json({ 
      success: true,
      message: '密码修改成功' 
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    return NextResponse.json({ error: '密码修改失败' }, { status: 500 });
  }
}