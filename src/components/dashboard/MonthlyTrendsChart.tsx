import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Locale } from '../../types';

const translations = {
  en: {
    title: 'Monthly Trends - Income vs. Hours',
    noData: 'No trend data to display',
    income: 'Income',
    hours: 'Hours',
  },
  he: {
    title: 'מגמות חודשיות - הכנסות מול שעות',
    noData: 'אין נתוני מגמות להצגה',
    income: 'הכנסות',
    hours: 'שעות',
  },
} as const;

interface MonthlyTrendsChartProps {
  dateRange?: { start: Date; end: Date };
}

export function MonthlyTrendsChart({ dateRange }: MonthlyTrendsChartProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
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

    // Group time entries and incomes by month
    const monthlyData: Record<string, { totalIncome: number; totalHours: number; incomeFromIncomes: number; monthLabel: string }> = {};

    // Process time entries
    entries.forEach((entry) => {
      const date = new Date(entry.startTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = { totalIncome: 0, totalHours: 0, incomeFromIncomes: 0, monthLabel };
      }

      const hours = entry.duration / 3600; // Convert seconds to hours
      monthlyData[monthKey].totalIncome += entry.income;
      monthlyData[monthKey].totalHours += hours;
    });

    // Process incomes
    incomes.forEach((income) => {
      const date = new Date(income.incomeDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = { totalIncome: 0, totalHours: 0, incomeFromIncomes: 0, monthLabel };
      }

      monthlyData[monthKey].incomeFromIncomes += income.finalAmount;
    });

    // Combine income from time entries and income records
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.monthLabel,
        income: data.totalIncome + data.incomeFromIncomes,
        hours: data.totalHours,
        sortKey: key,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);
  }, [state.timeEntries, state.incomes, dateRange]);

  const hasData = chartData.length > 0 && (chartData.some(d => d.income > 0) || chartData.some(d => d.hours > 0));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className={isRTL ? "text-pink-500 dark:text-pink-300" : "text-primary-500 dark:text-primary-300"} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.title}
        </h3>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: 'currentColor', textAnchor: isRTL ? 'start' : 'end' }}
              tickFormatter={(value) => `₪${value.toFixed(0)}`}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fill: 'currentColor', textAnchor: isRTL ? 'end' : 'start' }}
              tickFormatter={(value) => `${value.toFixed(1)}h`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'income') {
                  return [`₪${value.toFixed(2)}`, t.income];
                }
                return [`${value.toFixed(2)}h`, t.hours];
              }}
              labelStyle={{ color: 'inherit' }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="income" 
              stroke="#FF0083" 
              strokeWidth={2}
              name={t.income}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="hours" 
              stroke="#6B7280" 
              strokeWidth={2}
              name={t.hours}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
          <p className={isRTL ? 'text-right' : 'text-left'}>{t.noData}</p>
        </div>
      )}
    </div>
  );
}

