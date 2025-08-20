'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X, Home, BookOpen, Crown, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  googleId?: string | null;
}

interface MobileMenuProps {
  user?: UserInfo | null;
  onLogout: () => void;
}

export function MobileMenu({ user, onLogout }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('header');

  const menuItems = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/courses', label: '课程', icon: BookOpen },
    { href: '/subscription', label: '订阅', icon: Crown },
    { href: '/about', label: '关于', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white dark:bg-gray-800 z-40">
          <div className="px-4 py-6 space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}

            {user && (
              <>
                <Separator />
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.displayName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span>个人资料</span>
                </Link>
                
                <Link
                  href="/subscription"
                  className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  <Crown className="w-5 h-5" />
                  <span>订阅管理</span>
                </Link>
                
                <Link
                  href="/settings"
                  className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-5 h-5" />
                  <span>账户设置</span>
                </Link>
                
                <Separator />
                
                <Button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  variant="ghost"
                  className="w-full flex items-center justify-start space-x-3 px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span>退出登录</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}