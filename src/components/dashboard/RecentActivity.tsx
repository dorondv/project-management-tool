import { motion } from 'framer-motion';
import { formatDateTime } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export function RecentActivity() {
  const { state } = useApp();
  const recentActivities = state.activities.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent activity
            </p>
          </div>
        ) : (
          recentActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3"
            >
              <Avatar
                src={activity.user?.avatar}
                alt={activity.user?.name || 'User'}
                size="sm"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{activity.user?.name || 'Unknown'}</span>
                  {' '}
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(activity.createdAt)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}