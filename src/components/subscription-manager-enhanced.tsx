'use client';

import { useState, useEffect } from 'react';
import { Check, X, Crown, Star, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';

interface SubscriptionData {
  plan: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  price: number;
  features: string[];
  usage: {
    courses: number;
    maxCourses: number;
    aiCalls: number;
    maxAiCalls: number;
  };
}

// 更新plans配置以匹配主订阅页面
const plans = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    priceId: '',
    description: '适合个人学习和基础使用',
    features: [
      '基础课程访问',
      '每月5次AI辅导',
      '基础进度跟踪',
      '社区支持'
    ],
    color: 'gray',
  },
  {
    id: 'basic',
    name: '基础版',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || '',
    description: '适合进阶学习和专业发展',
    features: [
      '全部课程访问',
      '每月50次AI辅导',
      '高级进度分析',
      '优先客服支持',
      '离线学习',
      '证书认证'
    ],
    color: 'purple',
    badge: '最受欢迎',
    popular: true,
  },
  {
    id: 'pro',
    name: '企业版',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    description: '适合团队和企业培训',
    features: [
      '无限制课程访问',
      '无限制AI辅导',
      '团队管理功能',
      '专属客服支持',
      '企业培训方案',
      'API访问',
      '白标解决方案',
      'SSO集成'
    ],
    color: 'blue',
  },
];

// 更新组件中的文本使用国际化
export function SubscriptionManagerEnhanced() {
  const t = useTranslations('subscription');
  const [subscription, setSubscription] = useState<SubscriptionData>({
    plan: 'free',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    price: 0,
    features: plans[0].features,
    usage: {
      courses: 3,
      maxCourses: 5,
      aiCalls: 45,
      maxAiCalls: 100,
    },
  });

  const currentPlanIndex = plans.findIndex(p => p.id === subscription.plan);
  const currentPlan = plans[currentPlanIndex];

  return (
    <div className="space-y-6">
      {/* 当前订阅状态卡片 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">当前订阅</h3>
            <p className="text-sm text-gray-600">管理您的订阅计划</p>
          </div>
          <Badge 
            variant={subscription.status === 'active' ? 'default' : 'secondary'}
            className={`${
              subscription.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {subscription.status === 'active' ? '活跃' : '已取消'}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">当前计划</p>
            <p className="text-2xl font-bold">{currentPlan.name}</p>
            <p className="text-sm text-gray-600">¥{currentPlan.price}/月</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">到期时间</p>
            <p className="font-medium">
              {subscription.currentPeriodEnd.toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">状态</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open('/api/stripe/portal', '_blank')}
            >
              管理订阅
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 使用统计 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">使用统计</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>课程数量</span>
              <span className="font-medium">
                {subscription.usage.courses}/{subscription.usage.maxCourses}
              </span>
            </div>
            <Progress 
              value={(subscription.usage.courses / subscription.usage.maxCourses) * 100} 
              className="h-2" 
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>AI调用次数</span>
              <span className="font-medium">
                {subscription.usage.aiCalls}/{subscription.usage.maxAiCalls}
              </span>
            </div>
            <Progress 
              value={(subscription.usage.aiCalls / subscription.usage.maxAiCalls) * 100} 
              className="h-2" 
            />
          </div>
        </div>
      </Card>

      {/* 计划选择 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">升级计划</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.filter(p => p.id !== 'free').map((plan) => {
            const isCurrent = plan.id === subscription.plan;
            const isUpgrade = plans.indexOf(plan) > currentPlanIndex;
            
            return (
              <Card 
                key={plan.id} 
                className={`p-6 relative ${
                  plan.badge ? 'border-purple-500 shadow-lg' : ''
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
                    {plan.badge}
                  </Badge>
                )}
                
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="text-3xl font-bold mb-1">
                    ¥{plan.price}
                    <span className="text-sm text-gray-500">/月</span>
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  disabled={isCurrent}
                  variant={isCurrent ? 'outline' : 'default'}
                  onClick={() => {
                    if (plan.priceId) {
                      window.location.href = `/api/stripe/checkout?priceId=${plan.priceId}`;
                    }
                  }}
                >
                  {isCurrent ? '当前计划' : isUpgrade ? '升级' : '降级'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 常见问题 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">常见问题</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">如何升级或降级？</h4>
            <p className="text-sm text-gray-600">
              选择您想要的计划，系统会自动处理升级或降级，按比例收取费用。
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">可以随时取消吗？</h4>
            <p className="text-sm text-gray-600">
              是的，您可以随时取消订阅，取消后将在当前计费周期结束时生效。
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">支持退款吗？</h4>
            <p className="text-sm text-gray-600">
              我们提供14天无理由退款保证，让您无风险试用。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}