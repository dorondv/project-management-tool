import { useState, useEffect } from 'react';
import { Plus, X, DollarSign, FileText, Calculator, Users, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Customer, Locale, CustomerStatus, PaymentMethod, PaymentFrequency, BillingModel } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onCustomerCreated?: (customerId: string) => void;
  onDelete?: (customerId: string) => void;
}

const translations = {
  en: {
    title: 'New Customer',
    editTitle: 'Edit Customer',
    basicInfo: 'Basic Information',
    customerName: 'Customer Name',
    customerNamePlaceholder: 'Enter customer name',
    status: 'Status',
    selectStatus: 'Select status',
    joinDate: 'Join Date',
    selectDate: 'Select date',
    email: 'Email',
    emailPlaceholder: 'email@example.com',
    taxId: 'Tax ID / Company ID',
    taxIdPlaceholder: '123456789',
    phone: 'Phone',
    phonePlaceholder: '050-1234567',
    address: 'Address',
    addressPlaceholder: 'Street, house number, city',
    country: 'Country',
    selectCountry: 'Select country',
    israel: 'Israel',
    usa: 'USA',
    uk: 'United Kingdom',
    germany: 'Germany',
    france: 'France',
    canada: 'Canada',
    australia: 'Australia',
    other: 'Other',
    contactPerson: 'Contact Person Information',
    contactName: 'Contact Name',
    contactNamePlaceholder: 'Contact person name',
    contactPhone: 'Phone',
    contactEmail: 'Email',
    contactEmailPlaceholder: 'contact@example.com',
    paymentSettings: 'Payment Settings',
    paymentMethod: 'Payment Method',
    selectPaymentMethod: 'Select payment method',
    hourly: 'Hourly Payment',
    monthlyRetainer: 'Monthly Retainer',
    projectBased: 'Project Payment',
    hourlyRate: 'Hourly Rate (₪)',
    hourlyRatePlaceholder: '300',
    monthlyRetainerAmount: 'Monthly Retainer (₪)',
    monthlyRetainerPlaceholder: '10000',
    estimatedHours: 'Estimated Work Hours',
    estimatedHoursPlaceholder: '30',
    projectBudget: 'Project Budget (₪)',
    projectBudgetPlaceholder: '25000',
    calculatedRate: 'Calculated Rate',
    perHour: 'per hour',
    leadSource: 'Lead Source',
    whereDidCustomerComeFrom: 'Where did the customer come from?',
    selectLeadSource: 'Select lead source',
    google: 'Google',
    facebookInstagram: 'Facebook / Instagram',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    wordOfMouth: 'Word of Mouth',
    clientReferral: 'Referral from Existing Client',
    selectReferringClient: 'Select referring client',
    noReferral: 'No referral',
    notes: 'Notes',
    notesPlaceholder: 'Additional notes about the customer...',
    cancel: 'Cancel',
    addCustomer: 'Add Customer',
    updateCustomer: 'Update Customer',
    active: 'Active',
    inactive: 'Inactive',
    trial: 'Trial',
    paused: 'Paused',
    churned: 'Churned',
  },
  he: {
    title: 'לקוח חדש',
    editTitle: 'עריכת לקוח',
    basicInfo: 'פרטים בסיסיים',
    customerName: 'שם הלקוח',
    customerNamePlaceholder: 'הכנס שם הלקוח',
    status: 'סטטוס',
    selectStatus: 'בחר סטטוס',
    joinDate: 'תאריך הצטרפות',
    selectDate: 'בחר תאריך',
    email: 'אימייל',
    emailPlaceholder: 'email@example.com',
    taxId: 'ח״פ / ע.מ.',
    taxIdPlaceholder: '123456789',
    phone: 'טלפון',
    phonePlaceholder: '050-1234567',
    address: 'כתובת',
    addressPlaceholder: 'רחוב, מספר בית, עיר',
    country: 'מדינה',
    selectCountry: 'בחר מדינה',
    israel: 'ישראל',
    usa: 'ארה״ב',
    uk: 'בריטניה',
    germany: 'גרמניה',
    france: 'צרפת',
    canada: 'קנדה',
    australia: 'אוסטרליה',
    other: 'אחר',
    contactPerson: 'פרטי איש קשר',
    contactName: 'שם איש קשר',
    contactNamePlaceholder: 'שם איש הקשר',
    contactPhone: 'טלפון',
    contactEmail: 'אימייל',
    contactEmailPlaceholder: 'contact@example.com',
    paymentSettings: 'הגדרות תשלום',
    paymentMethod: 'אופן התשלום',
    selectPaymentMethod: 'בחר אופן תשלום',
    hourly: 'תשלום שעתי',
    monthlyRetainer: 'ריטיינר חודשי',
    projectBased: 'תשלום פרויקט',
    hourlyRate: 'תעריף שעתי (₪)',
    hourlyRatePlaceholder: '300',
    monthlyRetainerAmount: 'ריטיינר חודשי (₪)',
    monthlyRetainerPlaceholder: '10000',
    estimatedHours: 'שעות עבודה מוערכות',
    estimatedHoursPlaceholder: '30',
    projectBudget: 'תקציב פרויקט (₪)',
    projectBudgetPlaceholder: '25000',
    calculatedRate: 'תעריף מחושב',
    perHour: 'לשעה',
    leadSource: 'מקור הגעה',
    whereDidCustomerComeFrom: 'מאיפה הלקוח הגיע?',
    selectLeadSource: 'בחר מקור הגעה',
    google: 'גוגל',
    facebookInstagram: 'פייסבוק / אינסטגרם',
    tiktok: 'טיקטוק',
    linkedin: 'לינקדאין',
    wordOfMouth: 'המלצת פה לאוזן',
    clientReferral: 'הפנייה מלקוח קיים',
    selectReferringClient: 'בחר את הלקוח המפנה',
    noReferral: 'ללא הפנייה',
    notes: 'הערות',
    notesPlaceholder: 'הערות נוספות על הלקוח...',
    cancel: 'ביטול',
    addCustomer: 'הוסף לקוח',
    updateCustomer: 'עדכן לקוח',
    deleteCustomer: 'מחק לקוח',
    active: 'פעיל',
    inactive: 'לא פעיל',
    trial: 'ניסיון',
    paused: 'מושהה',
    churned: 'נטש',
  },
} as const;

