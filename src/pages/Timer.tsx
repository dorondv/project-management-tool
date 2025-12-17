import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Pause, Plus, FileText, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { TimeEntry, Locale, Customer } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { timerService } from '../utils/timerService';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { TimeEntryForm } from '../components/timer/TimeEntryForm';
import { ClientReportModal } from '../components/timer/ClientReportModal';
import { Modal } from '../components/common/Modal';
import { Clock as ClockIcon } from 'lucide-react';

const translations = {
  en: {
    title: 'Timer',
    subtitle: 'Start tracking your time on projects',
    selectCustomer: 'Select Customer',
    selectProject: 'Select Project',
    selectTask: 'Select Task',
    allCustomers: 'All Customers',
    noSpecificTask: 'No specific task',
    whatAreYouDoing: 'What are you doing now?',
    start: 'Start',
    stop: 'Stop',
    selectProjectAndCustomer: 'Select a project and customer to start time tracking',
    noProjectsWarning: 'No projects in the system',
    noProjectsMessage: 'To start tracking time, first create a client and project on the appropriate pages.',
    timeLog: 'Time Entry Log',
    currentMonth: 'Current Month',
    addEntry: 'Add Entry',
    addTimeRecord: 'Add Time Record',
    generateReport: 'Generate Client Hours Report',
    demoData: 'Demo Data',
    client: 'Client',
    project: 'Project',
    startTime: 'Start',
    endTime: 'End',
    duration: 'Duration',
    income: 'Income',
    noEntries: 'No time entries found',
    noEntriesSubtitle: 'Start tracking time to see entries here',
    currentCost: 'Current Cost',
  },
  he: {
    title: 'מעקב זמן',
    subtitle: 'התחל לעקוב אחר הזמן שלך בפרויקטים',
    selectCustomer: 'בחר לקוח',
    selectProject: 'בחר פרויקט',
    selectTask: 'בחר משימה',
    allCustomers: 'כל הלקוחות',
    noSpecificTask: 'ללא משימה ספציפית',
    whatAreYouDoing: 'מה אתה עושה עכשיו?',
    start: 'התחל',
    stop: 'עצור',
    selectProjectAndCustomer: 'בחר פרויקט ולקוח כדי להתחיל מעקב זמן',
    noProjectsWarning: 'אין פרויקטים במערכת',
    noProjectsMessage: 'כדי להתחיל לעקוב אחר זמן, צור קודם לקוח ופרויקט בעמודים המתאימים.',
    timeLog: 'יומן רישומי זמן',
    currentMonth: 'חודש נוכחי',
    addEntry: 'הוסף רישום',
    addTimeRecord: 'הוספת רישום זמן',
    generateReport: 'הפקת דוח שעות ללקוח',
    demoData: 'נתוני דמה',
    client: 'לקוח',
    project: 'פרויקט',
    startTime: 'התחלה',
    endTime: 'סיום',
    duration: 'משך זמן',
    income: 'הכנסה',
    noEntries: 'לא נמצאו רישומי זמן',
    noEntriesSubtitle: 'התחל לעקוב אחר זמן כדי לראות רישומים כאן',
    currentCost: 'עלות נוכחית',
  },
} as const;

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function formatCurrency(amount: number, currency: string, locale: Locale): string {
  if (locale === 'he') {
    return `${currency}${amount.toFixed(2)}`;
  }
  return `${currency}${amount.toFixed(2)}`;
}

function getHourlyRate(customer: Customer): number {
  if (customer.billingModel === 'hourly' && customer.hoursPerMonth > 0) {
    return customer.monthlyRetainer / customer.hoursPerMonth;
  }
  if (customer.hoursPerMonth > 0) {
    return customer.monthlyRetainer / customer.hoursPerMonth;
  }
  return 300; // Default rate
}

