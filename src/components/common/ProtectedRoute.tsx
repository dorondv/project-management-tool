import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LoadingSpinner } from './LoadingSpinner';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface Subscription {
  planType: string;
  status: string;
  endDate: Date | string | null;
  paypalSubscriptionId: string | null;
  trialEndDate?: Date | string | null;
  isTrialCoupon?: boolean;
}

interface SubscriptionResponse {
  subscription: Subscription;
  access: {
    hasFullAccess: boolean;
    canAccessSettings: boolean;
    canAccessPricing: boolean;
    expirationDate: Date | string | null;
    status: 'active' | 'trial' | 'expired' | 'none';
  };
  userStatus: string;
}

/**
 * ProtectedRoute component
 * Blocks access to routes for users without active subscriptions
 * Only allows access to /pricing and /payment pages for users without subscriptions
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [access, setAccess] = useState<{ hasFullAccess: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  // Always allowed routes (no subscription needed)
  const publicRoutes = ['/pricing', '/payment', '/settings'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Load subscription status
  useEffect(() => {
    if (!state.user || isPublicRoute) {
      setLoading(false);
      return;
    }

    const loadSubscription = async () => {
      if (!state.user?.id) {
        console.log('🔒 ProtectedRoute: No user ID available');
        setSubscription(null);
        setAccess(null);
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.subscriptions.getStatus(state.user.id) as SubscriptionResponse | Subscription;
        
        // API returns { subscription, access, userStatus } or just subscription
        let subscriptionData: Subscription | null = null;
        let accessData: { hasFullAccess: boolean } | null = null;
        
        if ('subscription' in response && 'access' in response) {
          // Full response with access object
          subscriptionData = response.subscription;
          accessData = { hasFullAccess: response.access.hasFullAccess };
          console.log('🔒 ProtectedRoute: Using API access object:', accessData);
        } else {
          // Just subscription object (fallback)
          subscriptionData = response as Subscription;
          accessData = checkSubscriptionAccess(subscriptionData);
          console.log('🔒 ProtectedRoute: Calculated access:', accessData);
        }
        
        console.log('🔒 ProtectedRoute: Subscription data:', {
          planType: subscriptionData?.planType,
          status: subscriptionData?.status,
          isTrialCoupon: subscriptionData?.isTrialCoupon,
          endDate: subscriptionData?.endDate,
        });
        
        setSubscription(subscriptionData);
        setAccess(accessData);
      } catch (error: any) {
        // If no subscription found, that's okay - user needs to select a plan
        console.log('No subscription found for user:', error.message);
        setSubscription(null);
        setAccess(null);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [state.user, isPublicRoute]);

  useEffect(() => {
    // If public route, always allow
    if (isPublicRoute) {
      return;
    }

    // If still loading, wait
    if (loading) {
      return;
    }

    // If user is not authenticated, they shouldn't reach here (handled by App.tsx)
    if (!state.user) {
      return;
    }

    // If no subscription, redirect to pricing
    if (!subscription || !access) {
      const isHebrew = state.locale === 'he';
      toast.error(
        isHebrew 
          ? 'נא לבחור תוכנית כדי להמשיך'
          : 'Please select a plan to continue'
      );
      navigate('/pricing');
      return;
    }

    // Use access object from API (more reliable than recalculating)
    console.log('🔒 ProtectedRoute: Access check result:', {
      hasFullAccess: access.hasFullAccess,
      subscription: {
        planType: subscription?.planType,
        status: subscription?.status,
        isTrialCoupon: subscription?.isTrialCoupon,
        endDate: subscription?.endDate,
      }
    });

    if (!access.hasFullAccess) {
      // User doesn't have active access - redirect to pricing
      const isHebrew = state.locale === 'he';
      console.log('❌ ProtectedRoute: Access denied, redirecting to pricing');
      toast.error(
        isHebrew 
          ? 'נא לבחור תוכנית כדי להמשיך'
          : 'Please select a plan to continue'
      );
      navigate('/pricing');
    } else {
      console.log('✅ ProtectedRoute: Access granted');
    }
  }, [subscription, access, loading, state.user, location.pathname, navigate, isPublicRoute, state.locale]);

  // If public route, always render
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If loading, show spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // If no user, show nothing (will redirect)
  if (!state.user) {
    return null;
  }

  // If no subscription or access, show loading (will redirect)
  if (!subscription || !access) {
    return <LoadingSpinner />;
  }

  // If no access, show loading (will redirect)
  if (!access.hasFullAccess) {
    return <LoadingSpinner />;
  }

  // User has access, render children
  return <>{children}</>;
}

/**
 * Check subscription access
 * Returns true if user has active subscription (paid or within trial period)
 */
function checkSubscriptionAccess(subscription: {
  planType: string;
  status: string;
  endDate: Date | string | null;
  paypalSubscriptionId: string | null;
  trialEndDate?: Date | string | null;
  isTrialCoupon?: boolean;
} | null): {
  hasFullAccess: boolean;
} {
  if (!subscription) {
    return { hasFullAccess: false };
  }

  // Suspended subscription - no access
  if (subscription.status === 'suspended') {
    return { hasFullAccess: false };
  }

  // Trial subscription (from coupon) - check expiration first
  // This takes priority over PayPal subscriptions for trial coupons
  if (subscription.planType === 'free' || subscription.planType === 'trial' || subscription.isTrialCoupon) {
    const endDate = subscription.endDate;
    console.log('🔍 ProtectedRoute: Checking trial coupon subscription:', {
      planType: subscription.planType,
      isTrialCoupon: subscription.isTrialCoupon,
      endDate: endDate,
      endDateType: typeof endDate,
      currentTime: new Date().toISOString(),
    });
    
    if (endDate) {
      const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
      const now = new Date();
      const isValid = now < endDateObj;
      
      console.log('🔍 ProtectedRoute: Date comparison:', {
        now: now.toISOString(),
        endDate: endDateObj.toISOString(),
        isValid: isValid,
        diffDays: Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      });
      
      if (isValid) {
        console.log('✅ Trial coupon subscription is valid, granting access');
        return { hasFullAccess: true };
      } else {
        console.log('❌ Trial coupon subscription has expired');
        return { hasFullAccess: false };
      }
    }
    console.log('❌ Trial coupon subscription has no end date');
    return { hasFullAccess: false };
  }

  // Paid subscription - full access (only if not a trial plan)
  // Check if it's a real paid subscription (has payments, not just PayPal ID from old subscription)
  if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
    // For trial coupons, we already checked above, so this is a real paid subscription
    return { hasFullAccess: true };
  }

  // Trial subscription - check if within trial period
  if (subscription.status === 'trialing' || subscription.status === 'active') {
    // Check trial end date
    const trialEndDate = subscription.trialEndDate || subscription.endDate;
    if (trialEndDate) {
      const trialEndDateObj = typeof trialEndDate === 'string' ? new Date(trialEndDate) : trialEndDate;
      if (new Date() < trialEndDateObj) {
        return { hasFullAccess: true };
      }
    }
  }

  // Expired or cancelled - no access
  return { hasFullAccess: false };
}

