import { User, Project, Task, Notification, Activity, Customer, TimeEntry, Income } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ajay Dhangar',
    email: 'ajay@codeharborhub.github.io',
    role: 'admin',
    avatar: 'https://avatars.githubusercontent.com/u/99037494?v=4',
    isOnline: true
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@codeharborhub.github.io',
    role: 'manager',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    isOnline: true
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@codeharborhub.github.io',
    role: 'contributor',
    avatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    isOnline: false
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@codeharborhub.github.io',
    role: 'contributor',
    avatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    isOnline: true
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'E-commerce Platform',
    description: 'Building a modern e-commerce platform with React and Node.js',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-30'),
    status: 'in-progress',
    progress: 65,
    priority: 'high',
    members: [mockUsers[0], mockUsers[1], mockUsers[2]],
    tasks: [],
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: '2',
    title: 'Mobile App Development',
    description: 'Creating a cross-platform mobile app using React Native',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-08-15'),
    status: 'in-progress',
    progress: 30,
    priority: 'medium',
    members: [mockUsers[1], mockUsers[3]],
    tasks: [],
    createdBy: '2',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: '3',
    title: 'Data Analytics Dashboard',
    description: 'Building a comprehensive analytics dashboard for business insights',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-05-30'),
    status: 'planning',
    progress: 15,
    priority: 'medium',
    members: [mockUsers[0], mockUsers[3]],
    tasks: [],
    createdBy: '1',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05')
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design Database Schema',
    description: 'Create comprehensive database schema for the e-commerce platform',
    projectId: '1',
    assignedTo: [mockUsers[0]],
    status: 'completed',
    priority: 'high',
    dueDate: new Date('2024-02-15'),
    createdBy: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-10'),
    comments: [],
    attachments: [],
    tags: ['database', 'backend']
  },
  {
    id: '2',
    title: 'Implement User Authentication',
    description: 'Set up JWT-based authentication system',
    projectId: '1',
    assignedTo: [mockUsers[1]],
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2024-03-01'),
    createdBy: '1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-20'),
    comments: [],
    attachments: [],
    tags: ['auth', 'security']
  },
  {
    id: '3',
    title: 'Build Product Catalog',
    description: 'Create product listing and catalog functionality',
    projectId: '1',
    assignedTo: [mockUsers[2]],
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-03-15'),
    createdBy: '1',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    comments: [],
    attachments: [],
    tags: ['frontend', 'ui']
  },
  {
    id: '4',
    title: 'Setup CI/CD Pipeline',
    description: 'Configure automated testing and deployment pipeline',
    projectId: '2',
    assignedTo: [mockUsers[1]],
    status: 'in-progress',
    priority: 'medium',
    dueDate: new Date('2024-03-10'),
    createdBy: '2',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-18'),
    comments: [],
    attachments: [],
    tags: ['devops', 'automation']
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'deadline_approaching',
    title: 'Deadline Approaching',
    message: 'Task "Implement User Authentication" is due in 2 days',
    userId: '1',
    read: false,
    createdAt: new Date('2024-02-20'),
    relatedId: '2'
  },
  {
    id: '2',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to "Build Product Catalog"',
    userId: '2',
    read: false,
    createdAt: new Date('2024-02-15'),
    relatedId: '3'
  },
  {
    id: '3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'Ajay Dhangar completed "Design Database Schema"',
    userId: '1',
    read: true,
    createdAt: new Date('2024-02-10'),
    relatedId: '1'
  }
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'task_updated',
    description: 'Updated task "Implement User Authentication"',
    userId: '1',
    user: mockUsers[0],
    projectId: '1',
    taskId: '2',
    createdAt: new Date('2024-02-20')
  },
  {
    id: '2',
    type: 'task_created',
    description: 'Created new task "Build Product Catalog"',
    userId: '1',
    user: mockUsers[0],
    projectId: '1',
    taskId: '3',
    createdAt: new Date('2024-02-15')
  },
  {
    id: '3',
    type: 'project_created',
    description: 'Created new project "Data Analytics Dashboard"',
    userId: '1',
    user: mockUsers[0],
    projectId: '3',
    createdAt: new Date('2024-03-01')
  }
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'אמיר ניסן',
    status: 'active',
    contactName: 'אמיר ניסן',
    contactEmail: 'amir@example.com',
    contactPhone: '050-123-4567',
    country: 'ישראל',
    taxId: '3453453454',
    joinDate: new Date('2025-03-03'),
    industry: 'ייעוץ עסקי',
    paymentMethod: 'bank-transfer',
    billingCycle: 'annual',
    billingModel: 'retainer',
    currency: '₪',
    monthlyRetainer: 300,
    annualFee: 3600,
    hoursPerMonth: 8,
    customerScore: 82,
    referralSource: 'גוגל',
    tags: ['פרימיום', 'B2B']
  },
  {
    id: 'cust-2',
    name: 'סיוון רז',
    status: 'trial',
    contactName: 'סיוון רז',
    contactEmail: 'sivan@example.com',
    contactPhone: '052-987-6543',
    country: 'ישראל',
    taxId: '512512512',
    joinDate: new Date('2025-01-12'),
    industry: 'שיווק דיגיטלי',
    paymentMethod: 'credit-card',
    billingCycle: 'monthly',
    billingModel: 'project',
    currency: '₪',
    monthlyRetainer: 0,
    annualFee: 0,
    hoursPerMonth: 12,
    customerScore: 68,
    referralSource: 'לינקדאין',
    tags: ['פיילוט']
  },
  {
    id: 'cust-3',
    name: 'סטודיו אור',
    status: 'paused',
    contactName: 'אור לוי',
    contactEmail: 'or@example.com',
    contactPhone: '053-222-3344',
    country: 'ישראל',
    taxId: '298374652',
    joinDate: new Date('2024-07-01'),
    industry: 'עיצוב גרפי',
    paymentMethod: 'direct-debit',
    billingCycle: 'monthly',
    billingModel: 'retainer',
    currency: '₪',
    monthlyRetainer: 1200,
    annualFee: 14400,
    hoursPerMonth: 20,
    customerScore: 54,
    referralSource: 'הפניה מפה לאוזן',
    tags: ['עצמאים']
  },
  {
    id: 'cust-4',
    name: 'קרן טכנולוגיות',
    status: 'active',
    contactName: 'דנה קרן',
    contactEmail: 'dana@example.com',
    contactPhone: '054-876-5432',
    country: 'ארה"ב',
    taxId: '98-7654321',
    joinDate: new Date('2023-11-15'),
    industry: 'חברת תוכנה',
    paymentMethod: 'bank-transfer',
    billingCycle: 'quarterly',
    billingModel: 'retainer',
    currency: '$',
    monthlyRetainer: 4500,
    annualFee: 54000,
    hoursPerMonth: 40,
    customerScore: 91,
    referralSource: 'כנס מקצועי',
    tags: ['אסטרטגי', 'חוזה ארוך טווח']
  },
  {
    id: 'cust-5',
    name: 'עדי דיגיטל',
    status: 'churned',
    contactName: 'עדי בן חור',
    contactEmail: 'adi@example.com',
    contactPhone: '058-111-8899',
    country: 'ישראל',
    taxId: '457812369',
    joinDate: new Date('2022-05-20'),
    industry: 'סטארט-אפ',
    paymentMethod: 'cash',
    billingCycle: 'monthly',
    billingModel: 'hourly',
    currency: '₪',
    monthlyRetainer: 0,
    annualFee: 0,
    hoursPerMonth: 5,
    customerScore: 40,
    referralSource: 'פייסבוק / אינסטגרם',
    tags: ['לשעבר', 'מעקב']
  }
];

