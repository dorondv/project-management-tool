import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Locale } from '../../types';

const translations = {
  en: {
    title: 'Average Income Per Hour by Month',
    noData: 'No rate data to display',
  },
  he: {
    title: 'הכנסה ממוצעת לשעה לפי חודש',
    noData: 'אין נתוני תעריפים להצגה',
  },
} as const;

export function IncomePerHourChart() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const chartData = useMemo(() => {
    // Group time entries by month
    const monthlyData: Record<string, { totalIncome: number; totalHours: number; monthLabel: string }> = {};

    state.timeEntries.forEach((entry) => {
      const date = new Date(entry.startTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = { totalIncome: 0, totalHours: 0, monthLabel };
      }

      const hours = entry.duration / 3600; // Convert seconds to hours
      monthlyData[monthKey].totalIncome += entry.income;
      monthlyData[monthKey].totalHours += hours;
    });

    // Calculate average income per hour for each month
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.monthLabel,
        averageIncomePerHour: data.totalHours > 0 ? data.totalIncome / data.totalHours : 0,
        sortKey: key,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);
  }, [state.timeEntries]);

  const hasData = chartData.length > 0 && chartData.some(d => d.averageIncomePerHour > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Calculator size={20} className="text-primary-500 dark:text-primary-300" />
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
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
              tick={{ fill: 'currentColor', textAnchor: isRTL ? 'start' : 'end' }}
              tickFormatter={(value) => `₪${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`₪${value.toFixed(2)}`, locale === 'he' ? 'הכנסה ממוצעת לשעה' : 'Avg Income/Hour']}
              labelStyle={{ color: 'inherit' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="averageIncomePerHour" 
              stroke="#FF0083" 
              strokeWidth={2}
              name={locale === 'he' ? 'הכנסה ממוצעת לשעה' : 'Avg Income/Hour'}
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

