import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';



export default async function RootPage() {
  // const user = await getCurrentUser();

  // 重定向到美观的首页
  redirect('/home');
}