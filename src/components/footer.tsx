import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const Footer: React.FC = () => {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <Link href="/" className="text-gray-900 dark:text-white font-medium">
              {t('company.name')}
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">
                {t('links.about')}
              </Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">
                {t('links.contact')}
              </Link>
              <Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">
                {t('links.privacy')}
              </Link>
              <Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">
                {t('links.terms')}
              </Link>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('rights', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;