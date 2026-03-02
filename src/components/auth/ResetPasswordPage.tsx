import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '../common/Button';
import { Footer } from '../layout/Footer';
import { supabase } from '../../utils/supabase';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const locale = (state.locale === 'en' || state.locale === 'he') ? state.locale : 'en';
  const isRTL = locale === 'he';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const translations = {
    en: {
      title: 'Set New Password',
      subtitle: 'Enter your new password below',
      password: 'New Password',
      passwordPlaceholder: 'Enter new password',
      confirmPassword: 'Confirm Password',
      confirmPlaceholder: 'Confirm new password',
      submit: 'Update Password',
      success: 'Password updated successfully!',
      mismatch: 'Passwords do not match',
      tooShort: 'Password must be at least 6 characters',
      backToLogin: 'Back to Login',
      verifying: 'Verifying reset link...',
      invalidLink: 'This password reset link is invalid or has expired.',
    },
    he: {
      title: 'הגדר סיסמה חדשה',
      subtitle: 'הכנס את הסיסמה החדשה שלך',
      password: 'סיסמה חדשה',
      passwordPlaceholder: 'הכנס סיסמה חדשה',
      confirmPassword: 'אימות סיסמה',
      confirmPlaceholder: 'אשר את הסיסמה החדשה',
      submit: 'עדכן סיסמה',
      success: 'הסיסמה עודכנה בהצלחה!',
      mismatch: 'הסיסמאות אינן תואמות',
      tooShort: 'הסיסמה חייבת להכיל לפחות 6 תווים',
      backToLogin: 'חזרה להתחברות',
      verifying: 'מאמת קישור איפוס...',
      invalidLink: 'קישור איפוס הסיסמה אינו תקין או שפג תוקפו.',
    },
  };

  const t = translations[locale] ?? translations.en;

  useEffect(() => {
    const exchangeToken = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = searchParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setSessionError(error.message);
            return;
          }
          window.history.replaceState(null, '', window.location.pathname);
          setSessionReady(true);
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setSessionError(error.message);
            return;
          }
          window.history.replaceState(null, '', window.location.pathname);
          setSessionReady(true);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setSessionReady(true);
          } else {
            setSessionError(t.invalidLink);
          }
        }
      } catch (err: any) {
        setSessionError(err.message || 'Failed to verify reset link');
      }
    };

    exchangeToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(t.tooShort);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t.success, { duration: 5000 });
        await supabase.auth.signOut();
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t.subtitle}
            </p>
          </div>

          {!sessionReady && !sessionError && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t.verifying}</p>
            </div>
          )}

          {sessionError && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-6">{sessionError}</p>
              <Button onClick={() => navigate('/')} fullWidth>
                {t.backToLogin}
              </Button>
            </div>
          )}

          {sessionReady && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                    placeholder={t.passwordPlaceholder}
                    required
                    minLength={6}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} size={20} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
                    placeholder={t.confirmPlaceholder}
                    required
                    minLength={6}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={<KeyRound size={20} />}
              >
                {t.submit}
              </Button>
            </form>
          )}
        </div>
        <div className="mt-6">
          <Footer />
        </div>
      </motion.div>
    </div>
  );
}
