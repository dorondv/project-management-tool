import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, Sun, Moon, LogOut, User, Languages } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import toast from 'react-hot-toast';

const headerTranslations = {
  en: {
    searchPlaceholder: 'Search projects or tasks...',
    profile: 'Profile',
    logout: 'Logout',
    switchToDark: 'Switched to dark mode',
    switchToLight: 'Switched to light mode',
    localeToast: 'עברית הופעלה',
    localeToastEnglish: 'English set',
    notifications: 'Notifications',
    switchLocaleLabel: 'Switch to Hebrew',
  },
  he: {
    searchPlaceholder: 'חיפוש פרויקטים או משימות...',
    profile: 'פרופיל',
    logout: 'התנתקות',
    switchToDark: 'הופעלה תצוגה כהה',
    switchToLight: 'הופעלה תצוגה בהירה',
    localeToast: 'עברית הופעלה',
    localeToastEnglish: 'English set',
    notifications: 'התראות',
    switchLocaleLabel: 'Switch to English',
  },
} as const;

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { state, dispatch } = useApp();
  const isRTL = state.locale === 'he';
  const t = headerTranslations[state.locale];

  const unreadNotifications = state.notifications.filter(n => !n.read).length;

  const handleThemeToggle = () => {
    dispatch({ type: 'TOGGLE_THEME' });
    toast.success(state.theme === 'light' ? t.switchToDark : t.switchToLight);
  };

  const handleLocaleToggle = () => {
    const nextLocale = state.locale === 'he' ? 'en' : 'he';
    dispatch({ type: 'SET_LOCALE', payload: nextLocale });
    toast.success(nextLocale === 'he' ? headerTranslations.he.localeToast : headerTranslations.en.localeToastEnglish);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`);
      // Implement search functionality
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className={`fixed top-0 ${isRTL ? 'right-64 left-0' : 'left-64 right-0'} h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-30`}
      >
        <div className="flex items-center justify-between h-full px-6">
          {isRTL ? (
            <>
              {/* Search - RTL: on left */}
              <div className="flex-1 max-w-md text-right">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-4 text-right py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </form>
              </div>
              {/* Actions - RTL: on right, order reversed */}
              <div className="flex items-center gap-4 flex-row-reverse" dir="ltr">
                {/* Theme Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* Locale Toggle */}
                <button
                  onClick={handleLocaleToggle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label={state.locale === 'he' ? headerTranslations.he.switchLocaleLabel : headerTranslations.en.switchLocaleLabel}
                >
                  <Languages size={20} />
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label={t.notifications}>
                    <Bell size={20} />
                  </button>
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="error"
                      className="absolute -top-1 -left-1 min-w-[20px] h-5 flex items-center justify-center text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </div>

                {/* User Menu - RTL: last in DOM (leftmost visually) */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-row-reverse"
                  >
                    <Avatar
                      src={state.user?.avatar}
                      alt={state.user?.name}
                      size="sm"
                      isOnline={state.user?.isOnline}
                    />
                  </button>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {state.user?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {state.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex-row-reverse text-right"
                      >
                        <User size={16} />
                        {t.profile}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex-row-reverse text-right"
                      >
                        <LogOut size={16} />
                        {t.logout}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Search - LTR: on left */}
              <div className="flex-1 max-w-md text-left">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </form>
              </div>

              {/* Actions - LTR: on right */}
              <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* Locale Toggle */}
                <button
                  onClick={handleLocaleToggle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label={state.locale === 'he' ? headerTranslations.he.switchLocaleLabel : headerTranslations.en.switchLocaleLabel}
                >
                  <Languages size={20} />
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" aria-label={t.notifications}>
                    <Bell size={20} />
                  </button>
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="error"
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Avatar
                      src={state.user?.avatar}
                      alt={state.user?.name}
                      size="sm"
                      isOnline={state.user?.isOnline}
                    />
                  </button>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {state.user?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {state.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <User size={16} />
                        {t.profile}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <LogOut size={16} />
                        {t.logout}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.header>
    </>
  );
}