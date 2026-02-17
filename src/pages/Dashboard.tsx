import { motion } from 'framer-motion';
import { FolderOpen, CheckSquare, Contact, Clock, Target, TrendingUp, DollarSign, Users, Calculator, Calendar as CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Currency, type Locale } from '../types';
import { t } from '../i18n';
import { formatCurrency } from '../utils/currencyUtils';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, endOfDay, format } from 'date-fns';
import { he, es, de, ptBR } from 'date-fns/locale';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ProjectChart } from '../components/dashboard/ProjectChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines';
import { IncomePerHourChart } from '../components/dashboard/IncomePerHourChart';
import { MonthlyTrendsChart } from '../components/dashboard/MonthlyTrendsChart';
import { DetailedCustomerReport } from '../components/dashboard/DetailedCustomerReport';
import { HoursByCustomerChart } from '../components/dashboard/HoursByCustomerChart';
import { IncomeByCustomerChart } from '../components/dashboard/IncomeByCustomerChart';

export default function Dashboard() {
  const { state } = useApp();
  const locale = (state.locale ?? 'en') as Locale;
  const currency: Currency = state.currency ?? 'ILS';
  const isRTL = locale === 'he';

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

  const formatSummaryCurrency = (amount: number) => {
    return formatCurrency(Math.round(amount), currency, locale);
  };

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
        title: t('dashboard.stats.customers', locale),
        value: state.customers.length,
        change: undefined,
        icon: <Contact size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
      {
        title: t('dashboard.stats.totalProjects', locale),
        value: state.projects.length,
        change: { value: 12, type: 'increase' as const },
        icon: <FolderOpen size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
      {
        title: t('dashboard.stats.activeTasks', locale),
        value: state.tasks.filter((task) => task.status !== 'completed').length,
        change: { value: 8, type: 'increase' as const },
        icon: <CheckSquare size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
      {
        title: t('dashboard.stats.overdueTasks', locale),
        value: state.tasks.filter((task) => task.status !== 'completed' && new Date(task.dueDate) < new Date()).length,
        change: { value: 3, type: 'decrease' as const },
        icon: <Clock size={20} className="text-primary-500 dark:text-primary-300" />,
        color: 'bg-primary-50 dark:bg-primary-900/20',
      },
    ]
  ), [state.projects.length, state.tasks, state.customers.length, locale]);

  const incomeStatsCards = useMemo(() => (
    [
      {
        title: t('dashboard.stats.totalActiveCustomers', locale),
        value: incomeStats.activeCustomers,
        change: undefined,
        icon: <Users size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t('dashboard.stats.averageHoursPerDay', locale),
        value: incomeStats.averageHoursPerDay.toFixed(1),
        change: undefined,
        icon: <Target size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t('dashboard.stats.averageIncomePerCustomer', locale),
        value: formatSummaryCurrency(incomeStats.averageIncomePerCustomer),
        change: undefined,
        icon: <TrendingUp size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t('dashboard.stats.averageIncomePerHour', locale),
        value: formatSummaryCurrency(incomeStats.averageIncomePerHour),
        change: undefined,
        icon: <Calculator size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t('dashboard.stats.totalIncomeFromCustomers', locale),
        value: formatSummaryCurrency(incomeStats.totalIncome),
        change: undefined,
        icon: <DollarSign size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t('dashboard.stats.totalWorkHours', locale),
        value: incomeStats.totalWorkHours.toFixed(1),
        change: undefined,
        icon: <Clock size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
    ]
  ), [incomeStats, locale, currency]);

  const alignStart = isRTL ? 'text-right' : 'text-left';

  const getDateFnsLocale = (loc: Locale) => {
    switch (loc) {
      case 'he': return he;
      case 'es': return es;
      case 'de': return de;
      case 'pt': return ptBR;
      case 'fr': return undefined; // date-fns fr can be added if needed
      default: return undefined;
    }
  };
  const dateLocale = getDateFnsLocale(locale);
  const dateFormat = locale === 'he' ? 'dd/MM/yy' : 'MM/dd/yy';
  const formattedStart = format(start, dateFormat, { locale: dateLocale });
  const formattedEnd = format(end, dateFormat, { locale: dateLocale });

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className={alignStart}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title', locale)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.periodSelector.dateRange', locale, { start: formattedStart, end: formattedEnd })}
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
            <option value="currentMonth">{t('dashboard.periodSelector.currentMonth', locale)}</option>
            <option value="lastMonth">{t('dashboard.periodSelector.lastMonth', locale)}</option>
            <option value="currentYear">{t('dashboard.periodSelector.currentYear', locale)}</option>
            <option value="allTime">{t('dashboard.periodSelector.allTime', locale)}</option>
            <option value="custom">{t('dashboard.periodSelector.custom', locale)}</option>
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