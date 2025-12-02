import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Paperclip, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Task, Locale } from '../../types';
import { formatDate, getDeadlineStatus } from '../../utils/dateUtils';
import { getPriorityColor, getStatusColor } from '../../utils/colorUtils';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
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
  const deadlineStatus = getDeadlineStatus(task.dueDate);

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
    <Card
      hover
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all ${
        isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {task.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
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

      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
        <Badge variant={deadlineStatus === 'overdue' ? 'error' : deadlineStatus === 'due-soon' ? 'warning' : 'default'}>
          {formatDate(task.dueDate)}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        {/* Assigned users hidden for current version - tasks auto-assigned to single user */}
        <div className="flex items-center space-x-3">
        </div>
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          {task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageSquare size={12} />
              <span className="text-xs">{task.comments.length}</span>
            </div>
          )}
          {task.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip size={12} />
              <span className="text-xs">{task.attachments.length}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}