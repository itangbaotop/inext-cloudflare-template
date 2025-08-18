"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterStep {
  step: 'email' | 'verify' | 'details';
  title: string;
  description: string;
}

export default function ModernRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(prefillEmail);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [currentStep, setCurrentStep] = useState<RegisterStep['step']>(() => {
    // 只在初始加载时考虑URL参数
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('email') ? 'verify' : 'email';
    }
    return 'email';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const steps: Record<RegisterStep['step'], RegisterStep> = {
    email: {
      step: 'email',
      title: "创建账户",
      description: "输入您的邮箱地址开始注册"
    },
    verify: {
      step: 'verify',
      title: "验证邮箱",
      description: "我们已向您的邮箱发送了验证码"
    },
    details: {
      step: 'details',
      title: "完善信息",
      description: "设置您的账户信息"
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "密码至少需要8个字符";
    }
    if (!/[A-Z]/.test(password)) {
      return "密码需要包含至少一个大写字母";
    }
    if (!/[a-z]/.test(password)) {
      return "密码需要包含至少一个小写字母";
    }
    if (!/[0-9]/.test(password)) {
      return "密码需要包含至少一个数字";
    }
    return "";
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
        setError("该邮箱已被注册，请直接登录");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        await sendVerificationCode();
        setCurrentStep('verify');
      }
    } catch (error) {
      setError("检查邮箱时出错，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error("发送失败");
      }
      
      // 开始60秒倒计时
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      setError("发送验证码失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setCurrentStep('details');
      } else {
        setError(data.error || "验证码错误");
      }
    } catch (error) {
      setError("验证失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          displayName, 
          code: verificationCode 
        })
      });

      const data = await response.json() as { error?: string, user?: unknown };

      if (response.ok) {
        router.push("/");
      } else {
        setError(data.error || "注册失败");
      }
    } catch (error) {
      setError("注册失败，请重试");
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
            disabled={isLoading || !!prefillEmail}
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
        {isLoading ? "处理中..." : "继续"}
      </Button>
    </form>
  );

  const renderVerifyStep = () => (
    <form onSubmit={handleVerificationSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          验证码已发送至 <span className="font-medium">{email}</span>
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="code" className="text-sm font-medium">
          验证码
        </Label>
        <Input
          id="code"
          type="text"
          placeholder="输入6位验证码"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="text-center text-lg tracking-widest"
          required
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 text-center">
          没有收到验证码？
          <button
            type="button"
            onClick={sendVerificationCode}
            className="text-blue-600 hover:underline ml-1"
            disabled={isLoading || !canResend}
          >
            {countdown > 0 ? `重新发送 (${countdown}s)` : "重新发送"}
          </button>
        </p>
      </div>
      
      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
          {isLoading ? "验证中..." : "验证并继续"}
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

  const renderDetailsStep = () => (
    <form onSubmit={handleRegistrationSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-sm font-medium">
          显示名称
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="displayName"
            type="text"
            placeholder="您的显示名称"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="pl-10 pr-4 py-3"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="至少8位字符"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          确认密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError("");
            }}
            className="pl-10 pr-12 py-3"
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {passwordError && (
        <Alert variant="destructive">
          <AlertDescription>{passwordError}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>密码要求：</p>
        <ul className="list-disc list-inside space-y-1">
          <li className={cn(password.length >= 8 ? "text-green-600" : "")}>至少8个字符</li>
          <li className={cn(/[A-Z]/.test(password) ? "text-green-600" : "")}>包含大写字母</li>
          <li className={cn(/[a-z]/.test(password) ? "text-green-600" : "")}>包含小写字母</li>
          <li className={cn(/[0-9]/.test(password) ? "text-green-600" : "")}>包含数字</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isLoading || !displayName || !password || !confirmPassword}>
          {isLoading ? "创建账户..." : "创建账户"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setCurrentStep('verify')}
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
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              创建新账户
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              加入我们，开始您的旅程
            </p>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="text-center">
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "h-2 w-8 rounded-full transition-colors",
                      step === 1 && currentStep === 'email' ? "bg-blue-600" :
                      step === 2 && currentStep === 'verify' ? "bg-blue-600" :
                      step === 3 && currentStep === 'details' ? "bg-blue-600" :
                      "bg-gray-200 dark:bg-gray-700"
                    )}
                  />
                ))}
              </div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">{currentStepConfig.title}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">{currentStepConfig.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {currentStep === 'email' && renderEmailStep()}
              {currentStep === 'verify' && renderVerifyStep()}
              {currentStep === 'details' && renderDetailsStep()}
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              已有账户？{" "}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                立即登录
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}