import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhookSignature } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    const event = await verifyStripeWebhookSignature(body, signature);

    console.log('收到 Stripe Webhook:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`未处理的 Webhook 类型: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe Webhook 处理失败:', error);
    return NextResponse.json({ error: 'Webhook 处理失败' }, { status: 400 });
  }
}

// 处理 Checkout Session 完成
async function handleCheckoutSessionCompleted(session: any) {
  const userId = session.metadata?.userId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!userId || !customerId || !subscriptionId) {
    console.error('缺少必要的会话数据');
    return;
  }

  try {
    const db = await getDb();
    
    // 获取订阅详情
    const { stripe } = await import('@/lib/stripe');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const plan = subscription.items.data[0]?.price?.id;
    let planName = 'basic';
    
    if (plan === process.env.STRIPE_BASIC_PRICE_ID) planName = 'basic';
    else if (plan === process.env.STRIPE_PRO_PRICE_ID) planName = 'pro';
    else if (plan === process.env.STRIPE_PREMIUM_PRICE_ID) planName = 'premium';

    await db
      .update(usersTable)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionPlan: planName,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, userId));

    console.log(`用户 ${userId} 订阅已激活`);
  } catch (error) {
    console.error('处理 Checkout Session 失败:', error);
  }
}

// 处理订阅创建
async function handleSubscriptionCreated(subscription: any) {
  await updateUserSubscription(subscription);
}

// 处理订阅更新
async function handleSubscriptionUpdated(subscription: any) {
  await updateUserSubscription(subscription);
}

// 处理订阅删除
async function handleSubscriptionDeleted(subscription: any) {
  try {
    const db = await getDb();
    
    await db
      .update(usersTable)
      .set({
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        updated_at: new Date(),
      })
      .where(eq(usersTable.stripeSubscriptionId, subscription.id));

    console.log(`订阅 ${subscription.id} 已取消`);
  } catch (error) {
    console.error('处理订阅删除失败:', error);
  }
}

// 处理支付成功
async function handlePaymentSucceeded(invoice: any) {
  if (invoice.subscription) {
    try {
      const { stripe } = await import('@/lib/stripe');
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      await updateUserSubscription(subscription);
    } catch (error) {
      console.error('处理支付成功失败:', error);
    }
  }
}

// 处理支付失败
async function handlePaymentFailed(invoice: any) {
  if (invoice.subscription) {
    try {
      const db = await getDb();
      
      await db
        .update(usersTable)
        .set({
          subscriptionStatus: 'past_due',
          updated_at: new Date(),
        })
        .where(eq(usersTable.stripeSubscriptionId, invoice.subscription));

      console.log(`订阅 ${invoice.subscription} 支付失败`);
    } catch (error) {
      console.error('处理支付失败失败:', error);
    }
  }
}

// 更新用户订阅状态
async function updateUserSubscription(subscription: any) {
  try {
    const db = await getDb();
    
    const plan = subscription.items.data[0]?.price?.id;
    let planName = 'basic';
    
    if (plan === process.env.STRIPE_BASIC_PRICE_ID) planName = 'basic';
    else if (plan === process.env.STRIPE_PRO_PRICE_ID) planName = 'pro';
    else if (plan === process.env.STRIPE_PREMIUM_PRICE_ID) planName = 'premium';

    await db
      .update(usersTable)
      .set({
        subscriptionStatus: subscription.status,
        subscriptionPlan: planName,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        updated_at: new Date(),
      })
      .where(eq(usersTable.stripeSubscriptionId, subscription.id));

    console.log(`订阅 ${subscription.id} 状态已更新为 ${subscription.status}`);
  } catch (error) {
    console.error('更新用户订阅状态失败:', error);
  }
}