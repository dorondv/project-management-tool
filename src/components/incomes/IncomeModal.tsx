import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Calendar, User, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { Income, Locale, Currency } from '../../types';
import { formatCurrency as formatCurrencyUtil } from '../../utils/currencyUtils';
import toast from 'react-hot-toast';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: Income | null;
}

const translations: Record<
  Locale,
  {
    title: {
      new: string;
      edit: string;
    };
    fields: {
      client: string;
      incomeDate: string;
      invoiceNumber: string;
      invoiceNumberOptional: string;
      vatRate: string;
      amountBeforeVat: string;
      vatAmount: string;
      finalAmount: string;
    };
    buttons: {
      cancel: string;
      add: string;
      update: string;
    };
  }
> = {
  en: {
    title: {
      new: 'New Income',
      edit: 'Edit Income',
    },
    fields: {
      client: 'Client',
      incomeDate: 'Income Date',
      invoiceNumber: 'Invoice Number',
      invoiceNumberOptional: '(Optional)',
      vatRate: 'VAT Rate',
      amountBeforeVat: 'Amount before VAT',
      vatAmount: 'VAT',
      finalAmount: 'Final Amount',
    },
    buttons: {
      cancel: 'Cancel',
      add: 'Add Income',
      update: 'Update Income',
    },
  },
  he: {
    title: {
      new: 'הכנסה חדשה',
      edit: 'עריכת הכנסה',
    },
    fields: {
      client: 'לקוח',
      incomeDate: 'תאריך הכנסה',
      invoiceNumber: 'מספר חשבונית',
      invoiceNumberOptional: '(אופציונלי)',
      vatRate: 'שיעור מע"מ',
      amountBeforeVat: 'סכום לפני מע"מ',
      vatAmount: 'מע"מ',
      finalAmount: 'סכום סופי',
    },
    buttons: {
      cancel: 'ביטול',
      add: 'הוסף הכנסה',
      update: 'עדכן הכנסה',
    },
  },
};