export default function Timer() {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Get timer state from context
  const activeTimer = state.activeTimer;
  const elapsedSeconds = state.timerElapsedSeconds;
  const isRunning = activeTimer?.isRunning || false;
  const isPaused = activeTimer?.isPaused || false;

  // Restore timer state when active timer exists
  useEffect(() => {
    if (activeTimer) {
      setSelectedCustomerId(activeTimer.customerId);
      setSelectedProjectId(activeTimer.projectId);
      setSelectedTaskId(activeTimer.taskId || '');
      setDescription(activeTimer.description);
    }
  }, [activeTimer?.id]); // Only restore when timer ID changes

  // Get filtered projects based on selected customer
  const availableProjects = useMemo(() => {
    if (!selectedCustomerId) return [];
    return state.projects.filter(project => project.customerId === selectedCustomerId);
  }, [state.projects, selectedCustomerId]);

  // Get filtered tasks based on selected project
  const availableTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return state.tasks.filter(task => task.projectId === selectedProjectId);
  }, [selectedProjectId, state.tasks]);

  // Get selected customer
  const selectedCustomer = useMemo(() => {
    return state.customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, state.customers]);

  // Calculate current cost based on elapsed time
  const currentCost = useMemo(() => {
    if (!selectedCustomer || (!isRunning && !isPaused) || elapsedSeconds === 0) {
      return 0;
    }
    const hourlyRate = getHourlyRate(selectedCustomer);
    const hours = elapsedSeconds / 3600;
    return hours * hourlyRate;
  }, [selectedCustomer, elapsedSeconds, isRunning, isPaused]);

  // Update description in timer service when it changes
  useEffect(() => {
    if (isRunning && description !== activeTimer?.description) {
      timerService.updateDescription(description);
    }
  }, [description, isRunning, activeTimer]);

  // Filter time entries by month
  const filteredTimeEntries = useMemo(() => {
    let entries = state.timeEntries;
    
    if (selectedMonth === 'current') {
      const now = new Date();
      entries = entries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate.getMonth() === now.getMonth() && 
               entryDate.getFullYear() === now.getFullYear();
      });
    } else if (selectedMonth && selectedMonth !== 'current') {
      // Handle format: "month-year" (e.g., "11-2024")
      const [month, year] = selectedMonth.split('-').map(Number);
      if (!isNaN(month) && !isNaN(year)) {
        entries = entries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entryDate.getMonth() === month && 
                 entryDate.getFullYear() === year;
        });
      }
    }
    
    return entries.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [state.timeEntries, selectedMonth]);

  const handleStart = () => {
    if (!selectedCustomerId || !selectedProjectId) {
      toast.error(isRTL ? 'בחר לקוח ופרויקט' : 'Please select a customer and project');
      return;
    }

    if (!state.user?.id) {
      toast.error(isRTL ? 'משתמש לא מזוהה' : 'User not identified');
      return;
    }

    timerService.startTimer(
      selectedCustomerId,
      selectedProjectId,
      selectedTaskId || undefined,
      description || t.whatAreYouDoing,
      state.user.id
    );

    toast.success(isRTL ? 'טיימר התחיל' : 'Timer started');
  };

  const handlePause = () => {
    if (!isRunning || !activeTimer) {
      return;
    }
    timerService.pauseTimer();
    toast.success(isRTL ? 'טיימר הושהה' : 'Timer paused');
  };

  const handleResume = () => {
    if (!isPaused || !activeTimer) {
      return;
    }
    timerService.resumeTimer();
    toast.success(isRTL ? 'טיימר חודש' : 'Timer resumed');
  };

  const handleStop = async () => {
    if ((!isRunning && !isPaused) || !activeTimer || !selectedCustomer) {
      return;
    }

    const hourlyRate = getHourlyRate(selectedCustomer);
    const timerLog = timerService.stopTimer(hourlyRate);

    if (timerLog) {
      try {
        // Save to database first
        const { api } = await import('../utils/api');
        const timeEntryData = {
          customerId: timerLog.customerId,
          projectId: timerLog.projectId,
          taskId: timerLog.taskId || undefined,
          description: timerLog.description,
          startTime: timerLog.startTime.toISOString(),
          endTime: timerLog.endTime.toISOString(),
          hourlyRate: timerLog.hourlyRate,
          userId: timerLog.userId,
        };

        const createdEntry = await api.timeEntries.create(timeEntryData) as any;

        // Convert API response to TimeEntry format
        const newEntry: TimeEntry = {
          id: createdEntry.id,
          customerId: createdEntry.customerId,
          projectId: createdEntry.projectId,
          taskId: createdEntry.taskId,
          description: createdEntry.description,
          startTime: new Date(createdEntry.startTime),
          endTime: new Date(createdEntry.endTime),
          duration: createdEntry.duration,
          hourlyRate: createdEntry.hourlyRate,
          income: createdEntry.income,
          userId: createdEntry.userId,
          createdAt: new Date(createdEntry.createdAt),
          updatedAt: new Date(createdEntry.updatedAt),
        };

        // Add to local state (this will also sync to localStorage)
        dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
        toast.success(isRTL ? 'רישום זמן נשמר בהצלחה' : 'Time entry saved successfully');

        // Reset form
        setSelectedCustomerId('');
        setSelectedProjectId('');
        setSelectedTaskId('');
        setDescription('');
      } catch (error: any) {
        console.error('Failed to save time entry:', error);
        toast.error(error.message || (isRTL ? 'שגיאה בשמירת רישום זמן' : 'Failed to save time entry. Please try again.'));
      }
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsTimeEntryModalOpen(true);
  };

  const handleTimeEntrySubmit = async (data: {
    customerId: string;
    projectId: string;
    taskId?: string;
    description: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
  }) => {
    try {
      if (!state.user?.id) {
        toast.error(isRTL ? 'משתמש לא מזוהה' : 'User not identified');
        return;
      }

      const { api } = await import('../utils/api');
      const timeEntryData = {
        customerId: data.customerId,
        projectId: data.projectId,
        taskId: data.taskId,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyRate: data.hourlyRate,
        userId: state.user.id,
      };

      if (editingEntry) {
        // Update existing entry
        const updatedEntry = await api.timeEntries.update(editingEntry.id, timeEntryData) as any;
        const newEntry: TimeEntry = {
          id: updatedEntry.id,
          customerId: updatedEntry.customerId,
          projectId: updatedEntry.projectId,
          taskId: updatedEntry.taskId,
          description: updatedEntry.description,
          startTime: new Date(updatedEntry.startTime),
          endTime: new Date(updatedEntry.endTime),
          duration: updatedEntry.duration,
          hourlyRate: updatedEntry.hourlyRate,
          income: updatedEntry.income,
          userId: updatedEntry.userId,
          createdAt: new Date(updatedEntry.createdAt),
          updatedAt: new Date(updatedEntry.updatedAt),
        };
        dispatch({ type: 'UPDATE_TIME_ENTRY', payload: newEntry });
        toast.success(isRTL ? 'רישום זמן עודכן בהצלחה' : 'Time entry updated successfully');
      } else {
        // Create new entry
        const createdEntry = await api.timeEntries.create(timeEntryData) as any;
        const newEntry: TimeEntry = {
          id: createdEntry.id,
          customerId: createdEntry.customerId,
          projectId: createdEntry.projectId,
          taskId: createdEntry.taskId,
          description: createdEntry.description,
          startTime: new Date(createdEntry.startTime),
          endTime: new Date(createdEntry.endTime),
          duration: createdEntry.duration,
          hourlyRate: createdEntry.hourlyRate,
          income: createdEntry.income,
          userId: createdEntry.userId,
          createdAt: new Date(createdEntry.createdAt),
          updatedAt: new Date(createdEntry.updatedAt),
        };
        dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
        toast.success(isRTL ? 'רישום זמן נוסף בהצלחה' : 'Time entry added successfully');
      }

      setIsTimeEntryModalOpen(false);
      setEditingEntry(null);
    } catch (error: any) {
      console.error('Failed to save time entry:', error);
      toast.error(error.message || (isRTL ? 'שגיאה בשמירת רישום זמן' : 'Failed to save time entry. Please try again.'));
    }
  };

  const handleGenerateReport = () => {
    setIsReportModalOpen(true);
  };

  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
    setIsProjectDropdownOpen(false);
  };

  const handleProjectCreated = (projectId: string) => {
    setIsCreateProjectModalOpen(false);
    // Automatically select the newly created project
    setSelectedProjectId(projectId);
    setSelectedTaskId('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };

    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProjectDropdownOpen]);

  const hasProjects = state.projects.length > 0;
  const canStart = selectedCustomerId && selectedProjectId && !isRunning;
  const alignStart = isRTL ? 'text-right' : 'text-left';
  const flexDirection = isRTL ? 'flex-row-reverse' : '';

  // Get month options
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: 'current', label: t.currentMonth },
    ];
    
    const now = new Date();
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = format(date, locale === 'he' ? 'MMMM yyyy' : 'MMMM yyyy');
      options.push({ value: `${date.getMonth()}-${date.getFullYear()}`, label });
    }
    
    return options;
  }, [locale, t.currentMonth]);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className={`mb-8 ${alignStart}`}>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.subtitle}
        </p>
      </div>

      {/* Warning if no projects */}
      {!hasProjects && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className={`flex items-start gap-3 ${flexDirection}`}>
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
            <div className={alignStart}>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                {t.noProjectsWarning}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {t.noProjectsMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timer Section */}
      <div className="glass-effect border-0 shadow-2xl rounded-xl p-8">
        {/* Selection Dropdowns */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${flexDirection}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.selectCustomer}
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedProjectId('');
                  setSelectedTaskId('');
                  setIsProjectDropdownOpen(false);
                }}
                disabled={isRunning}
                className={`w-full h-12 px-3 py-2 pr-8 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart} appearance-none`}
              >
                <option value="">{t.allCustomers}</option>
                {state.customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <ChevronDown className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.selectProject}
            </label>
            <div className="relative" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  if (!isRunning && selectedCustomerId) {
                    setIsProjectDropdownOpen(!isProjectDropdownOpen);
                  }
                }}
                disabled={isRunning || !selectedCustomerId}
                className={`w-full h-12 px-3 py-2 pr-8 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart} text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between`}
              >
                <span className={selectedProjectId ? '' : 'text-gray-500 dark:text-gray-400'}>
                  {selectedProjectId
                    ? availableProjects.find(p => p.id === selectedProjectId)?.title || t.selectProject
                    : t.selectProject}
                </span>
                <ChevronDown className={`text-gray-400 ${isProjectDropdownOpen ? 'transform rotate-180' : ''} transition-transform`} size={16} />
              </button>
              
              {isProjectDropdownOpen && selectedCustomerId && !isRunning && (
                <div className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto`}>
                  {availableProjects.length === 0 ? (
                    <div className="p-3">
                      <button
                        type="button"
                        onClick={handleCreateProject}
                        className={`w-full px-4 py-3 text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg flex items-center justify-center gap-2 ${flexDirection}`}
                      >
                        <Plus size={16} />
                        {isRTL ? 'פרויקט חדש' : 'New Project'}
                      </button>
                    </div>
                  ) : (
                    <>
                      {availableProjects.map(project => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setSelectedTaskId('');
                            setIsProjectDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${alignStart} ${
                            selectedProjectId === project.id ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {project.title}
                        </button>
                      ))}
                      <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          className={`w-full px-4 py-2 text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg flex items-center justify-center gap-2 ${flexDirection}`}
                        >
                          <Plus size={16} />
                          {isRTL ? '+ פרויקט חדש' : '+ New Project'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.selectTask}
            </label>
            <div className="relative">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={isRunning || !selectedProjectId}
                className={`w-full h-12 px-3 py-2 pr-8 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart} appearance-none`}
              >
                <option value="">{t.noSpecificTask}</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <ChevronDown className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center space-y-6">
          <motion.div
            className="relative"
            animate={{ scale: isRunning ? 1.02 : 1 }}
            transition={{ duration: 0.5, repeat: isRunning ? Infinity : 0, repeatType: "reverse" }}
          >
            <div className="text-6xl md:text-7xl font-mono font-bold text-transparent bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text">
              {formatDuration(elapsedSeconds)}
            </div>
            {isRunning && (
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
            {isPaused && (
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full" />
              </div>
            )}
          </motion.div>

          {/* Project Info */}
          {selectedCustomer && selectedProjectId && (
            <div className="space-y-3">
              <div className={`flex items-center justify-center gap-2 ${flexDirection}`}>
                <span className="px-3 py-1 text-sm font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 rounded-full">
                  {state.projects.find(p => p.id === selectedProjectId)?.title || ''}
                </span>
                <span className="px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                  {selectedCustomer.name}
                </span>
              </div>
              
              {(isRunning || isPaused) && (
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {formatCurrency(currentCost, selectedCustomer.currency || '₪', locale)}
                </div>
              )}
            </div>
          )}

          {/* Description Input */}
          <div className="max-w-md mx-auto">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.whatAreYouDoing}
              className={`w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center ${alignStart}`}
              rows={2}
              disabled={!canStart && !isRunning}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {isRunning ? (
              <div className={`flex gap-3 ${flexDirection}`}>
                <Button
                  onClick={handlePause}
                  size="lg"
                  variant="outline"
                  className="px-6 py-4 rounded-xl border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <Pause className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {locale === 'he' ? 'השהה' : 'Pause'}
                </Button>
                <Button
                  onClick={handleStop}
                  size="lg"
                  variant="outline"
                  className="px-6 py-4 rounded-xl border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Square className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {locale === 'he' ? 'סיים סשן' : 'End Session'}
                </Button>
              </div>
            ) : isPaused ? (
              <div className={`flex gap-3 ${flexDirection}`}>
                <Button
                  onClick={handleResume}
                  size="lg"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                >
                  <Play className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {locale === 'he' ? 'המשך' : 'Resume'}
                </Button>
                <Button
                  onClick={handleStop}
                  size="lg"
                  variant="outline"
                  className="px-6 py-4 rounded-xl border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Square className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {locale === 'he' ? 'סיים סשן' : 'End Session'}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStart}
                disabled={!canStart}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className={`w-6 h-6 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.start}
              </Button>
            )}
          </div>

          {!canStart && !isRunning && (
            <p className="text-gray-500 dark:text-gray-400">
              {t.selectProjectAndCustomer}
            </p>
          )}
        </div>
      </div>

      {/* Time Log Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        {/* Log Header */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4 ${flexDirection}`}>
          <div className={`flex items-center gap-2 ${flexDirection}`}>
            <Clock size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              {t.timeLog} - {format(new Date(), locale === 'he' ? 'MMMM yyyy' : 'MMMM yyyy')}
            </h2>
          </div>
          <div className={`flex items-center gap-2 ${flexDirection}`}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`w-full md:w-auto px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart} text-sm`}
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-3 mb-6 ${isRTL ? 'sm:flex-row-reverse sm:justify-end' : ''}`}>
          <Button
            onClick={handleAddEntry}
            icon={<Plus size={16} />}
            className={`${flexDirection} w-full sm:w-auto`}
            fullWidth
          >
            {t.addEntry}
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="outline"
            icon={<FileText size={16} />}
            className={`${flexDirection} w-full sm:w-auto`}
            fullWidth
          >
            {t.generateReport}
          </Button>
        </div>

        {/* Time Entries - Mobile Card View */}
        <div className="block md:hidden space-y-4">
          {filteredTimeEntries.length === 0 ? (
            <div className={`py-10 text-center text-gray-500 dark:text-gray-400 ${alignStart}`}>
              <div className="flex flex-col items-center gap-2">
                <Clock size={32} className="text-gray-400" />
                <p className="font-medium">{t.noEntries}</p>
                <p className="text-sm">{t.noEntriesSubtitle}</p>
              </div>
            </div>
          ) : (
            filteredTimeEntries.map((entry) => {
              const customer = state.customers.find(c => c.id === entry.customerId);
              const project = state.projects.find(p => p.id === entry.projectId);
              
              return (
                <div
                  key={entry.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className={`space-y-3 ${alignStart}`}>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.client}</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {customer?.name || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.project}</div>
                      <div className="text-gray-700 dark:text-gray-200">
                        {project?.title || 'Unknown'}
                      </div>
                    </div>
                    {entry.description && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {locale === 'he' ? 'תיאור' : 'Description'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {entry.description}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.startTime}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-200">
                          {format(new Date(entry.startTime), locale === 'he' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy h:mm a')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.endTime}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-200">
                          {format(new Date(entry.endTime), locale === 'he' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.duration}</div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200">
                          {formatDurationShort(entry.duration)}
                        </span>
                      </div>
                      <div className={`${alignStart}`}>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.income}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(entry.income, customer?.currency || '₪', locale)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Time Entries Table - Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.client}
                </th>
                <th className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.project}
                </th>
                <th className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.startTime}
                </th>
                <th className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.endTime}
                </th>
                <th className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.duration}
                </th>
                <th className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${alignStart}`}>
                  {t.income}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTimeEntries.map((entry) => {
                const customer = state.customers.find(c => c.id === entry.customerId);
                const project = state.projects.find(p => p.id === entry.projectId);
                
                return (
                  <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className={`px-4 py-4 ${alignStart}`}>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer?.name || 'Unknown'}
                        </div>
                        {entry.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                      {project?.title || 'Unknown'}
                    </td>
                    <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                      {format(new Date(entry.startTime), locale === 'he' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy h:mm a')}
                    </td>
                    <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 ${alignStart}`}>
                      {format(new Date(entry.endTime), locale === 'he' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy h:mm a')}
                    </td>
                    <td className={`px-4 py-4 ${alignStart}`}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200">
                        {formatDurationShort(entry.duration)}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-gray-700 dark:text-gray-200 font-medium ${alignStart}`}>
                      {formatCurrency(entry.income, customer?.currency || '₪', locale)}
                    </td>
                  </tr>
                );
              })}
              {filteredTimeEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className={`px-4 py-10 text-center text-gray-500 dark:text-gray-400 ${alignStart}`}>
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={32} className="text-gray-400" />
                      <p className="font-medium">{t.noEntries}</p>
                      <p className="text-sm">{t.noEntriesSubtitle}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        preSelectedCustomerId={selectedCustomerId}
        onProjectCreated={handleProjectCreated}
      />

      {/* Add Time Entry Modal */}
      <Modal
        isOpen={isTimeEntryModalOpen}
        onClose={() => {
          setIsTimeEntryModalOpen(false);
          setEditingEntry(null);
        }}
        title={t.addTimeRecord}
        titleIcon={<ClockIcon size={20} />}
        size="lg"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <TimeEntryForm
          entry={editingEntry}
          onSubmit={handleTimeEntrySubmit}
          onCancel={() => {
            setIsTimeEntryModalOpen(false);
            setEditingEntry(null);
          }}
        />
      </Modal>

      {/* Client Report Modal */}
      <ClientReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

