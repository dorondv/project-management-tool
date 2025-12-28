import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Gift, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Locale } from '../../types';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const translations: Record<Locale, {
  title: string;
  subtitle: string;
  enterCode: string;
  codePlaceholder: string;
  activate: string;
  cancel: string;
  activating: string;
  success: string;
  error: string;
  invalidCode: string;
  expiredCode: string;
  maxUsesReached: string;
  alreadyHasSubscription: string;
}> = {
  en: {
    title: 'Activate Trial Coupon',
    subtitle: 'Enter your coupon code to activate a free trial period',
    enterCode: 'Coupon Code',
    codePlaceholder: 'Enter coupon code',
    activate: 'Activate Coupon',
    cancel: 'Cancel',
    activating: 'Activating...',
    success: 'Trial activated successfully!',
    error: 'Failed to activate coupon',
    invalidCode: 'Invalid or inactive coupon code',
    expiredCode: 'Coupon has expired',
    maxUsesReached: 'Coupon usage limit reached',
    alreadyHasSubscription: 'You already have an active subscription',
  },
  he: {
    title: 'הפעל קופון ניסיון',
    subtitle: 'הכנס את קוד הקופון שלך כדי להפעיל תקופת ניסיון חינמית',
    enterCode: 'קוד קופון',
    codePlaceholder: 'הכנס קוד קופון',
    activate: 'הפעל קופון',
    cancel: 'ביטול',
    activating: 'מפעיל...',
    success: 'תקופת הניסיון הופעלה בהצלחה!',
    error: 'נכשל בהפעלת הקופון',
    invalidCode: 'קוד קופון לא תקין או לא פעיל',
    expiredCode: 'הקופון פג תוקף',
    maxUsesReached: 'הגעת למגבלת השימושים של הקופון',
    alreadyHasSubscription: 'יש לך כבר מנוי פעיל',
  },
};

export function CouponModal({ isOpen, onClose, onSuccess }: CouponModalProps) {
  const { state } = useApp();
  const navigate = useNavigate();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error(isRTL ? 'נא להכניס קוד קופון' : 'Please enter a coupon code');
      return;
    }

    if (!state.user?.id) {
      toast.error(isRTL ? 'נדרש להתחבר' : 'Please log in');
      return;
    }

    setLoading(true);

    try {
      const result = await api.subscriptions.redeemCoupon(code.toUpperCase().trim(), state.user.id);
      
      toast.success(t.success);
      setCode('');
      onSuccess();
      onClose();
      
      // Redirect to dashboard after successful coupon activation
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      console.error('Error redeeming coupon:', error);
      
      // Handle specific error messages
      const errorMessage = error.message || error.error || t.error;
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('inactive')) {
        toast.error(t.invalidCode);
      } else if (errorMessage.includes('expired')) {
        toast.error(t.expiredCode);
      } else if (errorMessage.includes('usage limit') || errorMessage.includes('maxUses')) {
        toast.error(t.maxUsesReached);
      } else if (errorMessage.includes('already has an active subscription')) {
        toast.error(t.alreadyHasSubscription);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        dir={isRTL ? 'rtl' : 'ltr'}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mr-3 ${isRTL ? 'ml-3 mr-0' : ''}`}>
            <Gift className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.enterCode}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t.codePlaceholder}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !code.trim()}
              className="flex-1"
              icon={loading ? <Loader2 className="animate-spin" size={20} /> : <Gift size={20} />}
            >
              {loading ? t.activating : t.activate}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

