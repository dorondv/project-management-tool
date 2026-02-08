import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { BarChart3, Users, TrendingUp, DollarSign, Eye, UserPlus, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface MarketingMetrics {
  pageviews: number;
  signupStarts: number;
  signupCompletes: number;
  leadSubmits: number;
  purchases: number;
  conversionRate: number;
  signupRate: number;
  totalRevenue: number;
}

interface MarketingUser {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  cancelDate: string | null;
  tenureMonths: number;
  hasPurchase: boolean;
  purchaseAmount: number;
  revenueTotal: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  geoCountry: string | null;
  firstLandingUrl: string | null;
  userStatus: string;
}

interface BreakdownItem {
  [key: string]: string | number;
  pageviews: number;
  signupStarts: number;
  signupCompletes: number;
  leadSubmits: number;
  purchases: number;
  totalRevenue: number;
  conversionRate: number;
}

export default function AdminMarketingAnalytics() {
  const { state } = useApp();
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [users, setUsers] = useState<MarketingUser[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [breakdownGroupBy, setBreakdownGroupBy] = useState<'utmSource' | 'utmCampaign' | 'country'>('utmSource');
  const [filters, setFilters] = useState({
    utmSource: '',
    utmCampaign: '',
    country: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!state.user) return;
    fetchData();
  }, [state.user, filters, breakdownGroupBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsData, usersData, breakdownData] = await Promise.all([
        api.admin.getMarketingAnalytics(state.user!.id, filters),
        api.admin.getMarketingUsers(state.user!.id),
        api.admin.getMarketingBreakdown(state.user!.id, breakdownGroupBy),
      ]);
      
      setMetrics(metricsData.metrics);
      setUsers(usersData);
      setBreakdown(breakdownData);
    } catch (error: any) {
      console.error('Error fetching marketing analytics:', error);
      toast.error('Failed to load marketing analytics');
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
      a.download = `marketing-users-export-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track conversions, UTM sources, and geographic data
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Download className="h-5 w-5" />
          Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              UTM Source
            </label>
            <input
              type="text"
              value={filters.utmSource}
              onChange={(e) => setFilters({ ...filters, utmSource: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., google"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              UTM Campaign
            </label>
            <input
              type="text"
              value={filters.utmCampaign}
              onChange={(e) => setFilters({ ...filters, utmCampaign: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., summer2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <input
              type="text"
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., IL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pageviews</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.pageviews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Signups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.signupCompletes.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.conversionRate.toFixed(2)}% conversion</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Purchases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.purchases.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${metrics.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Breakdown</h2>
          <select
            value={breakdownGroupBy}
            onChange={(e) => setBreakdownGroupBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="utmSource">By UTM Source</option>
            <option value="utmCampaign">By UTM Campaign</option>
            <option value="country">By Country</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {breakdownGroupBy === 'utmSource' ? 'UTM Source' : breakdownGroupBy === 'utmCampaign' ? 'UTM Campaign' : 'Country'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pageviews</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Signup Starts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Signups</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Leads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conversion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {breakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item[breakdownGroupBy] || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.pageviews}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.signupStarts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.signupCompletes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.leadSubmits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.purchases}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.conversionRate.toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${item.totalRevenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users with Marketing Data</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Registration Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cancel Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenure (Months)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purchase Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue Total (LTV)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">UTM Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.cancelDate ? new Date(user.cancelDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.tenureMonths}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${user.purchaseAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${user.revenueTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.utmSource || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.geoCountry || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.userStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
