/**
 * Trial Expiration Service
 * Checks for expired trials and updates subscription status
 */

import { prisma } from '../index.js';

/**
 * Check and update expired trial subscriptions
 * This should be called periodically (e.g., via cron job or scheduled task)
 */
export async function checkAndUpdateExpiredTrials() {
  console.log('🔍 Checking for expired trial subscriptions...');

  try {
    // Find all active subscriptions with PayPal subscription IDs that might be in trial
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        paypalSubscriptionId: { not: null },
      },
      include: {
        billingHistory: {
          orderBy: { paymentDate: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();
    let updatedCount = 0;

    for (const subscription of subscriptions) {
      // Check if this is a trial subscription (no payments yet)
      const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
      
      if (hasPayments) {
        // Already has payments, not a trial
        continue;
      }

      // Check if trial has expired
      let trialEndDate = subscription.trialEndDate || subscription.endDate;
      
      // If no trial end date but this is a PayPal subscription, calculate fallback
      if (!trialEndDate && subscription.paypalSubscriptionId && subscription.startDate) {
        // Production plan (P-771756107T669132ENFBLY7Y) has 5-day trial period
        // Use 5 days as fallback for production plans
        const startDate = new Date(subscription.startDate);
        const fallbackTrialEndDate = new Date(startDate);
        fallbackTrialEndDate.setDate(fallbackTrialEndDate.getDate() + 5); // 5-day trial for production plan
        trialEndDate = fallbackTrialEndDate;
        
        // Save the calculated trial end date to database
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { trialEndDate: fallbackTrialEndDate },
        });
        console.log(`📝 Saved calculated trial end date (5-day fallback) for subscription ${subscription.id}: ${fallbackTrialEndDate.toISOString()}`);
      }
      
      if (!trialEndDate) {
        // Still no trial end date set, skip
        continue;
      }

      const trialEnd = new Date(trialEndDate);
      
      if (now > trialEnd) {
        // Trial has expired - update status regardless of PayPal API availability
        // If PayPal API is available, check status; otherwise, mark as expired based on date
        let shouldUpdate = true;
        let paypalStatus = null;
        
        try {
          const { getSubscriptionDetails } = await import('./paypalService.js');
          const paypalDetails = await getSubscriptionDetails(subscription.paypalSubscriptionId!);
          paypalStatus = paypalDetails.status;
          
          // If PayPal subscription is SUSPENDED or EXPIRED, definitely update
          if (paypalStatus === 'SUSPENDED' || paypalStatus === 'EXPIRED') {
            shouldUpdate = true;
          } else if (paypalStatus === 'ACTIVE') {
            // PayPal says active but trial expired - might be waiting for payment
            // Still mark as expired since trial period is over
            shouldUpdate = true;
            console.log(`⚠️  Subscription ${subscription.id} trial expired but PayPal status is ACTIVE - marking as expired`);
          }
        } catch (error: any) {
          console.warn(`⚠️  Could not check PayPal status for subscription ${subscription.id}:`, error.message);
          // PayPal API failed, but trial expired - update anyway
          shouldUpdate = true;
        }
        
        if (shouldUpdate) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'expired',
              updatedAt: new Date(),
            },
          });
          
          console.log(`✅ Updated expired trial subscription: ${subscription.id} (PayPal status: ${paypalStatus || 'unknown'})`);
          updatedCount++;
        }
      }
    }

    console.log(`✅ Trial expiration check complete. Updated ${updatedCount} subscriptions.`);
    return { updated: updatedCount };
  } catch (error: any) {
    console.error('❌ Error checking expired trials:', error);
    throw error;
  }
}

/**
 * Check a specific subscription for trial expiration
 */
export async function checkSubscriptionTrialExpiration(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      billingHistory: {
        orderBy: { paymentDate: 'desc' },
        take: 1,
      },
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Check if this is a trial subscription
  const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;
  
  if (hasPayments) {
    return { isExpired: false, reason: 'Has payments, not a trial' };
  }

  let trialEndDate = subscription.trialEndDate || subscription.endDate;
  
  // If no trial end date but this is a PayPal subscription, calculate fallback
  if (!trialEndDate && subscription.paypalSubscriptionId && subscription.startDate) {
    // Production plan (P-771756107T669132ENFBLY7Y) has 5-day trial period
    // Use 5 days as fallback for production plans
    const startDate = new Date(subscription.startDate);
    const fallbackTrialEndDate = new Date(startDate);
    fallbackTrialEndDate.setDate(fallbackTrialEndDate.getDate() + 5); // 5-day trial for production plan
    trialEndDate = fallbackTrialEndDate;
    
    // Save the calculated trial end date to database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { trialEndDate: fallbackTrialEndDate },
    });
    console.log(`📝 Saved calculated trial end date (5-day fallback) for subscription ${subscription.id}: ${fallbackTrialEndDate.toISOString()}`);
  }
  
  if (!trialEndDate) {
    return { isExpired: false, reason: 'No trial end date set' };
  }

  const now = new Date();
  const trialEnd = new Date(trialEndDate);
  const isExpired = now > trialEnd;

  if (isExpired) {
    // Trial has expired - update status regardless of PayPal API availability
    // If PayPal API is available, check status; otherwise, mark as expired based on date
    let shouldUpdate = true;
    let paypalStatus = null;
    
    if (subscription.paypalSubscriptionId) {
      try {
        const { getSubscriptionDetails } = await import('./paypalService.js');
        const paypalDetails = await getSubscriptionDetails(subscription.paypalSubscriptionId);
        paypalStatus = paypalDetails.status;

        // If PayPal says it's still ACTIVE but trial expired, it might be a timing issue
        // Still update to expired since our trial period has passed
        if (paypalStatus === 'SUSPENDED' || paypalStatus === 'EXPIRED') {
          shouldUpdate = true;
        } else if (paypalStatus === 'ACTIVE') {
          // PayPal says active but trial expired - might be waiting for payment
          // Still mark as expired since trial period is over
          shouldUpdate = true;
        }
      } catch (error: any) {
        console.warn(`Could not check PayPal status:`, error.message);
        // PayPal API failed, but trial expired - update anyway
        shouldUpdate = true;
      }
    }
    
    if (shouldUpdate) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'expired',
          updatedAt: new Date(),
        },
      });

      return { isExpired: true, paypalStatus, updated: true, trialEndDate };
    }
  }

  return { isExpired, trialEndDate };
}

