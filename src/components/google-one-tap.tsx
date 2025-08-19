'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleOneTapProps {
  className?: string;
}

export function GoogleOneTap({ className }: GoogleOneTapProps) {
  const router = useRouter();
  const [showFallback, setShowFallback] = useState(false);
  const t = useTranslations('login');
  const initialized = useRef(false);
  const scriptLoaded = useRef(false);

  // 🔧 定义全局回调函数
  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    console.log('🎉 Google One Tap 回调被触发！');
    console.log('📋 收到的 credential:', response?.credential?.substring(0, 50) + '...');
    
    try {
      const res = await fetch('/api/auth/google-gis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      
      if (data.success) {
        // 使用当前locale重定向
        const currentPath = window.location.pathname;
        const localeMatch = currentPath.match(/^\/(en|zh)/);
        const locale = localeMatch ? localeMatch[1] : 'zh';
        window.location.href = `/${locale}${data.redirectTo || '/'}`;
      } else {
        alert(data.error || 'Google登录失败，请重试');
      }
    } catch (error: any) {
      console.error('❌ 登录过程出错:', error);
      alert('Google登录失败: ' + (error.message || '网络错误，请重试'));
    }
  }, []);

  // 🔧 主useEffect - 确保只在客户端执行
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 不再需要全局函数，因为我们使用程序化方式

    // 检查 Google One Tap 的状态
    console.log('=== Google One Tap 诊断 ===');
    console.log('Google API:', !!window.google);
    console.log('Google Accounts:', !!window.google?.accounts);
    console.log('Google ID:', !!window.google?.accounts?.id);
    console.log('Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('Current URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);

    // 🔧 防止重复初始化（React 严格模式）
    if (initialized.current) {
      console.log('🔄 Already initialized, skipping...');
      return;
    }

    const initializeGoogle = async () => {
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.error('❌ Google client ID not configured');
        setShowFallback(true);
        return;
      }

      // 确保Google API已加载
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        console.error('❌ Google API未加载');
        setShowFallback(true);
        return;
      }

      // 🔧 取消任何现有的请求
      try {
        window.google.accounts.id.cancel();
      } catch (error) {
        // 忽略取消错误
      }

      // 检查用户是否已经登录
      try {
        const response = await fetch('/api/auth/user', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            console.log('✅ 用户已登录，跳过 One Tap');
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ 无法检查登录状态:', error);
      }

      // 🔧 初始化 Google One Tap
      try {
        console.log('🔧 Initializing Google One Tap...');
        console.log('🔧 Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
        console.log('🔧 Current hostname:', window.location.hostname);
        
        // 🔧 关键域名验证 - 确保与Google Cloud Console配置匹配
          const currentOrigin = window.location.origin;
          const currentHostname = window.location.hostname;
          
          console.log('🔍 域名验证检查:');
          console.log('📋 需要配置的授权JavaScript源:');
          console.log('📋 1.', currentOrigin);
          console.log('📋 2. http://localhost:3000');
          console.log('📋 3. https://localhost:3000');
          
          // 🔧 检查是否为localhost开发环境
          const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
          if (isLocalhost) {
            console.log('✅ 开发环境检测: localhost');
            console.log('🔧 确保Google Cloud Console已添加: http://localhost:3000');
          } else {
            console.warn('⚠️ 生产环境检测:', currentOrigin);
            console.warn('⚠️ 确保Google Cloud Console已添加:', currentOrigin);
          }
        
        // 🔧 增强调试信息
        console.log('🔍 Google One Tap 配置详情:');
        console.log('📋 Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
        console.log('📋 当前域名:', window.location.origin);
        console.log('📋 当前路径:', window.location.pathname);
        
        // 🔧 验证客户端ID格式
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
          console.error('❌ 无效的Google客户端ID格式:', clientId);
          setShowFallback(true);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          context: 'signin',
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          // 🔧 添加更多调试配置
          log_level: 'debug', // 启用详细日志
        });

        console.log('✅ Google One Tap initialized');

        // 🔧 立即显示 One Tap（移除延迟）
        try {
          console.log('⏰ 立即显示 Google One Tap...');
          
          window.google.accounts.id.prompt((notification: any) => {
            console.log('🔔 Google One Tap 通知:', notification);
            
            if (notification && notification.isNotDisplayed && notification.isNotDisplayed()) {
              const reason = notification.getNotDisplayedReason();
              console.log('❌ One Tap 未显示, 原因:', reason);
              // 只在非 "opt_out_or_no_session" 原因时显示 fallback
              if (reason !== 'opt_out_or_no_session') {
                setShowFallback(true);
              }
            } else if (notification && notification.isSkippedMoment && notification.isSkippedMoment()) {
              const skipReason = notification.getSkippedReason();
              console.log('⏭️ One Tap 被跳过, 原因:', skipReason);
              setShowFallback(true);
            } else if (notification && notification.isDismissedMoment && notification.isDismissedMoment()) {
              const dismissReason = notification.getDismissedReason();
              console.log('❌ One Tap 被关闭, 原因:', dismissReason);
            } else {
              console.log('✅ One Tap 已成功显示');
            }
          });
          
          console.log('✅ One Tap 调用完成');
          
        } catch (promptError) {
          console.error('❌ 显示 One Tap 失败:', promptError);
          setShowFallback(true);
        }

      } catch (initError) {
        console.error('❌ Failed to initialize Google One Tap:', initError);
        setShowFallback(true);
      }
    };

    const loadGoogleScript = () => {
      return new Promise<void>((resolve, reject) => {
        // 🔧 检查脚本是否已存在
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        
        if (existingScript && scriptLoaded.current) {
          console.log('✅ Google script already loaded');
          resolve();
          return;
        }

        if (existingScript) {
          existingScript.addEventListener('load', () => {
            scriptLoaded.current = true;
            resolve();
          });
          existingScript.addEventListener('error', () => reject(new Error('Google脚本加载失败')));
          return;
        }

        console.log('📥 Loading Google script...');
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('✅ Google script loaded successfully');
          scriptLoaded.current = true;
          resolve();
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load Google script');
          reject(new Error('Google脚本加载失败'));
        };

        document.head.appendChild(script);
      });
    };

    const init = async () => {
      try {
        await loadGoogleScript();
        await initializeGoogle();
        initialized.current = true;
      } catch (error) {
        console.error('❌ Google One Tap初始化失败:', error);
        setShowFallback(true);
      }
    };

    init();

    // 清理函数
    return () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // 忽略清理错误
        }
      }
    };
  }, [handleGoogleCredentialResponse]);

  if (showFallback) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 mb-2">无法加载Google一键登录</p>
        <button
          onClick={() => window.location.href = '/api/auth/google'}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          使用Google登录
        </button>
      </div>
    );
  }

  // 🔧 添加手动测试按钮
  const testGoogleLogin = () => {
    console.log('🧪 手动测试Google登录...');
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          console.log('🔔 手动触发结果:', notification);
        });
      } catch (error) {
        console.error('❌ 手动触发失败:', error);
      }
    } else {
      console.error('❌ Google API 未加载');
    }
  };

  return (
    <div className="google-one-tap-container">
      {/* Google One Tap 将通过JavaScript初始化 */}
      <div style={{ display: 'none' }}>Google One Tap初始化中...</div>
      
      {/* 🔧 调试按钮 - 仅开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={testGoogleLogin}
          className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded z-50"
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}
        >
          🧪 测试Google登录
        </button>
      )}
    </div>
  );
}
