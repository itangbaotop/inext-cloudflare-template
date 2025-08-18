import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface CheckEmailRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckEmailRequest;
    const email = body.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // 检查邮箱是否已存在
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email));

    return NextResponse.json({ exists: Array.isArray(user) && user.length > 0 });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}