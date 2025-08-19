import {createNavigation} from 'next-intl/navigation';
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // 支持的语言列表
  locales: ['en', 'zh'],
  // 默认语言
  defaultLocale: 'zh',
  // 路径前缀配置
  localePrefix: 'always',
  // 路径配置
  pathnames: {
    '/': '/',
    '/register': '/register',
    '/login': '/login',
  }
});

export type Locale = (typeof routing.locales)[number];

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);