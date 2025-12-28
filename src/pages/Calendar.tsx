import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatDate } from '../utils/dateUtils';
import { getPriorityColor } from '../utils/colorUtils';
import { Locale, Event } from '../types';
import { CreateEventModal } from '../components/events/CreateEventModal';
import { EditEventModal } from '../components/events/EditEventModal';

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  addEvent: string;
  today: string;
  upcomingTasks: string;
  due: string;
  more: string;
  dayNames: string[];
  priorities: {
    high: string;
    medium: string;
    low: string;
  };
}> = {
  en: {
    pageTitle: 'Calendar',
    pageSubtitle: 'View your tasks and deadlines in calendar format',
    addEvent: 'Add Event',
    today: 'Today',
    upcomingTasks: 'Upcoming Tasks',
    due: 'Due',
    more: 'more',
    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    priorities: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
  },
  he: {
    pageTitle: 'לוח שנה',
    pageSubtitle: 'צפה במשימות והמועדים שלך בפורמט לוח שנה',
    addEvent: 'הוסף אירוע',
    today: 'היום',
    upcomingTasks: 'משימות קרובות',
    due: 'מועד',
    more: 'נוספות',
    dayNames: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
    priorities: {
      high: 'גבוהה',
      medium: 'בינונית',
      low: 'נמוכה',
    },
  },
};

