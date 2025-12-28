import { useState, useEffect } from 'react';
import { Calendar, FileText, Target, Flag, Users } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { Task, Locale } from '../../types';
import toast from 'react-hot-toast';

const translations = {
  en: {
    title: 'Create New Task',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'Enter task title',
    description: 'Description',
    descriptionPlaceholder: 'Describe the task',
    customer: 'Customer (Optional)',
    selectCustomer: 'Select a customer',
    project: 'Project',
    selectProject: 'Select a project',
    dueDate: 'Due Date',
    priority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    tags: 'Tags (comma separated)',
    tagsPlaceholder: 'frontend, ui, urgent',
    cancel: 'Cancel',
    createTask: 'Create Task',
    errorSelectProject: 'Please select a project',
    successCreated: 'Task created successfully!',
    activityCreated: 'created task "{title}"',
  },
  he: {
    title: 'יצירת משימה חדשה',
    taskTitle: 'כותרת המשימה',
    taskTitlePlaceholder: 'הזן כותרת משימה',
    description: 'תיאור',
    descriptionPlaceholder: 'תאר את המשימה',
    customer: 'לקוח (אופציונלי)',
    selectCustomer: 'בחר לקוח',
    project: 'פרויקט',
    selectProject: 'בחר פרויקט',
    dueDate: 'תאריך יעד',
    priority: 'עדיפות',
    priorityLow: 'נמוכה',
    priorityMedium: 'בינונית',
    priorityHigh: 'גבוהה',
    tags: 'תגיות (מופרדות בפסיק)',
    tagsPlaceholder: 'frontend, ui, דחוף',
    cancel: 'ביטול',
    createTask: 'צור משימה',
    errorSelectProject: 'אנא בחר פרויקט',
    successCreated: 'המשימה נוצרה בהצלחה!',
    activityCreated: 'נוצרה משימה "{title}"',
  },
} as const;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export function CreateTaskModal({ isOpen, onClose, projectId }: CreateTaskModalProps) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: '',
    projectId: projectId || '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill customer when projectId prop is provided
  useEffect(() => {
    if (projectId && !formData.customerId) {
      const project = state.projects.find(p => p.id === projectId);
      if (project?.customerId) {
        setFormData(prev => ({ ...prev, customerId: project.customerId || '' }));
      }
    }
  }, [projectId, state.projects]);

  // Filter projects by selected customer
  const filteredProjects = formData.customerId
    ? state.projects.filter(p => p.customerId === formData.customerId)
    : state.projects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    if (!formData.projectId) {
      toast.error(t.errorSelectProject);
      return;
    }
    
    setIsSubmitting(true);

    // Validate projectId is a UUID (not a timestamp)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(formData.projectId)) {
      console.error('❌ CreateTaskModal: Invalid projectId format:', formData.projectId);
      toast.error('Invalid project selected. Please select a valid project.');
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      projectId: formData.projectId,
      assignedTo: [state.user!.id], // Auto-assign to current user
      status: 'todo' as const,
      priority: formData.priority,
      dueDate: formData.dueDate, // Should be ISO string format
      createdBy: state.user!.id,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    console.log('🔵 CreateTaskModal: Sending task data:', taskData);

    try {
      // Create task via API first
      const { api } = await import('../../utils/api');
      const createdTask = await api.tasks.create(taskData);
      
      // Transform the API response to match our Task type
      const newTask: Task = {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description,
        projectId: createdTask.projectId,
        assignedTo: createdTask.assignedTo || [],
        status: createdTask.status,
        priority: createdTask.priority,
        dueDate: new Date(createdTask.dueDate),
        createdBy: createdTask.createdBy,
        createdAt: new Date(createdTask.createdAt),
        updatedAt: new Date(createdTask.updatedAt),
        comments: createdTask.comments || [],
        attachments: createdTask.attachments || [],
        tags: createdTask.tags || []
      };

      // Add to local state (this will also sync to localStorage)
      dispatch({ type: 'ADD_TASK', payload: newTask });
      
      // Add activity
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: Date.now().toString(),
          type: 'task_created',
          description: t.activityCreated.replace('{title}', newTask.title),
          userId: state.user!.id,
          user: state.user!,
          projectId: newTask.projectId,
          taskId: newTask.id,
          createdAt: new Date()
        }
      });

      toast.success(t.successCreated);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        customerId: '',
        projectId: projectId || '',
        priority: 'medium',
        dueDate: '',
        tags: ''
      });
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <FileText size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.taskTitle}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.taskTitlePlaceholder}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.description}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.descriptionPlaceholder}
              required
            />
          </div>

          {/* Customer Dropdown */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Users size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.customer}
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => {
                const selectedCustomerId = e.target.value;
                const currentProject = state.projects.find(p => p.id === formData.projectId);
                // Clear project if it doesn't belong to the newly selected customer
                const shouldClearProject = selectedCustomerId && currentProject?.customerId !== selectedCustomerId;
                setFormData({ 
                  ...formData, 
                  customerId: selectedCustomerId,
                  projectId: shouldClearProject ? '' : formData.projectId
                });
              }}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="">{t.selectCustomer}</option>
              {state.customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Dropdown */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.project}
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => {
                const selectedProjectId = e.target.value;
                const selectedProject = state.projects.find(p => p.id === selectedProjectId);
                setFormData({ 
                  ...formData, 
                  projectId: selectedProjectId,
                  // Auto-fill customer from project if project has a customer
                  customerId: selectedProject?.customerId || formData.customerId
                });
              }}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              required
              disabled={formData.customerId && filteredProjects.length === 0}
            >
              <option value="">{t.selectProject}</option>
              {filteredProjects
                .filter(project => {
                  // Only show projects with valid UUID format
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  return uuidRegex.test(project.id);
                })
                .map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
            </select>
            {formData.customerId && filteredProjects.length === 0 && (
              <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {locale === 'he' ? 'אין פרויקטים עבור לקוח זה' : 'No projects available for this customer'}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Calendar size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.dueDate}
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Flag size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.priority}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="low">{t.priorityLow}</option>
              <option value="medium">{t.priorityMedium}</option>
              <option value="high">{t.priorityHigh}</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.tags}
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.tagsPlaceholder}
            />
          </div>
        </div>

        <div className={`flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-3`}>
          {isRTL ? (
            <>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 flex-row-reverse">
                    <LoadingSpinner size="sm" />
                    יוצר...
                  </span>
                ) : (
                  t.createTask
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t.cancel}
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t.cancel}
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Creating...
                  </span>
                ) : (
                  t.createTask
                )}
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}