import { Router } from 'express';
import { prisma } from '../index.js';
import {
  getUserStatus,
  checkSubscriptionAccess,
  createSubscription,
  calculateTrialEndDate,
} from '../utils/subscriptionService.js';
import {
  cancelSubscription,
  suspendSubscription,
  reactivateSubscription,
  refundTransaction,
  getSubscriptionDetails,
} from '../utils/paypalService.js';
import { checkAndUpdateExpiredTrials } from '../utils/trialExpirationService.js';

const router = Router();

/**
 * Middleware to authenticate and check admin role
 */
async function requireAdmin(req: any, res: any, next: any) {
  try {
    // TODO: Implement Supabase token verification
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.userId = userId;
    next();
  } catch (error: any) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Apply admin middleware to all routes
router.use(requireAdmin);

// GET /api/admin/users - List all users with subscription data
router.get('/users', async (req, res) => {
  try {
    // Check for expired trials before returning users
    // This ensures we catch any trials that expired but weren't updated via webhook
    try {
      await checkAndUpdateExpiredTrials();
    } catch (error: any) {
      console.warn('Warning: Could not check expired trials:', error.message);
      // Continue anyway - don't fail the request
    }

    const users = await prisma.user.findMany({
      include: {
        subscription: {
          include: {
            billingHistory: {
              orderBy: { paymentDate: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch PayPal subscription details for users with PayPal subscriptions to get trial period info
    const { getSubscriptionDetails } = await import('../utils/paypalService.js');
    const { extractTrialEndDateFromPayPal } = await import('../utils/subscriptionService.js');

    // Format user data with required fields
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const subscription = user.subscription;
        const firstPayment = subscription?.billingHistory?.[0];
        const totalPaid = subscription?.billingHistory
          ?.filter((bh) => bh.status === 'paid' || bh.status === 'refunded')
          .reduce((sum, bh) => sum + (bh.amount - (bh.refundedAmount || 0)), 0) || 0;

        // Check if user is in PayPal trial period (has subscription but no payments yet)
        // IMPORTANT: Trial coupons are NOT PayPal trials, even if they have a paypalSubscriptionId
        const isPayPalTrial = !subscription?.isTrialCoupon && // Exclude trial coupons
                              subscription?.paypalSubscriptionId && 
                              subscription?.status === 'active' && 
                              (!subscription.billingHistory || subscription.billingHistory.length === 0);

        // Fetch PayPal trial end date if we don't have it
        let paypalTrialEndDate = subscription?.trialEndDate;
        if (isPayPalTrial && subscription?.paypalSubscriptionId && !paypalTrialEndDate) {
          try {
            const paypalDetails = await getSubscriptionDetails(subscription.paypalSubscriptionId);
            paypalTrialEndDate = extractTrialEndDateFromPayPal(paypalDetails);
            
            // Update database with trial end date if we got it from PayPal
            if (paypalTrialEndDate && subscription) {
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: { trialEndDate: paypalTrialEndDate },
              });
              // Update local subscription object
              subscription.trialEndDate = paypalTrialEndDate;
            }
          } catch (error: any) {
            console.warn(`Could not fetch PayPal details for user ${user.id}:`, error.message);
            
            // Fallback: Calculate trial end date from start date + 5 days (production plan trial)
            // Production plan (P-771756107T669132ENFBLY7Y) has 5-day trial period
            if (subscription?.startDate && !paypalTrialEndDate) {
              const startDate = new Date(subscription.startDate);
              const fallbackTrialEndDate = new Date(startDate);
              fallbackTrialEndDate.setDate(fallbackTrialEndDate.getDate() + 5); // 5-day trial for production plan
              paypalTrialEndDate = fallbackTrialEndDate;
              console.log(`Using fallback trial end date (5-day) for user ${user.id}: ${fallbackTrialEndDate.toISOString()}`);
            }
          }
        }
        
        // If still no trial end date but we know it's a PayPal trial, use start date + 5 days
        // Production plan (P-771756107T669132ENFBLY7Y) has 5-day trial period
        if (isPayPalTrial && !paypalTrialEndDate && subscription?.startDate) {
          const startDate = new Date(subscription.startDate);
          const fallbackTrialEndDate = new Date(startDate);
          fallbackTrialEndDate.setDate(fallbackTrialEndDate.getDate() + 5); // 5-day trial for production plan
          paypalTrialEndDate = fallbackTrialEndDate;
          
          // Save the calculated trial end date to database if not already set
          if (!subscription.trialEndDate && subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { trialEndDate: fallbackTrialEndDate },
            });
            subscription.trialEndDate = fallbackTrialEndDate;
            console.log(`📝 Saved calculated trial end date (5-day) for subscription ${subscription.id}: ${fallbackTrialEndDate.toISOString()}`);
          }
        }

        // Check if trial has expired but status hasn't been updated
        if (isPayPalTrial && paypalTrialEndDate) {
          const now = new Date();
          const trialEnd = new Date(paypalTrialEndDate);
          if (now > trialEnd && subscription.status === 'active') {
            // Trial expired but status not updated - update it now
            try {
              const { checkSubscriptionTrialExpiration } = await import('../utils/trialExpirationService.js');
              const result = await checkSubscriptionTrialExpiration(subscription.id);
              
              // Reload subscription after update
              const updatedSubscription = await prisma.subscription.findUnique({
                where: { id: subscription.id },
                include: {
                  billingHistory: {
                    orderBy: { paymentDate: 'desc' },
                  },
                },
              });
              if (updatedSubscription) {
                subscription.status = updatedSubscription.status;
                subscription.billingHistory = updatedSubscription.billingHistory;
                // Recalculate isPayPalTrial after status update
                const stillTrial = updatedSubscription.paypalSubscriptionId && 
                                  updatedSubscription.status === 'active' && 
                                  (!updatedSubscription.billingHistory || updatedSubscription.billingHistory.length === 0);
                if (!stillTrial) {
                  // No longer a trial, update local variable
                  isPayPalTrial = false;
                }
              }
            } catch (error: any) {
              console.warn(`Could not check trial expiration for user ${user.id}:`, error.message);
              // If check fails but trial expired, update status anyway
              if (subscription) {
                await prisma.subscription.update({
                  where: { id: subscription.id },
                  data: {
                    status: 'expired',
                    updatedAt: new Date(),
                  },
                });
                subscription.status = 'expired';
                isPayPalTrial = false;
              }
            }
          }
        }

        // Determine user status - override if in PayPal trial
        let userStatus = getUserStatus(subscription);
        if (isPayPalTrial) {
          userStatus = 'Free trial';
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          registrationDate: user.createdAt,
          paymentDate: firstPayment?.paymentDate || null,
          userStatus: userStatus,
          planType: subscription?.planType || null,
          totalPaid: totalPaid,
          couponUsed: !!subscription?.couponCode,
          discountAmount: subscription?.couponCode ? 0 : 0, // Coupons are for trials, not discounts
          trialEndDate: subscription?.endDate || null,
          subscription: {
            ...subscription,
            trialEndDate: paypalTrialEndDate || subscription?.trialEndDate || subscription?.endDate,
          },
          // Add expiration date and remaining days for free access
          expirationDate: subscription?.endDate || null,
          isFreeAccess: subscription?.isFreeAccess || false,
          // Add PayPal trial period info
          isPayPalTrial: isPayPalTrial,
          paypalTrialEndDate: paypalTrialEndDate || subscription?.trialEndDate || subscription?.endDate || null,
          // Add trial coupon info
          isTrialCoupon: subscription?.isTrialCoupon || false,
        };
      })
    );

    res.json(formattedUsers);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Get user details with full history
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        subscription: {
          include: {
            billingHistory: {
              orderBy: { paymentDate: 'desc' },
            },
            coupon: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// POST /api/admin/users - Manually add user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body; // Password for Supabase Auth

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // TODO: Create user in Supabase Auth first
    // For now, create user in database (assuming Supabase Auth is handled separately)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: 'contributor',
      },
    });

    res.json(user);
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// PUT /api/admin/users/:id/free-access - Grant free access to user
router.put('/users/:id/free-access', async (req, res) => {
  try {
    const { endDate, days } = req.body;
    const userId = req.params.id;

    if (!endDate && !days) {
      return res.status(400).json({ error: 'Either endDate or days is required' });
    }

    let expirationDate: Date;
    if (endDate) {
      expirationDate = new Date(endDate);
    } else {
      expirationDate = calculateTrialEndDate(days || 30);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    let subscription;
    if (existingSubscription) {
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planType: 'free',
          status: 'active',
          price: 0,
          isFreeAccess: true,
          grantedByAdminId: req.userId,
          endDate: expirationDate,
          updatedAt: new Date(),
        },
      });
    } else {
      subscription = await createSubscription(userId, 'free', {
        price: 0,
        isFreeAccess: true,
        grantedByAdminId: req.userId,
        endDate: expirationDate,
      });
    }

    res.json({
      success: true,
      subscription,
      message: `Free access granted until ${expirationDate.toISOString()}`,
    });
  } catch (error: any) {
    console.error('Error granting free access:', error);
    res.status(500).json({ error: 'Failed to grant free access', details: error.message });
  }
});

// DELETE /api/admin/users/:id/free-access - Revoke free access
router.delete('/users/:id/free-access', async (req, res) => {
  try {
    const userId = req.params.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Set endDate to past date to ensure it's expired
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Set to yesterday to ensure expiration

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'expired',
        endDate: expiredDate, // Set to past date to expire immediately
        isFreeAccess: false, // Clear the free access flag
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Free access revoked',
    });
  } catch (error: any) {
    console.error('Error revoking free access:', error);
    res.status(500).json({ error: 'Failed to revoke free access' });
  }
});

