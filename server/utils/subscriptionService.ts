import { prisma } from '../index.js';
import { getPayPalPlanId } from './paypalService.js';

/**
 * Subscription Service
 * Handles subscription business logic and database operations
 */

export type PlanType = 'monthly' | 'annual' | 'free' | 'trial';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'churned' | 'free';

/**
 * Create a subscription record
 */
export async function createSubscription(
  userId: string,
  planType: PlanType,
  options: {
    paypalSubscriptionId?: string;
    paypalPlanId?: string;
    price: number;
    currency?: string;
    couponCode?: string;
    couponId?: string;
    isFreeAccess?: boolean;
    isTrialCoupon?: boolean;
    grantedByAdminId?: string;
    endDate?: Date;
    trialEndDate?: Date;
  }
) {
  const {
    paypalSubscriptionId,
    paypalPlanId,
    price,
    currency = 'USD',
    couponCode,
    couponId,
    isFreeAccess = false,
    isTrialCoupon = false,
    grantedByAdminId,
    endDate,
    trialEndDate,
  } = options;

  // Determine status based on plan type
  let status: SubscriptionStatus = 'active';
  if (planType === 'free' || planType === 'trial') {
    status = planType === 'free' ? 'free' : 'trial';
  } else if (paypalSubscriptionId) {
    status = 'active';
  }

  // Get PayPal plan ID if not provided
  const finalPaypalPlanId = paypalPlanId || (planType !== 'free' && planType !== 'trial' 
    ? getPayPalPlanId(planType as 'monthly' | 'annual')
    : null);

  return await prisma.subscription.create({
    data: {
      userId,
      planType,
      status,
      paypalSubscriptionId,
      paypalPlanId: finalPaypalPlanId,
      startDate: new Date(),
      endDate,
      trialEndDate,
      price,
      currency,
      couponCode,
      couponId,
      isFreeAccess,
      isTrialCoupon,
      grantedByAdminId,
    },
  });
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus
) {
  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status, updatedAt: new Date() },
  });
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(userId: string) {
  return await prisma.subscription.findUnique({
    where: { userId },
    include: {
      billingHistory: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });
}

/**
 * Link PayPal subscription to user
 * Handles upgrades from monthly to annual by cancelling the old subscription
 */
export async function linkPayPalSubscription(
  userId: string,
  paypalSubscriptionId: string,
  planType: 'monthly' | 'annual'
) {
  // Fetch subscription details from PayPal to get trial period info
  const { getSubscriptionDetails } = await import('./paypalService.js');
  let paypalSubscriptionDetails: any = null;
  let trialEndDate: Date | null = null;

  try {
    paypalSubscriptionDetails = await getSubscriptionDetails(paypalSubscriptionId);
    trialEndDate = extractTrialEndDateFromPayPal(paypalSubscriptionDetails);
  } catch (error: any) {
    console.warn('Could not fetch PayPal subscription details for trial period:', error.message);
    // Continue without trial end date - we'll detect it from billing history
  }

  // Check if user already has a subscription
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId },
    include: {
      billingHistory: {
        orderBy: { paymentDate: 'desc' },
        take: 1,
      },
    },
  });

  const paypalPlanId = getPayPalPlanId(planType);
  const price = planType === 'monthly' ? 12.90 : 118.80;

  // Handle upgrade from monthly to annual
  if (existingSubscription && existingSubscription.planType === 'monthly' && planType === 'annual') {
    console.log(`🔄 Upgrading user ${userId} from monthly to annual subscription`);
    
    // Store the old monthly PayPal subscription ID for later cancellation
    // We'll cancel it AFTER the annual payment is confirmed (in handlePaymentCompleted webhook)
    // This prevents double charging if the annual payment fails
    const oldMonthlyPaypalSubscriptionId = existingSubscription.paypalSubscriptionId;
    
    if (oldMonthlyPaypalSubscriptionId) {
      console.log(`📝 Will cancel monthly subscription ${oldMonthlyPaypalSubscriptionId} after annual payment is confirmed`);
    }

    // Update existing subscription to annual
    // Note: We don't cancel the monthly subscription here - it will be cancelled
    // in handlePaymentCompleted after the annual payment is confirmed
    const subscriptionData: any = {
      planType: 'annual',
      status: trialEndDate && new Date() < trialEndDate ? 'trialing' : 'active',
      paypalSubscriptionId,
      paypalPlanId,
      price,
      updatedAt: new Date(),
    };

    // Add trial end date if we got it from PayPal
    if (trialEndDate) {
      subscriptionData.trialEndDate = trialEndDate;
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: subscriptionData,
    });

    // Store the old monthly subscription ID in a way we can access it later
    // We'll check for it in handlePaymentCompleted
    console.log(`✅ Subscription upgraded to annual. Old monthly subscription ${oldMonthlyPaypalSubscriptionId} will be cancelled after payment confirmation.`);

    return updatedSubscription;
  }

  // Handle regular subscription linking (new subscription or same plan type)
  // For new subscriptions, ensure 5-day trial period
  let finalTrialEndDate = trialEndDate;
  
  // If no trial end date from PayPal and this is a new subscription, set 5-day trial
  if (!finalTrialEndDate && !existingSubscription) {
    finalTrialEndDate = calculateTrialEndDate(5); // 5 days trial for new users
    console.log(`📅 Setting 5-day trial period for new subscription (ends: ${finalTrialEndDate.toISOString()})`);
  }
  
  // If PayPal provided trial end date, use it; otherwise use calculated one
  const subscriptionData: any = {
    planType,
    status: finalTrialEndDate && new Date() < finalTrialEndDate ? 'trialing' : 'active',
    paypalSubscriptionId,
    paypalPlanId,
    price,
    updatedAt: new Date(),
  };

  // Add trial end date
  if (finalTrialEndDate) {
    subscriptionData.trialEndDate = finalTrialEndDate;
  }

  if (existingSubscription) {
    // Update existing subscription (same plan type or no plan)
    return await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: subscriptionData,
    });
  } else {
    // Create new subscription with 5-day trial
    return await createSubscription(userId, planType, {
      paypalSubscriptionId,
      paypalPlanId,
      price,
      trialEndDate: finalTrialEndDate || undefined,
    });
  }
}

