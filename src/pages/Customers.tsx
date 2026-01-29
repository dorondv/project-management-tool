import { useMemo, useState, useEffect, useRef } from 'react';
import { LayoutGrid, LayoutList, Plus, Search, FolderOpen, Trash2, ChevronLeft, ChevronRight, User, Building, Clock, CreditCard, MoreVertical, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Customer, CustomerStatus, PaymentMethod, BillingModel, PaymentFrequency, Locale, Currency } from '../types';
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from '../utils/currencyUtils';
import { CreateCustomerModal } from '../components/customers/CreateCustomerModal';
import { DeleteCustomerModal } from '../components/customers/DeleteCustomerModal';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

type ViewMode = 'list' | 'grid';
type StatusFilter = 'all' | 'active' | 'inactive';

const statusVariants: Record<CustomerStatus, 'success' | 'warning' | 'secondary' | 'error'> = {
  active: 'success',
  trial: 'warning',
  paused: 'secondary',
  churned: 'error',
};

const statusLabels: Record<Locale, Record<CustomerStatus, string>> = {
  en: {
    active: 'Active',
    trial: 'Trial',
    paused: 'Paused',
    churned: 'Churned',
  },
  he: {
    active: 'פעיל',
    trial: 'בפיילוט',
    paused: 'מושהה',
    churned: 'בוטל',
  },
};

const paymentMethodLabels: Record<Locale, Record<PaymentMethod, string>> = {
  en: {
    'bank-transfer': 'Bank Transfer',
    'credit-card': 'Credit Card',
    'direct-debit': 'Direct Debit',
    cash: 'Cash',
  },
  he: {
    'bank-transfer': 'העברה בנקאית',
    'credit-card': 'כרטיס אשראי',
    'direct-debit': 'הוראת קבע',
    cash: 'מזומן',
  },
};

const billingModelLabels: Record<Locale, Record<BillingModel, string>> = {
  en: {
    retainer: 'Retainer',
    hourly: 'Hourly',
    project: 'Project-based',
  },
  he: {
    retainer: 'ריטיינר',
    hourly: 'שעתי',
    project: 'פרויקטלי',
  },
};

const billingCycleLabels: Record<Locale, Record<PaymentFrequency, string>> = {
  en: {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  },
  he: {
    monthly: 'חודשי',
    quarterly: 'רבעוני',
    annual: 'שנתי',
  },
};

const statusFilterLabels: Record<Locale, Record<StatusFilter, string>> = {
  en: {
    all: 'All statuses',
    active: 'Active',
    inactive: 'Inactive',
  },
  he: {
    all: 'כל הסטטוסים',
    active: 'פעיל',
    inactive: 'לא פעיל',
  },
};

const statusFilterOrder: StatusFilter[] = ['all', 'active', 'inactive'];

const translations: Record<
  Locale,
  {
    pageTitle: string;
    pageSubtitle: string;
    newCustomer: string;
    metrics: {
      totalCustomers: string;
      activeCustomers: string;
      monthlyRecurring: string;
    };
    filters: {
      searchPlaceholder: string;
    };
    table: {
      customerName: string;
      status: string;
      joinDate: string;
      tenure: string;
      customerScore: string;
      taxId: string;
      country: string;
      paymentMethod: string;
      billingModel: string;
      billingCycle: string;
      annualFee: string;
      monthlyRetainer: string;
      hourlyRate: string;
      hoursPerMonth: string;
      referralSource: string;
      details: string;
      delete: string;
      noResults: string;
      referralFallback: string;
    };
    grid: {
      industryFallback: string;
      tenureLabel: string;
      tenureUnit: string;
      monthlyRetainerLabel: string;
      hourlyRateLabel: string;
      scoreLabel: string;
      activeProjects: string;
      viewProjects: string;
      detailsButton: string;
      tasksToDo: string;
      delete: string;
      empty: string;
    };
  }