// PUT /api/admin/users/:id/role - Update user role (admin only)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role || !['admin', 'manager', 'contributor'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (admin, manager, or contributor)' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role,
      },
    });

    res.json({
      success: true,
      user: updatedUser,
      message: `User role updated to ${role}`,
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role', details: error.message });
  }
});

// GET /api/admin/subscriptions - List all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        billingHistory: {
          orderBy: { paymentDate: 'desc' },
        },
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch PayPal subscription details for subscriptions with PayPal IDs to get trial period info
    const { getSubscriptionDetails } = await import('../utils/paypalService.js');
    const { extractTrialEndDateFromPayPal } = await import('../utils/subscriptionService.js');

    const subscriptionsWithTrialInfo = await Promise.all(
      subscriptions.map(async (subscription) => {
        // IMPORTANT: Trial coupons are NOT PayPal trials, even if they have a paypalSubscriptionId
        const isPayPalTrial = !subscription.isTrialCoupon && // Exclude trial coupons
                              subscription.paypalSubscriptionId && 
                              subscription.status === 'active' && 
                              (!subscription.billingHistory || subscription.billingHistory.length === 0);
        
        let paypalTrialEndDate = subscription.trialEndDate;
        
        // If it's a PayPal trial and we don't have trialEndDate, fetch from PayPal
        if (isPayPalTrial && subscription.paypalSubscriptionId && !paypalTrialEndDate) {
          try {
            const paypalDetails = await getSubscriptionDetails(subscription.paypalSubscriptionId);
            paypalTrialEndDate = extractTrialEndDateFromPayPal(paypalDetails);
            
            // Update database with trial end date if we got it from PayPal
            if (paypalTrialEndDate) {
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: { trialEndDate: paypalTrialEndDate },
              });
            }
          } catch (error: any) {
            console.warn(`Could not fetch PayPal details for subscription ${subscription.id}:`, error.message);
            
            // Fallback: Calculate trial end date from start date + 5 days (production plan trial)
            // Production plan (P-771756107T669132ENFBLY7Y) has 5-day trial period
            if (subscription.startDate && !paypalTrialEndDate) {
              const startDate = new Date(subscription.startDate);
              const fallbackTrialEndDate = new Date(startDate);
              fallbackTrialEndDate.setDate(fallbackTrialEndDate.getDate() + 5); // 5-day trial for production plan
              paypalTrialEndDate = fallbackTrialEndDate;
            }
          }
        }
        
        // If still no trial end date but we know it's a PayPal trial, use start date + 1 day
        if (isPayPalTrial && !paypalTrialEndDate && subscription.startDate) {
          const startDate = new Date(subscription.startDate);
          const fallbackTrialEndDate = new Date(startDate);
          fallbackTrialEndDate.setDate(fallbackTrialEndDate.getDate() + 1); // 1 day trial
          paypalTrialEndDate = fallbackTrialEndDate;
        }
        
        return {
          ...subscription,
          isPayPalTrial,
          trialEndDate: paypalTrialEndDate || subscription.trialEndDate || subscription.endDate,
        };
      })
    );

    res.json(subscriptionsWithTrialInfo);
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET /api/admin/subscriptions/stats - Subscription statistics
router.get('/subscriptions/stats', async (req, res) => {
  try {
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      freeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'active', paypalSubscriptionId: { not: null } } }),
      prisma.subscription.count({ where: { planType: 'trial', status: 'active' } }),
      prisma.subscription.count({ where: { status: 'cancelled' } }),
      prisma.subscription.count({ where: { planType: 'free', status: 'active' } }),
      prisma.billingHistory.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      freeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
    });
  } catch (error: any) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ error: 'Failed to fetch subscription stats' });
  }
});

