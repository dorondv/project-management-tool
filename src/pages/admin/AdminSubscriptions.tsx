import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { XCircle, PlayCircle, PauseCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  userId: string;
  planType: string;
  status: string;
  paypalSubscriptionId: string | null;
  paypalPlanId: string | null;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  price: number;
  currency: string;
  isPayPalTrial?: boolean;
  billingHistory?: any[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminSubscriptions() {
  const { state } = useApp();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!state.user) return;
    fetchSubscriptions();
  }, [state.user]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getSubscriptions(state.user!.id);
      setSubscriptions(data);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscription: Subscription) => {
    if (!confirm(`Cancel subscription for ${subscription.user.email}?`)) return;

    try {
      setActionLoading(subscription.id);
      await api.admin.cancelSubscription(subscription.id, 'Cancelled by admin', state.user!.id);
      toast.success('Subscription cancelled');
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (subscription: Subscription) => {
    if (!confirm(`Suspend subscription for ${subscription.user.email}?`)) return;

    try {
      setActionLoading(subscription.id);
      await api.admin.suspendSubscription(subscription.id, 'Suspended by admin', state.user!.id);
      toast.success('Subscription suspended');
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error suspending subscription:', error);
      toast.error('Failed to suspend subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (subscription: Subscription) => {
    if (!confirm(`Activate subscription for ${subscription.user.email}?`)) return;

    try {
      setActionLoading(subscription.id);
      await api.admin.activateSubscription(subscription.id, 'Activated by admin', state.user!.id);
      toast.success('Subscription activated');
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error activating subscription:', error);
      
      // Show more helpful error message
      const errorMessage = error.response?.data?.details || error.message || 'Failed to activate subscription';
      const suggestion = error.response?.data?.suggestion;
      
      if (suggestion) {
        toast.error(`${errorMessage}. ${suggestion}`, { duration: 6000 });
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const canActivate = (subscription: Subscription) => {
    // Only allow activating suspended subscriptions
    // Cancelled subscriptions cannot be reactivated in PayPal
    return subscription.status === 'suspended';
  };

  const getStatusBadge = (subscription: Subscription) => {
    // Check if it's a PayPal trial period
    if (subscription.isPayPalTrial) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30">
          Trial Period
        </span>
      );
    }

    const badges: Record<string, { color: string; bg: string; label: string }> = {
      active: {
        color: 'text-green-700 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        label: 'Active',
      },
      cancelled: {
        color: 'text-red-700 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        label: 'Cancelled',
      },
      suspended: {
        color: 'text-orange-700 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        label: 'Suspended',
      },
      expired: {
        color: 'text-gray-700 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        label: 'Expired',
      },
      trialing: {
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Trialing',
      },
    };

    const badge = badges[subscription.status] || {
      color: 'text-gray-700 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      label: subscription.status,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ${badge.bg}`}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage user subscriptions and billing
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trial Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PayPal ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {subscription.user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {subscription.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{subscription.planType}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(subscription)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${subscription.price.toFixed(2)} {subscription.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {subscription.endDate
                      ? new Date(subscription.endDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {subscription.isPayPalTrial ? (
                      <div>
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                          PayPal Trial
                        </div>
                        {(() => {
                          const trialEndDate = subscription.trialEndDate || subscription.endDate;
                          if (trialEndDate) {
                            const endDate = new Date(trialEndDate);
                            const now = new Date();
                            const diffTime = endDate.getTime() - now.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            return (
                              <div>
                                <div className="text-xs">
                                  Ends: {endDate.toLocaleDateString()}
                                </div>
                                {diffDays >= 0 ? (
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    {diffDays} {diffDays === 1 ? 'day' : 'days'} left
                                  </div>
                                ) : (
                                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Expired {Math.abs(diffDays)} days ago
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return <div className="text-xs text-gray-400">No end date</div>;
                        })()}
                        {subscription.billingHistory && subscription.billingHistory.length === 0 && (
                          <div className="text-xs text-gray-500 mt-1">No payments yet</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {subscription.paypalSubscriptionId || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {subscription.paypalSubscriptionId && (
                        <>
                          {subscription.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleSuspend(subscription)}
                                disabled={actionLoading === subscription.id}
                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 disabled:opacity-50"
                                title="Suspend"
                              >
                                <PauseCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleCancel(subscription)}
                                disabled={actionLoading === subscription.id}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                title="Cancel"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {canActivate(subscription) && (
                            <button
                              onClick={() => handleActivate(subscription)}
                              disabled={actionLoading === subscription.id}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                              title="Activate (Only suspended subscriptions can be reactivated)"
                            >
                              <PlayCircle className="h-5 w-5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

