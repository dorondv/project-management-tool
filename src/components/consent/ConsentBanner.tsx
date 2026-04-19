import { useState, useEffect } from 'react';
import { Cookie, Settings2, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t } from '../../i18n';
import {
  grantAllConsent,
  denyAllConsent,
  updateConsent,
  getStoredConsent,
  applyStoredConsent,
  DEFAULT_CONSENT_STATE,
  OPEN_CONSENT_EVENT,
  type ConsentState,
} from '../../lib/consent';

export function ConsentBanner() {
  const { state } = useApp();
  const locale = state.locale;
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<ConsentState>(DEFAULT_CONSENT_STATE);

  useEffect(() => {
    applyStoredConsent();
    if (!getStoredConsent()) {
      setVisible(true);
    }
    const onOpen = () => {
      const stored = getStoredConsent();
      setPrefs(stored ?? DEFAULT_CONSENT_STATE);
      setVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  function handleAcceptAll() {
    grantAllConsent();
    setVisible(false);
  }

  function handleRejectAll() {
    denyAllConsent();
    setVisible(false);
  }

  function handleSavePreferences() {
    updateConsent(prefs);
    setVisible(false);
  }

  function togglePref(key: keyof ConsentState) {
    setPrefs((p) => ({
      ...p,
      [key]: p[key] === 'granted' ? 'denied' : 'granted',
    }));
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
      role="dialog"
      aria-label={t('consentBanner.ariaLabel', locale)}
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-1.5 shrink-0">
              <Cookie className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {t('consentBanner.title', locale)}
                </span>{' '}
                {t('consentBanner.description', locale)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {t('consentBanner.hidePreferences', locale)}
              </>
            ) : (
              <>
                <Settings2 className="h-4 w-4" />
                {t('consentBanner.customize', locale)}
              </>
            )}
          </button>

          {showDetails && (
            <div className="mt-4 space-y-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {t('consentBanner.analytics', locale)}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.analytics_storage === 'granted'}
                  onClick={() => togglePref('analytics_storage')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    prefs.analytics_storage === 'granted'
                      ? 'bg-purple-600'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      prefs.analytics_storage === 'granted'
                        ? 'translate-x-5'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {t('consentBanner.advertising', locale)}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.ad_storage === 'granted'}
                  onClick={() => {
                    const next =
                      prefs.ad_storage === 'granted' ? 'denied' : 'granted';
                    setPrefs((p) => ({
                      ...p,
                      ad_storage: next,
                      ad_user_data: next,
                      ad_personalization: next,
                    }));
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    prefs.ad_storage === 'granted'
                      ? 'bg-purple-600'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      prefs.ad_storage === 'granted'
                        ? 'translate-x-5'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {t('consentBanner.acceptAll', locale)}
            </button>
            <button
              type="button"
              onClick={handleRejectAll}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {t('consentBanner.rejectAll', locale)}
            </button>
            {showDetails && (
              <button
                type="button"
                onClick={handleSavePreferences}
                className="rounded-lg bg-zinc-800 dark:bg-zinc-200 px-3.5 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                {t('consentBanner.savePreferences', locale)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
