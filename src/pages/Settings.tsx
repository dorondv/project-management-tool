import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, DollarSign, Pen, Folder, ArrowLeft, Download, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Locale } from '../types';

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
  businessNamePlaceholder: string;
  businessFieldPlaceholder: string;
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
    billingHistoryNote: 'The ability to download invoices for the subscription will be added soon. The information displayed here is for illustration purposes only.',
    downloadInvoice: 'Download Invoice',
    digitalSignature: 'Digital Signature',
    businessOwnerSignature: 'Business owner\'s signature',
    businessDetails: 'Business Details (for invoices)',
    businessName: 'Business Name',
    businessField: 'Field of Business',
    businessNamePlaceholder: 'Example: Digital Solutions Ltd.',
    businessFieldPlaceholder: 'Example: Software Development',
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
    billingHistoryNote: 'היכולת להוריד חשבוניות עבור המנוי תתווסף בקרוב. המידע המוצג כאן הוא להמחשה בלבד.',
    downloadInvoice: 'הורד חשבונית',
    digitalSignature: 'חתימה דיגיטלית',
    businessOwnerSignature: 'חתימת בעל העסק',
    businessDetails: 'פרטי עסק (לחשבוניות)',
    businessName: 'שם העסק',
    businessField: 'תחום עיסוק',
    businessNamePlaceholder: 'לדוגמה: פתרונות דיגיטל בע"מ',
    businessFieldPlaceholder: 'לדוגמה: פיתוח תוכנה',
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
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';

  // Mock subscription data - will be replaced with real data later
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 1);
  subscriptionEndDate.setHours(2, 53, 6, 0);

  const [countdown, setCountdown] = useState<CountdownTimer>({
    days: 1,
    hours: 2,
    minutes: 53,
    seconds: 6,
  });

  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    businessField: '',
  });

  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = subscriptionEndDate.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock billing history
  const billingHistory = [
    {
      id: '1',
      invoiceNumber: 'INV-SOL-003',
      plan: 'monthly' as const,
      date: new Date('2025-11-05'),
      amount: 99,
      currency: '₪',
    },
    {
      id: '2',
      invoiceNumber: 'INV-SOL-002',
      plan: 'monthly' as const,
      date: new Date('2025-10-05'),
      amount: 99,
      currency: '₪',
    },
    {
      id: '3',
      invoiceNumber: 'INV-SOL-001',
      plan: 'monthly' as const,
      date: new Date('2025-09-05'),
      amount: 99,
      currency: '₪',
    },
  ];

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

  const handleSaveBusinessDetails = () => {
    // TODO: Save to context/backend
    console.log('Saving business details:', businessDetails);
  };

  const formatCountdownValue = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className={alignStart}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.pageSubtitle}
        </p>
      </div>

      {/* Subscription Status */}
      <Card className="p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} mb-6`}>
          <Star size={20} className="text-primary-500" />
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
            {t.subscriptionStatus}
          </h3>
        </div>

        <div className="bg-primary-500 text-white px-4 py-2 rounded-lg mb-4 inline-block">
          {t.trialPeriod}
        </div>

        <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
          {t.trialDescription}
        </p>

        <h4 className={`text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 ${alignStart}`}>
          {t.timeRemaining}
        </h4>

        <div className={`flex ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-4'} mb-6`}>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCountdownValue(countdown.days)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t.days}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCountdownValue(countdown.hours)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t.hours}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCountdownValue(countdown.minutes)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t.minutes}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center min-w-[80px]">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCountdownValue(countdown.seconds)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t.seconds}</div>
          </div>
        </div>

        <Button
          fullWidth
          variant="primary"
          onClick={() => navigate('/pricing')}
          className={isRTL ? 'flex-row-reverse' : ''}
        >
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          {t.manageSubscription}
        </Button>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} mb-6`}>
          <DollarSign size={20} className="text-primary-500" />
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
            {t.billingHistory}
          </h3>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg mb-4">
          {t.featureInDevelopment}
        </div>

        <p className={`text-gray-600 dark:text-gray-400 mb-4 text-sm ${alignStart}`}>
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
                    ? `מנוי חודשי - ${item.invoiceNumber}`
                    : `Monthly Subscription - ${item.invoiceNumber}`
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(item.date)}
                </div>
              </div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-4'}`}>
                <div className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
                  {item.currency}{item.amount}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={isRTL ? 'flex-row-reverse' : ''}
                >
                  <Download size={16} />
                  {t.downloadInvoice}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Digital Signature */}
      <Card className="p-6">
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
          className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
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
      </Card>

      {/* Business Details */}
      <Card className="p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} mb-6`}>
          <Folder size={20} className="text-primary-500" />
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
            {t.businessDetails}
          </h3>
        </div>

        <div className="space-y-4">
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
          <div className={`flex ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} pt-2`}>
            <Button
              variant="primary"
              onClick={handleSaveBusinessDetails}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              {t.save}
            </Button>
            <Button
              variant="outline"
              onClick={() => setBusinessDetails({ businessName: '', businessField: '' })}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