> = {
  en: {
    pageTitle: 'Customers',
    pageSubtitle: 'All of your customers in one place',
    newCustomer: 'New Customer',
    metrics: {
      totalCustomers: 'Total Customers',
      activeCustomers: 'Active Customers',
      monthlyRecurring: 'Monthly Revenue',
    },
    filters: {
      searchPlaceholder: 'Search customer by name, tax ID, or email',
    },
    table: {
      customerName: 'Customer Name',
      status: 'Status',
      joinDate: 'Join Date',
      tenure: 'Tenure (months)',
      customerScore: 'Customer Score',
      taxId: 'Tax ID / VAT',
      country: 'Country',
      paymentMethod: 'Payment Method',
      billingModel: 'Billing Model',
      billingCycle: 'Billing Cycle',
      annualFee: 'Annual Fee',
      monthlyRetainer: 'Retainer/Hourly',
      hourlyRate: 'Hourly Rate',
      hoursPerMonth: 'Hours / Month',
      referralSource: 'Lead Source',
      details: 'Details',
      delete: 'Delete',
      noResults: 'No matching customers found',
      referralFallback: '—',
    },
    grid: {
      industryFallback: 'Industry not specified',
      tenureLabel: 'Tenure',
      tenureUnit: 'months',
      monthlyRetainerLabel: 'Monthly Retainer',
      hourlyRateLabel: 'Hourly Rate',
      scoreLabel: 'Score',
      activeProjects: 'Active Projects',
      viewProjects: 'View Projects',
      detailsButton: 'Customer Details',
      tasksToDo: 'Tasks to do',
      delete: 'Delete',
      empty: 'No customers to display',
    },
  },
  he: {
    pageTitle: 'לקוחות',
    pageSubtitle: 'כל הלקוחות שלך במקום אחד',
    newCustomer: 'לקוח חדש',
    metrics: {
      totalCustomers: 'סה"כ לקוחות',
      activeCustomers: 'לקוחות פעילים',
      monthlyRecurring: 'הכנסה חודשית',
    },
    filters: {
      searchPlaceholder: 'חיפוש לקוח לפי שם, ח"פ או אימייל',
    },
    table: {
      customerName: 'שם הלקוח',
      status: 'סטטוס',
      joinDate: 'תאריך הצטרפות',
      tenure: 'וותק בחודשים',
      customerScore: 'Score לקוח',
      taxId: 'ח"פ / ע.מ.',
      country: 'מדינה',
      paymentMethod: 'אופן תשלום',
      billingModel: 'מודל חיוב',
      billingCycle: 'מחזור חיוב',
      annualFee: 'תעריף שנתי',
      monthlyRetainer: 'ריטיינר/שעתי',
      hourlyRate: 'תעריף שעתי',
      hoursPerMonth: 'שעות לחודש',
      referralSource: 'מקור הגעה',
      details: 'פרטים',
      delete: 'מחק',
      noResults: 'לא נמצאו לקוחות תואמים לחיפוש',
      referralFallback: '—',
    },
    grid: {
      industryFallback: 'לא צוין תחום',
      tenureLabel: 'וותק',
      tenureUnit: 'חודשים',
      monthlyRetainerLabel: 'ריטיינר חודשי',
      hourlyRateLabel: 'תעריף שעתי',
      scoreLabel: 'Score',
      activeProjects: 'פרויקטים פעילים',
      viewProjects: 'צפה בפרויקטים',
      detailsButton: 'פרטי לקוח',
      tasksToDo: 'משימות לביצוע',
      delete: 'מחק',
      empty: 'לא נמצאו לקוחות תואמים להצגה',
    },
  },
};

function calculateTenureMonths(joinDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - joinDate.getTime();
  const months = diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  return Math.max(0, parseFloat(months.toFixed(1)));
}

function formatCurrency(amount: number, userCurrency: Currency, locale: Locale) {
  if (!amount) {
    return '—';
  }
  return formatCurrencyUtil(amount, userCurrency, locale);
}

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US');
}

interface CustomersMetrics {
  total: number;
  active: number;
  monthlyRecurring: number;
}

