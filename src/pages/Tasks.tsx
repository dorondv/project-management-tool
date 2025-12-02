import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, LayoutGrid, List, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { TaskCard } from '../components/tasks/TaskCard';
import { TasksTable } from '../components/tasks/TasksTable';
import { Button } from '../components/common/Button';
import { Task, Locale } from '../types';

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  newTask: string;
  searchPlaceholder: string;
  statusOptions: {
    all: string;
    todo: string;
    inProgress: string;
    completed: string;
  };
  priorityOptions: {
    all: string;
    low: string;
    medium: string;
    high: string;
  };
  moreFilters: string;
  filtersLabel: string;
  statusLabel: string;
  clientLabel: string;
  projectLabel: string;
  clientOptions: {
    all: string;
  };
  projectOptions: {
    all: string;
  };
  clearFilters: string;
  filteredBy: string;
  emptyTitle: string;
  emptySubtitle: string;
  emptyCta: string;
}> = {
  en: {
    pageTitle: 'Tasks',
    pageSubtitle: 'Manage your tasks across all projects',
    newTask: 'New Task',
    searchPlaceholder: 'Search tasks...',
    statusOptions: {
      all: 'All Status',
      todo: 'To Do',
      inProgress: 'In Progress',
      completed: 'Completed',
    },
    priorityOptions: {
      all: 'All Priority',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
    moreFilters: 'More Filters',
    filtersLabel: 'Filters:',
    statusLabel: 'Status',
    clientLabel: 'Client',
    projectLabel: 'Project',
    clientOptions: {
      all: 'All Clients',
    },
    projectOptions: {
      all: 'All Projects',
    },
    clearFilters: 'Clear Filters',
    filteredBy: 'Filtered by:',
    emptyTitle: 'No tasks found',
    emptySubtitle: 'Create your first task to get started',
    emptyCta: 'Create Task',
  },
  he: {
    pageTitle: 'משימות',
    pageSubtitle: 'נהל את המשימות שלך בכל הפרויקטים',
    newTask: 'משימה חדשה',
    searchPlaceholder: 'חיפוש משימות...',
    statusOptions: {
      all: 'כל הסטטוסים',
      todo: 'לביצוע',
      inProgress: 'בתהליך',
      completed: 'הושלמו',
    },
    priorityOptions: {
      all: 'כל העדיפויות',
      low: 'נמוכה',
      medium: 'בינונית',
      high: 'גבוהה',
    },
    moreFilters: 'סינון נוסף',
    filtersLabel: 'פילטרים:',
    statusLabel: 'סטטוס',
    clientLabel: 'לקוח',
    projectLabel: 'פרויקט',
    clientOptions: {
      all: 'כל הלקוחות',
    },
    projectOptions: {
      all: 'כל הפרויקטים',
    },
    clearFilters: 'נקה פילטרים',
    filteredBy: 'סינון לפי:',
    emptyTitle: 'לא נמצאו משימות',
    emptySubtitle: 'צור משימה חדשה כדי להתחיל',
    emptyCta: 'צור משימה',
  },
};

export default function Tasks() {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // Filtered tasks for table view (respects all filters including status)
  const filteredTasksForTable = state.tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const project = state.projects.find(p => p.id === task.projectId);
    const matchesClient = !clientFilter || project?.customerId === clientFilter;
    const matchesProject = !projectFilter || task.projectId === projectFilter;
    return matchesStatus && matchesClient && matchesProject;
  });

  // Tasks for Kanban view (only filtered by client/project, not status, as status is handled by columns)
  const kanbanTasks = state.tasks.filter(task => {
    const project = state.projects.find(p => p.id === task.projectId);
    const matchesClient = !clientFilter || project?.customerId === clientFilter;
    const matchesProject = !projectFilter || task.projectId === projectFilter;
    return matchesClient && matchesProject;
  });

  const alignStart = isRTL ? 'text-right' : 'text-left';
  
  const clearAllFilters = () => {
    setStatusFilter('all');
    setClientFilter(null);
    setProjectFilter(null);
  };
  
  const selectedClient = clientFilter ? state.customers.find(c => c.id === clientFilter) : null;
  const selectedProject = projectFilter ? state.projects.find(p => p.id === projectFilter) : null;

  return (
    <>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
        <div className="flex items-center justify-between">
          {isRTL ? (
            <>
              <div className={alignStart}>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t.pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.pageSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-row-reverse justify-start">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-row-reverse">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  icon={<Plus size={16} />}
                  className="flex-row-reverse"
                >
                  {t.newTask}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={alignStart}>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t.pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.pageSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  icon={<Plus size={16} />}
                >
                  {t.newTask}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
              <Filter className="w-4 h-4" />
              <span>{t.filtersLabel}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.statusLabel}:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${isRTL ? 'text-right' : 'text-left'} w-32`}
              >
                <option value="all">{t.statusOptions.all}</option>
                <option value="todo">{t.statusOptions.todo}</option>
                <option value="in-progress">{t.statusOptions.inProgress}</option>
                <option value="completed">{t.statusOptions.completed}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.clientLabel}:</span>
              <select
                value={clientFilter || 'all'}
                onChange={(e) => setClientFilter(e.target.value === 'all' ? null : e.target.value)}
                className={`px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${isRTL ? 'text-right' : 'text-left'} w-40`}
              >
                <option value="all">{t.clientOptions.all}</option>
                {state.customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t.projectLabel}:</span>
              <select
                value={projectFilter || 'all'}
                onChange={(e) => setProjectFilter(e.target.value === 'all' ? null : e.target.value)}
                className={`px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${isRTL ? 'text-right' : 'text-left'} w-40`}
              >
                <option value="all">{t.projectOptions.all}</option>
                {state.projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>

            {(statusFilter !== 'all' || clientFilter || projectFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className={`text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <X size={16} className={isRTL ? 'ml-1' : 'mr-1'} />
                {t.clearFilters}
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedClient || selectedProject) && (
          <div className={`mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-semibold text-blue-800 dark:text-blue-300">{t.filteredBy}:</span>
              {selectedClient && (
                <div className={`flex items-center gap-1 bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>{t.clientLabel}: {selectedClient.name}</span>
                  <button
                    onClick={() => setClientFilter(null)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {selectedProject && (
                <div className={`flex items-center gap-1 bg-green-100 dark:bg-green-800 px-3 py-1 rounded-full text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>{t.projectLabel}: {selectedProject.title}</span>
                  <button
                    onClick={() => setProjectFilter(null)}
                    className="hover:bg-green-200 dark:hover:bg-green-700 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`min-h-[600px] ${isRTL ? 'text-right' : 'text-left'}`}
        >
          {viewMode === 'kanban' ? (
            <KanbanBoard 
              tasks={kanbanTasks}
              onEdit={(task) => setSelectedTask(task)}
              onDelete={async (task) => {
                if (window.confirm(locale === 'he' ? 'האם אתה בטוח שברצונך למחוק משימה זו?' : 'Are you sure you want to delete this task?')) {
                  try {
                    const { api } = await import('../utils/api');
                    await api.tasks.delete(task.id, state.user?.id);
                    dispatch({ type: 'DELETE_TASK', payload: task.id });
                  } catch (error) {
                    console.error('Failed to delete task:', error);
                  }
                }
              }}
            />
          ) : (
            <TasksTable
              tasks={filteredTasksForTable}
              projects={state.projects}
              customers={state.customers}
              onStatusChange={(taskId, newStatus) => {
                const task = state.tasks.find(t => t.id === taskId);
                if (task) {
                  dispatch({
                    type: 'UPDATE_TASK',
                    payload: {
                      ...task,
                      status: newStatus,
                      updatedAt: new Date()
                    }
                  });
                }
              }}
              onEdit={(task) => setSelectedTask(task)}
              onDelete={async (task) => {
                if (window.confirm(locale === 'he' ? 'האם אתה בטוח שברצונך למחוק משימה זו?' : 'Are you sure you want to delete this task?')) {
                  try {
                    const { api } = await import('../utils/api');
                    await api.tasks.delete(task.id, state.user?.id);
                    dispatch({ type: 'DELETE_TASK', payload: task.id });
                  } catch (error) {
                    console.error('Failed to delete task:', error);
                  }
                }
              }}
              locale={locale}
            />
          )}
        </motion.div>
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </>
  );
}