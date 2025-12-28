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
async function paypalRequest(endpoint: string, options: RequestInit & { params?: Record<string, any> } = {}): Promise<any> {
  const token = await getAccessToken();
  let url = endpoint.startsWith('http') ? endpoint : `${PAYPAL_BASE_URL}${endpoint}`;

  // Handle query parameters
  if (options.params && Object.keys(options.params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${searchParams.toString()}`;
  }

  // Remove params from options to avoid passing it to fetch
  const { params, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
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
 * Search PayPal transactions by subscription ID or date range
 * Uses PayPal's Transaction Search API
 */
export async function searchPayPalTransactions(params: {
  subscriptionId?: string;
  startDate?: Date;
  endDate?: Date;
  transactionType?: string;
}): Promise<any[]> {
  try {
    const searchParams: any = {
      transaction_type: params.transactionType || 'Recurring Payment',
      page_size: 100,
      page: 1,
    };

    // Add date range if provided
    if (params.startDate) {
      searchParams.start_date = params.startDate.toISOString();
    }
    if (params.endDate) {
      searchParams.end_date = params.endDate.toISOString();
    }

    // PayPal Transaction Search API endpoint
    // Note: This searches all transactions, not just for a specific subscription
    // We'll filter by subscription ID after getting results
    const response = await paypalRequest('/v1/reporting/transactions', {
      method: 'GET',
      params: searchParams,
    });

    let transactions = response.transaction_details || [];
    
    // Filter by subscription ID if provided
    if (params.subscriptionId && transactions.length > 0) {
      transactions = transactions.filter((tx: any) => {
        // Check various fields where subscription ID might appear
        const transactionInfo = tx.transaction_info || {};
        const payerInfo = tx.payer_info || {};
        
        // Subscription ID might be in billing_agreement_id or other fields
        return (
          transactionInfo.billing_agreement_id === params.subscriptionId ||
          transactionInfo.instrument_id === params.subscriptionId ||
          payerInfo.billing_agreement_id === params.subscriptionId
        );
      });
    }

    return transactions;
  } catch (error: any) {
    console.error('Error searching PayPal transactions:', error);
    // If Transaction Search API is not available or fails, return empty array
    // PayPal's Transaction Search API may require special permissions
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      console.warn('PayPal Transaction Search API not available. Historical payments may need to be added manually.');
      return [];
    }
    throw new Error(`Failed to search PayPal transactions: ${error.message}`);
  }
}

/**
 * Get subscription transactions from PayPal
 * Tries multiple methods to get transaction history
 */
export async function getSubscriptionTransactions(subscriptionId: string): Promise<any[]> {
  try {
    // First, try to get subscription details
    const subscription = await getSubscriptionDetails(subscriptionId);
    
    // Check if subscription details include transaction history
    if (subscription.billing_info?.transaction_history?.transactions) {
      return subscription.billing_info.transaction_history.transactions;
    }
    
    if (subscription.transactions && Array.isArray(subscription.transactions)) {
      return subscription.transactions;
    }

    // If subscription details don't include transactions, try Transaction Search API
    // Search for transactions from the subscription start date
    const startDate = subscription.start_time 
      ? new Date(subscription.start_time) 
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days as fallback
    
    const transactions = await searchPayPalTransactions({
      subscriptionId,
      startDate,
      transactionType: 'Recurring Payment',
    });

    return transactions;
  } catch (error: any) {
    console.error('Error getting subscription transactions:', error);
    // Return empty array instead of throwing - allows manual entry
    return [];
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
