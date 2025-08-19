import { NextRequest, NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await removeAuthCookie();
    
    const response = NextResponse.json({ 
      message: 'Logged out successfully',
      redirect: '/login'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

// 支持 GET 请求用于前端链接
export async function GET(request: NextRequest) {
  try {
    await removeAuthCookie();
    
    // 重定向到登录页
    const url = new URL('/login', request.url);
    url.searchParams.set('logout', 'success');
    
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}