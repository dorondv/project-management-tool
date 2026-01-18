import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

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

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const { dispatch, state } = useApp();
  const locale = state.locale || 'en';
  const isRTL = locale === 'he';
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const translations = {
    en: {
      welcome: 'Welcome Back',
      subtitle: 'Sign in to your SOLLO account',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign In',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      continueWithGoogle: 'Continue with Google',
      or: 'or',
    },
    he: {
      welcome: 'ברוך הבא',
      subtitle: 'ברוך הבא ל SOLLO',
      email: 'כתובת אימייל',
      emailPlaceholder: 'הכנס את כתובת האימייל שלך',
      password: 'סיסמה',
      passwordPlaceholder: 'הכנס את הסיסמה שלך',
      rememberMe: 'זכור אותי',
      forgotPassword: 'שכחת סיסמה?',
      signIn: 'התחבר',
      noAccount: 'אין לך חשבון?',
      signUp: 'הירשם',
      continueWithGoogle: 'המשך עם Google',
      or: 'או',
    },
  };

  const t = translations[locale as 'en' | 'he'];

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Ensure no trailing slash and exact path
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('🔵 LoginForm: Initiating Google OAuth');
      console.log('🔵 LoginForm: Current origin:', window.location.origin);
      console.log('🔵 LoginForm: RedirectTo URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        console.error('❌ LoginForm: Google OAuth error:', error);
        toast.error(error.message || 'Failed to sign in with Google');
        setGoogleLoading(false);
      } else {
        console.log('✅ LoginForm: Google OAuth initiated successfully');
        // Note: User will be redirected, so we don't set loading to false here
      }
    } catch (error: any) {
      console.error('❌ LoginForm: Google OAuth exception:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 LoginForm: handleSubmit called');
    setLoading(true);

    try {
      console.log('🔵 LoginForm: Attempting to sign in with email:', formData.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      console.log('🔵 LoginForm: Sign in response:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        error: error?.message 
      });

      if (error) {
        console.error('❌ LoginForm: Sign in error:', error);
        
        // Handle specific Supabase errors with better messages
        let errorMessage = error.message || 'Invalid email or password';
        if (error.message === 'Email not confirmed') {
          errorMessage = 'Please check your email and confirm your account before logging in. If you need to resend the confirmation email, please sign up again or contact support.';
        } else if (error.message === 'Invalid login credentials') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        }
        
        toast.error(errorMessage, { duration: 6000 });
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        console.log('✅ LoginForm: Sign in successful, user ID:', data.user.id);
        // The auth state listener will handle setting the user
        // But we'll also set it here to ensure immediate UI update
        try {
          console.log('🔵 LoginForm: Fetching user profile from backend...');
          const { api } = await import('../../utils/api');
          
          let userProfile = null;
          try {
            // Try to get user by ID from backend
            userProfile = await api.users.getById(data.user.id);
            console.log('✅ LoginForm: User found in backend');
          } catch (apiError: any) {
            // User doesn't exist in backend, create it
            if (apiError.status === 404) {
              console.log('🔵 LoginForm: User not found in backend, creating...');
              const newUser = {
                id: data.user.id,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                email: data.user.email || '',
                role: 'manager' as const,
                avatar: data.user.user_metadata?.avatar_url,
                isOnline: true,
              };
              
              try {
                userProfile = await api.users.create(newUser);
                console.log('✅ LoginForm: User created in backend');
              } catch (createError) {
                console.warn('⚠️ LoginForm: Failed to create user in backend:', createError);
                // Use the newUser object anyway
                userProfile = newUser;
              }
            } else {
              throw apiError;
            }
          }

          if (userProfile) {
            const user = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
              avatar: userProfile.avatar,
              isOnline: true,
            };
            console.log('✅ LoginForm: Dispatching SET_USER:', user);
            dispatch({ type: 'SET_USER', payload: user });
            dispatch({ type: 'SET_AUTHENTICATED', payload: true });
            toast.success(`Welcome back, ${user.name}!`);
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('✅ LoginForm: Login complete');
          }
        } catch (err) {
          console.error('❌ LoginForm: Error setting user after login:', err);
          // Still set basic user info from auth data
          const fallbackUser = {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: 'manager' as const,
            avatar: data.user.user_metadata?.avatar_url,
            isOnline: true,
          };
          console.log('⚠️ LoginForm: Using fallback user, dispatching SET_USER:', fallbackUser);
          dispatch({ type: 'SET_USER', payload: fallbackUser });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
          toast.success(`Welcome back, ${fallbackUser.name}!`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        console.error('❌ LoginForm: Login failed: No session created');
        toast.error('Login failed: No session created');
      }
    } catch (error: any) {
      console.error('❌ LoginForm: Unexpected error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      console.log('🔵 LoginForm: Setting loading to false');
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
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t.welcome}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-600 dark:text-gray-400`}>
              {t.rememberMe}
            </span>
          </label>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {t.forgotPassword}
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon={<LogIn size={20} />}
        >
          {t.signIn}
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
          {t.noAccount}{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            {t.signUp}
          </button>
        </p>
      </div>

    </motion.div>
  );
}