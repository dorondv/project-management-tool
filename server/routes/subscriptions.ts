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
import { getPayPalClientId, getPayPalPlanId } from '../utils/paypalService.js';
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

// GET /api/subscriptions/client-id - Get PayPal Client ID and environment
router.get('/client-id', async (req, res) => {
  try {
    const clientId = getPayPalClientId();
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    res.json({ 
      clientId,
      mode // Return mode so frontend knows if it's sandbox or production
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

    const subscription = await linkPayPalSubscription(req.userId, subscriptionID, planType);

    console.log('Subscription linked successfully:', subscription.id);

    // Emit WebSocket event for successful subscription link
    emitSubscriptionStatusUpdated(req.userId, {
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
    const subscription = await getUserSubscription(req.userId);

    if (!subscription || !subscription.paypalSubscriptionId) {
      return res.status(404).json({ error: 'No active PayPal subscription found' });
    }

    // Import PayPal service functions
    const { cancelSubscription } = await import('../utils/paypalService.js');
    
    await cancelSubscription(subscription.paypalSubscriptionId, req.body.reason);

    // Update subscription status in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', updatedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
});

// GET /api/subscriptions/billing-history - Get billing history
router.get('/billing-history', authenticateUser, async (req, res) => {
  try {
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
    const subscription = await getUserSubscription(req.userId);
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

export const subscriptionsRouter = router;

