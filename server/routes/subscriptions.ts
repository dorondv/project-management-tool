import { Router } from 'express';
import { prisma } from '../index.js';
import {
  getUserSubscription,
  linkPayPalSubscription,
  checkSubscriptionAccess,
  createSubscription,
  calculateTrialEndDate,
  getUserStatus,
} from '../utils/subscriptionService.js';
import { getPayPalClientId, getPayPalPlanId, getPayPalTransactionUrl, getPayPalSubscriptionUrl } from '../utils/paypalService.js';
import { checkSubscriptionTrialExpiration } from '../utils/trialExpirationService.js';
import {
  emitSubscriptionStatusUpdated,
} from '../utils/socketService.js';

const router = Router();

/**
 * Middleware to get user from Supabase token
 * This should be implemented based on your auth setup
 */
async function authenticateUser(req: any, res: any, next: any) {
  try {
    // TODO: Implement Supabase token verification
    // For now, we'll get userId from query/body or headers
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = userId;
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// GET /api/subscriptions/status - Get current user's subscription status
router.get('/status', authenticateUser, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const subscription = await getUserSubscription(req.userId);
    
    if (!subscription) {
      return res.json({
        subscription: null,
        access: {
          hasFullAccess: false,
          canAccessSettings: true,
          canAccessPricing: true,
          expirationDate: null,
          status: 'none',
        },
        userStatus: 'Churned',
      });
    }

    const access = checkSubscriptionAccess(subscription);
    const userStatus = getUserStatus(subscription);

    res.json({
      subscription,
      access,
      userStatus,
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// GET /api/subscriptions/client-id - Get PayPal Client ID, environment, and plan IDs
router.get('/client-id', async (req, res) => {
  try {
    const clientId = getPayPalClientId();
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const { getPayPalPlanId } = await import('../utils/paypalService.js');
    
    res.json({ 
      clientId,
      mode, // Return mode so frontend knows if it's sandbox or production
      planIds: {
        monthly: getPayPalPlanId('monthly'),
        annual: getPayPalPlanId('annual'),
      }
    });
  } catch (error: any) {
    console.error('Error getting PayPal Client ID:', error);
    res.status(500).json({ 
      error: 'Failed to get PayPal Client ID',
      message: error.message || 'PayPal Client ID not configured. Please set PAYPAL_CLIENT_ID in your .env file.',
      details: 'Add PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and PAYPAL_MODE to your .env file'
    });
  }
});

// POST /api/subscriptions/link - Link PayPal subscription to user
router.post('/link', authenticateUser, async (req, res) => {
  try {
    const { subscriptionID, planType } = req.body;

    console.log('Linking subscription request:', {
      subscriptionID,
      planType,
      userId: req.userId
    });

    if (!subscriptionID || !planType) {
      console.error('Missing required fields:', { subscriptionID: !!subscriptionID, planType: !!planType });
      return res.status(400).json({ error: 'subscriptionID and planType are required' });
    }

    if (planType !== 'monthly' && planType !== 'annual') {
      return res.status(400).json({ error: 'planType must be "monthly" or "annual"' });
    }

    // Check for duplicate trial prevention: Block new monthly trial if user already had one
    if (planType === 'monthly') {
      const existingSubscription = await getUserSubscription(req.userId!);
      
      if (existingSubscription) {
        // Check if user already has/had a monthly subscription
        const hasMonthlySubscription = existingSubscription.planType === 'monthly';
        
        if (hasMonthlySubscription) {
          // Check if it's a trial (no payments yet)
          const hasPayments = existingSubscription.billingHistory && existingSubscription.billingHistory.length > 0;
          
          if (!hasPayments) {
            // User already has an active monthly trial - block new trial
            return res.status(400).json({ 
              error: 'You already have an active monthly trial subscription. Please cancel it first or wait for it to end.',
              code: 'DUPLICATE_TRIAL'
            });
          }
          
          // If user has payments, they can upgrade/renew, but check status
          if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
            return res.status(400).json({ 
              error: 'You already have an active monthly subscription. Please cancel it first before starting a new one.',
              code: 'ACTIVE_SUBSCRIPTION_EXISTS'
            });
          }
        }
      }
    }
    
    // Annual plans: Allow upgrade from monthly (will cancel monthly subscription automatically)
    // If user has annual already, block new annual (they should cancel first)
    if (planType === 'annual') {
      const existingSubscription = await getUserSubscription(req.userId!);
      
      if (existingSubscription && existingSubscription.planType === 'annual') {
        const hasPayments = existingSubscription.billingHistory && existingSubscription.billingHistory.length > 0;
        
        if (!hasPayments && (existingSubscription.status === 'active' || existingSubscription.status === 'trialing')) {
          // User already has an active annual trial - block new trial
          return res.status(400).json({ 
            error: 'You already have an active annual trial subscription. Please cancel it first or wait for it to end.',
            code: 'DUPLICATE_TRIAL'
          });
        }
        
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
          return res.status(400).json({ 
            error: 'You already have an active annual subscription. Please cancel it first before starting a new one.',
            code: 'ACTIVE_SUBSCRIPTION_EXISTS'
          });
        }
      }
      // If user has monthly, allow upgrade to annual (will cancel monthly automatically)
    }

    const subscription = await linkPayPalSubscription(req.userId!, subscriptionID, planType);

    console.log('Subscription linked successfully:', subscription.id);

    // Emit WebSocket event for successful subscription link
    emitSubscriptionStatusUpdated(req.userId!, {
      subscriptionId: subscription.id,
      status: subscription.status,
      planType: subscription.planType,
    });

    res.json({
      success: true,
      subscription,
      message: 'Subscription linked successfully',
    });
  } catch (error: any) {
    console.error('Error linking subscription:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to link subscription', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/subscriptions/cancel - Cancel user's subscription
router.post('/cancel', authenticateUser, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const subscription = await getUserSubscription(req.userId);

    if (!subscription || !subscription.paypalSubscriptionId) {
      return res.status(404).json({ error: 'No active PayPal subscription found' });
    }

    // Try to cancel in PayPal, but don't fail if PayPal API is unavailable
    let paypalCancelled = false;
    let paypalError: string | null = null;

    try {
      const { cancelSubscription } = await import('../utils/paypalService.js');
      await cancelSubscription(subscription.paypalSubscriptionId, req.body.reason);
      paypalCancelled = true;
      console.log(`✅ Successfully cancelled PayPal subscription: ${subscription.paypalSubscriptionId}`);
    } catch (error: any) {
      console.error('⚠️  Failed to cancel subscription in PayPal:', error.message);
      paypalError = error.message;
      
      // Check if it's an authentication error (invalid_client)
      if (error.message?.includes('invalid_client') || error.message?.includes('Client Authentication failed')) {
        console.warn('⚠️  PayPal API authentication failed. Subscription will be marked as cancelled in database, but PayPal cancellation may need to be done manually.');
        paypalError = 'PayPal API authentication failed. Subscription marked as cancelled in our system. Please cancel manually in PayPal if needed.';
      }
      
      // Continue with database update even if PayPal cancellation fails
      // User can manually cancel in PayPal if needed
    }

    // Update subscription status in database regardless of PayPal API result
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', updatedAt: new Date() },
    });

    // Emit WebSocket event for subscription cancellation
    emitSubscriptionStatusUpdated(req.userId, {
      subscriptionId: subscription.id,
      status: 'cancelled',
      planType: subscription.planType,
    });

    // Return success with warning if PayPal cancellation failed
    if (paypalCancelled) {
      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } else {
      res.json({
        success: true,
        message: 'Subscription marked as cancelled in our system',
        warning: paypalError || 'PayPal cancellation may need to be done manually',
        paypalSubscriptionId: subscription.paypalSubscriptionId, // Include so user can cancel manually if needed
      });
    }
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
});

// GET /api/subscriptions/billing-history - Get billing history
router.get('/billing-history', authenticateUser, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const subscription = await getUserSubscription(req.userId);

    if (!subscription) {
      return res.json([]);
    }

    const billingHistory = await prisma.billingHistory.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { paymentDate: 'desc' },
      include: {
        subscription: {
          select: {
            paypalSubscriptionId: true,
            planType: true,
          },
        },
      },
    });

    // Add PayPal invoice URLs for transactions that have PayPal transaction IDs
    const billingHistoryWithUrls = billingHistory.map((item) => {
      // If invoiceUrl is already set, use it; otherwise generate PayPal transaction URL
      let invoiceUrl = item.invoiceUrl;
      
      if (!invoiceUrl && item.paypalTransactionId) {
        try {
          invoiceUrl = getPayPalTransactionUrl(item.paypalTransactionId);
        } catch (error) {
          console.error('Error generating PayPal transaction URL:', error);
        }
      }

      return {
        ...item,
        invoiceUrl,
        // Add PayPal subscription URL if available
        paypalSubscriptionUrl: subscription.paypalSubscriptionId 
          ? (() => {
              try {
                return getPayPalSubscriptionUrl(subscription.paypalSubscriptionId);
              } catch (error) {
                return null;
              }
            })()
          : null,
      };
    });

    res.json(billingHistoryWithUrls);
  } catch (error: any) {
    console.error('Error getting billing history:', error);
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

// POST /api/subscriptions/redeem-coupon - Redeem trial coupon
router.post('/redeem-coupon', authenticateUser, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    // Check if user already has active subscription
    const existingSubscription = await getUserSubscription(req.userId);
    if (existingSubscription) {
      const access = checkSubscriptionAccess(existingSubscription);
      if (access.hasFullAccess) {
        return res.status(400).json({ error: 'User already has an active subscription' });
      }
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    }

    // Check coupon validity
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Check usage limit
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    // Calculate end date
    const endDate = calculateTrialEndDate(coupon.trialDays);

    // Create or update subscription
    let subscription;
    if (existingSubscription) {
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planType: 'trial',
          status: 'active',
          price: 0,
          couponCode: coupon.code,
          couponId: coupon.id,
          isTrialCoupon: true,
          startDate: new Date(),
          endDate: endDate,
          updatedAt: new Date(),
        },
      });
    } else {
      subscription = await createSubscription(req.userId, 'trial', {
        price: 0,
        couponCode: coupon.code,
        couponId: coupon.id,
        isTrialCoupon: true,
        endDate: endDate,
      });
    }

    // Increment coupon usage
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { currentUses: { increment: 1 } },
    });

    res.json({
      success: true,
      subscription,
      message: `Trial activated for ${coupon.trialDays} days`,
    });
  } catch (error: any) {
    console.error('Error redeeming coupon:', error);
    res.status(500).json({ error: 'Failed to redeem coupon', details: error.message });
  }
});

