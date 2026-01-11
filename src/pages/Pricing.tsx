import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Locale } from '../types';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { Card } from '../components/common/Card';
import { CouponModal } from '../components/pricing/CouponModal';
import { Gift } from 'lucide-react';

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  annualPlan: string;
  monthlyPlan: string;
  save20Percent: string;
  perMonthAnnual: string;
  perMonthAnnualFull: string;
  perMonthMonthly: string;
  annualDescription: string;
  monthlyDescription: string;
  everythingInMonthly: string;
  savings20Percent: string;
  highPrioritySupport: string;
  // Monthly plan features
  freeTrialDays: string;
  advancedTimer: string;
  clientManagementSystem: string;
  projectTaskManagement: string;
  advancedClientValue: string;
  builtInCalendar: string;
  incomeManagement: string;
  chooseAnnualPlan: string;
  chooseMonthlyPlan: string;
  backToSettings: string;
  currentSubscription: string;
  activeSubscription: string;
  trialSubscription: string;
    cancelledSubscription: string;
    suspendedSubscription: string;
    expiredSubscription: string;
  duplicateTrialError: string;
  activeSubscriptionError: string;
  upgradeToAnnual: string;
  upgradeToAnnualMessage: string;
  upgradeToAnnualMessageTrial: string;
  trialCoupons: string;
}> = {
  en: {
    pageTitle: 'Choose the perfect plan for you',
    pageSubtitle: 'Choose the path that suits you and join sollo.',
    annualPlan: 'Annual Plan',
    monthlyPlan: 'Monthly Plan',
    save20Percent: 'Save 30%',
    perMonthAnnual: 'Per month (annual billing)',
    perMonthAnnualFull: 'Per month in annual billing (renewing annual charge of $118.80)',
    perMonthMonthly: 'Renewing monthly charge',
    annualDescription: 'The best value, maximum savings.',
    monthlyDescription: 'Ideal for starting, full flexibility.',
    everythingInMonthly: 'Everything in the monthly plan, and more:',
    savings20Percent: '30% savings',
    highPrioritySupport: 'High priority support',
    // Monthly plan features
    freeTrialDays: '5 days free trial',
    advancedTimer: 'Advanced timer for time tracking and management',
    clientManagementSystem: 'Client management system',
    projectTaskManagement: 'Project and task management',
    advancedClientValue: 'Advanced system for measuring client value',
    builtInCalendar: 'Built-in calendar for managing all tasks',
    incomeManagement: 'Income management',
    chooseAnnualPlan: 'Choose Annual Plan',
    chooseMonthlyPlan: 'Choose Monthly Plan',
    backToSettings: 'Back to Settings',
    currentSubscription: 'Current Subscription',
    activeSubscription: 'Active Subscription',
    trialSubscription: 'Trial Period',
    cancelledSubscription: 'Cancelled',
    suspendedSubscription: 'Suspended',
    expiredSubscription: 'Expired',
    duplicateTrialError: 'You already have an active monthly trial. Please cancel it first or wait for it to end.',
    activeSubscriptionError: 'You already have an active monthly subscription. Please cancel it first.',
    upgradeToAnnual: 'Upgrade to Annual',
    upgradeToAnnualMessage: 'Upgrading to annual will cancel your monthly subscription. You\'ll get better value with 30% savings!',
    upgradeToAnnualMessageTrial: 'Upgrading to annual will cancel your monthly trial. The annual plan includes a trial period and better value!',
    trialCoupons: 'Trial Coupons',
  },
  he: {
    pageTitle: 'בחר את התוכנית המושלמת עבורך',
    pageSubtitle: 'בחר את המסלול שמתאים לך והצטרף ל-sollo.',
    annualPlan: 'תכנית שנתית',
    monthlyPlan: 'תכנית חודשית',
    save20Percent: 'חסוך 30%',
    perMonthAnnual: 'לחודש בחיוב שנתי',
    perMonthAnnualFull: 'לחודש בחיוב שנתי (חיוב שנתי מתחדש של $118.80)',
    perMonthMonthly: 'חיוב חודשי מתחדש',
    annualDescription: 'התמורה הטובה ביותר, חיסכון מקסימלי.',
    monthlyDescription: 'אידיאלי להתחלה, גמישות מלאה.',
    everythingInMonthly: 'כל מה שבתכנית החודשית ועוד:',
    savings20Percent: 'חיסכון של 30%',
    highPrioritySupport: 'תמיכה בעדיפות גבוהה',
    // Monthly plan features
    freeTrialDays: '5 ימי התנסות חינם',
    advancedTimer: 'טיימר מתקדם למעקב וניהול זמן',
    clientManagementSystem: 'מערכת ניהול לקוחות',
    projectTaskManagement: 'ניהול פרויקטים ומשימות',
    advancedClientValue: 'מערכת מתקדמת למדידת שווי לקוח',
    builtInCalendar: 'לוח שנה מובנה לניהול כל המשימות',
    incomeManagement: 'ניהול הכנסות',
    chooseAnnualPlan: 'בחר תוכנית שנתית',
    chooseMonthlyPlan: 'בחר תוכנית חודשית',
    backToSettings: 'חזרה להגדרות',
    currentSubscription: 'מנוי נוכחי',
    activeSubscription: 'מנוי פעיל',
    trialSubscription: 'תקופת ניסיון',
    cancelledSubscription: 'בוטל',
    suspendedSubscription: 'מושעה',
    expiredSubscription: 'פג תוקף',
    duplicateTrialError: 'יש לך כבר תקופת ניסיון חודשית פעילה. אנא בטל אותה תחילה או המתן עד שתסתיים.',
    activeSubscriptionError: 'יש לך כבר מנוי חודשי פעיל. אנא בטל אותו תחילה.',
    upgradeToAnnual: 'שדרג לשנתי',
    upgradeToAnnualMessage: 'שדרוג לתוכנית שנתית יבטל את המנוי החודשי שלך. תקבל ערך טוב יותר עם חיסכון של 30%!',
    upgradeToAnnualMessageTrial: 'שדרוג לתוכנית שנתית יבטל את תקופת הניסיון החודשית שלך. התוכנית השנתית כוללת תקופת ניסיון וערך טוב יותר!',
    trialCoupons: 'קופוני ניסיון',
  },
};

