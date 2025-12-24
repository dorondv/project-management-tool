import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { Plus, Edit, Trash2, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  trialDays: number;
  description: string | null;
  validFrom: string;
  validUntil: string | null;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCoupons() {
  const { state } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    trialDays: 30,
    description: '',
    validUntil: '',
    maxUses: '',
    isActive: true,
  });

  useEffect(() => {
    if (!state.user) return;
    fetchCoupons();
  }, [state.user]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getCoupons(state.user!.id);
      setCoupons(data);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const data: any = {
        code: formData.code,
        trialDays: formData.trialDays,
        description: formData.description || undefined,
        isActive: formData.isActive,
      };

      if (formData.validUntil) {
        data.validUntil = formData.validUntil;
      }

      if (formData.maxUses) {
        data.maxUses = parseInt(formData.maxUses);
      }

      await api.admin.createCoupon(data, state.user!.id);
      toast.success('Coupon created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast.error(error.message || 'Failed to create coupon');
    }
  };

  const handleUpdate = async () => {
    if (!editingCoupon) return;

    try {
      const data: any = {
        trialDays: formData.trialDays,
        description: formData.description || undefined,
        isActive: formData.isActive,
      };

      if (formData.validUntil) {
        data.validUntil = formData.validUntil;
      }

      if (formData.maxUses) {
        data.maxUses = parseInt(formData.maxUses);
      }

      await api.admin.updateCoupon(editingCoupon.id, data, state.user!.id);
      toast.success('Coupon updated successfully');
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      toast.error('Failed to update coupon');
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to deactivate this coupon?')) return;

    try {
      await api.admin.deleteCoupon(couponId, state.user!.id);
      toast.success('Coupon deactivated');
      fetchCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to deactivate coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      trialDays: 30,
      description: '',
      validUntil: '',
      maxUses: '',
      isActive: true,
    });
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      trialDays: coupon.trialDays,
      description: coupon.description || '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      maxUses: coupon.maxUses?.toString() || '',
      isActive: coupon.isActive,
    });
    setShowCreateModal(true);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trial Coupons</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage trial coupon codes
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`bg-white dark:bg-gray-800 rounded-lg border ${
              coupon.isActive
                ? 'border-gray-200 dark:border-gray-700'
                : 'border-gray-300 dark:border-gray-600 opacity-60'
            } p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                  {coupon.code}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  coupon.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {coupon.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Trial Days: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {coupon.trialDays}
                </span>
              </div>
              {coupon.description && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Description: </span>
                  <span className="text-gray-900 dark:text-white">{coupon.description}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600 dark:text-gray-400">Uses: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {coupon.currentUses}
                  {coupon.maxUses && ` / ${coupon.maxUses}`}
                </span>
              </div>
              {coupon.validUntil && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Valid Until: </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => openEditModal(coupon)}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                <Edit className="h-4 w-4 inline mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(coupon.id)}
                className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </h2>

            <div className="space-y-4">
              {!editingCoupon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="TRYOUT30"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trial Days *
                </label>
                <input
                  type="number"
                  value={formData.trialDays}
                  onChange={(e) =>
                    setFormData({ ...formData, trialDays: parseInt(e.target.value) || 30 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="30-day trial coupon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid Until (optional)
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Uses (optional)
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  placeholder="Unlimited"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary-500 rounded border-gray-300 dark:border-gray-600"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingCoupon ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {editingCoupon ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

