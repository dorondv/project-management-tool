import { useState, useMemo } from 'react';
import { Calculator, ArrowUpDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Locale, Customer, TimeEntry, Income, Currency } from '../../types';
import { Badge } from '../common/Badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, differenceInDays } from 'date-fns';
import { getCurrencySymbol } from '../../utils/currencyUtils';

const translations: Record<Locale, {
  title: string;
  columns: {
    client: string;
    score: string;
    monthlyIncome: string;
    hourlyRate: string;
    seniority: string;
    referralsCount: string;
    totalRevenue: string;
    referredRevenue: string;
    hours: string;
    revenue: string;
    avgHourly: string;
    avgDaily: string;
  };
  paymentMethods: {
    hourly: string;
    retainer: string;
    project: string;
  };
  scoreTooltip: {
    title: string;
    monthlyIncome: string;
    hourlyRate: string;
    seniority: string;
    referralsCount: string;
    totalRevenue: string;
    referredRevenue: string;
  };
  totals: string;
  noData: string;
}> = {
  en: {
    title: 'Active Customers Report',
    columns: {
      client: 'Client',
      score: 'Score',
      monthlyIncome: 'Monthly Income',
      hourlyRate: 'Hourly Rate',
      seniority: 'Seniority (Months)',
      referralsCount: 'Referrals',
      totalRevenue: 'Total Revenue',
      referredRevenue: 'Revenue from Referrals',
      hours: 'Work Hours (Period)',
      revenue: 'Revenue (Period)',
      avgHourly: 'Avg Income/Hour (Period)',
      avgDaily: 'Avg Daily Work Hours (Period)',
    },
    paymentMethods: {
      hourly: 'Hourly',
      retainer: 'Retainer',
      project: 'Project',
    },
    scoreTooltip: {
      title: 'Client Score Details (All Time):',
      monthlyIncome: 'Monthly Income:',
      hourlyRate: 'Hourly Rate:',
      seniority: 'Seniority (Months):',
      referralsCount: 'Referrals Brought:',
      totalRevenue: 'Total Revenue:',
      referredRevenue: 'Revenue from Referrals:',
    },
    totals: 'Total',
    noData: 'No customer data available',
  },
  he: {
    title: 'דוח לקוחות פעילים',
    columns: {
      client: 'לקוח',
      score: 'Score',
      monthlyIncome: 'הכנסה חודשית',
      hourlyRate: 'שכר שעתי',
      seniority: 'ותק חודשים',
      referralsCount: 'הפניות',
      totalRevenue: 'סה"כ הכנסות',
      referredRevenue: 'הכנסה מהפניות',
      hours: 'שעות עבודה (בתקופה)',
      revenue: 'הכנסות (בתקופה)',
      avgHourly: 'הכנסה ממוצע לשעה (בתקופה)',
      avgDaily: 'ממוצע שעות עבודה יומי (בתקופה)',
    },
    paymentMethods: {
      hourly: 'שעתי',
      retainer: 'ריטיינר',
      project: 'פרויקט',
    },
    scoreTooltip: {
      title: 'פירוט Score לקוח (כל הזמנים):',
      monthlyIncome: 'הכנסה חודשית:',
      hourlyRate: 'שכר שעתי:',
      seniority: 'ותק (חודשים):',
      referralsCount: 'הפניות שהביא:',
      totalRevenue: 'סה"כ הכנסות:',
      referredRevenue: 'הכנסה מהפניות:',
    },
    totals: 'סה"כ',
    noData: 'אין נתוני לקוחות זמינים',
  },
};

interface ClientStat {
  customer: Customer;
  score: string;
  scoreMetrics: {
    monthlyIncome: number;
    hourlyRate: number;
    seniority: number;
    referralsCount: number;
    totalRevenue: number;
    referredRevenue: number;
  };
  workedHours: number;
  receivedPayments: number;
  avgHourlyRate: number;
}

// Helper functions
const getClientMonthlyIncome = (customer: Customer): number => {
  if (customer.billingModel === 'retainer') {
    return customer.monthlyRetainer || 0;
  } else if (customer.billingModel === 'hourly') {
    // Estimate based on hours per month and hourly rate
    const hourlyRate = customer.hoursPerMonth || 0;
    const rate = 0; // We'll calculate from time entries
    return hourlyRate * rate;
  }
  return 0;
};

