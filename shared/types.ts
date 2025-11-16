// Shared types between frontend and backend
// These types match the Prisma schema and frontend types

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'contributor';
  avatar?: string | null;
  isOnline?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  priority: 'low' | 'medium' | 'high';
  members: User[];
  tasks: Task[];
  createdBy: string;
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
  type: 'task_assigned' | 'deadline_approaching' | 'task_completed' | 'project_updated';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Date;
  relatedId?: string | null;
}

export interface Activity {
  id: string;
  type: 'project_created' | 'task_created' | 'task_updated' | 'member_added';
  description: string;
  userId: string;
  user: User;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  status: 'active' | 'trial' | 'paused' | 'churned';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  taxId: string;
  joinDate: Date;
  industry?: string | null;
  paymentMethod: 'bank-transfer' | 'credit-card' | 'direct-debit' | 'cash';
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  billingModel: 'retainer' | 'hourly' | 'project';
  currency: string;
  monthlyRetainer: number;
  annualFee: number;
  hoursPerMonth: number;
  customerScore: number;
  notes?: string | null;
  referralSource?: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  customerId: string;
  projectId: string;
  taskId?: string | null;
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

export interface Income {
  id: string;
  customerId: string;
  customerName: string;
  incomeDate: Date;
  invoiceNumber?: string | null;
  vatRate: number;
  amountBeforeVat: number;
  vatAmount: number;
  finalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveTimer {
  id: string;
  customerId: string;
  projectId: string;
  taskId?: string | null;
  description: string;
  startTime: Date;
  isRunning: boolean;
  userId: string;
}