/**
 * Calculate trial end date (7 days from now by default)
 */
export function calculateTrialEndDate(days: number = 7): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  return endDate;
}

/**
 * Extract trial end date from PayPal subscription details
 */
export function extractTrialEndDateFromPayPal(paypalSubscriptionDetails: any): Date | null {
  if (!paypalSubscriptionDetails) return null;

  // Method 1: Check for trial_ended_at in billing_info
  if (paypalSubscriptionDetails.billing_info?.trial_ended_at) {
    return new Date(paypalSubscriptionDetails.billing_info.trial_ended_at);
  }

  // Method 2: Calculate from billing_cycles (trial cycle)
  if (paypalSubscriptionDetails.billing_cycles) {
    const trialCycle = paypalSubscriptionDetails.billing_cycles.find(
      (cycle: any) => cycle.tenure_type === 'TRIAL'
    );
    
    if (trialCycle) {
      const startTime = paypalSubscriptionDetails.start_time || 
                       paypalSubscriptionDetails.create_time ||
                       paypalSubscriptionDetails.billing_info?.next_billing_time;
      
      if (startTime && trialCycle.frequency) {
        const startDate = new Date(startTime);
        const intervalCount = trialCycle.frequency.interval_count || 1;
        const intervalUnit = trialCycle.frequency.interval_unit || 'DAY';
        
        const trialEndDate = new Date(startDate);
        
        if (intervalUnit === 'DAY') {
          trialEndDate.setDate(trialEndDate.getDate() + intervalCount);
        } else if (intervalUnit === 'WEEK') {
          trialEndDate.setDate(trialEndDate.getDate() + (intervalCount * 7));
        } else if (intervalUnit === 'MONTH') {
          trialEndDate.setMonth(trialEndDate.getMonth() + intervalCount);
        } else if (intervalUnit === 'YEAR') {
          trialEndDate.setFullYear(trialEndDate.getFullYear() + intervalCount);
        }
        
        return trialEndDate;
      }
    }
  }

  // Method 3: Use next_billing_time as trial end (if no payments yet)
  if (paypalSubscriptionDetails.billing_info?.next_billing_time) {
    return new Date(paypalSubscriptionDetails.billing_info.next_billing_time);
  }

  return null;
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(subscription: {
  endDate: Date | null;
  status: string;
}): boolean {
  if (!subscription.endDate) {
    // Paid subscriptions without endDate are not expired
    return subscription.status === 'expired' || subscription.status === 'cancelled';
  }
  return new Date() > subscription.endDate;
}

/**
 * Check subscription access
 */
export function checkSubscriptionAccess(subscription: {
  planType: string;
  status: string;
  endDate: Date | null;
  paypalSubscriptionId: string | null;
}): {
  hasFullAccess: boolean;
  canAccessSettings: boolean;
  canAccessPricing: boolean;
  expirationDate: Date | null;
  status: 'active' | 'trial' | 'expired' | 'none';
} {
  const canAccessSettings = true; // Always allowed
  const canAccessPricing = true; // Always allowed

  if (!subscription) {
    return {
      hasFullAccess: false,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: null,
      status: 'none',
    };
  }

  // Suspended subscription - no access
  if (subscription.status === 'suspended') {
    return {
      hasFullAccess: false,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: subscription.endDate,
      status: 'expired',
    };
  }

  // Paid subscription - full access
  if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
    return {
      hasFullAccess: true,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: subscription.endDate,
      status: 'active',
    };
  }

  // Free/Trial subscription - check expiration
  if (subscription.planType === 'free' || subscription.planType === 'trial') {
    const isExpired = subscription.endDate 
      ? new Date() > subscription.endDate
      : false;

    return {
      hasFullAccess: !isExpired,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: subscription.endDate,
      status: isExpired ? 'expired' : 'trial',
    };
  }

  // Expired or cancelled - limited access
  return {
    hasFullAccess: false,
    canAccessSettings: true,
    canAccessPricing: true,
    expirationDate: subscription.endDate,
    status: 'expired',
  };
}

