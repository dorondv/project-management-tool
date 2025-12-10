import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  FolderOpen,
  CheckSquare,
  Users,
  Calendar,
  Settings,
  Bell,
  Menu,
  X,
  Contact,
  Clock,
  DollarSign,
  Accessibility,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { AccessibilityModal } from '../common/AccessibilityModal';
import { SupportModal } from '../common/SupportModal';

const menuItems = [
  { icon: Home, key: 'dashboard', path: '/' },
  { icon: Clock, key: 'timer', path: '/timer' },
  { icon: CheckSquare, key: 'tasks', path: '/tasks' },
  { icon: FolderOpen, key: 'projects', path: '/projects' },
  { icon: Contact, key: 'customers', path: '/customers' },
  { icon: Calendar, key: 'calendar', path: '/calendar' },
  { icon: Bell, key: 'notifications', path: '/notifications' },
  { icon: DollarSign, key: 'incomes', path: '/incomes' },
  // Team feature hidden for current version - keep for future use
  // { icon: Users, key: 'team', path: '/team' },
  { icon: Settings, key: 'settings', path: '/settings' },
];

const menuLabels = {
  en: {
    dashboard: 'Dashboard',
    timer: 'Timer',
    tasks: 'Tasks',
    projects: 'Projects',
    customers: 'Customers',
    calendar: 'Calendar',
    notifications: 'Notifications',
    incomes: 'Income Management',
    // team: 'Team', // Hidden for current version - keep for future use
    settings: 'Settings',
    accessibility: 'Accessibility',
    support: 'Support',
    logout: 'Logout',
    // Role translations
    admin: 'Admin',
    manager: 'Manager',
    contributor: 'Contributor',
  },
  he: {
    dashboard: 'לוח בקרה',
    timer: 'מעקב זמן',
    tasks: 'משימות',
    projects: 'פרויקטים',
    customers: 'לקוחות',
    calendar: 'לוח שנה',
    notifications: 'התראות',
    incomes: 'ניהול הכנסות',
    // team: 'צוות', // מוסתר בגרסה הנוכחית - שמור לשימוש עתידי
    settings: 'הגדרות',
    accessibility: 'נגישות',
    support: 'תמיכה',
    logout: 'התנתק',
    // Role translations
    admin: 'מנהל',
    manager: 'מנהל פרויקט',
    contributor: 'חבר צוות',
  },
} as const;

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const location = useLocation();
  const { state, dispatch } = useApp();
  const locale = state.locale;
  const isRTL = locale === 'he';
  const labels = menuLabels[locale];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return labels.admin;
      case 'manager':
        return labels.manager;
      case 'contributor':
        return labels.contributor;
      default:
        return role;
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <motion.div
      initial={{ x: isRTL ? 240 : -240 }}
      animate={{ x: 0 }}
      className={`fixed ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} top-0 h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isCollapsed ? 'justify-center relative' : 'justify-between'}`}>
            {isCollapsed ? (
              <>
                <div className="rounded-lg p-1 bg-transparent">
                  <img 
                    src="/assets/png/solo transparent.png" 
                    alt="SOLO" 
                    className="h-8 w-8 object-contain"
                    style={{ backgroundColor: 'transparent', background: 'transparent' }}
                    onError={(e) => {
                      // Fallback to small logo if transparent version doesn't exist
                      const target = e.target as HTMLImageElement;
                      if (target.src !== `${window.location.origin}/assets/png/solo logo small.png`) {
                        target.src = '/assets/png/solo logo small.png';
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-4 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors`}
                >
                  <Menu size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <div className={`flex items-center ${isRTL ? 'justify-end flex-row-reverse gap-2' : 'gap-2'} rounded-lg p-1 bg-transparent`}>
                  <img 
                    src="/assets/png/solo transparent.png" 
                    alt="SOLO" 
                    className="h-8 object-contain"
                    style={{ backgroundColor: 'transparent', background: 'transparent' }}
                    onError={(e) => {
                      // Fallback to wide logo if transparent version doesn't exist
                      const target = e.target as HTMLImageElement;
                      if (target.src !== `${window.location.origin}/assets/png/solo logo wide.png`) {
                        target.src = '/assets/png/solo logo wide.png';
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="md:hidden p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <X size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isCollapsed 
                        ? 'justify-center' 
                        : isRTL 
                          ? 'flex-row-reverse justify-end' 
                          : ''
                    } ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/10 dark:hover:text-primary-200'
                    }`}
                  >
                    {!isCollapsed && (
                      <span
                        className={`font-medium ${
                          isRTL ? 'flex-1 text-right' : 'flex-1 text-left'
                        }`}
                      >
                        {labels[item.key as keyof typeof labels]}
                      </span>
                    )}
                    <item.icon size={20} className={isRTL ? 'flex-shrink-0' : ''} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Menu Items */}
        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
          <ul className="space-y-1 px-3">
            <li>
              <button
                onClick={() => setIsAccessibilityModalOpen(true)}
                className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isCollapsed 
                    ? 'justify-center' 
                    : isRTL 
                      ? 'flex-row-reverse justify-end' 
                      : ''
                } text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/10 dark:hover:text-primary-200`}
              >
                {!isCollapsed && (
                  <span
                    className={`font-medium ${
                      isRTL ? 'flex-1 text-right' : 'flex-1 text-left'
                    }`}
                  >
                    {labels.accessibility}
                  </span>
                )}
                <Accessibility size={20} className={isRTL ? 'flex-shrink-0' : ''} />
              </button>
            </li>
            <li>
              <button
                onClick={() => setIsSupportModalOpen(true)}
                className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isCollapsed 
                    ? 'justify-center' 
                    : isRTL 
                      ? 'flex-row-reverse justify-end' 
                      : ''
                } text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/10 dark:hover:text-primary-200`}
              >
                {!isCollapsed && (
                  <span
                    className={`font-medium ${
                      isRTL ? 'flex-1 text-right' : 'flex-1 text-left'
                    }`}
                  >
                    {labels.support}
                  </span>
                )}
                <HelpCircle size={20} className={isRTL ? 'flex-shrink-0' : ''} />
              </button>
            </li>
          </ul>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {state.user && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`} dir={isRTL && !isCollapsed ? 'ltr' : undefined}>
              {isRTL && !isCollapsed ? (
                <>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {state.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getRoleLabel(state.user.role)}
                    </p>
                  </div>
                  <Avatar
                    src={state.user.avatar}
                    alt={state.user.name}
                    size="md"
                    isOnline={state.user.isOnline}
                  />
                </>
              ) : (
                <>
                  <Avatar
                    src={state.user.avatar}
                    alt={state.user.name}
                    size="md"
                    isOnline={state.user.isOnline}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {state.user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getRoleLabel(state.user.role)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-lg transition-all duration-200 ${
                isRTL ? 'flex-row-reverse justify-end' : ''
              } text-gray-700 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/10 dark:hover:text-red-400`}
            >
              <span
                className={`font-medium ${
                  isRTL ? 'flex-1 text-right' : 'flex-1 text-left'
                }`}
              >
                {labels.logout}
              </span>
              <LogOut size={20} className={isRTL ? 'flex-shrink-0' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AccessibilityModal
        isOpen={isAccessibilityModalOpen}
        onClose={() => setIsAccessibilityModalOpen(false)}
      />
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </motion.div>
  );
}