// POST /api/admin/subscriptions/:id/cancel - Cancel subscription via PayPal
router.post('/subscriptions/:id/cancel', async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: req.params.id },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!subscription.paypalSubscriptionId) {
      return res.status(400).json({ error: 'Subscription is not a PayPal subscription' });
    }

    await cancelSubscription(subscription.paypalSubscriptionId, req.body.reason);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
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

// POST /api/admin/subscriptions/:id/suspend - Suspend subscription via PayPal
router.post('/subscriptions/:id/suspend', async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: req.params.id },
    });

    if (!subscription || !subscription.paypalSubscriptionId) {
      return res.status(404).json({ error: 'PayPal subscription not found' });
    }

    await suspendSubscription(subscription.paypalSubscriptionId, req.body.reason);

    res.json({
      success: true,
      message: 'Subscription suspended successfully',
    });
  } catch (error: any) {
    console.error('Error suspending subscription:', error);
    res.status(500).json({ error: 'Failed to suspend subscription', details: error.message });
  }
});

// POST /api/admin/subscriptions/:id/activate - Reactivate subscription via PayPal
router.post('/subscriptions/:id/activate', async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: req.params.id },
    });

    if (!subscription || !subscription.paypalSubscriptionId) {
      return res.status(404).json({ error: 'PayPal subscription not found' });
    }

    // Check local database status first
    // Only allow reactivation if subscription is SUSPENDED in our database
    if (subscription.status !== 'suspended') {
      return res.status(400).json({
        error: 'Cannot reactivate subscription',
        details: `Subscription status in our database is "${subscription.status}". Only SUSPENDED subscriptions can be reactivated.`,
        currentStatus: subscription.status,
        suggestion: subscription.status === 'cancelled' 
          ? 'Cancelled subscriptions cannot be reactivated. User needs to create a new subscription.'
          : subscription.status === 'expired'
          ? 'Expired subscriptions cannot be reactivated. User needs to create a new subscription.'
          : `Subscription status "${subscription.status}" does not support reactivation.`
      });
    }

    // Check PayPal subscription status before attempting reactivation
    // PayPal only allows reactivating SUSPENDED subscriptions, not CANCELLED ones
    const { getSubscriptionDetails } = await import('../utils/paypalService.js');
    let paypalSub;
    try {
      paypalSub = await getSubscriptionDetails(subscription.paypalSubscriptionId);
    } catch (error: any) {
      console.error('Error fetching PayPal subscription details:', error);
      return res.status(400).json({ 
        error: 'Cannot reactivate subscription',
        details: 'Failed to fetch subscription status from PayPal. The subscription may have been deleted or the product ID may have changed.',
        suggestion: 'Cancelled subscriptions cannot be reactivated. User needs to create a new subscription.'
      });
    }

    const paypalStatus = paypalSub?.status?.toLowerCase();
    
    // Only allow reactivation if subscription is SUSPENDED in PayPal
    if (paypalStatus !== 'suspended') {
      return res.status(400).json({
        error: 'Cannot reactivate subscription',
        details: `PayPal subscription status is "${paypalStatus}". Only SUSPENDED subscriptions can be reactivated.`,
        currentStatus: paypalStatus,
        localStatus: subscription.status,
        suggestion: paypalStatus === 'cancelled' 
          ? 'Cancelled subscriptions cannot be reactivated. User needs to create a new subscription.'
          : `Subscription status "${paypalStatus}" does not support reactivation.`
      });
    }

    // Attempt reactivation
    await reactivateSubscription(subscription.paypalSubscriptionId, req.body.reason);

    // Update database status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event
    const { emitSubscriptionStatusUpdated } = await import('../utils/socketService.js');
    emitSubscriptionStatusUpdated(subscription.userId, {
      subscriptionId: subscription.id,
      status: 'active',
      planType: subscription.planType,
    });

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('SUBSCRIPTION_STATUS_INVALID')) {
      return res.status(400).json({ 
        error: 'Cannot reactivate subscription',
        details: 'PayPal subscription is not in a state that allows reactivation. Only SUSPENDED subscriptions can be reactivated.',
        suggestion: 'If the subscription was cancelled, the user needs to create a new subscription. If the product ID changed, the old subscription cannot be reactivated.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to reactivate subscription', 
      details: error.message 
    });
  }
});

