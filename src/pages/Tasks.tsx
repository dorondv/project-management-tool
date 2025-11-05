import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, LayoutGrid, List, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { TaskCard } from '../components/tasks/TaskCard';
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
    emptyTitle: 'לא נמצאו משימות',
    emptySubtitle: 'צור משימה חדשה כדי להתחיל',
    emptyCta: 'צור משימה',
  },
};

export default function Tasks() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredTasks = state.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const searchIconPosition = isRTL ? 'right-3' : 'left-3';
  const searchPadding = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';
  const alignStart = isRTL ? 'text-right' : 'text-left';
  const filtersDirection = isRTL ? 'flex-row-reverse' : '';
  const selectsAlign = isRTL ? 'text-right' : 'text-left';

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
                >
                  {t.newTask}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className={`flex gap-2 ${filtersDirection} ${isRTL ? 'justify-start' : ''}`}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectsAlign}`}
            >
              <option value="all">{t.statusOptions.all}</option>
              <option value="todo">{t.statusOptions.todo}</option>
              <option value="in-progress">{t.statusOptions.inProgress}</option>
              <option value="completed">{t.statusOptions.completed}</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectsAlign}`}
            >
              <option value="all">{t.priorityOptions.all}</option>
              <option value="low">{t.priorityOptions.low}</option>
              <option value="medium">{t.priorityOptions.medium}</option>
              <option value="high">{t.priorityOptions.high}</option>
            </select>
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              {t.moreFilters}
            </Button>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute ${searchIconPosition} top-1/2 transform -translate-y-1/2 text-gray-400`} size={20} />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${searchPadding} py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${alignStart}`}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-[600px]"
        >
          {viewMode === 'kanban' ? (
            <KanbanBoard />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TaskCard
                    task={task}
                    onClick={() => setSelectedTask(task)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <List size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t.emptyTitle}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.emptySubtitle}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={20} />}
            >
              {t.emptyCta}
            </Button>
          </div>
        )}
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