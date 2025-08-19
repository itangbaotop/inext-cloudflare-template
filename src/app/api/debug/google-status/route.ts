import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nextPublicGoogleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    },
    cookies: {
      authCookie: cookieStore.get('auth-token') ? '存在' : '不存在',
      allCookies: cookieStore.getAll().map((c: { name: string }) => c.name),
    },
    headers: {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    },
    endpoints: {
      googleGis: '/api/auth/google-gis',
      googleCallback: '/api/auth/google/callback',
      user: '/api/auth/user',
    },
    suggestions: [
      '检查浏览器控制台的网络请求',
      '确保已授权的JavaScript来源包含当前域名',
      '验证Google Cloud Console中的OAuth配置',
      '检查数据库连接是否正常',
    ],
  };

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}