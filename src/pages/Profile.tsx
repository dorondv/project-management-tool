import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Save, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Locale } from '../types';
import toast from 'react-hot-toast';

// Compress image to reduce file size
const compressImage = (file: File, maxSizeMB: number = 0.5): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions (max 800x800)
        const maxDimension = 800;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with quality adjustment
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        // If still too large, reduce quality
        while (result.length > maxSizeMB * 1024 * 1024 && quality > 0.3) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

const translations: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  profileInformation: string;
  changeAvatar: string;
  name: string;
  email: string;
  role: string;
  save: string;
  cancel: string;
  saving: string;
  profileUpdated: string;
  admin: string;
  manager: string;
  contributor: string;
}> = {
  en: {
    pageTitle: 'Profile',
    pageSubtitle: 'Manage your profile information',
    profileInformation: 'Profile Information',
    changeAvatar: 'Change Avatar',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving...',
    profileUpdated: 'Profile updated successfully',
    admin: 'Admin',
    manager: 'Manager',
    contributor: 'Contributor',
  },
  he: {
    pageTitle: 'פרופיל',
    pageSubtitle: 'נהל את פרטי הפרופיל שלך',
    profileInformation: 'פרטי פרופיל',
    changeAvatar: 'שנה תמונת פרופיל',
    name: 'שם',
    email: 'אימייל',
    role: 'תפקיד',
    save: 'שמור',
    cancel: 'ביטול',
    saving: 'שומר...',
    profileUpdated: 'הפרופיל עודכן בהצלחה',
    admin: 'מנהל',
    manager: 'מנהל פרויקט',
    contributor: 'חבר צוות',
  },
};

export default function Profile() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';
  const isAdmin = state.user?.role === 'admin';

  const [profileData, setProfileData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    role: state.user?.role || 'manager',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show loading toast
        const loadingToast = toast.loading(isRTL ? 'מעבד תמונה...' : 'Processing image...');
        
        // Compress the image
        const compressedDataUrl = await compressImage(file, 0.5); // Max 500KB
        
        setAvatarFile(file);
        setAvatarPreview(compressedDataUrl);
        
        toast.dismiss(loadingToast);
        toast.success(isRTL ? 'תמונה נטענה בהצלחה' : 'Image loaded successfully');
      } catch (error) {
        console.error('Failed to process image:', error);
        toast.error(isRTL ? 'שגיאה בעיבוד התמונה' : 'Failed to process image');
      }
    }
  };

  const handleSave = async () => {
    if (state.user && !isSaving) {
      setIsSaving(true);
      
      // Role rules:
      // - Non-admin users are always managers
      // - Admin users are always admins
      const allowedRole: 'admin' | 'manager' = isAdmin ? 'admin' : 'manager';
      
      const updatedUser = {
        ...state.user,
        name: profileData.name,
        email: profileData.email,
        role: allowedRole,
        avatar: avatarPreview || state.user.avatar,
      };
      
      // Sync to backend API first
      try {
        const { api } = await import('../utils/api');
        await api.users.update(state.user.id, {
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
        });
        
        // Update local state after successful API call
        dispatch({ type: 'SET_USER', payload: updatedUser });
        
        toast.success(t.profileUpdated);
        // Navigate back after successful save
        setTimeout(() => navigate(-1), 500);
      } catch (error) {
        console.error('Failed to sync profile to API:', error);
        toast.error(isRTL ? 'שגיאה בשמירת הפרופיל' : 'Failed to save profile. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    // Navigate back to previous page
    navigate(-1);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return t.admin;
      case 'manager':
        return t.manager;
      case 'contributor':
        return t.contributor;
      default:
        return role;
    }
  };

  if (!state.user) {
    return null;
  }

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

      {/* Profile Information */}
      <Card className="p-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} mb-6`}>
          <User size={20} className="text-primary-500" />
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${alignStart}`}>
            {t.profileInformation}
          </h3>
        </div>

        {/* Avatar Section */}
        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} items-center gap-6 mb-6`}>
          <div className="relative">
            <Avatar
              src={avatarPreview || state.user.avatar}
              alt={state.user.name}
              className="w-12 h-12"
              isOnline={state.user.isOnline}
            />
            <label
              htmlFor="avatar-upload"
              className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors`}
            >
              <Camera size={16} />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div className={`flex-1 ${alignStart}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.changeAvatar}
            </p>
          </div>
        </div>

        {/* Form Fields - Max width for better layout */}
        <div className="space-y-4 max-w-xl">
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.name}
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              disabled={isSaving}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${alignStart}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.email}
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              disabled={isSaving}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${alignStart}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.role}
            </label>
            {isAdmin ? (
              <input
                type="text"
                value={t.admin}
                disabled
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white opacity-80 ${alignStart}`}
              />
            ) : null}
          </div>

          <div className={`flex gap-3 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className={`${isRTL ? 'flex-row-reverse' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t.save}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className={`${isRTL ? 'flex-row-reverse' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <X size={16} />
              {t.cancel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