// GET /api/admin/coupons - List all coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        subscriptions: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(coupons);
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/admin/coupons - Create new trial coupon
router.post('/coupons', async (req, res) => {
  try {
    const { code, trialDays, description, validUntil, maxUses } = req.body;

    if (!code || !trialDays) {
      return res.status(400).json({ error: 'Code and trialDays are required' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        trialDays,
        description,
        validUntil: validUntil ? new Date(validUntil) : null,
        maxUses,
        isActive: true,
      },
    });

    res.json(coupon);
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    res.status(500).json({ error: 'Failed to create coupon', details: error.message });
  }
});

// PUT /api/admin/coupons/:id - Update coupon
router.put('/coupons/:id', async (req, res) => {
  try {
    const { trialDays, description, validUntil, maxUses, isActive } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        trialDays,
        description,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        maxUses,
        isActive,
        updatedAt: new Date(),
      },
    });

    res.json(coupon);
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /api/admin/coupons/:id - Delete/deactivate coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Coupon deactivated',
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// GET /api/admin/coupons/:code/usage - Get coupon usage statistics
router.get('/coupons/:code/usage', async (req, res) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: req.params.code },
      include: {
        subscriptions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({
      coupon,
      usageCount: coupon.currentUses,
      maxUses: coupon.maxUses,
      subscriptions: coupon.subscriptions,
    });
  } catch (error: any) {
    console.error('Error fetching coupon usage:', error);
    res.status(500).json({ error: 'Failed to fetch coupon usage' });
  }
});

