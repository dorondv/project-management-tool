import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { IncomeModal } from '../components/incomes/IncomeModal';
import { Income, Locale } from '../types';
import toast from 'react-hot-toast';

const translations: Record<
  Locale,
  {
    pageTitle: string;
    pageSubtitle: string;
    newIncome: string;
    searchPlaceholder: string;
    metrics: {
      totalIncomes: string;
      beforeVat: string;
      totalVat: string;
      averagePerClient: string;
    };
    empty: {
      title: string;
      subtitle: string;
    };
    incomeList: {
      beforeVat: string;
      client: string;
      date: string;
      edit: string;
      delete: string;
    };
  }
> = {
  en: {
    pageTitle: 'Income Management',
    pageSubtitle: 'Track all your incomes',
    newIncome: 'New Income',
    searchPlaceholder: 'Search incomes...',
    metrics: {
      totalIncomes: 'Total Incomes',
      beforeVat: 'Before VAT',
      totalVat: 'Total VAT',
      averagePerClient: 'Average Income per Client',
    },
    empty: {
      title: 'No incomes',
      subtitle: 'Add your first income',
    },
    incomeList: {
      beforeVat: 'Before VAT',
      client: 'Client',
      date: 'Date',
      edit: 'Edit',
      delete: 'Delete',
    },
  },
  he: {
    pageTitle: 'ניהול הכנסות',
    pageSubtitle: 'עקוב אחר כל ההכנסות שלך',
    newIncome: 'הכנסה חדשה',
    searchPlaceholder: 'חיפוש הכנסות...',
    metrics: {
      totalIncomes: 'סך הכנסות',
      beforeVat: 'לפני מע"מ',
      totalVat: 'סך מע"מ',
      averagePerClient: 'הכנסה ממוצעת ללקוח',
    },
    empty: {
      title: 'אין הכנסות',
      subtitle: 'הוסף את ההכנסה הראשונה שלך',
    },
    incomeList: {
      beforeVat: 'לפני מע"מ',
      client: 'לקוח',
      date: 'תאריך',
      edit: 'עריכה',
      delete: 'מחיקה',
    },
  },
};

function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function Incomes() {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const metrics = useMemo(() => {
    const totalIncomes = state.incomes.reduce((sum, income) => sum + income.finalAmount, 0);
    const beforeVat = state.incomes.reduce((sum, income) => sum + income.amountBeforeVat, 0);
    const totalVat = state.incomes.reduce((sum, income) => sum + income.vatAmount, 0);
    const uniqueClients = new Set(state.incomes.map((income) => income.customerId)).size;
    const averagePerClient = uniqueClients > 0 ? totalIncomes / uniqueClients : 0;

    return {
      totalIncomes,
      beforeVat,
      totalVat,
      averagePerClient,
    };
  }, [state.incomes]);

  const filteredIncomes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return state.incomes;

    return state.incomes.filter((income) => {
      const searchableFields = [
        income.customerName,
        income.invoiceNumber || '',
        income.id,
      ]
        .join(' ')
        .toLowerCase();

      return searchableFields.includes(normalizedQuery);
    });
  }, [state.incomes, searchQuery]);

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setIsModalOpen(true);
  };

  const handleDelete = (incomeId: string) => {
    if (window.confirm(locale === 'he' ? 'האם אתה בטוח שברצונך למחוק הכנסה זו?' : 'Are you sure you want to delete this income?')) {
      dispatch({ type: 'DELETE_INCOME', payload: incomeId });
      toast.success(locale === 'he' ? 'הכנסה נמחקה בהצלחה' : 'Income deleted successfully');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIncome(null);
  };

  const handleNewIncome = () => {
    setEditingIncome(null);
    setIsModalOpen(true);
  };

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const searchIconPosition = isRTL ? 'right-3' : 'left-3';
  const searchPadding = isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between gap-4 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`space-y-1 ${alignStart}`}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.pageTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t.pageSubtitle}</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleNewIncome} className={isRTL ? 'flex-row-reverse' : ''}>
          {t.newIncome}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.totalIncomes}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(metrics.totalIncomes, locale)}
          </p>
          <div className="mt-2">
            <TrendingUp size={20} className="text-primary-500" />
          </div>
        </div>
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.beforeVat}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(metrics.beforeVat, locale)}
          </p>
          <div className="mt-2">
            <DollarSign size={20} className="text-primary-500" />
          </div>
        </div>
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.totalVat}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(metrics.totalVat, locale)}
          </p>
          <div className="mt-2">
            <DollarSign size={20} className="text-primary-500" />
          </div>
        </div>
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${alignStart}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.metrics.averagePerClient}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(metrics.averagePerClient, locale)}
          </p>
          <div className="mt-2">
            <TrendingUp size={20} className="text-primary-500" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 text-gray-400`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full ${searchPadding} py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart}`}
          />
        </div>
      </div>

      {/* Income List */}
      {filteredIncomes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign size={32} className="text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.empty.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t.empty.subtitle}</p>
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleNewIncome} className={isRTL ? 'flex-row-reverse' : ''}>
            {t.newIncome}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncomes.map((income) => (
            <div
              key={income.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 ${alignStart}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(income.finalAmount, locale)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t.incomeList.beforeVat}: {formatCurrency(income.amountBeforeVat, locale)}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => handleEdit(income)}
                    className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    title={t.incomeList.edit}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(income.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title={t.incomeList.delete}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className={`${alignStart} min-w-[200px] ${isRTL ? 'text-left' : 'text-right'}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    #{income.invoiceNumber || income.id} {income.customerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(income.incomeDate, locale)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <IncomeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        income={editingIncome}
      />
    </div>
  );
}

