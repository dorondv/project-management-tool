import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, FolderOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { Button } from '../components/common/Button';

const projectTranslations = {
  en: {
    title: 'Projects',
    subtitle: 'Manage and track all your projects in one place',
    newProject: 'New Project',
    searchPlaceholder: 'Search projects...',
    status: {
      all: 'All Status',
      planning: 'Planning',
      inProgress: 'In Progress',
      completed: 'Completed',
      onHold: 'On Hold',
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
    status: {
      all: 'כל הסטטוסים',
      planning: 'בתכנון',
      inProgress: 'בתהליך',
      completed: 'הושלם',
      onHold: 'בהמתנה',
    },
    moreFilters: 'מסננים נוספים',
    emptyTitle: 'לא נמצאו פרויקטים',
    emptySubtitle: 'התחילו ביצירת הפרויקט הראשון שלכם',
    emptyCta: 'יצירת פרויקט',
  },
} as const;

export default function Projects() {
  const { state } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const locale = state.locale;
  const isRTL = locale === 'he';
  const t = projectTranslations[locale];

  const filteredProjects = useMemo(() =>
    state.projects.filter(project => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [state.projects, searchQuery, statusFilter]
  );

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const searchIconPosition = isRTL ? 'right-3' : 'left-3';
  const searchPadding = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';
  const selectAlign = isRTL ? 'text-right' : 'text-left';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="flex items-center justify-between">
        {isRTL ? (
          <>
            <div className={alignStart}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.subtitle}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={20} />}
              className="flex-row-reverse"
            >
              {t.newProject}
            </Button>
          </>
        ) : (
          <>
            <div className={alignStart}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.subtitle}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus size={20} />}
            >
              {t.newProject}
            </Button>
          </>
        )}
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse justify-start' : ''}`}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${selectAlign}`}
          >
            <option value="all">{t.status.all}</option>
            <option value="planning">{t.status.planning}</option>
            <option value="in-progress">{t.status.inProgress}</option>
            <option value="completed">{t.status.completed}</option>
            <option value="on-hold">{t.status.onHold}</option>
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

      {/* Projects Grid */}
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
            />
          </motion.div>
        ))}
      </motion.div>

      {filteredProjects.length === 0 && (
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
    </div>
  );
}