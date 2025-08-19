import {getRequestConfig} from 'next-intl/server';
import {routing} from '../../i18n.config';
 
export default getRequestConfig(async ({requestLocale}) => {
  // 这通常是一个从请求中读取的语言环境
  let locale = await requestLocale;
 
  // 确保语言环境是有效的
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});