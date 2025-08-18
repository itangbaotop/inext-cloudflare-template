import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    return NextResponse.json({ 
      user: {
        id: payload.userId,
        username: payload.username
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: '无效的令牌' }, { status: 401 });
  }
}