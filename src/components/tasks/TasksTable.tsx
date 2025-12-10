import { Calendar, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Task, Locale, Project, Customer } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { Badge } from '../common/Badge';
import { useState } from 'react';

const translations: Record<Locale, {
  columns: {
    task: string;
    status: string;
    priority: string;
    dueDate: string;
    project: string;
    client: string;
    actions: string;
  };
  statuses: {
    todo: string;
    'in-progress': string;
    completed: string;
  };
  priorities: {
    high: string;
    medium: string;
    low: string;
  };
  overdue: string;
  noDate: string;
  noTasks: string;
  noCustomer: string;
  edit: string;
  delete: string;
  customerStatuses: {
    active: string;
    trial: string;
    paused: string;
    churned: string;
  };
}> = {
  en: {
    columns: {
      task: 'Task',
      status: 'Status',
      priority: 'Priority',
      dueDate: 'Due Date',
      project: 'Project',
      client: 'Client',
      actions: 'Actions',
    },
    statuses: {
      todo: 'To Do',
      'in-progress': 'In Progress',
      completed: 'Completed',
    },
    priorities: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    overdue: 'Overdue',
    noDate: '-',
    noTasks: 'No tasks to display',
    noCustomer: 'No customer',
    edit: 'Edit',
    delete: 'Delete',
    customerStatuses: {
      active: 'Active',
      trial: 'Trial',
      paused: 'Paused',
      churned: 'Churned',
    },
  },
  he: {
    columns: {
      task: 'משימה',
      status: 'סטטוס',
      priority: 'עדיפות',
      dueDate: 'תאריך יעד',
      project: 'פרויקט',
      client: 'לקוח',
      actions: 'פעולות',
    },
    statuses: {
      todo: 'לביצוע',
      'in-progress': 'בתהליך',
      completed: 'הושלמו',
    },
    priorities: {
      high: 'גבוהה',
      medium: 'בינונית',
      low: 'נמוכה',
    },
    overdue: 'באיחור',
    noDate: '-',
    noTasks: 'אין משימות להצגה',
    noCustomer: 'אין לקוח',
    edit: 'עריכה',
    delete: 'מחיקה',
    customerStatuses: {
      active: 'פעיל',
      trial: 'ניסיון',
      paused: 'מושעה',
      churned: 'נטש',
    },
  },
};

interface TasksTableProps {
  tasks: Task[];
  projects: Project[];
  customers: Customer[];
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  locale?: Locale;
}

