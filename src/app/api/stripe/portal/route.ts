import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createCustomerPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: '您还没有 Stripe 客户记录' }, { status: 400 });
    }

    const { returnUrl } = await request.json();

    const portalSession = await createCustomerPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: returnUrl || `${request.headers.get('origin')}/settings?tab=billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('创建客户门户会话失败:', error);
    return NextResponse.json({ error: '创建管理门户失败' }, { status: 500 });
  }
}