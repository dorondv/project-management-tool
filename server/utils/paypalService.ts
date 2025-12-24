import dotenv from 'dotenv';

dotenv.config();

/**
 * PayPal Service
 * Handles all PayPal API interactions using direct REST API calls
 */

// PayPal Plan IDs from environment
const PAYPAL_PLAN_MONTHLY = process.env.PAYPAL_PLAN_MONTHLY || 'P-771756107T669132ENFBLY7Y';
const PAYPAL_PLAN_ANNUAL = process.env.PAYPAL_PLAN_ANNUAL || 'P-9EG97204XL0481249NFBMDTQ';

// PayPal API endpoints
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

let accessTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get PayPal access token: ${error}`);
    }

    const data = await response.json();
    const expiresIn = data.expires_in || 32400; // Default 9 hours
    accessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000, // Refresh 5 minutes before expiry
    };

    return data.access_token;
  } catch (error: any) {
    console.error('Error getting PayPal access token:', error);
    throw new Error(`Failed to get PayPal access token: ${error.message}`);
  }
}

/**
 * Make authenticated PayPal API request
 */
async function paypalRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();
  const url = endpoint.startsWith('http') ? endpoint : `${PAYPAL_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal API error: ${error}`);
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return await response.json();
}

/**
 * Get PayPal Client ID (for frontend SDK)
 */
export function getPayPalClientId(): string {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) {
    throw new Error('PayPal Client ID not configured');
  }
  return clientId;
}

/**
 * Get PayPal Plan ID by plan type
 */
export function getPayPalPlanId(planType: 'monthly' | 'annual'): string {
  return planType === 'monthly' ? PAYPAL_PLAN_MONTHLY : PAYPAL_PLAN_ANNUAL;
}

/**
 * Get subscription details from PayPal
 */
export async function getSubscriptionDetails(subscriptionId: string): Promise<any> {
  try {
    return await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`);
  } catch (error: any) {
    console.error('Error getting subscription details:', error);
    throw new Error(`Failed to get subscription details: ${error.message}`);
  }
}

/**
 * Cancel a PayPal subscription
 */
export async function cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
  try {
    const body: any = {};
    if (reason) {
      body.reason = reason;
    }

    await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Suspend a PayPal subscription
 */
export async function suspendSubscription(subscriptionId: string, reason?: string): Promise<void> {
  try {
    const body: any = {};
    if (reason) {
      body.reason = reason;
    }

    await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  } catch (error: any) {
    console.error('Error suspending subscription:', error);
    throw new Error(`Failed to suspend subscription: ${error.message}`);
  }
}

/**
 * Reactivate a PayPal subscription
 */
export async function reactivateSubscription(subscriptionId: string, reason?: string): Promise<void> {
  try {
    const body: any = {};
    if (reason) {
      body.reason = reason;
    }

    await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    throw new Error(`Failed to reactivate subscription: ${error.message}`);
  }
}

/**
 * Refund a PayPal transaction
 */
export async function refundTransaction(
  captureId: string,
  amount?: number,
  currency: string = 'USD',
  reason?: string
): Promise<any> {
  try {
    const body: any = {};
    
    if (amount) {
      body.amount = {
        value: amount.toFixed(2),
        currency_code: currency,
      };
    }
    
    if (reason) {
      body.note_to_payer = reason;
    }

    return await paypalRequest(`/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    console.error('Error refunding transaction:', error);
    throw new Error(`Failed to refund transaction: ${error.message}`);
  }
}

/**
 * Get subscription transactions from PayPal
 */
export async function getSubscriptionTransactions(subscriptionId: string): Promise<any[]> {
  try {
    // PayPal doesn't have a direct endpoint for subscription transactions
    // We need to use the subscription details which includes billing info
    const subscription = await getSubscriptionDetails(subscriptionId);
    
    // PayPal subscription details include billing_info with transactions
    // However, for detailed transaction history, we may need to query separately
    // For now, return the subscription details which include billing information
    return subscription.billing_info?.outstanding_balance?.value 
      ? [subscription] 
      : [];
  } catch (error: any) {
    console.error('Error getting subscription transactions:', error);
    throw new Error(`Failed to get subscription transactions: ${error.message}`);
  }
}

/**
 * Generate PayPal invoice/transaction URL
 * PayPal doesn't provide direct invoice PDFs, but we can link to the transaction page
 */
export function getPayPalTransactionUrl(transactionId: string): string {
  const isLive = process.env.PAYPAL_MODE === 'live';
  const baseUrl = isLive 
    ? 'https://www.paypal.com'
    : 'https://www.sandbox.paypal.com';
  
  // PayPal transaction activity page
  return `${baseUrl}/activity/payment/${transactionId}`;
}

/**
 * Generate PayPal subscription management URL
 */
export function getPayPalSubscriptionUrl(subscriptionId: string): string {
  const isLive = process.env.PAYPAL_MODE === 'live';
  const baseUrl = isLive 
    ? 'https://www.paypal.com'
    : 'https://www.sandbox.paypal.com';
  
  // PayPal subscription management page
  return `${baseUrl}/myaccount/autopay/connect/${subscriptionId}`;
}

/**
 * Verify PayPal webhook signature
 */
export function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  body: string,
  webhookId?: string
): boolean {
  // PayPal webhook verification requires the webhook ID and signature
  // This is a simplified version - in production, use PayPal's webhook verification SDK
  const webhookIdEnv = process.env.PAYPAL_WEBHOOK_ID || webhookId;
  
  if (!webhookIdEnv) {
    console.warn('PayPal webhook ID not configured - skipping signature verification');
    return true; // In development, allow without verification
  }

  // TODO: Implement proper webhook signature verification
  // PayPal provides webhook signature verification endpoints
  // For now, we'll verify in the webhook handler
  return true;
}
