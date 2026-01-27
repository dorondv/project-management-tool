import { motion } from 'framer-motion';
import { FolderOpen, CheckSquare, Contact, Clock, Target, TrendingUp, DollarSign, Users, Calculator, Calendar as CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Currency } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, endOfDay, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ProjectChart } from '../components/dashboard/ProjectChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines';
import { IncomePerHourChart } from '../components/dashboard/IncomePerHourChart';
import { MonthlyTrendsChart } from '../components/dashboard/MonthlyTrendsChart';
import { DetailedCustomerReport } from '../components/dashboard/DetailedCustomerReport';
import { HoursByCustomerChart } from '../components/dashboard/HoursByCustomerChart';
import { IncomeByCustomerChart } from '../components/dashboard/IncomeByCustomerChart';

const dashboardTranslations = {
  en: {
    title: 'Dashboard',
    subtitle: (name?: string) => `Welcome back, ${name ?? 'there'}! Here's what's happening with your projects.`,
    periodSelector: {
      placeholder: 'Select period',
      currentMonth: 'Current Month',
      lastMonth: 'Last Month',
      currentYear: 'Current Year',
      allTime: 'All Time',
      custom: 'Custom Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      dateRange: (start: string, end: string) => `Data summary for ${start} - ${end}`,
    },
    stats: {
      totalProjects: 'Total Projects',
      activeTasks: 'Active Tasks',
      customers: 'Customers',
      overdueTasks: 'Overdue Tasks',
      averageHoursPerDay: 'Average Hours Per Day',
      averageIncomePerCustomer: 'Average Income Per Customer',
      averageIncomePerHour: 'Average Income Per Hour',
      totalIncomeFromCustomers: 'Total Income From Customers',
      totalWorkHours: 'Total Work Hours',
      totalActiveCustomers: 'Total Active Customers',
    },
  },
  he: {
    title: 'לוח בקרה',
    subtitle: (name?: string) => `${name ?? 'שם'} ברוך השב! כך נראים הפרויקטים שלך כרגע.`,
    periodSelector: {
      placeholder: 'בחר תקופה',
      currentMonth: 'החודש הנוכחי',
      lastMonth: 'החודש הקודם',
      currentYear: 'השנה הנוכחית',
      allTime: 'כל הזמנים',
      custom: 'טווח מותאם אישית',
      startDate: 'תאריך התחלה',
      endDate: 'תאריך סיום',
      dateRange: (start: string, end: string) => `סיכום נתונים עבור ${start} - ${end}`,
    },
    stats: {
      totalProjects: 'סה"כ פרויקטים',
      activeTasks: 'משימות פעילות',
      customers: 'לקוחות',
      overdueTasks: 'משימות באיחור',
      averageHoursPerDay: 'ממוצע שעות ליום',
      averageIncomePerCustomer: 'הכנסה ממוצעת ללקוח',
      averageIncomePerHour: 'הכנסה ממוצעת לשעה',
      totalIncomeFromCustomers: 'סה"כ הכנסות מלקוחות',
      totalWorkHours: 'סה"כ שעות עבודה',
      totalActiveCustomers: 'סה"כ לקוחות פעילים',
    },
  },
} as const;

