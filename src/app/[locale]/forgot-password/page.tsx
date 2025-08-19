'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ChevronLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ForgotPasswordStep {
  step: 'email' | 'verify' | 'reset';
  title: string;
  description: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('forgotPassword');

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep['step']>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [success, setSuccess] = useState(false);

  const steps: Record<ForgotPasswordStep['step'], ForgotPasswordStep> = {
    email: {
      step: 'email',
      title: t('emailStep.title'),
      description: t('emailStep.description')
    },
    verify: {
      step: 'verify',
      title: t('verifyStep.title'),
      description: t('verifyStep.description')
    },
    reset: {
      step: 'reset',
      title: t('resetStep.title'),
      description: t('resetStep.description')
    }
  };

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return t('resetStep.invalidPassword');
    }
    if (!/[A-Z]/.test(password)) {
      return t('resetStep.invalidPassword');
    }
    if (!/[a-z]/.test(password)) {
      return t('resetStep.invalidPassword');
    }
    if (!/[0-9]/.test(password)) {
      return t('resetStep.invalidPassword');
    }
    return '';
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    if (!validateEmail(email)) {
      setEmailError(t('emailStep.invalidEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json() as { exists?: boolean };
      
      if (!data.exists) {
        setError(t('emailStep.emailNotFound'));
        setTimeout(() => router.push('/register'), 2000);
      } else {
        await sendResetCode();
        setCurrentStep('verify');
      }
    } catch (error) {
      setError(t('emailStep.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const sendResetCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('发送失败');
      }
      
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      setError(t('emailStep.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setCurrentStep('reset');
      } else {
        setError(data.error || t('verifyStep.invalidCode'));
      }
    } catch (error) {
      setError(t('emailStep.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('resetStep.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: verificationCode,
          newPassword 
        })
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || t('emailStep.networkError'));
      }
    } catch (error) {
      setError(t('emailStep.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailStep.emailLabel')}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder={t('emailStep.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        {emailError && (
          <p className="text-sm text-red-500">{emailError}</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        disabled={isLoading}
      >
        {isLoading ? t('common.loading') : t('emailStep.sendCode')}
      </Button>
    </form>
  );

  const renderVerifyStep = () => (
    <form onSubmit={handleVerificationSubmit} className="space-y-4">
      <button
        type="button"
        className="text-sm text-blue-600 hover:text-blue-500 p-0 h-auto flex items-center"
        onClick={() => setCurrentStep('email')}
      >
        <ChevronLeft className="h-4 w-4 inline mr-1" />
        {t('common.back')}
      </button>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t('emailStep.emailLabel')}: {email}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="code">{t('verifyStep.codeLabel')}</Label>
        <Input
          id="code"
          type="text"
          maxLength={6}
          placeholder={t('verifyStep.codePlaceholder')}
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
          required
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Button 
          type="submit" 
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mr-2"
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : t('verifyStep.verify')}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={sendResetCode}
          disabled={!canResend || isLoading}
          className="ml-2"
        >
          {canResend ? t('verifyStep.resend') : `${t('verifyStep.resendIn')} ${countdown}s`}
        </Button>
      </div>
    </form>
  );

  const renderResetStep = () => (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      <button
        type="button"
        className="text-sm text-blue-600 hover:text-blue-500 p-0 h-auto flex items-center"
        onClick={() => setCurrentStep('verify')}
      >
        <ChevronLeft className="h-4 w-4 inline mr-1" />
        {t('common.back')}
      </button>

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{t('resetStep.success')}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('resetStep.newPasswordLabel')}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('resetStep.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
        {passwordError && (
          <p className="text-sm text-red-500">{passwordError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('resetStep.confirmPasswordLabel')}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('resetStep.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        disabled={isLoading}
      >
        {isLoading ? t('common.loading') : t('resetStep.resetPassword')}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription className="text-center">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentStep === 'email' && renderEmailStep()}
          {currentStep === 'verify' && renderVerifyStep()}
          {currentStep === 'reset' && renderResetStep()}
        </CardContent>

        <CardFooter className="flex justify-center">
          <Link 
            href="/login" 
            className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
          >
            {t('links.backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}