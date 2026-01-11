import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const { dispatch, state } = useApp();
  const navigate = useNavigate();
  const locale = state.locale || 'en';
  const isRTL = locale === 'he';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: 'Create Account',
      subtitle: 'Join SOLLO and start managing your projects',
      name: 'Full Name',
      namePlaceholder: 'Enter your full name',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Create a password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your password',
      agreeTerms: 'I agree to the',
      termsOfService: 'Terms of Service',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      signIn: 'Sign in',
      passwordsNotMatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      welcome: 'Welcome to SOLLO',
    },
    he: {
      title: 'יצירת חשבון',
      subtitle: 'הצטרף ל SOLLO והתחל לנהל את הפרויקטים שלך',
      name: 'שם מלא',
      namePlaceholder: 'הכנס את שמך המלא',
      email: 'כתובת אימייל',
      emailPlaceholder: 'הכנס את כתובת האימייל שלך',
      password: 'סיסמה',
      passwordPlaceholder: 'צור סיסמה',
      confirmPassword: 'אישור סיסמה',
      confirmPasswordPlaceholder: 'אשר את הסיסמה שלך',
      agreeTerms: 'אני מסכים ל',
      termsOfService: 'תנאי השירות',
      and: 'ו',
      privacyPolicy: 'מדיניות הפרטיות',
      createAccount: 'צור חשבון',
      alreadyHaveAccount: 'כבר יש לך חשבון?',
      signIn: 'התחבר',
      passwordsNotMatch: 'הסיסמאות אינן תואמות',
      passwordTooShort: 'הסיסמה חייבת להכיל לפחות 6 תווים',
      welcome: 'ברוך הבא ל SOLLO',
    },
  };

  const t = translations[locale as 'en' | 'he'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t.passwordsNotMatch);
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t.passwordTooShort);
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (authError) {
        toast.error(authError.message || 'Registration failed. Please try again.');
        return;
      }

      if (authData.user) {
        // Check if email confirmation is required
        if (!authData.session) {
          // Email confirmation required
          toast.success('Account created! Please check your email to confirm your account before logging in.', { duration: 6000 });
          setLoading(false);
          return;
        }

        // Create user profile in backend database
        const newUser = {
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: 'manager' as const,
          avatar: authData.user.user_metadata?.avatar_url,
          isOnline: true,
        };

        // Insert user into backend database
        try {
          const { api } = await import('../../utils/api');
          await api.users.create(newUser);
          console.log('✅ RegisterForm: User created in backend');
        } catch (dbError) {
          console.warn('⚠️ RegisterForm: Failed to create user profile in backend:', dbError);
          // Continue anyway - user is authenticated
        }

        // Set user in context
        dispatch({ type: 'SET_USER', payload: newUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        
        toast.success(`${t.welcome}, ${newUser.name}!`);
        
        // Redirect to pricing page to select a plan
        navigate('/pricing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.name}
          </label>
          <div className="relative">
            <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} size={20} />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
              placeholder={t.namePlaceholder}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.email}
          </label>
          <div className="relative">
            <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} size={20} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
              placeholder={t.emailPlaceholder}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.password}
          </label>
          <div className="relative">
            <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-10 pr-12'} py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
              placeholder={t.passwordPlaceholder}
              required
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
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
              placeholder={t.confirmPasswordPlaceholder}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            required
          />
          <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-600 dark:text-gray-400`}>
            {t.agreeTerms}{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              {t.termsOfService}
            </a>{' '}
            {t.and}{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              {t.privacyPolicy}
            </a>
          </span>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon={<UserPlus size={20} />}
        >
          {t.createAccount}
        </Button>
      </form>

      <div className={`mt-6 text-center ${isRTL ? 'rtl' : ''}`}>
        <p className="text-gray-600 dark:text-gray-400">
          {t.alreadyHaveAccount}{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            {t.signIn}
          </button>
        </p>
      </div>
    </motion.div>
  );
}