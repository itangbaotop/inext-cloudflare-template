import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: '登出成功' });
    
    // 清除认证 cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // 立即过期
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: '登出失败' }, { status: 500 });
  }
}