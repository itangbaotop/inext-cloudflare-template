'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  title?: string;
  showLogout?: boolean;
  username?: string;
  onLogout?: () => void;
}

export function Header({ title = "应用", showLogout = false, username, onLogout }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <div className="flex items-center space-x-4">
            {username && (
              <span className="text-gray-700 dark:text-gray-300">
                欢迎, {username}
              </span>
            )}
            <ThemeToggle />
            {showLogout && onLogout && (
              <Button 
                onClick={onLogout}
                variant="outline"
                size="sm"
              >
                登出
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}