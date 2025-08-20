'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, Crown, Star, Zap, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  description: string;
  features: string[];
  color: string;
  badge?: string;
  popular?: boolean;
  icon: React.ReactNode;
}

export default function SubscriptionPricingPage() {
  const t = useTranslations('subscription');
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: Plan[] = [
    {
      id: 'free',
      name: t('plans.free.name'),
      price: 0,
      priceId: '',
      description: t('plans.free.description'),
      features: [
        t('plans.free.features.basic_courses'),
        t('plans.free.features.ai_calls', { count: 5 }),
        t('plans.free.features.basic_tracking'),
        t('plans.free.features.community_support'),
      ],
      color: 'gray',
      icon: <Star className="w-8 h-8" />,
    },
    {
      id: 'basic',
      name: t('plans.plus.name'),
      price: billingCycle === 'monthly' ? 29 : 290,
      priceId: billingCycle === 'monthly' 
        ? process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || ''
        : process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID || '',
      description: t('plans.plus.description'),
      features: [
        t('plans.plus.features.all_courses'),
        t('plans.plus.features.ai_calls', { count: 50 }),
        t('plans.plus.features.advanced_analytics'),
        t('plans.plus.features.priority_support'),
        t('plans.plus.features.offline_learning'),
        t('plans.plus.features.certification'),
      ],
      color: 'purple',
      badge: t('plans.plus.badge'),
      popular: true,
      icon: <Crown className="w-8 h-8" />,
    },
    {
      id: 'pro',
      name: t('plans.enterprise.name'),
      price: billingCycle === 'monthly' ? 99 : 990,
      priceId: billingCycle === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || ''
        : process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
      description: t('plans.enterprise.description'),
      features: [
        t('plans.enterprise.features.unlimited_courses'),
        t('plans.enterprise.features.unlimited_ai'),
        t('plans.enterprise.features.team_management'),
        t('plans.enterprise.features.dedicated_support'),
        t('plans.enterprise.features.enterprise_training'),
        t('plans.enterprise.features.api_access'),
        t('plans.enterprise.features.white_label'),
        t('plans.enterprise.features.sso_integration'),
      ],
      color: 'blue',
      icon: <Users className="w-8 h-8" />,
    },
  ];

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === 'free') {
      router.push('/courses');
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          plan: plan.id,
          billingCycle,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(error.message || '创建订阅失败');
      }
    } catch (error) {
      alert('订阅失败: ' + (error as Error).message);
    }
  };

  const getPriceWithDiscount = (price: number) => {
    if (billingCycle === 'yearly' && price > 0) {
      return Math.round(price * 0.83); // 约17%折扣
    }
    return price;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* 计费周期切换 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              按月付费
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              按年付费
              <Badge variant="secondary" className="ml-2">
                省17%
              </Badge>
            </button>
          </div>
        </div>

        {/* 订阅计划 */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-8 transition-all duration-300 hover:shadow-xl ${
                plan.popular ? 'border-purple-500 shadow-lg scale-105' : ''
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
                  {plan.badge}
                </Badge>
              )}

              <div className="text-center mb-6">
                <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                  plan.id === 'free' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                  : plan.id === 'basic' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  ¥{getPriceWithDiscount(plan.price)}
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    /{billingCycle === 'monthly' ? '月' : '年'}
                  </span>
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    原价 ¥{plan.price * 12}/年
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                className={`w-full ${
                  plan.id === 'free'
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : plan.id === 'basic'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                size="lg"
              >
                {plan.id === 'free' ? '免费开始' : t('subscribeNow')}
              </Button>
            </Card>
          ))}
        </div>

        {/* 常见问题 */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            常见问题
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">可以随时取消订阅吗？</h3>
              <p className="text-gray-600 dark:text-gray-400">
                是的，您可以随时取消订阅。取消后，您可以在当前付费周期结束前继续使用服务。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">支持哪些支付方式？</h3>
              <p className="text-gray-600 dark:text-gray-400">
                我们支持信用卡、借记卡、PayPal等多种支付方式，确保您的支付安全便捷。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">如何升级或降级套餐？</h3>
              <p className="text-gray-600 dark:text-gray-400">
                您可以在订阅管理页面随时升级或降级套餐，系统会自动计算差价。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">有退款政策吗？</h3>
              <p className="text-gray-600 dark:text-gray-400">
                我们提供7天无理由退款保证。如果您对服务不满意，可以申请全额退款。
              </p>
            </Card>
          </div>
        </div>

        {/* 联系支持 */}
        <div className="text-center mt-16">
          <p className="text-gray-600 dark:text-gray-400">
            {t('contactSupport')}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/contact')}>
            联系客服
          </Button>
        </div>
      </div>
    </div>
  );
}