#!/usr/bin/env node

/**
 * Test PayPal Webhook Connection
 * 
 * This script helps test if your webhook endpoint is properly configured
 * and can receive webhooks from PayPal
 */

import 'dotenv/config';

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

async function testWebhookEndpoint() {
  log('\n🧪 Testing Webhook Endpoint', 'bright');
  log('═'.repeat(70), 'cyan');

  const webhookUrl = process.env.PAYPAL_WEBHOOK_URL || 
    'https://expert-primarily-ringtail.ngrok-free.app/api/payments/webhook';

  log(`\n📡 Webhook URL: ${webhookUrl}`, 'cyan');

  // Test 1: Check if endpoint is reachable
  log('\n✅ Test 1: Endpoint Reachability', 'bright');
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PayPal-Transmission-Id': 'test-transmission-id',
        'PayPal-Transmission-Time': new Date().toISOString(),
        'PayPal-Transmission-Sig': 'test-signature',
        'PayPal-Cert-Url': 'https://api.paypal.com/v1/notifications/certs/test',
        'PayPal-Auth-Algo': 'SHA256withRSA',
      },
      body: JSON.stringify({
        id: 'test-webhook-event',
        event_type: 'TEST.WEBHOOK',
        event_version: '1.0',
        create_time: new Date().toISOString(),
        resource_type: 'test',
        resource: {
          id: 'test-resource-id',
        },
      }),
    });

    if (response.ok || response.status === 200) {
      log('  ✅ Endpoint is reachable and responding', 'green');
      log(`  Status: ${response.status}`, 'cyan');
      const data = await response.json().catch(() => ({}));
      log(`  Response: ${JSON.stringify(data)}`, 'cyan');
    } else {
      log(`  ⚠️  Endpoint returned status: ${response.status}`, 'yellow');
      const text = await response.text();
      log(`  Response: ${text.substring(0, 200)}`, 'yellow');
    }
  } catch (error) {
    log(`  ❌ Cannot reach webhook endpoint: ${error.message}`, 'red');
    log('  Make sure:', 'yellow');
    log('    1. Backend server is running on port 3001', 'yellow');
    log('    2. ngrok tunnel is active', 'yellow');
    log('    3. Webhook URL is correct', 'yellow');
    return false;
  }

  // Test 2: Check configuration
  log('\n✅ Test 2: Configuration Check', 'bright');
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const mode = process.env.PAYPAL_MODE;
  
  log(`  PayPal Mode: ${mode}`, mode === 'live' ? 'green' : 'yellow');
  log(`  Webhook ID: ${webhookId || '⚠️  NOT SET'}`, webhookId ? 'green' : 'yellow');
  
  if (!webhookId) {
    log('\n  ⚠️  PAYPAL_WEBHOOK_ID not set in .env', 'yellow');
    log('  Add it after configuring webhook in PayPal Dashboard', 'yellow');
  }

  // Test 3: Check server logs suggestion
  log('\n✅ Test 3: How to Monitor', 'bright');
  log('  Watch your server logs for:', 'cyan');
  log('    📥 PayPal webhook received: [event_type]', 'cyan');
  log('    🔄 Processing webhook: [event_type]', 'cyan');
  log('    ✅ Webhook processed: [event_type]', 'cyan');

  return true;
}

async function showTestingOptions() {
  log('\n📋 Ways to Test Webhooks', 'bright');
  log('═'.repeat(70), 'cyan');

  log('\n1️⃣  Create a New Subscription (Recommended)', 'bright');
  log('   - Go to your pricing page', 'cyan');
  log('   - Select a plan and complete payment', 'cyan');
  log('   - This will trigger: BILLING.SUBSCRIPTION.CREATED', 'cyan');
  log('   - Check server logs and PayPal Dashboard', 'cyan');

  log('\n2️⃣  Cancel an Existing Subscription', 'bright');
  log('   - Go to Settings → Subscription Status', 'cyan');
  log('   - Click "Cancel Subscription"', 'cyan');
  log('   - This will trigger: BILLING.SUBSCRIPTION.CANCELLED', 'cyan');
  log('   - Check server logs and PayPal Dashboard', 'cyan');

  log('\n3️⃣  Use PayPal Webhook Simulator (If Available)', 'bright');
  log('   - Go to PayPal Developer Dashboard', 'cyan');
  log('   - Click your app → Webhooks → Test Webhook', 'cyan');
  log('   - Send a test event', 'cyan');
  log('   - Check your server logs', 'cyan');

  log('\n4️⃣  Check PayPal Dashboard', 'bright');
  log('   - Go to: https://developer.paypal.com/dashboard/applications/live', 'cyan');
  log('   - Click your app → "Webhook Events" tab', 'cyan');
  log('   - Look for events with status "Delivered"', 'cyan');
  log('   - If status is "Failed", check the error message', 'cyan');

  log('\n5️⃣  Run Webhook Monitor Script', 'bright');
  log('   - Run: node scripts/test-webhooks.js', 'cyan');
  log('   - This shows all webhooks received in your database', 'cyan');
}

async function main() {
  log('\n🔍 PayPal Webhook Connection Test', 'bright');
  log('═'.repeat(70), 'cyan');

  const endpointReachable = await testWebhookEndpoint();
  
  if (endpointReachable) {
    await showTestingOptions();
    
    log('\n✅ Ready to Test!', 'green');
    log('\n💡 Next Steps:', 'bright');
    log('   1. Make sure your backend server is running', 'cyan');
    log('   2. Make sure ngrok is running: ngrok http --url=expert-primarily-ringtail.ngrok-free.app 3001', 'cyan');
    log('   3. Create a test subscription or cancel one', 'cyan');
    log('   4. Watch your server logs for webhook events', 'cyan');
    log('   5. Run: node scripts/test-webhooks.js to see received webhooks', 'cyan');
  } else {
    log('\n❌ Webhook endpoint is not reachable', 'red');
    log('   Fix the issues above before testing', 'yellow');
  }
}

main();

