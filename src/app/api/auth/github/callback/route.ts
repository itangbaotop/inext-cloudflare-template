import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUser, getUserByEmail } from '@/lib/auth';
import { generateJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code || !state) {
      return NextResponse.redirect(new URL('/login?error=invalid_request', process.env.NEXT_PUBLIC_APP_URL));
    }

    // 验证 state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('github_oauth_state');
    
    if (!storedState || storedState.value !== state) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', process.env.NEXT_PUBLIC_APP_URL));
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/login?error=configuration_error', process.env.NEXT_PUBLIC_APP_URL));
    }

    // 交换 code 获取 access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', process.env.NEXT_PUBLIC_APP_URL));
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();
    
    if (!githubUser.email) {
      // 获取用户邮箱
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary)?.email;
      
      if (!primaryEmail) {
        return NextResponse.redirect(new URL('/login?error=no_email', process.env.NEXT_PUBLIC_APP_URL));
      }
      
      githubUser.email = primaryEmail;
    }

    // 检查用户是否已存在
    let user = await getUserByEmail(githubUser.email);
    
    if (!user) {
      // 创建新用户
      user = await createUser({
        email: githubUser.email,
        displayName: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        provider: 'github',
        providerId: githubUser.id.toString(),
      });
    }

    // 生成 JWT token
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
    });

    // 清除 cookies
    const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL));
    response.cookies.delete('github_oauth_state');
    response.cookies.delete('github_code_verifier');
    
    // 设置认证 cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_error', process.env.NEXT_PUBLIC_APP_URL));
  }
}