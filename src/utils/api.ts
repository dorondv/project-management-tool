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
    getAll: () => fetch(`${API_URL}/api/projects`).then(handleResponse),
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
    getAll: (projectId?: string) => {
      const url = projectId
        ? `${API_URL}/api/tasks?projectId=${projectId}`
        : `${API_URL}/api/tasks`;
      return fetch(url).then(handleResponse);
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
    getAll: () => fetch(`${API_URL}/api/customers`).then(handleResponse),
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

  // Dashboard - optimized single endpoint for initial data
  dashboard: {
    getInitialData: (userId?: string) => {
      const url = userId 
        ? `${API_URL}/api/dashboard/initial-data?userId=${encodeURIComponent(userId)}`
        : `${API_URL}/api/dashboard/initial-data`;
      return fetch(url).then(handleResponse);
    },
  },
};

export { ApiError };

