import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Zap, Crown, ArrowLeft, ArrowRight, X, Loader2 } from 'lucide-react';
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
  couponPeriod: string;
  trialDays: string;
  activeSubscription: string;
  monthlySubscription: string;
  annualSubscription: string;
  cancelledSubscription: string;
  suspendedSubscription: string;
  expiredSubscription: string;
  freeAccess: string;
  noSubscription: string;
  trialDescription: string;
  couponPeriodDescription: string;
  trialActiveDescription: string;
  noSubscriptionDescription: string;
  activeDescription: string;
  cancelledDescription: string;
  suspendedDescription: string;
  expiredDescription: string;
  freeAccessDescription: string;
  timeRemaining: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  manageSubscription: string;
  upgradePlan: string;
  upgradeNow: string;
  loading: string;
  error: string;
  cancelSubscription: string;
  cancelTrial: string;
  cancelConfirmTitle: string;
  cancelConfirmMessage: string;
  cancelConfirmMessageTrial: string;
  cancelConfirm: string;
  cancelCancel: string;
  cancelling: string;
  cancelledSuccess: string;
  cancelError: string;
  upgradeToMonthly: string;
  upgradeToAnnual: string;
  upgradeFromMonthlyToAnnual: string;
  upgradeFromTrialToMonthly: string;
  upgradeFromTrialToAnnual: string;
  upgradeConfirmTitle: string;
  upgradeConfirmMessage: string;
  upgradeConfirmMessageTrial: string;
  upgradeConfirm: string;
  upgradeCancel: string;
  currentPlan: string;
  planStatus: string;
}> = {
  en: {
    subscriptionStatus: 'Subscription Status',
    trialPeriod: 'Trial Period',
    couponPeriod: 'Coupon period',
    trialDays: 'Trial Days',
    activeSubscription: 'Active Subscription',
    monthlySubscription: 'Monthly Subscription',
    annualSubscription: 'Annual Subscription',
    cancelledSubscription: 'Cancelled Subscription',
    suspendedSubscription: 'Suspended Subscription',
    expiredSubscription: 'Expired Subscription',
    freeAccess: 'Free Access',
    noSubscription: 'No Subscription',
    trialDescription: 'Enjoy all features. Upgrade to continue after the period ends.',
    couponPeriodDescription: 'Enjoy full access with your coupon until it expires. Upgrade to a paid plan when you are ready.',
    trialActiveDescription: 'You\'re in your trial period. Your subscription will activate automatically when the trial ends. You can cancel anytime before then.',
    noSubscriptionDescription: 'You don\'t have an active subscription. Choose a plan to get started.',
    activeDescription: 'Thank you for being part of the sollo family. Your subscription is active.',
    cancelledDescription: 'Your subscription has been cancelled. You can resubscribe anytime.',
    suspendedDescription: 'Your subscription has been suspended. Please contact support for assistance.',
    expiredDescription: 'Your subscription has expired. Please upgrade to continue.',
    freeAccessDescription: 'You have free access until the expiration date.',
    timeRemaining: 'Time remaining until renewal/end:',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    manageSubscription: 'Pricing and Plans',
    upgradePlan: 'Upgrade Plan',
    upgradeNow: 'Upgrade Now',
    loading: 'Loading subscription status...',
    error: 'Failed to load subscription status',
    cancelSubscription: 'Cancel Subscription',
    cancelTrial: 'Cancel Trial',
    cancelConfirmTitle: 'Cancel Subscription',
    cancelConfirmMessage: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
    cancelConfirmMessageTrial: 'Are you sure you want to cancel your trial? Your access will end immediately and you will not be charged.',
    cancelConfirm: 'Yes, Cancel',
    cancelCancel: 'No, Keep Subscription',
    cancelling: 'Cancelling...',
    cancelledSuccess: 'Subscription cancelled successfully',
    cancelError: 'Failed to cancel subscription',
    upgradeToMonthly: 'Upgrade to Monthly Plan',
    upgradeToAnnual: 'Upgrade to Annual Plan',
    upgradeFromMonthlyToAnnual: 'Upgrade to Annual Plan',
    upgradeFromTrialToMonthly: 'Upgrade to Monthly Plan',
    upgradeFromTrialToAnnual: 'Upgrade to Annual Plan',
    upgradeConfirmTitle: 'Upgrade Subscription',
    upgradeConfirmMessage: 'Upgrading to annual will cancel your monthly subscription. You\'ll get better value with 30% savings!',
    upgradeConfirmMessageTrial: 'Upgrading will convert your trial to a paid subscription. The plan includes a trial period and better value!',
    upgradeConfirm: 'Yes, Upgrade',
    upgradeCancel: 'Cancel',
    currentPlan: 'Current Plan',
    planStatus: 'Status',
  },
  he: {
    subscriptionStatus: 'סטטוס מנוי',
    trialPeriod: 'תקופת ניסיון',
    couponPeriod: 'תקופת קופון',
    trialDays: 'ימי ניסיון',
    activeSubscription: 'מנוי פעיל',
    monthlySubscription: 'מנוי חודשי מתחדש',
    annualSubscription: 'מנוי שנתי מתחדש',
    cancelledSubscription: 'מנוי בוטל',
    suspendedSubscription: 'מנוי מושעה',
    expiredSubscription: 'מנוי פג תוקף',
    freeAccess: 'גישה חינם',
    noSubscription: 'אין מנוי',
    trialDescription: 'תהנה מכל התכונות. שדרג כדי להמשיך לאחר תום התקופה.',
    couponPeriodDescription:
      'תהנה מגישה מלאה עם הקופון שלך עד לתאריך התפוגה. שדרג לתוכנית בתשלום כשנוח לך.',
    trialActiveDescription: 'אתה בתקופת ניסיון. המנוי יופעל אוטומטית בתום ימי הניסיון. ניתן לבטל בכל עת לפני כן.',
    noSubscriptionDescription: 'אין לך מנוי פעיל. בחר תוכנית כדי להתחיל.',
    activeDescription: 'תודה שאתה חלק ממשפחת sollo. המנוי שלך פעיל.',
    cancelledDescription: 'המנוי שלך בוטל. תוכל להירשם מחדש בכל עת.',
    suspendedDescription: 'המנוי שלך הושעה. אנא פנה לתמיכה לקבלת עזרה.',
    expiredDescription: 'המנוי שלך פג תוקף. אנא שדרג כדי להמשיך.',
    freeAccessDescription: 'יש לך גישה חינם עד תאריך התפוגה.',
    timeRemaining: 'זמן נותר עד לחידוש/סיום:',
    days: 'ימים',
    hours: 'שעות',
    minutes: 'דקות',
    seconds: 'שניות',
    manageSubscription: 'תמחור ותוכניות',
    upgradePlan: 'שדרג תוכנית',
    upgradeNow: 'שדרג עכשיו',
    loading: 'טוען סטטוס מנוי...',
    error: 'שגיאה בטעינת סטטוס מנוי',
    cancelSubscription: 'בטל מנוי',
    cancelTrial: 'בטל תקופת ניסיון',
    cancelConfirmTitle: 'ביטול מנוי',
    cancelConfirmMessage: 'האם אתה בטוח שברצונך לבטל את המנוי? תוכל להמשיך להשתמש בשירות עד סוף תקופת החיוב הנוכחית.',
    cancelConfirmMessageTrial: 'האם אתה בטוח שברצונך לבטל את תקופת הניסיון? הגישה שלך תיפסק מיד ולא תחויב.',
    cancelConfirm: 'כן, בטל',
    cancelCancel: 'לא, שמור מנוי',
    cancelling: 'מבטל...',
    cancelledSuccess: 'המנוי בוטל בהצלחה',
    cancelError: 'שגיאה בביטול המנוי',
    upgradeToMonthly: 'שדרג לתוכנית חודשית',
    upgradeToAnnual: 'שדרג לתוכנית שנתית',
    upgradeFromMonthlyToAnnual: 'שדרג לתוכנית שנתית',
    upgradeFromTrialToMonthly: 'שדרג לתוכנית חודשית',
    upgradeFromTrialToAnnual: 'שדרג לתוכנית שנתית',
    upgradeConfirmTitle: 'שדרוג מנוי',
    upgradeConfirmMessage: 'שדרוג לתוכנית שנתית יבטל את המנוי החודשי שלך. תקבל ערך טוב יותר עם חיסכון של 30%!',
    upgradeConfirmMessageTrial: 'שדרוג יהמיר את תקופת הניסיון שלך למנוי בתשלום. התוכנית כוללת תקופת ניסיון וערך טוב יותר!',
    upgradeConfirm: 'כן, שדרג',
    upgradeCancel: 'ביטול',
    currentPlan: 'תוכנית נוכחית',
    planStatus: 'סטטוס',
  },
  es: {
    subscriptionStatus: 'Subscription Status',
    trialPeriod: 'Trial Period',
    couponPeriod: 'Coupon period',
    trialDays: 'Trial Days',
    activeSubscription: 'Active Subscription',
    monthlySubscription: 'Monthly Subscription',
    annualSubscription: 'Annual Subscription',
    cancelledSubscription: 'Cancelled Subscription',
    suspendedSubscription: 'Suspended Subscription',
    expiredSubscription: 'Expired Subscription',
    freeAccess: 'Free Access',
    noSubscription: 'No Subscription',
    trialDescription: 'Enjoy all features. Upgrade to continue after the period ends.',
    couponPeriodDescription: 'Enjoy full access with your coupon until it expires. Upgrade to a paid plan when you are ready.',
    trialActiveDescription: 'You\'re in your trial period. Your subscription will activate automatically when the trial ends. You can cancel anytime before then.',
    noSubscriptionDescription: 'You don\'t have an active subscription. Choose a plan to get started.',
    activeDescription: 'Thank you for being part of the sollo family. Your subscription is active.',
    cancelledDescription: 'Your subscription has been cancelled. You can resubscribe anytime.',
    suspendedDescription: 'Your subscription has been suspended. Please contact support for assistance.',
    expiredDescription: 'Your subscription has expired. Please upgrade to continue.',
    freeAccessDescription: 'You have free access until the expiration date.',
    timeRemaining: 'Time remaining until renewal/end:',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    manageSubscription: 'Pricing and Plans',
    upgradePlan: 'Upgrade Plan',
    upgradeNow: 'Upgrade Now',
    loading: 'Loading subscription status...',
    error: 'Failed to load subscription status',
    cancelSubscription: 'Cancel Subscription',
    cancelTrial: 'Cancel Trial',
    cancelConfirmTitle: 'Cancel Subscription',
    cancelConfirmMessage: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
    cancelConfirmMessageTrial: 'Are you sure you want to cancel your trial? Your access will end immediately and you will not be charged.',
    cancelConfirm: 'Yes, Cancel',
    cancelCancel: 'No, Keep Subscription',
    cancelling: 'Cancelling...',
    cancelledSuccess: 'Subscription cancelled successfully',
    cancelError: 'Failed to cancel subscription',
    upgradeToMonthly: 'Upgrade to Monthly Plan',
    upgradeToAnnual: 'Upgrade to Annual Plan',
    upgradeFromMonthlyToAnnual: 'Upgrade to Annual Plan',
    upgradeFromTrialToMonthly: 'Upgrade to Monthly Plan',
    upgradeFromTrialToAnnual: 'Upgrade to Annual Plan',
    upgradeConfirmTitle: 'Upgrade Subscription',
    upgradeConfirmMessage: 'Upgrading to annual will cancel your monthly subscription. You\'ll get better value with 30% savings!',
    upgradeConfirmMessageTrial: 'Upgrading will convert your trial to a paid subscription. The plan includes a trial period and better value!',
    upgradeConfirm: 'Yes, Upgrade',
    upgradeCancel: 'Cancel',
    currentPlan: 'Current Plan',
    planStatus: 'Status',
  },
  de: {
    subscriptionStatus: 'Subscription Status',
    trialPeriod: 'Trial Period',
    couponPeriod: 'Coupon period',
    trialDays: 'Trial Days',
    activeSubscription: 'Active Subscription',
    monthlySubscription: 'Monthly Subscription',
    annualSubscription: 'Annual Subscription',
    cancelledSubscription: 'Cancelled Subscription',
    suspendedSubscription: 'Suspended Subscription',
    expiredSubscription: 'Expired Subscription',
    freeAccess: 'Free Access',
    noSubscription: 'No Subscription',
    trialDescription: 'Enjoy all features. Upgrade to continue after the period ends.',
    couponPeriodDescription: 'Enjoy full access with your coupon until it expires. Upgrade to a paid plan when you are ready.',
    trialActiveDescription: 'You\'re in your trial period. Your subscription will activate automatically when the trial ends. You can cancel anytime before then.',
    noSubscriptionDescription: 'You don\'t have an active subscription. Choose a plan to get started.',
    activeDescription: 'Thank you for being part of the sollo family. Your subscription is active.',
    cancelledDescription: 'Your subscription has been cancelled. You can resubscribe anytime.',
    suspendedDescription: 'Your subscription has been suspended. Please contact support for assistance.',
    expiredDescription: 'Your subscription has expired. Please upgrade to continue.',
    freeAccessDescription: 'You have free access until the expiration date.',
    timeRemaining: 'Time remaining until renewal/end:',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    manageSubscription: 'Pricing and Plans',
    upgradePlan: 'Upgrade Plan',
    upgradeNow: 'Upgrade Now',
    loading: 'Loading subscription status...',
    error: 'Failed to load subscription status',
    cancelSubscription: 'Cancel Subscription',
    cancelTrial: 'Cancel Trial',
    cancelConfirmTitle: 'Cancel Subscription',
    cancelConfirmMessage: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
    cancelConfirmMessageTrial: 'Are you sure you want to cancel your trial? Your access will end immediately and you will not be charged.',
    cancelConfirm: 'Yes, Cancel',
    cancelCancel: 'No, Keep Subscription',
    cancelling: 'Cancelling...',
    cancelledSuccess: 'Subscription cancelled successfully',
    cancelError: 'Failed to cancel subscription',
    upgradeToMonthly: 'Upgrade to Monthly Plan',
    upgradeToAnnual: 'Upgrade to Annual Plan',
    upgradeFromMonthlyToAnnual: 'Upgrade to Annual Plan',
    upgradeFromTrialToMonthly: 'Upgrade to Monthly Plan',
    upgradeFromTrialToAnnual: 'Upgrade to Annual Plan',
    upgradeConfirmTitle: 'Upgrade Subscription',
    upgradeConfirmMessage: 'Upgrading to annual will cancel your monthly subscription. You\'ll get better value with 30% savings!',
    upgradeConfirmMessageTrial: 'Upgrading will convert your trial to a paid subscription. The plan includes a trial period and better value!',
    upgradeConfirm: 'Yes, Upgrade',
    upgradeCancel: 'Cancel',
    currentPlan: 'Current Plan',
    planStatus: 'Status',
  },
  pt: {
    subscriptionStatus: 'Subscription Status',
    trialPeriod: 'Trial Period',
    couponPeriod: 'Coupon period',
    trialDays: 'Trial Days',
    activeSubscription: 'Active Subscription',
    monthlySubscription: 'Monthly Subscription',
    annualSubscription: 'Annual Subscription',
    cancelledSubscription: 'Cancelled Subscription',
    suspendedSubscription: 'Suspended Subscription',
    expiredSubscription: 'Expired Subscription',
    freeAccess: 'Free Access',
    noSubscription: 'No Subscription',
    trialDescription: 'Enjoy all features. Upgrade to continue after the period ends.',
    couponPeriodDescription: 'Enjoy full access with your coupon until it expires. Upgrade to a paid plan when you are ready.',
    trialActiveDescription: 'You\'re in your trial period. Your subscription will activate automatically when the trial ends. You can cancel anytime before then.',
    noSubscriptionDescription: 'You don\'t have an active subscription. Choose a plan to get started.',
    activeDescription: 'Thank you for being part of the sollo family. Your subscription is active.',
    cancelledDescription: 'Your subscription has been cancelled. You can resubscribe anytime.',
    suspendedDescription: 'Your subscription has been suspended. Please contact support for assistance.',
    expiredDescription: 'Your subscription has expired. Please upgrade to continue.',
    freeAccessDescription: 'You have free access until the expiration date.',
    timeRemaining: 'Time remaining until renewal/end:',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    manageSubscription: 'Pricing and Plans',
    upgradePlan: 'Upgrade Plan',
    upgradeNow: 'Upgrade Now',
    loading: 'Loading subscription status...',
    error: 'Failed to load subscription status',
    cancelSubscription: 'Cancel Subscription',
    cancelTrial: 'Cancel Trial',
    cancelConfirmTitle: 'Cancel Subscription',
    cancelConfirmMessage: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
    cancelConfirmMessageTrial: 'Are you sure you want to cancel your trial? Your access will end immediately and you will not be charged.',
    cancelConfirm: 'Yes, Cancel',
    cancelCancel: 'No, Keep Subscription',
    cancelling: 'Cancelling...',
    cancelledSuccess: 'Subscription cancelled successfully',
    cancelError: 'Failed to cancel subscription',
    upgradeToMonthly: 'Upgrade to Monthly Plan',
    upgradeToAnnual: 'Upgrade to Annual Plan',
    upgradeFromMonthlyToAnnual: 'Upgrade to Annual Plan',
    upgradeFromTrialToMonthly: 'Upgrade to Monthly Plan',
    upgradeFromTrialToAnnual: 'Upgrade to Annual Plan',
    upgradeConfirmTitle: 'Upgrade Subscription',
    upgradeConfirmMessage: 'Upgrading to annual will cancel your monthly subscription. You\'ll get better value with 30% savings!',
    upgradeConfirmMessageTrial: 'Upgrading will convert your trial to a paid subscription. The plan includes a trial period and better value!',
    upgradeConfirm: 'Yes, Upgrade',
    upgradeCancel: 'Cancel',
    currentPlan: 'Current Plan',
    planStatus: 'Status',
  },
  fr: {
    subscriptionStatus: 'Subscription Status',
    trialPeriod: 'Trial Period',
    couponPeriod: 'Coupon period',
    trialDays: 'Trial Days',
    activeSubscription: 'Active Subscription',
    monthlySubscription: 'Monthly Subscription',
    annualSubscription: 'Annual Subscription',
    cancelledSubscription: 'Cancelled Subscription',
    suspendedSubscription: 'Suspended Subscription',
    expiredSubscription: 'Expired Subscription',
    freeAccess: 'Free Access',
    noSubscription: 'No Subscription',
    trialDescription: 'Enjoy all features. Upgrade to continue after the period ends.',
    couponPeriodDescription: 'Enjoy full access with your coupon until it expires. Upgrade to a paid plan when you are ready.',
    trialActiveDescription: 'You\'re in your trial period. Your subscription will activate automatically when the trial ends. You can cancel anytime before then.',
    noSubscriptionDescription: 'You don\'t have an active subscription. Choose a plan to get started.',
    activeDescription: 'Thank you for being part of the sollo family. Your subscription is active.',
    cancelledDescription: 'Your subscription has been cancelled. You can resubscribe anytime.',
    suspendedDescription: 'Your subscription has been suspended. Please contact support for assistance.',
    expiredDescription: 'Your subscription has expired. Please upgrade to continue.',
    freeAccessDescription: 'You have free access until the expiration date.',
    timeRemaining: 'Time remaining until renewal/end:',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    manageSubscription: 'Pricing and Plans',
    upgradePlan: 'Upgrade Plan',
    upgradeNow: 'Upgrade Now',
    loading: 'Loading subscription status...',
    error: 'Failed to load subscription status',
    cancelSubscription: 'Cancel Subscription',
    cancelTrial: 'Cancel Trial',
    cancelConfirmTitle: 'Cancel Subscription',
    cancelConfirmMessage: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
    cancelConfirmMessageTrial: 'Are you sure you want to cancel your trial? Your access will end immediately and you will not be charged.',
    cancelConfirm: 'Yes, Cancel',
    cancelCancel: 'No, Keep Subscription',
    cancelling: 'Cancelling...',
    cancelledSuccess: 'Subscription cancelled successfully',
    cancelError: 'Failed to cancel subscription',
    upgradeToMonthly: 'Upgrade to Monthly Plan',
    upgradeToAnnual: 'Upgrade to Annual Plan',
    upgradeFromMonthlyToAnnual: 'Upgrade to Annual Plan',
    upgradeFromTrialToMonthly: 'Upgrade to Monthly Plan',
    upgradeFromTrialToAnnual: 'Upgrade to Annual Plan',
    upgradeConfirmTitle: 'Upgrade Subscription',
    upgradeConfirmMessage: 'Upgrading to annual will cancel your monthly subscription. You\'ll get better value with 30% savings!',
    upgradeConfirmMessageTrial: 'Upgrading will convert your trial to a paid subscription. The plan includes a trial period and better value!',
    upgradeConfirm: 'Yes, Upgrade',
    upgradeCancel: 'Cancel',
    currentPlan: 'Current Plan',
    planStatus: 'Status',
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
    paypalSubscriptionId: string | null;
    billingHistory?: Array<{ id: string; status: string; paymentDate: string }>;
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

/** Trial plan from a coupon (flag and/or stored coupon code — some rows only have code) */
function isCouponTrialAccess(sub: {
  planType: string;
  isTrialCoupon?: boolean;
  couponCode?: string | null;
}): boolean {
  return sub.planType === 'trial' && !!(sub.isTrialCoupon || sub.couponCode);
}

export function SubscriptionStatus() {
  const navigate = useNavigate();
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale] ?? translations.en;
  const alignStart = isRTL ? 'text-right' : 'text-left';

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'monthly' | 'annual' | null>(null);
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

  const handleCancelSubscription = async () => {
    if (!state.user?.id) return;

    try {
      setCancelling(true);
      const result = await api.subscriptions.cancel(state.user.id);
      
      // Check if there's a warning (PayPal cancellation may have failed)
      if (result.warning) {
        toast.success(t.cancelledSuccess, {
          duration: 5000,
        });
        toast.warning(
          locale === 'he' 
            ? `המנוי בוטל במערכת שלנו. ${result.paypalSubscriptionId ? 'ייתכן שתצטרך לבטל גם ב-PayPal ידנית.' : ''}`
            : `Subscription cancelled in our system. ${result.paypalSubscriptionId ? 'You may need to cancel manually in PayPal as well.' : ''}`,
          {
            duration: 8000,
          }
        );
      } else {
        toast.success(t.cancelledSuccess);
      }
      
      setShowCancelConfirm(false);
      // Reload subscription status
      await loadSubscriptionStatus();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(t.cancelError);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = () => {
    if (!subscriptionData?.subscription) {
      return false;
    }
    const subscription = subscriptionData.subscription;
    
    // Can cancel if: active monthly or annual subscription with PayPal subscription ID
    // Allow canceling trial coupon subscriptions if they have PayPal subscription ID (backend handles it)
    const isMonthlyOrAnnual = subscription.planType === 'monthly' || subscription.planType === 'annual';
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const hasPayPalSubscription = subscription.paypalSubscriptionId !== null;
    
    return isMonthlyOrAnnual && isActive && hasPayPalSubscription;
  };

  const isTrialPeriod = () => {
    if (!subscriptionData?.subscription) return false;
    const subscription = subscriptionData.subscription;
    // Check if it's a trial (no payments yet or status is trialing)
    // billingHistory might not be included in the response, so check status and paypalSubscriptionId
    const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
    return !hasPayments && subscription.paypalSubscriptionId && 
           (subscription.status === 'active' || subscription.status === 'trialing');
  };

  const canUpgradeFromTrial = () => {
    if (!subscriptionData?.subscription) return false;
    const subscription = subscriptionData.subscription;
    const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
    // Can upgrade if: trial (no payments) and has PayPal subscription ID
    return !hasPayments && subscription.paypalSubscriptionId && 
           (subscription.status === 'active' || subscription.status === 'trialing');
  };

  const canUpgradeFromMonthlyToAnnual = () => {
    if (!subscriptionData?.subscription) return false;
    const subscription = subscriptionData.subscription;
    // Can upgrade if: monthly plan, active/trialing status, has PayPal subscription ID
    return subscription.planType === 'monthly' && 
           (subscription.status === 'active' || subscription.status === 'trialing') &&
           subscription.paypalSubscriptionId !== null;
  };

  const handleUpgradeClick = (plan: 'monthly' | 'annual') => {
    setUpgradePlan(plan);
    
    // Show confirmation if upgrading from monthly to annual
    if (canUpgradeFromMonthlyToAnnual() && plan === 'annual') {
      setShowUpgradeConfirm(true);
    } else if (canUpgradeFromTrial() && plan === 'annual') {
      // Show confirmation for trial to annual upgrade
      setShowUpgradeConfirm(true);
    } else {
      // Direct upgrade for trial to monthly (no confirmation needed)
      navigate(`/payment?plan=${plan}`);
    }
  };

  const handleUpgradeConfirm = () => {
    if (upgradePlan) {
      setShowUpgradeConfirm(false);
      navigate(`/payment?plan=${upgradePlan}`);
    }
  };

  const getPlanDisplayName = () => {
    if (!subscriptionData?.subscription) {
      return t.noSubscription;
    }
    const subscription = subscriptionData.subscription;
    const planType = subscription.planType;
    const status = subscription.status;
    
    // If subscription is cancelled, suspended, or expired, show status instead of plan type
    if (status === 'cancelled') {
      return t.cancelledSubscription;
    } else if (status === 'suspended') {
      return t.suspendedSubscription;
    } else if (status === 'expired') {
      return t.expiredSubscription;
    }
    
    // Otherwise, show the plan type
    if (planType === 'monthly') {
      return t.monthlySubscription;
    } else if (planType === 'annual') {
      return t.annualSubscription;
    } else if (isCouponTrialAccess(subscription)) {
      return t.couponPeriod;
    } else if (planType === 'trial') {
      return t.trialPeriod;
    } else if (subscription.isFreeAccess) {
      return t.freeAccess;
    }
    return t.trialPeriod;
  };

  const getStatusDisplayName = () => {
    if (!subscriptionData?.subscription) {
      return t.noSubscription;
    }
    const subscription = subscriptionData.subscription;
    const status = subscription.status;

    // Coupon-based trial: avoid "trial days" wording in the Status row
    if ((status === 'trialing' || status === 'trial') && isCouponTrialAccess(subscription)) {
      return locale === 'he' ? 'פעיל' : 'Active';
    }

    switch (status) {
      case 'active':
        return locale === 'he' ? 'פעיל' : 'Active';
      case 'trialing':
        return t.trialDays;
      case 'cancelled':
        return t.cancelledSubscription;
      case 'suspended':
        return t.suspendedSubscription;
      case 'expired':
        return t.expiredSubscription;
      case 'trial':
        return t.trialDays;
      default:
        return status;
    }
  };

  const getPlanDetails = () => {
    if (!subscriptionData?.subscription) {
      return {
        title: t.noSubscription,
        icon: <Zap size={20} className="text-gray-500" />,
        badgeVariant: 'warning' as const,
        description: t.noSubscriptionDescription,
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

    if (isCouponTrialAccess(subscription)) {
      const isExpired = subscription.endDate ? new Date() > new Date(subscription.endDate) : false;
      return {
        title: t.couponPeriod,
        icon: <Star size={20} className="text-yellow-500" />,
        badgeVariant: (isExpired ? 'error' : 'warning') as const,
        description: t.couponPeriodDescription,
        showCountdown: !isExpired && !!subscription.endDate,
      };
    }

    // PayPal trial period (user purchased a plan but is still within the trial window)
    // Subscription will auto-activate at trial end - no need to "upgrade to continue"
    if (status === 'trialing' && subscription.paypalSubscriptionId) {
      const trialEnd = subscription.trialEndDate || subscription.endDate;
      const isExpired = trialEnd ? new Date() > new Date(trialEnd) : false;
      const icon = planType === 'annual'
        ? <Crown size={20} className="text-purple-500" />
        : <Star size={20} className="text-yellow-500" />;
      return {
        title: t.trialPeriod,
        icon,
        badgeVariant: (isExpired ? 'error' : 'warning') as const,
        description: t.trialActiveDescription,
        showCountdown: !isExpired && !!trialEnd,
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

    if (status === 'suspended') {
      return {
        title: t.suspendedSubscription,
        icon: <Zap size={20} className="text-orange-500" />,
        badgeVariant: 'warning' as const,
        description: t.suspendedDescription,
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
      title: t.noSubscription,
      icon: <Zap size={20} className="text-gray-500" />,
      badgeVariant: 'warning' as const,
      description: t.noSubscriptionDescription,
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

      {/* Current Plan and Status */}
      <div className={`mb-4 space-y-2 ${alignStart}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.currentPlan}:</span>
          <Badge variant={planDetails.badgeVariant} className="text-sm px-3 py-1">
            {getPlanDisplayName()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.planStatus}:</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{getStatusDisplayName()}</span>
        </div>
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

      {/* Upgrade Confirmation Dialog */}
      {showUpgradeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <h3 className={`text-xl font-bold mb-4 ${alignStart}`}>
              {t.upgradeConfirmTitle}
            </h3>
            <p className={`text-gray-600 dark:text-gray-400 mb-6 ${alignStart}`}>
              {canUpgradeFromTrial() ? t.upgradeConfirmMessageTrial : t.upgradeConfirmMessage}
            </p>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpgradeConfirm(false);
                  setUpgradePlan(null);
                }}
                className={isRTL ? 'flex-row-reverse' : ''}
              >
                {t.upgradeCancel}
              </Button>
              <Button
                variant="primary"
                onClick={handleUpgradeConfirm}
                className={isRTL ? 'flex-row-reverse' : ''}
              >
                {t.upgradeConfirm}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <h3 className={`text-xl font-bold mb-4 ${alignStart}`}>
              {t.cancelConfirmTitle}
            </h3>
            <p className={`text-gray-600 dark:text-gray-400 mb-6 ${alignStart}`}>
              {isTrialPeriod() ? t.cancelConfirmMessageTrial : t.cancelConfirmMessage}
            </p>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className={isRTL ? 'flex-row-reverse' : ''}
              >
                {t.cancelCancel}
              </Button>
              <Button
                variant="primary"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className={isRTL ? 'flex-row-reverse' : ''}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    {t.cancelling}
                  </>
                ) : (
                  <>
                    <X size={16} />
                    {t.cancelConfirm}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className={`space-y-3 ${alignStart}`}>
        {/* Upgrade Options */}
        {canUpgradeFromTrial() && (
          <div className={`flex flex-col sm:flex-row gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Button
              variant="primary"
              onClick={() => handleUpgradeClick('monthly')}
              className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t.upgradeFromTrialToMonthly}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleUpgradeClick('annual')}
              className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t.upgradeFromTrialToAnnual}
            </Button>
          </div>
        )}

        {/* Action Buttons - All with consistent width */}
        <div className={`flex flex-col gap-3 ${alignStart}`}>
          {canUpgradeFromMonthlyToAnnual() && (
            <Button
              variant="primary"
              onClick={() => handleUpgradeClick('annual')}
              className={`w-full sm:min-w-[240px] sm:w-[240px] ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t.upgradeFromMonthlyToAnnual}
            </Button>
          )}

          {/* Cancel Button - Show for active paid plans and trial periods */}
          {canCancel() && (
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
              className={`w-full sm:min-w-[240px] sm:w-[240px] ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <X size={16} />
              {isTrialPeriod() ? t.cancelTrial : t.cancelSubscription}
            </Button>
          )}
          
          {/* Manage Subscription / Upgrade Plan Button - Always show */}
          <Button
            variant="primary"
            onClick={() => navigate('/pricing')}
            className={`w-full sm:min-w-[240px] sm:w-[240px] ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {subscriptionData?.subscription?.status === 'active' || subscriptionData?.subscription?.status === 'trialing' ? (
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
      </div>
    </Card>
  );
}

