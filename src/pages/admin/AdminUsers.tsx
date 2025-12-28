import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { UserPlus, Download, Calendar, DollarSign, Gift, X, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  registrationDate: string;
  paymentDate: string | null;
  userStatus: string;
  planType: string | null;
  totalPaid: number;
  couponUsed: boolean;
  discountAmount: number;
  trialEndDate: string | null;
  expirationDate: string | null;
  isFreeAccess: boolean;
  isPayPalTrial?: boolean;
  paypalTrialEndDate?: string | null;
  isTrialCoupon?: boolean;
  subscription: any;
}

export default function AdminUsers() {
  const { state } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showFreeAccessModal, setShowFreeAccessModal] = useState(false);
  const [freeAccessDays, setFreeAccessDays] = useState(30);
  const [freeAccessDate, setFreeAccessDate] = useState('');
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    if (!state.user) return;
    fetchUsers();
  }, [state.user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getUsers(state.user!.id);
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.admin.exportUsers(state.user!.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Users exported successfully');
    } catch (error: any) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const handleGrantFreeAccess = async () => {
    if (!selectedUser || isGrantingAccess) return;

    try {
      setIsGrantingAccess(true);
      const data: any = {};
      if (freeAccessDate) {
        data.endDate = freeAccessDate;
      } else {
        data.days = freeAccessDays;
      }

      await api.admin.grantFreeAccess(selectedUser.id, data, state.user!.id);
      toast.success(`Free access granted to ${selectedUser.email}`);
      setShowFreeAccessModal(false);
      setSelectedUser(null);
      setFreeAccessDays(30);
      setFreeAccessDate('');
      setIsGrantingAccess(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error granting free access:', error);
      toast.error('Failed to grant free access');
      setIsGrantingAccess(false);
    }
  };

  const handleRevokeFreeAccess = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke free access?')) return;

    try {
      await api.admin.revokeFreeAccess(userId, state.user!.id);
      toast.success('Free access revoked');
      fetchUsers();
    } catch (error: any) {
      console.error('Error revoking free access:', error);
      toast.error('Failed to revoke free access');
    }
  };

  const handleRoleEdit = (user: AdminUser) => {
    setEditingRole(user.id);
    setNewRole(user.role);
  };

  const handleRoleCancel = () => {
    setEditingRole(null);
    setNewRole('');
  };

  const handleRoleUpdate = async (userId: string) => {
    if (!newRole || isUpdatingRole) return;

    try {
      setIsUpdatingRole(true);
      await api.admin.updateUserRole(userId, newRole, state.user!.id);
      toast.success('Role updated successfully');
      setEditingRole(null);
      setNewRole('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { color: string; bg: string; label: string }> = {
      admin: {
        color: 'text-red-700 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        label: 'Admin',
      },
      manager: {
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Manager',
      },
      contributor: {
        color: 'text-green-700 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
        label: 'Contributor',
      },
    };

    const badge = badges[role] || {
      color: 'text-gray-700 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      label: role,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ${badge.bg}`}
      >
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; bg: string }> = {
      'Active User (Paid)': {
        color: 'text-green-700 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
      },
      'Free Trial': {
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
      },
      'Churned': {
        color: 'text-red-700 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
      },
      'Free Access': {
        color: 'text-purple-700 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
      },
    };

    const badge = badges[status] || {
      color: 'text-gray-700 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-900/30',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ${badge.bg}`}
      >
        {status}
      </span>
    );
  };

  const getRemainingDays = (expirationDate: string | null): number | null => {
    if (!expirationDate) return null;
    const now = new Date();
    const end = new Date(expirationDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage users, subscriptions, and access permissions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Registration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trial/Free Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRole === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                          disabled={isUpdatingRole}
                        >
                          <option value="contributor">Contributor</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(user.id)}
                          disabled={isUpdatingRole}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                          title="Save"
                        >
                          {isUpdatingRole ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleRoleCancel}
                          disabled={isUpdatingRole}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        <button
                          onClick={() => handleRoleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                          title="Edit role"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.userStatus)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.planType ? (
                      <span className="capitalize">{user.planType}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${user.totalPaid.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.couponUsed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.isPayPalTrial ? (
                      <div>
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                          PayPal Trial Period
                        </div>
                        {(() => {
                          // Try multiple sources for trial end date
                          const trialEndDate = user.paypalTrialEndDate || 
                                             user.subscription?.trialEndDate || 
                                             user.subscription?.endDate ||
                                             user.trialEndDate;
                          
                          if (trialEndDate) {
                            const endDate = new Date(trialEndDate);
                            const remainingDays = getRemainingDays(trialEndDate);
                            
                            return (
                              <div>
                                <div className="text-xs">Ends: {endDate.toLocaleDateString()}</div>
                                {remainingDays !== null && (
                                  remainingDays >= 0 ? (
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      {remainingDays} {remainingDays === 1 ? 'day' : 'days'} left
                                    </div>
                                  ) : (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      Expired {Math.abs(remainingDays)} days ago
                                    </div>
                                  )
                                )}
                              </div>
                            );
                          }
                          
                          return <div className="text-xs text-gray-500">Fetching trial end date...</div>;
                        })()}
                      </div>
                    ) : user.isTrialCoupon && user.expirationDate ? (
                      <div>
                        <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                          Trial Coupon
                        </div>
                        <div className="text-xs">Ends: {new Date(user.expirationDate).toLocaleDateString()}</div>
                        {(() => {
                          const remainingDays = getRemainingDays(user.expirationDate);
                          if (remainingDays === null) return null;
                          if (remainingDays < 0) {
                            return (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Expired {Math.abs(remainingDays)} days ago
                              </div>
                            );
                          }
                          return (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {remainingDays} {remainingDays === 1 ? 'day' : 'days'} left
                            </div>
                          );
                        })()}
                      </div>
                    ) : user.isFreeAccess && user.expirationDate ? (
                      <div>
                        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                          Free Access
                        </div>
                        <div>{new Date(user.expirationDate).toLocaleDateString()}</div>
                        {(() => {
                          const remainingDays = getRemainingDays(user.expirationDate);
                          if (remainingDays === null) return null;
                          if (remainingDays < 0) {
                            return (
                              <div className="text-xs text-red-600 dark:text-red-400">
                                Expired {Math.abs(remainingDays)} days ago
                              </div>
                            );
                          }
                          return (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              {remainingDays} {remainingDays === 1 ? 'day' : 'days'} left
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {/* Only show Grant Access for users without active subscriptions or trials */}
                      {user.userStatus === 'Churned' && !user.isPayPalTrial && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowFreeAccessModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Grant Access
                        </button>
                      )}
                      {/* Show Revoke only for active free access users */}
                      {user.isFreeAccess && user.expirationDate && getRemainingDays(user.expirationDate) !== null && getRemainingDays(user.expirationDate)! >= 0 && (
                        <button
                          onClick={() => handleRevokeFreeAccess(user.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Free Access Modal */}
      {showFreeAccessModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Grant Free Access
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              User: <strong>{selectedUser.email}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  value={freeAccessDays}
                  onChange={(e) => setFreeAccessDays(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
              </div>

              <div className="text-center text-gray-500 dark:text-gray-400">OR</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={freeAccessDate}
                  onChange={(e) => setFreeAccessDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (isGrantingAccess) return; // Prevent closing during loading
                  setShowFreeAccessModal(false);
                  setSelectedUser(null);
                  setFreeAccessDays(30);
                  setFreeAccessDate('');
                  setIsGrantingAccess(false);
                }}
                disabled={isGrantingAccess}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantFreeAccess}
                disabled={isGrantingAccess}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGrantingAccess ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Grant Access'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

