import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, Calendar as CalendarIcon, Users } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfDay, endOfDay, format } from 'date-fns';
import { he, es, de, ptBR } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { IncomeModal } from '../components/incomes/IncomeModal';
import { Income, Locale, Currency } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import toast from 'react-hot-toast';

const translations: Record<
  Locale,
  {
    pageTitle: string;
    pageSubtitle: string;
    newIncome: string;
    searchPlaceholder: string;
    customerFilter: {
      label: string;
      all: string;
    };
    periodSelector: {
      currentMonth: string;
      lastMonth: string;
      currentYear: string;
      lastYear: string;
      custom: string;
      startDate: string;
      endDate: string;
    };
    metrics: {
      activeCustomers: string;
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
    customerFilter: {
      label: 'Customer',
      all: 'All Customers',
    },
    periodSelector: {
      currentMonth: 'This Month',
      lastMonth: 'Last Month',
      currentYear: 'This Year',
      lastYear: 'Last Year',
      custom: 'Custom Range',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    metrics: {
      activeCustomers: 'Total Active Customers',
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
    customerFilter: {
      label: 'לקוח',
      all: 'כל הלקוחות',
    },
    periodSelector: {
      currentMonth: 'החודש הנוכחי',
      lastMonth: 'החודש הקודם',
      currentYear: 'השנה הנוכחית',
      lastYear: 'השנה הקודמת',
      custom: 'טווח מותאם אישית',
      startDate: 'תאריך התחלה',
      endDate: 'תאריך סיום',
    },
    metrics: {
      activeCustomers: 'סה"כ לקוחות פעילים',
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
  es: {
    pageTitle: 'Gestion de ingresos',
    pageSubtitle: 'Haz seguimiento de todos tus ingresos',
    newIncome: 'Nuevo ingreso',
    searchPlaceholder: 'Buscar ingresos...',
    customerFilter: { label: 'Cliente', all: 'Todos los clientes' },
    periodSelector: {
      currentMonth: 'Este mes',
      lastMonth: 'Mes pasado',
      currentYear: 'Este anio',
      lastYear: 'Anio pasado',
      custom: 'Rango personalizado',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de fin',
    },
    metrics: {
      activeCustomers: 'Total de clientes activos',
      totalIncomes: 'Ingresos totales',
      beforeVat: 'Antes de IVA',
      totalVat: 'IVA total',
      averagePerClient: 'Ingreso promedio por cliente',
    },
    empty: { title: 'Sin ingresos', subtitle: 'Agrega tu primer ingreso' },
    incomeList: { beforeVat: 'Antes de IVA', client: 'Cliente', date: 'Fecha', edit: 'Editar', delete: 'Eliminar' },
  },
  de: {
    pageTitle: 'Einnahmenverwaltung',
    pageSubtitle: 'Verfolge alle deine Einnahmen',
    newIncome: 'Neue Einnahme',
    searchPlaceholder: 'Einnahmen suchen...',
    customerFilter: { label: 'Kunde', all: 'Alle Kunden' },
    periodSelector: {
      currentMonth: 'Dieser Monat',
      lastMonth: 'Letzter Monat',
      currentYear: 'Dieses Jahr',
      lastYear: 'Letztes Jahr',
      custom: 'Benutzerdefinierter Zeitraum',
      startDate: 'Startdatum',
      endDate: 'Enddatum',
    },
    metrics: {
      activeCustomers: 'Aktive Kunden gesamt',
      totalIncomes: 'Gesamteinnahmen',
      beforeVat: 'Vor MwSt.',
      totalVat: 'MwSt. gesamt',
      averagePerClient: 'Durchschnitt pro Kunde',
    },
    empty: { title: 'Keine Einnahmen', subtitle: 'Fuege deine erste Einnahme hinzu' },
    incomeList: { beforeVat: 'Vor MwSt.', client: 'Kunde', date: 'Datum', edit: 'Bearbeiten', delete: 'Loeschen' },
  },
  pt: {
    pageTitle: 'Gestao de receitas',
    pageSubtitle: 'Acompanhe todas as suas receitas',
    newIncome: 'Nova receita',
    searchPlaceholder: 'Buscar receitas...',
    customerFilter: { label: 'Cliente', all: 'Todos os clientes' },
    periodSelector: {
      currentMonth: 'Este mes',
      lastMonth: 'Mes passado',
      currentYear: 'Este ano',
      lastYear: 'Ano passado',
      custom: 'Periodo personalizado',
      startDate: 'Data de inicio',
      endDate: 'Data de fim',
    },
    metrics: {
      activeCustomers: 'Total de clientes ativos',
      totalIncomes: 'Receitas totais',
      beforeVat: 'Antes do IVA',
      totalVat: 'IVA total',
      averagePerClient: 'Receita media por cliente',
    },
    empty: { title: 'Sem receitas', subtitle: 'Adicione sua primeira receita' },
    incomeList: { beforeVat: 'Antes do IVA', client: 'Cliente', date: 'Data', edit: 'Editar', delete: 'Excluir' },
  },
  fr: {
    pageTitle: 'Gestion des revenus',
    pageSubtitle: 'Suivez tous vos revenus',
    newIncome: 'Nouveau revenu',
    searchPlaceholder: 'Rechercher des revenus...',
    customerFilter: { label: 'Client', all: 'Tous les clients' },
    periodSelector: {
      currentMonth: 'Ce mois-ci',
      lastMonth: 'Mois precedent',
      currentYear: 'Cette annee',
      lastYear: 'Annee precedente',
      custom: 'Plage personnalisee',
      startDate: 'Date de debut',
      endDate: 'Date de fin',
    },
    metrics: {
      activeCustomers: 'Total des clients actifs',
      totalIncomes: 'Revenus totaux',
      beforeVat: 'Avant TVA',
      totalVat: 'TVA totale',
      averagePerClient: 'Revenu moyen par client',
    },
    empty: { title: 'Aucun revenu', subtitle: 'Ajoutez votre premier revenu' },
    incomeList: { beforeVat: 'Avant TVA', client: 'Client', date: 'Date', edit: 'Modifier', delete: 'Supprimer' },
  },
};

function formatDate(date: Date, locale: Locale): string {
  const intlLocale = locale === 'he' ? 'he-IL' : locale === 'es' ? 'es-ES' : locale === 'de' ? 'de-DE' : locale === 'pt' ? 'pt-PT' : locale === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function Incomes() {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const isRTL = locale === 'he';
  const t = translations[locale] ?? translations.en;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  
  // Period selection state
  const [period, setPeriod] = useState<'currentMonth' | 'lastMonth' | 'currentYear' | 'lastYear' | 'custom'>('currentMonth');
  const [customRange, setCustomRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'currentYear':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'lastYear':
        const lastYear = subYears(now, 1);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
      case 'custom':
        return { start: startOfDay(customRange.from), end: endOfDay(customRange.to) };
      case 'currentMonth':
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  // Get previous period date range for comparison
  const getPreviousPeriodRange = () => {
    const { start, end } = getDateRange();
    const duration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - duration - 1),
      end: new Date(start.getTime() - 1),
    };
  };

  const { start, end } = getDateRange();
  const previousPeriod = getPreviousPeriodRange();

  // Filter incomes by date range
  const filteredIncomes = useMemo(() => {
    return state.incomes.filter(income => {
      const incomeDate = new Date(income.incomeDate);
      const matchesDate = incomeDate >= start && incomeDate <= end;
      const matchesCustomer = customerFilter === 'all' || income.customerId === customerFilter || income.customerName === customerFilter;
      return matchesDate && matchesCustomer;
    });
  }, [state.incomes, start, end, customerFilter]);

  // Filter incomes for previous period
  const previousPeriodIncomes = useMemo(() => {
    return state.incomes.filter(income => {
      const incomeDate = new Date(income.incomeDate);
      const matchesDate = incomeDate >= previousPeriod.start && incomeDate <= previousPeriod.end;
      const matchesCustomer = customerFilter === 'all' || income.customerId === customerFilter || income.customerName === customerFilter;
      return matchesDate && matchesCustomer;
    });
  }, [state.incomes, previousPeriod.start, previousPeriod.end, customerFilter]);

  // Calculate active customers in the period
  const activeCustomers = useMemo(() => {
    const customerIds = new Set(filteredIncomes.map(income => income.customerId));
    return state.customers.filter(c => c.status === 'active' && customerIds.has(c.id)).length;
  }, [filteredIncomes, state.customers]);

  const previousActiveCustomers = useMemo(() => {
    const customerIds = new Set(previousPeriodIncomes.map(income => income.customerId));
    return state.customers.filter(c => c.status === 'active' && customerIds.has(c.id)).length;
  }, [previousPeriodIncomes, state.customers]);

  const metrics = useMemo(() => {
    const totalIncomes = filteredIncomes.reduce((sum, income) => sum + income.finalAmount, 0);
    const beforeVat = filteredIncomes.reduce((sum, income) => sum + income.amountBeforeVat, 0);
    const totalVat = filteredIncomes.reduce((sum, income) => sum + income.vatAmount, 0);
    const uniqueClients = new Set(filteredIncomes.map((income) => income.customerId)).size;
    const averagePerClient = uniqueClients > 0 ? totalIncomes / uniqueClients : 0;

    // Previous period metrics
    const prevTotalIncomes = previousPeriodIncomes.reduce((sum, income) => sum + income.finalAmount, 0);
    const prevBeforeVat = previousPeriodIncomes.reduce((sum, income) => sum + income.amountBeforeVat, 0);
    const prevTotalVat = previousPeriodIncomes.reduce((sum, income) => sum + income.vatAmount, 0);
    const prevUniqueClients = new Set(previousPeriodIncomes.map((income) => income.customerId)).size;
    const prevAveragePerClient = prevUniqueClients > 0 ? prevTotalIncomes / prevUniqueClients : 0;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      activeCustomers: {
        current: activeCustomers,
        previous: previousActiveCustomers,
        change: calculateChange(activeCustomers, previousActiveCustomers),
      },
      totalIncomes: {
        current: totalIncomes,
        previous: prevTotalIncomes,
        change: calculateChange(totalIncomes, prevTotalIncomes),
      },
      beforeVat: {
        current: beforeVat,
        previous: prevBeforeVat,
        change: calculateChange(beforeVat, prevBeforeVat),
      },
      totalVat: {
        current: totalVat,
        previous: prevTotalVat,
        change: calculateChange(totalVat, prevTotalVat),
      },
      averagePerClient: {
        current: averagePerClient,
        previous: prevAveragePerClient,
        change: calculateChange(averagePerClient, prevAveragePerClient),
      },
    };
  }, [filteredIncomes, previousPeriodIncomes, activeCustomers, previousActiveCustomers]);

  // Apply search filter to already filtered incomes
  const searchFilteredIncomes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return filteredIncomes;

    return filteredIncomes.filter((income) => {
      const searchableFields = [
        income.customerName,
        income.invoiceNumber || '',
        income.id,
      ]
        .join(' ')
        .toLowerCase();

      return searchableFields.includes(normalizedQuery);
    });
  }, [filteredIncomes, searchQuery]);

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className={`text-2xl font-bold text-gray-900 dark:text-white ${alignStart}`}>{t.pageTitle}</h1>
          <p className={`text-gray-600 dark:text-gray-400 ${alignStart}`}>{t.pageSubtitle}</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />}
          onClick={handleNewIncome}
        >
          {t.newIncome}
        </Button>
      </div>

      {/* Period Selection */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className={`w-[180px] h-12 px-3 py-2 ${isRTL ? 'pr-8 pl-8' : 'pr-8'} bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${isRTL ? 'text-right' : 'text-left'} appearance-none`}
          >
            <option value="currentMonth">{t.periodSelector.currentMonth}</option>
            <option value="lastMonth">{t.periodSelector.lastMonth}</option>
            <option value="currentYear">{t.periodSelector.currentYear}</option>
            <option value="lastYear">{t.periodSelector.lastYear}</option>
            <option value="custom">{t.periodSelector.custom}</option>
          </select>
          <CalendarIcon className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
        </div>

        {/* Customer Filter */}
        <div className="relative">
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className={`w-[220px] h-12 px-3 py-2 ${isRTL ? 'pr-8 pl-8' : 'pr-8'} bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${isRTL ? 'text-right' : 'text-left'} appearance-none`}
          >
            <option value="all">{t.customerFilter.all}</option>
            {state.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <Users className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
        </div>

        {period === 'custom' && (
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="date"
                value={format(customRange.from, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : startOfMonth(new Date());
                  setCustomRange(prev => ({ ...prev, from: date }));
                }}
                className={`w-[180px] h-12 px-3 py-2 ${isRTL ? 'pr-8 pl-8' : 'pr-8'} bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              <CalendarIcon className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
            </div>
            <div className="relative">
              <input
                type="date"
                value={format(customRange.to, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : endOfMonth(new Date());
                  setCustomRange(prev => ({ ...prev, to: date }));
                }}
                className={`w-[180px] h-12 px-3 py-2 ${isRTL ? 'pr-8 pl-8' : 'pr-8'} bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${isRTL ? 'text-right' : 'text-left'}`}
              />
              <CalendarIcon className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Active Customers */}
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm ${alignStart}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.metrics.activeCustomers}</p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {metrics.activeCustomers.current}
              </p>
              {metrics.activeCustomers.previous > 0 && (
                <p className={`text-xs mt-1 ${metrics.activeCustomers.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.activeCustomers.change >= 0 ? '↑' : '↓'} {Math.abs(metrics.activeCustomers.change).toFixed(1)}%
                </p>
              )}
            </div>
            <Users size={48} className="text-pink-600 dark:text-pink-400 opacity-20" />
          </div>
        </div>
        {/* Total Incomes */}
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm ${alignStart}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.metrics.totalIncomes}</p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {formatCurrency(metrics.totalIncomes.current, currency, locale)}
              </p>
              {metrics.totalIncomes.previous > 0 && (
                <p className={`text-xs mt-1 ${metrics.totalIncomes.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.totalIncomes.change >= 0 ? '↑' : '↓'} {Math.abs(metrics.totalIncomes.change).toFixed(1)}%
                </p>
              )}
            </div>
            <TrendingUp size={48} className="text-pink-600 dark:text-pink-400 opacity-20" />
          </div>
        </div>
        {/* Before VAT */}
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm ${alignStart}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.metrics.beforeVat}</p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {formatCurrency(metrics.beforeVat.current, currency, locale)}
              </p>
              {metrics.beforeVat.previous > 0 && (
                <p className={`text-xs mt-1 ${metrics.beforeVat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.beforeVat.change >= 0 ? '↑' : '↓'} {Math.abs(metrics.beforeVat.change).toFixed(1)}%
                </p>
              )}
            </div>
            <DollarSign size={48} className="text-pink-600 dark:text-pink-400 opacity-20" />
          </div>
        </div>
        {/* Total VAT */}
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm ${alignStart}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.metrics.totalVat}</p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {formatCurrency(metrics.totalVat.current, currency, locale)}
              </p>
              {metrics.totalVat.previous > 0 && (
                <p className={`text-xs mt-1 ${metrics.totalVat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.totalVat.change >= 0 ? '↑' : '↓'} {Math.abs(metrics.totalVat.change).toFixed(1)}%
                </p>
              )}
            </div>
            <DollarSign size={48} className="text-pink-600 dark:text-pink-400 opacity-20" />
          </div>
        </div>
        {/* Average Per Client */}
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm ${alignStart}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.metrics.averagePerClient}</p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {formatCurrency(metrics.averagePerClient.current, currency, locale)}
              </p>
              {metrics.averagePerClient.previous > 0 && (
                <p className={`text-xs mt-1 ${metrics.averagePerClient.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.averagePerClient.change >= 0 ? '↑' : '↓'} {Math.abs(metrics.averagePerClient.change).toFixed(1)}%
                </p>
              )}
            </div>
            <TrendingUp size={48} className="text-pink-600 dark:text-pink-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {/* <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            size={18}
            className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 text-gray-400`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full ${searchPadding} py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
          />
        </div>
      </div> */}

      {/* Income List */}
      {searchFilteredIncomes.length === 0 ? (
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
        <div className="grid gap-4">
          {searchFilteredIncomes.map((income) => (
            <div
              key={income.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                {/* Customer info section - appears on right in RTL, left in LTR */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {income.invoiceNumber && (
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          #{income.invoiceNumber}
                        </h3>
                      )}
                      <p className="text-gray-900 dark:text-white font-medium">
                        {income.customerName}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(income.incomeDate, locale)}
                    </p>
                  </div>
                </div>

                {/* Amount and actions section - appears on left in RTL, right in LTR */}
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(income.finalAmount, currency, locale)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t.incomeList.beforeVat}: {formatCurrency(income.amountBeforeVat, currency, locale)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(income)}
                      className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={t.incomeList.edit}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={t.incomeList.delete}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
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

