/**
 * Payment Sync Service
 * 
 * Syncs historical payments from PayPal that were made before webhooks were configured
 */

import { prisma } from '../index.js';
import { getSubscriptionDetails, getSubscriptionTransactions } from './paypalService.js';
import { createBillingHistory } from './subscriptionService.js';

/**
 * Sync payments for a specific subscription from PayPal
 */
export async function syncSubscriptionPayments(subscriptionId: string): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
}> {
  const result = {
    synced: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // Get subscription from database
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        billingHistory: {
          select: {
            paypalTransactionId: true,
            paypalSaleId: true,
          },
        },
      },
    });

    if (!subscription || !subscription.paypalSubscriptionId) {
      throw new Error('Subscription not found or missing PayPal subscription ID');
    }

    // Get PayPal subscription details
    const paypalSub = await getSubscriptionDetails(subscription.paypalSubscriptionId);
    
    // Get existing transaction IDs from our database
    const existingTransactionIds = new Set(
      subscription.billingHistory
        .map(bh => bh.paypalTransactionId || bh.paypalSaleId)
        .filter(Boolean)
    );

    // Try to get transaction history from PayPal
    const transactions = await getSubscriptionTransactions(subscription.paypalSubscriptionId);

    // If we got transactions from the API, sync them
    if (transactions && transactions.length > 0) {
      for (const transaction of transactions) {
        try {
          // PayPal Transaction Search API returns transactions in a different format
          // Check for transaction_info structure
          const transactionInfo = transaction.transaction_info || transaction;
          const payerInfo = transaction.payer_info || {};
          
          const transactionId = transactionInfo.transaction_id || transactionInfo.id || transaction.id;
          const saleId = transactionInfo.transaction_id || transactionInfo.id || transaction.id;
          
          // Skip if we already have this transaction
          if (transactionId && existingTransactionIds.has(transactionId)) {
            result.skipped++;
            continue;
          }

          // Extract payment details from transaction_info
          const transactionAmount = transactionInfo.transaction_amount || transactionInfo.amount || transaction.amount;
          const amount = parseFloat(
            transactionAmount?.value || 
            transactionAmount?.total || 
            transactionAmount?.amount?.value ||
            '0'
          );
          const currency = transactionAmount?.currency_code || 
                          transactionAmount?.currency || 
                          transactionInfo.transaction_amount?.currency_code ||
                          'USD';
          
          const paymentDate = transactionInfo.transaction_initiation_date 
            ? new Date(transactionInfo.transaction_initiation_date) 
            : transactionInfo.transaction_updated_date
            ? new Date(transactionInfo.transaction_updated_date)
            : transaction.time_stamp 
            ? new Date(transaction.time_stamp) 
            : transaction.create_time 
            ? new Date(transaction.create_time)
            : new Date();

          // Only sync if amount > 0 (actual payments, not refunds)
          // Check transaction status - only sync completed payments
          const status = transactionInfo.transaction_status || transaction.status || '';
          if (amount > 0 && (status === 'S' || status === 'COMPLETED' || !status)) {
            const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            await createBillingHistory(subscription.id, {
              invoiceNumber,
              paypalTransactionId: transactionId,
              paypalSaleId: saleId,
              amount,
              currency,
              status: status === 'S' || status === 'COMPLETED' ? 'paid' : 'pending',
              paymentDate,
            });

            result.synced++;
          }
        } catch (error: any) {
          result.errors.push(`Transaction sync error: ${error.message}`);
          console.error('Error syncing transaction:', error);
        }
      }
    } else {
      // If PayPal API doesn't return transaction history directly,
      // we can't sync historical payments automatically
      // Admin will need to manually add them or check PayPal dashboard
      result.errors.push('PayPal API does not return transaction history for this subscription. Historical payments may need to be added manually via PayPal dashboard.');
    }

    return result;
  } catch (error: any) {
    console.error('Error syncing subscription payments:', error);
    result.errors.push(`Sync failed: ${error.message}`);
    return result;
  }
}

/**
 * Sync payments for all active subscriptions
 */
export async function syncAllSubscriptionPayments(): Promise<{
  total: number;
  synced: number;
  skipped: number;
  errors: string[];
}> {
  const result = {
    total: 0,
    synced: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // Get all subscriptions with PayPal subscription IDs
    const subscriptions = await prisma.subscription.findMany({
      where: {
        paypalSubscriptionId: { not: null },
      },
      select: {
        id: true,
        paypalSubscriptionId: true,
      },
    });

    result.total = subscriptions.length;

    for (const subscription of subscriptions) {
      if (!subscription.paypalSubscriptionId) continue;

      try {
        const syncResult = await syncSubscriptionPayments(subscription.id);
        result.synced += syncResult.synced;
        result.skipped += syncResult.skipped;
        result.errors.push(...syncResult.errors);
      } catch (error: any) {
        result.errors.push(`Subscription ${subscription.id}: ${error.message}`);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error syncing all subscription payments:', error);
    result.errors.push(`Sync failed: ${error.message}`);
    return result;
  }
}

