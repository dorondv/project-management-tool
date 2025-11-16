import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Save, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Locale } from '../types';
import toast from 'react-hot-toast';

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
    profileUpdated: 'הפרופיל עודכן בהצלחה',
    admin: 'מנהל',
    manager: 'מנהל פרויקט',
    contributor: 'תורם',
  },
};

export default function Profile() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];
  const alignStart = isRTL ? 'text-right' : 'text-left';

  const [profileData, setProfileData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    role: state.user?.role || 'contributor',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (state.user) {
      const updatedUser = {
        ...state.user,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role as 'admin' | 'manager' | 'contributor',
        avatar: avatarPreview || state.user.avatar,
      };
      
      // Update local state
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      // Sync to API/database
      try {
        const { api } = await import('../utils/api');
        await api.users.update(state.user.id, {
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
        });
        
        // Also update in Supabase users table if using Supabase Auth
        const { supabase } = await import('../utils/supabase');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase
            .from('users')
            .update({
              name: updatedUser.name,
              email: updatedUser.email,
              role: updatedUser.role,
              avatar: updatedUser.avatar,
            })
            .eq('id', state.user.id);
        }
        
        toast.success(t.profileUpdated);
      } catch (error) {
        console.error('Failed to sync profile to API:', error);
        toast.error('Failed to save profile. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: state.user?.name || '',
      email: state.user?.email || '',
      role: state.user?.role || 'contributor',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
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
              size="xl"
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

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.name}
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
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
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${alignStart}`}>
              {t.role}
            </label>
            <select
              value={profileData.role}
              onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-white ${alignStart}`}
            >
              <option value="contributor">{t.contributor}</option>
              <option value="manager">{t.manager}</option>
              <option value="admin">{t.admin}</option>
            </select>
            <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${alignStart}`}>
              {getRoleLabel(profileData.role)}
            </p>
          </div>

          <div className={`flex ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} pt-2`}>
            <Button
              variant="primary"
              onClick={handleSave}
              className={isRTL ? 'flex-row-reverse' : ''}
            >
              <Save size={16} />
              {t.save}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className={isRTL ? 'flex-row-reverse' : ''}
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

