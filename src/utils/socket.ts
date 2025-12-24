/**
 * WebSocket Client Utility
 * Manages Socket.IO connection with graceful degradation
 */

import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize WebSocket connection
 */
export function initSocket(userId: string): Socket | null {
  if (socket?.connected) {
    console.log('🔌 WebSocket already connected');
    return socket;
  }

  if (isConnecting) {
    console.log('🔌 WebSocket connection already in progress');
    return socket;
  }

  try {
    isConnecting = true;
    console.log('🔌 Initializing WebSocket connection...');

    socket = io(API_URL, {
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket?.id);
      reconnectAttempts = 0;
      isConnecting = false;

      // Authenticate with userId
      if (userId) {
        socket?.emit('authenticate', { userId });
      }
    });

    socket.on('authenticated', (data: { success: boolean; error?: string }) => {
      if (data.success) {
        console.log('✅ WebSocket authenticated');
      } else {
        console.error('❌ WebSocket authentication failed:', data.error);
        disconnectSocket();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      isConnecting = false;

      // Don't reconnect if manually disconnected or auth failed
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️  WebSocket connection error:', error.message);
      reconnectAttempts++;
      isConnecting = false;

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('⚠️  Max reconnection attempts reached, WebSocket disabled');
        disconnectSocket();
      }
    });

    return socket;
  } catch (error: any) {
    console.error('❌ Failed to initialize WebSocket:', error);
    isConnecting = false;
    return null;
  }
}

/**
 * Disconnect WebSocket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 WebSocket disconnected');
  }
  isConnecting = false;
  reconnectAttempts = 0;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Check if WebSocket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Subscribe to payment events
 */
export function onPaymentConfirmed(
  callback: (data: {
    subscriptionId: string;
    planType: string;
    amount: number;
    transactionId: string;
    timestamp: string;
  }) => void
) {
  if (!socket) {
    console.warn('⚠️  Socket not initialized, cannot subscribe to payment:confirmed');
    return () => {};
  }

  socket.on('payment:confirmed', callback);
  return () => {
    socket?.off('payment:confirmed', callback);
  };
}

/**
 * Subscribe to payment failed events
 */
export function onPaymentFailed(
  callback: (data: {
    subscriptionId?: string;
    error: string;
    transactionId?: string;
    timestamp: string;
  }) => void
) {
  if (!socket) {
    console.warn('⚠️  Socket not initialized, cannot subscribe to payment:failed');
    return () => {};
  }

  socket.on('payment:failed', callback);
  return () => {
    socket?.off('payment:failed', callback);
  };
}

/**
 * Subscribe to subscription cancelled events
 */
export function onSubscriptionCancelled(
  callback: (data: {
    subscriptionId: string;
    reason?: string;
    timestamp: string;
  }) => void
) {
  if (!socket) {
    console.warn('⚠️  Socket not initialized, cannot subscribe to subscription:cancelled');
    return () => {};
  }

  socket.on('subscription:cancelled', callback);
  return () => {
    socket?.off('subscription:cancelled', callback);
  };
}

/**
 * Subscribe to subscription renewed events
 */
export function onSubscriptionRenewed(
  callback: (data: {
    subscriptionId: string;
    amount: number;
    nextBillingDate: string;
    timestamp: string;
  }) => void
) {
  if (!socket) {
    console.warn('⚠️  Socket not initialized, cannot subscribe to subscription:renewed');
    return () => {};
  }

  socket.on('subscription:renewed', callback);
  return () => {
    socket?.off('subscription:renewed', callback);
  };
}

/**
 * Subscribe to subscription status updated events
 */
export function onSubscriptionStatusUpdated(
  callback: (data: {
    subscriptionId: string;
    status: string;
    planType: string;
    timestamp: string;
  }) => void
) {
  if (!socket) {
    console.warn('⚠️  Socket not initialized, cannot subscribe to subscription:status_updated');
    return () => {};
  }

  socket.on('subscription:status_updated', callback);
  return () => {
    socket?.off('subscription:status_updated', callback);
  };
}

