import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Lock, ArrowRight, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Locale } from '../types';

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  backToPricing: string;
  planSummary: string;
  annualPlan: string;
  monthlyPlan: string;
  savings20Percent: string;
  perMonthAnnual: string;
  perMonthMonthly: string;
  billingDetails: string;
  fullName: string;
  email: string;
  securePayment: string;
  paymentInstructions: string;
  poweredByPayPal: string;
  securityNote: string;
  cancelNote: string;
  processPayment: string;
  payWithCard: string;
}> = {
  en: {
    pageTitle: 'Purchase Completion',
    pageSubtitle: 'Complete the payment to start using sollo',
    backToPricing: 'Back to Pricing Page',
    planSummary: 'Summary of the selected plan',
    annualPlan: 'Annual Plan',
    monthlyPlan: 'Monthly Plan',
    savings20Percent: '20% saving',
    perMonthAnnual: 'Per month (annual billing)',
    perMonthMonthly: 'Per month (monthly billing)',
    billingDetails: 'Billing Details',
    fullName: 'Full Name',
    email: 'Email',
    securePayment: 'Secure Payment',
    paymentInstructions: 'Click the button below to complete the payment via PayPal:',
    poweredByPayPal: 'Powered by PayPal',
    securityNote: 'All payments are processed securely and encrypted by PayPal',
    cancelNote: 'You can cancel the subscription at any time without additional fees',
    processPayment: 'PayPal',
    payWithCard: 'Debit or Credit Card',
  },
  he: {
    pageTitle: 'השלמת רכישה',
    pageSubtitle: 'השלם את התשלום כדי להתחיל להשתמש ב-sollo',
    backToPricing: 'חזרה לעמוד התמחור',
    planSummary: 'סיכום התוכנית שנבחרה',
    annualPlan: 'תוכנית שנתית',
    monthlyPlan: 'תוכנית חודשית',
    savings20Percent: 'חסכון של 20%',
    perMonthAnnual: 'לחודש (חיוב שנתי)',
    perMonthMonthly: 'לחודש (חיוב חודשי)',
    billingDetails: 'פרטי החיוב',
    fullName: 'שם מלא',
    email: 'אימייל',
    securePayment: 'תשלום בטוח',
    paymentInstructions: 'לחץ על הכפתור למטה כדי להשלים את התשלום באמצעות PayPal:',
    poweredByPayPal: 'Powered by PayPal',
    securityNote: 'כל התשלומים מעובדים באמצעות PayPal בצורה בטוחה ומוצפנת',
    cancelNote: 'ניתן לבטל את המנוי בכל עת ללא עמלות נוספות',
    processPayment: 'PayPal',
    payWithCard: 'Debit or Credit Card',
  },
};

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'monthly';
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';

  const isAnnual = plan === 'annual';
  const price = isAnnual ? 11.90 : 14.90;
  const planName = isAnnual ? t.annualPlan : t.monthlyPlan;
  const billingCycle = isAnnual ? t.perMonthAnnual : t.perMonthMonthly;

  const handlePayPalPayment = () => {
    // TODO: Integrate with PayPal API
    console.log('Processing PayPal payment for', plan);
    alert('PayPal integration will be connected later');
  };

  const handleCardPayment = () => {
    // TODO: Integrate with PayPal card payment
    console.log('Processing card payment for', plan);
    alert('Card payment integration will be connected later');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className={alignStart}>
        <Button
          variant="ghost"
          onClick={() => navigate('/pricing')}
          className={`mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
          {t.backToPricing}
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t.pageSubtitle}
        </p>
      </div>

      {/* Plan Summary */}
      <Card className="p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} mb-6`}>
          <Check size={20} className="text-red-500" />
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
            {t.planSummary}
          </h3>
        </div>

        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={alignStart}>
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              {planName}
            </div>
            {isAnnual && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t.savings20Percent}
              </div>
            )}
          </div>
          <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${price.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {billingCycle}
            </div>
          </div>
        </div>
      </Card>

      {/* Billing Details */}
      <Card className="p-6">
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${alignStart}`}>
          {t.billingDetails}
        </h3>
        <div className="space-y-3">
          <div>
            <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${alignStart}`}>
              {t.fullName}:{' '}
            </span>
            <span className="text-gray-900 dark:text-white">
              {state.user?.name || 'N/A'}
            </span>
          </div>
          <div>
            <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${alignStart}`}>
              {t.email}:{' '}
            </span>
            <span className="text-gray-900 dark:text-white">
              {state.user?.email || 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      {/* Secure Payment */}
      <Card className="p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} mb-6`}>
          <Lock size={20} className="text-red-500" />
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
            {t.securePayment}
          </h3>
        </div>

        <p className={`text-gray-600 dark:text-gray-400 mb-6 ${alignStart}`}>
          {t.paymentInstructions}
        </p>

        <div className="space-y-3 mb-4">
          <Button
            fullWidth
            variant="primary"
            onClick={handlePayPalPayment}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
            style={{ height: '48px' }}
          >
            <svg
              className="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.243zm14.146-14.42a13.035 13.035 0 0 1-.05-.437c-.292-1.867-.006-3.137 1.012-4.287C23.279.98 24.839.5 26.408.5h4.024c.524 0 .968.382 1.05.9l1.12 7.243h-4.946c-.524 0-.968.382-1.05.9l-1.12 7.243h-4.946c-.524 0-.968.382-1.05.9l-1.12 7.243H8.35l1.12-7.243c.082-.518.526-.9 1.05-.9h4.946l1.12-7.243c.082-.518.526-.9 1.05-.9h4.946z"/>
            </svg>
            {t.processPayment}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={handleCardPayment}
            className="bg-gray-800 hover:bg-gray-900 text-white"
            style={{ height: '48px' }}
          >
            <CreditCard size={20} className="mr-2" />
            {t.payWithCard}
          </Button>
        </div>

        <div className={`text-center text-xs text-gray-500 dark:text-gray-400 ${alignStart}`}>
          {t.poweredByPayPal}
        </div>
      </Card>

      {/* Footer Note */}
      <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-2'} text-sm text-gray-600 dark:text-gray-400`}>
        <Lock size={16} className="flex-shrink-0 mt-0.5" />
        <div className={alignStart}>
          <p>{t.securityNote}</p>
          <p className="mt-1">{t.cancelNote}</p>
        </div>
      </div>
    </div>
  );
}

