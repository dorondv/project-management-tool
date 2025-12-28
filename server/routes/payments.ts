import { Router } from 'express';
import { prisma } from '../index.js';
import { verifyWebhookSignature } from '../utils/paypalService.js';
import {
  createBillingHistory,
  updateBillingHistoryRefund,
  handleSubscriptionRenewal,
  linkPayPalSubscription,
} from '../utils/subscriptionService.js';
import {
  emitPaymentConfirmed,
  emitPaymentFailed,
  emitSubscriptionCancelled,
  emitSubscriptionRenewed,
  emitSubscriptionStatusUpdated,
} from '../utils/socketService.js';

const router = Router();

/**
 * POST /api/payments/webhook - PayPal webhook endpoint
 */
router.post('/webhook', async (req, res) => {
  try {
    const headers = req.headers;
    const body = JSON.stringify(req.body);
    const eventType = req.body.event_type;

    console.log('📥 PayPal webhook received:', eventType);

    // Verify webhook signature (in production, always verify)
    const isValid = verifyWebhookSignature(headers as any, body);
    if (!isValid) {
      console.warn('⚠️  Webhook signature verification failed');
      // In production, reject invalid webhooks
      // return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Store webhook event
    const webhook = await prisma.paymentWebhook.create({
      data: {
        paypalEventId: req.body.id || `event-${Date.now()}`,
        eventType: eventType,
        payload: req.body as any,
        processed: false,
      },
    });

    // Process webhook asynchronously
    processWebhook(webhook.id, req.body).catch((error) => {
      console.error('Error processing webhook:', error);
    });

    // Respond immediately to PayPal
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Process webhook event
 */
async function processWebhook(webhookId: string, payload: any) {
  try {
    const eventType = payload.event_type;
    const resource = payload.resource;

    console.log(`🔄 Processing webhook: ${eventType}`);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(resource);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(resource);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(resource);
        break;

      case 'PAYMENT.SALE.DENIED':
        await handlePaymentDenied(resource);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(resource);
        break;

      default:
        console.log(`⚠️  Unhandled webhook event type: ${eventType}`);
    }

    // Mark webhook as processed
    await prisma.paymentWebhook.update({
      where: { id: webhookId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    console.log(`✅ Webhook processed: ${eventType}`);
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    
    // Update webhook with error
    await prisma.paymentWebhook.update({
      where: { id: webhookId },
      data: {
        error: error.message,
        processedAt: new Date(),
      },
    });
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(resource: any) {
  const subscriptionId = resource.id;
  const planId = resource.plan_id;
  const subscriber = resource.subscriber;

  console.log('📝 Subscription created:', subscriptionId);

  // Find subscription by PayPal subscription ID
  const existingSubscription = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (existingSubscription) {
    // Update existing subscription
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event
    emitSubscriptionStatusUpdated(existingSubscription.userId, {
      subscriptionId: existingSubscription.id,
      status: 'active',
      planType: existingSubscription.planType,
    });
  }
  // If subscription doesn't exist, it will be created when user links it via /api/subscriptions/link
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(resource: any) {
  const subscriptionId = resource.id;

  console.log('❌ Subscription cancelled:', subscriptionId);

  const subscription = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event
    emitSubscriptionCancelled(subscription.userId, {
      subscriptionId: subscription.id,
    });
  }
}

/**
 * Handle subscription expired event
 */
async function handleSubscriptionExpired(resource: any) {
  const subscriptionId = resource.id;

  console.log('⏰ Subscription expired:', subscriptionId);

  const subscription = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'expired',
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event
    emitSubscriptionStatusUpdated(subscription.userId, {
      subscriptionId: subscription.id,
      status: 'expired',
      planType: subscription.planType,
    });
  }
}

/**
 * Handle subscription activated event
 */
async function handleSubscriptionActivated(resource: any) {
  const subscriptionId = resource.id;

  console.log('✅ Subscription activated:', subscriptionId);

  const subscription = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event
    emitSubscriptionStatusUpdated(subscription.userId, {
      subscriptionId: subscription.id,
      status: 'active',
      planType: subscription.planType,
    });
  }
}

/**
 * Handle subscription suspended event (usually happens when payment fails after trial)
 */
async function handleSubscriptionSuspended(resource: any) {
  const subscriptionId = resource.id;

  console.log('⏸️  Subscription suspended:', subscriptionId);

  const subscription = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
    include: {
      billingHistory: {
        orderBy: { paymentDate: 'desc' },
        take: 1,
      },
    },
  });

  if (subscription) {
    // Check if trial period has expired
    const now = new Date();
    const trialEndDate = subscription.trialEndDate || subscription.endDate;
    const isTrialExpired = trialEndDate ? now > new Date(trialEndDate) : false;
    const hasPayments = subscription.billingHistory && subscription.billingHistory.length > 0;

    // If trial expired and no payment received, mark as expired
    if (isTrialExpired && !hasPayments) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'expired',
          updatedAt: new Date(),
        },
      });

      // Emit WebSocket event
      emitSubscriptionStatusUpdated(subscription.userId, {
        subscriptionId: subscription.id,
        status: 'expired',
        planType: subscription.planType,
      });
      
      console.log(`✅ Updated subscription ${subscription.id} to expired (trial expired, no payment)`);
    } else {
      // Just suspended, not expired yet - store as 'suspended' status
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'suspended',
          updatedAt: new Date(),
        },
      });

      emitSubscriptionStatusUpdated(subscription.userId, {
        subscriptionId: subscription.id,
        status: 'suspended',
        planType: subscription.planType,
      });
      
      console.log(`✅ Updated subscription ${subscription.id} to suspended`);
    }
  }
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(resource: any) {
  // PayPal sale ID (for refunds) - this is resource.id
  const saleId = resource.id;
  // Transaction ID for invoice links - could be in different fields
  // Try resource.id first (sale ID), then resource.transaction_id, then resource.parent_payment
  const transactionId = resource.transaction_id || resource.parent_payment || resource.id;
  const amount = parseFloat(resource.amount?.value || '0');
  const currency = resource.amount?.currency_code || 'USD';
  const subscriptionId = resource.billing_agreement_id;

  console.log('💰 Payment completed:', { transactionId, saleId, amount, subscriptionId });

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.warn('⚠️  Subscription not found for payment:', subscriptionId);
    return;
  }

  // Create billing history record
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  await createBillingHistory(subscription.id, {
    invoiceNumber,
    paypalTransactionId: transactionId, // Use transaction ID for invoice links
    paypalSaleId: saleId, // Use sale ID for refunds
    amount,
    currency,
    status: 'paid',
    paymentDate: new Date(),
  });

  // Handle subscription renewal
  await handleSubscriptionRenewal(subscription.id);

  // If this is an annual subscription payment, check if user has any active monthly subscriptions
  // and cancel them to prevent double charging (upgrade scenario)
  if (subscription.planType === 'annual' && subscription.paypalSubscriptionId) {
    await cancelOldMonthlySubscriptions(subscription.userId, subscription.paypalSubscriptionId);
  }

  // Emit WebSocket event
  emitPaymentConfirmed(subscription.userId, {
    subscriptionId: subscription.id,
    planType: subscription.planType,
    amount,
    transactionId,
  });
}

