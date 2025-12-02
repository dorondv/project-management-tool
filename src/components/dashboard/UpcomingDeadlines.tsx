import { motion } from 'framer-motion';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, getDeadlineStatus } from '../../utils/dateUtils';
import { Badge } from '../common/Badge';
import { Locale } from '../../types';

const translations: Record<Locale, {
  title: string;
  statuses: {
    overdue: string;
    'due-soon': string;
    upcoming: string;
  };
}> = {
  en: {
    title: 'Upcoming Deadlines',
    statuses: {
      overdue: 'overdue',
      'due-soon': 'due soon',
      upcoming: 'upcoming',
    },
  },
  he: {
    title: 'אירועים קרובים',
    statuses: {
      overdue: 'באיחור',
      'due-soon': 'קרוב',
      upcoming: 'קרוב',
    },
  },
};

export function UpcomingDeadlines() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const upcomingTasks = state.tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'overdue': return 'error';
      case 'due-soon': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return t.statuses[status as keyof typeof t.statuses] || status;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t.title}
      </h3>
      <div className="space-y-4">
        {upcomingTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
              {locale === 'he' ? 'אין מועדים קרובים' : 'No upcoming deadlines'}
            </p>
          </div>
        ) : (
          upcomingTasks.map((task, index) => {
            const deadlineStatus = getDeadlineStatus(task.dueDate);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <Calendar size={16} className="text-primary-500 dark:text-primary-300" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                      {task.title}
                    </p>
                    <p className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatDate(task.dueDate, locale)}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(deadlineStatus)}>
                  {deadlineStatus === 'overdue' && <AlertTriangle size={12} className="mr-1" />}
                  {deadlineStatus === 'due-soon' && <Clock size={12} className="mr-1" />}
                  {getStatusLabel(deadlineStatus)}
                </Badge>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}