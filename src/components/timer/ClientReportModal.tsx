import { useState, useMemo } from 'react';
import { Calendar, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TimeEntry, Locale, Customer, Project, Task } from '../../types';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

interface ClientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const translations = {
  en: {
    title: 'Generate Client Hours Report',
    selectClient: 'Select Client',
    selectClientRequired: 'Select Client *',
    selectProject: 'Select Project (Optional)',
    selectTask: 'Select Task (Optional)',
    allProjects: 'All Projects',
    allTasks: 'All Tasks',
    startDate: 'Start Date',
    endDate: 'End Date',
    entriesFound: 'entries found',
    exportPDF: 'Export PDF',
    exportExcel: 'Export Excel',
    cancel: 'Cancel',
    clientRequired: 'Please select a client',
    noEntries: 'No entries found for the selected period',
  },
  he: {
    title: 'הפקת דוח שעות ללקוח',
    selectClient: 'בחר לקוח',
    selectClientRequired: 'בחר לקוח *',
    selectProject: 'בחר פרויקט (אופציונלי)',
    selectTask: 'בחר משימה (אופציונלי)',
    allProjects: 'כל הפרויקטים',
    allTasks: 'כל המשימות',
    startDate: 'תאריך התחלה',
    endDate: 'תאריך סיום',
    entriesFound: 'רישומים נמצאו',
    exportPDF: 'ייצא PDF',
    exportExcel: 'ייצא Excel',
    cancel: 'ביטול',
    clientRequired: 'יש לבחור לקוח',
    noEntries: 'אין רישומים להצגה בטווח התאריכים שנבחר',
  },
} as const;

