import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { User, Shield, Bell, Link2, CreditCard } from 'lucide-react';



export default async function SettingsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">账户设置</h1>
            <p className="text-gray-600 dark:text-gray-300">管理您的账户信息和偏好设置</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                个人信息
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                安全设置
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                通知设置
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                社交账户
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                订阅与支付
              </TabsTrigger>
            </TabsList>

            {/* 个人信息标签页 */}
            <TabsContent value="profile">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>更新您的个人信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <User className="w-10 h-10 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="displayName">显示名称</Label>
                        <Input id="displayName" defaultValue={user.displayName} />
                      </div>
                      <div>
                        <Label htmlFor="email">邮箱地址</Label>
                        <Input id="email" type="email" defaultValue={user.email} disabled={user.googleId !== null} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio">个人简介</Label>
                      <Input id="bio" placeholder="介绍一下自己..." />
                    </div>
                    <Button>保存更改</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 安全设置标签页 */}
            <TabsContent value="security">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>密码管理</CardTitle>
                    <CardDescription>管理您的账户密码</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!user.googleId && (
                      <>
                        <div>
                          <Label htmlFor="currentPassword">当前密码</Label>
                          <Input id="currentPassword" type="password" />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">新密码</Label>
                          <Input id="newPassword" type="password" />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">确认密码</Label>
                          <Input id="confirmPassword" type="password" />
                        </div>
                        <Button>更改密码</Button>
                      </>
                    )}
                    {user.googleId && (
                      <p className="text-sm text-gray-600">您使用Google账户登录，无需设置密码</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>邮箱验证</CardTitle>
                    <CardDescription>验证您的邮箱地址</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">邮箱状态</p>
                        <p className="text-sm text-gray-600">
                          {user.emailVerified ? '已验证' : '未验证'}
                        </p>
                      </div>
                      {!user.emailVerified && (
                        <Button variant="outline">发送验证邮件</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 通知设置标签页 */}
            <TabsContent value="notifications">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>通知偏好</CardTitle>
                    <CardDescription>管理您的通知设置</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>系统通知</Label>
                        <p className="text-sm text-gray-600">接收系统重要更新</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>课程更新</Label>
                        <p className="text-sm text-gray-600">接收课程相关通知</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>促销邮件</Label>
                        <p className="text-sm text-gray-600">接收产品更新和优惠信息</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 社交账户标签页 */}
            <TabsContent value="social">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>第三方登录</CardTitle>
                    <CardDescription>管理您的第三方账户连接</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">G</span>
                        </div>
                        <div>
                          <p className="font-medium">Google</p>
                          <p className="text-sm text-gray-600">
                            {user.googleId ? '已连接' : '未连接'}
                          </p>
                        </div>
                      </div>
                      <Button variant={user.googleId ? "outline" : "default"}>
                        {user.googleId ? '断开连接' : '连接'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 订阅与支付标签页 */}
            <TabsContent value="billing">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>订阅管理</CardTitle>
                    <CardDescription>管理您的订阅计划</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">当前计划</p>
                        <p className="text-sm text-gray-600">免费版</p>
                      </div>
                      <Button variant="outline">升级计划</Button>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">订阅功能即将推出</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>支付历史</CardTitle>
                    <CardDescription>查看您的支付记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">暂无支付记录</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


          </Tabs>
        </div>
      </div>
    </div>
  );
}