import { useState, useEffect, useRef } from 'react';
import { HelpCircle, Send, ChevronDown } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useApp } from '../../context/AppContext';
import { Locale } from '../../types';
import toast from 'react-hot-toast';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const translations: Record<
  Locale,
  {
    title: string;
    category: string;
    categoryPlaceholder: string;
    subject: string;
    subjectPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    buttons: {
      cancel: string;
      send: string;
    };
    categories: {
      technical: string;
      billing: string;
      feature: string;
      bug: string;
      other: string;
    };
    success: string;
    error: string;
  }
> = {
  en: {
    title: 'Support Request',
    category: 'Category',
    categoryPlaceholder: 'Select Category',
    subject: 'Subject',
    subjectPlaceholder: 'Briefly describe the problem or question',
    message: 'Message',
    messagePlaceholder: 'Describe in detail the problem, question, or your request',
    buttons: {
      cancel: 'Cancel',
      send: 'Send Request',
    },
    categories: {
      technical: 'Technical Support',
      billing: 'Billing',
      feature: 'Feature Request',
      bug: 'Bug Report',
      other: 'Other',
    },
    success: 'Support request sent successfully!',
    error: 'Please fill in all required fields',
  },
  he: {
    title: 'פנייה לתמיכה',
    category: 'קטגוריה',
    categoryPlaceholder: 'בחר קטגוריה',
    subject: 'נושא',
    subjectPlaceholder: 'תאר בקצרה את הבעיה או השאלה',
    message: 'הודעה',
    messagePlaceholder: 'תאר בפירוט את הבעיה, השאלה או הבקשה שלך',
    buttons: {
      cancel: 'ביטול',
      send: 'שלח פנייה',
    },
    categories: {
      technical: 'תמיכה טכנית',
      billing: 'חיוב',
      feature: 'בקשת תכונה',
      bug: 'דיווח על באג',
      other: 'אחר',
    },
    success: 'הפנייה נשלחה בהצלחה!',
    error: 'אנא מלא את כל השדות הנדרשים',
  },
};

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
  });

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        category: '',
        subject: '',
        message: '',
      });
      setIsCategoryOpen(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };

    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen]);

  const categories = [
    { value: 'technical', label: t.categories.technical },
    { value: 'billing', label: t.categories.billing },
    { value: 'feature', label: t.categories.feature },
    { value: 'bug', label: t.categories.bug },
    { value: 'other', label: t.categories.other },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.subject || !formData.message) {
      toast.error(t.error);
      return;
    }

    // Here you would typically send the support request to a backend
    // For now, we'll just show a success message
    console.log('Support request:', formData);
    toast.success(t.success);

    onClose();
  };

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title} titleIcon={<HelpCircle size={20} className="text-gray-600 dark:text-gray-400" />} size="lg">
      <form onSubmit={handleSubmit} className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Category Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {t.category}
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <span className={formData.category ? '' : 'text-gray-500 dark:text-gray-400'}>
                {selectedCategory ? selectedCategory.label : t.categoryPlaceholder}
              </span>
              <ChevronDown
                size={20}
                className={`text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''} ${
                  isRTL && !isCategoryOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isCategoryOpen && (
              <div className={`absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg ${isRTL ? 'right-0' : 'left-0'}`}>
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: category.value });
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${
                      isRTL ? 'text-right' : 'text-left'
                    } ${
                      formData.category === category.value
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {t.subject} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder={t.subjectPlaceholder}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
            required
          />
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {t.message} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t.messagePlaceholder}
            rows={6}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors resize-none"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t.buttons.cancel}
          </Button>
          <Button
            type="submit"
            icon={<Send size={18} />}
            className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t.buttons.send}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

