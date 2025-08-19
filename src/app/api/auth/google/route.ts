import { generateState, generateCodeVerifier } from 'arctic';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { google } from '@/lib/auth';

export async function GET(request: NextRequest): Promise<Response> {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ['openid', 'email', 'profile'];
  const url = await google.createAuthorizationURL(state, codeVerifier, scopes);

  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax'
  });

  cookieStore.set('google_code_verifier', codeVerifier, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax'
  });

  return NextResponse.redirect(url);
}