import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';

const COLORS = ['#FF0083', '#FF3D9A', '#FF66AF', '#FF8FC3', '#FFB8D7'];

export function ProjectChart() {
  const { state } = useApp();

  const data = [
    { name: 'In Progress', value: state.projects.filter(p => p.status === 'in-progress').length },
    { name: 'Completed', value: state.projects.filter(p => p.status === 'completed').length },
    { name: 'Planning', value: state.projects.filter(p => p.status === 'planning').length },
    { name: 'On Hold', value: state.projects.filter(p => p.status === 'on-hold').length },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Project Status Distribution
      </h3>
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
    </div>
  );
}