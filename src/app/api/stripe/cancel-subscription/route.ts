import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 查找Stripe客户
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: '未找到客户' }, { status: 404 });
    }

    const customerId = customers.data[0].id;

    // 获取活跃订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: '未找到活跃订阅' }, { status: 404 });
    }

    const subscription = subscriptions.data[0];

    // 设置订阅在当前周期结束后取消
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('取消订阅失败:', error);
    return NextResponse.json({ error: '取消订阅失败' }, { status: 500 });
  }
}