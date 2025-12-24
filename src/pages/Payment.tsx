import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Lock, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Locale } from '../types';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import {
  initSocket,
  disconnectSocket,
  onPaymentConfirmed,
  onPaymentFailed,
  onSubscriptionStatusUpdated,
} from '../utils/socket';

// PayPal types
declare global {
  interface Window {
    paypal?: {
      Buttons: (options: any) => {
        render: (container: string) => void;
      };
    };
  }
}

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  backToPricing: string;
  planSummary: string;
  annualPlan: string;
  monthlyPlan: string;
  savings30Percent: string;
  perMonthAnnual: string;
  perMonthMonthly: string;
  yearlyTotal: string;
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
    savings30Percent: '30% Off',
    perMonthAnnual: 'Per month (annual billing)',
    perMonthMonthly: 'Per month (monthly billing)',
    yearlyTotal: '$118.80 Paid Yearly',
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
    savings30Percent: 'חסכון של 30%',
    perMonthAnnual: 'לחודש (חיוב שנתי)',
    perMonthMonthly: 'לחודש (חיוב חודשי)',
    yearlyTotal: '$118.80 תשלום שנתי',
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

  const [paypalLoading, setPaypalLoading] = useState(true);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const isAnnual = plan === 'annual';
  // Actual prices: Monthly $12.90, Annual $9.90/month ($118.80/year)
  const monthlyPrice = 12.90;
  const annualMonthlyPrice = 9.90;
  const annualYearlyPrice = 118.80;
  const displayPrice = isAnnual ? annualMonthlyPrice : monthlyPrice;
  const planName = isAnnual ? t.annualPlan : t.monthlyPlan;
  const billingCycle = isAnnual ? t.perMonthAnnual : t.perMonthMonthly;

  // PayPal Plan IDs
  const planIdMap: Record<string, string> = {
    monthly: 'P-771756107T669132ENFBLY7Y',
    annual: 'P-9EG97204XL0481249NFBMDTQ',
  };

  const planId = planIdMap[plan];

  useEffect(() => {
    loadPayPalSDK();
  }, []);

  useEffect(() => {
    if (!paypalLoading && paypalClientId && window.paypal && planId) {
      renderPayPalButtons();
    }
  }, [paypalLoading, paypalClientId, planId]);

  // WebSocket listeners for real-time payment updates
  useEffect(() => {
    if (!state.user?.id) return;

    // Initialize WebSocket connection
    const socket = initSocket(state.user.id);
    if (!socket) {
      console.warn('⚠️  WebSocket not available, using fallback');
      return;
    }

    // Set up event listeners
    const unsubscribePaymentConfirmed = onPaymentConfirmed((data) => {
      console.log('📡 Payment confirmed via WebSocket:', data);
      if (!processing) {
        // Only show toast if not already processing (to avoid duplicate messages)
        toast.success(
          locale === 'he'
            ? 'התשלום אושר! מנוי הופעל בהצלחה.'
            : 'Payment confirmed! Subscription activated successfully.'
        );
        // Reload subscription status and redirect
        setTimeout(() => {
          navigate('/settings');
        }, 1500);
      }
    });

    const unsubscribePaymentFailed = onPaymentFailed((data) => {
      console.log('📡 Payment failed via WebSocket:', data);
      toast.error(
        locale === 'he'
          ? `תשלום נכשל: ${data.error}`
          : `Payment failed: ${data.error}`
      );
      setProcessing(false);
    });

    const unsubscribeStatusUpdated = onSubscriptionStatusUpdated((data) => {
      console.log('📡 Subscription status updated via WebSocket:', data);
      // Optionally refresh subscription status
      if (data.status === 'active' && !processing) {
        toast.success(
          locale === 'he'
            ? 'סטטוס המנוי עודכן'
            : 'Subscription status updated'
        );
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribePaymentConfirmed();
      unsubscribePaymentFailed();
      unsubscribeStatusUpdated();
      // Don't disconnect socket here - let it stay connected for other components
    };
  }, [state.user?.id, processing, locale, navigate]);

  const loadPayPalSDK = async () => {
    try {
      // Get PayPal Client ID and mode from backend
      const { clientId, mode } = await api.subscriptions.getClientId();
      setPaypalClientId(clientId);

      // Check if PayPal SDK is already loaded
      if (window.paypal) {
        setPaypalLoading(false);
        return;
      }

      // Load PayPal SDK script
      // Note: For subscriptions, we need 'vault=true' and 'intent=subscription'
      // PayPal automatically detects sandbox vs production based on the client ID
      // The 'env' parameter is not valid - PayPal uses the client ID to determine environment
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&currency=USD`;
      script.async = true;
      script.onload = () => {
        setPaypalLoading(false);
      };
      script.onerror = (error) => {
        console.error('Error loading PayPal SDK:', error);
        console.error('SDK URL:', script.src);
        setPaypalLoading(false);
        toast.error(
          locale === 'he' 
            ? 'שגיאה בטעינת PayPal SDK. אנא רענן את הדף.'
            : 'Error loading PayPal SDK. Please refresh the page.'
        );
      };
      document.head.appendChild(script);
    } catch (error: any) {
      console.error('Error loading PayPal:', error);
      setPaypalLoading(false);
      
      // Show more helpful error message
      const errorMessage = error.message?.includes('not configured') || error.message?.includes('Failed to get')
        ? (locale === 'he' 
            ? 'PayPal לא מוגדר. אנא פנה למנהל המערכת.'
            : 'PayPal is not configured. Please contact the administrator.')
        : (locale === 'he' 
            ? 'שגיאה בטעינת PayPal. אנא נסה שוב מאוחר יותר.'
            : 'Error loading PayPal. Please try again later.');
      
      toast.error(errorMessage);
    }
  };

  const renderPayPalButtons = () => {
    const container = document.getElementById('paypal-button-container');
    if (!container || !window.paypal || !planId) return;

    // Clear existing buttons
    container.innerHTML = '';

    window.paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'white',
        layout: 'vertical',
        label: 'subscribe',
      },
      createSubscription: function(data: any, actions: any) {
        console.log('=== Creating Subscription ===');
        console.log('Plan ID:', planId);
        console.log('Plan Type:', plan);
        
        return actions.subscription.create({
          plan_id: planId
        }).then((subscription: any) => {
          console.log('=== Subscription Created Successfully ===');
          console.log('Full subscription response:', JSON.stringify(subscription, null, 2));
          console.log('Subscription ID:', subscription.id || subscription.subscriptionID || subscription.subscription_id);
          // PayPal returns the subscription object - return it as-is
          return subscription;
        }).catch((error: any) => {
          console.error('=== Subscription Creation FAILED ===');
          console.error('Error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        });
      },
      onApprove: async function(data: any, actions: any) {
        console.log('=== PayPal onApprove CALLED ===');
        console.log('Full PayPal data object:', JSON.stringify(data, null, 2));
        console.log('User ID:', state.user?.id);
        console.log('Plan:', plan);
        
        // PayPal might return subscriptionID in different formats
        const subscriptionID = data.subscriptionID || data.subscription_id || data.id;
        console.log('Extracted Subscription ID:', subscriptionID);
        console.log('Available keys in data:', Object.keys(data));
        
        try {
          setProcessing(true);
          
          // Link subscription to user account
          if (!state.user?.id) {
            console.error('ERROR: User not authenticated');
            throw new Error('User not authenticated');
          }

          if (!subscriptionID) {
            console.error('ERROR: No subscription ID found in data:', data);
            console.error('Data structure:', JSON.stringify(data, null, 2));
            throw new Error('No subscription ID received from PayPal');
          }

          console.log('Calling API to link subscription with ID:', subscriptionID);

          // Add timeout to prevent hanging
          const linkPromise = api.subscriptions.link(
            {
              subscriptionID: subscriptionID,
              planType: plan as 'monthly' | 'annual',
            },
            state.user.id
          );

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 30000)
          );

          const result = await Promise.race([linkPromise, timeoutPromise]);
          
          console.log('=== Subscription linked successfully ===');
          console.log('Result:', result);
          
          toast.success(
            locale === 'he' 
              ? 'התשלום הושלם בהצלחה! ברוכים הבאים למשפחת sollo!'
              : 'Payment completed successfully! Welcome to the sollo family!'
          );

          // Small delay before redirect to ensure toast is visible
          setTimeout(() => {
            navigate('/');
          }, 1000);
        } catch (error: any) {
          console.error('Error linking subscription:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response
          });
          
          setProcessing(false);
          
          const errorMessage = error.message === 'Request timeout'
            ? (locale === 'he' 
                ? 'הבקשה ארכה זמן רב מדי. אנא בדוק את סטטוס המנוי בהגדרות.'
                : 'Request timed out. Please check subscription status in settings.')
            : (locale === 'he'
                ? 'שגיאה בעיבוד התשלום. אנא פנה לתמיכה.'
                : 'Error processing payment. Please contact support.');
          
          toast.error(errorMessage);
        }
      },
      onError: function(err: any) {
        console.error('=== PayPal ERROR ===');
        console.error('PayPal error:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        
        setProcessing(false);
        
        // More detailed error handling
        let errorMessage = locale === 'he'
          ? 'שגיאה בתהליך התשלום. אנא נסה שוב.'
          : 'Error in payment process. Please try again.';
        
        if (err?.message) {
          console.error('PayPal error message:', err.message);
          if (err.message.includes('card') || err.message.includes('כרטיס')) {
            errorMessage = locale === 'he'
              ? 'בעיה בהוספת כרטיס. נסה להשתמש בחשבון PayPal או כרטיס אחר.'
              : 'Issue adding card. Try using a PayPal account or a different card.';
          }
        }
        
        toast.error(errorMessage);
      },
      onCancel: function(data: any) {
        console.log('=== PayPal Payment CANCELLED ===');
        console.log('Cancel data:', data);
        setProcessing(false);
      },
      onClick: function(data: any, actions: any) {
        console.log('=== PayPal Button CLICKED ===');
        console.log('Click data:', data);
      },
    }).render('#paypal-button-container');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className={`mb-8 ${alignStart}`}>
        <Button
          variant="ghost"
          onClick={() => navigate('/pricing')}
            className={`mb-4 border-2 border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
            <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          {t.backToPricing}
        </Button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t.pageTitle}
        </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
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
              <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                {t.savings30Percent}
              </div>
            )}
          </div>
          <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${displayPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {billingCycle}
            </div>
            {isAnnual && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.yearlyTotal}
              </div>
            )}
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

        {paypalLoading ? (
          <div className={`flex items-center justify-center py-8 ${alignStart}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className={`ml-3 text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-3 ml-0' : ''}`}>
              {locale === 'he' ? 'טוען אפשרויות תשלום...' : 'Loading payment options...'}
            </span>
          </div>
        ) : !paypalClientId ? (
          <div className={`text-center py-8 ${alignStart}`}>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                {locale === 'he' ? 'PayPal לא מוגדר' : 'PayPal Not Configured'}
              </p>
              <p className="text-sm text-red-500 dark:text-red-400">
                {locale === 'he' 
                  ? 'PayPal לא מוגדר בשרת. אנא פנה למנהל המערכת כדי להגדיר את פרטי PayPal.'
                  : 'PayPal is not configured on the server. Please contact the administrator to set up PayPal credentials.'}
              </p>
            </div>
          </div>
        ) : (
          <div id="paypal-button-container" className="mb-4"></div>
        )}

        {processing && (
          <div className={`text-center py-4 ${alignStart}`}>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {locale === 'he' ? 'מעבד תשלום...' : 'Processing payment...'}
            </p>
            <button
              onClick={() => {
                console.log('Manual reset - checking status...');
                setProcessing(false);
                // Try to check subscription status
                if (state.user?.id) {
                  api.subscriptions.getStatus(state.user.id)
                    .then((status) => {
                      console.log('Current subscription status:', status);
                      if (status.subscription) {
                        toast.success('Payment may have completed. Checking subscription...');
                        navigate('/settings');
                      }
                    })
                    .catch((err) => {
                      console.error('Error checking status:', err);
                    });
                }
              }}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 underline"
            >
              {locale === 'he' ? 'אם התשלום תקוע, לחץ כאן' : 'If payment is stuck, click here'}
            </button>
        </div>
        )}

        <div className={`text-center text-xs text-gray-500 dark:text-gray-400 ${alignStart}`}>
          {t.poweredByPayPal}
        </div>
      </Card>

      {/* Footer Note */}
        <div className={`text-center text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl`}>
          <p className="mb-1">🔒 {t.securityNote}</p>
          <p>{t.cancelNote}</p>
        </div>
      </div>
    </div>
  );
}

