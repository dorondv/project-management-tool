import { motion } from 'framer-motion';
import { FolderOpen, CheckSquare, Users, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ProjectChart } from '../components/dashboard/ProjectChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines';

const dashboardTranslations = {
  en: {
    title: 'Dashboard',
    subtitle: (name?: string) => `Welcome back, ${name ?? 'there'}! Here's what's happening with your projects.`,
    stats: {
      totalProjects: 'Total Projects',
      activeTasks: 'Active Tasks',
      teamMembers: 'Team Members',
      overdueTasks: 'Overdue Tasks',
    },
  },
  he: {
    title: 'לוח מחוונים',
    subtitle: (name?: string) => `${name ?? 'שם'} ברוך השב! כך נראים הפרויקטים שלך כרגע.`,
    stats: {
      totalProjects: 'סה"כ פרויקטים',
      activeTasks: 'משימות פעילות',
      teamMembers: 'חברי צוות',
      overdueTasks: 'משימות באיחור',
    },
  },
} as const;

export default function Dashboard() {
  const { state } = useApp();
  const locale = state.locale;
  const isRTL = locale === 'he';
  const t = dashboardTranslations[locale];

  const stats = useMemo(() => (
    [
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
        title: t.stats.teamMembers,
        value: 4,
        icon: <Users size={20} className="text-primary-500 dark:text-primary-300" />,
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
  ), [state.projects.length, state.tasks, t.stats.activeTasks, t.stats.overdueTasks, t.stats.teamMembers, t.stats.totalProjects]);

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectChart />
        <RecentActivity />
      </div>

      <UpcomingDeadlines />
    </div>
  );
}