/**
 * Cancel any old monthly subscriptions for a user after annual payment is confirmed
 * This prevents double charging when upgrading from monthly to annual
 */
async function cancelOldMonthlySubscriptions(userId: string, currentAnnualSubscriptionId: string) {
  try {
    // Find all subscriptions for this user that are monthly and have PayPal subscription IDs
    // Exclude the current annual subscription
    const monthlySubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        planType: 'monthly',
        paypalSubscriptionId: { not: null },
        status: { in: ['active', 'trialing', 'suspended'] },
        // Exclude subscriptions that are already cancelled or expired
      },
    });

    if (monthlySubscriptions.length === 0) {
      return; // No monthly subscriptions to cancel
    }

    console.log(`🔄 Found ${monthlySubscriptions.length} monthly subscription(s) to cancel after annual payment confirmation`);

    const { cancelSubscription, getSubscriptionDetails } = await import('../utils/paypalService.js');

    for (const monthlySub of monthlySubscriptions) {
      if (!monthlySub.paypalSubscriptionId) continue;

      try {
        // Check PayPal subscription status before attempting cancellation
        const paypalSub = await getSubscriptionDetails(monthlySub.paypalSubscriptionId);
        const paypalStatus = paypalSub?.status?.toLowerCase();

        // Only cancel if subscription is active or suspended in PayPal
        if (paypalStatus === 'active' || paypalStatus === 'suspended') {
          await cancelSubscription(monthlySub.paypalSubscriptionId, 'Upgraded to annual plan - payment confirmed');
          
          // Update database status
          await prisma.subscription.update({
            where: { id: monthlySub.id },
            data: {
              status: 'cancelled',
              updatedAt: new Date(),
            },
          });

          console.log(`✅ Cancelled monthly PayPal subscription ${monthlySub.paypalSubscriptionId} after annual payment confirmation`);
        } else {
          console.log(`ℹ️  Monthly subscription ${monthlySub.paypalSubscriptionId} is already ${paypalStatus}, skipping cancellation`);
          
          // Update database status to match PayPal
          if (paypalStatus === 'cancelled' || paypalStatus === 'expired') {
            await prisma.subscription.update({
              where: { id: monthlySub.id },
              data: {
                status: paypalStatus === 'cancelled' ? 'cancelled' : 'expired',
                updatedAt: new Date(),
              },
            });
          }
        }
      } catch (error: any) {
        // Handle specific PayPal API errors gracefully
        if (error.message?.includes('SUBSCRIPTION_STATUS_INVALID') || 
            error.message?.includes('422') ||
            error.message?.includes('404')) {
          console.log(`ℹ️  Monthly subscription ${monthlySub.paypalSubscriptionId} cannot be cancelled (already cancelled/expired/not found)`);
          
          // Update database status to cancelled anyway
          await prisma.subscription.update({
            where: { id: monthlySub.id },
            data: {
              status: 'cancelled',
              updatedAt: new Date(),
            },
          });
        } else {
          console.error(`⚠️  Failed to cancel monthly subscription ${monthlySub.paypalSubscriptionId}:`, error.message);
          // Don't throw - continue with other subscriptions
        }
      }
    }
  } catch (error: any) {
    console.error('⚠️  Error cancelling old monthly subscriptions:', error.message);
    // Don't throw - payment was successful, this is just cleanup
  }
}

