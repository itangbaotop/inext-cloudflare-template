import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { routing } from '../i18n.config';

// 定义 JWT 载荷的类型
interface UserJwtPayload {
    userId: string;
    username: string;
    iat: number; // Issued at
    exp: number; // Expires at
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 处理 Google GIS 和 One Tap 的 CORS 预检请求
    if (pathname.startsWith('/api/auth/google-gis') && request.method === 'OPTIONS') {
        console.log('✅ Middleware: Handling Google Auth OPTIONS preflight request');
        
        const response = new NextResponse(null, { status: 204 });
        
        // 获取请求来源
        const origin = request.headers.get('origin');
        const allowedOrigins = [
            'http://localhost:3000',
            'https://localhost:3000',
            'http://127.0.0.1:3000',
            'https://127.0.0.1:3000',
            'https://accounts.google.com',
        ];
        
        const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : 'https://accounts.google.com';
        
        response.headers.set('Access-Control-Allow-Origin', corsOrigin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
        response.headers.set('Permissions-Policy', 'identity-credentials-get=*');
        
        return response;
    }
    
    // 1. 使用 next-intl 处理国际化路由
    const handleI18nRouting = createIntlMiddleware(routing);
    const response = handleI18nRouting(request);

    // 2. JWT验证功能（仅适用于API路由）
    if (pathname.startsWith('/api/')) {
        // 如果是认证相关的API路由，直接跳过国际化处理
        if (pathname.startsWith('/api/auth/') && pathname !== '/api/auth/refresh') {
            return NextResponse.next();
        }

        const token = request.cookies.get('auth_token')?.value;
        const secret = process.env.JWT_SECRET;

        // 只对受保护的API路由进行JWT验证
        const protectedApiPaths = ['/api/profile/', '/api/protected-route/'];
        const isProtectedApi = protectedApiPaths.some(path => pathname.startsWith(path));

        if (isProtectedApi) {
            if (!secret) {
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

                // 将用户信息附加到请求头中
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
                const errorResponse = NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
                // 清除无效的 cookie
                errorResponse.cookies.delete('auth_token');
                return errorResponse;
            }
        }

        // 其他API路由直接跳过国际化处理
        return NextResponse.next();
    }

    // 继续处理其他所有请求
    return response;
}

// 配置 matcher，让 middleware 在特定路径上运行
export const config = {
    matcher: [
        // 匹配所有路径，除了静态文件和图片等
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
        // 显式包含API认证路由，确保CORS头生效
        '/api/auth/:path*'
    ],
};