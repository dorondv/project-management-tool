import { useState } from 'react';
import { Calendar, Users, FileText, Target, Flag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { Task, Locale } from '../../types';
import { mockUsers } from '../../data/mockData';
import toast from 'react-hot-toast';

const translations = {
  en: {
    title: 'Create New Task',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'Enter task title',
    description: 'Description',
    descriptionPlaceholder: 'Describe the task',
    project: 'Project',
    selectProject: 'Select a project',
    dueDate: 'Due Date',
    priority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    tags: 'Tags (comma separated)',
    tagsPlaceholder: 'frontend, ui, urgent',
    assignTo: 'Assign To',
    cancel: 'Cancel',
    createTask: 'Create Task',
    errorSelectProject: 'Please select a project',
    successCreated: 'Task created successfully!',
  },
  he: {
    title: 'יצירת משימה חדשה',
    taskTitle: 'כותרת המשימה',
    taskTitlePlaceholder: 'הזן כותרת משימה',
    description: 'תיאור',
    descriptionPlaceholder: 'תאר את המשימה',
    project: 'פרויקט',
    selectProject: 'בחר פרויקט',
    dueDate: 'תאריך יעד',
    priority: 'עדיפות',
    priorityLow: 'נמוכה',
    priorityMedium: 'בינונית',
    priorityHigh: 'גבוהה',
    tags: 'תגיות (מופרדות בפסיק)',
    tagsPlaceholder: 'frontend, ui, דחוף',
    assignTo: 'הקצה ל',
    cancel: 'ביטול',
    createTask: 'צור משימה',
    errorSelectProject: 'אנא בחר פרויקט',
    successCreated: 'המשימה נוצרה בהצלחה!',
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
    projectId: projectId || '',
    assignedTo: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast.error(t.errorSelectProject);
      return;
    }

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
      assignedTo: formData.assignedTo, // Array of user IDs (strings)
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
          description: `created task "${newTask.title}"`,
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
        projectId: projectId || '',
        assignedTo: [],
        priority: 'medium',
        dueDate: '',
        tags: ''
      });
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Failed to create task. Please try again.');
    }
  };

  const handleAssigneeToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
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

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.project}
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              required
            >
              <option value="">{t.selectProject}</option>
              {state.projects
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

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Users size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.assignTo}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mockUsers.map(user => (
                <label key={user.id} className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-2'} p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}>
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(user.id)}
                    onChange={() => handleAssigneeToggle(user.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-3`}>
          <Button type="button" variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit">
            {t.createTask}
          </Button>
        </div>
      </form>
    </Modal>
  );
}