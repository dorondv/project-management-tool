import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, FolderOpen, CheckSquare, Calendar } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { Customer, Locale } from '../../types';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onConfirm: (cascade: boolean) => void;
  locale?: Locale;
}

export function DeleteCustomerModal({
  isOpen,
  onClose,
  customer,
  onConfirm,
  locale = 'en',
}: DeleteCustomerModalProps) {
  const { state } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const isRTL = locale === 'he';

  // Calculate counts of related entities
  const projectCount = customer
    ? state.projects.filter(p => p.customerId === customer.id).length
    : 0;

  const taskCount = customer
    ? state.projects
        .filter(p => p.customerId === customer.id)
        .reduce((sum, project) => {
          return sum + state.tasks.filter(t => t.projectId === project.id).length;
        }, 0)
    : 0;

  const eventCount = customer
    ? state.events.filter(e => e.customerId === customer.id).length
    : 0;

  const hasRelatedEntities = projectCount > 0 || taskCount > 0 || eventCount > 0;

  const translations = {
    en: {
      title: 'Delete Customer',
      message: hasRelatedEntities
        ? `Are you sure you want to delete "${customer?.name}"? This customer has related data that will be affected.`
        : `Are you sure you want to delete "${customer?.name}"?`,
      relatedData: 'Related Data:',
      projects: 'Projects',
      tasks: 'Tasks',
      events: 'Events',
      warning: 'Warning: This action cannot be undone.',
      cancel: 'Cancel',
      deleteOnly: 'Delete Customer Only',
      deleteAll: 'Delete All Related Data',
      deleteButton: 'Delete Customer',
      deleting: 'Deleting...',
    },
    he: {
      title: 'מחיקת לקוח',
      message: hasRelatedEntities
        ? `האם אתה בטוח שברצונך למחוק את "${customer?.name}"? ללקוח זה יש נתונים קשורים שיושפעו.`
        : `האם אתה בטוח שברצונך למחוק את "${customer?.name}"?`,
      relatedData: 'נתונים קשורים:',
      projects: 'פרויקטים',
      tasks: 'משימות',
      events: 'אירועים',
      warning: 'אזהרה: פעולה זו לא ניתנת לביטול.',
      cancel: 'ביטול',
      deleteOnly: 'מחק לקוח בלבד',
      deleteAll: 'מחק את כל הנתונים הקשורים',
      deleteButton: 'מחק לקוח',
      deleting: 'מוחק...',
    },
  };

  const t = translations[locale];

  const handleCancel = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleDeleteOnly = async () => {
    setIsDeleting(true);
    try {
      onConfirm(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      onConfirm(true);
      onClose();
    } catch (error) {
      console.error('Failed to delete customer with cascade:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const flexDirection = isRTL ? 'flex-row-reverse' : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t.title}
      titleIcon={<Trash2 className="w-5 h-5 text-red-500" />}
      size="md"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`space-y-4 ${alignStart}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Warning Icon and Message */}
        <div className={`flex items-start gap-3 ${flexDirection}`}>
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-700 dark:text-gray-300">{t.message}</p>
        </div>

        {/* Related Data Counts */}
        {hasRelatedEntities && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
              {t.relatedData}
            </p>
            <div className="space-y-1.5">
              {projectCount > 0 && (
                <div className={`flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 ${flexDirection}`}>
                  <FolderOpen className="w-4 h-4 text-gray-500" />
                  <span>
                    {projectCount} {t.projects}
                  </span>
                </div>
              )}
              {taskCount > 0 && (
                <div className={`flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 ${flexDirection}`}>
                  <CheckSquare className="w-4 h-4 text-gray-500" />
                  <span>
                    {taskCount} {t.tasks}
                  </span>
                </div>
              )}
              {eventCount > 0 && (
                <div className={`flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 ${flexDirection}`}>
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {eventCount} {t.events}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning Message */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{t.warning}</p>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1"
          >
            {t.cancel}
          </Button>
          {hasRelatedEntities ? (
            <>
              <Button
                variant="outline"
                onClick={handleDeleteOnly}
                disabled={isDeleting}
                className="flex-1"
              >
                {t.deleteOnly}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                loading={isDeleting}
                className="flex-1"
              >
                {t.deleteAll}
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              onClick={handleDeleteOnly}
              disabled={isDeleting}
              loading={isDeleting}
              className="flex-1"
            >
              {t.deleteButton}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