const getClientSeniority = (customer: Customer): number => {
  if (customer.status !== 'active') return 0;
  const joinDate = customer.joinDate ? new Date(customer.joinDate) : new Date(customer.createdAt);
  const now = new Date();
  const years = now.getFullYear() - joinDate.getFullYear();
  const months = now.getMonth() - joinDate.getMonth();
  return Math.max(0, years * 12 + months);
};

const getReferralsCountForClient = (customerId: string, allCustomers: Customer[]): number => {
  // Check if any customer has this customer's ID in their referralSource
  // This assumes referralSource might contain customer IDs, otherwise returns 0
  return allCustomers.filter(c => c.referralSource === customerId || c.referralSource?.includes(customerId)).length;
};

const getAllTimeRevenueForClient = (customerId: string, allTimeEntries: TimeEntry[], allIncomes: Income[]): number => {
  const timeEntryRevenue = allTimeEntries
    .filter(entry => entry.customerId === customerId)
    .reduce((sum, entry) => sum + entry.income, 0);
  
  const incomeRevenue = allIncomes
    .filter(income => income.customerId === customerId)
    .reduce((sum, income) => sum + income.finalAmount, 0);
  
  return timeEntryRevenue + incomeRevenue;
};

const getIncomeFromReferrals = (customerId: string, allCustomers: Customer[], allTimeEntries: TimeEntry[], allIncomes: Income[]): number => {
  const referredCustomers = allCustomers.filter(c => c.referralSource === customerId);
  if (referredCustomers.length === 0) return 0;
  
  return referredCustomers.reduce((sum, referredCustomer) => {
    return sum + getAllTimeRevenueForClient(referredCustomer.id, allTimeEntries, allIncomes);
  }, 0);
};

const calculateClientScore = (customer: Customer, allCustomers: Customer[], allTimeEntries: TimeEntry[], allIncomes: Income[]): string => {
  const activeCustomers = allCustomers.filter(c => c.status === 'active');
  if (activeCustomers.length === 0) return 'C';

  const clientMetrics = {
    monthlyIncome: getClientMonthlyIncome(customer),
    hourlyRate: 0, // Will be calculated from time entries
    seniority: getClientSeniority(customer),
    referralsCount: getReferralsCountForClient(customer.id, allCustomers),
    totalRevenue: getAllTimeRevenueForClient(customer.id, allTimeEntries, allIncomes),
    referredRevenue: getIncomeFromReferrals(customer.id, allCustomers, allTimeEntries, allIncomes),
  };

  // Calculate average hourly rate from time entries
  const customerTimeEntries = allTimeEntries.filter(entry => entry.customerId === customer.id);
  if (customerTimeEntries.length > 0) {
    const totalHours = customerTimeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);
    const totalIncome = customerTimeEntries.reduce((sum, entry) => sum + entry.income, 0);
    clientMetrics.hourlyRate = totalHours > 0 ? totalIncome / totalHours : 0;
  }

  // Calculate averages across all active customers
  const averages = {
    monthlyIncome: activeCustomers.reduce((sum, c) => sum + getClientMonthlyIncome(c), 0) / activeCustomers.length,
    hourlyRate: activeCustomers.reduce((sum, c) => {
      const cEntries = allTimeEntries.filter(entry => entry.customerId === c.id);
      if (cEntries.length === 0) return sum;
      const cHours = cEntries.reduce((s, e) => s + (e.duration / 3600), 0);
      const cIncome = cEntries.reduce((s, e) => s + e.income, 0);
      return sum + (cHours > 0 ? cIncome / cHours : 0);
    }, 0) / activeCustomers.length,
    seniority: activeCustomers.reduce((sum, c) => sum + getClientSeniority(c), 0) / activeCustomers.length,
    referralsCount: activeCustomers.reduce((sum, c) => sum + getReferralsCountForClient(c.id, allCustomers), 0) / activeCustomers.length,
    totalRevenue: activeCustomers.reduce((sum, c) => sum + getAllTimeRevenueForClient(c.id, allTimeEntries, allIncomes), 0) / activeCustomers.length,
    referredRevenue: activeCustomers.reduce((sum, c) => sum + getIncomeFromReferrals(c.id, allCustomers, allTimeEntries, allIncomes), 0) / activeCustomers.length,
  };

  // Compute total score
  let totalScore = 0;
  let metricCount = 0;

  if (averages.monthlyIncome > 0) { totalScore += Math.min(clientMetrics.monthlyIncome / averages.monthlyIncome, 2); metricCount++; }
  if (averages.hourlyRate > 0) { totalScore += Math.min(clientMetrics.hourlyRate / averages.hourlyRate, 2); metricCount++; }
  if (averages.seniority > 0) { totalScore += Math.min(clientMetrics.seniority / averages.seniority, 2); metricCount++; }
  if (averages.referralsCount > 0) { totalScore += Math.min(clientMetrics.referralsCount / averages.referralsCount, 2); metricCount++; }
  if (averages.totalRevenue > 0) { totalScore += Math.min(clientMetrics.totalRevenue / averages.totalRevenue, 2); metricCount++; }
  if (averages.referredRevenue > 0) { totalScore += Math.min(clientMetrics.referredRevenue / averages.referredRevenue, 2); metricCount++; }

  if (metricCount === 0) return 'C';

  const finalScore = totalScore / metricCount;
  if (finalScore >= 1.2) return 'A';
  if (finalScore >= 0.8) return 'B';
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

