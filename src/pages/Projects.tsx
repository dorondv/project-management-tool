import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Search, FolderOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Project } from '../types';
import toast from 'react-hot-toast';

const projectTranslations = {
  en: {
    title: 'Projects',
    subtitle: 'Manage and track all your projects in one place',
    newProject: 'New Project',
    searchPlaceholder: 'Search projects...',
    filtersLabel: 'Filters:',
    status: {
      all: 'All Status',
      planning: 'Planning',
      inProgress: 'In Progress',
      completed: 'Completed',
      onHold: 'On Hold',
    },
    customer: {
      all: 'All Customers',
      label: 'Customer',
    },
    moreFilters: 'More Filters',
    emptyTitle: 'No projects found',
    emptySubtitle: 'Get started by creating your first project',
    emptyCta: 'Create Project',
  },
  he: {
    title: 'פרויקטים',
    subtitle: 'נהלו ועקבו אחרי כל הפרויקטים במקום אחד',
    newProject: 'פרויקט חדש',
    searchPlaceholder: 'חיפוש פרויקטים...',
    filtersLabel: 'פילטרים:',
    status: {
      all: 'כל הסטטוסים',
      planning: 'בתכנון',
      inProgress: 'בתהליך',
      completed: 'הושלם',
      onHold: 'בהמתנה',
    },
    customer: {
      all: 'כל הלקוחות',
      label: 'לקוח',
    },
    moreFilters: 'מסננים נוספים',
    emptyTitle: 'לא נמצאו פרויקטים',
    emptySubtitle: 'התחילו ביצירת הפרויקט הראשון שלכם',
    emptyCta: 'יצירת פרויקט',
  },
} as const;

export default function Projects() {
  const { state, dispatch } = useApp();
  const [searchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const locale = state.locale;
  const isRTL = locale === 'he';
  const t = projectTranslations[locale];

  const handleDeleteProject = async (project: Project) => {
    const confirmMessage = locale === 'he' 
      ? `האם אתה בטוח שברצונך למחוק את הפרויקט "${project.title}"?`
      : `Are you sure you want to delete the project "${project.title}"?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Delete via API first
        const { api } = await import('../utils/api');
        await api.projects.delete(project.id);
        
        // Update local state
        dispatch({ type: 'DELETE_PROJECT', payload: project.id });
        
        toast.success(locale === 'he' ? 'הפרויקט נמחק בהצלחה' : 'Project deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete project:', error);
        toast.error(error.message || (locale === 'he' ? 'שגיאה במחיקת הפרויקט' : 'Failed to delete project. Please try again.'));
      }
    }
  };

  // Initialize customer filter from URL params
  useEffect(() => {
    const customerParam = searchParams.get('customer');
    if (customerParam) {
      setCustomerFilter(customerParam);
    }
  }, [searchParams]);

  // Set loading state based on whether projects are loaded
  useEffect(() => {
    // If the app is loading (initial load), show loading
    if (state.loading) {
      setIsLoading(true);
    } else {
      // Once app loading is done, we can show the projects (even if empty)
      setIsLoading(false);
    }
  }, [state.loading]);

  const filteredProjects = useMemo(() =>
    state.projects.filter(project => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesCustomer = customerFilter === 'all' || project.customerId === customerFilter;
      return matchesSearch && matchesStatus && matchesCustomer;
    }),
    [state.projects, searchQuery, statusFilter, customerFilter]
  );

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const searchIconPosition = isRTL ? 'right-3' : 'left-3';
  const searchPadding = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';
  const selectAlign = isRTL ? 'text-right' : 'text-left';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {isRTL ? (
          <>
            <div className={`${alignStart} flex-1`}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.subtitle}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={16} />}
              className="flex-row-reverse w-full sm:w-auto"
            >
              {t.newProject}
            </Button>
          </>
        ) : (
          <>
            <div className={`${alignStart} flex-1`}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.subtitle}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={16} />}
              className="w-full sm:w-auto"
            >
              {t.newProject}
            </Button>
          </>
        )}
      </div>

      {/* Filters */}
      <div
        className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4" />
            <span>{t.filtersLabel}</span>
          </div>

          {/* Search (keep on the right in RTL, like the mockup) */}
          <div className="w-48">
            <div className="relative">
              <Search
                className={`absolute ${searchIconPosition} top-1/2 transform -translate-y-1/2 text-gray-400`}
                size={20}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${searchPadding} py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${alignStart} text-sm`}
              />
            </div>
          </div>

          {/* Filters (sit immediately after search) */}
          <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectAlign} text-sm`}
          >
            <option value="all">{t.status.all}</option>
            <option value="planning">{t.status.planning}</option>
            <option value="in-progress">{t.status.inProgress}</option>
            <option value="completed">{t.status.completed}</option>
            <option value="on-hold">{t.status.onHold}</option>
          </select>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectAlign} text-sm`}
          >
            <option value="all">{t.customer.all}</option>
            {state.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            icon={<Filter size={16} />}
            className={`${isRTL ? 'flex-row-reverse' : ''} text-sm`}
            size="sm"
          >
            {t.moreFilters}
          </Button>
        </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {locale === 'he' ? 'טוען פרויקטים...' : 'Loading projects...'}
            </p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ProjectCard
              project={project}
              onClick={() => {/* Handle project click */}}
              onEdit={() => {
                setEditingProject(project);
                setIsEditModalOpen(true);
              }}
              onDelete={() => handleDeleteProject(project)}
            />
          </motion.div>
        ))}
        </motion.div>
      )}

      {!isLoading && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={32} className="text-gray-400" />
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

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
      />
    </div>
  );
}