// Helper function to calculate hourly rate from customer data
function getHourlyRate(customer: Customer): number {
  if (customer.billingModel === 'hourly' && customer.hoursPerMonth > 0) {
    return customer.monthlyRetainer / customer.hoursPerMonth;
  }
  // Default hourly rate based on monthly retainer and hours
  if (customer.hoursPerMonth > 0) {
    return customer.monthlyRetainer / customer.hoursPerMonth;
  }
  // Fallback default rate
  return 300; // ₪300 per hour default
}

export const mockTimeEntries: TimeEntry[] = [
  {
    id: 'time-1',
    customerId: 'cust-1',
    projectId: '1',
    taskId: '1',
    description: 'עיצוב ממשק משתמש חדש',
    startTime: new Date('2024-12-15T09:00:00'),
    endTime: new Date('2024-12-15T12:30:00'),
    duration: 3.5 * 3600, // 3.5 hours in seconds
    hourlyRate: getHourlyRate(mockCustomers[0]),
    income: 3.5 * getHourlyRate(mockCustomers[0]),
    userId: '1',
    createdAt: new Date('2024-12-15T12:30:00'),
    updatedAt: new Date('2024-12-15T12:30:00'),
  },
  {
    id: 'time-2',
    customerId: 'cust-2',
    projectId: '2',
    taskId: '4',
    description: 'פיתוח מודול תשלומים',
    startTime: new Date('2024-12-14T10:00:00'),
    endTime: new Date('2024-12-14T14:00:00'),
    duration: 4 * 3600, // 4 hours in seconds
    hourlyRate: getHourlyRate(mockCustomers[1]),
    income: 4 * getHourlyRate(mockCustomers[1]),
    userId: '1',
    createdAt: new Date('2024-12-14T14:00:00'),
    updatedAt: new Date('2024-12-14T14:00:00'),
  },
  {
    id: 'time-3',
    customerId: 'cust-1',
    projectId: '2',
    taskId: undefined,
    description: 'ישיבת תכנון והגדרת דרישות',
    startTime: new Date('2024-12-13T14:00:00'),
    endTime: new Date('2024-12-13T17:15:00'),
    duration: 3.25 * 3600, // 3.25 hours in seconds
    hourlyRate: getHourlyRate(mockCustomers[0]),
    income: 3.25 * getHourlyRate(mockCustomers[0]),
    userId: '1',
    createdAt: new Date('2024-12-13T17:15:00'),
    updatedAt: new Date('2024-12-13T17:15:00'),
  },
  {
    id: 'time-4',
    customerId: 'cust-3',
    projectId: '3',
    taskId: undefined,
    description: 'אופטימיזציה וביצועים',
    startTime: new Date('2024-12-12T09:30:00'),
    endTime: new Date('2024-12-12T13:00:00'),
    duration: 3.5 * 3600, // 3.5 hours in seconds
    hourlyRate: getHourlyRate(mockCustomers[2]),
    income: 3.5 * getHourlyRate(mockCustomers[2]),
    userId: '1',
    createdAt: new Date('2024-12-12T13:00:00'),
    updatedAt: new Date('2024-12-12T13:00:00'),
  },
  {
    id: 'time-5',
    customerId: 'cust-2',
    projectId: '2',
    taskId: '4',
    description: 'בדיקות ותיקון באגים',
    startTime: new Date('2024-12-11T15:00:00'),
    endTime: new Date('2024-12-11T18:30:00'),
    duration: 3.5 * 3600, // 3.5 hours in seconds
    hourlyRate: getHourlyRate(mockCustomers[1]),
    income: 3.5 * getHourlyRate(mockCustomers[1]),
    userId: '1',
    createdAt: new Date('2024-12-11T18:30:00'),
    updatedAt: new Date('2024-12-11T18:30:00'),
  },
];

export const mockIncomes: Income[] = [
  {
    id: 'income-1',
    customerId: 'cust-1',
    customerName: 'אמיר ניסן',
    incomeDate: new Date('2025-11-05'),
    invoiceNumber: '45345345',
    vatRate: 0.18,
    amountBeforeVat: 12220,
    vatAmount: 2199.6,
    finalAmount: 14419.6,
    createdAt: new Date('2025-11-05'),
    updatedAt: new Date('2025-11-05'),
  },
];