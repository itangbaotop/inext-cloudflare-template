'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ChevronLeft, X } from 'lucide-react';
import { GitHubLogin } from '@/components/github-login';
import { GoogleOneTap } from '@/components/google-one-tap';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginDialog({ open, onOpenChange, onSuccess, redirectTo = '/' }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'magic-link'>('email');
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  // 控制邮箱和注册功能显示的开关
  const enableEmailLogin = false;
  
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('login');
  const tCommon = useTranslations('common');

  // 重置状态
  const resetState = () => {
    setEmail('');
    setPassword('');
    setError('');
    setStep('email');
    setEmailExists(null);
    setMagicLinkSent(false);
    setIsLoading(false);
  };

  // 处理弹窗关闭
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  // 检查邮箱是否存在
  const checkEmailExists = async (emailToCheck: string) => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck }),
      });
      const data = await response.json();
      return data.exists;
    } catch {
      return false;
    }
  };

  // 处理邮箱提交
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const exists = await checkEmailExists(email);
    setEmailExists(exists);
    
    if (exists) {
      setStep('password');
    } else {
      setError(t('errors.emailNotFound'));
      setTimeout(() => {
        handleOpenChange(false);
        router.push('/register');
      }, 2000);
    }
    
    setIsLoading(false);
  };

  // 处理密码登录
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        handleOpenChange(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(redirectTo);
        }
        router.refresh();
      } else {
        setError(data.error || t('errors.loginFailed'));
      }
    } catch (error) {
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理魔法链接
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMagicLinkSent(true);
      } else {
        setError(data.error || t('errors.networkError'));
      }
    } catch (error) {
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 社交登录按钮组件
  const SocialLoginButtons = () => (
    <div className="space-y-3">
      <GoogleOneTap className="w-full" />
      <GitHubLogin className="w-full" />
    </div>
  );

  // 渲染邮箱输入步骤
  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder={t('email.placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        disabled={isLoading}
      >
        {isLoading ? t('buttons.loading') : tCommon('continue')}
      </Button>
    </form>
  );

  // 渲染密码输入步骤
  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordLogin} className="space-y-4">
      <button
        type="button"
        className="text-sm text-blue-600 hover:text-blue-500 p-0 h-auto flex items-center"
        onClick={() => setStep('email')}
      >
        <ChevronLeft className="h-4 w-4 inline mr-1" />
        {tCommon('back')}
      </button>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t('email.label')}: {email}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="password">{t('password.label')}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('password.placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        disabled={isLoading}
      >
        {isLoading ? t('buttons.loading') : t('buttons.signIn')}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            handleOpenChange(false);
            router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
          }}
          className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
        >
          {t('links.forgotPassword')}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">
            {tCommon('or')}
          </span>
        </div>
      </div>

      <Button 
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setStep('magic-link')}
      >
        {t('buttons.magicLink')}
      </Button>
    </form>
  );

  // 渲染魔法链接步骤
  const renderMagicLinkStep = () => (
    <form onSubmit={handleMagicLink} className="space-y-4">
      <button
        type="button"
        className="text-sm text-blue-600 hover:text-blue-500 p-0 h-auto flex items-center"
        onClick={() => setStep('password')}
      >
        <ChevronLeft className="h-4 w-4 inline mr-1" />
        {tCommon('back')}
      </button>

      <div>
        <h3 className="text-lg font-semibold mb-2">{t('magicLink.title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('magicLink.description')}
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('email.label')}: {email}
        </div>
      </div>

      {magicLinkSent ? (
        <Alert>
          <AlertDescription>{t('magicLink.sent')}</AlertDescription>
        </Alert>
      ) : (
        <>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('buttons.loading') : t('buttons.magicLink')}
          </Button>
        </>
      )}
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold text-center">
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('subtitle')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {step === 'email' && (
              <>
                <SocialLoginButtons />
                {/* 邮箱登录功能暂时屏蔽，等待邮件服务集成 */}
                {enableEmailLogin && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">
                          {tCommon('or')}
                        </span>
                      </div>
                    </div>
                    {renderEmailStep()}
                  </>
                )}
              </>
            )}
            
            {step === 'password' && enableEmailLogin && renderPasswordStep()}
            
            {step === 'magic-link' && enableEmailLogin && renderMagicLinkStep()}
          </div>

          {/* 注册链接暂时屏蔽，等待邮件服务集成 */}
          {enableEmailLogin && (
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t('links.noAccount')}{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  handleOpenChange(false);
                  router.push('/register');
                }}
                className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
              >
                {t('links.signUp')}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}