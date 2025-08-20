'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Github } from 'lucide-react';

interface GitHubLoginProps {
  className?: string;
}

export function GitHubLogin({ className }: GitHubLoginProps) {
  const t = useTranslations('login');

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  return (
    <Button 
      variant="outline" 
      className={className}
      onClick={handleGitHubLogin}
    >
      <Github className="w-5 h-5 mr-2" />
      {t('social.github')}
    </Button>
  );
}