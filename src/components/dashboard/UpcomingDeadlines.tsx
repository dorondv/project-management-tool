import { motion } from 'framer-motion';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate, getDeadlineStatus } from '../../utils/dateUtils';
import { Badge } from '../common/Badge';

export function UpcomingDeadlines() {
  const { state } = useApp();

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Upcoming Deadlines
      </h3>
      <div className="space-y-4">
        {upcomingTasks.map((task, index) => {
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(task.dueDate)}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(deadlineStatus)}>
                {deadlineStatus === 'overdue' && <AlertTriangle size={12} className="mr-1" />}
                {deadlineStatus === 'due-soon' && <Clock size={12} className="mr-1" />}
                {deadlineStatus.replace('-', ' ')}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}