// Full list of countries with English and Hebrew names
const countries = [
  { code: 'AF', en: 'Afghanistan', he: 'אפגניסטן' },
  { code: 'AL', en: 'Albania', he: 'אלבניה' },
  { code: 'DZ', en: 'Algeria', he: 'אלג\'יריה' },
  { code: 'AR', en: 'Argentina', he: 'ארגנטינה' },
  { code: 'AU', en: 'Australia', he: 'אוסטרליה' },
  { code: 'AT', en: 'Austria', he: 'אוסטריה' },
  { code: 'BH', en: 'Bahrain', he: 'בחריין' },
  { code: 'BD', en: 'Bangladesh', he: 'בנגלדש' },
  { code: 'BE', en: 'Belgium', he: 'בלגיה' },
  { code: 'BR', en: 'Brazil', he: 'ברזיל' },
  { code: 'BG', en: 'Bulgaria', he: 'בולגריה' },
  { code: 'CA', en: 'Canada', he: 'קנדה' },
  { code: 'CL', en: 'Chile', he: 'צ\'ילה' },
  { code: 'CN', en: 'China', he: 'סין' },
  { code: 'CO', en: 'Colombia', he: 'קולומביה' },
  { code: 'HR', en: 'Croatia', he: 'קרואטיה' },
  { code: 'CZ', en: 'Czech Republic', he: 'צ\'כיה' },
  { code: 'DK', en: 'Denmark', he: 'דנמרק' },
  { code: 'EG', en: 'Egypt', he: 'מצרים' },
  { code: 'EE', en: 'Estonia', he: 'אסטוניה' },
  { code: 'FI', en: 'Finland', he: 'פינלנד' },
  { code: 'FR', en: 'France', he: 'צרפת' },
  { code: 'DE', en: 'Germany', he: 'גרמניה' },
  { code: 'GR', en: 'Greece', he: 'יוון' },
  { code: 'HK', en: 'Hong Kong', he: 'הונג קונג' },
  { code: 'HU', en: 'Hungary', he: 'הונגריה' },
  { code: 'IN', en: 'India', he: 'הודו' },
  { code: 'ID', en: 'Indonesia', he: 'אינדונזיה' },
  { code: 'IE', en: 'Ireland', he: 'אירלנד' },
  { code: 'IL', en: 'Israel', he: 'ישראל' },
  { code: 'IT', en: 'Italy', he: 'איטליה' },
  { code: 'JP', en: 'Japan', he: 'יפן' },
  { code: 'JO', en: 'Jordan', he: 'ירדן' },
  { code: 'KE', en: 'Kenya', he: 'קניה' },
  { code: 'KW', en: 'Kuwait', he: 'כווית' },
  { code: 'LV', en: 'Latvia', he: 'לטביה' },
  { code: 'LB', en: 'Lebanon', he: 'לבנון' },
  { code: 'LT', en: 'Lithuania', he: 'ליטא' },
  { code: 'LU', en: 'Luxembourg', he: 'לוקסמבורג' },
  { code: 'MY', en: 'Malaysia', he: 'מלזיה' },
  { code: 'MX', en: 'Mexico', he: 'מקסיקו' },
  { code: 'MA', en: 'Morocco', he: 'מרוקו' },
  { code: 'NL', en: 'Netherlands', he: 'הולנד' },
  { code: 'NZ', en: 'New Zealand', he: 'ניו זילנד' },
  { code: 'NG', en: 'Nigeria', he: 'ניגריה' },
  { code: 'NO', en: 'Norway', he: 'נורווגיה' },
  { code: 'OM', en: 'Oman', he: 'עומאן' },
  { code: 'PK', en: 'Pakistan', he: 'פקיסטן' },
  { code: 'PE', en: 'Peru', he: 'פרו' },
  { code: 'PH', en: 'Philippines', he: 'הפיליפינים' },
  { code: 'PL', en: 'Poland', he: 'פולין' },
  { code: 'PT', en: 'Portugal', he: 'פורטוגל' },
  { code: 'QA', en: 'Qatar', he: 'קטאר' },
  { code: 'RO', en: 'Romania', he: 'רומניה' },
  { code: 'RU', en: 'Russia', he: 'רוסיה' },
  { code: 'SA', en: 'Saudi Arabia', he: 'ערב הסעודית' },
  { code: 'SG', en: 'Singapore', he: 'סינגפור' },
  { code: 'ZA', en: 'South Africa', he: 'דרום אפריקה' },
  { code: 'KR', en: 'South Korea', he: 'דרום קוריאה' },
  { code: 'ES', en: 'Spain', he: 'ספרד' },
  { code: 'SE', en: 'Sweden', he: 'שוודיה' },
  { code: 'CH', en: 'Switzerland', he: 'שווייץ' },
  { code: 'TW', en: 'Taiwan', he: 'טייוואן' },
  { code: 'TH', en: 'Thailand', he: 'תאילנד' },
  { code: 'TR', en: 'Turkey', he: 'טורקיה' },
  { code: 'UA', en: 'Ukraine', he: 'אוקראינה' },
  { code: 'AE', en: 'United Arab Emirates', he: 'איחוד האמירויות הערביות' },
  { code: 'GB', en: 'United Kingdom', he: 'בריטניה' },
  { code: 'US', en: 'United States', he: 'ארצות הברית' },
  { code: 'VN', en: 'Vietnam', he: 'וייטנאם' },
];

