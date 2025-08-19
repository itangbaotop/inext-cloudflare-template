import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasJwtSecret: !!(process.env.JWT_SECRET || process.env.AUTH_SECRET),
      nextPublicGoogleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
    },
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000',
        'https://accounts.google.com',
      ],
      currentOrigin: request.nextUrl.origin,
    },
    intl: {
      locales: ['en', 'zh'],
      defaultLocale: 'zh',
      localePrefix: 'always',
    },
    endpoints: {
      googleGis: '/api/auth/google-gis',
      googleCallback: '/api/auth/google/callback',
      user: '/api/auth/user',
      debugConfig: '/api/debug/config',
      debugStatus: '/api/debug/google-status',
    },
    google: {
      clientIdFormat: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') ? 'valid' : 'invalid',
      requiredDomains: [
        'http://localhost:3000',
        'https://localhost:3000',
      ],
    },
    status: 'Configuration check complete',
    suggestions: [
      '检查浏览器控制台的网络请求',
      '确保已授权的JavaScript来源包含当前域名',
      '验证Google Cloud Console中的OAuth配置',
      '检查数据库连接是否正常',
      '确认所有环境变量已正确设置',
    ],
  };

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}