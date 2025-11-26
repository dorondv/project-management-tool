import { motion } from 'framer-motion';
import { FolderOpen, CheckSquare, Contact, Clock, Target, TrendingUp, DollarSign, Users, Calculator } from 'lucide-react';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ProjectChart } from '../components/dashboard/ProjectChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines';
import { IncomePerHourChart } from '../components/dashboard/IncomePerHourChart';
import { MonthlyTrendsChart } from '../components/dashboard/MonthlyTrendsChart';

const dashboardTranslations = {
  en: {
    title: 'Dashboard',
    subtitle: (name?: string) => `Welcome back, ${name ?? 'there'}! Here's what's happening with your projects.`,
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
  const isRTL = locale === 'he';
  const t = dashboardTranslations[locale];

  // Calculate income and work statistics
  const incomeStats = useMemo(() => {
    // Calculate total income from time entries and income records
    const totalIncomeFromTimeEntries = state.timeEntries.reduce((sum, entry) => sum + entry.income, 0);
    const totalIncomeFromIncomes = state.incomes.reduce((sum, income) => sum + income.finalAmount, 0);
    const totalIncome = totalIncomeFromTimeEntries + totalIncomeFromIncomes;

    // Calculate total work hours (convert seconds to hours)
    const totalWorkHours = state.timeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);

    // Calculate active customers
    const activeCustomers = state.customers.filter(c => c.status === 'active').length;

    // Calculate average hours per day
    // Get unique work days
    const workDays = new Set(
      state.timeEntries.map(entry => {
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
  }, [state.timeEntries, state.incomes, state.customers]);

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
        value: `₪${incomeStats.averageIncomePerCustomer.toFixed(0)}`,
        change: undefined,
        icon: <TrendingUp size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t.stats.averageIncomePerHour,
        value: `₪${incomeStats.averageIncomePerHour.toFixed(0)}`,
        change: undefined,
        icon: <Calculator size={20} className="text-pink-500 dark:text-pink-300" />,
        color: 'bg-pink-50 dark:bg-pink-900/20',
      },
      {
        title: t.stats.totalIncomeFromCustomers,
        value: `₪${incomeStats.totalIncome.toFixed(0)}`,
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
  ), [incomeStats, t.stats]);

  const alignStart = isRTL ? 'text-right' : 'text-left';

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="flex items-center justify-between">
        <div className={alignStart}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.subtitle(state.user?.name)}
          </p>
        </div>
      </div>

      <motion.div
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
      </motion.div>

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
        <IncomePerHourChart />
        <MonthlyTrendsChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectChart />
        <RecentActivity />
      </div>

      <UpcomingDeadlines />
    </div>
  );
}