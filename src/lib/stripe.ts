import Stripe from 'stripe';

// 初始化 Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Stripe 价格ID配置
export const STRIPE_PRICE_IDS = {
  BASIC: process.env.STRIPE_BASIC_PRICE_ID!,
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID!,
};

// 订阅计划配置
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: '免费版',
    price: 0,
    priceId: null,
    features: [
      '基础课程访问',
      '社区支持',
      '基础学习工具',
    ],
    limits: {
      courses: 5,
      storage: '1GB',
    },
  },
  BASIC: {
    name: '基础版',
    price: 9.99,
    priceId: STRIPE_PRICE_IDS.BASIC,
    features: [
      '全部基础课程',
      '无限制课程访问',
      '优先客服支持',
      '学习进度跟踪',
    ],
    limits: {
      courses: '无限制',
      storage: '10GB',
    },
  },
  PRO: {
    name: '专业版',
    price: 19.99,
    priceId: STRIPE_PRICE_IDS.PRO,
    features: [
      '全部课程访问',
      '高级学习工具',
      '1对1导师指导',
      '认证证书',
      '离线下载',
    ],
    limits: {
      courses: '无限制',
      storage: '100GB',
    },
  },
  PREMIUM: {
    name: '高级版',
    price: 39.99,
    priceId: STRIPE_PRICE_IDS.PREMIUM,
    features: [
      '所有专业版功能',
      '企业级支持',
      '定制化学习路径',
      '团队管理功能',
      'API访问权限',
    ],
    limits: {
      courses: '无限制',
      storage: '1TB',
    },
  },
};

// 获取用户的订阅状态
export async function getUserSubscriptionStatus(userId: string) {
  try {
    const db = (await import('./db')).getDb();
    const { usersTable } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const user = await db
      .select({
        stripeCustomerId: usersTable.stripeCustomerId,
        stripeSubscriptionId: usersTable.stripeSubscriptionId,
        subscriptionStatus: usersTable.subscriptionStatus,
        subscriptionEndDate: usersTable.subscriptionEndDate,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return null;
    }

    return user[0];
  } catch (error) {
    console.error('获取用户订阅状态失败:', error);
    return null;
  }
}

// 创建 Stripe Checkout Session
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    // 获取或创建 Stripe 客户
    let customer = await getOrCreateStripeCustomer(userId, userEmail);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
    });

    return session;
  } catch (error) {
    console.error('创建 Checkout Session 失败:', error);
    throw error;
  }
}

// 创建客户门户会话
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('创建客户门户会话失败:', error);
    throw error;
  }
}

// 获取或创建 Stripe 客户
async function getOrCreateStripeCustomer(userId: string, email: string) {
  try {
    const db = (await import('./db')).getDb();
    const { usersTable } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const user = await db
      .select({ stripeCustomerId: usersTable.stripeCustomerId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user && user[0]?.stripeCustomerId) {
      return { id: user[0].stripeCustomerId };
    }

    // 创建新的 Stripe 客户
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // 更新数据库
    await db
      .update(usersTable)
      .set({ stripeCustomerId: customer.id })
      .where(eq(usersTable.id, userId));

    return customer;
  } catch (error) {
    console.error('获取或创建 Stripe 客户失败:', error);
    throw error;
  }
}

// 验证 Stripe Webhook 签名
export async function verifyStripeWebhookSignature(
  payload: string,
  signature: string
) {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    return event;
  } catch (error) {
    console.error('验证 Stripe Webhook 签名失败:', error);
    throw error;
  }
}

// 获取订阅详情
export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('获取订阅详情失败:', error);
    throw error;
  }
}

export async function getSubscriptionStatus(userId: string) {
  try {
    const db = await getDb();
    const user = await db
      .select({
        subscriptionPlan: usersTable.subscriptionPlan,
        subscriptionStatus: usersTable.subscriptionStatus,
        subscriptionEndDate: usersTable.subscriptionEndDate,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return {
        plan: 'free' as const,
        status: 'active' as const,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }

    const userData = user[0];
    return {
      plan: (userData.subscriptionPlan || 'free') as 'free' | 'basic' | 'pro' | 'premium',
      status: (userData.subscriptionStatus || 'active') as 'active' | 'inactive' | 'canceled' | 'past_due',
      currentPeriodEnd: userData.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error('获取订阅状态失败:', error);
    return {
      plan: 'free' as const,
      status: 'active' as const,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
}