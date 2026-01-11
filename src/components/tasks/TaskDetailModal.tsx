import { useState, useEffect } from 'react';
import { Calendar, FileText, X, Calendar as CalendarIcon, Building2, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { Task, Locale } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const translations: Record<Locale, {
  title: string;
  taskTitle: string;
  taskTitlePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  project: string;
  selectProject: string;
  customer: string;
  noCustomer: string;
  dueDate: string;
  priority: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  status: string;
  statusTodo: string;
  statusInProgress: string;
  statusCompleted: string;
  updateStatus: string;
  cancel: string;
  saveTask: string;
  updateTask: string;
  deleteTask: string;
  deleteConfirm: string;
  deleted: string;
  saved: string;
  statusUpdated: string;
  noProject: string;
}> = {
  en: {
    title: 'Edit Task',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'Enter task title',
    description: 'Description',
    descriptionPlaceholder: 'Describe the task',
    project: 'Project',
    selectProject: 'Select a project',
    customer: 'Customer',
    noCustomer: 'No customer',
    dueDate: 'Due Date',
    priority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    status: 'Status',
    statusTodo: 'To Do',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    updateStatus: 'Update Status',
    cancel: 'Cancel',
    saveTask: 'Save Task',
    updateTask: 'Update Task',
    deleteTask: 'Delete Task',
    deleteConfirm: 'Are you sure you want to delete this task?',
    deleted: 'Task deleted successfully',
    saved: 'Task saved successfully',
    statusUpdated: 'Task status updated',
    noProject: 'No project',
  },
  he: {
    title: 'עריכת משימה',
    taskTitle: 'כותרת המשימה',
    taskTitlePlaceholder: 'לדוגמה: לעצב את דף הבית',
    description: 'תיאור',
    descriptionPlaceholder: 'פרטים נוספים על המשימה...',
    project: 'פרויקט',
    selectProject: 'שיוך לפרויקט',
    customer: 'לקוח',
    noCustomer: 'ללא לקוח',
    dueDate: 'תאריך יעד',
    priority: 'עדיפות',
    priorityLow: 'נמוכה',
    priorityMedium: 'בינונית',
    priorityHigh: 'גבוהה',
    status: 'סטטוס',
    statusTodo: 'לביצוע',
    statusInProgress: 'בתהליך',
    statusCompleted: 'הושלמו',
    updateStatus: 'עדכן סטטוס',
    cancel: 'ביטול',
    saveTask: 'שמור משימה',
    updateTask: 'עדכון משימה',
    deleteTask: 'מחק משימה',
    deleteConfirm: 'האם אתה בטוח שברצונך למחוק משימה זו?',
    deleted: 'המשימה נמחקה בהצלחה',
    saved: 'המשימה נשמרה בהצלחה',
    statusUpdated: 'סטטוס המשימה עודכן',
    noProject: 'ללא שיוך',
  },
};

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onDelete?: (task: Task) => void;
}

export function TaskDetailModal({ isOpen, onClose, task, onDelete }: TaskDetailModalProps) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium' as Task['priority'],
    dueDate: null as Date | null,
    status: 'todo' as Task['status'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        status: task.status || 'todo',
      });
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const { api } = await import('../../utils/api');
      const updateData = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        priority: formData.priority,
        dueDate: formData.dueDate || task.dueDate,
        status: formData.status,
        assignedTo: task.assignedTo?.map(user => typeof user === 'string' ? user : user.id) || [state.user!.id],
        tags: task.tags || [],
      };

      await api.tasks.update(task.id, updateData);
      
      const updatedTask = {
        ...task,
        ...updateData,
        updatedAt: new Date(),
      };
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    
    // Add activity
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: Date.now().toString(),
        type: 'task_updated',
          description: locale === 'he' 
            ? `עודכן משימה "${formData.title}"`
            : `updated task "${formData.title}"`,
        userId: state.user!.id,
        user: state.user!,
          projectId: formData.projectId,
        taskId: task.id,
        createdAt: new Date()
      }
    });

      toast.success(t.saved);
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error(locale === 'he' ? 'שגיאה בשמירת המשימה' : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    setFormData({ ...formData, status: newStatus });
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    
    if (!window.confirm(t.deleteConfirm)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(task);
      toast.success(t.deleted);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error(locale === 'he' ? 'שגיאה במחיקת המשימה' : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedProject = state.projects.find(p => p.id === formData.projectId);
  const customer = selectedProject?.customerId 
    ? state.customers.find(c => c.id === selectedProject.customerId) 
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title} size="lg" dir={isRTL ? 'rtl' : 'ltr'}>
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="space-y-2">
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.taskTitle} *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            placeholder={t.taskTitlePlaceholder}
          />
        </div>
        
        <div className="space-y-2">
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.description}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            placeholder={t.descriptionPlaceholder}
          />
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.project}
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="">{t.noProject}</option>
              {state.projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Building2 size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.customer}
            </label>
            <div className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 ${isRTL ? 'text-right' : 'text-left'}`}>
              {customer ? (
                <span className="text-gray-900 dark:text-white">{customer.name}</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">{t.noCustomer}</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.priority}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="low">{t.priorityLow}</option>
              <option value="medium">{t.priorityMedium}</option>
              <option value="high">{t.priorityHigh}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.dueDate}
            </label>
            <input
              type="date"
              value={formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value) : null })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            />
          </div>
        </div>

        {/* Status Update Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.updateStatus}
          </label>
          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {(['todo', 'in-progress', 'completed'] as Task['status'][]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  formData.status === status
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'todo' ? t.statusTodo : status === 'in-progress' ? t.statusInProgress : t.statusCompleted}
              </button>
            ))}
          </div>
        </div>

        <div className={`flex gap-3 pt-4 ${isRTL ? 'justify-end' : 'justify-start'}`}>
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isDeleting ? (
                <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <LoadingSpinner size="sm" />
                  {locale === 'he' ? 'מוחק...' : 'Deleting...'}
                </span>
              ) : (
                <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Trash2 size={16} />
                  {t.deleteTask}
                </span>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || isDeleting}
          >
            {t.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isDeleting}
            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
          >
            {isSubmitting ? (
              <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <LoadingSpinner size="sm" />
                {locale === 'he' ? 'שומר...' : 'Saving...'}
              </span>
            ) : (
              t.updateTask
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}