export function CreateCustomerModal({ isOpen, onClose, customer, onCustomerCreated, onDelete }: CreateCustomerModalProps) {
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as CustomerStatus,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    country: '',
    taxId: '',
    joinDate: new Date(),
    industry: '',
    paymentMethod: 'bank-transfer' as PaymentMethod,
    billingCycle: 'monthly' as PaymentFrequency,
    billingModel: 'hourly' as BillingModel,
    currency: '₪',
    hourlyRate: 0, // For hourly billing model
    monthlyRetainer: 0, // For retainer billing model
    annualFee: 0, // For project billing model (used as project budget)
    hoursPerMonth: 0,
    customerScore: 0,
    notes: '',
    referralSource: '',
  });

  const [joinDate, setJoinDate] = useState<Date | null>(customer?.joinDate ? new Date(customer.joinDate) : new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset submitting state when modal opens/closes
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }

    if (customer) {
      setFormData({
        name: customer.name,
        status: customer.status,
        contactName: customer.contactName,
        contactEmail: customer.contactEmail,
        contactPhone: customer.contactPhone,
        country: customer.country,
        taxId: customer.taxId,
        joinDate: customer.joinDate,
        industry: customer.industry || '',
        paymentMethod: customer.paymentMethod,
        billingCycle: customer.billingCycle,
        billingModel: customer.billingModel,
        currency: customer.currency,
        hourlyRate: customer.billingModel === 'hourly' ? customer.monthlyRetainer : 0,
        monthlyRetainer: customer.billingModel === 'retainer' ? customer.monthlyRetainer : 0,
        annualFee: customer.billingModel === 'project' ? customer.annualFee : 0,
        hoursPerMonth: customer.hoursPerMonth,
        customerScore: customer.customerScore,
        notes: customer.notes || '',
        referralSource: customer.referralSource || '',
      });
      setJoinDate(customer.joinDate ? new Date(customer.joinDate) : new Date());
    } else {
      // Reset form for new customer
      setFormData({
        name: '',
        status: 'active',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        country: '',
        taxId: '',
        joinDate: new Date(),
        industry: '',
        paymentMethod: 'bank-transfer',
        billingCycle: 'monthly',
        billingModel: 'hourly',
        currency: '₪',
        hourlyRate: 0,
        monthlyRetainer: 0,
        annualFee: 0,
        hoursPerMonth: 0,
        customerScore: 0,
        notes: '',
        referralSource: '',
      });
      setJoinDate(new Date());
    }
  }, [customer, isOpen]);

  const calculateHourlyRate = (): number => {
    if (formData.billingModel === 'hourly') {
      return formData.hourlyRate || 0;
    } else if (formData.billingModel === 'retainer' && formData.hoursPerMonth > 0) {
      return Math.round(formData.monthlyRetainer / formData.hoursPerMonth);
    } else if (formData.billingModel === 'project' && formData.hoursPerMonth > 0) {
      return Math.round(formData.annualFee / formData.hoursPerMonth);
    }
    return 0;
  };

  const calculatedHourlyRate = calculateHourlyRate();
  const showEstimatedHours = formData.billingModel === 'retainer' || formData.billingModel === 'project';
  const showCalculatedRate = showEstimatedHours && formData.hoursPerMonth > 0 && calculatedHourlyRate > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    if (!formData.name.trim()) {
      toast.error(isRTL ? 'יש להזין שם לקוח' : 'Customer name is required');
      return;
    }

    // Prevent double submission - check state and return early if already submitting
    if (isSubmitting) {
      console.warn('⚠️ CreateCustomerModal: Submission already in progress, ignoring duplicate submit');
      return;
    }

    // Ensure we have a user ID
    if (!state.user?.id) {
      toast.error(isRTL ? 'שגיאה: לא נמצא משתמש מחובר' : 'Error: No user logged in');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare customer data matching Prisma schema
      const customerData: any = {
        name: formData.name,
        status: formData.status,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        country: formData.country || '',
        taxId: formData.taxId || '',
        joinDate: joinDate || new Date(),
        industry: formData.industry || null,
        paymentMethod: formData.paymentMethod,
        billingCycle: formData.billingCycle,
        billingModel: formData.billingModel,
        currency: formData.currency,
        monthlyRetainer: formData.billingModel === 'hourly' ? formData.hourlyRate : (formData.billingModel === 'retainer' ? formData.monthlyRetainer : 0),
        annualFee: formData.billingModel === 'project' ? formData.annualFee : formData.annualFee,
        hoursPerMonth: formData.hoursPerMonth,
        customerScore: formData.customerScore,
        notes: formData.notes || null,
        referralSource: formData.referralSource || null,
        userId: state.user.id, // Always include userId
      };

      if (customer) {
        // Update existing customer
        const updatedCustomer = await api.customers.update(customer.id, customerData);
        dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
        toast.success(isRTL ? 'לקוח עודכן בהצלחה' : 'Customer updated successfully');
      } else {
        // Create new customer
        const newCustomer = await api.customers.create(customerData);
        dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
        toast.success(isRTL ? 'לקוח נוסף בהצלחה' : 'Customer added successfully');
        
        // Notify parent component about the new customer
        if (onCustomerCreated) {
          onCustomerCreated(newCustomer.id);
        }
      }

      // Close modal after successful save
      onClose();
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      toast.error(error.message || (isRTL ? 'שגיאה בשמירת הלקוח' : 'Failed to save customer'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customer || !customer.id || !onDelete) {
      return;
    }

    const projectCount = state.projects.filter(p => p.customerId === customer.id).length;
    const confirmMessage = isRTL
      ? projectCount > 0
        ? `האם אתה בטוח שברצונך למחוק את הלקוח "${customer.name}"? יש ${projectCount} פרויקט(ים) המשויכים ללקוח זה.`
        : `האם אתה בטוח שברצונך למחוק את הלקוח "${customer.name}"?`
      : projectCount > 0
        ? `Are you sure you want to delete the customer "${customer.name}"? There are ${projectCount} project(s) associated with this customer.`
        : `Are you sure you want to delete the customer "${customer.name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        onDelete(customer.id);
        onClose();
      } catch (error: any) {
        console.error('Failed to delete customer:', error);
        toast.error(error.message || (isRTL ? 'שגיאה במחיקת הלקוח' : 'Failed to delete customer'));
      }
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const alignStart = isRTL ? 'text-right' : 'text-left';
  const flexDirection = isRTL ? 'flex-row-reverse' : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? t.editTitle : t.title}
      titleIcon={<Plus className="w-5 h-5 text-primary-500" />}
      size="xl"
    >
      <form onSubmit={handleSubmit} className={`space-y-6 ${alignStart}`} dir={isRTL ? 'rtl' : 'ltr'} noValidate>
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className={`font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-lg border-b pb-2 ${flexDirection}`}>
            <FileText className="w-5 h-5 text-primary-500" />
            {t.basicInfo}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.customerName} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.customerNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.status} *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as CustomerStatus)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
              >
                <option value="active">{t.active}</option>
                <option value="trial">{t.trial}</option>
                <option value="paused">{t.paused}</option>
                <option value="churned">{t.churned}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.joinDate}
              </label>
              <input
                type="date"
                value={joinDate ? format(joinDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setJoinDate(e.target.value ? new Date(e.target.value) : null)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.email}
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.emailPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.taxId}
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.taxIdPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.phone}
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.phonePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.address}
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.addressPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.country}
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
              >
                <option value="">{t.selectCountry}</option>
                {countries.map((country) => (
                  <option key={country.code} value={locale === 'he' ? country.he : country.en}>
                    {locale === 'he' ? country.he : country.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Person Information */}
        <div className="space-y-4">
          <h3 className={`font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-lg border-b pb-2 ${flexDirection}`}>
            <Users className="w-5 h-5 text-primary-500" />
            {t.contactPerson}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.contactName}
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.contactNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.contactPhone}
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.phonePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.contactEmail}
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                placeholder={t.contactEmailPlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="space-y-4">
          <h3 className={`font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-lg border-b pb-2 ${flexDirection}`}>
            <DollarSign className="w-5 h-5 text-primary-500" />
            {t.paymentSettings}
          </h3>
          
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.paymentMethod} *
              </label>
              <select
                value={formData.billingModel}
                onChange={(e) => handleChange('billingModel', e.target.value as BillingModel)}
                className={`w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
              >
                <option value="hourly">{t.hourly}</option>
                <option value="retainer">{t.monthlyRetainer}</option>
                <option value="project">{t.projectBased}</option>
              </select>
            </div>

            {formData.billingModel === 'hourly' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.hourlyRate} *
                </label>
                <input
                  type="number"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value) || 0)}
                  className={`w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                  placeholder={t.hourlyRatePlaceholder}
                  required
                />
              </div>
            )}
            
            {formData.billingModel === 'retainer' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.monthlyRetainerAmount} *
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyRetainer || ''}
                    onChange={(e) => handleChange('monthlyRetainer', parseFloat(e.target.value) || 0)}
                    className={`w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                    placeholder={t.monthlyRetainerPlaceholder}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.estimatedHours} *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hoursPerMonth || ''}
                    onChange={(e) => handleChange('hoursPerMonth', parseFloat(e.target.value) || 0)}
                    className={`w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                    placeholder={t.estimatedHoursPlaceholder}
                    required
                  />
                </div>
              </>
            )}
            
            {formData.billingModel === 'project' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.projectBudget} *
                  </label>
                  <input
                    type="number"
                    value={formData.annualFee || ''}
                    onChange={(e) => handleChange('annualFee', parseFloat(e.target.value) || 0)}
                    className={`w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                    placeholder={t.projectBudgetPlaceholder}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.estimatedHours} *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hoursPerMonth || ''}
                    onChange={(e) => handleChange('hoursPerMonth', parseFloat(e.target.value) || 0)}
                    className={`w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                    placeholder={t.estimatedHoursPlaceholder}
                    required
                  />
                </div>
              </>
            )}

            {showCalculatedRate && (
              <div className="space-y-2">
                <label className={`flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 ${flexDirection}`}>
                  <Calculator className="w-3 h-3 text-primary-500" />
                  {t.calculatedRate}
                </label>
                <div className={`h-10 px-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl border-2 border-primary-200 dark:border-primary-700 flex items-center justify-between w-48 ${flexDirection}`}>
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-300">
                    {formData.currency}{calculatedHourlyRate.toLocaleString()}
                  </span>
                  <span className="text-xs text-primary-600 dark:text-primary-400">{t.perHour}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Source */}
        <div className="space-y-4">
          <h3 className={`font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-lg border-b pb-2 ${flexDirection}`}>
            <Users className="w-5 h-5 text-primary-500" />
            {t.leadSource}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.whereDidCustomerComeFrom}
              </label>
              <select
                value={formData.referralSource}
                onChange={(e) => handleChange('referralSource', e.target.value)}
                className={`w-52 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
              >
                <option value="">{t.selectLeadSource}</option>
                <option value="google">{t.google}</option>
                <option value="facebook_instagram">{t.facebookInstagram}</option>
                <option value="tiktok">{t.tiktok}</option>
                <option value="linkedin">{t.linkedin}</option>
                <option value="word_of_mouth">{t.wordOfMouth}</option>
                <option value="client_referral">{t.clientReferral}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>

            {formData.referralSource === 'client_referral' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.selectReferringClient}
                </label>
                <select
                  value={formData.referralSource}
                  onChange={(e) => handleChange('referralSource', e.target.value)}
                  className={`w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${alignStart}`}
                >
                  <option value="client_referral">{t.noReferral}</option>
                  {state.customers
                    .filter(c => c.id !== customer?.id)
                    .map(referringCustomer => (
                      <option key={referringCustomer.id} value={referringCustomer.id}>
                        {referringCustomer.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.notes}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-w-2xl ${alignStart}`}
            rows={3}
            placeholder={t.notesPlaceholder}
          />
        </div>

        <div className={`flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700 ${flexDirection}`}>
          {customer && onDelete && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
            >
              <Trash2 size={16} className="mr-2" />
              {t.deleteCustomer}
            </Button>
          )}
          <div className={`flex gap-3 ${flexDirection} ${customer && onDelete ? '' : 'ml-auto'}`}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t.cancel}
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={`flex items-center gap-2 ${flexDirection}`}>
                  <LoadingSpinner size="sm" />
                  {isRTL ? 'שומר...' : 'Saving...'}
                </span>
              ) : (
                customer ? t.updateCustomer : t.addCustomer
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

