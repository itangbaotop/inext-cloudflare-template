'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

// 声明全局 window.google 对象
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleOneTapProps {
  className?: string;
}

export function GoogleOneTap({ className }: GoogleOneTapProps) {
  const t = useTranslations('login');
  const isInitialized = useRef(false);

  // 1. 定义回调函数，处理登录成功后的逻辑
  // 使用 useCallback 确保函数引用稳定
  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    console.log('✅ Google One Tap 登录成功，收到凭据:', response);
    
    // 这里是您原来的 fetch 逻辑，保持不变
    try {
      const res = await fetch('/api/auth/google-gis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      if (data.success) {
        // 成功后重定向
        window.location.href = data.redirectTo || '/';
      } else {
        console.error('后端验证失败:', data.error);
        alert(data.error || 'Google登录失败，请重试');
      }
    } catch (error) {
      console.error('❌ 登录过程出错:', error);
      alert('Google登录失败: ' + ((error as Error).message || '网络错误'));
    }
  }, []);

  // 2. 主 useEffect，负责加载脚本和初始化
  useEffect(() => {
    // 防止在 React 严格模式下重复执行
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('❌ 环境变量 NEXT_PUBLIC_GOOGLE_CLIENT_ID 未设置!');
      return;
    }

    // 检查页面上是否已有 Google GSI 脚本
    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
        // 如果脚本已存在，直接尝试初始化
        initializeGoogle();
        return;
    }

    // 如果脚本不存在，则创建并加载
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    // 关键：在脚本加载完成后再执行初始化
    script.onload = initializeGoogle;
    script.onerror = () => {
        console.error('❌ Google GSI 脚本加载失败。');
    };
    document.head.appendChild(script);

    function initializeGoogle() {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
            console.error('❌ Google API 对象在脚本加载后仍然不可用。');
            // 可以在这里设置显示备用登录按钮的状态
            return;
        }

        try {
            console.log('🔧 正在初始化 Google One Tap...');
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: false, // 开发时设为 false，方便每次都看到弹窗
                cancel_on_tap_outside: true,
            });

            console.log('✅ Google One Tap 初始化成功。');

            // 显示一键登录提示
            window.google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed()) {
                    console.warn('⚠️ One Tap 未显示，原因:', notification.getNotDisplayedReason());
                } else if (notification.isSkippedMoment()) {
                    console.warn('⏭️ One Tap 被跳过，原因:', notification.getSkippedReason());
                } else {
                    console.log('👍 One Tap 已成功显示。');
                }
            });
        } catch (error) {
            console.error('❌ 在 initialize 调用中捕获到错误:', error);
        }
    }

    // 组件卸载时的清理函数
    return () => {
      // 可以在这里移除脚本，但通常没有必要
    };
  }, [handleCredentialResponse]); // 将 callback 作为依赖项

  // 渲染 Google 传统登录按钮
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <Button 
      variant="outline" 
      className={className}
      onClick={handleGoogleLogin}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {t('social.google')}
    </Button>
  );
}