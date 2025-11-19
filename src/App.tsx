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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading SOLO...
          </p>
        </div>
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