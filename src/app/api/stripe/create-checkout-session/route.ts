import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: '用户未登录' }, { status: 401 });
    }

    const { priceId, plan, billingCycle } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: '价格ID不能为空' }, { status: 400 });
    }

    // 创建或获取Stripe客户
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // 更新用户记录
      // 这里需要更新数据库中的用户记录
      // 暂时跳过，因为需要数据库操作
    }

    // 创建结账会话
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/subscription?success=true`,
      cancel_url: `${request.headers.get('origin')}/subscription/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan,
        billingCycle: billingCycle,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('创建结账会话失败:', error);
    return NextResponse.json(
      { error: '创建结账会话失败' },
      { status: 500 }
    );
  }
}