import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '../common/Button';
import { TimeEntry, Locale, Customer, Project, Task } from '../../types';
import { useApp } from '../../context/AppContext';

interface TimeEntryFormProps {
  entry?: TimeEntry | null;
  onSubmit: (data: {
    customerId: string;
    projectId: string;
    taskId?: string;
    description: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
  }) => void;
  onCancel: () => void;
}

const translations = {
  en: {
    project: 'Project',
    client: 'Client',
    startDate: 'Start Date',
    startTime: 'Start Time',
    endDate: 'End Date',
    endTime: 'End Time',
    description: 'Work Description',
    descriptionPlaceholder: 'What did you do during this time?',
    hourlyRate: 'Hourly Rate',
    duration: 'Duration',
    totalAmount: 'Total Amount',
    cancel: 'Cancel',
    add: 'Add Entry',
    update: 'Update Entry',
    selectProject: 'Select Project',
    selectClient: 'Select Client',
    invalidTime: 'Invalid time',
    endTimeBeforeStart: 'End time must be after start time',
  },
  he: {
    project: 'פרויקט',
    client: 'לקוח',
    startDate: 'תאריך התחלה',
    startTime: 'שעת התחלה',
    endDate: 'תאריך סיום',
    endTime: 'שעת סיום',
    description: 'תיאור העבודה',
    descriptionPlaceholder: 'מה עשית בזמן הזה?',
    hourlyRate: 'תעריף לשעה',
    duration: 'משך זמן',
    totalAmount: 'סה"כ לתשלום',
    cancel: 'ביטול',
    add: 'הוסף רשומה',
    update: 'עדכן רשומה',
    selectProject: 'בחר פרויקט',
    selectClient: 'בחר לקוח',
    invalidTime: 'זמן לא תקין',
    endTimeBeforeStart: 'זמן הסיום חייב להיות אחרי זמן ההתחלה',
  },
} as const;

function getHourlyRate(customer: Customer): number {
  if (customer.billingModel === 'hourly' && customer.hoursPerMonth > 0) {
    return customer.monthlyRetainer / customer.hoursPerMonth;
  }
  if (customer.hoursPerMonth > 0) {
    return customer.monthlyRetainer / customer.hoursPerMonth;
  }
  return 300; // Default rate
}

export function TimeEntryForm({ entry, onSubmit, onCancel }: TimeEntryFormProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [formData, setFormData] = useState({
    projectId: '',
    customerId: '',
    taskId: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '17:00',
    description: '',
    hourlyRate: 0,
  });

  // Initialize form with entry data if editing
  useEffect(() => {
    if (entry) {
      const startDate = new Date(entry.startTime);
      const endDate = new Date(entry.endTime);
      
      setFormData({
        projectId: entry.projectId,
        customerId: entry.customerId,
        taskId: entry.taskId || '',
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        endTime: format(endDate, 'HH:mm'),
        description: entry.description,
        hourlyRate: entry.hourlyRate,
      });
    }
  }, [entry]);

  // Auto-select customer when project is selected
  useEffect(() => {
    if (formData.projectId) {
      const project = state.projects.find(p => p.id === formData.projectId);
      if (project && project.customerId) {
        setFormData(prev => ({ ...prev, customerId: project.customerId || '' }));
      }
    }
  }, [formData.projectId, state.projects]);

  // Auto-fill hourly rate based on customer
  useEffect(() => {
    if (formData.customerId) {
      const customer = state.customers.find(c => c.id === formData.customerId);
      if (customer) {
        const hourlyRate = getHourlyRate(customer);
        setFormData(prev => ({ ...prev, hourlyRate }));
      }
    }
  }, [formData.customerId, state.customers]);

  // Get filtered projects based on selected customer
  const availableProjects = formData.customerId
    ? state.projects.filter(p => p.customerId === formData.customerId)
    : state.projects;

  // Get filtered tasks based on selected project
  const availableTasks = formData.projectId
    ? state.tasks.filter(t => t.projectId === formData.projectId)
    : [];

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      return null;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    if (durationMinutes <= 0) {
      return null;
    }

    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return { hours, minutes: mins, totalMinutes: durationMinutes };
  };

  const calculateTotalAmount = () => {
    const duration = calculateDuration();
    if (!duration || formData.hourlyRate <= 0) {
      return 0;
    }
    return (duration.totalMinutes / 60) * formData.hourlyRate;
  };

  const duration = calculateDuration();
  const totalAmount = calculateTotalAmount();
  const selectedCustomer = state.customers.find(c => c.id === formData.customerId);
  const currency = selectedCustomer?.currency || '₪';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.projectId) {
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (endDateTime <= startDateTime) {
      alert(t.endTimeBeforeStart);
      return;
    }

    onSubmit({
      customerId: formData.customerId,
      projectId: formData.projectId,
      taskId: formData.taskId || undefined,
      description: formData.description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      hourlyRate: formData.hourlyRate,
    });
  };

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const flexDirection = isRTL ? 'flex-row-reverse' : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.project}
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value, taskId: '' }))}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
            required
          >
            <option value="">{t.selectProject}</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.client}
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, customerId: e.target.value, projectId: '', taskId: '' }));
            }}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
            required
          >
            <option value="">{t.selectClient}</option>
            {state.customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            <Calendar size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.startDate}
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            <Clock size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.startTime}
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            <Calendar size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.endDate}
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            <Clock size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.endTime}
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
            required
          />
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
          {t.description}
        </label>
        <textarea
          placeholder={t.descriptionPlaceholder}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.hourlyRate}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.hourlyRate}
            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.duration}
          </label>
          <div className={`h-12 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center font-mono ${alignStart}`}>
            {duration ? `${duration.hours}:${duration.minutes.toString().padStart(2, '0')}` : t.invalidTime}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.totalAmount}
          </label>
          <div className={`h-12 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center font-semibold ${alignStart}`}>
            {isRTL ? `${totalAmount.toFixed(2)}${currency}` : `${currency}${totalAmount.toFixed(2)}`}
          </div>
        </div>
      </div>

      <div className={`flex justify-end gap-3 pt-4 ${flexDirection}`}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          {t.cancel}
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
        >
          {entry ? t.update : t.add}
        </Button>
      </div>
    </form>
  );
}

