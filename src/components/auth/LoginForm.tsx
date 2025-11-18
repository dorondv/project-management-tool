import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
                role: 'contributor' as const,
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
            role: 'contributor' as const,
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
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome Back
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Sign in to your SOLO account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </span>
          </label>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon={<LogIn size={20} />}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            Sign up
          </button>
        </p>
      </div>

    </motion.div>
  );
}