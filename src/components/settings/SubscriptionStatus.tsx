import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Zap, Crown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Locale } from '../../types';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  initSocket,
  onSubscriptionStatusUpdated,
  onSubscriptionCancelled,
  onSubscriptionRenewed,
} from '../../utils/socket';

const translations: Record<Locale, {
  subscriptionStatus: string;
  trialPeriod: string;
  activeSubscription: string;
  monthlySubscription: string;
  annualSubscription: string;
  cancelledSubscription: string;
  expiredSubscription: string;
  freeAccess: string;
  trialDescription: string;
  activeDescription: string;
  cancelledDescription: string;
  expiredDescription: string;
  freeAccessDescription: string;
  timeRemaining: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  manageSubscription: string;
  upgradePlan: string;
  loading: string;
  error: string;
}> = {
  en: {
    subscriptionStatus: 'Subscription Status',
    trialPeriod: 'Trial Period',
    activeSubscription: 'Active Subscription',
    monthlySubscription: 'Monthly Subscription',
    annualSubscription: 'Annual Subscription',
    cancelledSubscription: 'Cancelled Subscription',
    expiredSubscription: 'Expired Subscription',
    freeAccess: 'Free Access',
    trialDescription: 'Enjoy all features. Upgrade to continue after the period ends.',
    activeDescription: 'Thank you for being part of the sollo family. Your subscription is active.',
    cancelledDescription: 'Your subscription has been cancelled. You can resubscribe anytime.',
    expiredDescription: 'Your subscription has expired. Please upgrade to continue.',
    freeAccessDescription: 'You have free access until the expiration date.',
    timeRemaining: 'Time remaining until renewal/end:',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    manageSubscription: 'Manage Subscription and Plans',
    upgradePlan: 'Upgrade Plan',
    loading: 'Loading subscription status...',
    error: 'Failed to load subscription status',
  },
  he: {
    subscriptionStatus: 'סטטוס מנוי',
    trialPeriod: 'תקופת ניסיון',
    activeSubscription: 'מנוי פעיל',
    monthlySubscription: 'מנוי חודשי מתחדש',
    annualSubscription: 'מנוי שנתי מתחדש',
    cancelledSubscription: 'מנוי בוטל',
    expiredSubscription: 'מנוי פג תוקף',
    freeAccess: 'גישה חינמית',
    trialDescription: 'תהנה מכל התכונות. שדרג כדי להמשיך לאחר תום התקופה.',
    activeDescription: 'תודה שאתה חלק ממשפחת sollo. המנוי שלך פעיל.',
    cancelledDescription: 'המנוי שלך בוטל. תוכל להירשם מחדש בכל עת.',
    expiredDescription: 'המנוי שלך פג תוקף. אנא שדרג כדי להמשיך.',
    freeAccessDescription: 'יש לך גישה חינמית עד תאריך התפוגה.',
    timeRemaining: 'זמן נותר עד לחידוש/סיום:',
    days: 'ימים',
    hours: 'שעות',
    minutes: 'דקות',
    seconds: 'שניות',
    manageSubscription: 'נהל מנוי ותוכניות',
    upgradePlan: 'שדרג תוכנית',
    loading: 'טוען סטטוס מנוי...',
    error: 'שגיאה בטעינת סטטוס מנוי',
  },
};

interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface SubscriptionData {
  subscription: {
    id: string;
    planType: string;
    status: string;
    startDate: string;
    endDate: string | null;
    trialEndDate: string | null;
    price: number;
    currency: string;
    couponCode: string | null;
    isFreeAccess: boolean;
    isTrialCoupon: boolean;
  } | null;
  access: {
    hasFullAccess: boolean;
    canAccessSettings: boolean;
    canAccessPricing: boolean;
    expirationDate: string | null;
    status: 'active' | 'trial' | 'expired' | 'none';
  };
  userStatus: string;
}