export default function Customers() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const isRTL = locale === 'he';
  const t = translations[locale];

  // Force grid view on mobile, allow both on desktop
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Force grid view on mobile
  const effectiveViewMode = isMobile ? 'grid' : viewMode;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  // Set loading state based on whether customers are loaded
  useEffect(() => {
    // If the app is loading (initial load), show loading
    if (state.loading) {
      setIsLoading(true);
    } else {
      // Once app loading is done, we can show the customers (even if empty)
      setIsLoading(false);
    }
  }, [state.loading]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const getCustomerProjectCount = (customerId: string) => {
    return state.projects.filter(p => p.customerId === customerId).length;
  };

  const getCustomerTodoTasksCount = (customerId: string) => {
    const customerProjects = state.projects.filter(p => p.customerId === customerId);
    const projectIds = customerProjects.map(p => p.id);
    return state.tasks.filter(t => projectIds.includes(t.projectId) && t.status === 'todo').length;
  };

  // Helper functions for customer score calculation (based on mockup)
  const getTotalRevenueForCustomer = (customerId: string) => {
    const customerTimeEntries = state.timeEntries?.filter(entry => entry.customerId === customerId) || [];
    return customerTimeEntries.reduce((sum, entry) => sum + (entry.income || 0), 0);
  };

  const getCustomerSeniority = (customer: Customer) => {
    if (!customer.joinDate) return 0;
    const joinDate = new Date(customer.joinDate);
    const now = new Date();
    const years = now.getFullYear() - joinDate.getFullYear();
    const months = now.getMonth() - joinDate.getMonth();
    const days = now.getDate() - joinDate.getDate();
    let totalMonths = years * 12 + months;
    if (days >= 0) {
      const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      totalMonths += days / daysInCurrentMonth;
    } else {
      totalMonths -= 1;
      const daysInPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      totalMonths += (daysInPreviousMonth + days) / daysInPreviousMonth;
    }
    return Math.max(0, totalMonths);
  };

  const getReferralsCountForCustomer = (customerId: string) => {
    // Check if customer has referralSource that matches another customer's name or ID
    // For now, return 0 as we don't have a direct referred_by field
    // This can be enhanced if referral tracking is added
    return state.customers?.filter(c => c.referralSource === customerId || c.referralSource === state.customers.find(c2 => c2.id === customerId)?.name).length || 0;
  };

  const getIncomeFromReferrals = (customerId: string) => {
    const referredCustomers = state.customers?.filter(c => c.referralSource === customerId || c.referralSource === state.customers.find(c2 => c2.id === customerId)?.name) || [];
    if (referredCustomers.length === 0) return 0;
    return referredCustomers.reduce((sum, referredCustomer) => {
      return sum + getTotalRevenueForCustomer(referredCustomer.id);
    }, 0);
  };

  const getCustomerMonthlyIncome = (customer: Customer) => {
    switch(customer.billingModel) {
      case 'retainer':
        return customer.monthlyRetainer || 0;
      case 'hourly':
        const assumedMonthlyHours = 160;
        // Calculate hourly rate from monthlyRetainer if available, or use a default
        const hourlyRate = customer.monthlyRetainer > 0 ? customer.monthlyRetainer : (customer.hoursPerMonth > 0 ? customer.monthlyRetainer / customer.hoursPerMonth : 0);
        return hourlyRate * assumedMonthlyHours;
      case 'project':
        if (customer.hoursPerMonth && customer.annualFee) {
          const monthlyHours = 160;
          const hourlyFromProject = customer.annualFee / customer.hoursPerMonth;
          return hourlyFromProject * monthlyHours;
        }
        return 0;
      default:
        return 0;
    }
  };

  const getCustomerHourlyRate = (customer: Customer) => {
    if (customer.billingModel === 'hourly') {
      return customer.monthlyRetainer || 0; // In hourly model, monthlyRetainer stores the hourly rate
    } else if (customer.billingModel === 'retainer' && customer.hoursPerMonth > 0) {
      return customer.monthlyRetainer / customer.hoursPerMonth;
    } else if (customer.billingModel === 'project' && customer.hoursPerMonth > 0) {
      return customer.annualFee / customer.hoursPerMonth;
    }
    return 0;
  };

  const calculateCustomerScore = (customer: Customer): string => {
    const activeCustomers = state.customers?.filter(c => c.joinDate) || [];
    if (activeCustomers.length === 0) return 'C';

    const customerMetrics = {
      monthlyIncome: getCustomerMonthlyIncome(customer),
      hourlyRate: getCustomerHourlyRate(customer),
      seniority: getCustomerSeniority(customer),
      referralsCount: getReferralsCountForCustomer(customer.id),
      totalRevenue: getTotalRevenueForCustomer(customer.id),
      referredRevenue: getIncomeFromReferrals(customer.id)
    };

    const averages = {
      monthlyIncome: activeCustomers.reduce((sum, c) => sum + getCustomerMonthlyIncome(c), 0) / activeCustomers.length,
      hourlyRate: activeCustomers.reduce((sum, c) => sum + getCustomerHourlyRate(c), 0) / activeCustomers.length,
      seniority: activeCustomers.reduce((sum, c) => sum + getCustomerSeniority(c), 0) / activeCustomers.length,
      referralsCount: activeCustomers.reduce((sum, c) => sum + getReferralsCountForCustomer(c.id), 0) / activeCustomers.length,
      totalRevenue: activeCustomers.reduce((sum, c) => sum + getTotalRevenueForCustomer(c.id), 0) / activeCustomers.length,
      referredRevenue: activeCustomers.reduce((sum, c) => sum + getIncomeFromReferrals(c.id), 0) / activeCustomers.length
    };

    const scores = {
      monthlyIncome: averages.monthlyIncome > 0 ? Math.min(customerMetrics.monthlyIncome / averages.monthlyIncome, 2) : 0,
      hourlyRate: averages.hourlyRate > 0 ? Math.min(customerMetrics.hourlyRate / averages.hourlyRate, 2) : 0,
      seniority: averages.seniority > 0 ? Math.min(customerMetrics.seniority / averages.seniority, 2) : 0,
      referralsCount: averages.referralsCount > 0 ? Math.min(customerMetrics.referralsCount / averages.referralsCount, 2) : 0,
      totalRevenue: averages.totalRevenue > 0 ? Math.min(customerMetrics.totalRevenue / averages.totalRevenue, 2) : 0,
      referredRevenue: averages.referredRevenue > 0 ? Math.min(customerMetrics.referredRevenue / averages.referredRevenue, 2) : 0
    };

    const totalScore = (scores.monthlyIncome + scores.hourlyRate + scores.seniority + scores.referralsCount + scores.totalRevenue + scores.referredRevenue) / 6;

    if (totalScore >= 1.2) return 'A';
    if (totalScore >= 0.8) return 'B';
    return 'C';
  };

  const getScoreBadgeColor = (score: string): string => {
    switch(score) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'C': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleViewProjects = (customerId: string) => {
    navigate(`/projects?customer=${customerId}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  const handleNewCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    // Ensure we have a valid customer with an ID
    if (!customer || !customer.id) {
      console.error('Invalid customer provided to handleDeleteCustomer:', customer);
      toast.error(locale === 'he' ? 'שגיאה: לקוח לא תקין' : 'Error: Invalid customer');
      return;
    }

    // Find the customer in state to ensure we have the latest data
    const customerFromState = state.customers.find(c => c.id === customer.id);
    if (!customerFromState) {
      console.error('Customer not found in state:', customer.id);
      toast.error(locale === 'he' ? 'שגיאה: לקוח לא נמצא' : 'Error: Customer not found');
      return;
    }

    setCustomerToDelete(customerFromState);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (cascade: boolean) => {
    if (!customerToDelete || !customerToDelete.id) {
      return;
    }

    const customerId = customerToDelete.id;
    const customerName = customerToDelete.name;

    try {
      console.log('🗑️ Deleting customer:', { id: customerId, name: customerName, cascade });
      await api.customers.delete(customerId, state.user?.id, cascade);
      
      // Delete customer from state
      dispatch({ type: 'DELETE_CUSTOMER', payload: customerId });

      // If cascade deletion, also remove related projects, tasks, and events from state
      // Note: We don't use DELETE_PROJECT/DELETE_TASK/DELETE_EVENT actions here because
      // they make API calls, and we've already deleted everything on the backend via cascade.
      // Instead, we'll filter the state directly.
      if (cascade) {
        const relatedProjects = state.projects.filter(p => p.customerId === customerId);
        const relatedProjectIds = new Set(relatedProjects.map(p => p.id));

        // Remove projects from state
        const remainingProjects = state.projects.filter(p => p.customerId !== customerId);
        dispatch({ type: 'SET_PROJECTS', payload: remainingProjects });

        // Remove tasks from state
        const remainingTasks = state.tasks.filter(t => !relatedProjectIds.has(t.projectId));
        dispatch({ type: 'SET_TASKS', payload: remainingTasks });

        // Remove events from state
        const remainingEvents = state.events.filter(e => e.customerId !== customerId);
        dispatch({ type: 'SET_EVENTS', payload: remainingEvents });
      }

      toast.success(locale === 'he' ? 'הלקוח נמחק בהצלחה' : 'Customer deleted successfully');
      setCustomerToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      toast.error(error.message || (locale === 'he' ? 'שגיאה במחיקת הלקוח' : 'Failed to delete customer'));
    }
  };

  const metrics = useMemo<CustomersMetrics>(() => {
    const total = state.customers.length;
    const active = state.customers.filter((customer) => customer.status === 'active').length;
    
    // Calculate actual income earned so far
    const monthlyRecurring = state.customers.reduce((sum, customer) => {
      let customerIncome = 0;
      
      if (customer.billingModel === 'hourly') {
        // For hourly billing: sum all actual hours worked * rate (from time entries)
        const customerTimeEntries = state.timeEntries.filter(te => te.customerId === customer.id);
        customerIncome = customerTimeEntries.reduce((entrySum, entry) => entrySum + (entry.income || 0), 0);
      } else {
        // For retainer billing: use monthly retainer amount
        customerIncome = customer.monthlyRetainer || 0;
      }
      
      // Add income from Income records (applies to both billing models)
      const customerIncomes = state.incomes.filter(inc => inc.customerId === customer.id);
      const incomeFromRecords = customerIncomes.reduce((incSum, inc) => incSum + (inc.finalAmount || 0), 0);
      
      return sum + customerIncome + incomeFromRecords;
    }, 0);

    return { total, active, monthlyRecurring };
  }, [state.customers, state.timeEntries, state.incomes]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return state.customers.filter((customer) => {
      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'active') {
        matchesStatus = customer.status === 'active';
      } else if (statusFilter === 'inactive') {
        matchesStatus = customer.status !== 'active';
      }
      
      const searchableFields = [
        customer.name,
        customer.contactName,
        customer.contactEmail,
        customer.contactPhone,
        customer.country,
        customer.taxId,
        customer.referralSource || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchableFields.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [state.customers, statusFilter, searchQuery]);

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const searchIconPosition = isRTL ? 'right-3' : 'left-3';
  const searchPadding = isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3';
  const selectAlign = isRTL ? 'text-right' : 'text-left';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`space-y-1 flex-1 ${alignStart}`}>
          <h1 className={`text-2xl font-bold text-gray-900 dark:text-white ${alignStart}`}>{t.pageTitle}</h1>
          <p className={`text-gray-600 dark:text-gray-400 ${alignStart}`}>{t.pageSubtitle}</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />}
          onClick={handleNewCustomer}
          className="w-full sm:w-auto"
        >
          {t.newCustomer}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.totalCustomers}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.total}</p>
        </div>
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.activeCustomers}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.active}</p>
        </div>
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.monthlyRecurring}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.monthlyRecurring, currency, locale)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
        <div className={`flex flex-wrap items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* View mode toggle - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'border-gray-200 text-gray-500 hover:border-primary-200 hover:text-primary-500'
              }`}
            >
              <LayoutList size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'border-gray-200 text-gray-500 hover:border-primary-200 hover:text-primary-500'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3 justify-end min-w-[240px]">
            <div className={`relative max-w-xs ${isRTL ? 'ml-auto' : ''}`}>
              <Search
                size={18}
                className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 text-gray-400`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.filters.searchPlaceholder}
                className={`w-full ${searchPadding} py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className={`w-40 py-2 px-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectAlign}`}
            >
              {statusFilterOrder.map((option) => (
                <option key={option} value={option}>
                  {statusFilterLabels[locale][option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {locale === 'he' ? 'טוען לקוחות...' : 'Loading customers...'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && effectiveViewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          {/* Custom Scroll Controls */}
          <div className={`flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isRTL ? 'גלול ימינה/שמאלה כדי לראות את כל העמודות' : 'Scroll left/right to see all columns'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (tableScrollRef.current) {
                    tableScrollRef.current.scrollBy({ left: isRTL ? 200 : -200, behavior: 'smooth' });
                  }
                }}
                className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label={isRTL ? 'גלול ימינה' : 'Scroll left'}
              >
                <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => {
                  if (tableScrollRef.current) {
                    tableScrollRef.current.scrollBy({ left: isRTL ? -200 : 200, behavior: 'smooth' });
                  }
                }}
                className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label={isRTL ? 'גלול שמאלה' : 'Scroll right'}
              >
                <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          <div 
            ref={tableScrollRef}
            className="overflow-x-auto"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(107 114 128) rgb(243 244 246)',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <table className={`divide-y divide-gray-200 dark:divide-gray-700 ${alignStart}`} style={{ width: '1600px', minWidth: '1600px' }}>
              <thead className="bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.customerName}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.status}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.joinDate}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.tenure}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.customerScore}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.taxId}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.country}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.paymentMethod}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.billingModel}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.billingCycle}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.annualFee}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.monthlyRetainer}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.hoursPerMonth}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.referralSource}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.grid.activeProjects}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.details}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {filteredCustomers.map((customer) => {
                  const tenure = calculateTenureMonths(customer.joinDate);
                  const statusVariant = statusVariants[customer.status];
                  const statusLabel = statusLabels[locale][customer.status];
                  const customerScore = calculateCustomerScore(customer);

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className={`px-4 py-4 ${alignStart}`}>
                        <div className="font-semibold text-gray-900 dark:text-white">{customer.name}</div>
                        <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-0.5 ${alignStart}`}>
                          <span>{customer.contactEmail}</span>
                          <span>{customer.contactPhone}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-4 ${alignStart}`}>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {formatDate(customer.joinDate, locale)}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>{tenure}</td>
                      <td className={`px-4 py-4 ${alignStart}`}>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(customerScore)}`}>
                          {customerScore}
                        </div>
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>{customer.taxId}</td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>{customer.country}</td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {paymentMethodLabels[locale][customer.paymentMethod]}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {billingModelLabels[locale][customer.billingModel]}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {billingCycleLabels[locale][customer.billingCycle]}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {formatCurrency(customer.annualFee, currency, locale)}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {formatCurrency(customer.monthlyRetainer, currency, locale)}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {customer.hoursPerMonth}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {customer.referralSource || t.table.referralFallback}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {getCustomerProjectCount(customer.id)}
                      </td>
                      <td className={`px-4 py-4 ${alignStart}`}>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewProjects(customer.id)}
                          >
                            {t.grid.viewProjects}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            {t.table.details}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={14} className="mr-1" />
                            {t.table.delete}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={16} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                      {t.table.noResults}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : !isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => {
            const tenure = calculateTenureMonths(customer.joinDate);
            const statusVariant = statusVariants[customer.status];
            const statusLabel = statusLabels[locale][customer.status];
            const projectCount = getCustomerProjectCount(customer.id);
            const todoTasksCount = getCustomerTodoTasksCount(customer.id);
            const customerScore = calculateCustomerScore(customer);
            
            // Calculate hourly rate based on billing model
            const getPaymentInfo = () => {
              let rate = 0;
              let typeText = '';
              let color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
              let isCalculated = false;
              const pinkColor = 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200';

              if (customer.billingModel === 'hourly') {
                rate = customer.monthlyRetainer || 0;
                typeText = billingModelLabels[locale].hourly;
                color = pinkColor;
              } else if (customer.billingModel === 'retainer') {
                typeText = billingModelLabels[locale].retainer;
                color = pinkColor;
                if (customer.hoursPerMonth && customer.hoursPerMonth > 0) {
                  rate = Math.round(customer.monthlyRetainer / customer.hoursPerMonth);
                  isCalculated = true;
                }
              } else if (customer.billingModel === 'project') {
                typeText = billingModelLabels[locale].project;
                color = pinkColor;
                if (customer.hoursPerMonth && customer.hoursPerMonth > 0) {
                  rate = Math.round(customer.annualFee / customer.hoursPerMonth);
                  isCalculated = true;
                }
              } else {
                typeText = t.grid.industryFallback;
                color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
              }
              
              const valueText = rate > 0 
                ? `${getCurrencySymbol(currency)}${rate.toLocaleString()}/${locale === 'he' ? 'שעה' : 'hr'}${isCalculated ? (locale === 'he' ? ' (מחושב)' : ' (calc)') : ''}` 
                : (locale === 'he' ? 'לא הוגדר תעריף' : 'Rate not set');
              
              return { text: typeText, value: valueText, color };
            };

            const paymentInfo = getPaymentInfo();

            return (
              <div
                key={customer.id}
                className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col rounded-xl overflow-hidden"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <div className="p-6 flex-grow flex flex-col">
                  {/* Header with Avatar, Name, Tax ID, and Menu */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{customer.name}</h3>
                        {customer.taxId && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                            <Building className="w-3 h-3" />
                            {locale === 'he' ? 'ח״פ:' : 'Tax ID:'} {customer.taxId}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative" ref={(el) => { menuRefs.current[customer.id] = el; }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === customer.id ? null : customer.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === customer.id && (
                        <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleEditCustomer(customer);
                            }}
                            className={`w-full px-4 py-2 ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}
                          >
                            {t.table.details}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setOpenMenuId(null);
                              handleDeleteCustomer(customer);
                            }}
                            className={`w-full px-4 py-2 ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700`}
                          >
                            <Trash2 size={16} />
                            {t.grid.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Button and Status Badge */}
                  <div className="flex justify-start items-center gap-3 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                      className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      {t.grid.detailsButton}
                    </Button>
                    <Badge variant={statusVariant} className="flex items-center gap-1.5 py-1 px-3">
                      {statusLabel}
                    </Badge>
                    <Badge className={`${getScoreBadgeColor(customerScore)} flex items-center gap-1.5 py-1 px-3`}>
                      <span className="font-bold text-sm">{t.grid.scoreLabel}: {customerScore}</span>
                    </Badge>
                  </div>

                  {/* Seniority */}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {t.grid.tenureLabel}: {tenure.toFixed(1)} {t.grid.tenureUnit}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-4 flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.table.paymentMethod}:</span>
                    </div>
                    <Badge className={`${paymentInfo.color} mb-2`}>
                      {paymentInfo.text}
                    </Badge>
                    {paymentInfo.value && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-pink-700 dark:text-pink-300">{paymentInfo.value}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Section */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="w-full justify-between rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/20 transition-all"
                      onClick={() => handleViewProjects(customer.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span>{t.grid.viewProjects}</span>
                      </div>
                      <Badge className="bg-pink-200 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200">{projectCount}</Badge>
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="w-full justify-between rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/20 transition-all"
                      onClick={() => navigate(`/tasks?status=todo&customerId=${customer.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span>{t.grid.tasksToDo}</span>
                      </div>
                      <Badge className="bg-pink-200 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200">{todoTasksCount}</Badge>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
              {t.grid.empty}
            </div>
          )}
        </div>
      ) : null}

      {/* Customer Modal */}
      <CreateCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={handleCloseModal}
        customer={editingCustomer}
        onDelete={(customerId: string) => {
          const customerToDelete = state.customers.find(c => c.id === customerId);
          if (customerToDelete) {
            handleDeleteCustomer(customerToDelete);
          }
        }}
      />

      {/* Delete Customer Modal */}
      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        customer={customerToDelete}
        onConfirm={handleConfirmDelete}
        locale={locale}
      />
    </div>
  );
}

