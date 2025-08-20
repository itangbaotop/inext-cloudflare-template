'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { LoginDialog } from '@/components/login-dialog';
import { MobileMenu } from '@/components/mobile-menu';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { User, Settings, LogOut, ChevronDown, Crown, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/lib/subscription';

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  googleId?: string | null;
}

interface HeaderProps {
  title?: string;
  user?: UserInfo | null;
}

export function Header({ title, user }: HeaderProps) {
  const header = useTranslations('header');
  const subscriptionT = useTranslations('subscription');
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { subscription } = useSubscription();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getMembershipBadge = () => {
    if (!subscription) return null;

    const planMap = {
      free: {
        icon: <Star className="w-4 h-4" />,
        label: subscriptionT('plans.free.name'),
        color: 'text-gray-600'
      },
      basic: {
        icon: <Crown className="w-4 h-4" />,
        label: subscriptionT('plans.plus.name'),
        color: 'text-purple-600'
      },
      pro: {
        icon: <Crown className="w-4 h-4" />,
        label: subscriptionT('plans.plus.name'),
        color: 'text-blue-600'
      },
      premium: {
        icon: <Crown className="w-4 h-4" />,
        label: subscriptionT('plans.enterprise.name'),
        color: 'text-yellow-600'
      }
    };

    return planMap[subscription.plan] || planMap.free;
  };

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {title || header('logo')}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              {header('nav.home')}
            </Link>
            <Link 
              href="/courses" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              {header('nav.courses')}
            </Link>
            <Link 
              href="/subscription/pricing" 
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Crown className="w-4 h-4" />
              <span>{header('nav.subscription')}</span>
            </Link>
            <Link 
              href="/about" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              {header('nav.about')}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.displayName}
                    </span>
                    <div className="flex items-center space-x-1">
                      {getMembershipBadge()?.icon}
                      <span className={`text-xs ${getMembershipBadge()?.color}`}>
                        {getMembershipBadge()?.label}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      个人资料
                    </Link>
                    
                    <Link
                      href="/subscription"
                      className="flex items-center px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Crown className="w-4 h-4 mr-3" />
                      订阅管理
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      账户设置
                    </Link>
                    
                    <Separator className="my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="hidden md:flex items-center">
                  <Button
                    onClick={() => setShowLoginDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    {header('nav.login')}
                  </Button>
                </div>
                <MobileMenu user={user} onLogout={handleLogout} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        onSuccess={() => {
          // 登录成功后刷新页面以更新用户信息
          router.refresh();
        }}
      />
    </header>
  );
}