import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
} as const;

interface IncomeByCustomerChartProps {
  dateRange?: { start: Date; end: Date };
}

export function IncomeByCustomerChart({ dateRange }: IncomeByCustomerChartProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const currencySymbol = getCurrencySymbol(currency);
  const isRTL = locale === 'he';
  const t = translations[locale];

  const chartData = useMemo(() => {
    // Filter time entries and incomes by date range if provided
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

    // Group income by customer from both time entries and income records
    const customerIncomeMap: Record<string, { name: string; income: number }> = {};

    // Process time entries
    entries.forEach((entry) => {
      const customer = state.customers.find(c => c.id === entry.customerId);
      if (!customer) return;

      if (!customerIncomeMap[entry.customerId]) {
        customerIncomeMap[entry.customerId] = {
          name: customer.name,
          income: 0,
        };
      }

      customerIncomeMap[entry.customerId].income += entry.income;
    });

    // Process income records
    incomes.forEach((income) => {
      const customer = state.customers.find(c => c.id === income.customerId);
      if (!customer) return;

      if (!customerIncomeMap[income.customerId]) {
        customerIncomeMap[income.customerId] = {
          name: customer.name,
          income: 0,
        };
      }

      customerIncomeMap[income.customerId].income += income.finalAmount;
    });

    // Convert to array and filter out customers with 0 income
    return Object.values(customerIncomeMap)
      .filter(item => item.income > 0)
      .sort((a, b) => b.income - a.income)
      .slice(0, 10); // Limit to top 10 customers
  }, [state.timeEntries, state.incomes, state.customers, dateRange]);

  // Helper function to truncate long names
  const truncateName = (name: string, maxLength: number = 12): string => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const hasData = chartData.length > 0 && chartData.some(d => d.income > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <DollarSign size={20} className={isRTL ? "text-pink-500 dark:text-pink-300" : "text-primary-500 dark:text-primary-300"} />
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.title}
        </h3>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData} 
            margin={{ top: 5, right: 20, left: isRTL ? 60 : 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
            <XAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 11, fill: 'currentColor' }}
              tickFormatter={(value) => truncateName(value, 12)}
              interval={0}
              height={60}
            />
            <YAxis 
              type="number"
              tick={{ fontSize: 12, fill: 'currentColor', textAnchor: isRTL ? 'start' : 'end', dx: isRTL ? 35 : 0 }}
              tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`}
              orientation={isRTL ? 'right' : 'left'}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(236, 72, 153, 0.1)' }} 
              contentStyle={{ 
                backgroundColor: 'rgba(255,255,255,0.95)', 
                borderRadius: '0.5rem', 
                border: '1px solid #ddd',
                color: 'inherit'
              }}
              formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, t.income]}
            />
            <Legend />
            <Bar 
              dataKey="income" 
              name={t.income} 
              fill="#FF0083" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
          <p className={isRTL ? 'text-right' : 'text-left'}>{t.noData}</p>
        </div>
      )}
    </div>
  );
}

