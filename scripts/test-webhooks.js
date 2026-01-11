#!/usr/bin/env node

/**
 * Webhook Testing & Monitoring Script
 * 
 * This script helps you:
 * 1. Check recent webhook events from PayPal
 * 2. Verify webhook processing status
 * 3. Monitor subscription and billing status
 * 4. Test webhook endpoint connectivity
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkRecentWebhooks(limit = 10) {
  log('\n📥 Recent Webhook Events:', 'bright');
  log('═'.repeat(80), 'cyan');
  
  try {
    const webhooks = await prisma.paymentWebhook.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (webhooks.length === 0) {
      log('⚠️  No webhooks found in database.', 'yellow');
      log('   This could mean:', 'yellow');
      log('   1. No webhooks have been received yet', 'yellow');
      log('   2. PayPal webhook URL is not configured correctly', 'yellow');
      log('   3. ngrok tunnel is not running or not pointing to port 3001', 'yellow');
      return;
    }

    webhooks.forEach((webhook, index) => {
      const status = webhook.processed ? '✅ Processed' : '⏳ Pending';
      const statusColor = webhook.processed ? 'green' : 'yellow';
      const errorColor = webhook.error ? 'red' : 'reset';
      
      log(`\n${index + 1}. ${webhook.eventType}`, 'bright');
      log(`   Status: ${status}`, statusColor);
      log(`   PayPal Event ID: ${webhook.paypalEventId}`, 'cyan');
      log(`   Received: ${webhook.createdAt.toLocaleString()}`, 'cyan');
      
      if (webhook.processedAt) {
        log(`   Processed: ${webhook.processedAt.toLocaleString()}`, 'green');
      }
      
      if (webhook.error) {
        log(`   ❌ Error: ${webhook.error}`, 'red');
      }
      
      // Show subscription ID if available in payload
      try {
        const payload = typeof webhook.payload === 'string' 
          ? JSON.parse(webhook.payload) 
          : webhook.payload;
        
        if (payload.resource?.id) {
          log(`   Resource ID: ${payload.resource.id}`, 'blue');
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
  } catch (error) {
    log(`❌ Error fetching webhooks: ${error.message}`, 'red');
  }
}

async function checkWebhookStats() {
  log('\n📊 Webhook Statistics:', 'bright');
  log('═'.repeat(80), 'cyan');
  
  try {
    const total = await prisma.paymentWebhook.count();
    const processed = await prisma.paymentWebhook.count({
      where: { processed: true },
    });
    const pending = await prisma.paymentWebhook.count({
      where: { processed: false },
    });
    const errors = await prisma.paymentWebhook.count({
      where: { error: { not: null } },
    });

    log(`Total webhooks: ${total}`, total > 0 ? 'green' : 'yellow');
    log(`✅ Processed: ${processed}`, 'green');
    log(`⏳ Pending: ${pending}`, pending > 0 ? 'yellow' : 'green');
    log(`❌ Errors: ${errors}`, errors > 0 ? 'red' : 'green');

    // Event type breakdown
    const eventTypes = await prisma.paymentWebhook.groupBy({
      by: ['eventType'],
      _count: { eventType: true },
      orderBy: { _count: { eventType: 'desc' } },
    });

    if (eventTypes.length > 0) {
      log('\nEvent Type Breakdown:', 'bright');
      eventTypes.forEach(({ eventType, _count }) => {
        log(`  ${eventType}: ${_count.eventType}`, 'cyan');
      });
    }
  } catch (error) {
    log(`❌ Error fetching stats: ${error.message}`, 'red');
  }
}

async function checkSubscriptions() {
  log('\n💳 Active Subscriptions:', 'bright');
  log('═'.repeat(80), 'cyan');
  
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (subscriptions.length === 0) {
      log('⚠️  No subscriptions found.', 'yellow');
      return;
    }

    subscriptions.forEach((sub, index) => {
      const statusColors = {
        active: 'green',
        trialing: 'cyan',
        cancelled: 'yellow',
        expired: 'red',
        free: 'blue',
      };
      
      log(`\n${index + 1}. ${sub.user.email}`, 'bright');
      log(`   Plan: ${sub.planType} | Status: ${sub.status}`, statusColors[sub.status] || 'reset');
      log(`   PayPal Subscription ID: ${sub.paypalSubscriptionId || 'N/A'}`, 'cyan');
      log(`   Start Date: ${sub.startDate.toLocaleDateString()}`, 'cyan');
      
      if (sub.endDate) {
        log(`   End Date: ${sub.endDate.toLocaleDateString()}`, 'cyan');
      }
      
      if (sub.trialEndDate) {
        const daysLeft = Math.ceil((sub.trialEndDate - new Date()) / (1000 * 60 * 60 * 24));
        log(`   Trial Ends: ${sub.trialEndDate.toLocaleDateString()} (${daysLeft} days left)`, 'cyan');
      }
    });
  } catch (error) {
    log(`❌ Error fetching subscriptions: ${error.message}`, 'red');
  }
}

async function checkBillingHistory() {
  log('\n💰 Recent Billing History:', 'bright');
  log('═'.repeat(80), 'cyan');
  
  try {
    const billing = await prisma.billingHistory.findMany({
      include: {
        subscription: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    if (billing.length === 0) {
      log('⚠️  No billing history found.', 'yellow');
      return;
    }

    billing.forEach((bill, index) => {
      const statusColors = {
        paid: 'green',
        pending: 'yellow',
        failed: 'red',
        refunded: 'red',
      };
      
      log(`\n${index + 1}. ${bill.subscription.user.email}`, 'bright');
      log(`   Amount: $${bill.amount} ${bill.currency}`, 'green');
      log(`   Status: ${bill.status}`, statusColors[bill.status] || 'reset');
      log(`   Date: ${bill.paymentDate.toLocaleDateString()}`, 'cyan');
      log(`   Invoice: ${bill.invoiceNumber}`, 'cyan');
      
      if (bill.paypalTransactionId) {
        log(`   PayPal Transaction: ${bill.paypalTransactionId}`, 'blue');
      }
    });
  } catch (error) {
    log(`❌ Error fetching billing history: ${error.message}`, 'red');
  }
}

async function checkWebhookConfiguration() {
  log('\n⚙️  Webhook Configuration:', 'bright');
  log('═'.repeat(80), 'cyan');
  
  const webhookUrl = process.env.PAYPAL_WEBHOOK_URL || 
    `https://expert-primarily-ringtail.ngrok-free.app/api/payments/webhook`;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const port = process.env.PORT || 3001;
  
  log(`PayPal Mode: ${mode}`, mode === 'live' ? 'green' : 'yellow');
  log(`Backend Port: ${port}`, 'cyan');
  log(`Webhook URL: ${webhookUrl}`, webhookId ? 'green' : 'yellow');
  log(`Webhook ID: ${webhookId || '⚠️  Not configured'}`, webhookId ? 'green' : 'yellow');
  
  log('\n📝 Configuration Checklist:', 'bright');
  log(`  ${process.env.PAYPAL_CLIENT_ID ? '✅' : '❌'} PayPal Client ID configured`, 
    process.env.PAYPAL_CLIENT_ID ? 'green' : 'red');
  log(`  ${process.env.PAYPAL_CLIENT_SECRET ? '✅' : '❌'} PayPal Client Secret configured`, 
    process.env.PAYPAL_CLIENT_SECRET ? 'green' : 'red');
  log(`  ${webhookId ? '✅' : '⚠️ '} PayPal Webhook ID configured`, 
    webhookId ? 'green' : 'yellow');
  
  log('\n🔗 Next Steps:', 'bright');
  log('  1. Make sure ngrok is running: ngrok http --url=expert-primarily-ringtail.ngrok-free.app 3001', 'cyan');
  log('  2. Configure webhook in PayPal Dashboard:', 'cyan');
  log(`     URL: ${webhookUrl}`, 'cyan');
  log('  3. Add webhook events: BILLING.SUBSCRIPTION.*, PAYMENT.SALE.*, PAYMENT.CAPTURE.REFUNDED', 'cyan');
  log('  4. Copy Webhook ID from PayPal and add to .env: PAYPAL_WEBHOOK_ID=your_id', 'cyan');
}

async function testWebhookEndpoint() {
  log('\n🧪 Testing Webhook Endpoint:', 'bright');
  log('═'.repeat(80), 'cyan');
  
  const webhookUrl = process.env.PAYPAL_WEBHOOK_URL || 
    `https://expert-primarily-ringtail.ngrok-free.app/api/payments/webhook`;
  
  try {
    // Test if endpoint is reachable
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        event_type: 'TEST',
      }),
    });

    if (response.ok || response.status === 200) {
      log('✅ Webhook endpoint is reachable', 'green');
    } else {
      log(`⚠️  Webhook endpoint returned status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Cannot reach webhook endpoint: ${error.message}`, 'red');
    log('   Make sure:', 'yellow');
    log('   1. Backend server is running on port 3001', 'yellow');
    log('   2. ngrok tunnel is active', 'yellow');
    log('   3. Webhook URL is correct', 'yellow');
  }
}

async function main() {
  log('\n🔍 PayPal Webhook Test & Monitor', 'bright');
  log('═'.repeat(80), 'cyan');
  
  try {
    await checkWebhookConfiguration();
    await testWebhookEndpoint();
    await checkWebhookStats();
    await checkRecentWebhooks(10);
    await checkSubscriptions();
    await checkBillingHistory();
    
    log('\n✅ Test complete!', 'green');
    log('\n💡 Tip: Run this script after making a test payment to see webhook activity.', 'cyan');
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

