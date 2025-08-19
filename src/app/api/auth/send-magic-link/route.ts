import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { usersTable, authTokensTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { nanoid } from 'nanoid';

function generateMagicToken() {
  return randomBytes(32).toString('hex');
}

function generateId() {
  return nanoid();
}

export async function POST(request: NextRequest) {
  try {
    const { email, redirectUrl = '/' } = await request.json() as { email: string; redirectUrl?: string };

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
    
    // 查询用户
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    let userId: string;
    
    if (user.length === 0) {
      // 如果用户不存在，创建新用户（注册流程）
      const newUser = await db.insert(usersTable).values({
        id: generateId(),
        email,
        display_name: email.split('@')[0], // 使用邮箱前缀作为默认显示名
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }).returning();
      
      userId = newUser[0].id;
    } else {
      // 已存在用户
      userId = user[0].id;
    }

    // 生成魔法链接令牌
    const token = generateMagicToken();
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15分钟有效

    // 删除该用户的旧令牌
    await db.delete(authTokensTable).where(eq(authTokensTable.userId, userId));

    // 保存新令牌
    await db.insert(authTokensTable).values({
      id: generateId(),
      userId,
      token,
      type: 'magic_link',
      expires_at,
      created_at: new Date()
    });

    // 构建魔法链接
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/magic-login?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`;

    // 发送邮件
    try {
      await sendEmail({
        to: email,
        subject: '登录链接 - 点击即可登录',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">登录您的账户</h2>
            <p>您好！</p>
            <p>我们收到了您的登录请求。点击下方按钮即可安全登录：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                点击登录
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              此链接将在15分钟后过期，如果这不是您的操作，请忽略此邮件。
            </p>
            <p style="color: #666; font-size: 14px;">
              如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
              <span style="word-break: break-all;">${magicLink}</span>
            </p>
          </div>
        `,
        text: `
登录您的账户

您好！

我们收到了您的登录请求。请使用以下链接登录：

${magicLink}

此链接将在15分钟后过期，如果这不是您的操作，请忽略此邮件。
        `
      });
    } catch (emailError) {
      console.error('发送邮件失败:', emailError);
      // 即使邮件发送失败，也返回成功，避免暴露用户状态
    }

    return NextResponse.json({
      success: true,
      message: '登录链接已发送到您的邮箱'
    });

  } catch (error) {
    console.error('发送魔法链接失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}