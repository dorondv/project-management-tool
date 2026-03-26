import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
  es: {
    title: 'Distribucion de horas por cliente',
    noData: 'No hay datos de horas para mostrar',
    hours: 'Horas',
  },
  de: {
    title: 'Stundenverteilung nach Kunde',
    noData: 'Keine Stundendaten zur Anzeige',
    hours: 'Stunden',
  },
  pt: {
    title: 'Distribuicao de horas por cliente',
    noData: 'Sem dados de horas para exibir',
    hours: 'Horas',
  },
  fr: {
    title: 'Repartition des heures par client',
    noData: 'Aucune donnee d heures a afficher',
    hours: 'Heures',
  },
} as const;

const COLORS = [
  '#6366F1', '#FF0083', '#10B981', '#F59E0B', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
];

interface HoursByCustomerChartProps {
  dateRange?: { start: Date; end: Date };
}

export function HoursByCustomerChart({ dateRange }: HoursByCustomerChartProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale] ?? translations.en;

  const chartData = useMemo(() => {
    const entries = dateRange
      ? state.timeEntries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entryDate >= dateRange.start && entryDate <= dateRange.end;
        })
      : state.timeEntries;

    const customerHoursMap: Record<string, { name: string; hours: number }> = {};

    entries.forEach((entry) => {
      const customer = state.customers.find(c => c.id === entry.customerId);
      if (!customer) return;
      if (!customerHoursMap[entry.customerId]) {
        customerHoursMap[entry.customerId] = { name: customer.name, hours: 0 };
      }
      const hours = entry.duration / 3600;
      customerHoursMap[entry.customerId].hours += hours;
    });

    return Object.values(customerHoursMap)
      .filter(item => item.hours > 0)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  }, [state.timeEntries, state.customers, dateRange]);

  const totalHours = useMemo(() => chartData.reduce((sum, d) => sum + d.hours, 0), [chartData]);

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
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="hours"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={false}
                labelLine={false}
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
                  const percent = totalHours > 0 ? ((value / totalHours) * 100).toFixed(1) : '0';
                  return [`${value.toFixed(1)}h (${percent}%)`, t.hours];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
            {chartData.map((entry, index) => {
              const percent = totalHours > 0 ? ((entry.hours / totalHours) * 100).toFixed(1) : '0';
              return (
                <div key={entry.name} className={`flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name} ({percent}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
          <p className={isRTL ? 'text-right' : 'text-left'}>{t.noData}</p>
        </div>
      )}
    </div>
  );
}
