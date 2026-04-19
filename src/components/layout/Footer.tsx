import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { t as translate } from '../../i18n';
import { openConsentBanner } from '../../lib/consent';

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
  const locale = state.locale;
  const isRTL = locale === 'he';
  const footerLocale = locale === 'he' ? 'he' : 'en';
  const t = translations[footerLocale];
  const year = new Date().getFullYear();

  return (
    <footer className={`border-t border-gray-200 dark:border-gray-800 py-4 text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
          © {year} MySollo. {t.rights}
        </div>
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">
            {t.terms}
          </Link>
          <span className="text-gray-300 dark:text-gray-700" aria-hidden>|</span>
          <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">
            {t.privacy}
          </Link>
          <span className="text-gray-300 dark:text-gray-700" aria-hidden>|</span>
          <button
            type="button"
            onClick={() => openConsentBanner()}
            className="hover:text-primary-600 dark:hover:text-primary-400 underline-offset-2 hover:underline"
          >
            {translate('footer.cookiePreferences', locale)}
          </button>
        </div>
      </div>
    </footer>
  );
}