export function ClientReportModal({ isOpen, onClose }: ClientReportModalProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // Get filtered projects based on selected client
  const filteredProjects = useMemo(() => {
    if (!selectedClientId) return [];
    return state.projects.filter(p => p.customerId === selectedClientId);
  }, [state.projects, selectedClientId]);

  // Get filtered tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return state.tasks.filter(t => t.projectId === selectedProjectId);
  }, [state.tasks, selectedProjectId]);

  // Get filtered entries
  const filteredEntries = useMemo(() => {
    return state.timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      const clientMatch = !selectedClientId || entry.customerId === selectedClientId;
      const projectMatch = !selectedProjectId || entry.projectId === selectedProjectId;
      const taskMatch = !selectedTaskId || entry.taskId === selectedTaskId;
      const dateMatch = entryDate >= startDate && entryDate <= endDate;
      
      return clientMatch && projectMatch && taskMatch && dateMatch;
    });
  }, [state.timeEntries, selectedClientId, selectedProjectId, selectedTaskId, startDate, endDate]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDurationHours = (seconds: number): string => {
    return (seconds / 3600).toFixed(2);
  };

  const exportToPDF = async () => {
    if (!selectedClientId) {
      toast.error(t.clientRequired);
      return;
    }

    if (filteredEntries.length === 0) {
      toast.error(t.noEntries);
      return;
    }

    try {
      // Dynamic import of jsPDF
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      const customer = state.customers.find(c => c.id === selectedClientId);
      const project = selectedProjectId ? state.projects.find(p => p.id === selectedProjectId) : null;

      // Add Hebrew font if needed - load it before generating PDF content
      let hebrewFontLoaded = false;
      if (locale === 'he') {
        try {
          // Load Hebrew font from a reliable CDN
          // Using Noto Sans Hebrew from Google Fonts via jsDelivr
          const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanshebrew/NotoSansHebrew-Regular.ttf';
          const response = await fetch(fontUrl);
          
          if (response.ok) {
            const fontArrayBuffer = await response.arrayBuffer();
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(fontArrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const fontBase64 = btoa(binary);
            
            // Add font to jsPDF
            doc.addFileToVFS('NotoSansHebrew-Regular.ttf', fontBase64);
            doc.addFont('NotoSansHebrew-Regular.ttf', 'NotoSansHebrew', 'normal');
            doc.addFont('NotoSansHebrew-Regular.ttf', 'NotoSansHebrew', 'bold');
            
            hebrewFontLoaded = true;
          } else {
            console.warn('Failed to fetch Hebrew font from CDN');
          }
        } catch (fontError) {
          console.warn('Could not load Hebrew font:', fontError);
          // Continue without Hebrew font - PDF will still generate but Hebrew text may not render perfectly
        }
      }

      // Title
      doc.setFontSize(20);
      if (locale === 'he' && hebrewFontLoaded) {
        doc.setFont('NotoSansHebrew', 'normal');
      }
      doc.text(locale === 'he' ? 'דוח שעות' : 'Time Report', 105, 20, { align: 'center' });
      
      // Client info
      doc.setFontSize(12);
      if (locale === 'he' && hebrewFontLoaded) {
        doc.setFont('NotoSansHebrew', 'normal');
      }
      doc.text(`${locale === 'he' ? 'לקוח:' : 'Client:'} ${customer?.name || 'Unknown'}`, 20, 35);
      if (project) {
        doc.text(`${locale === 'he' ? 'פרויקט:' : 'Project:'} ${project.title}`, 20, 42);
      }
      const periodText = locale === 'he' 
        ? `תקופה: ${format(startDate, 'dd/MM/yyyy', { locale: he })} - ${format(endDate, 'dd/MM/yyyy', { locale: he })}`
        : `Period: ${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')}`;
      doc.text(periodText, 20, project ? 49 : 42);

      // Table headers
      let y = project ? 60 : 53;
      doc.setFontSize(10);
      if (locale === 'he' && hebrewFontLoaded) {
        doc.setFont('NotoSansHebrew', 'bold');
      } else {
        doc.setFont(undefined, 'bold');
      }
      if (locale === 'he') {
        doc.text('תאריך', 20, y);
        doc.text('התחלה', 50, y);
        doc.text('סיום', 75, y);
        doc.text('משך', 100, y);
        doc.text('תיאור', 130, y);
        doc.text('סכום', 175, y);
      } else {
        doc.text('Date', 20, y);
        doc.text('Start', 50, y);
        doc.text('End', 75, y);
        doc.text('Duration', 100, y);
        doc.text('Description', 130, y);
        doc.text('Amount', 175, y);
      }
      
      y += 7;
      if (locale === 'he' && hebrewFontLoaded) {
        doc.setFont('NotoSansHebrew', 'normal');
      } else {
        doc.setFont(undefined, 'normal');
      }

      // Table rows
      let totalHours = 0;
      let totalAmount = 0;

      filteredEntries.forEach((entry) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const startTime = new Date(entry.startTime);
        const endTime = new Date(entry.endTime);
        const hours = entry.duration / 3600;
        
        totalHours += hours;
        totalAmount += entry.income;

        const dateFormat = locale === 'he' ? 'dd/MM/yy' : 'MM/dd/yy';
        const timeFormat = 'HH:mm';
        
        doc.text(format(startTime, dateFormat), 20, y);
        doc.text(format(startTime, timeFormat), 50, y);
        doc.text(format(endTime, timeFormat), 75, y);
        doc.text(`${formatDurationHours(entry.duration)}h`, 100, y);
        
        const description = entry.description || '';
        const truncatedDesc = description.length > 25 ? description.substring(0, 22) + '...' : description;
        if (locale === 'he' && hebrewFontLoaded && description) {
          doc.setFont('NotoSansHebrew', 'normal');
        }
        doc.text(truncatedDesc, 130, y);
        
        const currency = customer?.currency || '₪';
        const amountText = locale === 'he' 
          ? `${currency}${entry.income.toFixed(2)}`
          : `${currency}${entry.income.toFixed(2)}`;
        doc.text(amountText, 175, y);
        
        y += 7;
      });

      // Totals
      y += 5;
      if (locale === 'he' && hebrewFontLoaded) {
        doc.setFont('NotoSansHebrew', 'bold');
      } else {
        doc.setFont(undefined, 'bold');
      }
      doc.text(locale === 'he' ? 'סה"כ:' : 'Total:', 20, y);
      doc.text(`${totalHours.toFixed(2)}h`, 100, y);
      const currency = customer?.currency || '₪';
      const totalText = locale === 'he'
        ? `${currency}${totalAmount.toFixed(2)}`
        : `${currency}${totalAmount.toFixed(2)}`;
      doc.text(totalText, 175, y);

      // Save
      const fileName = `time_report_${customer?.name || 'client'}_${format(startDate, 'dd-MM-yyyy')}.pdf`;
      doc.save(fileName);
      toast.success(locale === 'he' ? 'דוח הופק בהצלחה' : 'Report generated successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error(locale === 'he' ? 'שגיאה ביצירת PDF' : 'Failed to generate PDF');
    }
  };

  const exportToExcel = () => {
    if (!selectedClientId) {
      toast.error(t.clientRequired);
      return;
    }

    if (filteredEntries.length === 0) {
      toast.error(t.noEntries);
      return;
    }

    const customer = state.customers.find(c => c.id === selectedClientId);
    const project = selectedProjectId ? state.projects.find(p => p.id === selectedProjectId) : null;

    // Create CSV content
    let csv = '\uFEFF'; // BOM for Hebrew support
    if (locale === 'he') {
      csv += `דוח שעות - ${customer?.name || 'Unknown'}\n`;
      if (project) {
        csv += `פרויקט: ${project.title}\n`;
      }
      csv += `תקופה: ${format(startDate, 'dd/MM/yyyy', { locale: he })} - ${format(endDate, 'dd/MM/yyyy', { locale: he })}\n\n`;
      csv += 'תאריך,שעת התחלה,שעת סיום,משך (שעות),תיאור,סכום\n';
    } else {
      csv += `Time Report - ${customer?.name || 'Unknown'}\n`;
      if (project) {
        csv += `Project: ${project.title}\n`;
      }
      csv += `Period: ${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')}\n\n`;
      csv += 'Date,Start Time,End Time,Duration (Hours),Description,Amount\n';
    }

    // Data rows
    let totalHours = 0;
    let totalAmount = 0;

    filteredEntries.forEach((entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = new Date(entry.endTime);
      const hours = entry.duration / 3600;
      
      totalHours += hours;
      totalAmount += entry.income;

      const dateFormat = locale === 'he' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
      const description = (entry.description || '').replace(/,/g, ';');
      
      csv += `${format(startTime, dateFormat)},`;
      csv += `${format(startTime, 'HH:mm')},`;
      csv += `${format(endTime, 'HH:mm')},`;
      csv += `${formatDurationHours(entry.duration)},`;
      csv += `"${description}",`;
      const currency = customer?.currency || '₪';
      csv += `${currency}${entry.income.toFixed(2)}\n`;
    });

    // Totals
    if (locale === 'he') {
      csv += `\nסה"כ,,,,${totalHours.toFixed(2)},${customer?.currency || '₪'}${totalAmount.toFixed(2)}`;
    } else {
      csv += `\nTotal,,,,${totalHours.toFixed(2)},${customer?.currency || '₪'}${totalAmount.toFixed(2)}`;
    }

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time_report_${customer?.name || 'client'}_${format(startDate, 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(locale === 'he' ? 'דוח הופק בהצלחה' : 'Report generated successfully');
  };

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const flexDirection = isRTL ? 'flex-row-reverse' : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.title}
      titleIcon={<FileText size={20} />}
      size="lg"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.selectClientRequired}
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSelectedProjectId('');
              setSelectedTaskId('');
            }}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
          >
            <option value="">{t.selectClient}</option>
            {state.customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.selectProject}
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedTaskId('');
            }}
            disabled={!selectedClientId}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">{t.allProjects}</option>
            {filteredProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.selectTask}
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={!selectedProjectId}
            className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">{t.allTasks}</option>
            {filteredTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              <Calendar size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.startDate}
            </label>
            <div className="relative">
              <input
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : startOfMonth(new Date());
                  setStartDate(date);
                }}
                className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              <Calendar size={16} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.endDate}
            </label>
            <div className="relative">
              <input
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : endOfMonth(new Date());
                  setEndDate(date);
                }}
                className={`w-full h-12 px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${alignStart}`}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className={`text-sm text-gray-600 dark:text-gray-400 mb-4 ${alignStart}`}>
            {filteredEntries.length} {t.entriesFound}
          </p>
          <div className={`flex flex-col sm:flex-row gap-3 ${flexDirection}`}>
            <Button
              onClick={exportToPDF}
              className={`bg-red-600 hover:bg-red-700 text-white ${flexDirection} w-full sm:w-auto sm:flex-1`}
              disabled={!selectedClientId}
              icon={<FileDown size={16} />}
            >
              {t.exportPDF}
            </Button>
            <Button
              onClick={exportToExcel}
              className={`bg-green-600 hover:bg-green-700 text-white ${flexDirection} w-full sm:w-auto sm:flex-1`}
              disabled={!selectedClientId}
              icon={<FileSpreadsheet size={16} />}
            >
              {t.exportExcel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
