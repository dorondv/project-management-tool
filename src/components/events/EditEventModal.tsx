import { useState, useEffect } from 'react';
import { Calendar, Clock, Repeat, Link as LinkIcon, Users, FolderKanban, CheckSquare, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { Event, Locale } from '../../types';
import toast from 'react-hot-toast';

const translations = {
  en: {
    title: 'Edit Event',
    eventTitle: 'Event Title',
    eventTitlePlaceholder: 'Enter event title',
    description: 'Description',
    descriptionPlaceholder: 'Describe the event',
    startDate: 'Start Date',
    startTime: 'Start Time',
    endDate: 'End Date',
    endTime: 'End Time',
    allDay: 'All Day',
    recurrence: 'Recurrence',
    recurrenceNone: 'None',
    recurrenceDaily: 'Daily',
    recurrenceWeekly: 'Weekly',
    recurrenceMonthly: 'Monthly',
    recurrenceQuarterly: 'Quarterly',
    recurrenceEndDate: 'Recurrence End Date',
    recurrenceCount: 'Recurrence Count',
    recurrenceCountPlaceholder: 'Number of occurrences',
    customer: 'Customer (Optional)',
    selectCustomer: 'Select a customer',
    project: 'Project (Optional)',
    selectProject: 'Select a project',
    task: 'Task (Optional)',
    selectTask: 'Select a task',
    meetingLink: 'Meeting Link (Optional)',
    meetingLinkPlaceholder: 'https://zoom.us/j/... or https://meet.google.com/...',
    cancel: 'Cancel',
    updateEvent: 'Update Event',
    deleteEvent: 'Delete Event',
    confirmDelete: 'Are you sure you want to delete this event?',
    errorTitle: 'Please enter an event title',
    errorStartDate: 'Please select a start date',
    errorEndDate: 'End date must be after start date',
    errorRecurrenceEndDate: 'Recurrence end date must be after start date',
    errorRecurrenceCount: 'Recurrence count must be at least 1',
    errorMeetingLink: 'Please enter a valid URL',
    successUpdated: 'Event updated successfully!',
    successDeleted: 'Event deleted successfully!',
  },
  he: {
    title: 'עריכת אירוע',
    eventTitle: 'כותרת האירוע',
    eventTitlePlaceholder: 'הזן כותרת אירוע',
    description: 'תיאור',
    descriptionPlaceholder: 'תאר את האירוע',
    startDate: 'תאריך התחלה',
    startTime: 'שעת התחלה',
    endDate: 'תאריך סיום',
    endTime: 'שעת סיום',
    allDay: 'כל היום',
    recurrence: 'חזרה',
    recurrenceNone: 'ללא',
    recurrenceDaily: 'יומי',
    recurrenceWeekly: 'שבועי',
    recurrenceMonthly: 'חודשי',
    recurrenceQuarterly: 'רבעוני',
    recurrenceEndDate: 'תאריך סיום חזרה',
    recurrenceCount: 'מספר חזרות',
    recurrenceCountPlaceholder: 'מספר מופעים',
    customer: 'לקוח (אופציונלי)',
    selectCustomer: 'בחר לקוח',
    project: 'פרויקט (אופציונלי)',
    selectProject: 'בחר פרויקט',
    task: 'משימה (אופציונלי)',
    selectTask: 'בחר משימה',
    meetingLink: 'קישור לפגישה (אופציונלי)',
    meetingLinkPlaceholder: 'https://zoom.us/j/... או https://meet.google.com/...',
    cancel: 'ביטול',
    updateEvent: 'עדכן אירוע',
    deleteEvent: 'מחק אירוע',
    confirmDelete: 'האם אתה בטוח שברצונך למחוק את האירוע הזה?',
    errorTitle: 'אנא הזן כותרת אירוע',
    errorStartDate: 'אנא בחר תאריך התחלה',
    errorEndDate: 'תאריך סיום חייב להיות אחרי תאריך התחלה',
    errorRecurrenceEndDate: 'תאריך סיום חזרה חייב להיות אחרי תאריך התחלה',
    errorRecurrenceCount: 'מספר חזרות חייב להיות לפחות 1',
    errorMeetingLink: 'אנא הזן כתובת URL תקינה',
    successUpdated: 'האירוע עודכן בהצלחה!',
    successDeleted: 'האירוע נמחק בהצלחה!',
  },
} as const;

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export function EditEventModal({ isOpen, onClose, event }: EditEventModalProps) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  // Helper to format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper to format time for input
  const formatTimeForInput = (date: Date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Initialize form data from event
  const initializeFormData = (event: Event | null) => {
    if (!event) {
      return {
        title: '',
        description: '',
        startDate: formatDateForInput(new Date()),
        startTime: formatTimeForInput(new Date()),
        endDate: '',
        endTime: '',
        allDay: false,
        recurrenceType: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly',
        recurrenceEndDate: '',
        recurrenceCount: '',
        meetingLink: '',
        customerId: '',
        projectId: '',
        taskId: '',
      };
    }

    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    const recurrenceEndDate = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null;

    return {
      title: event.title,
      description: event.description || '',
      startDate: formatDateForInput(startDate),
      startTime: event.allDay ? formatTimeForInput(new Date()) : formatTimeForInput(startDate),
      endDate: endDate ? formatDateForInput(endDate) : '',
      endTime: endDate && !event.allDay ? formatTimeForInput(endDate) : '',
      allDay: event.allDay,
      recurrenceType: event.recurrenceType,
      recurrenceEndDate: recurrenceEndDate ? formatDateForInput(recurrenceEndDate) : '',
      recurrenceCount: event.recurrenceCount ? String(event.recurrenceCount) : '',
      meetingLink: event.meetingLink || '',
      customerId: event.customerId || '',
      projectId: event.projectId || '',
      taskId: event.taskId || '',
    };
  };

  const [formData, setFormData] = useState(initializeFormData(event));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update form when event changes
  useEffect(() => {
    if (event && isOpen) {
      setFormData(initializeFormData(event));
    }
  }, [event, isOpen]);

  // Calculate default end time (1 hour after start)
  useEffect(() => {
    if (formData.startDate && formData.startTime && !formData.endDate && !formData.endTime && !formData.allDay) {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // Add 1 hour
      setFormData(prev => ({
        ...prev,
        endDate: end.toISOString().split('T')[0],
        endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
      }));
    }
  }, [formData.startDate, formData.startTime, formData.allDay]);

  // Filter projects by selected customer
  const filteredProjects = formData.customerId
    ? state.projects.filter(p => p.customerId === formData.customerId)
    : state.projects;

  // Filter tasks by selected project
  const filteredTasks = formData.projectId
    ? state.tasks.filter(t => t.projectId === formData.projectId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validation
    if (!formData.title.trim()) {
      toast.error(t.errorTitle);
      return;
    }

    if (!formData.startDate) {
      toast.error(t.errorStartDate);
      return;
    }

    // Validate end date (only for non-recurring events)
    if (formData.recurrenceType === 'none' && formData.endDate && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        toast.error(t.errorEndDate);
        return;
      }
    }

    // Validate recurrence end date
    if (formData.recurrenceType !== 'none' && formData.recurrenceEndDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.recurrenceEndDate);
      if (end < start) {
        toast.error(t.errorRecurrenceEndDate);
        return;
      }
    }

    // Validate recurrence count
    if (formData.recurrenceCount && parseInt(formData.recurrenceCount) < 1) {
      toast.error(t.errorRecurrenceCount);
      return;
    }

    // Validate meeting link
    if (formData.meetingLink) {
      try {
        new URL(formData.meetingLink);
      } catch {
        toast.error(t.errorMeetingLink);
        return;
      }
    }

    setIsSubmitting(true);

    // Build start and end datetime
    const startDateTime = formData.allDay
      ? new Date(formData.startDate)
      : new Date(`${formData.startDate}T${formData.startTime}`);

    // For recurring events, endDate is not used (recurrenceEndDate is used instead)
    // For non-recurring events, calculate endDateTime
    const endDateTime = formData.recurrenceType === 'none'
      ? (formData.allDay
          ? (formData.endDate ? new Date(formData.endDate) : null)
          : (formData.endDate && formData.endTime
              ? new Date(`${formData.endDate}T${formData.endTime}`)
              : null))
      : null;

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime ? endDateTime.toISOString() : null,
      allDay: formData.allDay,
      recurrenceType: formData.recurrenceType,
      recurrenceEndDate: formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate).toISOString() : null,
      recurrenceCount: formData.recurrenceCount ? parseInt(formData.recurrenceCount) : null,
      meetingLink: formData.meetingLink.trim() || null,
      userId: state.user!.id,
      customerId: formData.customerId || null,
      projectId: formData.projectId || null,
      taskId: formData.taskId || null,
    };

    if (!event) return;

    try {
      const { api } = await import('../../utils/api');
      const updatedEvent = await api.events.update(event.id, eventData);

      // Transform to Event type
      const updated: Event = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        startDate: new Date(updatedEvent.startDate),
        endDate: updatedEvent.endDate ? new Date(updatedEvent.endDate) : null,
        allDay: updatedEvent.allDay,
        recurrenceType: updatedEvent.recurrenceType,
        recurrenceEndDate: updatedEvent.recurrenceEndDate ? new Date(updatedEvent.recurrenceEndDate) : null,
        recurrenceCount: updatedEvent.recurrenceCount,
        meetingLink: updatedEvent.meetingLink,
        userId: updatedEvent.userId,
        customerId: updatedEvent.customerId,
        projectId: updatedEvent.projectId,
        taskId: updatedEvent.taskId,
        createdAt: new Date(updatedEvent.createdAt),
        updatedAt: new Date(updatedEvent.updatedAt),
        customer: updatedEvent.customer || null,
        project: updatedEvent.project || null,
        task: updatedEvent.task || null,
        user: updatedEvent.user || null,
      };

      dispatch({ type: 'UPDATE_EVENT', payload: updated });
      toast.success(t.successUpdated);
      onClose();
    } catch (error: any) {
      console.error('Failed to update event:', error);
      toast.error(error.message || 'Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    if (!confirm(t.confirmDelete)) {
      return;
    }

    setIsDeleting(true);

    try {
      const { api } = await import('../../utils/api');
      await api.events.delete(event.id);
      dispatch({ type: 'DELETE_EVENT', payload: event.id });
      toast.success(t.successDeleted);
      onClose();
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      toast.error(error.message || 'Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!event) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title} size="lg" dir={isRTL ? 'rtl' : 'ltr'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Calendar size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.eventTitle}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.eventTitlePlaceholder}
              required
            />
          </div>

          {/* Description */}
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
            />
          </div>

          {/* Start Date */}
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

          {/* Start Time */}
          {!formData.allDay && (
            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                <Clock size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.startTime}
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          )}

          {/* End Date - Only show for non-recurring events */}
          {formData.recurrenceType === 'none' && (
            <>
              <div>
                <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.endDate}
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* End Time */}
              {!formData.allDay && formData.endDate && (
                <div>
                  <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <Clock size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t.endTime}
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </>
          )}

          {/* All Day Toggle */}
          <div className="md:col-span-2">
            <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.allDay}</span>
            </label>
          </div>

          {/* Recurrence Type */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Repeat size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.recurrence}
            </label>
            <select
              value={formData.recurrenceType}
              onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value as any })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="none">{t.recurrenceNone}</option>
              <option value="daily">{t.recurrenceDaily}</option>
              <option value="weekly">{t.recurrenceWeekly}</option>
              <option value="monthly">{t.recurrenceMonthly}</option>
              <option value="quarterly">{t.recurrenceQuarterly}</option>
            </select>
          </div>

          {/* Recurrence End Date */}
          {formData.recurrenceType !== 'none' && (
            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.recurrenceEndDate}
              </label>
              <input
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Recurrence Count */}
          {formData.recurrenceType !== 'none' && (
            <div>
              <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.recurrenceCount}
              </label>
              <input
                type="number"
                min="1"
                value={formData.recurrenceCount}
                onChange={(e) => setFormData({ ...formData, recurrenceCount: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.recurrenceCountPlaceholder}
              />
            </div>
          )}

          {/* Customer */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Users size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.customer}
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value, projectId: '', taskId: '' })}
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

          {/* Project */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <FolderKanban size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.project}
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value, taskId: '' })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              disabled={!formData.customerId && filteredProjects.length > 0}
            >
              <option value="">{t.selectProject}</option>
              {filteredProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Task */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <CheckSquare size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.task}
            </label>
            <select
              value={formData.taskId}
              onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              disabled={!formData.projectId}
            >
              <option value="">{t.selectTask}</option>
              {filteredTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Link */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <LinkIcon size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.meetingLink}
            </label>
            <input
              type="url"
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.meetingLinkPlaceholder}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className={`flex ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} gap-3`}>
          {isRTL ? (
            <>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2 flex-row-reverse">
                    <LoadingSpinner size="sm" />
                    מעדכן...
                  </span>
                ) : (
                  t.updateEvent
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2 flex-row-reverse">
                    <LoadingSpinner size="sm" />
                    מוחק...
                  </span>
                ) : (
                  <>
                    <Trash2 size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                    {t.deleteEvent}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isDeleting}>
                {t.cancel}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Deleting...
                  </span>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    {t.deleteEvent}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isDeleting}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Updating...
                  </span>
                ) : (
                  t.updateEvent
                )}
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}