interface SubscriptionData {
  subscription: {
    id: string;
    planType: string;
    status: string;
    paypalSubscriptionId: string | null;
    billingHistory?: Array<{ id: string }>;
  } | null;
}

export default function Pricing() {
  const navigate = useNavigate();
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Actual prices: Monthly $12.90, Annual $9.90/month ($118.80/year)
  const monthlyPrice = 12.90;
  const annualMonthlyPrice = 9.90;
  const annualYearlyPrice = 118.80;

  useEffect(() => {
    loadSubscriptionStatus();
  }, [state.user?.id]);

  const loadSubscriptionStatus = async () => {
    if (!state.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.subscriptions.getStatus(state.user.id);
      setSubscriptionData(data);
    } catch (error: any) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePlan = async (plan: 'annual' | 'monthly') => {
    if (!state.user?.id) {
      toast.error(locale === 'he' ? 'נדרש להתחבר' : 'Please log in');
      return;
    }

    // Check for duplicate trial prevention
    if (plan === 'monthly' && subscriptionData?.subscription) {
      const subscription = subscriptionData.subscription;
      const hasMonthlySubscription = subscription.planType === 'monthly';
      
      if (hasMonthlySubscription) {
        const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
        
        if (!hasPayments && (subscription.status === 'active' || subscription.status === 'trialing')) {
          // User already has an active monthly trial
          toast.error(t.duplicateTrialError);
          return;
        }
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          // User already has an active monthly subscription
          toast.error(t.activeSubscriptionError);
          return;
        }
      }
    }

    // Show upgrade confirmation for annual plan if user has monthly subscription
    if (plan === 'annual' && subscriptionData?.subscription) {
      const subscription = subscriptionData.subscription;
      const hasMonthlySubscription = subscription.planType === 'monthly';
      const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
      const isTrial = !hasPayments && (subscription.status === 'active' || subscription.status === 'trialing');
      
      if (hasMonthlySubscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
        const confirmMessage = isTrial ? t.upgradeToAnnualMessageTrial : t.upgradeToAnnualMessage;
        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) {
          return;
        }
      }
    }

    navigate(`/payment?plan=${plan}`);
  };

  const getSubscriptionStatusBadge = () => {
    if (!subscriptionData?.subscription) return null;
    
    const subscription = subscriptionData.subscription;
    const status = subscription.status;
    
    if (status === 'active' || status === 'trialing') {
      const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
      const badgeText = hasPayments ? t.activeSubscription : t.trialSubscription;
      const badgeVariant = hasPayments ? 'success' : 'warning';
      return (
        <Badge variant={badgeVariant} className="mb-4">
          {badgeText}
        </Badge>
      );
    }
    
    if (status === 'cancelled') {
      return (
        <Badge variant="error" className="mb-4">
          {t.cancelledSubscription}
        </Badge>
      );
    }
    
    if (status === 'suspended') {
      return (
        <Badge variant="warning" className="mb-4">
          {t.suspendedSubscription}
        </Badge>
      );
    }
    
    if (status === 'expired') {
      return (
        <Badge variant="error" className="mb-4">
          {t.expiredSubscription}
        </Badge>
      );
    }
    
    return null;
  };

  const canSelectMonthlyPlan = () => {
    if (!subscriptionData?.subscription) return true;
    const subscription = subscriptionData.subscription;
    const hasMonthlySubscription = subscription.planType === 'monthly';
    const hasAnnualSubscription = subscription.planType === 'annual';
    
    // Block if user has active annual subscription (they're already on a better plan)
    if (hasAnnualSubscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      return false;
    }
    
    if (hasMonthlySubscription) {
      const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
      // Block if user has active monthly trial or active subscription
      if (!hasPayments && (subscription.status === 'active' || subscription.status === 'trialing')) {
        return false;
      }
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        return false;
      }
    }
    
    return true;
  };

  const getMonthlyPlanButtonText = () => {
    if (!subscriptionData?.subscription) return t.chooseMonthlyPlan;
    const subscription = subscriptionData.subscription;
    const hasAnnualSubscription = subscription.planType === 'annual';
    const hasMonthlySubscription = subscription.planType === 'monthly';
    
    // If user has active annual, don't show "Active Subscription" text
    if (hasAnnualSubscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      return locale === 'he' ? 'תוכנית שנתית פעילה' : 'Annual Plan Active';
    }
    
    // If user has active monthly, show active subscription text
    if (hasMonthlySubscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      return locale === 'he' ? 'מנוי פעיל' : 'Active Subscription';
    }
    
    return t.chooseMonthlyPlan;
  };

  const canSelectAnnualPlan = () => {
    if (!subscriptionData?.subscription) return true;
    const subscription = subscriptionData.subscription;
    const hasAnnualSubscription = subscription.planType === 'annual';
    
    // Block if user has active annual subscription
    if (hasAnnualSubscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      return false;
    }
    
    // Allow annual plan if user has monthly subscription (for upgrade)
    // This is already handled by the upgrade confirmation dialog
    
    return true;
  };

  /**
   * Check if coupon button should be visible
   * Visible for: new users, users without active subscriptions, churned users
   */
  const shouldShowCouponButton = () => {
    if (!subscriptionData?.subscription) {
      return true; // New user, no subscription
    }

    const subscription = subscriptionData.subscription;
    const status = subscription.status;
    const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
    
    // Hide if user has active paid subscription
    if (status === 'active' && hasPayments && subscription.paypalSubscriptionId) {
      return false;
    }
    
    // Hide if user has active PayPal trial
    if (status === 'trialing' && subscription.paypalSubscriptionId) {
      return false;
    }
    
    // Show for: expired, cancelled, suspended, or no subscription
    return true;
  };

  const handleCouponSuccess = () => {
    // Reload subscription status after successful coupon activation
    loadSubscriptionStatus();
  };

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

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
          {subscriptionData?.subscription && (
            <div className="mt-4 flex justify-center">
              {getSubscriptionStatusBadge()}
            </div>
          )}
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
              <li className="text-gray-700 dark:text-gray-300">• {t.freeTrialDays}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.advancedTimer}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.clientManagementSystem}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.projectTaskManagement}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.advancedClientValue}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.builtInCalendar}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.incomeManagement}</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => handleChoosePlan('monthly')}
              disabled={!canSelectMonthlyPlan()}
              className={`mt-auto w-full sm:w-1/2 sm:mx-auto ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {getMonthlyPlanButtonText()}
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
            <div className={`text-sm text-gray-500 dark:text-gray-400 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.perMonthAnnualFull}
            </div>
            <p className={`text-gray-600 dark:text-gray-300 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.annualDescription}
            </p>
            <ul className={`space-y-2 mb-6 flex-grow ${isRTL ? 'text-right' : 'text-left'}`}>
              <li className="text-gray-700 dark:text-gray-300 font-semibold">• {t.everythingInMonthly}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.savings20Percent}</li>
              <li className="text-gray-700 dark:text-gray-300">• {t.highPrioritySupport}</li>
            </ul>
            <Button
              variant="primary"
              onClick={() => handleChoosePlan('annual')}
              disabled={!canSelectAnnualPlan()}
              className={`mt-auto w-full sm:w-1/2 sm:mx-auto ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {canSelectAnnualPlan() ? t.chooseAnnualPlan : (locale === 'he' ? 'מנוי פעיל' : 'Active Subscription')}
            </Button>
          </div>
        </div>

        {/* Coupon Button - Small button at the bottom */}
        {shouldShowCouponButton() && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCouponModal(true)}
              className={`${isRTL ? 'flex-row-reverse' : ''}`}
              icon={<Gift size={16} />}
            >
              {t.trialCoupons}
            </Button>
          </div>
        )}
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSuccess={handleCouponSuccess}
      />
    </div>
  );
}

