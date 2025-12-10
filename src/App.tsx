import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AuthPage } from './components/auth/AuthPage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
// Team feature hidden for current version - keep for future use
// import Team from './pages/Team';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import Customers from './pages/Customers';
import Timer from './pages/Timer';
import Incomes from './pages/Incomes';
import Pricing from './pages/Pricing';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { state } = useApp();

  console.log('🟡 AppContent: Render check:', { 
    loading: state.loading, 
    hasUser: !!state.user, 
    userId: state.user?.id,
    isAuthenticated: state.isAuthenticated 
  });

  if (state.loading) {
    console.log('🟡 AppContent: Showing loading screen');
    const isHebrew = state.locale === 'he';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <img 
              src="/assets/png/solo transparent.png" 
              alt="SOLO" 
              className="h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== `${window.location.origin}/assets/png/solo logo wide.png`) {
                  target.src = '/assets/png/solo logo wide.png';
                }
              }}
            />
          </div>

          {/* Animated Loader */}
          <div className="mb-6 flex justify-center">
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
          </div>

          {/* Loading Text */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isHebrew ? 'טוען נתונים...' : 'Loading Data...'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isHebrew 
              ? 'אנא המתן בזמן שאנחנו מכינים את המערכת שלך'
              : 'Please wait while we prepare your workspace'
            }
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-pulse"
              style={{
                animation: 'loading-bar 2s ease-in-out infinite',
                width: '70%'
              }}
            />
          </div>

          {/* Loading Tips */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            {isHebrew 
              ? 'טוען פרויקטים, משימות ונתונים...'
              : 'Loading projects, tasks, and data...'
            }
          </p>
        </div>

        <style>{`
          @keyframes loading-bar {
            0%, 100% { width: 30%; margin-left: 0; }
            50% { width: 70%; margin-left: 30%; }
          }
        `}</style>
      </div>
    );
  }

  if (!state.user) {
    console.log('🟡 AppContent: No user found, showing AuthPage');
    return <AuthPage />;
  }

  console.log('🟡 AppContent: User found, showing main app');

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/timer" element={<Timer />} />
          {/* Team feature hidden for current version - keep for future use */}
          {/* <Route path="/team" element={<Team />} /> */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/incomes" element={<Incomes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
        }}
      />
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;