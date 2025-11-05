export interface StorageData {
  user: any;
  projects: any[];
  tasks: any[];
  notifications: any[];
  activities: any[];
  customers: any[];
  theme: 'light' | 'dark';
  locale: 'en' | 'he';
  settings: any;
}

const STORAGE_KEY = 'projectflow_data';

export const storage = {
  get: <T>(key: keyof StorageData): T | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed[key] || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: <T>(key: keyof StorageData, value: T): void => {
    try {
      const existingData = localStorage.getItem(STORAGE_KEY);
      const data = existingData ? JSON.parse(existingData) : {};
      data[key] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  getAll: (): Partial<StorageData> => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading all data from localStorage:', error);
      return {};
    }
  },

  setAll: (data: Partial<StorageData>): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing all data to localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export const initializeStorage = (): void => {
  const existingData = storage.getAll();
  if (Object.keys(existingData).length === 0) {
    // Initialize with default data if storage is empty
    const defaultData: Partial<StorageData> = {
      user: null,
      projects: [],
      tasks: [],
      notifications: [],
      activities: [],
      customers: [],
      theme: 'light',
      locale: 'en',
      settings: {
        notifications: true,
        emailUpdates: true,
        darkMode: false
      }
    };
    storage.setAll(defaultData);
  }
};