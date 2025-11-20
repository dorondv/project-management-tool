import { motion } from 'framer-motion';
import { Bell, Check, Settings, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { Locale } from '../types';
import { api } from '../utils/api';
import { useState } from 'react';

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  markAllRead: string;
  settings: string;
  refresh: string;
  refreshing: string;
  refreshSuccess: string;
  refreshError: string;
  total: string;
  unread: string;
  read: string;
  recentNotifications: string;
  emptyTitle: string;
  emptySubtitle: string;
  newBadge: string;
  markAsReadToast: string;
  markAllReadToast: string;
}> = {
  en: {
    pageTitle: 'Notifications',
    pageSubtitle: 'Stay updated with your project activities',
    markAllRead: 'Mark All Read',
    settings: 'Settings',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    refreshSuccess: 'Notifications refreshed',
    refreshError: 'Failed to refresh notifications',
    total: 'Total',
    unread: 'Unread',
    read: 'Read',
    recentNotifications: 'Recent Notifications',
    emptyTitle: 'No notifications yet',
    emptySubtitle: "You'll see notifications here when there's activity on your projects",
    newBadge: 'New',
    markAsReadToast: 'Notification marked as read',
    markAllReadToast: 'All notifications marked as read',
  },
  he: {
    pageTitle: 'התראות',
    pageSubtitle: 'הישאר מעודכן עם פעילויות הפרויקטים שלך',
    markAllRead: 'סמן הכל כנקרא',
    settings: 'הגדרות',
    refresh: 'רענן',
    refreshing: 'מרענן...',
    refreshSuccess: 'התראות רועננו',
    refreshError: 'נכשל ברענון ההתראות',
    total: 'סה"כ',
    unread: 'לא נקראו',
    read: 'נקראו',
    recentNotifications: 'התראות אחרונות',
    emptyTitle: 'אין התראות עדיין',
    emptySubtitle: 'תראה התראות כאן כשיש פעילות בפרויקטים שלך',
    newBadge: 'חדש',
    markAsReadToast: 'התראה סומנה כנקראה',
    markAllReadToast: 'כל ההתראות סומנו כנקראו',
  },
};

export default function Notifications() {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const userId = state.user?.id;
      const notifications = await api.notifications.getAll(
        userId ? { userId } : undefined
      );
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      toast.success(t.refreshSuccess);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      toast.error(t.refreshError);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
    toast.success(t.markAsReadToast);
  };

  const handleMarkAllAsRead = () => {
    state.notifications
      .filter(n => !n.read)
      .forEach(n => {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
      });
    toast.success(t.markAllReadToast);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '👤';
      case 'deadline_approaching':
        return '⏰';
      case 'task_completed':
        return '✅';
      case 'project_updated':
        return '📁';
      default:
        return '📢';
    }
  };

  const unreadCount = state.notifications.filter(n => !n.read).length;
  const alignStart = isRTL ? 'text-right' : 'text-left';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex items-center justify-between">
        {isRTL ? (
          <>
            <div className={alignStart}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.pageTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.pageSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-row-reverse justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                loading={isRefreshing}
                icon={<RefreshCw size={16} />}
                className="flex-row-reverse"
              >
                {isRefreshing ? t.refreshing : t.refresh}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  icon={<Check size={16} />}
                  className="flex-row-reverse"
                >
                  {t.markAllRead}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={<Settings size={16} />}
                className="flex-row-reverse"
              >
                {t.settings}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={alignStart}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.pageTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.pageSubtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                loading={isRefreshing}
                icon={<RefreshCw size={16} />}
              >
                {isRefreshing ? t.refreshing : t.refresh}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  icon={<Check size={16} />}
                >
                  {t.markAllRead}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={<Settings size={16} />}
              >
                {t.settings}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'} ${alignStart}`}>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.total}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.notifications.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'} ${alignStart}`}>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.unread}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'} ${alignStart}`}>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.read}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.notifications.length - unreadCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
            {t.recentNotifications}
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {state.notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-2 ${alignStart}`}>
                {t.emptyTitle}
              </h3>
              <p className={`text-gray-600 dark:text-gray-400 ${alignStart}`}>
                {t.emptySubtitle}
              </p>
            </div>
          ) : (
            state.notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className={`flex items-start ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-4'}`}>
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={alignStart}>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
                        {!notification.read && (
                          <Badge variant="primary" size="sm">
                            {t.newBadge}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          icon={<Check size={16} />}
                          className={isRTL ? 'flex-row-reverse' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
