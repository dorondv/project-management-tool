import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
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
    save20Percent: 'Save 20%',
    perMonthAnnual: 'Per month (annual billing)',
    perMonthMonthly: 'Renewing monthly charge',
    annualDescription: 'The best value, maximum savings.',
    monthlyDescription: 'Ideal for starting, full flexibility.',
    everythingInMonthly: 'Everything in the monthly plan, and more:',
    savings20Percent: '20% savings',
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
    save20Percent: 'חסוך 20%',
    perMonthAnnual: 'לחודש (חיוב שנתי)',
    perMonthMonthly: 'חיוב חודשי מתחדש',
    annualDescription: 'התמורה הטובה ביותר, חסכון מקסימלי.',
    monthlyDescription: 'אידיאלי להתחלה, גמישות מלאה.',
    everythingInMonthly: 'כל מה שבחודשי, ועוד:',
    savings20Percent: 'חיסכון של 20%',
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

  const handleChoosePlan = (plan: 'annual' | 'monthly') => {
    navigate(`/payment?plan=${plan}`);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className={alignStart}>
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className={`mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
          {t.backToSettings}
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t.pageSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Annual Plan */}
        <Card className="p-6 relative">
          <div className="absolute top-0 left-0 right-0 bg-primary-500 text-white px-4 py-2 rounded-t-lg text-center text-sm font-semibold">
            {t.save20Percent}
          </div>
          <div className="pt-12">
            <h3 className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 ${alignStart}`}>
              {t.annualPlan}
            </h3>
            <div className={`mb-2 ${alignStart}`}>
              <span className="text-4xl font-bold text-primary-500">$11.90</span>
            </div>
            <p className={`text-sm text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
              {t.perMonthAnnual}
            </p>
            <p className={`text-gray-700 dark:text-gray-300 mb-6 ${alignStart}`}>
              {t.annualDescription}
            </p>
            <div className="space-y-3 mb-6">
              <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
                <Check size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <span className={`text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.everythingInMonthly}
                </span>
              </div>
              <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
                <Check size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <span className={`text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.savings20Percent}
                </span>
              </div>
              <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
                <Check size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <span className={`text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.highPrioritySupport}
                </span>
              </div>
            </div>
            <Button
              fullWidth
              variant="primary"
              onClick={() => handleChoosePlan('annual')}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              {t.chooseAnnualPlan}
            </Button>
          </div>
        </Card>

        {/* Monthly Plan */}
        <Card className="p-6">
          <h3 className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 ${alignStart}`}>
            {t.monthlyPlan}
          </h3>
          <div className={`mb-2 ${alignStart}`}>
            <span className="text-4xl font-bold text-primary-500">$14.90</span>
          </div>
          <p className={`text-sm text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
            {t.perMonthMonthly}
          </p>
          <p className={`text-gray-700 dark:text-gray-300 mb-6 ${alignStart}`}>
            {t.monthlyDescription}
          </p>
          <div className="space-y-3 mb-6">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
              <Check size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <span className={`text-gray-700 dark:text-gray-300 ${alignStart}`}>
                {t.fullAccess}
              </span>
            </div>
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
              <Check size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <span className={`text-gray-700 dark:text-gray-300 ${alignStart}`}>
                {t.emailSupport}
              </span>
            </div>
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
              <Check size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <span className={`text-gray-700 dark:text-gray-300 ${alignStart}`}>
                {t.cancelAnytime}
              </span>
            </div>
          </div>
          <Button
            fullWidth
            variant="primary"
            onClick={() => handleChoosePlan('monthly')}
            className={isRTL ? 'flex-row-reverse' : ''}
          >
            {t.chooseMonthlyPlan}
          </Button>
        </Card>
      </div>
    </div>
  );
}

