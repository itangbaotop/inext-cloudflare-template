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

    // 获取账单历史
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10
    });

    return NextResponse.json(
      invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: new Date(invoice.created * 1000).toISOString(),
        pdf: invoice.invoice_pdf,
        subscription: invoice.subscription
      }))
    );

  } catch (error) {
    console.error('获取账单失败:', error);
    return NextResponse.json({ error: '获取账单失败' }, { status: 500 });
  }
}