export function IncomeModal({ isOpen, onClose, income }: IncomeModalProps) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const currency: Currency = state.currency ?? 'ILS';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const isEditing = !!income;

  const [formData, setFormData] = useState({
    customerId: '',
    incomeDate: '',
    invoiceNumber: '',
    vatRate: 0.18,
    amountBeforeVat: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when income changes
  useEffect(() => {
    if (income) {
      const date = new Date(income.incomeDate);
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({
        customerId: income.customerId,
        incomeDate: formattedDate,
        invoiceNumber: income.invoiceNumber || '',
        vatRate: income.vatRate,
        amountBeforeVat: income.amountBeforeVat.toString(),
      });
    } else {
      setFormData({
        customerId: '',
        incomeDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        vatRate: 0.18,
        amountBeforeVat: '',
      });
    }
  }, [income, isOpen]);

  const selectedCustomer = useMemo(() => {
    return state.customers.find((c) => c.id === formData.customerId);
  }, [state.customers, formData.customerId]);

  const calculations = useMemo(() => {
    const amountBeforeVat = parseFloat(formData.amountBeforeVat) || 0;
    const vatRate = formData.vatRate || 0;
    const vatAmount = amountBeforeVat * vatRate;
    const finalAmount = amountBeforeVat + vatAmount;

    return {
      vatAmount,
      finalAmount,
    };
  }, [formData.amountBeforeVat, formData.vatRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    if (!formData.customerId) {
      toast.error(locale === 'he' ? 'אנא בחר לקוח' : 'Please select a client');
      return;
    }

    if (!formData.amountBeforeVat || parseFloat(formData.amountBeforeVat) <= 0) {
      toast.error(locale === 'he' ? 'אנא הזן סכום תקין' : 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const customer = selectedCustomer!;
      const amountBeforeVat = parseFloat(formData.amountBeforeVat);
      const vatAmount = calculations.vatAmount;
      const finalAmount = calculations.finalAmount;

      const incomeData: Partial<Income> = {
        customerId: formData.customerId,
        customerName: customer.name,
        incomeDate: new Date(formData.incomeDate),
        invoiceNumber: formData.invoiceNumber || undefined,
        vatRate: formData.vatRate,
        amountBeforeVat,
        vatAmount,
        finalAmount,
      };

      if (isEditing && income) {
        // Update existing income
        const updatedIncome = { ...income, ...incomeData, updatedAt: new Date() };
        dispatch({ type: 'UPDATE_INCOME', payload: updatedIncome });
        toast.success(locale === 'he' ? 'הכנסה עודכנה בהצלחה' : 'Income updated successfully');
      } else {
        // Create new income - call API first, then update local state with response
        const { api } = await import('../../utils/api');
        const createdIncome = await api.incomes.create(incomeData);
        dispatch({ type: 'ADD_INCOME', payload: createdIncome });
        toast.success(locale === 'he' ? 'הכנסה נוספה בהצלחה' : 'Income added successfully');
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to save income:', error);
      
      // Handle duplicate income error
      if (error.status === 409 || error.message?.includes('Duplicate')) {
        toast.error(
          locale === 'he' 
            ? 'הכנסה עם פרטים זהים כבר קיימת' 
            : 'An income with the same details already exists'
        );
      } else {
        toast.error(
          error.message || (locale === 'he' ? 'שגיאה בשמירת ההכנסה' : 'Failed to save income')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const inputAlign = isRTL ? 'text-right' : 'text-left';
  const flexDirection = isRTL ? 'flex-row-reverse' : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <DollarSign size={20} className="text-primary-500" />
          {isEditing ? t.title.edit : t.title.new}
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              <User size={16} className="inline me-2" />
              {t.fields.client} *
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${inputAlign}`}
              required
            >
              <option value="">{locale === 'he' ? 'בחר לקוח' : 'Select a client'}</option>
              {state.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Income Date */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              <Calendar size={16} className="inline me-2" />
              {t.fields.incomeDate}
            </label>
            <input
              type="date"
              value={formData.incomeDate}
              onChange={(e) => setFormData({ ...formData, incomeDate: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${inputAlign}`}
              required
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              <FileText size={16} className="inline me-2" />
              {t.fields.invoiceNumber} {t.fields.invoiceNumberOptional}
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${inputAlign}`}
              placeholder={locale === 'he' ? 'מספר חשבונית' : 'Invoice number'}
            />
          </div>

          {/* VAT Rate */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.fields.vatRate}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${inputAlign}`}
                required
              />
              <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-sm text-gray-500`}>
                ({Math.round(formData.vatRate * 100)}%)
              </span>
            </div>
          </div>

          {/* Amount Before VAT */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.fields.amountBeforeVat} *
            </label>
            <div className="relative">
              <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`}>₪</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amountBeforeVat}
                onChange={(e) => setFormData({ ...formData, amountBeforeVat: e.target.value })}
                className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${inputAlign}`}
                required
              />
            </div>
          </div>

          {/* VAT Amount (calculated, read-only) */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.fields.vatAmount} ({Math.round(formData.vatRate * 100)}%):
            </label>
            <div className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg ${inputAlign}`}>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrencyUtil(calculations.vatAmount, currency, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* Final Amount (calculated, read-only) */}
        <div>
          <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
            {t.fields.finalAmount} *
          </label>
          <div className={`w-full px-3 py-2 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg ${inputAlign}`}>
            <span className="text-green-700 dark:text-green-400 font-bold text-lg">
              {formatCurrencyUtil(calculations.finalAmount, currency, locale)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className={`flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 ${flexDirection}`}>
          <div className={`flex gap-3 ${flexDirection}`}>
            {isRTL ? (
              <>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting 
                    ? (locale === 'he' ? 'שומר...' : 'Saving...') 
                    : (isEditing ? t.buttons.update : t.buttons.add)
                  }
                </Button>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  {t.buttons.cancel}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  {t.buttons.cancel}
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting 
                    ? (locale === 'he' ? 'שומר...' : 'Saving...') 
                    : (isEditing ? t.buttons.update : t.buttons.add)
                  }
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

