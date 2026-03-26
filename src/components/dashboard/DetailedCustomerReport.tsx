import { useState, useMemo } from 'react';
import { Calculator, ArrowUpDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Locale, Customer, Currency } from '../../types';
import { Badge } from '../common/Badge';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { getCurrencySymbol } from '../../utils/currencyUtils';
import { storage } from '../../utils/localStorage';
import { CustomerScoreSettings, sanitizeCustomerScoreSettings } from '../../utils/customerScoreSettings';
import {
  calculateCustomerScore,
  getScoreBadgeColor,
  getCustomerMonthlyIncome,
  getCustomerHourlyRate,
  getCustomerSeniority,
  getReferralsCount,
} from '../../utils/customerScore';

const translations: Record<Locale, {
  title: string;
  columns: {
    client: string;
    score: string;
    monthlyIncome: string;
    hourlyRate: string;
    seniority: string;
    referralsCount: string;
    totalRevenue: string;
    referredRevenue: string;
    hours: string;
    revenue: string;
    avgHourly: string;
    avgDaily: string;
  };
  paymentMethods: {
    hourly: string;
    retainer: string;
    project: string;
  };
  scoreTooltip: {
    title: string;
    monthlyIncome: string;
    hourlyRate: string;
    seniority: string;
    referralsCount: string;
    totalRevenue: string;
    referredRevenue: string;
  };
  totals: string;
  noData: string;
}> = {
  en: {
    title: 'Active Customers Report',
    columns: {
      client: 'Client',
      score: 'Score',
      monthlyIncome: 'Monthly Income',
      hourlyRate: 'Hourly Rate',
      seniority: 'Seniority (Months)',
      referralsCount: 'Referrals',
      totalRevenue: 'Total Revenue',
      referredRevenue: 'Revenue from Referrals',
      hours: 'Work Hours (Period)',
      revenue: 'Revenue (Period)',
      avgHourly: 'Avg Income/Hour (Period)',
      avgDaily: 'Avg Daily Work Hours (Period)',
    },
    paymentMethods: {
      hourly: 'Hourly',
      retainer: 'Retainer',
      project: 'Project',
    },
    scoreTooltip: {
      title: 'Client Score Details (All Time):',
      monthlyIncome: 'Monthly Income:',
      hourlyRate: 'Hourly Rate:',
      seniority: 'Seniority (Months):',
      referralsCount: 'Referrals Brought:',
      totalRevenue: 'Total Revenue:',
      referredRevenue: 'Revenue from Referrals:',
    },
    totals: 'Total',
    noData: 'No customer data available',
  },
  he: {
    title: 'דוח לקוחות פעילים',
    columns: {
      client: 'לקוח',
      score: 'Score',
      monthlyIncome: 'הכנסה חודשית',
      hourlyRate: 'שכר שעתי',
      seniority: 'ותק חודשים',
      referralsCount: 'הפניות',
      totalRevenue: 'סה"כ הכנסות',
      referredRevenue: 'הכנסה מהפניות',
      hours: 'שעות עבודה (בתקופה)',
      revenue: 'הכנסות (בתקופה)',
      avgHourly: 'הכנסה ממוצע לשעה (בתקופה)',
      avgDaily: 'ממוצע שעות עבודה יומי (בתקופה)',
    },
    paymentMethods: {
      hourly: 'שעתי',
      retainer: 'ריטיינר',
      project: 'פרויקט',
    },
    scoreTooltip: {
      title: 'פירוט Score לקוח (כל הזמנים):',
      monthlyIncome: 'הכנסה חודשית:',
      hourlyRate: 'שכר שעתי:',
      seniority: 'ותק (חודשים):',
      referralsCount: 'הפניות שהביא:',
      totalRevenue: 'סה"כ הכנסות:',
      referredRevenue: 'הכנסה מהפניות:',
    },
    totals: 'סה"כ',
    noData: 'אין נתוני לקוחות זמינים',
  },
  es: {
    title: 'Informe de clientes activos',
    columns: {
      client: 'Cliente',
      score: 'Score',
      monthlyIncome: 'Ingreso mensual',
      hourlyRate: 'Tarifa por hora',
      seniority: 'Antiguedad (meses)',
      referralsCount: 'Referidos',
      totalRevenue: 'Ingresos totales',
      referredRevenue: 'Ingresos por referidos',
      hours: 'Horas trabajadas (periodo)',
      revenue: 'Ingresos (periodo)',
      avgHourly: 'Ingreso prom./hora (periodo)',
      avgDaily: 'Horas prom./dia (periodo)',
    },
    paymentMethods: {
      hourly: 'Por hora',
      retainer: 'Retenedor',
      project: 'Proyecto',
    },
    scoreTooltip: {
      title: 'Detalle de score del cliente (todo el tiempo):',
      monthlyIncome: 'Ingreso mensual:',
      hourlyRate: 'Tarifa por hora:',
      seniority: 'Antiguedad (meses):',
      referralsCount: 'Referidos aportados:',
      totalRevenue: 'Ingresos totales:',
      referredRevenue: 'Ingresos por referidos:',
    },
    totals: 'Totales',
    noData: 'No hay datos de clientes disponibles',
  },
  de: {
    title: 'Bericht ueber aktive Kunden',
    columns: {
      client: 'Kunde',
      score: 'Score',
      monthlyIncome: 'Monatliches Einkommen',
      hourlyRate: 'Stundensatz',
      seniority: 'Betriebszugehoerigkeit (Monate)',
      referralsCount: 'Empfehlungen',
      totalRevenue: 'Gesamtumsatz',
      referredRevenue: 'Umsatz aus Empfehlungen',
      hours: 'Arbeitsstunden (Zeitraum)',
      revenue: 'Umsatz (Zeitraum)',
      avgHourly: 'Durchschn. Einkommen/Std. (Zeitraum)',
      avgDaily: 'Durchschn. Tagesstunden (Zeitraum)',
    },
    paymentMethods: {
      hourly: 'Stundenbasiert',
      retainer: 'Retainer',
      project: 'Projekt',
    },
    scoreTooltip: {
      title: 'Kunden-Score Details (Gesamtzeit):',
      monthlyIncome: 'Monatliches Einkommen:',
      hourlyRate: 'Stundensatz:',
      seniority: 'Betriebszugehoerigkeit (Monate):',
      referralsCount: 'Gewonnene Empfehlungen:',
      totalRevenue: 'Gesamtumsatz:',
      referredRevenue: 'Umsatz aus Empfehlungen:',
    },
    totals: 'Gesamt',
    noData: 'Keine Kundendaten verfuegbar',
  },
  pt: {
    title: 'Relatorio de clientes ativos',
    columns: {
      client: 'Cliente',
      score: 'Score',
      monthlyIncome: 'Receita mensal',
      hourlyRate: 'Valor por hora',
      seniority: 'Tempo de casa (meses)',
      referralsCount: 'Indicacoes',
      totalRevenue: 'Receita total',
      referredRevenue: 'Receita de indicacoes',
      hours: 'Horas trabalhadas (periodo)',
      revenue: 'Receita (periodo)',
      avgHourly: 'Receita media/hora (periodo)',
      avgDaily: 'Horas medias por dia (periodo)',
    },
    paymentMethods: {
      hourly: 'Por hora',
      retainer: 'Retainer',
      project: 'Projeto',
    },
    scoreTooltip: {
      title: 'Detalhes do score do cliente (todo periodo):',
      monthlyIncome: 'Receita mensal:',
      hourlyRate: 'Valor por hora:',
      seniority: 'Tempo de casa (meses):',
      referralsCount: 'Indicacoes trazidas:',
      totalRevenue: 'Receita total:',
      referredRevenue: 'Receita de indicacoes:',
    },
    totals: 'Total',
    noData: 'Nenhum dado de cliente disponivel',
  },
  fr: {
    title: 'Rapport des clients actifs',
    columns: {
      client: 'Client',
      score: 'Score',
      monthlyIncome: 'Revenu mensuel',
      hourlyRate: 'Taux horaire',
      seniority: 'Anciennete (mois)',
      referralsCount: 'Parrainages',
      totalRevenue: 'Revenu total',
      referredRevenue: 'Revenu des parrainages',
      hours: 'Heures de travail (periode)',
      revenue: 'Revenus (periode)',
      avgHourly: 'Revenu moy./heure (periode)',
      avgDaily: 'Heures moy./jour (periode)',
    },
    paymentMethods: {
      hourly: 'Horaire',
      retainer: 'Forfait',
      project: 'Project',
    },
    scoreTooltip: {
      title: 'Details du score client (tout le temps) :',
      monthlyIncome: 'Revenu mensuel :',
      hourlyRate: 'Taux horaire :',
      seniority: 'Anciennete (mois) :',
      referralsCount: 'Parrainages apportes :',
      totalRevenue: 'Revenu total :',
      referredRevenue: 'Revenu des parrainages :',
    },
    totals: 'Total',
    noData: 'Aucune donnee client disponible',
  },
};

