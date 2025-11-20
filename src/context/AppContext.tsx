import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Project, Task, Notification, Activity, Customer, Locale, TimeEntry, Income, ActiveTimer } from '../types';
import { mockUsers, mockProjects, mockTasks, mockNotifications, mockActivities, mockCustomers, mockTimeEntries, mockIncomes } from '../data/mockData';
import { storage, initializeStorage } from '../utils/localStorage';
import { timerService } from '../utils/timerService';
import { api } from '../utils/api';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

interface AppState {
  user: User | null;
  projects: Project[];
  tasks: Task[];
  notifications: Notification[];
  activities: Activity[];
  customers: Customer[];
  timeEntries: TimeEntry[];
  incomes: Income[];
  activeTimer: ActiveTimer | null;
  timerElapsedSeconds: number;
  locale: Locale;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_TIME_ENTRIES'; payload: TimeEntry[] }
  | { type: 'ADD_TIME_ENTRY'; payload: TimeEntry }
  | { type: 'UPDATE_TIME_ENTRY'; payload: TimeEntry }
  | { type: 'DELETE_TIME_ENTRY'; payload: string }
  | { type: 'SET_INCOMES'; payload: Income[] }
  | { type: 'ADD_INCOME'; payload: Income }
  | { type: 'UPDATE_INCOME'; payload: Income }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'SET_LOCALE'; payload: Locale }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_ACTIVE_TIMER'; payload: ActiveTimer | null }
  | { type: 'UPDATE_TIMER_ELAPSED'; payload: number }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  projects: [],
  tasks: [],
  notifications: [],
  activities: [],
  customers: [],
  timeEntries: [],
  incomes: [],
  activeTimer: null,
  timerElapsedSeconds: 0,
  locale: 'en',
  theme: 'light',
  loading: false,
  error: null,
  isAuthenticated: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function normalizeCustomers(customers: Customer[]): Customer[] {
  return customers.map((customer) => {
    const joinDateValue = customer.joinDate instanceof Date
      ? customer.joinDate
      : new Date(customer.joinDate);

    const joinDate = !Number.isNaN(joinDateValue.getTime()) ? joinDateValue : new Date();

    return {
      ...customer,
      joinDate,
    };
  });
}

function normalizeIncomes(incomes: Income[]): Income[] {
  return incomes.map((income) => {
    const incomeDateValue = income.incomeDate instanceof Date
      ? income.incomeDate
      : new Date(income.incomeDate);
    
    const createdAtValue = income.createdAt instanceof Date
      ? income.createdAt
      : new Date(income.createdAt);
    
    const updatedAtValue = income.updatedAt instanceof Date
      ? income.updatedAt
      : new Date(income.updatedAt);

    const incomeDate = !Number.isNaN(incomeDateValue.getTime()) ? incomeDateValue : new Date();
    const createdAt = !Number.isNaN(createdAtValue.getTime()) ? createdAtValue : new Date();
    const updatedAt = !Number.isNaN(updatedAtValue.getTime()) ? updatedAtValue : new Date();

    return {
      ...income,
      incomeDate,
      createdAt,
      updatedAt,
    };
  });
}

function normalizeTasks(tasks: Task[]): Task[] {
  return tasks.map((task) => {
    const dueDateValue = task.dueDate instanceof Date
      ? task.dueDate
      : new Date(task.dueDate);
    const createdAtValue = task.createdAt instanceof Date
      ? task.createdAt
      : new Date(task.createdAt);
    const updatedAtValue = task.updatedAt instanceof Date
      ? task.updatedAt
      : new Date(task.updatedAt);

    const dueDate = !Number.isNaN(dueDateValue.getTime()) ? dueDateValue : new Date();
    const createdAt = !Number.isNaN(createdAtValue.getTime()) ? createdAtValue : new Date();
    const updatedAt = !Number.isNaN(updatedAtValue.getTime()) ? updatedAtValue : new Date();

    return {
      ...task,
      dueDate,
      createdAt,
      updatedAt,
      comments: task.comments || [],
      attachments: task.attachments || [],
      tags: task.tags || [],
      assignedTo: task.assignedTo || [],
    };
  });
}

