import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Locale } from '../types';

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  annualPlan: string;
  monthlyPlan: string;
  save20Percent: string;
  perMonthAnnual: string;
  perMonthMonthly: string;
  annualDescription: string;
  monthlyDescription: string;
  everythingInMonthly: string;
  savings20Percent: string;
  highPrioritySupport: string;
  fullAccess: string;
  emailSupport: string;
  cancelAnytime: string;
  chooseAnnualPlan: string;
  chooseMonthlyPlan: string;
  backToSettings: string;
}> = {
  en: {
    pageTitle: 'Choose the perfect plan for you',
    pageSubtitle: 'Choose the path that suits you and join sollo.',
    annualPlan: 'Annual Plan',
    monthlyPlan: 'Monthly Plan',
    save20Percent: 'Save 30%',
    perMonthAnnual: 'Per month (annual billing)',
    perMonthMonthly: 'Renewing monthly charge',
    annualDescription: 'The best value, maximum savings.',
    monthlyDescription: 'Ideal for starting, full flexibility.',
    everythingInMonthly: 'Everything in the monthly plan, and more:',
    savings20Percent: '30% Off',
    highPrioritySupport: 'High priority support',
    fullAccess: 'Full access to all features',
    emailSupport: 'Email support',
    cancelAnytime: 'Cancel anytime',
    chooseAnnualPlan: 'Choose Annual Plan',
    chooseMonthlyPlan: 'Choose Monthly Plan',
    backToSettings: 'Back to Settings',
  },
  he: {
    pageTitle: 'בחר את התוכנית המושלמת עבורך',
    pageSubtitle: 'בחר את המסלול שמתאים לך והצטרף ל-sollo.',
    annualPlan: 'תוכנית שנתית',
    monthlyPlan: 'תוכנית חודשית',
    save20Percent: 'חסוך 30%',
    perMonthAnnual: 'לחודש (חיוב שנתי)',
    perMonthMonthly: 'חיוב חודשי מתחדש',
    annualDescription: 'התמורה הטובה ביותר, חסכון מקסימלי.',
    monthlyDescription: 'אידיאלי להתחלה, גמישות מלאה.',
    everythingInMonthly: 'כל מה שבחודשי, ועוד:',
    savings20Percent: 'חיסכון של 30%',
    highPrioritySupport: 'תמיכה בעדיפות גבוהה',
    fullAccess: 'גישה מלאה לכל התכונות',
    emailSupport: 'תמיכה במייל',
    cancelAnytime: 'ביטול בכל עת',
    chooseAnnualPlan: 'בחר תוכנית שנתית',
    chooseMonthlyPlan: 'בחר תוכנית חודשית',
    backToSettings: 'חזרה להגדרות',
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';

  // Actual prices: Monthly $12.90, Annual $9.90/month ($118.80/year)
  const monthlyPrice = 12.90;
  const annualMonthlyPrice = 9.90;
  const annualYearlyPrice = 118.80;

  const handleChoosePlan = (plan: 'annual' | 'monthly') => {
    navigate(`/payment?plan=${plan}`);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen p-6">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t.pageTitle}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t.pageSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className={`flex justify-center items-end ${isRTL ? 'text-right' : 'text-left'}`} style={{ minHeight: '80px' }}>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.monthlyPlan}
              </h3>
            </div>
            <div className={`text-4xl font-bold text-primary-500 my-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              ${monthlyPrice.toFixed(2)}
            </div>
            <div className={`text-sm text-gray-500 dark:text-gray-400 mb-4 h-5 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.perMonthMonthly}
            </div>
            <p className={`text-gray-600 dark:text-gray-300 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.monthlyDescription}
            </p>
            <ul className={`space-y-2 mb-6 flex-grow ${isRTL ? 'text-right' : 'text-left'}`}>
              <li className="text-gray-700 dark:text-gray-300">• {t.fullAccess}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.emailSupport}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.cancelAnytime}</li>
            </ul>
            <Button
              fullWidth
              variant="primary"
              onClick={() => handleChoosePlan('monthly')}
              className={`mt-auto ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t.chooseMonthlyPlan}
            </Button>
          </div>

          {/* Annual Plan Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-primary-500 dark:border-primary-400 flex flex-col">
            <div className={`flex justify-center items-end ${isRTL ? 'text-right' : 'text-left'}`} style={{ minHeight: '80px' }}>
              <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm mb-2 inline-block">
                  {t.savings20Percent}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t.annualPlan}
                </h3>
              </div>
            </div>
            <div className={`text-4xl font-bold text-primary-500 my-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              ${annualMonthlyPrice.toFixed(2)}
            </div>
            <div className={`text-sm text-gray-500 dark:text-gray-400 mb-1 h-5 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.perMonthAnnual}
            </div>
            <div className={`text-xs text-gray-500 dark:text-gray-400 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              ${annualYearlyPrice.toFixed(2)} {locale === 'he' ? 'תשלום שנתי' : 'Paid Yearly'}
            </div>
            <p className={`text-gray-600 dark:text-gray-300 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.annualDescription}
            </p>
            <ul className={`space-y-2 mb-6 flex-grow ${isRTL ? 'text-right' : 'text-left'}`}>
              <li className="text-gray-700 dark:text-gray-300">• {t.everythingInMonthly}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.savings20Percent}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.highPrioritySupport}</li>
            </ul>
            <Button
              fullWidth
              variant="primary"
              onClick={() => handleChoosePlan('annual')}
              className={`mt-auto ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t.chooseAnnualPlan}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

