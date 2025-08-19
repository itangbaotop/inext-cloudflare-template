import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT, getAuthToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    const db = await getDb();
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    const userData = user[0];
    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        displayName: userData.display_name,
        avatarUrl: userData.avatar_url,
        emailVerified: Boolean(userData.email_verified),
        googleId: userData.google_id,
      },
      authenticated: true,
      authMethod: 'jwt'
    });
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
  }
}