import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { priceId, successUrl, cancelUrl } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: '价格ID不能为空' }, { status: 400 });
    }

    // 如果用户已经是付费用户，拒绝创建新的 checkout session
    if (user.subscriptionStatus === 'active') {
      return NextResponse.json({ error: '您已经是付费用户' }, { status: 400 });
    }

    const session = await createCheckoutSession({
      priceId,
      userId: user.id,
      userEmail: user.email!,
      successUrl: successUrl || `${request.headers.get('origin')}/settings?tab=billing&success=true`,
      cancelUrl: cancelUrl || `${request.headers.get('origin')}/settings?tab=billing&canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('创建 Checkout Session 失败:', error);
    return NextResponse.json({ error: '创建支付会话失败' }, { status: 500 });
  }
}