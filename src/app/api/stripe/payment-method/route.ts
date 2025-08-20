import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
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
      return NextResponse.json([]);
    }

    const customerId = customers.data[0].id;

    // 获取支付方式
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    return NextResponse.json(
      paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year
      }))
    );

  } catch (error) {
    console.error('获取支付方式失败:', error);
    return NextResponse.json({ error: '获取支付方式失败' }, { status: 500 });
  }
}