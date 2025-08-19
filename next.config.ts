import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

// 初始化 next-intl 插件
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // 图片配置
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.googleusercontent.com', pathname: '/**' },
    ],
  },
  // 确保支持国际化路由
  experimental: {
    // 允许 next-intl 正常工作
  },
};

// 将配置用 withNextIntl 包裹后导出
export default withNextIntl(nextConfig);

// Cloudflare 适配器
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();