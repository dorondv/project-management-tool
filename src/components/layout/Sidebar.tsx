import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Shield,
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
    admin: 'Admin Panel',
    accessibility: 'Accessibility',
    support: 'Support',
    logout: 'Logout',
    // Role translations
    adminRole: 'Admin',
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
    admin: 'פאנל ניהול',
    accessibility: 'נגישות',
    support: 'תמיכה',
    logout: 'התנתק',
    // Role translations
    adminRole: 'מנהל',
    manager: 'מנהל פרויקט',
    contributor: 'חבר צוות',
  },
} as const;

interface SidebarProps {
  isMobileDrawerOpen?: boolean;
  onMobileDrawerClose?: () => void;
}

export function Sidebar({ isMobileDrawerOpen = false, onMobileDrawerClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const location = useLocation();
  const { state, dispatch } = useApp();
  const locale = state.locale;
  const isRTL = locale === 'he';
  const labels = menuLabels[locale];

  // Close mobile drawer when navigating
  const handleLinkClick = () => {
    if (onMobileDrawerClose) {
      onMobileDrawerClose();
    }
  };

  // Determine if we should use mobile animation (only on mobile screens)
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return labels.adminRole;
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
    <>
      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={onMobileDrawerClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          // Only animate on mobile, on desktop always show (x: 0)
          x: isMobile && !isMobileDrawerOpen 
            ? (isRTL ? '100%' : '-100%') 
            : 0
        }}
        transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} top-0 h-full 
          bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg 
          z-40
          ${isCollapsed ? 'w-16' : 'w-64'}
          lg:!translate-x-0 lg:block
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="pt-5 pb-5 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isCollapsed ? 'justify-center relative' : 'justify-between'}`}>
            {isCollapsed ? (
              <>
                <div className="rounded-lg p-1 bg-transparent">
                  <img 
                    src="/assets/png/sollo Inverted Color Transparent bg.svg" 
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
                    src="/assets/png/sollo Inverted Color Transparent bg.svg" 
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
                  onClick={() => {
                    setIsCollapsed(!isCollapsed);
                    if (onMobileDrawerClose) {
                      onMobileDrawerClose();
                    }
                  }}
                  className="lg:hidden p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
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
                    onClick={handleLinkClick}
                    className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isCollapsed 
                        ? 'justify-center' 
                        : ''
                    } ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/10 dark:hover:text-primary-200'
                    }`}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                      <span
                        className={`font-medium flex-1 ${
                          isRTL ? 'text-right' : 'text-left'
                        }`}
                      >
                        {labels[item.key as keyof typeof labels]}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            {/* Admin Panel Link - Only for admin users */}
            {state.user?.role === 'admin' && (
              <li>
                <Link
                  to="/admin"
                  onClick={handleLinkClick}
                  className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isCollapsed 
                      ? 'justify-center' 
                      : ''
                  } ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/10 dark:hover:text-primary-200'
                  }`}
                >
                  <Shield size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span
                      className={`font-medium flex-1 ${
                        isRTL ? 'text-right' : 'text-left'
                      }`}
                    >
                      {labels.admin}
                    </span>
                  )}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Bottom Menu Items */}
        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
          <ul className="space-y-1 px-3">
            <li>
              <button
                onClick={() => setIsAccessibilityModalOpen(true)}
                className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isCollapsed 
                    ? 'justify-center' 
                    : ''
                } text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/10 dark:hover:text-primary-200`}
              >
                <Accessibility size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span
                    className={`font-medium flex-1 ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {labels.accessibility}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => setIsSupportModalOpen(true)}
                className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isCollapsed 
                    ? 'justify-center' 
                    : ''
                } text-gray-700 hover:bg-primary-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-primary-900/10 dark:hover:text-primary-200`}
              >
                <HelpCircle size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span
                    className={`font-medium flex-1 ${
                      isRTL ? 'text-right' : 'text-left'
                    }`}
                  >
                    {labels.support}
                  </span>
                )}
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
              className={`w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/10 dark:hover:text-red-400`}
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span
                className={`font-medium flex-1 ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {labels.logout}
              </span>
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
    </>
  );
}