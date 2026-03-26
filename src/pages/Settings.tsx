import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Pen, Folder, Download, Upload, Globe, Save, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SubscriptionStatus } from '../components/settings/SubscriptionStatus';
import { Locale, Currency, SUPPORTED_LOCALES, LOCALE_LABELS } from '../types';
import { t } from '../i18n';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/currencyUtils';
import { storage } from '../utils/localStorage';
import {
  CustomerScoreSettings,
  defaultCustomerScoreSettings,
  sanitizeCustomerScoreSettings,
} from '../utils/customerScoreSettings';

interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Settings() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const isRTL = locale === 'he';
  const alignStart = isRTL ? 'text-right' : 'text-left';

  // Language preference
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(locale);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  
  // Currency preference
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  
  // Customer score settings
  const [scoreSettings, setScoreSettings] = useState<CustomerScoreSettings>(defaultCustomerScoreSettings);
  const [savedScoreSettings, setSavedScoreSettings] = useState<CustomerScoreSettings>(defaultCustomerScoreSettings);
  const [isSavingScoreSettings, setIsSavingScoreSettings] = useState(false);

  // Sync selectedLanguage with locale when locale changes
  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);
  
  // Sync selectedCurrency with currency when currency changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    const savedSettings = sanitizeCustomerScoreSettings(
      storage.get<CustomerScoreSettings>('customerScoreSettings'),
    );
    setScoreSettings(savedSettings);
    setSavedScoreSettings(savedSettings);
  }, []);

  const scoreMetrics = [
    { key: 'monthlyIncome', label: t('settings.customerScoreMetrics.monthlyIncome', locale) },
    { key: 'hourlyRate', label: t('settings.customerScoreMetrics.hourlyRate', locale) },
    { key: 'seniority', label: t('settings.customerScoreMetrics.seniority', locale) },
    { key: 'referralsCount', label: t('settings.customerScoreMetrics.referralsCount', locale) },
    { key: 'totalRevenue', label: t('settings.customerScoreMetrics.totalRevenue', locale) },
    { key: 'referredRevenue', label: t('settings.customerScoreMetrics.referredRevenue', locale) },
  ] as const;

  const clampScoreWeight = (value: number) => Math.min(2, Math.max(0, value));

  const handleScoreMetricToggle = (key: keyof CustomerScoreSettings['include']) => {
    setScoreSettings((prev) => ({
      ...prev,
      include: {
        ...prev.include,
        [key]: !prev.include[key],
      },
    }));
  };

  const handleScoreWeightChange = (key: keyof CustomerScoreSettings['weights'], value: number) => {
    const clampedValue = clampScoreWeight(value);
    setScoreSettings((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: clampedValue,
      },
    }));
  };

  const isScoreSettingsDirty = JSON.stringify(scoreSettings) !== JSON.stringify(savedScoreSettings);

  const handleLanguageSelect = (newLocale: Locale) => {
    setSelectedLanguage(newLocale);
  };

  const handleSaveLanguage = async () => {
    setIsSavingLanguage(true);
    
    try {
      // Save to user profile in backend first
      if (state.user) {
        const { api } = await import('../utils/api');
        await api.users.update(state.user.id, {
          preferredLanguage: selectedLanguage,
        });
      }
      
      // Update UI after successful save
      dispatch({ type: 'SET_LOCALE', payload: selectedLanguage });
      
      toast.success(t('settings.languageUpdated', selectedLanguage));
    } catch (error) {
      console.error('Failed to update language preference:', error);
      toast.error(t('settings.languageSaveFailed', selectedLanguage));
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleCurrencySelect = (newCurrency: Currency) => {
    setSelectedCurrency(newCurrency);
  };

  const handleSaveCurrency = async () => {
    setIsSavingCurrency(true);
    
    try {
      // Save to user profile in backend (if API supports it)
      // For now, just save to localStorage via dispatch
      dispatch({ type: 'SET_CURRENCY', payload: selectedCurrency });
      
      toast.success(t('settings.currencyUpdated', locale));
    } catch (error) {
      console.error('Failed to update currency preference:', error);
      toast.error(t('settings.currencySaveFailed', locale));
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const handleSaveCustomerScoreSettings = async () => {
    setIsSavingScoreSettings(true);
    try {
      storage.set('customerScoreSettings', scoreSettings);
      setSavedScoreSettings(scoreSettings);
      toast.success(t('settings.customerScoreSaveSuccess', locale));
    } catch (error: any) {
      console.error('Error saving customer score settings:', error);
      toast.error(t('settings.customerScoreSaveFailed', locale));
    } finally {
      setIsSavingScoreSettings(false);
    }
  };

  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false);

  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    businessField: '',
    vatNo: '',
    address: '',
    country: '',
  });
  const [isSavingBusinessDetails, setIsSavingBusinessDetails] = useState(false);

  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  useEffect(() => {
    loadBillingHistory();
    loadBusinessDetails();
  }, [state.user?.id]);

  // Load business details from localStorage
  const loadBusinessDetails = () => {
    if (state.user?.id) {
      const saved = localStorage.getItem(`businessDetails_${state.user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBusinessDetails({
            businessName: '',
            businessField: '',
            vatNo: '',
            address: '',
            country: '',
            ...parsed,
          });
        } catch (error) {
          console.error('Error loading business details:', error);
        }
      }
    }
  };

  const loadBillingHistory = async () => {
    if (!state.user?.id) return;

    try {
      setLoadingBillingHistory(true);
      const history = await api.subscriptions.getBillingHistory(state.user.id);
      setBillingHistory(history);
    } catch (error: any) {
      console.error('Error loading billing history:', error);
    } finally {
      setLoadingBillingHistory(false);
    }
  };


  const formatDate = (date: Date) => {
    const months = locale === 'he' 
      ? ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return locale === 'he' ? `${day} ${month}, ${year}` : `${day} ${month}, ${year}`;
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
    }
  };

  const handleSaveBusinessDetails = async () => {
    if (!state.user?.id) {
      toast.error(t('settings.userMustBeLoggedIn', locale));
      return;
    }

    setIsSavingBusinessDetails(true);
    try {
      // Save to localStorage for now (can be extended to backend later)
      localStorage.setItem(`businessDetails_${state.user.id}`, JSON.stringify(businessDetails));
      
      // TODO: Save to backend when API endpoint is available
      // await api.users.update(state.user.id, {
      //   businessName: businessDetails.businessName,
      //   businessField: businessDetails.businessField,
      // });
      
      toast.success(t('settings.businessDetailsSavedSuccess', locale));
    } catch (error: any) {
      console.error('Error saving business details:', error);
      toast.error(t('settings.businessDetailsSaveFailed', locale));
    } finally {
      setIsSavingBusinessDetails(false);
    }
  };

  const formatCountdownValue = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className={`mb-8 ${alignStart}`}>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('settings.pageTitle', locale)}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('settings.pageSubtitle', locale)}
          </p>
        </div>

        <div className="space-y-6">
          {/* Language Preference */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe size={20} className="text-primary-500 flex-shrink-0" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t('settings.languagePreference', locale)}
              </h3>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t('settings.languageDescription', locale)}
            </p>

            {/* Language Options - Grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {SUPPORTED_LOCALES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  disabled={isSavingLanguage}
                  className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                    selectedLanguage === lang
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                  } ${isRTL ? 'flex-row-reverse' : ''} ${isSavingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`font-medium ${selectedLanguage === lang ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                    {LOCALE_LABELS[lang]}
                  </span>
                  {selectedLanguage === lang && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Save Button */}
            <div className={`mt-4 max-w-md ${alignStart}`}>
              <Button
                variant="primary"
                onClick={handleSaveLanguage}
                disabled={isSavingLanguage || selectedLanguage === locale}
                className={`${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Save size={16} />
                {t('settings.saveLanguage', locale)}
              </Button>
              {selectedLanguage !== locale && (
                <p className={`text-xs text-amber-600 dark:text-amber-400 mt-2 ${alignStart}`}>
                  {isRTL 
                    ? 'לחץ על "שמור שפה" כדי לשמור את הבחירה שלך'
                    : 'Click "Save Language" to save your selection'
                  }
                </p>
              )}
            </div>
          </Card>

          {/* Currency Preference */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe size={20} className="text-primary-500 flex-shrink-0" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t('settings.currencyPreference', locale)}
              </h3>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t('settings.currencyDescription', locale)}
            </p>

            {/* Currency Options */}
            <div className={`flex gap-3 max-w-md ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => handleCurrencySelect('ILS')}
                disabled={isSavingCurrency}
                className={`w-1/3 flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                  selectedCurrency === 'ILS'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                } ${isRTL ? 'flex-row-reverse' : ''} ${isSavingCurrency ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`font-medium ${selectedCurrency === 'ILS' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                  ₪
                </span>
                {selectedCurrency === 'ILS' && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleCurrencySelect('USD')}
                disabled={isSavingCurrency}
                className={`w-1/3 flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                  selectedCurrency === 'USD'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                } ${isRTL ? 'flex-row-reverse' : ''} ${isSavingCurrency ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`font-medium ${selectedCurrency === 'USD' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                  $
                </span>
                {selectedCurrency === 'USD' && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleCurrencySelect('EUR')}
                disabled={isSavingCurrency}
                className={`w-1/3 flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                  selectedCurrency === 'EUR'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                } ${isRTL ? 'flex-row-reverse' : ''} ${isSavingCurrency ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`font-medium ${selectedCurrency === 'EUR' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                  €
                </span>
                {selectedCurrency === 'EUR' && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </button>
            </div>

            {/* Save Button */}
            <div className={`mt-4 max-w-md ${alignStart}`}>
              <Button
                variant="primary"
                onClick={handleSaveCurrency}
                disabled={isSavingCurrency || selectedCurrency === currency}
                className={`${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Save size={16} />
                {t('settings.saveCurrency', locale)}
              </Button>
              {selectedCurrency !== currency && (
                <p className={`text-xs text-amber-600 dark:text-amber-400 mt-2 ${alignStart}`}>
                  {isRTL 
                    ? 'לחץ על "שמור מטבע" כדי לשמור את הבחירה שלך'
                    : 'Click "Save Currency" to save your selection'}
                </p>
              )}
            </div>
          </Card>

          {/* Customer Score */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <SlidersHorizontal size={20} className="text-primary-500 flex-shrink-0" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t('settings.customerScoreTitle', locale)}
              </h3>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t('settings.customerScoreDescription', locale)}
            </p>

            <div className={`mb-6 ${alignStart}`}>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('settings.customerScoreExplanationTitle', locale)}
              </h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {[1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse text-right justify-end' : 'text-left'}`}
                  >
                    {isRTL ? (
                      <>
                        <span>{t(`settings.customerScoreExplanationStep${i}`, locale)}</span>
                        <span className="text-primary-500">•</span>
                      </>
                    ) : (
                      <>
                        <span className="text-primary-500">•</span>
                        <span>{t(`settings.customerScoreExplanationStep${i}`, locale)}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <details className="rounded-lg border border-gray-200 dark:border-gray-700">
              <summary
                className={`cursor-pointer select-none px-4 py-3 font-medium text-gray-900 dark:text-white ${alignStart}`}
              >
                {t('settings.customerScoreAdjustmentsTitle', locale)}
              </summary>
              <div className="px-4 pb-4">
                <div className={`text-xs text-gray-500 dark:text-gray-400 mb-3 ${alignStart}`}>
                  {t('settings.customerScoreWeightHint', locale)}
                </div>

                <div className="space-y-4">
                  {scoreMetrics.map((metric) => {
                    const isEnabled = scoreSettings.include[metric.key];
                    const weightValue = scoreSettings.weights[metric.key];
                    return (
                      <div
                        key={metric.key}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                      >
                        <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <p className={`font-medium text-gray-900 dark:text-white ${alignStart}`}>
                            {metric.label}
                          </p>
                          <label className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => handleScoreMetricToggle(metric.key)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t('settings.customerScoreIncludeLabel', locale)}
                            </span>
                          </label>
                        </div>

                        <div className={`mt-3 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="flex-1">
                            <label className={`block text-xs text-gray-500 dark:text-gray-400 mb-1 ${alignStart}`}>
                              {t('settings.customerScoreWeightLabel', locale)}
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={2}
                              step={0.1}
                              value={weightValue}
                              disabled={!isEnabled}
                              onChange={(e) => handleScoreWeightChange(metric.key, Number(e.target.value))}
                              className={`w-full ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm text-gray-500">x</span>
                            <input
                              type="number"
                              min={0}
                              max={2}
                              step={0.1}
                              value={weightValue}
                              disabled={!isEnabled}
                              onChange={(e) => {
                                const numericValue = Number(e.target.value);
                                handleScoreWeightChange(metric.key, Number.isNaN(numericValue) ? 0 : numericValue);
                              }}
                              className={`w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                                !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`mt-4 max-w-md ${alignStart}`}>
                  <Button
                    variant="primary"
                    onClick={handleSaveCustomerScoreSettings}
                    disabled={isSavingScoreSettings || !isScoreSettingsDirty}
                    className={`${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Save size={16} />
                    {t('settings.customerScoreSave', locale)}
                  </Button>
                </div>
              </div>
            </details>
          </Card>

          {/* Subscription Status */}
          <SubscriptionStatus />

          {/* Billing History */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign size={20} className="text-primary-500 flex-shrink-0" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t('settings.billingHistory', locale)}
              </h3>
            </div>

        {loadingBillingHistory ? (
          <div className={`text-center py-8 ${alignStart}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">{locale === 'he' ? 'טוען...' : 'Loading...'}</p>
          </div>
        ) : billingHistory.length === 0 ? (
          <div className={`py-6 ${alignStart}`}>
            <p className={`text-gray-600 dark:text-gray-400 ${alignStart}`}>
              {locale === 'he' ? 'אין היסטוריית תשלומים' : 'No billing history'}
            </p>
          </div>
        ) : (
          <>
            <p className={`text-sm text-gray-500 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t('settings.billingHistoryNote', locale)}
            </p>
          <div className="space-y-3">
            {billingHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className={`flex-1 ${alignStart}`}>
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {locale === 'he' 
                      ? `מנוי ${item.subscription?.planType === 'annual' ? 'שנתי' : 'חודשי'} - ${item.invoiceNumber}`
                      : `${item.subscription?.planType === 'annual' ? 'Annual' : 'Monthly'} Subscription - ${item.invoiceNumber}`
                    }
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(new Date(item.paymentDate))}
                  </div>
                  {item.status === 'refunded' || item.status === 'partially_refunded' ? (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {item.status === 'refunded' 
                        ? (locale === 'he' ? 'הוחזר' : 'Refunded')
                        : (locale === 'he' ? 'הוחזר חלקית' : 'Partially Refunded')
                      }
                    </div>
                  ) : null}
                </div>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-4'}`}>
                  <div className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                    {formatCurrency(item.amount, currency, locale)}
                  </div>
                  {item.invoiceUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.invoiceUrl, '_blank')}
                      className={isRTL ? 'flex-row-reverse' : ''}
                      title={locale === 'he' ? 'פתח עמוד תשלום PayPal' : 'Open PayPal transaction page'}
                    >
                      <Download size={16} />
                      {locale === 'he' ? 'צפה בחשבונית' : 'View Invoice'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className={isRTL ? 'flex-row-reverse' : ''}
                    >
                      <Download size={16} />
                      {t('settings.downloadInvoice', locale)}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
          </Card>

          {/* Digital Signature - Hidden */}
          {/* <Card className="p-6">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} mb-6`}>
              <Pen size={20} className="text-primary-500" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t('settings.digitalSignature', locale)}
              </h3>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t('settings.businessOwnerSignature', locale)}
            </p>

            <label
              htmlFor="signature-upload"
              className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors max-w-md mx-auto"
            >
              <input
                type="file"
                id="signature-upload"
                accept="image/*"
                className="hidden"
                onChange={handleSignatureUpload}
              />
              {signatureFile ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {signatureFile.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Click to change
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="mx-auto text-gray-400 dark:text-gray-500" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'he' ? 'לחץ להעלאת חתימה' : 'Click to upload signature'}
                  </div>
                </div>
              )}
            </label>
          </Card> */}

          {/* Business Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Folder size={20} className="text-primary-500 flex-shrink-0" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t('settings.businessDetails', locale)}
              </h3>
            </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t('settings.businessName', locale)}
            </label>
            <input
              type="text"
              value={businessDetails.businessName}
              onChange={(e) => setBusinessDetails({ ...businessDetails, businessName: e.target.value })}
              placeholder={t('settings.businessNamePlaceholder', locale)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t('settings.businessField', locale)}
            </label>
            <input
              type="text"
              value={businessDetails.businessField}
              onChange={(e) => setBusinessDetails({ ...businessDetails, businessField: e.target.value })}
              placeholder={t('settings.businessFieldPlaceholder', locale)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t('settings.vatNo', locale)}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={businessDetails.vatNo}
              onChange={(e) => setBusinessDetails({ ...businessDetails, vatNo: e.target.value })}
              placeholder={t('settings.vatNoPlaceholder', locale)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t('settings.businessAddress', locale)}
            </label>
            <input
              type="text"
              value={businessDetails.address ?? ''}
              onChange={(e) => setBusinessDetails({ ...businessDetails, address: e.target.value })}
              placeholder={t('settings.businessAddressPlaceholder', locale)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t('settings.businessCountry', locale)}
            </label>
            <input
              type="text"
              value={businessDetails.country ?? ''}
              onChange={(e) => setBusinessDetails({ ...businessDetails, country: e.target.value })}
              placeholder={t('settings.businessCountryPlaceholder', locale)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>
          <div className={`flex gap-2 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="primary"
              onClick={handleSaveBusinessDetails}
              disabled={isSavingBusinessDetails}
              loading={isSavingBusinessDetails}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              {t('settings.save', locale)}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                loadBusinessDetails(); // Reload saved values instead of clearing
              }}
              disabled={isSavingBusinessDetails}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              {t('settings.cancel', locale)}
            </Button>
          </div>
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
}