/**
 * Handle payment denied event
 */
async function handlePaymentDenied(resource: any) {
  const transactionId = resource.id;
  const subscriptionId = resource.billing_agreement_id;

  console.log('❌ Payment denied:', transactionId);

  const subscription = await prisma.subscription.findUnique({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (subscription) {
    // Create billing history record with failed status
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    await createBillingHistory(subscription.id, {
      invoiceNumber,
      paypalTransactionId: transactionId,
      amount: 0,
      currency: 'USD',
      status: 'failed',
      paymentDate: new Date(),
    });

    // Emit WebSocket event
    emitPaymentFailed(subscription.userId, {
      subscriptionId: subscription.id,
      error: 'Payment denied by PayPal',
      transactionId,
    });
  }
}

/**
 * Handle payment refunded event
 */
async function handlePaymentRefunded(resource: any) {
  const refundId = resource.id;
  const captureId = resource.capture_id;
  const refundAmount = parseFloat(resource.amount?.value || '0');

  console.log('💸 Payment refunded:', refundId, refundAmount);

  // Find billing history by PayPal transaction ID
  const billingHistory = await prisma.billingHistory.findUnique({
    where: { paypalTransactionId: captureId },
  });

  if (billingHistory) {
    await updateBillingHistoryRefund(
      billingHistory.id,
      refundAmount,
      'Refunded via PayPal'
    );

    // If full refund, cancel subscription
    if (refundAmount >= billingHistory.amount) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: billingHistory.subscriptionId },
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'cancelled',
            updatedAt: new Date(),
          },
        });
      }
    }
  }
}

export const paymentsRouter = router;

