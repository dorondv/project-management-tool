import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, Sun, Moon, LogOut, User, Languages, Menu, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Locale, SUPPORTED_LOCALES, LOCALE_LABELS } from '../../types';
import { t } from '../../i18n';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps = {}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { state, dispatch } = useApp();
  const isRTL = state.locale === 'he';
  const locale = (state.locale ?? 'en') as Locale;

  const unreadNotifications = state.notifications.filter(n => !n.read).length;

  const handleThemeToggle = () => {
    dispatch({ type: 'TOGGLE_THEME' });
    toast.success(state.theme === 'light' ? t('header.switchToDark', locale) : t('header.switchToLight', locale));
  };

  const handleLocaleSelect = async (selectedLocale: Locale) => {
    dispatch({ type: 'SET_LOCALE', payload: selectedLocale });
    setShowLanguageMenu(false);
    toast.success(t('header.localeToast', selectedLocale));
    if (state.user?.id) {
      try {
        await api.users.update(state.user.id, { preferredLanguage: selectedLocale });
      } catch (e) {
        console.warn('Failed to persist preferred language:', e);
      }
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
      // Implement search functionality
    }
  };

  // Close language menu when clicking outside
  const languageMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu]);

  return (
    <>
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className={`fixed top-0 ${isRTL ? 'right-0 lg:right-64 left-0' : 'left-0 lg:left-64 right-0'} h-16 lg:h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-30`}
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {isRTL ? (
            <>
              {/* Mobile menu button - RTL */}
              <button
                onClick={onMobileMenuClick}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              
              {/* Spacer to push actions to the right */}
              <div className="flex-1"></div>
              {/* Actions - RTL: on right, order reversed */}
              <div className="flex items-center gap-4 flex-row-reverse" dir="ltr">
                {/* Theme Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {state.theme === 'light' ? <Moon size={28} /> : <Sun size={28} />}
                </button>

                {/* Language Dropdown */}
                <div className="relative" ref={languageMenuRef}>
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                    aria-label="Select language"
                  >
                    <Languages size={28} />
                    <ChevronDown size={16} className={showLanguageMenu ? 'rotate-180' : ''} />
                  </button>
                  {showLanguageMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50`}
                    >
                      {SUPPORTED_LOCALES.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => handleLocaleSelect(loc)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            isRTL ? 'flex-row-reverse text-right' : 'text-left'
                          } ${
                            state.locale === loc ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''
                          }`}
                        >
                          {LOCALE_LABELS[loc]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" 
                    aria-label={t('header.notifications', locale)}
                  >
                    <Bell size={28} />
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
                      name={state.user?.name}
                      size="sm"
                      className="!w-11 !h-11"
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
                        <User size={22} />
                        {t('header.profile', locale)}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex-row-reverse text-right"
                      >
                        <LogOut size={22} />
                        {t('header.logout', locale)}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Mobile menu button - LTR */}
              <button
                onClick={onMobileMenuClick}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              
              {/* Spacer to push actions to the right */}
              <div className="flex-1"></div>

              {/* Actions - LTR: on right */}
              <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {state.theme === 'light' ? <Moon size={28} /> : <Sun size={28} />}
                </button>

                {/* Language Dropdown */}
                <div className="relative" ref={languageMenuRef}>
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                    aria-label="Select language"
                  >
                    <Languages size={28} />
                    <ChevronDown size={16} className={showLanguageMenu ? 'rotate-180' : ''} />
                  </button>
                  {showLanguageMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50`}
                    >
                      {SUPPORTED_LOCALES.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => handleLocaleSelect(loc)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            isRTL ? 'flex-row-reverse text-right' : 'text-left'
                          } ${
                            state.locale === loc ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''
                          }`}
                        >
                          {LOCALE_LABELS[loc]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" 
                    aria-label={t('header.notifications', locale)}
                  >
                    <Bell size={28} />
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
                      name={state.user?.name}
                      size="sm"
                      className="!w-11 !h-11"
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
                        <User size={22} />
                        {t('header.profile', locale)}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <LogOut size={22} />
                        {t('header.logout', locale)}
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