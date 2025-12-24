import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { Users, CreditCard, Gift, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  freeSubscriptions: number;
  totalRevenue: number;
}

interface PaymentStats {
  totalPayments: number;
  paidPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalRevenue: number;
  totalRefunded: number;
  netRevenue: number;
}

export default function AdminDashboard() {
  const { state } = useApp();
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const [subStats, payStats] = await Promise.all([
          api.admin.getSubscriptionStats(state.user.id),
          api.admin.getPaymentStats(state.user.id),
        ]);
        setSubscriptionStats(subStats);
        setPaymentStats(payStats);
      } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [state.user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Subscriptions',
      value: subscriptionStats?.totalSubscriptions || 0,
      icon: CreditCard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Active Subscriptions',
      value: subscriptionStats?.activeSubscriptions || 0,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Revenue',
      value: `$${(paymentStats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Net Revenue',
      value: `$${(paymentStats?.netRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Trial Subscriptions',
      value: subscriptionStats?.trialSubscriptions || 0,
      icon: Gift,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Cancelled',
      value: subscriptionStats?.cancelledSubscriptions || 0,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Overview of subscriptions, payments, and user activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <Icon className={`h-12 w-12 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Payments:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {paymentStats?.totalPayments || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Paid:</span>
              <span className="font-medium text-green-600">
                {paymentStats?.paidPayments || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Failed:</span>
              <span className="font-medium text-red-600">
                {paymentStats?.failedPayments || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Refunded:</span>
              <span className="font-medium text-orange-600">
                {paymentStats?.refundedPayments || 0}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Total Refunded:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${(paymentStats?.totalRefunded || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Subscription Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Active Paid:</span>
              <span className="font-medium text-green-600">
                {subscriptionStats?.activeSubscriptions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Free Access:</span>
              <span className="font-medium text-blue-600">
                {subscriptionStats?.freeSubscriptions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Trials:</span>
              <span className="font-medium text-orange-600">
                {subscriptionStats?.trialSubscriptions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cancelled:</span>
              <span className="font-medium text-red-600">
                {subscriptionStats?.cancelledSubscriptions || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

