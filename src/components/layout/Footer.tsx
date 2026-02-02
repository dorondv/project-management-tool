import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const translations = {
  en: {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    rights: 'All rights reserved.',
  },
  he: {
    terms: 'תנאי שירות',
    privacy: 'מדיניות פרטיות',
    rights: 'כל הזכויות שמורות.',
  },
};

export function Footer() {
  const { state } = useApp();
  const locale = state.locale || 'en';
  const isRTL = locale === 'he';
  const t = translations[locale as 'en' | 'he'];
  const year = new Date().getFullYear();

  return (
    <footer className={`border-t border-gray-200 dark:border-gray-800 py-4 text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
          © {year} MySollo. {t.rights}
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">
            {t.terms}
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">
            {t.privacy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
