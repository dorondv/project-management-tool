import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';
import { trackEvent, getFirstTouch } from '../../utils/tracking';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

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
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      continueWithGoogle: 'Continue with Google',
      or: 'or',
      mustAgree: 'You must agree to the Terms of Service and Privacy Policy',
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
      continueWithGoogle: 'המשך עם Google',
      or: 'או',
      mustAgree: 'עליך להסכים לתנאי השירות ולמדיניות הפרטיות',
    },
  };

  const t = translations[locale];

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Track signup_start for Google OAuth
      await trackEvent('signup_start');
      
      // Ensure no trailing slash and exact path
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('🔵 RegisterForm: Initiating Google OAuth');
      console.log('🔵 RegisterForm: Current origin:', window.location.origin);
      console.log('🔵 RegisterForm: RedirectTo URL:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            // Customize the OAuth consent screen
            // Note: The redirect URI shown will still be Supabase's callback URL
            // To show your own domain, configure a custom domain in Supabase (Pro/Team plan required)
            prompt: 'select_account',
          },
        },
      });
      
      if (error) {
        console.error('❌ RegisterForm: Google OAuth error:', error);
        toast.error(error.message || 'Failed to sign in with Google');
        setGoogleLoading(false);
      } else {
        console.log('✅ RegisterForm: Google OAuth initiated successfully');
        // Note: User will be redirected, so we don't set loading to false here
      }
    } catch (error: any) {
      console.error('❌ RegisterForm: Google OAuth exception:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      toast.error(t.mustAgree);
      return;
    }

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
      // Track signup_start event
      await trackEvent('signup_start');

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

        // Get first touch data for user creation
        const firstTouch = getFirstTouch();

        // Create user profile in backend database with marketing data
        const newUser = {
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: 'manager' as const,
          avatar: authData.user.user_metadata?.avatar_url,
          isOnline: true,
          // Marketing fields from first touch
          ...(firstTouch?.utm && {
            utmSource: firstTouch.utm.utm_source,
            utmMedium: firstTouch.utm.utm_medium,
            utmCampaign: firstTouch.utm.utm_campaign,
            utmTerm: firstTouch.utm.utm_term,
            utmContent: firstTouch.utm.utm_content,
          }),
          ...(firstTouch?.referrer && { firstReferrer: firstTouch.referrer }),
          ...(firstTouch?.url && { firstLandingUrl: firstTouch.url }),
          ...(firstTouch?.geo && {
            geoCountry: firstTouch.geo.country,
            geoTz: firstTouch.geo.timezone,
            geoLang: firstTouch.geo.language,
          }),
        };

          // Insert user into backend database
        try {
          const { api } = await import('../../utils/api');
          await api.users.create(newUser);
          console.log('✅ RegisterForm: User created in backend');
          
          // Track signup_complete event with user ID
          await trackEvent('signup_complete', undefined, newUser.id);
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

        <div className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end pr-2' : ''} ${isRTL ? 'w-full' : ''}`}>
          {isRTL ? (
            <>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                {t.agreeTerms}{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  {t.termsOfService}
                </Link>{' '}
                {t.and}{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  {t.privacyPolicy}
                </Link>
              </span>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ml-1"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                required
              />
            </>
          ) : (
            <>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                required
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {t.agreeTerms}{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  {t.termsOfService}
                </Link>{' '}
                {t.and}{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  {t.privacyPolicy}
                </Link>
              </span>
            </>
          )}
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

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {t.or}
          </span>
        </div>
      </div>

      {/* Google Sign In Button */}
      <Button
        type="button"
        variant="outline"
        fullWidth
        loading={googleLoading}
        onClick={handleGoogleSignIn}
        icon={<GoogleIcon />}
        className="flex items-center justify-center gap-3"
      >
        {t.continueWithGoogle}
      </Button>

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