import { motion } from 'framer-motion';
import { formatDateTime } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { Locale } from '../../types';

const translations: Record<Locale, {
  title: string;
  noActivity: string;
}> = {
  en: {
    title: 'Recent Activity',
    noActivity: 'No recent activity',
  },
  he: {
    title: 'פעולות אחרונות',
    noActivity: 'אין פעילות אחרונה',
  },
};

export function RecentActivity() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const recentActivities = state.activities.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t.title}
      </h3>
      <div className="space-y-4">
        {recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.noActivity}
            </p>
          </div>
        ) : (
          recentActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}
            >
              <Avatar
                src={activity.user?.avatar}
                alt={activity.user?.name || (locale === 'he' ? 'משתמש' : 'User')}
                name={activity.user?.name}
                size="sm"
              />
              <div className="flex-1">
                <p className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                  <span className="font-medium">{activity.user?.name || (locale === 'he' ? 'לא ידוע' : 'Unknown')}</span>
                  {' '}
                  {activity.description}
                </p>
                <p className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {formatDateTime(activity.createdAt, locale)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}