export default function Calendar() {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (date: Date) => {
    return state.tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForDate = (date: Date) => {
    return state.events.filter(event => {
      // Normalize dates to compare only dates (ignore time)
      const normalizeDate = (d: Date) => {
        const normalized = new Date(d);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
      };

      const normalizedDate = normalizeDate(date);
      const normalizedStartDate = normalizeDate(event.startDate);

      if (event.recurrenceType === 'none') {
        return normalizedStartDate.getTime() === normalizedDate.getTime();
      }

      // Check if date is before start date
      if (normalizedDate < normalizedStartDate) {
        return false;
      }

      // Check if date is after recurrence end date
      if (event.recurrenceEndDate) {
        const normalizedEndDate = normalizeDate(event.recurrenceEndDate);
        if (normalizedDate > normalizedEndDate) {
          return false;
        }
      }

      // Calculate if this date matches the recurrence pattern
      const daysDiff = Math.floor((normalizedDate.getTime() - normalizedStartDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (event.recurrenceType) {
        case 'daily':
          return true; // Every day
        case 'weekly':
          return daysDiff % 7 === 0; // Same day of week
        case 'monthly':
          return normalizedDate.getDate() === normalizedStartDate.getDate(); // Same day of month
        case 'quarterly':
          // Same day, every 3 months
          const monthsDiff = (normalizedDate.getFullYear() - normalizedStartDate.getFullYear()) * 12 +
            (normalizedDate.getMonth() - normalizedStartDate.getMonth());
          return monthsDiff >= 0 && monthsDiff % 3 === 0 && normalizedDate.getDate() === normalizedStartDate.getDate();
        default:
          return false;
      }
    });
  };

  const getCustomerNameForTask = (task: any) => {
    const project = state.projects.find(p => p.id === task.projectId);
    if (project && project.customerId) {
      const customer = state.customers.find(c => c.id === project.customerId);
      return customer?.name || '';
    }
    return '';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });

  const days = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const alignStart = isRTL ? 'text-right' : 'text-left';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div className={alignStart}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.pageSubtitle}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Calendar Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {isRTL ? (
            <>
              {/* RTL: Buttons on left, Month/Year on right */}
              <div className="flex items-center flex-row-reverse space-x-reverse space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  icon={<ChevronLeft size={16} />}
                  className="flex-row-reverse"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  {t.today}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  icon={<ChevronRight size={16} />}
                  className="flex-row-reverse"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateEventModalOpen(true)}
                  icon={<Plus size={16} />}
                  className="flex-row-reverse"
                >
                  {t.addEvent}
                </Button>
              </div>
              <h2 className={`text-xl font-semibold text-gray-900 dark:text-white text-right`}>
                {monthYear}
              </h2>
            </>
          ) : (
            <>
              {/* LTR: Month/Year on left, Buttons on right */}
              <h2 className={`text-xl font-semibold text-gray-900 dark:text-white text-left`}>
                {monthYear}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateEventModalOpen(true)}
                  icon={<Plus size={16} />}
                >
                  {t.addEvent}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  icon={<ChevronLeft size={16} />}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  {t.today}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  icon={<ChevronRight size={16} />}
                />
              </div>
            </>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {t.dayNames.map(day => (
              <div key={day} className={`p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400 ${alignStart}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-24" />;
              }

              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const tasksForDay = getTasksForDate(date);
              const eventsForDay = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const totalItems = tasksForDay.length + eventsForDay.length;
              const displayItems = Math.min(2, totalItems);

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`h-24 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${alignStart} ${
                    isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {/* Display tasks */}
                    {tasksForDay.slice(0, displayItems).map(task => {
                      const customerName = getCustomerNameForTask(task);
                      return (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded truncate ${getPriorityColor(task.priority)} ${alignStart} cursor-pointer hover:opacity-80`}
                          title={customerName ? `${task.title} - ${customerName}` : task.title}
                        >
                          {task.title}
                          {customerName && (
                            <span className="text-gray-600 dark:text-gray-400 ml-1">
                              - {customerName}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {/* Display events */}
                    {eventsForDay.slice(0, displayItems - tasksForDay.length).map(event => {
                      const eventTime = event.allDay ? '' : new Date(event.startDate).toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                          }}
                          className={`text-xs p-1 rounded truncate bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 ${alignStart} cursor-pointer hover:opacity-80`}
                          title={event.title}
                        >
                          {eventTime && <span className="font-medium">{eventTime} </span>}
                          {event.title}
                        </div>
                      );
                    })}
                    {totalItems > 2 && (
                      <div className={`text-xs text-gray-500 dark:text-gray-400 ${alignStart}`}>
                        +{totalItems - 2} {t.more}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Tasks & Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.upcomingTasks}
        </h3>
        <div className="space-y-3">
          {(() => {
            // Get upcoming tasks
            const upcomingTasks = state.tasks
              .filter(task => task.status !== 'completed')
              .map(task => ({
                type: 'task' as const,
                id: task.id,
                title: task.title,
                date: new Date(task.dueDate),
                priority: task.priority,
                customerName: getCustomerNameForTask(task),
                data: task,
              }));

            // Get upcoming events (next 30 days)
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const upcomingEvents = state.events
              .filter(event => {
                const eventDate = new Date(event.startDate);
                return eventDate >= now && eventDate <= thirtyDaysFromNow;
              })
              .map(event => ({
                type: 'event' as const,
                id: event.id,
                title: event.title,
                date: new Date(event.startDate),
                allDay: event.allDay,
                data: event,
              }));

            // Combine and sort by date
            const combined = [...upcomingTasks, ...upcomingEvents]
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 5);

            return (isRTL ? [...combined].reverse() : combined).map((item, index) => {
              if (item.type === 'task') {
                return (
                  <motion.div
                    key={`task-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <CalendarIcon size={16} className="text-primary-500 dark:text-primary-300" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                          {item.title}
                        </p>
                        <p className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {formatDate(item.date, locale)}
                          {item.customerName ? ` • ${item.customerName}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getPriorityColor(item.priority)}>
                      {t.priorities[item.priority] || item.priority}
                    </Badge>
                  </motion.div>
                );
              } else {
                const eventTime = item.allDay 
                  ? '' 
                  : item.date.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <motion.div
                    key={`event-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setEditingEvent(item.data)}
                    className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <CalendarIcon size={16} className="text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium text-purple-900 dark:text-purple-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {item.title}
                        </p>
                        <p className={`text-xs text-purple-600 dark:text-purple-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {formatDate(item.date, locale)}
                          {eventTime ? ` • ${eventTime}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                      {locale === 'he' ? 'אירוע' : 'Event'}
                    </Badge>
                  </motion.div>
                );
              }
            });
          })()}
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
      />
      <EditEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
      />
    </div>
  );
}
