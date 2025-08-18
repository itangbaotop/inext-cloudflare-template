"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForgotPasswordStep {
  step: 'email' | 'verify' | 'reset';
  title: string;
  description: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep['step']>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const steps: Record<ForgotPasswordStep['step'], ForgotPasswordStep> = {
    email: {
      step: 'email',
      title: "找回密码",
      description: "输入您的邮箱地址，我们将发送重置密码的验证码"
    },
    verify: {
      step: 'verify',
      title: "验证邮箱",
      description: "我们已向您的邮箱发送了重置密码的验证码"
    },
    reset: {
      step: 'reset',
      title: "重置密码",
      description: "设置您的新密码"
    }
  };

  useEffect(() => {
    // 从URL参数中获取邮箱
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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
      
      if (!data.exists) {
        setError("该邮箱未注册，请先注册");
        setTimeout(() => router.push("/register"), 2000);
      } else {
        await sendResetCode();
        setCurrentStep('verify');
      }
    } catch (error) {
      setError("检查邮箱时出错，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const sendResetCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-reset-code", {
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
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setCurrentStep('reset');
      } else {
        setError(data.error || "验证码错误");
      }
    } catch (error) {
      setError("验证失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          code: verificationCode,
          newPassword 
        })
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setError("密码重置成功，正在跳转登录...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "重置密码失败");
      }
    } catch (error) {
      setError("重置密码失败，请重试");
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
        {isLoading ? "发送中..." : "发送验证码"}
      </Button>
    </form>
  );

  const renderVerifyStep = () => (
    <form onSubmit={handleVerificationSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verificationCode" className="text-sm font-medium">
          验证码
        </Label>
        <Input
          id="verificationCode"
          type="text"
          placeholder="请输入6位验证码"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          maxLength={6}
          className="text-center text-lg tracking-widest"
          required
          disabled={isLoading}
        />
      </div>
      
      <p className="text-sm text-center text-gray-600">
        没有收到验证码？
        <button
          type="button"
          onClick={sendResetCode}
          className="text-blue-600 hover:underline ml-1"
          disabled={isLoading || !canResend}
        >
          {countdown > 0 ? `重新发送 (${countdown}s)` : "重新发送"}
        </button>
      </p>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !verificationCode}
      >
        {isLoading ? "验证中..." : "验证并继续"}
      </Button>
    </form>
  );

  const renderResetStep = () => (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-medium">
          新密码
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="输入新密码"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
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
            placeholder="再次输入新密码"
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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{passwordError}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !newPassword || !confirmPassword}
      >
        {isLoading ? "重置中..." : "重置密码"}
      </Button>
    </form>
  );

  const currentStepConfig = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              {currentStepConfig.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {currentStepConfig.description}
            </p>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 dark:text-white">{currentStepConfig.title}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">{currentStepConfig.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant={error.includes("成功") ? "default" : "destructive"} className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {currentStep === 'email' && renderEmailStep()}
              {currentStep === 'verify' && renderVerifyStep()}
              {currentStep === 'reset' && renderResetStep()}
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              想起密码了？ <a href="/login" className="text-blue-600 hover:underline dark:text-blue-400">返回登录</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}