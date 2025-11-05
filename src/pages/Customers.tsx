import { useMemo, useState } from 'react';
import { LayoutGrid, LayoutList, Plus, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CustomerStatus, PaymentMethod, BillingModel, PaymentFrequency, Locale } from '../types';

type ViewMode = 'list' | 'grid';
type StatusFilter = 'all' | CustomerStatus;

const statusVariants: Record<CustomerStatus, 'success' | 'warning' | 'secondary' | 'error'> = {
  active: 'success',
  trial: 'warning',
  paused: 'secondary',
  churned: 'error',
};

const statusLabels: Record<Locale, Record<CustomerStatus, string>> = {
  en: {
    active: 'Active',
    trial: 'Trial',
    paused: 'Paused',
    churned: 'Churned',
  },
  he: {
    active: 'פעיל',
    trial: 'בפיילוט',
    paused: 'מושהה',
    churned: 'בוטל',
  },
};

const paymentMethodLabels: Record<Locale, Record<PaymentMethod, string>> = {
  en: {
    'bank-transfer': 'Bank Transfer',
    'credit-card': 'Credit Card',
    'direct-debit': 'Direct Debit',
    cash: 'Cash',
  },
  he: {
    'bank-transfer': 'העברה בנקאית',
    'credit-card': 'כרטיס אשראי',
    'direct-debit': 'הוראת קבע',
    cash: 'מזומן',
  },
};

const billingModelLabels: Record<Locale, Record<BillingModel, string>> = {
  en: {
    retainer: 'Retainer',
    hourly: 'Hourly',
    project: 'Project-based',
  },
  he: {
    retainer: 'ריטיינר',
    hourly: 'שעתי',
    project: 'פרויקטלי',
  },
};

const billingCycleLabels: Record<Locale, Record<PaymentFrequency, string>> = {
  en: {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  },
  he: {
    monthly: 'חודשי',
    quarterly: 'רבעוני',
    annual: 'שנתי',
  },
};

const statusFilterLabels: Record<Locale, Record<StatusFilter, string>> = {
  en: {
    all: 'All statuses',
    active: 'Active',
    trial: 'Trial',
    paused: 'Paused',
    churned: 'Churned',
  },
  he: {
    all: 'כל הסטטוסים',
    active: 'פעיל',
    trial: 'בפיילוט',
    paused: 'מושהה',
    churned: 'בוטל',
  },
};

const statusFilterOrder: StatusFilter[] = ['all', 'active', 'trial', 'paused', 'churned'];

const translations: Record<
  Locale,
  {
    pageTitle: string;
    pageSubtitle: string;
    newCustomer: string;
    metrics: {
      totalCustomers: string;
      activeCustomers: string;
      monthlyRecurring: string;
    };
    filters: {
      searchPlaceholder: string;
    };
    table: {
      customerName: string;
      status: string;
      joinDate: string;
      tenure: string;
      customerScore: string;
      taxId: string;
      country: string;
      paymentMethod: string;
      billingModel: string;
      billingCycle: string;
      annualFee: string;
      monthlyRetainer: string;
      hoursPerMonth: string;
      referralSource: string;
      details: string;
      noResults: string;
      referralFallback: string;
    };
    grid: {
      industryFallback: string;
      tenureLabel: string;
      tenureUnit: string;
      monthlyRetainerLabel: string;
      scoreLabel: string;
      detailsButton: string;
      empty: string;
    };
  }
