export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'contributor';
  avatar?: string;
  isOnline?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date | null;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  priority: 'low' | 'medium' | 'high';
  members: User[];
  tasks: Task[];
  createdBy: string;
  customerId?: string;
  customer?: Customer;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: User[];
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
  attachments: Attachment[];
  tags: string[];
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user: User;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Notification {
  id: string;
  type: 'task_assigned' | 'deadline_approaching' | 'task_completed' | 'project_updated' | 'event_reminder' | 'event_starting';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Date;
  relatedId?: string;
}

export interface Activity {
  id: string;
  type: 'project_created' | 'task_created' | 'task_updated' | 'member_added';
  description: string;
  userId: string;
  user: User;
  projectId?: string;
  taskId?: string;
  createdAt: Date;
}

export type Locale = 'en' | 'he';

export type CustomerStatus = 'active' | 'trial' | 'paused' | 'churned';

export type PaymentMethod = 'bank-transfer' | 'credit-card' | 'direct-debit' | 'cash';

export type PaymentFrequency = 'monthly' | 'quarterly' | 'annual';

export type BillingModel = 'retainer' | 'hourly' | 'project';

export interface Customer {
  id: string;
  name: string;
  status: CustomerStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  taxId: string;
  joinDate: Date;
  industry?: string;
  paymentMethod: PaymentMethod;
  billingCycle: PaymentFrequency;
  billingModel: BillingModel;
  currency: string;
  monthlyRetainer: number;
  annualFee: number;
  hoursPerMonth: number;
  customerScore: number;
  notes?: string;
  referralSource?: string;
  userId: string;
  tags: string[];
}

export interface TimeEntry {
  id: string;
  customerId: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  hourlyRate: number;
  income: number; // calculated based on duration and hourly rate
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Income {
  id: string;
  customerId: string;
  customerName: string;
  incomeDate: Date;
  invoiceNumber?: string;
  vatRate: number; // e.g., 0.18 for 18%
  amountBeforeVat: number;
  vatAmount: number; // calculated
  finalAmount: number; // calculated
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'monthly' | 'annual' | 'trial';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingHistory {
  id: string;
  userId: string;
  invoiceNumber: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  billingDate: Date;
  status: 'paid' | 'pending' | 'failed';
  createdAt: Date;
}

export interface BusinessDetails {
  businessName: string;
  businessField: string;
  digitalSignature?: string;
}

export interface ActiveTimer {
  id: string;
  customerId: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: Date;
  isRunning: boolean;
  isPaused: boolean;
  pausedDuration: number; // Total paused time in seconds
  pauseStartTime?: Date; // When the current pause started
  userId: string;
}

export interface TimerLog {
  id: string;
  customerId: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  hourlyRate: number;
  income: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  allDay: boolean;
  recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recurrenceEndDate?: Date | null;
  recurrenceCount?: number | null;
  meetingLink?: string | null;
  userId: string;
  customerId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional, populated when needed)
  customer?: Customer | null;
  project?: Project | null;
  task?: Task | null;
  user?: User | null;
}