// GET /api/admin/payments - List all payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.billingHistory.findMany({
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/admin/payments/sync/:subscriptionId - Sync payments for a subscription from PayPal
router.post('/payments/sync/:subscriptionId', async (req, res) => {
  try {
    const { syncSubscriptionPayments } = await import('../utils/paymentSyncService.js');
    const result = await syncSubscriptionPayments(req.params.subscriptionId);
    
    res.json({
      success: true,
      message: `Synced ${result.synced} payments, skipped ${result.skipped} existing payments`,
      ...result,
    });
  } catch (error: any) {
    console.error('Error syncing payments:', error);
    res.status(500).json({ error: 'Failed to sync payments', details: error.message });
  }
});

// POST /api/admin/payments/sync-all - Sync payments for all subscriptions
router.post('/payments/sync-all', async (req, res) => {
  try {
    const { syncAllSubscriptionPayments } = await import('../utils/paymentSyncService.js');
    const result = await syncAllSubscriptionPayments();
    
    res.json({
      success: true,
      message: `Synced payments for ${result.total} subscriptions. ${result.synced} new payments added, ${result.skipped} skipped.`,
      ...result,
    });
  } catch (error: any) {
    console.error('Error syncing all payments:', error);
    res.status(500).json({ error: 'Failed to sync payments', details: error.message });
  }
});

// POST /api/admin/payments/manual - Manually add a payment record
router.post('/payments/manual', async (req, res) => {
  try {
    const { subscriptionId, invoiceNumber, paypalTransactionId, paypalSaleId, amount, currency, paymentDate, status } = req.body;

    if (!subscriptionId || !amount || !paymentDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['subscriptionId', 'amount', 'paymentDate']
      });
    }

    // Verify subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if transaction already exists
    if (paypalTransactionId) {
      const existing = await prisma.billingHistory.findUnique({
        where: { paypalTransactionId },
      });

      if (existing) {
        return res.status(400).json({ error: 'Transaction already exists', transactionId: paypalTransactionId });
      }
    }

    const { createBillingHistory } = await import('../utils/subscriptionService.js');
    
    const billingHistory = await createBillingHistory(subscriptionId, {
      invoiceNumber: invoiceNumber || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      paypalTransactionId,
      paypalSaleId,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      status: status || 'paid',
      paymentDate: new Date(paymentDate),
    });

    res.json({
      success: true,
      message: 'Payment record added successfully',
      billingHistory,
    });
  } catch (error: any) {
    console.error('Error adding manual payment:', error);
    res.status(500).json({ error: 'Failed to add payment', details: error.message });
  }
});

