import { useState, useEffect } from 'react';

export interface SubscriptionInfo {
  plan: 'free' | 'basic' | 'pro' | 'premium';
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  price: number;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription({
          plan: data.plan || 'free',
          status: data.status || 'active',
          currentPeriodEnd: new Date(data.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000),
          price: data.price || 0,
        });
      } else {
        // 默认免费版
        setSubscription({
          plan: 'free',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          price: 0,
        });
      }
    } catch (error) {
      console.error('获取订阅状态失败:', error);
      // 错误时显示免费版
      setSubscription({
        plan: 'free',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        price: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return { subscription, loading, refetch: fetchSubscription };
}