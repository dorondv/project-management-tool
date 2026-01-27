import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Pen, Folder, Download, Upload, Globe, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SubscriptionStatus } from '../components/settings/SubscriptionStatus';
import { Locale, Currency } from '../types';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/currencyUtils';

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  subscriptionStatus: string;
  trialPeriod: string;
  trialDescription: string;
  timeRemaining: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  manageSubscription: string;
  billingHistory: string;
  featureInDevelopment: string;
  billingHistoryNote: string;
  downloadInvoice: string;
  digitalSignature: string;
  businessOwnerSignature: string;
  businessDetails: string;
  businessName: string;
  businessField: string;
  vatNo: string;
  businessNamePlaceholder: string;
  businessFieldPlaceholder: string;
  vatNoPlaceholder: string;
  languagePreference: string;
  languageDescription: string;
  currentLanguage: string;
  changeLanguage: string;
  english: string;
  hebrew: string;
  languageUpdated: string;
  languageSaveFailed: string;
  saveLanguage: string;
  currencyPreference: string;
  currencyDescription: string;
  currentCurrency: string;
  changeCurrency: string;
  saveCurrency: string;
  currencyUpdated: string;
  currencySaveFailed: string;
  save: string;
  cancel: string;
}> = {
  en: {
    pageTitle: 'Settings',
    pageSubtitle: 'Customize the application to your taste',
    subscriptionStatus: 'Subscription Status',
    trialPeriod: 'Trial Period',
    trialDescription: 'Enjoy all features. Upgrade to continue after the period ends.',
    timeRemaining: 'Time remaining until renewal/end:',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    manageSubscription: 'Manage Subscription and Plans',
    billingHistory: 'Billing History',
    featureInDevelopment: 'Feature in development',
    billingHistoryNote: 'Click "View Invoice" to view transaction details on PayPal.',
    downloadInvoice: 'Download Invoice',
    viewInvoice: 'View Invoice',
    digitalSignature: 'Digital Signature',
    businessOwnerSignature: 'Business owner\'s signature',
    businessDetails: 'Business Details (for invoices)',
    businessName: 'Business Name',
    businessField: 'Field of Business',
    vatNo: 'VAT No.',
    businessNamePlaceholder: 'Example: Digital Solutions Ltd.',
    businessFieldPlaceholder: 'Example: Software Development',
    vatNoPlaceholder: 'Enter VAT number',
    languagePreference: 'Language Preference',
    languageDescription: 'Select your preferred language for the application',
    currentLanguage: 'Current Language',
    changeLanguage: 'Change Language',
    english: 'English',
    hebrew: 'Hebrew (עברית)',
    languageUpdated: 'Language preference updated successfully',
    languageSaveFailed: 'Failed to save language preference',
    saveLanguage: 'Save Language',
    currencyPreference: 'Currency Preference',
    currencyDescription: 'Select your preferred currency for displaying amounts',
    currentCurrency: 'Current Currency',
    changeCurrency: 'Change Currency',
    saveCurrency: 'Save Currency',
    currencyUpdated: 'Currency preference updated successfully',
    currencySaveFailed: 'Failed to save currency preference',
    save: 'Save',
    cancel: 'Cancel',
  },
  he: {
    pageTitle: 'הגדרות',
    pageSubtitle: 'התאם את האפליקציה לטעם שלך',
    subscriptionStatus: 'סטטוס מנוי',
    trialPeriod: 'תקופת ניסיון',
    trialDescription: 'תהנה מכל התכונות. שדרג כדי להמשיך לאחר תום התקופה.',
    timeRemaining: 'זמן נותר עד לחידוש/סיום:',
    days: 'ימים',
    hours: 'שעות',
    minutes: 'דקות',
    seconds: 'שניות',
    manageSubscription: 'נהל מנוי ותוכניות',
    billingHistory: 'היסטוריית חיובים',
    featureInDevelopment: 'תכונה בפיתוח',
    billingHistoryNote: 'לחץ על "צפה בחשבונית" כדי לצפות בפרטי העסקה ב-PayPal.',
    downloadInvoice: 'הורד חשבונית',
    viewInvoice: 'צפה בחשבונית',
    digitalSignature: 'חתימה דיגיטלית',
    businessOwnerSignature: 'חתימת בעל העסק',
    businessDetails: 'פרטי עסק לחשבונית',
    businessName: 'שם העסק',
    businessField: 'תחום עיסוק',
    vatNo: 'ח.פ.',
    businessNamePlaceholder: 'לדוגמה: פתרונות דיגיטל בע"מ',
    businessFieldPlaceholder: 'לדוגמה: פיתוח תוכנה',
    vatNoPlaceholder: 'הכנס מספר ח.פ.',
    languagePreference: 'העדפת שפה',
    languageDescription: 'בחר את השפה המועדפת עליך לאפליקציה',
    currentLanguage: 'שפה נוכחית',
    changeLanguage: 'שנה שפה',
    english: 'אנגלית (English)',
    hebrew: 'עברית',
    languageUpdated: 'העדפת השפה עודכנה בהצלחה',
    languageSaveFailed: 'שגיאה בשמירת העדפת השפה',
    saveLanguage: 'שמור שפה',
    currencyPreference: 'העדפת מטבע',
    currencyDescription: 'בחר את המטבע המועדף עליך להצגת סכומים',
    currentCurrency: 'מטבע נוכחי',
    changeCurrency: 'שנה מטבע',
    saveCurrency: 'שמור מטבע',
    currencyUpdated: 'העדפת המטבע עודכנה בהצלחה',
    currencySaveFailed: 'שגיאה בשמירת העדפת המטבע',
    save: 'שמור',
    cancel: 'ביטול',
  },
};

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
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';

  // Language preference
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(locale);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  
  // Currency preference
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  // Sync selectedLanguage with locale when locale changes
  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);
  
  // Sync selectedCurrency with currency when currency changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

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
      
      const currentT = translations[selectedLanguage];
      toast.success(currentT.languageUpdated);
    } catch (error) {
      console.error('Failed to update language preference:', error);
      const currentT = translations[selectedLanguage];
      toast.error(currentT.languageSaveFailed);
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
      
      const currentT = translations[locale];
      toast.success(currentT.currencyUpdated);
    } catch (error) {
      console.error('Failed to update currency preference:', error);
      const currentT = translations[locale];
      toast.error(currentT.currencySaveFailed);
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false);

  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    businessField: '',
    vatNo: '',
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
          setBusinessDetails(JSON.parse(saved));
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
      toast.error(locale === 'he' ? 'נדרש משתמש מחובר' : 'User must be logged in');
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
      
      toast.success(locale === 'he' ? 'פרטי העסק נשמרו בהצלחה' : 'Business details saved successfully');
    } catch (error: any) {
      console.error('Error saving business details:', error);
      toast.error(locale === 'he' ? 'שגיאה בשמירת פרטי העסק' : 'Failed to save business details');
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
            {t.pageTitle}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t.pageSubtitle}
          </p>
        </div>

        <div className="space-y-6">
          {/* Language Preference */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe size={20} className="text-primary-500 flex-shrink-0" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t.languagePreference}
              </h3>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t.languageDescription}
            </p>

            {/* Language Options - Constrained width */}
            <div className={`flex gap-3 max-w-md ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => handleLanguageSelect('he')}
                disabled={isSavingLanguage}
                className={`w-1/2 flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                  selectedLanguage === 'he'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                } ${isRTL ? 'flex-row-reverse' : ''} ${isSavingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`font-medium ${selectedLanguage === 'he' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                  {t.hebrew}
                </span>
                {selectedLanguage === 'he' && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleLanguageSelect('en')}
                disabled={isSavingLanguage}
                className={`w-1/2 flex items-center justify-between p-3 border-2 rounded-lg transition-all ${
                  selectedLanguage === 'en'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                } ${isRTL ? 'flex-row-reverse' : ''} ${isSavingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`font-medium ${selectedLanguage === 'en' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                  {t.english}
                </span>
                {selectedLanguage === 'en' && (
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
                onClick={handleSaveLanguage}
                disabled={isSavingLanguage || selectedLanguage === locale}
                className={`${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Save size={16} />
                {t.saveLanguage}
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
                {t.currencyPreference}
              </h3>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t.currencyDescription}
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
                {t.saveCurrency}
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

          {/* Subscription Status */}
          <SubscriptionStatus />

          {/* Billing History */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign size={20} className="text-primary-500 flex-shrink-0" />
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                {t.billingHistory}
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
              {t.billingHistoryNote}
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
                      {t.downloadInvoice}
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
                {t.digitalSignature}
              </h3>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t.businessOwnerSignature}
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
                {t.businessDetails}
              </h3>
            </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.businessName}
            </label>
            <input
              type="text"
              value={businessDetails.businessName}
              onChange={(e) => setBusinessDetails({ ...businessDetails, businessName: e.target.value })}
              placeholder={t.businessNamePlaceholder}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.businessField}
            </label>
            <input
              type="text"
              value={businessDetails.businessField}
              onChange={(e) => setBusinessDetails({ ...businessDetails, businessField: e.target.value })}
              placeholder={t.businessFieldPlaceholder}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.vatNo}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={businessDetails.vatNo}
              onChange={(e) => setBusinessDetails({ ...businessDetails, vatNo: e.target.value })}
              placeholder={t.vatNoPlaceholder}
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
              {t.save}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                loadBusinessDetails(); // Reload saved values instead of clearing
              }}
              disabled={isSavingBusinessDetails}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
}