// GET /api/subscriptions/check-access - Check if user has active access
router.get('/check-access', authenticateUser, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const subscription = await getUserSubscription(req.userId);
    
    // Check if trial has expired and update status if needed
    if (subscription && subscription.paypalSubscriptionId) {
      try {
        await checkSubscriptionTrialExpiration(subscription.id);
        // Reload subscription after potential update
        const updatedSubscription = await getUserSubscription(req.userId);
        if (!updatedSubscription) {
          return res.json({
            hasAccess: false,
            access: { hasFullAccess: false },
            userStatus: 'Churned',
          });
        }
        const access = checkSubscriptionAccess(updatedSubscription);
        const userStatus = getUserStatus(updatedSubscription);

        return res.json({
          hasAccess: access.hasFullAccess,
          access,
          userStatus,
        });
      } catch (error: any) {
        console.warn('Could not check trial expiration:', error.message);
        // Continue with original subscription
      }
    }
    
    if (!subscription) {
      return res.json({
        hasAccess: false,
        access: { hasFullAccess: false },
        userStatus: 'Churned',
      });
    }
    
    const access = checkSubscriptionAccess(subscription);
    const userStatus = getUserStatus(subscription);

    res.json({
      hasAccess: access.hasFullAccess,
      access,
      userStatus,
    });
  } catch (error: any) {
    console.error('Error checking access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// POST /api/subscriptions/check-trial-expiration - Manually check and update trial expiration
router.post('/check-trial-expiration', authenticateUser, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    const subscription = await getUserSubscription(req.userId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const result = await checkSubscriptionTrialExpiration(subscription.id);
    
    // Reload subscription after update
    const updatedSubscription = await getUserSubscription(req.userId);
    
    res.json({
      success: true,
      result,
      subscription: updatedSubscription,
    });
  } catch (error: any) {
    console.error('Error checking trial expiration:', error);
    res.status(500).json({ error: 'Failed to check trial expiration', details: error.message });
  }
});

export const subscriptionsRouter = router;

