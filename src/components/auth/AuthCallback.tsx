import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('OAuth callback error:', sessionError);
          setError(sessionError.message || 'Failed to complete sign in');
          setTimeout(() => {
            navigate('/');
          }, 3000);
          return;
        }

        if (session && session.user) {
          // Session is automatically set by Supabase
          // The auth state listener in AppContext will handle user profile creation
          // Wait a moment for the auth state to update, then redirect
          console.log('✅ AuthCallback: Session found, waiting for auth state update...');
          
          // Give the auth listener in AppContext time to process the session
          // and create/fetch the user profile (typically takes 1-2 seconds)
          // Redirect to landing page - ProtectedRoute will handle redirecting to dashboard
          // if user has active subscription
          setTimeout(() => {
            console.log('✅ AuthCallback: Redirecting to landing page');
            navigate('/landing');
          }, 2000);
        } else {
          // No session found, redirect to login
          console.log('⚠️ AuthCallback: No session found, redirecting to login');
          setError('No session found. Please try again.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setError(error.message || 'An error occurred during sign in');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {error ? error : 'Completing sign in...'}
        </p>
        {error && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Redirecting to login page...
          </p>
        )}
      </div>
    </div>
  );
}
