"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginStep {
  step: 'email' | 'password';
  title: string;
  description: string;
}

export default function ModernLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [currentStep, setCurrentStep] = useState<LoginStep['step']>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const router = useRouter();

  // 检查是否已登录
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          router.push('/');
        }
      } catch (error) {
        // 忽略错误，继续显示登录页面
        console.log('Not authenticated');
      }
    };

    checkAuthStatus();
  }, [router]);

  const steps: Record<LoginStep['step'], LoginStep> = {
    email: {
      step: 'email',
      title: "欢迎回来",
      description: "输入您的邮箱地址以继续"
    },
    password: {
      step: 'password',
      title: "输入密码",
      description: `为 ${email} 输入密码`
    },

  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    if (!validateEmail(email)) {
      setEmailError("请输入有效的邮箱地址");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json() as { exists?: boolean };
      
      if (data.exists) {
        setCurrentStep('password');
      } else {
        // 用户不存在，直接跳转到注册页面并带上邮箱地址
        router.push("/register?email=" + encodeURIComponent(email));
      }
    } catch (error) {
      setError("检查邮箱时出错，请重试");
    } finally {
      setIsLoading(false);
    }
  };



  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json() as { error?: string; success?: boolean; user?: unknown };

      if (response.ok && data.success) {
        router.push("/");
      } else {
        setError(data.error || "登录失败");
      }
    } catch (error) {
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };



  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          邮箱地址
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            className={cn(
              "pl-10 pr-4 py-3",
              emailError && "border-red-500 focus:ring-red-500"
            )}
            required
            disabled={isLoading}
          />
        </div>
        {emailError && (
          <p className="text-sm text-red-600">{emailError}</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !email}
      >
        {isLoading ? "检查中..." : "继续"}
      </Button>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="输入您的密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-12 py-3"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <a 
          href={`/forgot-password${email ? '?email=' + encodeURIComponent(email) : ''}`} 
          className="text-sm text-blue-600 hover:underline"
        >
          忘记密码？
        </a>
      </div>
      
      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isLoading || !password}>
          {isLoading ? "登录中..." : "登录"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setCurrentStep('email')}
          disabled={isLoading}
        >
          返回
        </Button>
      </div>
    </form>
  );



  const currentStepConfig = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              登录您的账户
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              输入您的邮箱和密码登录账户
            </p>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 dark:text-white">登录</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">输入您的登录信息</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {currentStep === 'email' && renderEmailStep()}
              {currentStep === 'password' && renderPasswordStep()}
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              还没有账户？{" "}
              <a 
                href="/register" 
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400"
              >
                立即注册
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              忘记密码？{" "}
              <a 
                href="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400"
              >
                找回密码
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}