import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useMemo } from 'react';
import { DollarSign } from 'lucide-react';
import { Locale, Currency } from '../../types';
import { getCurrencySymbol } from '../../utils/currencyUtils';

const translations = {
  en: {
    title: 'Income Distribution by Customer',
    noData: 'No income data to display',
    income: 'Income',
  },
  he: {
    title: 'התפלגות הכנסות לפי לקוח',
    noData: 'אין נתוני הכנסות להצגה',
    income: 'הכנסה',
  },
  es: {
    title: 'Distribucion de ingresos por cliente',
    noData: 'No hay datos de ingresos para mostrar',
    income: 'Ingresos',
  },
  de: {
    title: 'Einnahmenverteilung nach Kunde',
    noData: 'Keine Einnahmendaten zur Anzeige',
    income: 'Einnahmen',
  },
  pt: {
    title: 'Distribuicao de receitas por cliente',
    noData: 'Sem dados de receita para exibir',
    income: 'Receita',
  },
  fr: {
    title: 'Repartition des revenus par client',
    noData: 'Aucune donnee de revenu a afficher',
    income: 'Revenus',
  },
} as const;

const COLORS = [
  '#FF0083', '#6366F1', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
];

interface IncomeByCustomerChartProps {
  dateRange?: { start: Date; end: Date };
}

export function IncomeByCustomerChart({ dateRange }: IncomeByCustomerChartProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const currencySymbol = getCurrencySymbol(currency);
  const isRTL = locale === 'he';
  const t = translations[locale] ?? translations.en;

  const chartData = useMemo(() => {
    const entries = dateRange
      ? state.timeEntries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entryDate >= dateRange.start && entryDate <= dateRange.end;
        })
      : state.timeEntries;

    const incomes = dateRange
      ? state.incomes.filter(income => {
          const incomeDate = new Date(income.incomeDate);
          return incomeDate >= dateRange.start && incomeDate <= dateRange.end;
        })
      : state.incomes;

    const customerIncomeMap: Record<string, { name: string; income: number }> = {};

    entries.forEach((entry) => {
      const customer = state.customers.find(c => c.id === entry.customerId);
      if (!customer) return;
      if (!customerIncomeMap[entry.customerId]) {
        customerIncomeMap[entry.customerId] = { name: customer.name, income: 0 };
      }
      customerIncomeMap[entry.customerId].income += entry.income;
    });

    incomes.forEach((income) => {
      const customer = state.customers.find(c => c.id === income.customerId);
      if (!customer) return;
      if (!customerIncomeMap[income.customerId]) {
        customerIncomeMap[income.customerId] = { name: customer.name, income: 0 };
      }
      customerIncomeMap[income.customerId].income += income.finalAmount;
    });

    return Object.values(customerIncomeMap)
      .filter(item => item.income > 0)
      .sort((a, b) => b.income - a.income)
      .slice(0, 10);
  }, [state.timeEntries, state.incomes, state.customers, dateRange]);

  const totalIncome = useMemo(() => chartData.reduce((sum, d) => sum + d.income, 0), [chartData]);

  const hasData = chartData.length > 0 && chartData.some(d => d.income > 0);

  const renderLabel = ({ name, income, cx, x, y, midAngle }: any) => {
    const percent = totalIncome > 0 ? ((income / totalIncome) * 100).toFixed(1) : '0';
    const textAnchor = midAngle > 90 && midAngle < 270 ? 'end' : 'start';
    return (
      <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fontSize={11} fill="currentColor">
        {name} ({percent}%)
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <DollarSign size={20} className={isRTL ? "text-pink-500 dark:text-pink-300" : "text-primary-500 dark:text-primary-300"} />
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.title}
        </h3>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="income"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={renderLabel}
              labelLine={true}
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderRadius: '0.5rem',
                border: '1px solid #ddd',
                color: 'inherit',
              }}
              formatter={(value: number) => {
                const percent = totalIncome > 0 ? ((value / totalIncome) * 100).toFixed(1) : '0';
                return [`${currencySymbol}${Math.round(value).toLocaleString()} (${percent}%)`, t.income];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
          <p className={isRTL ? 'text-right' : 'text-left'}>{t.noData}</p>
        </div>
      )}
    </div>
  );
}