export function DetailedCustomerReport() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const currencySymbol = getCurrencySymbol(currency);
  const isRTL = locale === 'he';
  const t = translations[locale];
  
  const [sortBy, setSortBy] = useState<string>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use current month as default period
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
  const daysInPeriod = Math.max(1, differenceInDays(endDate, startDate) + 1);

  const clientStats = useMemo<ClientStat[]>(() => {
    const stats: ClientStat[] = [];

    // Filter to only active customers
    const activeCustomers = state.customers.filter(customer => customer.status === 'active');

    activeCustomers.forEach(customer => {
      const scoreMetrics = {
        monthlyIncome: getClientMonthlyIncome(customer),
        hourlyRate: 0,
        seniority: getClientSeniority(customer),
        referralsCount: getReferralsCountForClient(customer.id, state.customers),
        totalRevenue: getAllTimeRevenueForClient(customer.id, state.timeEntries, state.incomes),
        referredRevenue: getIncomeFromReferrals(customer.id, state.customers, state.timeEntries, state.incomes),
      };

      // Calculate average hourly rate
      const customerTimeEntries = state.timeEntries.filter(entry => entry.customerId === customer.id);
      if (customerTimeEntries.length > 0) {
        const totalHours = customerTimeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);
        const totalIncome = customerTimeEntries.reduce((sum, entry) => sum + entry.income, 0);
        scoreMetrics.hourlyRate = totalHours > 0 ? totalIncome / totalHours : 0;
      }

      // Filter time entries for the period
      const periodTimeEntries = state.timeEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= startDate && entryDate <= endDate && entry.customerId === customer.id;
      });

      const workedHours = periodTimeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);
      const receivedPayments = periodTimeEntries.reduce((sum, entry) => sum + entry.income, 0) +
        state.incomes
          .filter(income => {
            const incomeDate = new Date(income.incomeDate);
            return incomeDate >= startDate && incomeDate <= endDate && income.customerId === customer.id;
          })
          .reduce((sum, income) => sum + income.finalAmount, 0);

      const avgHourlyRate = workedHours > 0 ? receivedPayments / workedHours : 0;

      stats.push({
        customer,
        score: calculateClientScore(customer, state.customers, state.timeEntries, state.incomes),
        scoreMetrics,
        workedHours,
        receivedPayments,
        avgHourlyRate,
      });
    });

    return stats;
  }, [state.customers, state.timeEntries, state.incomes, startDate, endDate]);

  const sortedStats = useMemo(() => {
    const sorted = [...clientStats];
    sorted.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch(sortBy) {
        case 'client':
          aValue = a.customer.name;
          bValue = b.customer.name;
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'monthlyIncome':
          aValue = a.scoreMetrics.monthlyIncome;
          bValue = b.scoreMetrics.monthlyIncome;
          break;
        case 'hourlyRate':
          aValue = a.scoreMetrics.hourlyRate;
          bValue = b.scoreMetrics.hourlyRate;
          break;
        case 'seniority':
          aValue = a.scoreMetrics.seniority;
          bValue = b.scoreMetrics.seniority;
          break;
        case 'referralsCount':
          aValue = a.scoreMetrics.referralsCount;
          bValue = b.scoreMetrics.referralsCount;
          break;
        case 'totalRevenue':
          aValue = a.scoreMetrics.totalRevenue;
          bValue = b.scoreMetrics.totalRevenue;
          break;
        case 'referredRevenue':
          aValue = a.scoreMetrics.referredRevenue;
          bValue = b.scoreMetrics.referredRevenue;
          break;
        case 'hours':
          aValue = a.workedHours;
          bValue = b.workedHours;
          break;
        case 'revenue':
          aValue = a.receivedPayments;
          bValue = b.receivedPayments;
          break;
        case 'avg_hourly':
          aValue = a.avgHourlyRate;
          bValue = b.avgHourlyRate;
          break;
        case 'avg_daily':
          aValue = daysInPeriod > 0 ? a.workedHours / daysInPeriod : 0;
          bValue = daysInPeriod > 0 ? b.workedHours / daysInPeriod : 0;
          break;
        default:
          aValue = a.receivedPayments;
          bValue = b.receivedPayments;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      const numA = typeof aValue === 'number' ? aValue : 0;
      const numB = typeof bValue === 'number' ? bValue : 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [clientStats, sortBy, sortOrder, daysInPeriod]);

  const totals = useMemo(() => {
    return {
      monthlyIncome: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.monthlyIncome, 0),
      referralsCount: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.referralsCount, 0),
      totalRevenue: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.totalRevenue, 0),
      referredRevenue: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.referredRevenue, 0),
      hours: clientStats.reduce((sum, stat) => sum + stat.workedHours, 0),
      revenue: clientStats.reduce((sum, stat) => sum + stat.receivedPayments, 0),
    };
  }, [clientStats]);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('desc');
    }
  };

  const SortableHeader = ({ children, columnKey }: { children: React.ReactNode; columnKey: string }) => (
    <button
      onClick={() => handleSort(columnKey)}
      className={`w-full flex items-center justify-center gap-2 hover:text-blue-600 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      {children}
      <ArrowUpDown
        className={`h-4 w-4 transition-transform ${
          sortBy === columnKey && sortOrder === 'asc' ? 'rotate-180' : ''
        } ${sortBy === columnKey ? 'text-blue-600' : 'text-gray-400'}`}
      />
    </button>
  );

  const getPaymentMethodLabel = (method: string) => {
    switch(method) {
      case 'hourly': return t.paymentMethods.hourly;
      case 'retainer': return t.paymentMethods.retainer;
      case 'project': return t.paymentMethods.project;
      default: return method;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={20} className="text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.title}
        </h3>
      </div>

      {clientStats.length === 0 ? (
        <div className="text-center py-8">
          <p className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.noData}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className={`px-4 py-3 text-sm font-bold border-b ${isRTL ? 'text-right' : 'text-left'}`}>
                  <SortableHeader columnKey="client">{t.columns.client}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="score">{t.columns.score}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="monthlyIncome">{t.columns.monthlyIncome}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="hourlyRate">{t.columns.hourlyRate}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="seniority">{t.columns.seniority}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="referralsCount">{t.columns.referralsCount}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="totalRevenue">{t.columns.totalRevenue}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="referredRevenue">{t.columns.referredRevenue}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="hours">{t.columns.hours}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="revenue">{t.columns.revenue}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="avg_hourly">{t.columns.avgHourly}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="avg_daily">{t.columns.avgDaily}</SortableHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat) => {
                const dailyAvgHours = daysInPeriod > 0 ? stat.workedHours / daysInPeriod : 0;
                
                return (
                  <tr key={stat.customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b">
                    <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{stat.customer.name}</p>
                        {stat.customer.contactName && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.customer.contactName}</p>
                        )}
                        <Badge variant="default" className="mt-1 text-xs">
                          {getPaymentMethodLabel(stat.customer.billingModel)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(stat.score)}`}>
                        {stat.score}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {currencySymbol}{stat.scoreMetrics.monthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {currencySymbol}{stat.scoreMetrics.hourlyRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {stat.scoreMetrics.seniority.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {stat.scoreMetrics.referralsCount}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {currencySymbol}{stat.scoreMetrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {currencySymbol}{stat.scoreMetrics.referredRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">{stat.workedHours.toFixed(1)}h</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">
                        {currencySymbol}{stat.receivedPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">
                        {currencySymbol}{stat.avgHourlyRate.toFixed(0)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">
                        {dailyAvgHours.toFixed(1)}h
                      </p>
                    </td>
                  </tr>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold border-t-2">
                <td className={`px-4 py-3 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t.totals}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.monthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {totals.referralsCount}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.referredRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {totals.hours.toFixed(1)}h
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.hours > 0 ? (totals.revenue / totals.hours).toFixed(0) : 0}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {(daysInPeriod > 0 ? totals.hours / daysInPeriod : 0).toFixed(1)}h
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
