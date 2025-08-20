import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Shield, LogOut } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { CreditCard, Crown } from 'lucide-react';
import { getSubscriptionStatus } from '@/lib/stripe';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // 获取订阅状态
  const subscription = await getSubscriptionStatus(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">个人资料</h1>
            <p className="text-gray-600 dark:text-gray-300">管理您的账户信息和设置</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧个人信息卡片 */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl || '/default-avatar.png'}
                          alt={user.displayName}
                          fill
                          className="rounded-full object-cover border-4 border-white/20"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl">{user.displayName}</CardTitle>
                    <CardDescription className="text-blue-100">
                      {user.email}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">订阅状态</span>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">
                          {subscription?.plan === 'free' ? '免费版' :
                           subscription?.plan === 'basic' ? '基础版' :
                           subscription?.plan === 'pro' ? '专业版' :
                           subscription?.plan === 'premium' ? '高级版' : '免费版'}
                        </span>
                      </div>
                    </div>
                    {subscription?.status !== 'free' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">到期时间</span>
                        <span className="text-sm font-medium text-gray-900">
                          {subscription?.currentPeriodEnd?.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">邮箱验证</span>
                      <span className={`text-sm font-medium ${
                        user.emailVerified ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {user.emailVerified ? '已验证' : '未验证'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">账户类型</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user.googleId ? 'Google 账户' : '本地账户'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">加入时间</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user.createdAt?.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧详细信息 */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* 个人信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      个人信息
                    </CardTitle>
                    <CardDescription>
                      管理您的基本个人信息
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">显示名称</label>
                        <div className="mt-1 text-gray-900">{user.displayName}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">邮箱地址</label>
                        <div className="mt-1 text-gray-900">{user.email}</div>
                      </div>
                    </div>
                    {user.googleId && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Google ID</label>
                        <div className="mt-1 text-gray-500 text-sm font-mono">{user.googleId}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 订阅管理卡片 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      订阅管理
                    </CardTitle>
                    <CardDescription>
                      查看和管理您的订阅计划
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">
                            当前计划: {subscription?.plan === 'free' ? '免费版' :
                            subscription?.plan === 'basic' ? '基础版' :
                            subscription?.plan === 'pro' ? '专业版' :
                            subscription?.plan === 'premium' ? '高级版' : '免费版'}
                          </p>
                          <p className="text-sm text-gray-600">
                            状态: {subscription?.status === 'active' ? '活跃' :
                            subscription?.status === 'canceled' ? '已取消' :
                            subscription?.status === 'past_due' ? '过期' : '未知'}
                          </p>
                        </div>
                        <Button asChild>
                          <Link href="/subscription">
                            管理订阅
                          </Link>
                        </Button>
                      </div>
                      {subscription?.status === 'active' && subscription.plan !== 'free' && (
                        <div className="text-sm text-gray-600">
                          下次续费时间: {subscription.currentPeriodEnd?.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 安全设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      安全设置
                    </CardTitle>
                    <CardDescription>
                      管理您的账户安全选项
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">邮箱验证</p>
                        <p className="text-sm text-gray-600">
                          验证您的邮箱地址以增强账户安全性
                        </p>
                      </div>
                      <Button 
                        variant={user.emailVerified ? "outline" : "default"}
                        size="sm"
                        disabled={user.emailVerified}
                      >
                        {user.emailVerified ? '已验证' : '验证邮箱'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 操作区域 */}
                <Card>
                  <CardHeader>
                    <CardTitle>账户操作</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form action="/api/auth/logout" method="POST">
                      <Button 
                        type="submit"
                        variant="destructive" 
                        className="w-full flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}