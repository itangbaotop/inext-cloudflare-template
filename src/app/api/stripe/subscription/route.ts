import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 查找或创建Stripe客户
    let customerId = null;
    
    // 首先查找是否有已存在的Stripe客户
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      return NextResponse.json(null);
    }

    // 获取活跃订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(null);
    }

    const subscription = subscriptions.data[0];
    const price = subscription.items.data[0].price;
    const product = await stripe.products.retrieve(price.product as string);

    return NextResponse.json({
      id: subscription.id,
      plan: product.metadata.plan || 'basic',
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      price: price.unit_amount || 0,
      currency: price.currency,
      interval: price.recurring?.interval || 'month'
    });

  } catch (error) {
    console.error('获取订阅失败:', error);
    return NextResponse.json({ error: '获取订阅失败' }, { status: 500 });
  }
}