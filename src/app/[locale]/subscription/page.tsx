'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  XCircle,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionData {
  id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  price: number;
  currency: string;
  interval: 'month' | 'year';
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  pdf: string;
  periodStart: string;
  periodEnd: string;
}

const planNames: Record<string, string> = {
  free: '免费版',
  basic: '基础版',
  plus: 'Plus版',
  pro: '专业版',
  premium: '企业版'
};

export default function SubscriptionManagementPage() {
  const t = useTranslations('subscription');
  const tManage = useTranslations('subscription.manage');
  const router = useRouter();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subRes, pmRes, invRes] = await Promise.all([
        fetch('/api/stripe/subscription'),
        fetch('/api/stripe/payment-method'),
        fetch('/api/stripe/invoices')
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      if (pmRes.ok) {
        const pmData = await pmRes.json();
        setPaymentMethod(pmData);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      }
    } catch (error) {
      console.error('获取订阅数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/stripe/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(error.message || '升级失败');
      }
    } catch (error) {
      alert('升级失败: ' + (error as Error).message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消订阅吗？您可以在当前付费周期结束前继续使用服务。')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST'
      });

      if (response.ok) {
        alert('订阅已取消，将在当前周期结束后停止');
        fetchSubscriptionData();
      } else {
        const error = await response.json();
        alert(error.message || '取消失败');
      }
    } catch (error) {
      alert('取消失败: ' + (error as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST'
      });

      if (response.ok) {
        alert('订阅已重新激活');
        fetchSubscriptionData();
      } else {
        const error = await response.json();
        alert(error.message || '重新激活失败');
      }
    } catch (error) {
      alert('重新激活失败: ' + (error as Error).message);
    } finally {
      setReactivating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.cancelAtPeriodEnd;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            订阅管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理您的订阅计划和支付方式
          </p>
        </div>

        {/* 当前订阅状态 */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              当前订阅
            </h2>
            <Badge 
              variant={isActive ? "default" : "destructive"}
              className={isActive ? "bg-green-500" : "bg-red-500"}
            >
              {subscription?.status === 'active' ? '活跃' : '已取消'}
            </Badge>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">套餐</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {planNames[subscription.plan] || subscription.plan}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">价格</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatCurrency(subscription.price, subscription.currency)} / {subscription.interval}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">续费日期</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>

              {isCanceled && (
                <Alert>
                  <AlertDescription>
                    您的订阅将在 {formatDate(subscription.currentPeriodEnd)} 后到期
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">您当前使用的是免费版</p>
              <Button 
                onClick={() => router.push('/subscription/upgrade')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                升级到付费套餐
              </Button>
            </div>
          )}
        </Card>

        {/* 操作按钮 */}
        {subscription && subscription.plan !== 'free' && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              订阅操作
            </h2>
            <div className="flex flex-wrap gap-4">
              {isCanceled ? (
                <Button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {reactivating ? '处理中...' : '重新激活'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => router.push('/subscription/upgrade')}
                    disabled={upgrading}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    {upgrading ? '处理中...' : '升级套餐'}
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/subscription/change')}
                    variant="outline"
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    更改套餐
                  </Button>

                  <Button
                    onClick={handleCancel}
                    disabled={cancelling}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {cancelling ? '处理中...' : '取消订阅'}
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* 支付方式 */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              支付方式
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/subscription/payment-method')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              管理支付方式
            </Button>
          </div>
          
          {paymentMethod ? (
            <div className="flex items-center space-x-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {paymentMethod.brand.toUpperCase()} **** {paymentMethod.last4}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  有效期: {paymentMethod.expMonth}/{paymentMethod.expYear}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              暂无支付方式
            </p>
          )}
        </Card>

        {/* 账单历史 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              账单历史
            </h2>
            {invoices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/subscription/billing-history')}
              >
                查看全部
              </Button>
            )}
          </div>

          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency)} - {formatDate(invoice.periodStart)} 至 {formatDate(invoice.periodEnd)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invoice.created)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                      className={invoice.status === 'paid' ? 'bg-green-500' : ''}
                    >
                      {invoice.status === 'paid' ? '已支付' : '待支付'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(invoice.pdf, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              暂无账单记录
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}