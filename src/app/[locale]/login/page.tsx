'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到首页，登录功能现在通过弹窗实现
    router.replace('/');
  }, [router]);

  return null;
}