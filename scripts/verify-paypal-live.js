#!/usr/bin/env node

/**
 * Verify PayPal Live Mode Configuration
 * 
 * This script verifies that you're actually using PayPal Live mode
 * by making API calls and checking responses
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

async function verifyLiveMode() {
  log('\n🔍 Verifying PayPal Live Mode Configuration', 'bright');
  log('═'.repeat(70), 'cyan');

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  log('\n📋 Configuration:', 'bright');
  log(`  Mode: ${mode}`, mode === 'live' ? 'green' : 'yellow');
  log(`  API Base URL: ${baseUrl}`, 'cyan');
  log(`  Client ID: ${clientId ? clientId.substring(0, 30) + '...' : 'NOT SET'}`, clientId ? 'green' : 'red');

  if (!clientId || !clientSecret) {
    log('\n❌ Missing PayPal credentials!', 'red');
    return;
  }

  // Test 1: Get Access Token
  log('\n🧪 Test 1: Getting Access Token', 'bright');
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();

    if (data.access_token) {
      log('  ✅ Access token obtained successfully', 'green');
      log(`  Token expires in: ${data.expires_in} seconds`, 'cyan');
      
      // Test 2: Get Subscription Details (if you have any)
      log('\n🧪 Test 2: Checking Subscription API Access', 'bright');
      
      // Try to get a subscription (this will fail if wrong credentials, but that's OK)
      // We're just checking if we can make API calls
      const testResponse = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (testResponse.ok || testResponse.status === 404) {
        log('  ✅ API endpoint is accessible', 'green');
        log(`  Status: ${testResponse.status}`, 'cyan');
      } else {
        const errorData = await testResponse.text();
        log(`  ⚠️  API returned status: ${testResponse.status}`, 'yellow');
        if (testResponse.status === 401) {
          log('  ❌ Authentication failed - check your credentials', 'red');
        }
      }

      // Test 3: Verify Client ID format
      log('\n🧪 Test 3: Client ID Analysis', 'bright');
      log(`  Client ID length: ${clientId.length}`, 'cyan');
      log(`  Starts with: ${clientId.substring(0, 20)}`, 'cyan');
      
      // Live client IDs typically start with specific patterns
      // Sandbox IDs are usually shorter or have different patterns
      if (clientId.length >= 80 && clientId.startsWith('AZ')) {
        log('  ✅ Client ID format looks correct for Live mode', 'green');
      } else {
        log('  ⚠️  Client ID format might be for Sandbox', 'yellow');
      }

      // Summary
      log('\n📊 Summary:', 'bright');
      log('═'.repeat(70), 'cyan');
      
      if (mode === 'live' && baseUrl.includes('api-m.paypal.com') && data.access_token) {
        log('✅ You ARE using PayPal LIVE mode', 'green');
        log('\n📋 Where to check for events:', 'bright');
        log('  1. PayPal Developer Dashboard:', 'cyan');
        log('     https://developer.paypal.com/dashboard/applications/live', 'cyan');
        log('     → Click your app → "Webhooks Events" tab', 'cyan');
        log('');
        log('  2. PayPal Business Dashboard:', 'cyan');
        log('     https://www.paypal.com/businessmanage/account/subscriptions', 'cyan');
        log('     → View active subscriptions', 'cyan');
        log('');
        log('  3. PayPal Activity Log:', 'cyan');
        log('     https://www.paypal.com/myaccount/activity/', 'cyan');
        log('     → Filter by "Subscriptions" or "Payments"', 'cyan');
        log('');
        log('💡 Note: Events may take a few minutes to appear in PayPal dashboard', 'yellow');
        log('💡 Make sure you\'re looking at the LIVE tab, not SANDBOX', 'yellow');
      } else {
        log('⚠️  Configuration might not be fully set to Live mode', 'yellow');
      }

    } else {
      log('  ❌ Failed to get access token', 'red');
      log(`  Error: ${JSON.stringify(data, null, 2)}`, 'red');
      
      if (data.error === 'invalid_client') {
        log('\n  🔧 Troubleshooting:', 'bright');
        log('    1. Check if Client ID and Secret are correct', 'yellow');
        log('    2. Verify you\'re using LIVE credentials (not Sandbox)', 'yellow');
        log('    3. Make sure credentials match the environment (Live vs Sandbox)', 'yellow');
      }
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

verifyLiveMode();

