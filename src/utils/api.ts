// API utility for making requests to the backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || error.message || 'Request failed');
  }
  return response.json();
}

// Helper to add timeout to fetch requests
function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 30000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

export const api = {
  // Users
  users: {
    getAll: () => fetch(`${API_URL}/api/users`).then(handleResponse),
    getById: (id: string) => fetch(`${API_URL}/api/users/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Projects
  projects: {
    getAll: (userId?: string, customerId?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (customerId) params.append('customerId', customerId);
      const query = params.toString();
      return fetch(`${API_URL}/api/projects${query ? `?${query}` : ''}`).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/projects/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/projects/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Tasks
  tasks: {
    getAll: (filters?: { userId?: string; projectId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      const query = params.toString();
      return fetch(`${API_URL}/api/tasks${query ? `?${query}` : ''}`).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/tasks/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Customers
  customers: {
    getAll: (userId?: string) => {
      const url = userId 
        ? `${API_URL}/api/customers?userId=${encodeURIComponent(userId)}`
        : `${API_URL}/api/customers`;
      return fetch(url).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/customers/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string, userId?: string) => {
      const url = userId 
        ? `${API_URL}/api/customers/${id}?userId=${encodeURIComponent(userId)}`
        : `${API_URL}/api/customers/${id}`;
      return fetch(url, {
        method: 'DELETE',
      }).then(() => null);
    },
  },

  // Time Entries
  timeEntries: {
    getAll: (filters?: { customerId?: string; projectId?: string; userId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.userId) params.append('userId', filters.userId);
      const query = params.toString();
      return fetch(`${API_URL}/api/time-entries${query ? `?${query}` : ''}`).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/time-entries/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/time-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/time-entries/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Incomes
  incomes: {
    getAll: (customerId?: string) => {
      const url = customerId
        ? `${API_URL}/api/incomes?customerId=${customerId}`
        : `${API_URL}/api/incomes`;
      return fetch(url).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/incomes/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/incomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/incomes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/incomes/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Notifications
  notifications: {
    getAll: (filters?: { userId?: string; read?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.read !== undefined) params.append('read', String(filters.read));
      const query = params.toString();
      return fetch(`${API_URL}/api/notifications${query ? `?${query}` : ''}`).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/notifications/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Activities
  activities: {
    getAll: (filters?: { userId?: string; projectId?: string; taskId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.taskId) params.append('taskId', filters.taskId);
      const query = params.toString();
      return fetch(`${API_URL}/api/activities${query ? `?${query}` : ''}`).then(handleResponse);
    },
    create: (data: any) =>
      fetch(`${API_URL}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
  },

  // Timers
  timers: {
    getAll: (filters?: { userId?: string; customerId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      const query = params.toString();
      return fetch(`${API_URL}/api/timers${query ? `?${query}` : ''}`).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/timers/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/timers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/timers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/timers/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Events
  events: {
    getAll: (filters?: { userId?: string; startDate?: string; endDate?: string; customerId?: string; projectId?: string; taskId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.taskId) params.append('taskId', filters.taskId);
      const query = params.toString();
      return fetch(`${API_URL}/api/events${query ? `?${query}` : ''}`).then(handleResponse);
    },
    getById: (id: string) => fetch(`${API_URL}/api/events/${id}`).then(handleResponse),
    create: (data: any) =>
      fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: string, data: any) =>
      fetch(`${API_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: string) =>
      fetch(`${API_URL}/api/events/${id}`, {
        method: 'DELETE',
      }).then(() => null),
  },

  // Dashboard - optimized single endpoint for initial data
  dashboard: {
    getInitialData: (userId?: string) => {
      const url = userId 
        ? `${API_URL}/api/dashboard/initial-data?userId=${encodeURIComponent(userId)}`
        : `${API_URL}/api/dashboard/initial-data`;
      return fetch(url).then(handleResponse);
    },
  },

  // Subscriptions
  subscriptions: {
    getStatus: (userId?: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['x-user-id'] = userId;
      }
      return fetch(`${API_URL}/api/subscriptions/status`, { headers }).then(handleResponse);
    },
    getClientId: () => fetch(`${API_URL}/api/subscriptions/client-id`).then(handleResponse),
    link: (data: { subscriptionID: string; planType: 'monthly' | 'annual' }, userId?: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['x-user-id'] = userId;
      }
      console.log('API: Linking subscription:', { data, userId });
      return fetchWithTimeout(`${API_URL}/api/subscriptions/link`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }, 30000).then(handleResponse).catch((error) => {
        console.error('API: Error linking subscription:', error);
        throw error;
      });
    },
    cancel: (userId?: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['x-user-id'] = userId;
      }
      return fetch(`${API_URL}/api/subscriptions/cancel`, {
        method: 'POST',
        headers,
      }).then(handleResponse);
    },
    getBillingHistory: (userId?: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['x-user-id'] = userId;
      }
      return fetch(`${API_URL}/api/subscriptions/billing-history`, { headers }).then(handleResponse);
    },
    redeemCoupon: (code: string, userId?: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['x-user-id'] = userId;
      }
      return fetch(`${API_URL}/api/subscriptions/redeem-coupon`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      }).then(handleResponse);
    },
    checkAccess: (userId?: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['x-user-id'] = userId;
      }
      return fetch(`${API_URL}/api/subscriptions/check-access`, { headers }).then(handleResponse);
    },
  },

  // Admin API methods
  admin: {
    // Users
    getUsers: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/users`, { headers }).then(handleResponse);
    },
    getUser: (id: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/users/${id}`, { headers }).then(handleResponse);
    },
    createUser: (data: any, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse);
    },
    grantFreeAccess: (id: string, data: { endDate?: string; days?: number }, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/users/${id}/free-access`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse);
    },
    revokeFreeAccess: (id: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/users/${id}/free-access`, {
        method: 'DELETE',
        headers,
      }).then(handleResponse);
    },
    updateUserRole: (id: string, role: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role }),
      }).then(handleResponse);
    },
    exportUsers: (userId: string) => {
      const headers: HeadersInit = { 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/export/users`, { headers }).then((res) => res.blob());
    },

    // Subscriptions
    getSubscriptions: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/subscriptions`, { headers }).then(handleResponse);
    },
    getSubscriptionStats: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/subscriptions/stats`, { headers }).then(handleResponse);
    },
    cancelSubscription: (id: string, reason: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      }).then(handleResponse);
    },
    suspendSubscription: (id: string, reason: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/subscriptions/${id}/suspend`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      }).then(handleResponse);
    },
    activateSubscription: (id: string, reason: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/subscriptions/${id}/activate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      }).then(handleResponse);
    },

    // Coupons
    getCoupons: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/coupons`, { headers }).then(handleResponse);
    },
    createCoupon: (data: any, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse);
    },
    updateCoupon: (id: string, data: any, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse);
    },
    deleteCoupon: (id: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers,
      }).then(handleResponse);
    },
    getCouponUsage: (code: string, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/coupons/${code}/usage`, { headers }).then(handleResponse);
    },

    // Payments
    getPayments: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/payments`, { headers }).then(handleResponse);
    },
    getPaymentStats: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/payments/stats`, { headers }).then(handleResponse);
    },
    refundPayment: (id: string, data: { amount?: number; reason?: string }, userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/payments/${id}/refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }).then(handleResponse);
    },
    getRefundHistory: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/admin/payments/refund-history`, { headers }).then(handleResponse);
    },
  },

  // Chatwoot
  chatwoot: {
    getActiveConversationsCount: () => {
      return fetch(`${API_URL}/api/chatwoot/active-conversations-count`).then(handleResponse);
    },
    syncUser: (userId: string) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'x-user-id': userId };
      return fetch(`${API_URL}/api/chatwoot/sync-user`, {
        method: 'POST',
        headers,
      }).then(handleResponse);
    },
    syncAllUsers: () => {
      return fetch(`${API_URL}/api/chatwoot/sync-all-users`, {
        method: 'POST',
      }).then(handleResponse);
    },
  },
};

export { ApiError };

