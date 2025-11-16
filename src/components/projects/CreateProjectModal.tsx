import { useState } from 'react';
import { Calendar, Users, FileText, Target } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { Project, Locale } from '../../types';
import toast from 'react-hot-toast';

const translations = {
  en: {
    title: 'Create New Project',
    projectTitle: 'Project Title',
    description: 'Description',
    startDate: 'Start Date',
    endDate: 'End Date',
    priority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    cancel: 'Cancel',
    createProject: 'Create Project',
  },
  he: {
    title: 'יצירת פרויקט חדש',
    projectTitle: 'כותרת הפרויקט',
    description: 'תיאור',
    startDate: 'תאריך התחלה',
    endDate: 'תאריך סיום',
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
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    members: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: 'planning' as const,
      progress: 0,
      priority: formData.priority,
      createdBy: state.user!.id,
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
        createdAt: new Date(createdProject.createdAt),
        updatedAt: new Date(createdProject.updatedAt)
      };

      // Add to local state
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        priority: 'medium',
        members: []
      });
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error.message || 'Failed to create project. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <FileText size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.projectTitle}
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
          <Button type="button" variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit">
            {t.createProject}
          </Button>
        </div>
      </form>
    </Modal>
  );
}