export default function Dashboard() {
  const { state } = useApp();
  const locale = state.locale;
  const currency: Currency = state.currency ?? 'ILS';
  const isRTL = locale === 'he';
  const t = dashboardTranslations[locale];

  // Period selection state
  const [period, setPeriod] = useState<'currentMonth' | 'lastMonth' | 'currentYear' | 'allTime' | 'custom'>('currentMonth');
  const [customRange, setCustomRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'currentYear':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'allTime':
        return { start: new Date(0), end: now };
      case 'custom':
        return { start: startOfDay(customRange.from), end: endOfDay(customRange.to) };
      case 'currentMonth':
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();

  // Filter time entries and incomes based on date range
  const filteredTimeEntries = useMemo(() => {
    return state.timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= start && entryDate <= end;
    });
  }, [state.timeEntries, start, end]);

  const filteredIncomes = useMemo(() => {
    return state.incomes.filter(income => {
      const incomeDate = new Date(income.incomeDate);
      return incomeDate >= start && incomeDate <= end;
    });
  }, [state.incomes, start, end]);

  // Calculate income and work statistics using filtered data
  const incomeStats = useMemo(() => {
    // Calculate total income from time entries and income records (filtered)
    const totalIncomeFromTimeEntries = filteredTimeEntries.reduce((sum, entry) => sum + entry.income, 0);
    const totalIncomeFromIncomes = filteredIncomes.reduce((sum, income) => sum + income.finalAmount, 0);
    const totalIncome = totalIncomeFromTimeEntries + totalIncomeFromIncomes;

    // Calculate total work hours (convert seconds to hours) - filtered
    const totalWorkHours = filteredTimeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);

    // Calculate active customers (customers with activity in the period)
    const activeCustomers = state.customers.filter(c => {
      if (c.status !== 'active') return false;
      // Check if customer has time entries or incomes in the period
      const hasTimeEntries = filteredTimeEntries.some(entry => entry.customerId === c.id);
      const hasIncomes = filteredIncomes.some(income => income.customerId === c.id);
      return hasTimeEntries || hasIncomes;
    }).length;

    // Calculate average hours per day
    // Get unique work days from filtered entries
    const workDays = new Set(
      filteredTimeEntries.map(entry => {
        const date = new Date(entry.startTime);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );
    const averageHoursPerDay = workDays.size > 0 ? totalWorkHours / workDays.size : 0;

    // Calculate averages
    const averageIncomePerCustomer = activeCustomers > 0 ? totalIncome / activeCustomers : 0;
    // Average income per hour should only use income from time entries (which corresponds to hours worked)
    // Income records are separate and shouldn't be included in this calculation
    const averageIncomePerHour = totalWorkHours > 0 ? totalIncomeFromTimeEntries / totalWorkHours : 0;

    return {
      totalIncome,
      totalWorkHours,
      activeCustomers,
      averageHoursPerDay,
      averageIncomePerCustomer,
      averageIncomePerHour,
    };
  }, [filteredTimeEntries, filteredIncomes, state.customers]);

  const stats = useMemo(() => (
    [
      {
        title: t.stats.customers,
        value: state.customers.length,
        change: undefined,
        icon: <Contact size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
      {
        title: t.stats.totalProjects,
        value: state.projects.length,
        change: { value: 12, type: 'increase' as const },
        icon: <FolderOpen size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
      {
        title: t.stats.activeTasks,
        value: state.tasks.filter((task) => task.status !== 'completed').length,
        change: { value: 8, type: 'increase' as const },
        icon: <CheckSquare size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
      {
        title: t.stats.overdueTasks,
        value: state.tasks.filter((task) => task.status !== 'completed' && new Date(task.dueDate) < new Date()).length,
        change: { value: 3, type: 'decrease' as const },
        icon: <Clock size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
    ]
  ), [state.projects.length, state.tasks, state.customers.length, t.stats.activeTasks, t.stats.overdueTasks, t.stats.customers, t.stats.totalProjects]);

  const incomeStatsCards = useMemo(() => (
    [
      {
        title: t.stats.totalActiveCustomers,
        value: incomeStats.activeCustomers,
        change: undefined,
        icon: <Users size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t.stats.averageHoursPerDay,
        value: incomeStats.averageHoursPerDay.toFixed(1),
        change: undefined,
        icon: <Target size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t.stats.averageIncomePerCustomer,
        value: formatCurrency(incomeStats.averageIncomePerCustomer, currency, locale),
        change: undefined,
        icon: <TrendingUp size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t.stats.averageIncomePerHour,
        value: formatCurrency(incomeStats.averageIncomePerHour, currency, locale),
        change: undefined,
        icon: <Calculator size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t.stats.totalIncomeFromCustomers,
        value: formatCurrency(incomeStats.totalIncome, currency, locale),
        change: undefined,
        icon: <DollarSign size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t.stats.totalWorkHours,
        value: incomeStats.totalWorkHours.toFixed(1),
        change: undefined,
        icon: <Clock size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
    ]
  ), [incomeStats, t.stats, currency, locale]);

  const alignStart = isRTL ? 'text-right' : 'text-left';

  const dateLocale = locale === 'he' ? he : undefined;
  const dateFormat = locale === 'he' ? 'dd/MM/yy' : 'MM/dd/yy';
  const formattedStart = format(start, dateFormat, { locale: dateLocale });
  const formattedEnd = format(end, dateFormat, { locale: dateLocale });

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className={alignStart}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.periodSelector.dateRange(formattedStart, formattedEnd)}
          </p>
        </div>
      </div>

      {/* Period Selection */}
      <div className="flex flex-wrap gap-4 items-center mb-8">
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className={`w-[180px] h-12 px-3 py-2 ${isRTL ? 'pr-8 pl-8' : 'pr-8'} bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${isRTL ? 'text-right' : 'text-left'} appearance-none`}
          >
            <option value="currentMonth">{t.periodSelector.currentMonth}</option>
            <option value="lastMonth">{t.periodSelector.lastMonth}</option>
            <option value="currentYear">{t.periodSelector.currentYear}</option>
            <option value="allTime">{t.periodSelector.allTime}</option>
            <option value="custom">{t.periodSelector.custom}</option>
          </select>
          <CalendarIcon className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
        </div>

        {period === 'custom' && (
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="date"
                value={format(customRange.from, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : startOfMonth(new Date());
                  setCustomRange(prev => ({ ...prev, from: date }));
                }}
                className={`w-[180px] h-12 px-3 py-2 ${isRTL ? 'pr-8 pl-8' : 'pr-8'} bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              <CalendarIcon className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
            </div>
            <div className="relative">
              <input
                type="date"
                value={format(customRange.to, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : endOfMonth(new Date());
                  setCustomRange(prev => ({ ...prev, to: date }));
                }}
                className={`w-[180px] h-12 px-3 py-2 ${isRTL ? 'pr-8 pl-8' : 'pr-8'} bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              <CalendarIcon className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
            </div>
          </div>
        )}
      </div>

      {/* First stats section - commented out */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div> */}

      {/* Income and Work Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
      >
        {incomeStatsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (stats.length + index) * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomePerHourChart dateRange={{ start, end }} />
        <MonthlyTrendsChart dateRange={{ start, end }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HoursByCustomerChart dateRange={{ start, end }} />
        <IncomeByCustomerChart dateRange={{ start, end }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <UpcomingDeadlines />
      </div>

      <DetailedCustomerReport />
    </div>
  );
}