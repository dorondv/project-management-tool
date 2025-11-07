import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Plus, FileText, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { TimeEntry, Locale, Customer, Project, Task } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { timerService } from '../utils/timerService';

const translations = {
  en: {
    title: 'Time Tracking',
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

  // Get timer state from context
  const activeTimer = state.activeTimer;
  const elapsedSeconds = state.timerElapsedSeconds;
  const isRunning = activeTimer?.isRunning || false;

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
    if (!selectedCustomerId) return state.projects;
    // For now, return all projects. In a real app, you'd filter by customer
    return state.projects;
  }, [selectedCustomerId, state.projects]);

  // Get filtered tasks based on selected project
  const availableTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return state.tasks.filter(task => task.projectId === selectedProjectId);
  }, [selectedProjectId, state.tasks]);

  // Get selected customer
  const selectedCustomer = useMemo(() => {
    return state.customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, state.customers]);

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

  const handleStop = () => {
    if (!isRunning || !activeTimer || !selectedCustomer) {
      return;
    }

    const hourlyRate = getHourlyRate(selectedCustomer);
    const timerLog = timerService.stopTimer(hourlyRate);

    if (timerLog) {
      // Convert TimerLog to TimeEntry format
      const newEntry: TimeEntry = {
        id: timerLog.id,
        customerId: timerLog.customerId,
        projectId: timerLog.projectId,
        taskId: timerLog.taskId,
        description: timerLog.description,
        startTime: timerLog.startTime,
        endTime: timerLog.endTime,
        duration: timerLog.duration,
        hourlyRate: timerLog.hourlyRate,
        income: timerLog.income,
        userId: timerLog.userId,
        createdAt: timerLog.createdAt,
        updatedAt: timerLog.updatedAt,
      };

      dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
      toast.success(isRTL ? 'רישום זמן נשמר בהצלחה' : 'Time entry saved successfully');

      // Reset form
      setSelectedCustomerId('');
      setSelectedProjectId('');
      setSelectedTaskId('');
      setDescription('');
    }
  };

  const handleAddEntry = () => {
    toast.info(isRTL ? 'פונקציה זו תתווסף בקרוב' : 'This feature will be added soon');
  };

  const handleGenerateReport = () => {
    toast.info(isRTL ? 'פונקציה זו תתווסף בקרוב' : 'This feature will be added soon');
  };

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
      <div className={alignStart}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                }}
                disabled={isRunning}
                className={`w-full px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart} appearance-none`}
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
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedTaskId('');
                }}
                disabled={isRunning || !selectedCustomerId}
                className={`w-full px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart} appearance-none`}
              >
                <option value="">{t.selectProject}</option>
                {availableProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <ChevronDown className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`} size={16} />
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
                className={`w-full px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart} appearance-none`}
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
        <div className="text-center mb-6">
          <div className="text-6xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent mb-4">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={t.whatAreYouDoing}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRunning}
            className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart}`}
          />
        </div>

        {/* Start/Stop Button */}
        <div className="flex justify-center mb-4">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={!canStart}
              size="lg"
              icon={<Play size={20} />}
              className={flexDirection}
            >
              {t.start}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="danger"
              size="lg"
              icon={<Square size={20} />}
              className={flexDirection}
            >
              {t.stop}
            </Button>
          )}
        </div>

        {!canStart && !isRunning && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t.selectProjectAndCustomer}
          </p>
        )}
      </div>

      {/* Time Log Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Log Header */}
        <div className={`flex items-center justify-between mb-6 ${flexDirection}`}>
          <div className={`flex items-center gap-2 ${flexDirection}`}>
            <Clock size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.timeLog} - {format(new Date(), locale === 'he' ? 'MMMM yyyy' : 'MMMM yyyy')}
            </h2>
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
              {t.demoData}
            </span>
          </div>
          <div className={`flex items-center gap-2 ${flexDirection}`}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 ${alignStart} text-sm`}
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
        <div className={`flex gap-3 mb-6 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          <Button
            onClick={handleAddEntry}
            icon={<Plus size={16} />}
            className={flexDirection}
          >
            {t.addEntry}
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="outline"
            icon={<FileText size={16} />}
            className={flexDirection}
          >
            {t.generateReport}
          </Button>
        </div>

        {/* Time Entries Table */}
        <div className="overflow-x-auto">
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
                const task = entry.taskId ? state.tasks.find(t => t.id === entry.taskId) : null;
                
                return (
                  <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className={`px-4 py-4 ${alignStart}`}>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer?.name || 'Unknown'}
                        </div>
                        {task && (
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
    </div>
  );
}

