'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleOneTap } from '@/components/google-one-tap';

interface RegisterStep {
  step: 'email' | 'verify' | 'details' | 'success';
  title: string;
  description: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('register');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [currentStep, setCurrentStep] = useState<RegisterStep['step']>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

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

  const steps: Record<RegisterStep['step'], RegisterStep> = {
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
    details: {
      step: 'details',
      title: t('detailsStep.title'),
      description: t('detailsStep.description')
    },
    success: {
      step: 'success',
      title: t('success.title'),
      description: t('success.description')
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return t('detailsStep.invalidPassword');
    if (!/[A-Z]/.test(password)) return t('detailsStep.invalidPassword');
    if (!/[a-z]/.test(password)) return t('detailsStep.invalidPassword');
    if (!/[0-9]/.test(password)) return t('detailsStep.invalidPassword');
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
      
      if (data.exists) {
        setError(t('emailStep.emailExists'));
        setTimeout(() => router.push('/login'), 2000);
      } else {
        await sendVerificationCode();
        setCurrentStep('verify');
      }
    } catch (error) {
      setError(t('emailStep.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-code', {
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
    setCodeError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setCurrentStep('details');
      } else {
        setCodeError(data.error || t('verifyStep.invalidCode'));
      }
    } catch (error) {
      setCodeError(t('emailStep.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(t('detailsStep.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          displayName,
          password,
          phone,
          verificationCode
        })
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (response.ok) {
        setCurrentStep('success');
        setTimeout(() => router.push('/'), 2000);
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
      <div>
        <Label htmlFor="email">{t('emailStep.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailStep.emailPlaceholder')}
          className={emailError ? 'border-red-500' : ''}
          required
        />
        {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('emailStep.processing') : t('emailStep.continue')}
      </Button>
    </form>
  );

  const renderVerifyStep = () => (
    <form onSubmit={handleVerificationSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">{t('verifyStep.codeLabel')}</Label>
        <Input
          id="code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder={t('verifyStep.codePlaceholder')}
          maxLength={6}
          className={codeError ? 'border-red-500' : ''}
          required
        />
        {codeError && <p className="text-sm text-red-500 mt-1">{codeError}</p>}
      </div>
      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {t('verifyStep.verify')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={sendVerificationCode}
          disabled={!canResend || isLoading}
        >
          {canResend ? t('verifyStep.resend') : t('verifyStep.resendIn', { seconds: countdown })}
        </Button>
      </div>
    </form>
  );

  const renderDetailsStep = () => (
    <form onSubmit={handleRegistrationSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{t('detailsStep.firstNameLabel')}</Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('detailsStep.firstNamePlaceholder')}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">{t('detailsStep.lastNameLabel')}</Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('detailsStep.lastNamePlaceholder')}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="displayName">{t('detailsStep.displayNameLabel')}</Label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('detailsStep.displayNamePlaceholder')}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">{t('detailsStep.phoneLabel')}</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('detailsStep.phonePlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="password">{t('detailsStep.passwordLabel')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('detailsStep.passwordPlaceholder')}
            className={passwordError ? 'border-red-500' : ''}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t('detailsStep.confirmPasswordLabel')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('detailsStep.confirmPasswordPlaceholder')}
            className={passwordError ? 'border-red-500' : ''}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('emailStep.processing') : t('detailsStep.createAccount')}
      </Button>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-2xl font-semibold">{t('success.title')}</h3>
      <p className="text-gray-600">{t('success.description')}</p>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return renderEmailStep();
      case 'verify':
        return renderVerifyStep();
      case 'details':
        return renderDetailsStep();
      case 'success':
        return renderSuccessStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription className="text-center">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {currentStep !== 'email' && currentStep !== 'success' && (
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => {
                if (currentStep === 'verify') setCurrentStep('email');
                if (currentStep === 'details') setCurrentStep('verify');
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {renderStep()}

          {currentStep !== 'success' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">{t('or')}</span>
                </div>
              </div>

              {!isChineseRegion && (
                <GoogleOneTap className="w-full" />
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {t('alreadyHaveAccount')}{' '}
                  <a href="/login" className="text-blue-600 hover:underline">
                    {t('login')}
                  </a>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}