> = {
  en: {
    pageTitle: 'Customer Management',
    pageSubtitle: 'All of your customers in one place',
    newCustomer: 'New Customer',
    metrics: {
      totalCustomers: 'Total Customers',
      activeCustomers: 'Active Customers',
      monthlyRecurring: 'Monthly Retainer Revenue',
    },
    filters: {
      searchPlaceholder: 'Search customer by name, tax ID, or email',
    },
    table: {
      customerName: 'Customer Name',
      status: 'Status',
      joinDate: 'Join Date',
      tenure: 'Tenure (months)',
      customerScore: 'Customer Score',
      taxId: 'Tax ID / VAT',
      country: 'Country',
      paymentMethod: 'Payment Method',
      billingModel: 'Billing Model',
      billingCycle: 'Billing Cycle',
      annualFee: 'Annual Fee',
      monthlyRetainer: 'Monthly Retainer',
      hoursPerMonth: 'Hours / Month',
      referralSource: 'Lead Source',
      details: 'Details',
      noResults: 'No matching customers found',
      referralFallback: '—',
    },
    grid: {
      industryFallback: 'Industry not specified',
      tenureLabel: 'Tenure',
      tenureUnit: 'months',
      monthlyRetainerLabel: 'Monthly Retainer',
      scoreLabel: 'Score',
      detailsButton: 'Customer Details',
      empty: 'No customers to display',
    },
  },
  he: {
    pageTitle: 'ניהול לקוחות',
    pageSubtitle: 'כל הלקוחות שלך במקום אחד',
    newCustomer: 'לקוח חדש',
    metrics: {
      totalCustomers: 'סה"כ לקוחות',
      activeCustomers: 'לקוחות פעילים',
      monthlyRecurring: 'הכנסה חודשית מריטיינר',
    },
    filters: {
      searchPlaceholder: 'חיפוש לקוח לפי שם, ח"פ או אימייל',
    },
    table: {
      customerName: 'שם הלקוח',
      status: 'סטטוס',
      joinDate: 'תאריך הצטרפות',
      tenure: 'וותק בחודשים',
      customerScore: 'Score לקוח',
      taxId: 'ח"פ / ע.מ.',
      country: 'מדינה',
      paymentMethod: 'אופן תשלום',
      billingModel: 'מודל חיוב',
      billingCycle: 'מחזור חיוב',
      annualFee: 'תעריף שנתי',
      monthlyRetainer: 'ריטיינר חודשי',
      hoursPerMonth: 'שעות לחודש',
      referralSource: 'מקור הגעה',
      details: 'פרטים',
      noResults: 'לא נמצאו לקוחות תואמים לחיפוש',
      referralFallback: '—',
    },
    grid: {
      industryFallback: 'לא צוין תחום',
      tenureLabel: 'וותק',
      tenureUnit: 'חודשים',
      monthlyRetainerLabel: 'ריטיינר חודשי',
      scoreLabel: 'Score',
      detailsButton: 'פרטי לקוח',
      empty: 'לא נמצאו לקוחות תואמים להצגה',
    },
  },
};

function calculateTenureMonths(joinDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - joinDate.getTime();
  const months = diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  return Math.max(0, parseFloat(months.toFixed(1)));
}