const StatusBadge = ({ status, onStatusChange, taskId, locale }: { 
  status: Task['status']; 
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  taskId: string;
  locale: Locale;
}) => {
  const t = translations[locale];
  const [isOpen, setIsOpen] = useState(false);

  const getStatusConfig = (status: Task['status']) => {
    switch(status) {
      case 'todo':
        return { 
          text: t.statuses.todo, 
          bgColor: 'bg-pink-500', 
          textColor: 'text-white',
          hoverColor: 'hover:bg-pink-600'
        };
      case 'in-progress':
        return { 
          text: t.statuses['in-progress'], 
          bgColor: 'bg-orange-500', 
          textColor: 'text-white',
          hoverColor: 'hover:bg-orange-600'
        };
      case 'completed':
        return { 
          text: t.statuses.completed, 
          bgColor: 'bg-green-500', 
          textColor: 'text-white',
          hoverColor: 'hover:bg-green-600'
        };
      default:
        return { 
          text: status, 
          bgColor: 'bg-gray-500', 
          textColor: 'text-white',
          hoverColor: 'hover:bg-gray-600'
        };
    }
  };

  const config = getStatusConfig(status);

  if (!onStatusChange) {
    return (
      <span className={`${config.bgColor} ${config.textColor} rounded-full px-4 py-1 text-sm font-medium`}>
        {config.text}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${config.bgColor} ${config.textColor} ${config.hoverColor} rounded-full px-4 py-1 text-sm font-medium transition-all duration-200 cursor-pointer`}
      >
        {config.text}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[150px]">
            <button
              onClick={() => {
                onStatusChange(taskId, 'todo');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <div className="w-3 h-3 bg-pink-500 rounded-full" />
              {t.statuses.todo}
            </button>
            <button
              onClick={() => {
                onStatusChange(taskId, 'in-progress');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              {t.statuses['in-progress']}
            </button>
            <button
              onClick={() => {
                onStatusChange(taskId, 'completed');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              {t.statuses.completed}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const PriorityBadge = ({ priority, locale }: { priority: Task['priority']; locale: Locale }) => {
  const t = translations[locale];
  
  const getPriorityConfig = (priority: Task['priority']) => {
    switch(priority) {
      case 'high':
        return { text: t.priorities.high, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' };
      case 'medium':
        return { text: t.priorities.medium, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' };
      case 'low':
        return { text: t.priorities.low, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' };
      default:
        return { text: priority, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge variant="default" className={config.color}>
      {config.text}
    </Badge>
  );
};

function TaskRow({ task, overdue, locale, isRTL, t, getProjectName, getCustomerForTask, onStatusChange, onEdit, onDelete }: {
  task: Task;
  overdue: boolean;
  locale: Locale;
  isRTL: boolean;
  t: typeof translations[Locale];
  getProjectName: (id: string) => string;
  getCustomerForTask: (projectId: string) => Customer | null;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b">
      <td className={`px-4 py-3 max-w-xs ${isRTL ? 'text-right' : 'text-left'}`}>
        <div>
          <p className="font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
          {task.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{task.description}</p>
          )}
        </div>
      </td>
      
      <td className="px-4 py-3 text-center">
        <StatusBadge 
          status={task.status} 
          onStatusChange={onStatusChange}
          taskId={task.id}
          locale={locale}
        />
      </td>

      <td className="px-4 py-3 text-center">
        <PriorityBadge priority={task.priority} locale={locale} />
      </td>

      <td className="px-4 py-3 text-center">
        {task.dueDate ? (
          <div className={`flex items-center justify-center gap-2 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
            <Calendar className="w-4 h-4" />
            <span className={overdue ? 'font-bold' : ''}>
              {formatDate(task.dueDate, locale)}
            </span>
            {overdue && (
              <Badge variant="error" className="text-xs">
                {t.overdue}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-gray-400">{t.noDate}</span>
        )}
      </td>

      <td className="px-4 py-3 text-center">
        <span className="text-gray-900 dark:text-white">{getProjectName(task.projectId)}</span>
      </td>

      <td className="px-4 py-3">
        {(() => {
          const customer = getCustomerForTask(task.projectId);
          if (!customer) {
            return (
              <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{t.noCustomer}</span>
              </div>
            );
          }
          return (
            <div className={`flex flex-col gap-1 ${isRTL ? 'text-right items-end' : 'text-left items-start'}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="font-medium text-gray-900 dark:text-white">{customer.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{customer.contactName}</span>
                {customer.contactEmail && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{customer.contactEmail}</span>
                  </>
                )}
              </div>
              {customer.status && (
                <Badge 
                  variant={customer.status === 'active' ? 'success' : customer.status === 'trial' ? 'warning' : 'default'}
                  className="text-xs mt-0.5"
                >
                  {t.customerStatuses[customer.status as keyof typeof t.customerStatuses] || customer.status}
                </Badge>
              )}
            </div>
          );
        })()}
      </td>

      <td className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className={`absolute z-20 mt-2 ${isRTL ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[120px]`}>
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <Edit className="w-4 h-4" />
                    {t.edit}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(task);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.delete}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function TasksTable({ tasks, projects, customers, onStatusChange, onEdit, onDelete, locale = 'en' }: TasksTableProps) {
  const isRTL = locale === 'he';
  const t = translations[locale];

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || '-';
  };

  const getCustomerForTask = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project?.customerId) return null;
    return customers.find(c => c.id === project.customerId) || null;
  };

  const isOverdue = (dueDate: Date | string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b">
              <th className={`px-4 py-3 text-sm font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.columns.task}
              </th>
              <th className="px-4 py-3 text-sm font-bold text-center">
                {t.columns.status}
              </th>
              <th className="px-4 py-3 text-sm font-bold text-center">
                {t.columns.priority}
              </th>
              <th className="px-4 py-3 text-sm font-bold text-center">
                {t.columns.dueDate}
              </th>
              <th className="px-4 py-3 text-sm font-bold text-center">
                {t.columns.project}
              </th>
              <th className="px-4 py-3 text-sm font-bold text-center">
                {t.columns.client}
              </th>
              <th className={`px-4 py-3 text-sm font-bold ${isRTL ? 'text-left' : 'text-right'}`}>
                {t.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const overdue = isOverdue(task.dueDate);
              return (
                <TaskRow 
                  key={task.id}
                  task={task}
                  overdue={overdue}
                  locale={locale}
                  isRTL={isRTL}
                  t={t}
                  getProjectName={getProjectName}
                  getCustomerForTask={getCustomerForTask}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
            
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className={`text-center py-12 text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.noTasks}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}