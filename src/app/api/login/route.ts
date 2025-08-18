import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getDb } from '@/lib/db';
import { usersTable, authMethodsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';

type UserSignInPayload = {
    username: string; // 可以是邮箱或用户名
    password: string;
}

export async function POST(request: NextRequest) {
    const { username, password }: UserSignInPayload = await request.json();

    if (!username || !password) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    try {
        const db = await getDb();
        
        // 1. 查找用户和认证信息
        const user = await db.select().from(usersTable)
          .where(eq(usersTable.username, username.toLowerCase()))
          .get();
        
        if (!user) {
          return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }

        // 2. 查找对应的认证方式
        const authMethod = await db.select()
          .from(authMethodsTable)
          .where(eq(authMethodsTable.userId, user.id))
          .get();
        
        if (!user) {
            return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }

        // 2. 验证密码
        if (!authMethod || !authMethod.hashed_password) {
          return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }

        const isValidPassword = await new Argon2id().verify(authMethod.hashed_password, password);
        if (!isValidPassword) {
          return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }
        
        // 3. 身份验证成功，准备 JWT 的载荷 (Payload)
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        const payload = {
            userId: user.id,
            username: user.username,
        };

        // 4. 使用 `jose` 创建并签名 JWT
        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h') // 设置 2 小时有效期
            .sign(new TextEncoder().encode(secret));

        // 5. 将 JWT 设置到 HttpOnly Cookie 中
        const response = NextResponse.json({ message: "Login successful" });
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 2, // 2 小时
        });

        return response;

    } catch (e) {
        console.error("Login error:", e);
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
}