interface ClientStat {
  customer: Customer;
  score: string;
  scoreMetrics: {
    monthlyIncome: number;
    hourlyRate: number;
    seniority: number;
    referralsCount: number;
    totalRevenue: number;
    referredRevenue: number;
  };
  workedHours: number;
  receivedPayments: number;
  timeEntryIncome: number;
  avgHourlyRate: number;
}


interface DetailedCustomerReportProps {
  dateRange?: { start: Date; end: Date };
}

export function DetailedCustomerReport({ dateRange }: DetailedCustomerReportProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const currencySymbol = getCurrencySymbol(currency);
  const isRTL = locale === 'he';
  const t = translations[locale] ?? translations.en;
  const customerScoreSettings = useMemo(
    () => sanitizeCustomerScoreSettings(
      storage.get<CustomerScoreSettings>('customerScoreSettings'),
    ),
    [],
  );
  
  const [sortBy, setSortBy] = useState<string>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const periodStart = useMemo(() => dateRange?.start ?? startOfMonth(new Date()), [dateRange]);
  const periodEnd = useMemo(() => dateRange?.end ?? endOfMonth(new Date()), [dateRange]);
  const daysInPeriod = useMemo(() => Math.max(1, differenceInDays(periodEnd, periodStart) + 1), [periodStart, periodEnd]);

  const clientStats = useMemo<ClientStat[]>(() => {
    const stats: ClientStat[] = [];

    const activeCustomers = state.customers.filter(customer => customer.status === 'active');

    activeCustomers.forEach(customer => {
      const periodTimeEntries = state.timeEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= periodStart && entryDate <= periodEnd && entry.customerId === customer.id;
      });

      const periodIncomes = state.incomes.filter(income => {
        const incomeDate = new Date(income.incomeDate);
        return incomeDate >= periodStart && incomeDate <= periodEnd && income.customerId === customer.id;
      });

      const workedHours = periodTimeEntries.reduce((sum, entry) => sum + (entry.duration / 3600), 0);
      const periodTimeEntryIncome = periodTimeEntries.reduce((sum, entry) => sum + entry.income, 0);
      const periodIncomeAmount = periodIncomes.reduce((sum, income) => sum + income.amountBeforeVat, 0);
      const receivedPayments = periodTimeEntryIncome + periodIncomeAmount;

      const referredCustomers = state.customers.filter(c =>
        c.referralSource?.startsWith('client_referral:') && c.referralSource.split(':')[1] === customer.id
      );
      const periodReferredRevenue = referredCustomers.reduce((sum, rc) => {
        const rcTimeRevenue = state.timeEntries
          .filter(e => {
            const d = new Date(e.startTime);
            return d >= periodStart && d <= periodEnd && e.customerId === rc.id;
          })
          .reduce((s, e) => s + e.income, 0);
        const rcIncomeRevenue = state.incomes
          .filter(inc => {
            const d = new Date(inc.incomeDate);
            return d >= periodStart && d <= periodEnd && inc.customerId === rc.id;
          })
          .reduce((s, inc) => s + inc.amountBeforeVat, 0);
        return sum + rcTimeRevenue + rcIncomeRevenue;
      }, 0);

      const scoreMetrics = {
        monthlyIncome: getCustomerMonthlyIncome(customer),
        hourlyRate: getCustomerHourlyRate(customer),
        seniority: getCustomerSeniority(customer),
        referralsCount: getReferralsCount(customer.id, state.customers),
        totalRevenue: receivedPayments,
        referredRevenue: periodReferredRevenue,
      };

      const avgHourlyRate = workedHours > 0 ? periodTimeEntryIncome / workedHours : 0;

      stats.push({
        customer,
        score: calculateCustomerScore(
          customer,
          state.customers,
          state.timeEntries,
          state.incomes,
          customerScoreSettings,
        ),
        scoreMetrics,
        workedHours,
        receivedPayments,
        timeEntryIncome: periodTimeEntryIncome,
        avgHourlyRate,
      });
    });

    return stats;
  }, [state.customers, state.timeEntries, state.incomes, periodStart, periodEnd, customerScoreSettings]);

  const sortedStats = useMemo(() => {
    const sorted = [...clientStats];
    sorted.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch(sortBy) {
        case 'client':
          aValue = a.customer.name;
          bValue = b.customer.name;
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'monthlyIncome':
          aValue = a.scoreMetrics.monthlyIncome;
          bValue = b.scoreMetrics.monthlyIncome;
          break;
        case 'hourlyRate':
          aValue = a.scoreMetrics.hourlyRate;
          bValue = b.scoreMetrics.hourlyRate;
          break;
        case 'seniority':
          aValue = a.scoreMetrics.seniority;
          bValue = b.scoreMetrics.seniority;
          break;
        case 'referralsCount':
          aValue = a.scoreMetrics.referralsCount;
          bValue = b.scoreMetrics.referralsCount;
          break;
        case 'totalRevenue':
          aValue = a.scoreMetrics.totalRevenue;
          bValue = b.scoreMetrics.totalRevenue;
          break;
        case 'referredRevenue':
          aValue = a.scoreMetrics.referredRevenue;
          bValue = b.scoreMetrics.referredRevenue;
          break;
        case 'hours':
          aValue = a.workedHours;
          bValue = b.workedHours;
          break;
        case 'revenue':
          aValue = a.receivedPayments;
          bValue = b.receivedPayments;
          break;
        case 'avg_hourly':
          aValue = a.avgHourlyRate;
          bValue = b.avgHourlyRate;
          break;
        case 'avg_daily':
          aValue = daysInPeriod > 0 ? a.workedHours / daysInPeriod : 0;
          bValue = daysInPeriod > 0 ? b.workedHours / daysInPeriod : 0;
          break;
        default:
          aValue = a.receivedPayments;
          bValue = b.receivedPayments;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      const numA = typeof aValue === 'number' ? aValue : 0;
      const numB = typeof bValue === 'number' ? bValue : 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [clientStats, sortBy, sortOrder, daysInPeriod]);

  const totals = useMemo(() => {
    return {
      monthlyIncome: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.monthlyIncome, 0),
      referralsCount: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.referralsCount, 0),
      totalRevenue: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.totalRevenue, 0),
      referredRevenue: clientStats.reduce((sum, stat) => sum + stat.scoreMetrics.referredRevenue, 0),
      hours: clientStats.reduce((sum, stat) => sum + stat.workedHours, 0),
      revenue: clientStats.reduce((sum, stat) => sum + stat.receivedPayments, 0),
      timeEntryIncome: clientStats.reduce((sum, stat) => sum + stat.timeEntryIncome, 0),
    };
  }, [clientStats]);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('desc');
    }
  };

  const SortableHeader = ({ children, columnKey }: { children: React.ReactNode; columnKey: string }) => (
    <button
      onClick={() => handleSort(columnKey)}
      className={`w-full flex items-center justify-center gap-2 hover:text-blue-600 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      {children}
      <ArrowUpDown
        className={`h-4 w-4 transition-transform ${
          sortBy === columnKey && sortOrder === 'asc' ? 'rotate-180' : ''
        } ${sortBy === columnKey ? 'text-blue-600' : 'text-gray-400'}`}
      />
    </button>
  );

  const getPaymentMethodLabel = (method: string) => {
    switch(method) {
      case 'hourly': return t.paymentMethods.hourly;
      case 'retainer': return t.paymentMethods.retainer;
      case 'project': return t.paymentMethods.project;
      default: return method;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={20} className="text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.title}
        </h3>
      </div>

      {clientStats.length === 0 ? (
        <div className="text-center py-8">
          <p className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.noData}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className={`px-4 py-3 text-sm font-bold border-b ${isRTL ? 'text-right' : 'text-left'}`}>
                  <SortableHeader columnKey="client">{t.columns.client}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="score">{t.columns.score}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="monthlyIncome">{t.columns.monthlyIncome}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="hourlyRate">{t.columns.hourlyRate}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="seniority">{t.columns.seniority}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="referralsCount">{t.columns.referralsCount}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="totalRevenue">{t.columns.totalRevenue}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="referredRevenue">{t.columns.referredRevenue}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="hours">{t.columns.hours}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="revenue">{t.columns.revenue}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="avg_hourly">{t.columns.avgHourly}</SortableHeader>
                </th>
                <th className="px-4 py-3 text-sm font-bold text-center border-b">
                  <SortableHeader columnKey="avg_daily">{t.columns.avgDaily}</SortableHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat) => {
                const dailyAvgHours = daysInPeriod > 0 ? stat.workedHours / daysInPeriod : 0;
                
                return (
                  <tr key={stat.customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b">
                    <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{stat.customer.name}</p>
                        {stat.customer.contactName && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.customer.contactName}</p>
                        )}
                        <Badge variant="default" className="mt-1 text-xs">
                          {getPaymentMethodLabel(stat.customer.billingModel)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(stat.score)}`}>
                        {stat.score}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {stat.customer.billingModel === 'retainer'
                        ? `${currencySymbol}${stat.scoreMetrics.monthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {stat.customer.billingModel === 'hourly'
                        ? `${currencySymbol}${stat.scoreMetrics.hourlyRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {stat.scoreMetrics.seniority.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {stat.scoreMetrics.referralsCount}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {currencySymbol}{stat.scoreMetrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                      {currencySymbol}{stat.scoreMetrics.referredRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">{stat.workedHours.toFixed(1)}h</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">
                        {currencySymbol}{stat.receivedPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">
                        {currencySymbol}{stat.avgHourlyRate.toFixed(0)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="font-medium text-gray-600 dark:text-gray-300">
                        {dailyAvgHours.toFixed(1)}h
                      </p>
                    </td>
                  </tr>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold border-t-2">
                <td className={`px-4 py-3 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t.totals}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.monthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {totals.referralsCount}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.referredRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {totals.hours.toFixed(1)}h
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {currencySymbol}{totals.hours > 0 ? (totals.timeEntryIncome / totals.hours).toFixed(0) : 0}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                  {(daysInPeriod > 0 ? totals.hours / daysInPeriod : 0).toFixed(1)}h
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