export function SubscriptionStatus() {
  const navigate = useNavigate();
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<CountdownTimer>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    loadSubscriptionStatus();
  }, [state.user?.id]);

  // WebSocket listeners for real-time subscription updates
  useEffect(() => {
    if (!state.user?.id) return;

    // Initialize WebSocket connection
    const socket = initSocket(state.user.id);
    if (!socket) {
      console.warn('⚠️  WebSocket not available, using fallback');
      return;
    }

    // Set up event listeners
    const unsubscribeStatusUpdated = onSubscriptionStatusUpdated((data) => {
      console.log('📡 Subscription status updated via WebSocket:', data);
      // Reload subscription status
      loadSubscriptionStatus();
      toast.success(
        locale === 'he'
          ? 'סטטוס המנוי עודכן'
          : 'Subscription status updated'
      );
    });

    const unsubscribeCancelled = onSubscriptionCancelled((data) => {
      console.log('📡 Subscription cancelled via WebSocket:', data);
      // Reload subscription status
      loadSubscriptionStatus();
      toast.info(
        locale === 'he'
          ? 'המנוי בוטל'
          : 'Subscription cancelled'
      );
    });

    const unsubscribeRenewed = onSubscriptionRenewed((data) => {
      console.log('📡 Subscription renewed via WebSocket:', data);
      // Reload subscription status
      loadSubscriptionStatus();
      toast.success(
        locale === 'he'
          ? `המנוי חודש בהצלחה. התשלום הבא: ${new Date(data.nextBillingDate).toLocaleDateString()}`
          : `Subscription renewed successfully. Next billing: ${new Date(data.nextBillingDate).toLocaleDateString()}`
      );
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStatusUpdated();
      unsubscribeCancelled();
      unsubscribeRenewed();
      // Don't disconnect socket here - let it stay connected for other components
    };
  }, [state.user?.id, locale]);

  useEffect(() => {
    if (!subscriptionData?.subscription) return;

    const endDate = subscriptionData.subscription.endDate || subscriptionData.subscription.trialEndDate;
    if (!endDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [subscriptionData]);

  const loadSubscriptionStatus = async () => {
    if (!state.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.subscriptions.getStatus(state.user.id);
      setSubscriptionData(data);
    } catch (error: any) {
      console.error('Error loading subscription status:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdownValue = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const getPlanDetails = () => {
    if (!subscriptionData?.subscription) {
      return {
        title: t.trialPeriod,
        icon: <Star size={20} className="text-yellow-500" />,
        badgeVariant: 'warning' as const,
        description: t.trialDescription,
        showCountdown: false,
      };
    }

    const subscription = subscriptionData.subscription;
    const status = subscription.status;
    const planType = subscription.planType;

    if (subscription.isFreeAccess && planType === 'free') {
      const isExpired = subscription.endDate ? new Date() > new Date(subscription.endDate) : false;
      return {
        title: t.freeAccess,
        icon: <Zap size={20} className="text-blue-500" />,
        badgeVariant: (isExpired ? 'error' : 'success') as const,
        description: t.freeAccessDescription,
        showCountdown: !isExpired && !!subscription.endDate,
      };
    }

    if (subscription.isTrialCoupon && planType === 'trial') {
      const isExpired = subscription.endDate ? new Date() > new Date(subscription.endDate) : false;
      return {
        title: t.trialPeriod,
        icon: <Star size={20} className="text-yellow-500" />,
        badgeVariant: (isExpired ? 'error' : 'warning') as const,
        description: t.trialDescription,
        showCountdown: !isExpired && !!subscription.endDate,
      };
    }

    if (status === 'active' && subscription.paypalSubscriptionId) {
      if (planType === 'monthly') {
        return {
          title: t.monthlySubscription,
          icon: <Zap size={20} className="text-blue-500" />,
          badgeVariant: 'success' as const,
          description: t.activeDescription,
          showCountdown: false,
        };
      } else if (planType === 'annual') {
        return {
          title: t.annualSubscription,
          icon: <Crown size={20} className="text-purple-500" />,
          badgeVariant: 'success' as const,
          description: t.activeDescription,
          showCountdown: false,
        };
      }
    }

    if (status === 'cancelled') {
      return {
        title: t.cancelledSubscription,
        icon: <Zap size={20} className="text-gray-500" />,
        badgeVariant: 'error' as const,
        description: t.cancelledDescription,
        showCountdown: false,
      };
    }

    if (status === 'expired') {
      return {
        title: t.expiredSubscription,
        icon: <Zap size={20} className="text-gray-500" />,
        badgeVariant: 'error' as const,
        description: t.expiredDescription,
        showCountdown: false,
      };
    }

    return {
      title: t.trialPeriod,
      icon: <Star size={20} className="text-yellow-500" />,
      badgeVariant: 'warning' as const,
      description: t.trialDescription,
      showCountdown: false,
    };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className={`text-center ${alignStart}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.loading}</p>
        </div>
      </Card>
    );
  }

  const planDetails = getPlanDetails();
  const showCountdown = planDetails.showCountdown && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-shrink-0">{planDetails.icon}</div>
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
          {t.subscriptionStatus}
        </h3>
      </div>

      <div className="mb-4">
        <Badge variant={planDetails.badgeVariant} className="text-base px-4 py-1">
          {planDetails.title}
        </Badge>
      </div>

      <p className={`text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
        {planDetails.description}
      </p>

      {showCountdown && (
        <>
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
        </>
      )}

      <div className="flex justify-center">
        <Button
          variant="primary"
          onClick={() => navigate('/pricing')}
          className={`w-1/2 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
        {subscriptionData?.subscription?.status === 'active' ? (
          <>
            {isRTL ? <ArrowLeft size={16} /> : null}
            {t.manageSubscription}
            {!isRTL ? <ArrowRight size={16} /> : null}
          </>
        ) : (
          <>
            {isRTL ? <ArrowLeft size={16} /> : null}
            {t.upgradePlan}
            {!isRTL ? <ArrowRight size={16} /> : null}
          </>
        )}
        </Button>
      </div>
    </Card>
  );
}

