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
import type { Locale } from '../types';
import { t } from '../i18n';
import toast from 'react-hot-toast';

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

  const locale = (state.locale ?? 'en') as Locale;
  const isRTL = locale === 'he';

  const handleDeleteProject = async (project: Project) => {
    const confirmMessage = t('projects.deleteConfirm', locale, { title: project.title });
    if (window.confirm(confirmMessage)) {
      try {
        const { api } = await import('../utils/api');
        await api.projects.delete(project.id);
        dispatch({ type: 'DELETE_PROJECT', payload: project.id });
        toast.success(t('projects.deleteSuccess', locale));
      } catch (error: any) {
        console.error('Failed to delete project:', error);
        toast.error(error.message || t('projects.deleteError', locale));
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
                {t('projects.title', locale)}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('projects.subtitle', locale)}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={16} />}
              className="flex-row-reverse w-full sm:w-auto"
            >
              {t('projects.newProject', locale)}
            </Button>
          </>
        ) : (
          <>
            <div className={`${alignStart} flex-1`}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('projects.title', locale)}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('projects.subtitle', locale)}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={16} />}
              className="w-full sm:w-auto"
            >
              {t('projects.newProject', locale)}
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
            <span>{t('projects.filtersLabel', locale)}</span>
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
                placeholder={t('projects.searchPlaceholder', locale)}
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
            <option value="all">{t('projects.status.all', locale)}</option>
            <option value="planning">{t('projects.status.planning', locale)}</option>
            <option value="in-progress">{t('projects.status.inProgress', locale)}</option>
            <option value="completed">{t('projects.status.completed', locale)}</option>
            <option value="on-hold">{t('projects.status.onHold', locale)}</option>
          </select>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectAlign} text-sm`}
          >
            <option value="all">{t('projects.customer.all', locale)}</option>
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
            {t('projects.moreFilters', locale)}
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
              {t('projects.loading', locale)}
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
            {t('projects.emptyTitle', locale)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('projects.emptySubtitle', locale)}
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus size={20} />}
          >
            {t('projects.emptyCta', locale)}
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