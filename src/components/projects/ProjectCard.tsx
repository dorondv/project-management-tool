import { useState, useRef, useEffect } from 'react';
import { Calendar, MoreVertical, Edit, Trash2, User as UserIcon } from 'lucide-react';
import { Project, Locale } from '../../types';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const translations = {
  en: {
    editProject: 'Edit Project',
    deleteProject: 'Delete Project',
    estimatedHours: 'Estimated Hours',
    hours: 'hours',
    ongoing: 'Ongoing',
  },
  he: {
    editProject: 'ערוך פרויקט',
    deleteProject: 'מחק פרויקט',
    estimatedHours: 'שעות מוערכות',
    hours: 'שעות',
    ongoing: 'שוטף',
  },
} as const;

const statusLabels: Record<Locale, Record<string, string>> = {
  en: {
    'planning': 'Planning',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'on-hold': 'On Hold',
  },
  he: {
    'planning': 'בתכנון',
    'in-progress': 'בתהליך',
    'completed': 'הושלם',
    'on-hold': 'בהמתנה',
  },
};

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete();
    }
  };

  const customer = project.customerId 
    ? state.customers.find(c => c.id === project.customerId)
    : null;

  const getStatusText = (status: string) => {
    return statusLabels[locale][status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'in-progress':
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'on-hold':
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Calculate estimated hours from project data
  // If customer exists and has hoursPerMonth, we can use that as estimated hours
  const estimatedHours = customer?.hoursPerMonth || 0;

  return (
    <div
      className="glass-effect border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden cursor-pointer"
      onClick={onClick}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* CardHeader */}
      <div className="pb-4 px-6 pt-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {project.title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(project.status)}>
              {getStatusText(project.status)}
            </Badge>
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {isMenuOpen && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10`}>
                  <button
                    onClick={handleEditClick}
                    className={`w-full px-4 py-2 ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}
                  >
                    <Edit size={16} />
                    {t.editProject}
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className={`w-full px-4 py-2 ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700`}
                  >
                    <Trash2 size={16} />
                    {t.deleteProject}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CardContent */}
      <div className="px-6 pb-6">
        <div className="space-y-3">
          {customer && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">{customer.name}</span>
              {customer.taxId && (
                <Badge variant="outline" className="text-xs">
                  {customer.taxId}
                </Badge>
              )}
            </div>
          )}
          
          {project.endDate ? (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {format(new Date(project.endDate), 'dd MMM yyyy', { locale: locale === 'he' ? he : undefined })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{t.ongoing}</span>
            </div>
          )}

          {/* Keep cards uniform height: always reserve space for description (even if empty) */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl min-h-[64px]">
            {project.description ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {project.description}
              </p>
            ) : (
              <span className="opacity-0 select-none text-sm">placeholder</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.estimatedHours}:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {estimatedHours || 0} {t.hours}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}