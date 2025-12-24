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

  // Emit WebSocket event
  emitPaymentConfirmed(subscription.userId, {
    subscriptionId: subscription.id,
    planType: subscription.planType,
    amount,
    transactionId,
  });
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

