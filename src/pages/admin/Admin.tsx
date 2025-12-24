import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Gift, DollarSign } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminSubscriptions from './AdminSubscriptions';
import AdminCoupons from './AdminCoupons';
import AdminPayments from './AdminPayments';
import { AdminRoute } from '../../components/admin/AdminRoute';

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { path: '/admin/coupons', label: 'Coupons', icon: Gift },
  { path: '/admin/payments', label: 'Payments', icon: DollarSign },
];

export default function Admin() {
  const location = useLocation();

  return (
    <AdminRoute>
      <div className="flex h-full">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Management</p>
          </div>
          <nav className="p-4 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Content */}
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/coupons" element={<AdminCoupons />} />
            <Route path="/payments" element={<AdminPayments />} />
          </Routes>
        </div>
      </div>
    </AdminRoute>
  );
}

