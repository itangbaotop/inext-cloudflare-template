'use client';

import { useEffect, useRef, useCallback } from 'react';

// 声明全局 window.google 对象
declare global {
  interface Window {
    google: any;
  }
}

export function GoogleOneTap() {
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

  // 这个组件本身不渲染任何可见内容
  return null;
}