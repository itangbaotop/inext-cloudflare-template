import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

import { getDb } from '@/lib/db';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signJWT, setAuthCookie } from '@/lib/jwt';

interface GoogleGISUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

// 🔧 统一的 CORS 头部配置
function getCorsHeaders(origin?: string | null) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1:3000',
    'https://127.0.0.1:3000',
    'https://accounts.google.com',
    // 添加您的生产域名
    // 'https://yourdomain.com'
  ];

  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'Content-Type, Authorization',
    // 🆕 Google Identity Services 需要的头部
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    // 🆕 FedCM 相关头部
    'Permissions-Policy': 'identity-credentials-get=*',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // 🆕 确保响应类型正确
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

// 🔧 处理 OPTIONS 预检请求
export async function OPTIONS(request: NextRequest): Promise<Response> {
  console.log('🔧 OPTIONS request received');
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  console.log('🚀 开始处理Google登录请求...');
  console.log('📍 Origin:', origin);
  console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // 🔧 确保请求体存在
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ 无法解析请求体:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: 'Request body must be valid JSON'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const { credential } = body as { credential: string };
    
    console.log('📋 收到凭据长度:', credential?.length);
    
    if (!credential) {
      console.error('❌ 缺少凭据');
      return NextResponse.json({ 
        error: 'Missing credential',
        details: 'Google credential is required'
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // 解码JWT查看内容（用于调试）
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]));
      console.log('👤 解码的用户信息:', {
        email: payload.email,
        name: payload.name,
        aud: payload.aud,
        iss: payload.iss,
        exp: new Date(payload.exp * 1000)
      });
    } catch (decodeError) {
      console.warn('⚠️ JWT解码失败:', decodeError);
    }

    // 🔧 验证环境变量
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('❌ Google Client ID 未配置');
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Google Client ID not configured'
      }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // 使用Google官方库验证JWT令牌
    console.log('🔍 开始验证Google令牌...');
    
    const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    
    let googleUser: GoogleGISUser;
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('无法获取令牌载荷');
      }

      googleUser = {
        sub: payload.sub!,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        email_verified: payload.email_verified || false,
      };
      
      console.log('✅ Google令牌验证成功:', {
        email: googleUser.email,
        name: googleUser.name,
        issuer: payload.iss,
        audience: payload.aud,
        expiration: new Date(payload.exp! * 1000)
      });
      
    } catch (verifyError) {
      console.error('❌ Google令牌验证失败:', verifyError);
      return NextResponse.json({ 
        error: 'Invalid Google token', 
        details: verifyError instanceof Error ? verifyError.message : '验证失败',
        timestamp: new Date().toISOString()
      }, { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // 数据库操作
    const db = await getDb();
    console.log('🗄️ 数据库连接成功');
    
    // 检查用户是否已存在
    console.log('🔍 检查用户是否存在:', googleUser.email);
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, googleUser.email))
      .limit(1);

    console.log('👥 现有用户检查结果:', existingUser.length > 0 ? '找到用户' : '新用户');

    let userId: string;

    if (existingUser.length > 0) {
      // 更新现有用户的 Google ID
      userId = existingUser[0].id;
      console.log('📝 更新现有用户 ID:', userId);
      await db
        .update(usersTable)
        .set({
          google_id: googleUser.sub,
          email_verified: googleUser.email_verified,
          updated_at: new Date()
        })
        .where(eq(usersTable.id, userId));
      console.log('✅ 用户更新完成');
    } else {
      // 创建新用户
      userId = crypto.randomUUID();
      console.log('🆕 创建新用户 ID:', userId);
      await db.insert(usersTable).values({
        id: userId,
        email: googleUser.email,
        display_name: googleUser.name,
        avatar_url: googleUser.picture,
        google_id: googleUser.sub,
        email_verified: googleUser.email_verified,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✅ 新用户创建完成');
    }

    // 创建JWT令牌
    console.log('🔑 开始创建JWT令牌...');
    const jwtPayload = {
      userId,
      email: googleUser.email,
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      emailVerified: googleUser.email_verified,
      googleId: googleUser.sub,
    };

    console.log('📋 JWT载荷:', jwtPayload);
    const token = await signJWT(jwtPayload);
    console.log('✅ JWT令牌创建成功');
    
    console.log('🍪 设置认证Cookie...');
    await setAuthCookie(token);
    console.log('✅ Cookie设置完成');

    // 🔧 返回成功响应
    const response = NextResponse.json({ 
      success: true, 
      user: jwtPayload,
      redirectTo: '/',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: corsHeaders 
    });

    console.log('✅ 响应发送成功');
    return response;

  } catch (error) {
    console.error('💥 GIS认证错误:', error);
    console.error('📍 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
    
    return NextResponse.json({ 
      error: 'Authentication failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// 🔧 添加 GET 方法用于健康检查
export async function GET(request: NextRequest): Promise<Response> {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  const debugInfo = {
    timestamp: new Date().toISOString(),
    env: {
      hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      hasJwtSecret: !!(process.env.JWT_SECRET || process.env.AUTH_SECRET),
      nodeEnv: process.env.NODE_ENV,
    },
    endpoints: {
      googleTokenInfo: 'https://oauth2.googleapis.com/tokeninfo',
      currentDomain: request.nextUrl.origin,
    },
    status: 'Google GIS endpoint active',
    cors: {
      origin: origin,
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000',
      ]
    }
  };

  return NextResponse.json(debugInfo, { 
    status: 200,
    headers: corsHeaders 
  });
}