function formatCurrency(amount: number, currency: string, locale: Locale) {
  if (!amount) {
    return '—';
  }

  if (currency === '₪') {
    return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (currency === '$') {
    return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return `${currency}${amount.toLocaleString(locale === 'he' ? 'he-IL' : 'en-US')}`;
}

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US');
}

interface CustomersMetrics {
  total: number;
  active: number;
  monthlyRecurring: number;
}

export default function Customers() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const metrics = useMemo<CustomersMetrics>(() => {
    const total = state.customers.length;
    const active = state.customers.filter((customer) => customer.status === 'active').length;
    const monthlyRecurring = state.customers.reduce((sum, customer) => sum + (customer.monthlyRetainer || 0), 0);

    return { total, active, monthlyRecurring };
  }, [state.customers]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return state.customers.filter((customer) => {
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      const searchableFields = [
        customer.name,
        customer.contactName,
        customer.contactEmail,
        customer.contactPhone,
        customer.country,
        customer.taxId,
        customer.referralSource || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchableFields.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [state.customers, statusFilter, searchQuery]);

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const searchIconPosition = isRTL ? 'right-3' : 'left-3';
  const searchPadding = isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3';
  const selectAlign = isRTL ? 'text-right' : 'text-left';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className={`text-2xl font-bold text-gray-900 dark:text-white ${alignStart}`}>{t.pageTitle}</h1>
          <p className={`text-gray-600 dark:text-gray-400 ${alignStart}`}>{t.pageSubtitle}</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>
          {t.newCustomer}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.totalCustomers}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.total}</p>
        </div>
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.activeCustomers}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.active}</p>
        </div>
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.monthlyRecurring}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.monthlyRecurring, '₪', locale)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
        <div className={`flex flex-wrap items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'border-gray-200 text-gray-500 hover:border-primary-200 hover:text-primary-500'
              }`}
            >
              <LayoutList size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'border-gray-200 text-gray-500 hover:border-primary-200 hover:text-primary-500'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3 justify-end min-w-[240px]">
            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 text-gray-400`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.filters.searchPlaceholder}
                className={`w-full ${searchPadding} py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className={`w-40 py-2 px-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectAlign}`}
            >
              {statusFilterOrder.map((option) => (
                <option key={option} value={option}>
                  {statusFilterLabels[locale][option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${alignStart}`}>
              <thead className="bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.customerName}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.status}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.joinDate}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.tenure}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.customerScore}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.taxId}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.country}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.paymentMethod}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.billingModel}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.billingCycle}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.annualFee}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.monthlyRetainer}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.hoursPerMonth}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.referralSource}
                  </th>
                  <th scope="col" className={`px-4 py-3 font-semibold ${alignStart}`}>
                    {t.table.details}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {filteredCustomers.map((customer) => {
                  const tenure = calculateTenureMonths(customer.joinDate);
                  const statusVariant = statusVariants[customer.status];
                  const statusLabel = statusLabels[locale][customer.status];

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className={`px-4 py-4 ${alignStart}`}>
                        <div className="font-semibold text-gray-900 dark:text-white">{customer.name}</div>
                        <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-0.5 ${alignStart}`}>
                          <span>{customer.contactEmail}</span>
                          <span>{customer.contactPhone}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-4 ${alignStart}`}>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {formatDate(customer.joinDate, locale)}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>{tenure}</td>
                      <td className={`px-4 py-4 text-gray-900 dark:text-white font-semibold ${alignStart}`}>
                        {customer.customerScore}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>{customer.taxId}</td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>{customer.country}</td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {paymentMethodLabels[locale][customer.paymentMethod]}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {billingModelLabels[locale][customer.billingModel]}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {billingCycleLabels[locale][customer.billingCycle]}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {formatCurrency(customer.annualFee, customer.currency, locale)}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {formatCurrency(customer.monthlyRetainer, customer.currency, locale)}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {customer.hoursPerMonth}
                      </td>
                      <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                        {customer.referralSource || t.table.referralFallback}
                      </td>
                      <td className={`px-4 py-4 ${alignStart}`}>
                        <Button variant="outline" size="sm">
                          {t.table.details}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                      {t.table.noResults}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const tenure = calculateTenureMonths(customer.joinDate);
            const statusVariant = statusVariants[customer.status];
            const statusLabel = statusLabels[locale][customer.status];

            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={alignStart}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {customer.industry || t.grid.industryFallback}
                    </p>
                  </div>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>

                <div className={`mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200 ${alignStart}`}>
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-500 dark:text-gray-400">{t.table.joinDate}</span>
                    <span>{formatDate(customer.joinDate, locale)}</span>
                  </div>
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-500 dark:text-gray-400">{t.grid.tenureLabel}</span>
                    <span>
                      {tenure} {t.grid.tenureUnit}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-500 dark:text-gray-400">{t.grid.monthlyRetainerLabel}</span>
                    <span>{formatCurrency(customer.monthlyRetainer, customer.currency, locale)}</span>
                  </div>
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-500 dark:text-gray-400">{t.grid.scoreLabel}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{customer.customerScore}</span>
                  </div>
                </div>

                <Button className="mt-5 w-full" variant="outline">
                  {t.grid.detailsButton}
                </Button>
              </div>
            );
          })}
          {filteredCustomers.length === 0 && (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
              {t.grid.empty}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

