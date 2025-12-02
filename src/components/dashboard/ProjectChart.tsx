import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';
import { Locale } from '../../types';

const COLORS = ['#FF0083', '#3B82F6', '#10B981', '#F59E0B'];

const translations: Record<Locale, {
  title: string;
  statuses: {
    'in-progress': string;
    completed: string;
    planning: string;
    'on-hold': string;
  };
}> = {
  en: {
    title: 'Project Status Distribution',
    statuses: {
      'in-progress': 'In Progress',
      completed: 'Completed',
      planning: 'Planning',
      'on-hold': 'On Hold',
    },
  },
  he: {
    title: 'התפלגות סטטוס פרויקטים',
    statuses: {
      'in-progress': 'בתהליך',
      completed: 'הושלמו',
      planning: 'תכנון',
      'on-hold': 'מושעה',
    },
  },
};

export function ProjectChart() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  
  const statusTranslations = t.statuses;
  
  const data = [
    { 
      name: statusTranslations['in-progress'],
      value: state.projects.filter(p => p.status === 'in-progress').length,
    },
    { 
      name: statusTranslations.completed,
      value: state.projects.filter(p => p.status === 'completed').length,
    },
    { 
      name: statusTranslations.planning,
      value: state.projects.filter(p => p.status === 'planning').length,
    },
    { 
      name: statusTranslations['on-hold'],
      value: state.projects.filter(p => p.status === 'on-hold').length,
    },
  ].filter(item => item.value > 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t.title}
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
          <p className={isRTL ? 'text-right' : 'text-left'}>{t.title}</p>
        </div>
      )}
    </div>
  );
}