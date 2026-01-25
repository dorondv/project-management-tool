import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Mail, User, MessageSquare, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const translations = {
  en: {
    title: 'Contact Us',
    name: 'Name',
    namePlaceholder: 'Enter your name',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    message: 'Message',
    messagePlaceholder: 'Enter your message',
    submit: 'Send Message',
    submitting: 'Sending...',
    success: 'Thank you! Your message has been sent successfully.',
    error: 'Failed to send message. Please try again.',
    nameRequired: 'Name is required',
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    messageRequired: 'Message is required',
  },
  he: {
    title: 'צור קשר',
    name: 'שם',
    namePlaceholder: 'הכנס את שמך',
    email: 'אימייל',
    emailPlaceholder: 'הכנס את כתובת האימייל שלך',
    message: 'הודעה',
    messagePlaceholder: 'הכנס את הודעתך',
    submit: 'שלח הודעה',
    submitting: 'שולח...',
    success: 'תודה! ההודעה שלך נשלחה בהצלחה.',
    error: 'שליחת ההודעה נכשלה. אנא נסה שוב.',
    nameRequired: 'שם הוא שדה חובה',
    emailRequired: 'אימייל הוא שדה חובה',
    emailInvalid: 'אנא הכנס כתובת אימייל תקינה',
    messageRequired: 'הודעה היא שדה חובה',
  },
};

export function ContactUsModal({ isOpen, onClose }: ContactUsModalProps) {
  const { state } = useApp();
  const locale = state.locale || 'en';
  const isRTL = locale === 'he';
  const t = translations[locale as 'en' | 'he'];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = t.nameRequired;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.emailInvalid;
    }

    if (!formData.message.trim()) {
      newErrors.message = t.messageRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await api.contact.send({
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });

      toast.success(t.success);
      setFormData({ name: '', email: '', message: '' });
      onClose();
    } catch (error: any) {
      console.error('Error sending contact form:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.title}
      size="md"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t.name}
          </label>
          <div className="relative">
            <User
              className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`}
              size={20}
            />
            <input
              id="contact-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder={t.namePlaceholder}
              disabled={loading}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t.email}
          </label>
          <div className="relative">
            <Mail
              className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`}
              size={20}
            />
            <input
              id="contact-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder={t.emailPlaceholder}
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t.message}
          </label>
          <div className="relative">
            <MessageSquare
              className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 text-gray-400`}
              size={20}
            />
            <textarea
              id="contact-message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={5}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border ${
                errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none`}
              placeholder={t.messagePlaceholder}
              disabled={loading}
            />
          </div>
          {errors.message && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6"
          >
            {locale === 'he' ? 'ביטול' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-6 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.submitting}
              </>
            ) : (
              t.submit
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