function normalizeTimeEntries(timeEntries: TimeEntry[]): TimeEntry[] {
  return timeEntries.map((entry) => {
    const startTimeValue = entry.startTime instanceof Date
      ? entry.startTime
      : new Date(entry.startTime);
    const endTimeValue = entry.endTime instanceof Date
      ? entry.endTime
      : new Date(entry.endTime);
    const createdAtValue = entry.createdAt instanceof Date
      ? entry.createdAt
      : new Date(entry.createdAt);
    const updatedAtValue = entry.updatedAt instanceof Date
      ? entry.updatedAt
      : new Date(entry.updatedAt);

    const startTime = !Number.isNaN(startTimeValue.getTime()) ? startTimeValue : new Date();
    const endTime = !Number.isNaN(endTimeValue.getTime()) ? endTimeValue : new Date();
    const createdAt = !Number.isNaN(createdAtValue.getTime()) ? createdAtValue : new Date();
    const updatedAt = !Number.isNaN(updatedAtValue.getTime()) ? updatedAtValue : new Date();

    return {
      ...entry,
      startTime,
      endTime,
      createdAt,
      updatedAt,
    };
  });
}

async function safeFetch<T>(label: string, fetcher: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.warn(`⚠️ AppContext: ${label} request failed:`, error);
    return fallbackValue;
  }
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      console.log('🟢 AppContext: SET_USER action dispatched:', { 
        hasUser: !!action.payload, 
        userId: action.payload?.id,
        userName: action.payload?.name 
      });
      const newStateWithUser = { ...state, user: action.payload, isAuthenticated: !!action.payload };
      storage.set('user', action.payload);
      console.log('🟢 AppContext: New state after SET_USER:', { 
        hasUser: !!newStateWithUser.user, 
        isAuthenticated: newStateWithUser.isAuthenticated 
      });
      return newStateWithUser;
    
    case 'SET_PROJECTS':
      // Recalculate progress for all projects based on current tasks
      const projectsWithProgress = action.payload.map(project => {
        const projectTasks = state.tasks.filter(t => t.projectId === project.id);
        if (projectTasks.length === 0) {
          return { ...project, progress: 0 };
        }
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedTasks / projectTasks.length) * 100);
        return { ...project, progress };
      });
      storage.set('projects', projectsWithProgress);
      return { ...state, projects: projectsWithProgress };
    
    case 'ADD_PROJECT':
      const newProjects = [...state.projects, action.payload];
      storage.set('projects', newProjects);
      // Note: Project creation is now handled in CreateProjectModal before dispatching ADD_PROJECT
      // This ensures we have the correct database ID and structure
      return { ...state, projects: newProjects };
    
    case 'UPDATE_PROJECT':
      const updatedProjects = state.projects.map(p => p.id === action.payload.id ? action.payload : p);
      storage.set('projects', updatedProjects);
      // Sync with API
      api.projects.update(action.payload.id, action.payload).catch(err => console.warn('Failed to sync project update to API:', err));
      return { ...state, projects: updatedProjects };
    
    case 'DELETE_PROJECT':
      const filteredProjects = state.projects.filter(p => p.id !== action.payload);
      storage.set('projects', filteredProjects);
      // Sync with API
      api.projects.delete(action.payload).catch(err => console.warn('Failed to sync project deletion to API:', err));
      return { ...state, projects: filteredProjects };
    
    case 'SET_TASKS':
      storage.set('tasks', action.payload);
      return { ...state, tasks: action.payload };
    
    case 'ADD_TASK':
      const newTasks = [...state.tasks, action.payload];
      storage.set('tasks', newTasks);
      // Note: Task creation is now handled in CreateTaskModal before dispatching ADD_TASK
      // This ensures we have the correct database ID and structure
      // Recalculate project progress
      const updatedProjectsAfterAdd = state.projects.map(project => {
        const projectTasks = newTasks.filter(t => t.projectId === project.id);
        if (projectTasks.length === 0) {
          return { ...project, progress: 0 };
        }
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedTasks / projectTasks.length) * 100);
        return { ...project, progress };
      });
      storage.set('projects', updatedProjectsAfterAdd);
      // Sync updated project progress to backend
      updatedProjectsAfterAdd.forEach(project => {
        const originalProject = state.projects.find(p => p.id === project.id);
        if (originalProject && originalProject.progress !== project.progress) {
          api.projects.update(project.id, { progress: project.progress }).catch(err => 
            console.warn('Failed to sync project progress update to API:', err)
          );
        }
      });
      return { ...state, tasks: newTasks, projects: updatedProjectsAfterAdd };
    
    case 'UPDATE_TASK':
      const updatedTasks = state.tasks.map(t => t.id === action.payload.id ? action.payload : t);
      storage.set('tasks', updatedTasks);
      // Sync with API - format data properly for backend
      const taskToSync = {
        title: action.payload.title,
        description: action.payload.description,
        status: action.payload.status,
        priority: action.payload.priority,
        dueDate: action.payload.dueDate instanceof Date 
          ? action.payload.dueDate.toISOString() 
          : new Date(action.payload.dueDate).toISOString(),
        assignedTo: action.payload.assignedTo 
          ? action.payload.assignedTo.map((user: any) => typeof user === 'string' ? user : user.id)
          : undefined,
        tags: action.payload.tags || [],
      };
      api.tasks.update(action.payload.id, taskToSync).catch(err => {
        console.warn('Failed to sync task update to API:', err);
        console.warn('Task data sent:', taskToSync);
      });
      // Recalculate project progress
      const updatedProjectsAfterUpdate = state.projects.map(project => {
        const projectTasks = updatedTasks.filter(t => t.projectId === project.id);
        if (projectTasks.length === 0) {
          return { ...project, progress: 0 };
        }
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedTasks / projectTasks.length) * 100);
        return { ...project, progress };
      });
      storage.set('projects', updatedProjectsAfterUpdate);
      // Sync updated project progress to backend
      updatedProjectsAfterUpdate.forEach(project => {
        const originalProject = state.projects.find(p => p.id === project.id);
        if (originalProject && originalProject.progress !== project.progress) {
          api.projects.update(project.id, { progress: project.progress }).catch(err => 
            console.warn('Failed to sync project progress update to API:', err)
          );
        }
      });
      return { ...state, tasks: updatedTasks, projects: updatedProjectsAfterUpdate };
    
    case 'DELETE_TASK':
      const filteredTasks = state.tasks.filter(t => t.id !== action.payload);
      storage.set('tasks', filteredTasks);
      // Sync with API
      api.tasks.delete(action.payload).catch(err => console.warn('Failed to sync task deletion to API:', err));
      // Recalculate project progress
      const updatedProjectsAfterDelete = state.projects.map(project => {
        const projectTasks = filteredTasks.filter(t => t.projectId === project.id);
        if (projectTasks.length === 0) {
          return { ...project, progress: 0 };
        }
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedTasks / projectTasks.length) * 100);
        return { ...project, progress };
      });
      storage.set('projects', updatedProjectsAfterDelete);
      // Sync updated project progress to backend
      updatedProjectsAfterDelete.forEach(project => {
        const originalProject = state.projects.find(p => p.id === project.id);
        if (originalProject && originalProject.progress !== project.progress) {
          api.projects.update(project.id, { progress: project.progress }).catch(err => 
            console.warn('Failed to sync project progress update to API:', err)
          );
        }
      });
      return { ...state, tasks: filteredTasks, projects: updatedProjectsAfterDelete };
    
    case 'SET_NOTIFICATIONS':
      storage.set('notifications', action.payload);
      return { ...state, notifications: action.payload };
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      storage.set('notifications', newNotifications);
      return { ...state, notifications: newNotifications };
    
    case 'MARK_NOTIFICATION_READ':
      const updatedNotifications = state.notifications.map(n => 
        n.id === action.payload ? { ...n, read: true } : n
      );
      storage.set('notifications', updatedNotifications);
      // Sync with API
      api.notifications.update(action.payload, { read: true }).catch(err => 
        console.warn('Failed to sync notification read status to API:', err)
      );
      return { ...state, notifications: updatedNotifications };
    
    case 'SET_ACTIVITIES':
      // Deduplicate activities by ID and description+userId+createdAt to prevent duplicates
      const uniqueActivities = action.payload.reduce((acc: Activity[], activity: Activity) => {
        // Check if activity already exists by ID
        const existsById = acc.some(a => a.id === activity.id);
        if (existsById) return acc;
        
        // Check if activity already exists by description, userId, and createdAt (within 1 second tolerance)
        const existsByContent = acc.some(a => 
          a.description === activity.description &&
          a.userId === activity.userId &&
          Math.abs(new Date(a.createdAt).getTime() - new Date(activity.createdAt).getTime()) < 1000
        );
        if (existsByContent) return acc;
        
        return [...acc, activity];
      }, []);
      
      storage.set('activities', uniqueActivities);
      return { ...state, activities: uniqueActivities };
    
    case 'ADD_ACTIVITY':
      // Check if activity already exists to prevent duplicates
      const activityExists = state.activities.some(a => 
        a.id === action.payload.id ||
        (a.description === action.payload.description &&
         a.userId === action.payload.userId &&
         Math.abs(new Date(a.createdAt).getTime() - new Date(action.payload.createdAt).getTime()) < 1000)
      );
      
      if (activityExists) {
        console.log('⚠️ Activity already exists, skipping duplicate:', action.payload.description);
        return state; // Don't add duplicate
      }
      
      const newActivities = [action.payload, ...state.activities];
      storage.set('activities', newActivities);
      // Sync with API - format data properly (API doesn't need id, user object, etc.)
      const activityToSync = {
        type: action.payload.type,
        description: action.payload.description,
        userId: action.payload.userId,
        projectId: action.payload.projectId || undefined,
        taskId: action.payload.taskId || undefined,
      };
      api.activities.create(activityToSync)
        .then((createdActivity) => {
          // Update localStorage with the created activity (has proper ID from backend)
          // Replace the temporary ID activity with the real one from API
          const updatedActivities = newActivities.map(a => 
            a.id === action.payload.id ? createdActivity : a
          );
          storage.set('activities', updatedActivities);
          // Note: We don't update state here to avoid race conditions, 
          // but the activity is now in the database and will be fetched on next refresh
        })
        .catch(err => 
          console.warn('Failed to sync activity to API:', err)
        );
      return { ...state, activities: newActivities };

    case 'SET_CUSTOMERS':
      const normalizedCustomers = normalizeCustomers(action.payload);
      storage.set('customers', normalizedCustomers);
      return { ...state, customers: normalizedCustomers };

    case 'ADD_CUSTOMER':
      const newCustomers = normalizeCustomers([action.payload, ...state.customers]);
      storage.set('customers', newCustomers);
      // Sync with API
      api.customers.create(action.payload).catch(err => console.warn('Failed to sync customer to API:', err));
      return { ...state, customers: newCustomers };

    case 'UPDATE_CUSTOMER':
      const updatedCustomers = normalizeCustomers(
        state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        )
      );
      storage.set('customers', updatedCustomers);
      // Sync with API
      api.customers.update(action.payload.id, action.payload).catch(err => console.warn('Failed to sync customer update to API:', err));
      return { ...state, customers: updatedCustomers };

    case 'DELETE_CUSTOMER':
      const filteredCustomers = state.customers.filter(customer => customer.id !== action.payload);
      storage.set('customers', filteredCustomers);
      // Sync with API
      api.customers.delete(action.payload).catch(err => console.warn('Failed to sync customer deletion to API:', err));
      return { ...state, customers: filteredCustomers };

    case 'SET_TIME_ENTRIES':
      const normalizedTimeEntries = normalizeTimeEntries(action.payload);
      storage.set('timeEntries', normalizedTimeEntries);
      return { ...state, timeEntries: normalizedTimeEntries };

    case 'ADD_TIME_ENTRY':
      const normalizedNewEntry = normalizeTimeEntries([action.payload])[0];
      const newTimeEntries = [normalizedNewEntry, ...state.timeEntries];
      storage.set('timeEntries', newTimeEntries);
      return { ...state, timeEntries: newTimeEntries };

    case 'UPDATE_TIME_ENTRY':
      const updatedTimeEntries = normalizeTimeEntries(
        state.timeEntries.map(te => 
          te.id === action.payload.id ? action.payload : te
        )
      );
      storage.set('timeEntries', updatedTimeEntries);
      return { ...state, timeEntries: updatedTimeEntries };

    case 'DELETE_TIME_ENTRY':
      const filteredTimeEntries = state.timeEntries.filter(te => te.id !== action.payload);
      storage.set('timeEntries', filteredTimeEntries);
      return { ...state, timeEntries: filteredTimeEntries };

    case 'SET_INCOMES':
      const normalizedIncomes = normalizeIncomes(action.payload);
      storage.set('incomes', normalizedIncomes);
      return { ...state, incomes: normalizedIncomes };

    case 'ADD_INCOME':
      // Income is already created via API in the modal, just add to local state
      const newIncomes = normalizeIncomes([action.payload, ...state.incomes]);
      storage.set('incomes', newIncomes);
      return { ...state, incomes: newIncomes };

    case 'UPDATE_INCOME':
      const updatedIncomes = normalizeIncomes(
        state.incomes.map(income =>
          income.id === action.payload.id ? action.payload : income
        )
      );
      storage.set('incomes', updatedIncomes);
      // Sync with API
      api.incomes.update(action.payload.id, action.payload).catch(err => console.warn('Failed to sync income update to API:', err));
      return { ...state, incomes: updatedIncomes };

    case 'DELETE_INCOME':
      const filteredIncomes = state.incomes.filter(income => income.id !== action.payload);
      storage.set('incomes', filteredIncomes);
      // Sync with API
      api.incomes.delete(action.payload).catch(err => console.warn('Failed to sync income deletion to API:', err));
      return { ...state, incomes: filteredIncomes };
    
    case 'SET_LOCALE':
      storage.set('locale', action.payload);
      return { ...state, locale: action.payload };

    case 'SET_THEME':
      storage.set('theme', action.payload);
      return { ...state, theme: action.payload };
    
    case 'TOGGLE_THEME':
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      storage.set('theme', newTheme);
      return { ...state, theme: newTheme };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_AUTHENTICATED':
      console.log('🟢 AppContext: SET_AUTHENTICATED action dispatched:', action.payload);
      const newAuthState = { ...state, isAuthenticated: action.payload };
      console.log('🟢 AppContext: New state after SET_AUTHENTICATED:', { 
        isAuthenticated: newAuthState.isAuthenticated,
        hasUser: !!newAuthState.user 
      });
      return newAuthState;
    
    case 'SET_ACTIVE_TIMER':
      return { ...state, activeTimer: action.payload };
    
    case 'UPDATE_TIMER_ELAPSED':
      return { ...state, timerElapsedSeconds: action.payload };
    
    case 'LOGOUT':
      timerService.clearTimer();
      storage.clear();
      // Clear fetch refs to allow fresh data fetch on next login
      // Note: We can't access refs here, but they'll be cleared in the auth listener
      // Sign out from Supabase (will trigger SIGNED_OUT event in auth listener)
      // Don't await here - let the auth state listener handle the cleanup
      supabase.auth.signOut().catch(err => {
        console.error('Failed to sign out from Supabase:', err);
        // Even if signOut fails, clear local state
      });
      return { ...initialState, user: null, isAuthenticated: false };
    
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Track ongoing fetch to prevent duplicate calls
  const fetchUserDataRef = React.useRef<Promise<void> | null>(null);
  const lastFetchedUserIdRef = React.useRef<string | null>(null);

  // Reusable function to fetch user data (projects, tasks, etc.) - optimized single request
  const fetchUserData = React.useCallback(async (userId?: string) => {
    const effectiveUserId = userId || state.user?.id;
    
    // Prevent duplicate calls for the same user
    if (!effectiveUserId) {
      console.warn('⚠️ AppContext: Cannot fetch user data without userId');
      return;
    }
    
    // If user ID changed, clear the refs to allow fresh fetch
    if (lastFetchedUserIdRef.current && lastFetchedUserIdRef.current !== effectiveUserId) {
      console.log('📥 AppContext: User ID changed, clearing refs for fresh fetch...');
      fetchUserDataRef.current = null;
      lastFetchedUserIdRef.current = null;
    }
    
    // If already fetching for this user, return the existing promise
    if (fetchUserDataRef.current && lastFetchedUserIdRef.current === effectiveUserId) {
      console.log('📥 AppContext: Already fetching data for user, reusing promise...');
      return fetchUserDataRef.current;
    }
    
    console.log('📥 AppContext: Fetching user data from optimized endpoint...', `for user: ${effectiveUserId}`);
    
    // Create and store the promise
    const fetchPromise = (async () => {
      try {
        const data = await api.dashboard.getInitialData(effectiveUserId);

        // Filter out projects with invalid IDs (timestamps instead of UUIDs)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validProjects = (data.projects || []).filter((p: any) => uuidRegex.test(p.id));
        if (validProjects.length !== (data.projects || []).length) {
          console.warn(`⚠️ Filtered out ${(data.projects || []).length - validProjects.length} projects with invalid IDs`);
        }

        console.log(`📥 AppContext: Loaded ${validProjects.length} projects, ${(data.tasks || []).length} tasks, ${(data.customers || []).length} customers`);

        // Update state with fetched data
        dispatch({ type: 'SET_PROJECTS', payload: validProjects });
        dispatch({ type: 'SET_TASKS', payload: normalizeTasks(data.tasks || []) });
        dispatch({ type: 'SET_CUSTOMERS', payload: data.customers || [] });
        dispatch({ type: 'SET_TIME_ENTRIES', payload: normalizeTimeEntries(data.timeEntries || []) });
        dispatch({ type: 'SET_INCOMES', payload: normalizeIncomes(data.incomes || []) });
        dispatch({ type: 'SET_NOTIFICATIONS', payload: data.notifications || [] });
        dispatch({ type: 'SET_ACTIVITIES', payload: data.activities || [] });
      } catch (error) {
        console.error('❌ AppContext: Failed to fetch user data:', error);
        // Fallback to individual API calls if optimized endpoint fails
        console.warn('⚠️ Falling back to individual API calls (sequential)...');
        try {
          const projects = await safeFetch<Project[]>('projects.getAll', () => api.projects.getAll(), []);
          const tasks = await safeFetch<Task[]>('tasks.getAll', () => api.tasks.getAll(), []);
          const customers = await safeFetch<Customer[]>('customers.getAll', () => api.customers.getAll(), []);
          const timeEntries = await safeFetch<TimeEntry[]>('timeEntries.getAll', () => api.timeEntries.getAll(), []);
          const incomes = await safeFetch<Income[]>('incomes.getAll', () => api.incomes.getAll(), []);
          const notifications = await safeFetch<Notification[]>('notifications.getAll', () => api.notifications.getAll(), []);
          const activities = await safeFetch<Activity[]>('activities.getAll', () => api.activities.getAll(), []);

          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const validProjects = projects.filter((p: any) => uuidRegex.test(p.id));
          dispatch({ type: 'SET_PROJECTS', payload: validProjects });
          dispatch({ type: 'SET_TASKS', payload: normalizeTasks(tasks) });
          dispatch({ type: 'SET_CUSTOMERS', payload: customers });
          dispatch({ type: 'SET_TIME_ENTRIES', payload: normalizeTimeEntries(timeEntries) });
          dispatch({ type: 'SET_INCOMES', payload: normalizeIncomes(incomes) });
          dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
          dispatch({ type: 'SET_ACTIVITIES', payload: activities });
        } catch (fallbackError) {
          console.error('❌ AppContext: Fallback also failed:', fallbackError);
        }
      } finally {
        // Clear the ref when done
        if (fetchUserDataRef.current === fetchPromise) {
          fetchUserDataRef.current = null;
          lastFetchedUserIdRef.current = null;
        }
      }
    })();
    
    // Store the promise and userId
    fetchUserDataRef.current = fetchPromise;
    lastFetchedUserIdRef.current = effectiveUserId;
    
    return fetchPromise;
  }, [state.user?.id]);

  // Initialize app with data from API or fallback to localStorage/mock data
  useEffect(() => {
    const initializeApp = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Initialize storage (for theme/locale preferences)
        initializeStorage();

        // Check for existing Supabase session first
        let authenticatedUser: User | null = null;
        console.log('🔵 AppContext: Checking for existing session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('🔵 AppContext: Session check result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: sessionError?.message 
        });
        
        if (session && session.user && !sessionError) {
          // User is authenticated, fetch their profile from backend
          console.log('🔵 AppContext: Session found, fetching user profile from backend...');
          try {
            let userProfile = null;
            try {
              // Try to get user by ID from backend
              userProfile = await api.users.getById(session.user.id);
            } catch (apiError: any) {
              // User doesn't exist in backend, create it
              if (apiError.status === 404) {
                console.log('🔵 AppContext: User not found in backend, creating...');
                const newUser = {
                  id: session.user.id,
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  email: session.user.email || '',
                  role: 'contributor' as const,
                  avatar: session.user.user_metadata?.avatar_url,
                  isOnline: true,
                };
                
                try {
                  userProfile = await api.users.create(newUser);
                  console.log('✅ AppContext: User created in backend');
                } catch (createError) {
                  console.warn('⚠️ AppContext: Failed to create user in backend:', createError);
                  // Use the newUser object anyway
                  userProfile = newUser;
                }
              } else {
                throw apiError;
              }
            }

            if (userProfile) {
              authenticatedUser = {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                role: userProfile.role,
                avatar: userProfile.avatar,
                isOnline: true,
              };
              dispatch({ type: 'SET_USER', payload: authenticatedUser });
              dispatch({ type: 'SET_AUTHENTICATED', payload: true });
            }
          } catch (error) {
            console.warn('Failed to fetch/create user profile:', error);
          }
        }
        
        // Set loading to false once we have authenticated user (don't wait for all API calls)
        if (authenticatedUser) {
          dispatch({ type: 'SET_LOADING', payload: false });
          // Fetch user data if authenticated
          fetchUserData(authenticatedUser.id);
        } else {
          // Try to load data from API first (non-blocking) - only if not authenticated
          try {
            const users = await safeFetch<User[]>('users.getAll', () => api.users.getAll(), []);
            const projects = await safeFetch<Project[]>('projects.getAll', () => api.projects.getAll(), []);
            const tasks = await safeFetch<Task[]>('tasks.getAll', () => api.tasks.getAll(), []);
            const customers = await safeFetch<Customer[]>('customers.getAll', () => api.customers.getAll(), []);
            const timeEntries = await safeFetch<TimeEntry[]>('timeEntries.getAll', () => api.timeEntries.getAll(), []);
            const incomes = await safeFetch<Income[]>('incomes.getAll', () => api.incomes.getAll(), []);
            const notifications = await safeFetch<Notification[]>('notifications.getAll', () => api.notifications.getAll(), []);
            const activities = await safeFetch<Activity[]>('activities.getAll', () => api.activities.getAll(), []);

            if (users.length > 0 || projects.length > 0 || tasks.length > 0) {
              dispatch({ type: 'SET_USER', payload: users[0] || null });
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              const validProjects = projects.filter((p: any) => uuidRegex.test(p.id));
              if (validProjects.length !== projects.length) {
                console.warn(`⚠️ Filtered out ${projects.length - validProjects.length} projects with invalid IDs`);
              }
              dispatch({ type: 'SET_PROJECTS', payload: validProjects });
              dispatch({ type: 'SET_TASKS', payload: normalizeTasks(tasks) });
              dispatch({ type: 'SET_CUSTOMERS', payload: customers });
              dispatch({ type: 'SET_TIME_ENTRIES', payload: normalizeTimeEntries(timeEntries) });
              dispatch({ type: 'SET_INCOMES', payload: normalizeIncomes(incomes) });
              dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
              dispatch({ type: 'SET_ACTIVITIES', payload: activities });
            } else {
              // Fallback to localStorage or mock data (only if not authenticated)
              if (!authenticatedUser) {
                const storedUser = storage.get<User>('user');
                const storedProjects = storage.get<Project[]>('projects');
                const storedTasks = storage.get<Task[]>('tasks');
                const storedCustomers = storage.get<Customer[]>('customers');
                const storedTimeEntries = storage.get<TimeEntry[]>('timeEntries');
                const storedIncomes = storage.get<Income[]>('incomes');
                const storedNotifications = storage.get<Notification[]>('notifications');
                const storedActivities = storage.get<Activity[]>('activities');

                if (!storedUser) {
                  // Use mock data if nothing stored
                  dispatch({ type: 'SET_USER', payload: mockUsers[0] });
                  dispatch({ type: 'SET_PROJECTS', payload: mockProjects });
                  dispatch({ type: 'SET_TASKS', payload: mockTasks });
                  dispatch({ type: 'SET_CUSTOMERS', payload: mockCustomers });
                  dispatch({ type: 'SET_TIME_ENTRIES', payload: mockTimeEntries });
                  dispatch({ type: 'SET_INCOMES', payload: mockIncomes });
                  dispatch({ type: 'SET_NOTIFICATIONS', payload: mockNotifications });
                  dispatch({ type: 'SET_ACTIVITIES', payload: mockActivities });
                } else {
                  // Use stored data
                  dispatch({ type: 'SET_USER', payload: storedUser });
                  dispatch({ type: 'SET_PROJECTS', payload: storedProjects || [] });
                  dispatch({ type: 'SET_TASKS', payload: storedTasks || [] });
                  dispatch({ type: 'SET_CUSTOMERS', payload: storedCustomers || [] });
                  dispatch({ type: 'SET_TIME_ENTRIES', payload: storedTimeEntries || [] });
                  dispatch({ type: 'SET_INCOMES', payload: normalizeIncomes(storedIncomes || []) });
                  dispatch({ type: 'SET_NOTIFICATIONS', payload: storedNotifications || [] });
                  dispatch({ type: 'SET_ACTIVITIES', payload: storedActivities || [] });
                }
              }
            }
          } catch (apiError) {
            console.warn('API connection failed, using localStorage/mock data:', apiError);
            if (!authenticatedUser) {
              const storedUser = storage.get<User>('user');
              const storedProjects = storage.get<Project[]>('projects');
              const storedTasks = storage.get<Task[]>('tasks');
              const storedCustomers = storage.get<Customer[]>('customers');
              const storedTimeEntries = storage.get<TimeEntry[]>('timeEntries');
              const storedIncomes = storage.get<Income[]>('incomes');
              const storedNotifications = storage.get<Notification[]>('notifications');
              const storedActivities = storage.get<Activity[]>('activities');

              if (!storedUser) {
                dispatch({ type: 'SET_USER', payload: mockUsers[0] });
                dispatch({ type: 'SET_PROJECTS', payload: mockProjects });
                dispatch({ type: 'SET_TASKS', payload: mockTasks });
                dispatch({ type: 'SET_CUSTOMERS', payload: mockCustomers });
                dispatch({ type: 'SET_TIME_ENTRIES', payload: mockTimeEntries });
                dispatch({ type: 'SET_INCOMES', payload: mockIncomes });
                dispatch({ type: 'SET_NOTIFICATIONS', payload: mockNotifications });
                dispatch({ type: 'SET_ACTIVITIES', payload: mockActivities });
              } else {
                dispatch({ type: 'SET_USER', payload: storedUser });
                dispatch({ type: 'SET_PROJECTS', payload: storedProjects || [] });
                dispatch({ type: 'SET_TASKS', payload: storedTasks || [] });
                dispatch({ type: 'SET_CUSTOMERS', payload: storedCustomers || [] });
                dispatch({ type: 'SET_TIME_ENTRIES', payload: storedTimeEntries || [] });
                dispatch({ type: 'SET_INCOMES', payload: normalizeIncomes(storedIncomes || []) });
                dispatch({ type: 'SET_NOTIFICATIONS', payload: storedNotifications || [] });
                dispatch({ type: 'SET_ACTIVITIES', payload: storedActivities || [] });
              }
            }
          }
        }

        // Load theme and locale from localStorage (these stay local)
        const storedTheme = storage.get<'light' | 'dark'>('theme');
        const storedLocale = storage.get<Locale>('locale');
        
        if (storedTheme) {
          dispatch({ type: 'SET_THEME', payload: storedTheme });
        }
        dispatch({ type: 'SET_LOCALE', payload: storedLocale || 'en' });
        
        // Ensure loading is false if not already set
        if (!authenticatedUser) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        
      } catch (error) {
        console.error('❌ AppContext: Error initializing app:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app' });
        dispatch({ type: 'SET_LOADING', payload: false });
        toast.error('Failed to load application data');
      }
    };

    initializeApp();
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    console.log('🟣 AppContext: Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🟣 AppContext: Auth state changed:', { 
        event, 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🟣 AppContext: SIGNED_IN event, fetching user profile from backend...');
        // User signed in - fetch their profile from backend
        try {
          let userProfile = null;
          try {
            // Try to get user by ID from backend
            userProfile = await api.users.getById(session.user.id);
            console.log('🟣 AppContext: User found in backend');
          } catch (apiError: any) {
            // User doesn't exist in backend, create it
            if (apiError.status === 404) {
              console.log('🟣 AppContext: User not found in backend, creating...');
              const newUser = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                role: 'contributor' as const,
                avatar: session.user.user_metadata?.avatar_url,
                isOnline: true,
              };
              
              try {
                userProfile = await api.users.create(newUser);
                console.log('✅ AppContext: User created in backend');
              } catch (createError) {
                console.warn('⚠️ AppContext: Failed to create user in backend:', createError);
                // Use the newUser object anyway
                userProfile = newUser;
              }
            } else {
              throw apiError;
            }
          }

          if (userProfile) {
            const user = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
              avatar: userProfile.avatar,
              isOnline: true,
            };
            console.log('🟣 AppContext: Dispatching SET_USER from auth listener:', user);
            dispatch({ type: 'SET_USER', payload: user });
            dispatch({ type: 'SET_AUTHENTICATED', payload: true });
            console.log('🟣 AppContext: User set successfully');
            // Fetch user data after setting user
            fetchUserData(session.user.id);
          }
        } catch (error) {
          console.error('❌ AppContext: Exception fetching user profile on auth change:', error);
          // Fallback: use auth user data
          const fallbackUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'contributor' as const,
            avatar: session.user.user_metadata?.avatar_url,
            isOnline: true,
          };
          console.log('🟣 AppContext: Using fallback user:', fallbackUser);
          dispatch({ type: 'SET_USER', payload: fallbackUser });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
          // Fetch user data after setting user
          fetchUserData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear everything
        console.log('🟣 AppContext: SIGNED_OUT event, clearing state');
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        timerService.clearTimer();
        storage.clear();
        // Clear fetch refs to allow fresh data fetch on next login
        fetchUserDataRef.current = null;
        lastFetchedUserIdRef.current = null;
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refreshed - ensure user is still authenticated
        console.log('🟣 AppContext: TOKEN_REFRESHED event');
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      }
    });

    return () => {
      console.log('🟣 AppContext: Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Apply locale direction and lang
  useEffect(() => {
    const root = document.documentElement;
    const lang = state.locale === 'he' ? 'he' : 'en';
    const dir = state.locale === 'he' ? 'rtl' : 'ltr';
    root.setAttribute('lang', lang);
    root.setAttribute('dir', dir);
  }, [state.locale]);

  // Load and apply accessibility settings on mount
  useEffect(() => {
    const applyAccessibilitySettings = () => {
      interface AccessibilitySettings {
        textSize: number;
        highContrast: boolean;
        largeCursor: boolean;
      }

      const savedSettings = storage.get<AccessibilitySettings>('accessibilitySettings');
      if (savedSettings) {
        const root = document.documentElement;
        
        // Apply text size
        root.style.fontSize = `${savedSettings.textSize}%`;
        
        // Apply high contrast
        if (savedSettings.highContrast) {
          root.classList.add('high-contrast');
        }
        
        // Apply large cursor
        if (savedSettings.largeCursor) {
          root.classList.add('large-cursor');
        }
      }
    };

    applyAccessibilitySettings();
  }, []);

  // Subscribe to timer service updates
  useEffect(() => {
    const unsubscribe = timerService.subscribe((timer, elapsedSeconds) => {
      dispatch({ type: 'SET_ACTIVE_TIMER', payload: timer });
      dispatch({ type: 'UPDATE_TIMER_ELAPSED', payload: elapsedSeconds });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}