/**
 * Handle subscription renewal
 */
export async function handleSubscriptionRenewal(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Calculate new end date based on plan type
  let newEndDate: Date | null = null;
  
  if (subscription.planType === 'monthly') {
    newEndDate = new Date();
    newEndDate.setMonth(newEndDate.getMonth() + 1);
  } else if (subscription.planType === 'annual') {
    newEndDate = new Date();
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
  }

  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'active',
      endDate: newEndDate,
      updatedAt: new Date(),
    },
  });
}

/**
 * Create billing history record
 */
export async function createBillingHistory(
  subscriptionId: string,
  data: {
    invoiceNumber: string;
    paypalTransactionId?: string;
    paypalSaleId?: string;
    amount: number;
    currency?: string;
    status: string;
    paymentDate: Date;
    invoiceUrl?: string;
  }
) {
  return await prisma.billingHistory.create({
    data: {
      subscriptionId,
      invoiceNumber: data.invoiceNumber,
      paypalTransactionId: data.paypalTransactionId,
      paypalSaleId: data.paypalSaleId,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: data.status,
      paymentDate: data.paymentDate,
      invoiceUrl: data.invoiceUrl,
    },
  });
}

/**
 * Update billing history refund status
 */
export async function updateBillingHistoryRefund(
  billingHistoryId: string,
  refundedAmount: number,
  refundReason?: string
) {
  const billingHistory = await prisma.billingHistory.findUnique({
    where: { id: billingHistoryId },
  });

  if (!billingHistory) {
    throw new Error('Billing history not found');
  }

  const isFullRefund = refundedAmount >= billingHistory.amount;
  const status = isFullRefund ? 'refunded' : 'partially_refunded';

  return await prisma.billingHistory.update({
    where: { id: billingHistoryId },
    data: {
      status,
      refundedAmount,
      refundedDate: new Date(),
      refundReason,
    },
  });
}

/**
 * Get user status based on subscription
 */
export function getUserStatus(subscription: {
  planType: string;
  status: string;
  endDate: Date | null;
  paypalSubscriptionId: string | null;
  isFreeAccess: boolean;
  isTrialCoupon: boolean;
} | null): 'Free trial' | 'Active user (Paid)' | 'Churned' | 'Free access' {
  if (!subscription) {
    return 'Churned';
  }

  // Manually granted free access
  if (subscription.isFreeAccess && subscription.planType === 'free') {
    // If status is explicitly expired, return Churned
    if (subscription.status === 'expired') {
      return 'Churned';
    }
    const isExpired = subscription.endDate 
      ? new Date() > subscription.endDate
      : false;
    return isExpired ? 'Churned' : 'Free access';
  }

  // Trial coupon subscription
  if (subscription.isTrialCoupon && subscription.planType === 'trial') {
    const isExpired = subscription.endDate 
      ? new Date() > subscription.endDate
      : false;
    return isExpired ? 'Churned' : 'Free trial';
  }

  // Suspended subscription - treat as churned
  if (subscription.status === 'suspended') {
    return 'Churned';
  }

  // Paid subscription - check if it's in trial period (has PayPal subscription but no payments yet)
  if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
    // This will be checked in the API to see if there are any billing history entries
    // If no billing history, it's still in trial period
    return 'Active user (Paid)'; // Will be overridden if no payments found
  }

  // PayPal trial period (status is 'trialing')
  if (subscription.status === 'trialing' && subscription.paypalSubscriptionId) {
    return 'Free trial';
  }

  // Expired or cancelled
  if (subscription.status === 'cancelled' || subscription.status === 'expired') {
    return 'Churned';
  }

  // Check if free/trial subscription is expired
  if ((subscription.planType === 'free' || subscription.planType === 'trial') && subscription.endDate) {
    if (new Date() > subscription.endDate) {
      return 'Churned';
    }
    return subscription.isFreeAccess ? 'Free access' : 'Free trial';
  }

  return 'Churned';
}

