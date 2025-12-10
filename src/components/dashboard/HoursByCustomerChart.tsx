import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Locale } from '../../types';

const translations = {
  en: {
    title: 'Hours Distribution by Customer',
    noData: 'No hour data to display',
    hours: 'Hours',
  },
  he: {
    title: 'התפלגות שעות לפי לקוח',
    noData: 'אין נתוני שעות להצגה',
    hours: 'שעות',
  },
} as const;

interface HoursByCustomerChartProps {
  dateRange?: { start: Date; end: Date };
}

export function HoursByCustomerChart({ dateRange }: HoursByCustomerChartProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const chartData = useMemo(() => {
    // Filter time entries by date range if provided
    const entries = dateRange
      ? state.timeEntries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entryDate >= dateRange.start && entryDate <= dateRange.end;
        })
      : state.timeEntries;

    // Group time entries by customer
    const customerHoursMap: Record<string, { name: string; hours: number }> = {};

    entries.forEach((entry) => {
      const customer = state.customers.find(c => c.id === entry.customerId);
      if (!customer) return;

      if (!customerHoursMap[entry.customerId]) {
        customerHoursMap[entry.customerId] = {
          name: customer.name,
          hours: 0,
        };
      }

      const hours = entry.duration / 3600; // Convert seconds to hours
      customerHoursMap[entry.customerId].hours += hours;
    });

    // Convert to array and filter out customers with 0 hours
    return Object.values(customerHoursMap)
      .filter(item => item.hours > 0)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Limit to top 10 customers
  }, [state.timeEntries, state.customers, dateRange]);

  // Helper function to truncate long names
  const truncateName = (name: string, maxLength: number = 12): string => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const hasData = chartData.length > 0 && chartData.some(d => d.hours > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Clock size={20} className={isRTL ? "text-pink-500 dark:text-pink-300" : "text-primary-500 dark:text-primary-300"} />
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
              tick={{ fontSize: 12, fill: 'currentColor', textAnchor: isRTL ? 'start' : 'end' }}
              tickFormatter={(value) => `${value.toFixed(1)}h`}
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
              formatter={(value: number) => [`${value.toFixed(1)}h`, t.hours]}
            />
            <Legend />
            <Bar 
              dataKey="hours" 
              name={t.hours} 
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

