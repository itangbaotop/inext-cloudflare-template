import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { routing } from '../../i18n.config';

export default function RootPage() {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token');
  
  // 如果用户已登录，重定向到首页；如果未登录，重定向到登录页
  if (authToken) {
    redirect(`/${routing.defaultLocale}`);
  } else {
    redirect(`/${routing.defaultLocale}/login`);
  }
}
