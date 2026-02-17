import { motion } from 'framer-motion';
import { Bell, Check, RefreshCw, Trash2 } from 'lucide-react';
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
  delete: string;
  deleteConfirm: string;
  deleteSuccess: string;
  deleteError: string;
}> = {
  en: {
    pageTitle: 'Notifications',
    pageSubtitle: 'Stay updated with your project activities',
    markAllRead: 'Mark All Read',
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
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this notification?',
    deleteSuccess: 'Notification deleted',
    deleteError: 'Failed to delete notification',
  },
  he: {
    pageTitle: 'התראות',
    pageSubtitle: 'הישאר מעודכן עם פעילויות הפרויקטים שלך',
    markAllRead: 'סמן הכל כנקרא',
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
    delete: 'מחיקה',
    deleteConfirm: 'האם אתה בטוח שברצונך למחוק התראה זו?',
    deleteSuccess: 'ההתראה נמחקה',
    deleteError: 'מחיקת ההתראה נכשלה',
  },
  es: {
    pageTitle: 'Notificaciones',
    pageSubtitle: 'Mantente al dia con la actividad de tus proyectos',
    markAllRead: 'Marcar todo como leido',
    refresh: 'Actualizar',
    refreshing: 'Actualizando...',
    refreshSuccess: 'Notificaciones actualizadas',
    refreshError: 'Error al actualizar notificaciones',
    total: 'Total',
    unread: 'No leidas',
    read: 'Leidas',
    recentNotifications: 'Notificaciones recientes',
    emptyTitle: 'Aun no hay notificaciones',
    emptySubtitle: 'Veras notificaciones aqui cuando haya actividad en tus proyectos',
    newBadge: 'Nuevo',
    markAsReadToast: 'Notificacion marcada como leida',
    markAllReadToast: 'Todas las notificaciones marcadas como leidas',
    delete: 'Eliminar',
    deleteConfirm: 'Seguro que quieres eliminar esta notificacion?',
    deleteSuccess: 'Notificacion eliminada',
    deleteError: 'No se pudo eliminar la notificacion',
  },
  de: {
    pageTitle: 'Benachrichtigungen',
    pageSubtitle: 'Bleib ueber Projektaktivitaeten auf dem Laufenden',
    markAllRead: 'Alle als gelesen markieren',
    refresh: 'Aktualisieren',
    refreshing: 'Wird aktualisiert...',
    refreshSuccess: 'Benachrichtigungen aktualisiert',
    refreshError: 'Aktualisierung fehlgeschlagen',
    total: 'Gesamt',
    unread: 'Ungelesen',
    read: 'Gelesen',
    recentNotifications: 'Letzte Benachrichtigungen',
    emptyTitle: 'Noch keine Benachrichtigungen',
    emptySubtitle: 'Hier erscheinen Benachrichtigungen bei Aktivitaeten in deinen Projekten',
    newBadge: 'Neu',
    markAsReadToast: 'Benachrichtigung als gelesen markiert',
    markAllReadToast: 'Alle Benachrichtigungen als gelesen markiert',
    delete: 'Loeschen',
    deleteConfirm: 'Moechtest du diese Benachrichtigung wirklich loeschen?',
    deleteSuccess: 'Benachrichtigung geloescht',
    deleteError: 'Benachrichtigung konnte nicht geloescht werden',
  },
  pt: {
    pageTitle: 'Notificacoes',
    pageSubtitle: 'Fique por dentro das atividades dos seus projetos',
    markAllRead: 'Marcar tudo como lido',
    refresh: 'Atualizar',
    refreshing: 'Atualizando...',
    refreshSuccess: 'Notificacoes atualizadas',
    refreshError: 'Falha ao atualizar notificacoes',
    total: 'Total',
    unread: 'Nao lidas',
    read: 'Lidas',
    recentNotifications: 'Notificacoes recentes',
    emptyTitle: 'Ainda nao ha notificacoes',
    emptySubtitle: 'Voce vera notificacoes aqui quando houver atividade nos seus projetos',
    newBadge: 'Novo',
    markAsReadToast: 'Notificacao marcada como lida',
    markAllReadToast: 'Todas as notificacoes marcadas como lidas',
    delete: 'Excluir',
    deleteConfirm: 'Tem certeza de que deseja excluir esta notificacao?',
    deleteSuccess: 'Notificacao excluida',
    deleteError: 'Falha ao excluir notificacao',
  },
  fr: {
    pageTitle: 'Notifications',
    pageSubtitle: 'Restez informe des activites de vos projets',
    markAllRead: 'Tout marquer comme lu',
    refresh: 'Actualiser',
    refreshing: 'Actualisation...',
    refreshSuccess: 'Notifications actualisees',
    refreshError: 'Echec de l actualisation des notifications',
    total: 'Total',
    unread: 'Non lues',
    read: 'Lues',
    recentNotifications: 'Notifications recentes',
    emptyTitle: 'Aucune notification pour le moment',
    emptySubtitle: 'Vous verrez ici les notifications quand il y aura de l activite',
    newBadge: 'Nouveau',
    markAsReadToast: 'Notification marquee comme lue',
    markAllReadToast: 'Toutes les notifications marquees comme lues',
    delete: 'Supprimer',
    deleteConfirm: 'Voulez-vous vraiment supprimer cette notification ?',
    deleteSuccess: 'Notification supprimee',
    deleteError: 'Echec de la suppression de la notification',
  },
};

export default function Notifications() {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale] ?? translations.en;
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

  const handleDeleteNotification = async (notificationId: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await api.notifications.delete(notificationId);
      const nextNotifications = state.notifications.filter(n => n.id !== notificationId);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: nextNotifications });
      toast.success(t.deleteSuccess);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error(t.deleteError);
    }
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
                onClick={handleRefresh}
                disabled={isRefreshing}
                loading={isRefreshing}
                icon={<RefreshCw size={16} />}
                className="flex-row-reverse"
              >
                {isRefreshing ? t.refreshing : t.refresh}
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
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isRTL ? 'gap-4' : 'space-x-3'}`}>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>{t.total}</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                  {state.notifications.length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isRTL ? 'gap-4' : 'space-x-3'}`}>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>{t.unread}</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                  {unreadCount}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isRTL ? 'gap-4' : 'space-x-3'}`}>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>{t.read}</p>
                <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                  {state.notifications.length - unreadCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
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
            (isRTL ? [...state.notifications].reverse() : state.notifications).map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <p className={`text-sm font-medium text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                        {notification.title}
                      </p>
                      <p className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {formatDateTime(notification.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <Badge variant="primary" size="sm">
                        {t.newBadge}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification.id)}
                      icon={<Trash2 size={16} />}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      icon={<Check size={16} />}
                    />
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
