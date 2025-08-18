import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// 定义 JWT 载荷的类型
interface UserJwtPayload {
    userId: string;
    username: string;
    iat: number; // Issued at
    exp: number; // Expires at
}

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        // 在服务器上记录严重错误
        console.error('JWT_SECRET not configured');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // 如果没有 Token，并且请求的是受保护的 API，则返回 401
    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        // 验证 JWT
        const { payload } = await jwtVerify<UserJwtPayload>(
            token,
            new TextEncoder().encode(secret)
        );

        // (可选但推荐) 将用户信息附加到请求头中，方便后续 API 路由直接使用
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('X-User-Id', payload.userId);
        requestHeaders.set('X-User-Name', payload.username);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

    } catch (error) {
        // Token 无效 (过期、签名错误等)
        console.log('JWT Verification Error:', error);
        const response = NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        // 清除无效的 cookie
        response.cookies.delete('auth_token');
        return response;
    }
}

// 使用 matcher 来指定哪些路由需要被这个中间件保护
export const config = {
    matcher: [
        '/api/profile/:path*',
        '/api/protected-route/:path*',
    ],
};