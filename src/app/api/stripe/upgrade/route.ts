import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

const priceMap: Record<string, string> = {
  'plus-monthly': process.env.STRIPE_PLUS_MONTHLY_PRICE_ID!,
  'plus-yearly': process.env.STRIPE_PLUS_YEARLY_PRICE_ID!,
  'enterprise-monthly': process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
  'enterprise-yearly': process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { plan, interval } = await request.json();
    const priceId = priceMap[`${plan}-${interval}`];
    
    if (!priceId) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    // 查找或创建Stripe客户
    let customerId: string;
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName
      });
      customerId = customer.id;
    }

    // 检查是否有现有订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    let session;
    
    if (subscriptions.data.length > 0) {
      // 更新现有订阅
      const subscription = subscriptions.data[0];
      await stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId
        }],
        proration_behavior: 'create_prorations'
      });
      
      return NextResponse.json({ success: true });
    } else {
      // 创建新的结账会话
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?canceled=true`
      });

      return NextResponse.json({ url: session.url });
    }

  } catch (error) {
    console.error('升级套餐失败:', error);
    return NextResponse.json({ error: '升级套餐失败' }, { status: 500 });
  }
}