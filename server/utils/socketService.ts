/**
 * Socket Service
 * Utility for emitting WebSocket events to connected clients
 */

import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

/**
 * Initialize socket service with Socket.IO instance
 */
export function initSocketService(io: SocketIOServer) {
  ioInstance = io;
}

/**
 * Emit payment confirmed event to user
 */
export function emitPaymentConfirmed(userId: string, data: {
  subscriptionId: string;
  planType: string;
  amount: number;
  transactionId: string;
}) {
  if (!ioInstance) {
    console.warn('⚠️  Socket.IO not initialized, skipping payment:confirmed event');
    return;
  }

  ioInstance.to(`user:${userId}`).emit('payment:confirmed', {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log(`📡 Emitted payment:confirmed to user:${userId}`);
}

/**
 * Emit payment failed event to user
 */
export function emitPaymentFailed(userId: string, data: {
  subscriptionId?: string;
  error: string;
  transactionId?: string;
}) {
  if (!ioInstance) {
    console.warn('⚠️  Socket.IO not initialized, skipping payment:failed event');
    return;
  }

  ioInstance.to(`user:${userId}`).emit('payment:failed', {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log(`📡 Emitted payment:failed to user:${userId}`);
}

/**
 * Emit subscription cancelled event to user
 */
export function emitSubscriptionCancelled(userId: string, data: {
  subscriptionId: string;
  reason?: string;
}) {
  if (!ioInstance) {
    console.warn('⚠️  Socket.IO not initialized, skipping subscription:cancelled event');
    return;
  }

  ioInstance.to(`user:${userId}`).emit('subscription:cancelled', {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log(`📡 Emitted subscription:cancelled to user:${userId}`);
}

/**
 * Emit subscription renewed event to user
 */
export function emitSubscriptionRenewed(userId: string, data: {
  subscriptionId: string;
  amount: number;
  nextBillingDate: string;
}) {
  if (!ioInstance) {
    console.warn('⚠️  Socket.IO not initialized, skipping subscription:renewed event');
    return;
  }

  ioInstance.to(`user:${userId}`).emit('subscription:renewed', {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log(`📡 Emitted subscription:renewed to user:${userId}`);
}

/**
 * Emit subscription status updated event to user
 */
export function emitSubscriptionStatusUpdated(userId: string, data: {
  subscriptionId: string;
  status: string;
  planType: string;
}) {
  if (!ioInstance) {
    console.warn('⚠️  Socket.IO not initialized, skipping subscription:status_updated event');
    return;
  }

  ioInstance.to(`user:${userId}`).emit('subscription:status_updated', {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log(`📡 Emitted subscription:status_updated to user:${userId}`);
}

