import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2, Calendar } from 'lucide-react';
import { Task, Locale } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';

const translations: Record<Locale, {
  edit: string;
  delete: string;
  deleteConfirm: string;
}> = {
  en: {
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this task?',
  },
  he: {
    edit: 'עריכה',
    delete: 'מחיקה',
    deleteConfirm: 'האם אתה בטוח שברצונך למחוק משימה זו?',
  },
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function TaskCard({ task, onClick, isDragging = false, onEdit, onDelete }: TaskCardProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get project name
  const project = state.projects.find(p => p.id === task.projectId);
  const projectName = project?.title || '';

  // Get status-based colors
  const getStatusColors = () => {
    switch (task.status) {
      case 'todo':
        return {
          borderColorLeft: 'border-l-pink-500',
          borderColorRight: 'border-r-pink-500',
          dotColor: 'bg-pink-500',
        };
      case 'in-progress':
        return {
          borderColorLeft: 'border-l-orange-500',
          borderColorRight: 'border-r-orange-500',
          dotColor: 'bg-orange-500',
        };
      case 'completed':
        return {
          borderColorLeft: 'border-l-green-500',
          borderColorRight: 'border-r-green-500',
          dotColor: 'bg-green-500',
        };
      default:
        return {
          borderColorLeft: 'border-l-gray-500',
          borderColorRight: 'border-r-gray-500',
          dotColor: 'bg-gray-500',
        };
    }
  };

  const statusColors = getStatusColors();
  const borderColor = isRTL ? statusColors.borderColorLeft : statusColors.borderColorRight;

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
      onEdit(task);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) {
      if (window.confirm(t.deleteConfirm)) {
        onDelete(task);
      }
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${borderColor} ${isRTL ? 'border-l-4' : 'border-r-4'} transition-all duration-200 flex flex-col justify-between select-none ${
        isDragging ? 'shadow-xl scale-105 bg-gray-50 dark:bg-gray-700 rotate-2 z-50' : 'hover:shadow-md cursor-pointer'
      }`}
      style={{ minHeight: '120px' }}
    >
      <div>
        <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1">
            <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h4 className="font-semibold text-gray-800 dark:text-white text-sm leading-tight line-clamp-2 flex-1">
                {task.title}
              </h4>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${statusColors.dotColor}`} />
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {isMenuOpen && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10`}>
                {onEdit && (
                  <button
                    onClick={handleEditClick}
                    className={`w-full px-4 py-2 ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}
                  >
                    <Edit size={16} />
                    {t.edit}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className={`w-full px-4 py-2 ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700`}
                  >
                    <Trash2 size={16} />
                    {t.delete}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>
      
      <div className={`flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Calendar className="w-3 h-3" />
          <span>{task.dueDate ? formatDate(task.dueDate) : (locale === 'he' ? 'ללא תאריך' : 'No date')}</span>
        </div>
        
        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {projectName && (
            <div className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs truncate max-w-[80px]">
              {projectName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}