// GET /api/admin/payments/stats - Payment statistics
router.get('/payments/stats', async (req, res) => {
  try {
    const [
      totalPayments,
      paidPayments,
      failedPayments,
      refundedPayments,
      totalRevenue,
      totalRefunded,
    ] = await Promise.all([
      prisma.billingHistory.count(),
      prisma.billingHistory.count({ where: { status: 'paid' } }),
      prisma.billingHistory.count({ where: { status: 'failed' } }),
      prisma.billingHistory.count({ where: { status: { in: ['refunded', 'partially_refunded'] } } }),
      prisma.billingHistory.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.billingHistory.aggregate({
        where: { status: { in: ['refunded', 'partially_refunded'] } },
        _sum: { refundedAmount: true },
      }),
    ]);

    res.json({
      totalPayments,
      paidPayments,
      failedPayments,
      refundedPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalRefunded: totalRefunded._sum.refundedAmount || 0,
      netRevenue: (totalRevenue._sum.amount || 0) - (totalRefunded._sum.refundedAmount || 0),
    });
  } catch (error: any) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Failed to fetch payment stats' });
  }
});

// POST /api/admin/payments/:id/refund - Issue refund via PayPal API
router.post('/payments/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const billingHistory = await prisma.billingHistory.findUnique({
      where: { id: req.params.id },
      include: {
        subscription: true,
      },
    });

    if (!billingHistory) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!billingHistory.paypalSaleId) {
      return res.status(400).json({ error: 'Payment does not have PayPal sale ID' });
    }

    // Check if refund is within 180 days
    const paymentDate = new Date(billingHistory.paymentDate);
    const daysSincePayment = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSincePayment > 180) {
      return res.status(400).json({ 
        error: 'Refund must be issued within 180 days of payment',
        message: 'Please use PayPal dashboard to issue refund manually',
      });
    }

    const refundAmount = amount || billingHistory.amount;
    const refund = await refundTransaction(
      billingHistory.paypalSaleId,
      refundAmount,
      billingHistory.currency,
      reason
    );

    // Update billing history
    const isFullRefund = refundAmount >= billingHistory.amount;
    await prisma.billingHistory.update({
      where: { id: billingHistory.id },
      data: {
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        refundedAmount: refundAmount,
        refundedDate: new Date(),
        refundReason: reason,
      },
    });

    // If full refund, cancel subscription
    if (isFullRefund && billingHistory.subscription.paypalSubscriptionId) {
      try {
        await cancelSubscription(billingHistory.subscription.paypalSubscriptionId, reason);
        await prisma.subscription.update({
          where: { id: billingHistory.subscriptionId },
          data: {
            status: 'cancelled',
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error cancelling subscription after refund:', error);
      }
    }

    res.json({
      success: true,
      refund,
      message: `Refund of ${refundAmount} ${billingHistory.currency} processed successfully`,
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund', details: error.message });
  }
});

// GET /api/admin/payments/refund-history - Refund history
router.get('/payments/refund-history', async (req, res) => {
  try {
    const refunds = await prisma.billingHistory.findMany({
      where: {
        status: { in: ['refunded', 'partially_refunded'] },
      },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { refundedDate: 'desc' },
    });

    res.json(refunds);
  } catch (error: any) {
    console.error('Error fetching refund history:', error);
    res.status(500).json({ error: 'Failed to fetch refund history' });
  }
});

// GET /api/admin/export/users - Export users data (CSV)
router.get('/export/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        subscription: {
          include: {
            billingHistory: true,
          },
        },
      },
    });

    // Generate CSV
    const headers = [
      'User Email',
      'Registration Date',
      'Payment Date',
      'Status',
      'Plan Type',
      'Total Paid',
      'Coupon Used',
      'Discount Amount',
      'PayPal Subscription ID',
    ];

    const rows = users.map((user) => {
      const subscription = user.subscription;
      const firstPayment = subscription?.billingHistory?.[0];
      const totalPaid = subscription?.billingHistory
        ?.filter((bh) => bh.status === 'paid')
        .reduce((sum, bh) => sum + bh.amount, 0) || 0;

      return [
        user.email,
        user.createdAt.toISOString(),
        firstPayment?.paymentDate.toISOString() || '',
        getUserStatus(subscription),
        subscription?.planType || '',
        totalPaid.toString(),
        subscription?.couponCode ? 'Yes' : 'No',
        '0', // No discounts, only trial coupons
        subscription?.paypalSubscriptionId || '',
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

export const adminRouter = router;

