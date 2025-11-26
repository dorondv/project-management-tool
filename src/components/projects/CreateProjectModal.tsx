import { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Target, Building2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { Project, Locale } from '../../types';
import toast from 'react-hot-toast';

const translations = {
  en: {
    title: 'Create New Project',
    projectTitle: 'Project Title',
    client: 'Client',
    selectClient: 'Select Client',
    description: 'Description',
    startDate: 'Start Date',
    endDate: 'End Date',
    status: 'Status',
    selectStatus: 'Select Status',
    statusPlanning: 'Planning',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusOnHold: 'On Hold',
    priority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    cancel: 'Cancel',
    createProject: 'Create Project',
  },
  he: {
    title: 'יצירת פרויקט חדש',
    projectTitle: 'שם הפרויקט',
    client: 'לקוח',
    selectClient: 'בחר לקוח',
    description: 'תיאור הפרויקט',
    startDate: 'תאריך התחלה',
    endDate: 'תאריך סיום',
    status: 'סטטוס',
    selectStatus: 'בחר סטטוס',
    statusPlanning: 'בתכנון',
    statusInProgress: 'בתהליך',
    statusCompleted: 'הושלם',
    statusOnHold: 'בהמתנה',
    priority: 'עדיפות',
    priorityLow: 'נמוכה',
    priorityMedium: 'בינונית',
    priorityHigh: 'גבוהה',
    cancel: 'ביטול',
    createProject: 'צור פרויקט',
  },
} as const;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCustomerId?: string;
  onProjectCreated?: (projectId: string) => void;
}

export function CreateProjectModal({ isOpen, onClose, preSelectedCustomerId, onProjectCreated }: CreateProjectModalProps) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning' as 'planning' | 'in-progress' | 'completed' | 'on-hold',
    priority: 'medium' as 'low' | 'medium' | 'high',
    customerId: '',
    members: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set pre-selected customer when modal opens
  useEffect(() => {
    if (isOpen && preSelectedCustomerId) {
      setFormData(prev => ({ ...prev, customerId: preSelectedCustomerId }));
    }
  }, [isOpen, preSelectedCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    
    const projectData = {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      progress: 0,
      priority: formData.priority,
      createdBy: state.user!.id,
      customerId: formData.customerId || undefined,
      members: formData.members, // Array of user IDs
    };

    try {
      // Create project via API first
      const { api } = await import('../../utils/api');
      const createdProject = await api.projects.create(projectData);
      
      // Transform the API response to match our Project type
      const newProject: Project = {
        id: createdProject.id,
        title: createdProject.title,
        description: createdProject.description,
        startDate: new Date(createdProject.startDate),
        endDate: new Date(createdProject.endDate),
        status: createdProject.status,
        progress: createdProject.progress,
        priority: createdProject.priority,
        members: createdProject.members || [],
        tasks: createdProject.tasks || [],
        createdBy: createdProject.createdBy,
        customerId: createdProject.customerId,
        customer: createdProject.customer,
        createdAt: new Date(createdProject.createdAt),
        updatedAt: new Date(createdProject.updatedAt)
      };

      // Add to local state
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      
      // Add activity
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: Date.now().toString(),
          type: 'project_created',
          description: `created project "${newProject.title}"`,
          userId: state.user!.id,
          user: state.user!,
          projectId: newProject.id,
          createdAt: new Date()
        }
      });
      
      onClose();
      
      // Call callback if provided with the new project ID
      if (onProjectCreated) {
        onProjectCreated(newProject.id);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'planning',
        priority: 'medium',
        customerId: preSelectedCustomerId || '',
        members: []
      });
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error.message || 'Failed to create project. Please try again.');
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
              {t.projectTitle} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Building2 size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.client} *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              disabled={!!preSelectedCustomerId}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'} ${preSelectedCustomerId ? 'opacity-60 cursor-not-allowed' : ''}`}
              required
            >
              <option value="">{t.selectClient}</option>
              {state.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
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
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Calendar size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.startDate}
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.endDate}
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Target size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.status}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planning' | 'in-progress' | 'completed' | 'on-hold' })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="planning">{t.statusPlanning}</option>
              <option value="in-progress">{t.statusInProgress}</option>
              <option value="completed">{t.statusCompleted}</option>
              <option value="on-hold">{t.statusOnHold}</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Target size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
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
        </div>

        <div className={`flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-3`}>
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
              <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <LoadingSpinner size="sm" />
                {isRTL ? 'יוצר...' : 'Creating...'}
              </span>
            ) : (
              t.createProject
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}