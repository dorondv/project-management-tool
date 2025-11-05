import { useState, useEffect } from 'react';
import { Type, Contrast, MousePointer, RotateCcw, Plus, Minus } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useApp } from '../../context/AppContext';
import { Locale } from '../../types';
import { storage } from '../../utils/localStorage';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccessibilitySettings {
  textSize: number; // percentage (100, 125, 150, etc.)
  highContrast: boolean;
  largeCursor: boolean;
}

const translations: Record<
  Locale,
  {
    title: string;
    description: string;
    textSize: string;
    highContrast: string;
    largeCursor: string;
    resetSettings: string;
  }
> = {
  en: {
    title: 'Accessibility adjustments',
    description: 'Adjust the site\'s display to your needs. Changes will be saved for future browsing sessions.',
    textSize: 'Text size',
    highContrast: 'High contrast',
    largeCursor: 'Large cursor',
    resetSettings: 'Reset settings',
  },
  he: {
    title: 'התאמות נגישות',
    description: 'התאם את תצוגת האתר לצרכים שלך. השינויים יישמרו לגלישות הבאות.',
    textSize: 'גודל טקסט',
    highContrast: 'ניגודיות גבוהה',
    largeCursor: 'סמן גדול',
    resetSettings: 'אפס הגדרות',
  },
};

const TEXT_SIZE_STEP = 25;
const MIN_TEXT_SIZE = 75;
const MAX_TEXT_SIZE = 200;

export function AccessibilityModal({ isOpen, onClose }: AccessibilityModalProps) {
  const { state } = useApp();
  const locale: Locale = state.locale ?? 'en';
  const isRTL = locale === 'he';
  const t = translations[locale];

  const [settings, setSettings] = useState<AccessibilitySettings>({
    textSize: 100,
    highContrast: false,
    largeCursor: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = storage.get<AccessibilitySettings>('accessibilitySettings');
    if (savedSettings) {
      setSettings(savedSettings);
      applySettings(savedSettings);
    }
  }, []);

  // Apply settings to document
  const applySettings = (settingsToApply: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Apply text size
    root.style.fontSize = `${settingsToApply.textSize}%`;
    
    // Apply high contrast
    if (settingsToApply.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply large cursor
    if (settingsToApply.largeCursor) {
      root.classList.add('large-cursor');
    } else {
      root.classList.remove('large-cursor');
    }
  };

  // Save and apply settings
  const updateSettings = (newSettings: AccessibilitySettings) => {
    setSettings(newSettings);
    storage.set('accessibilitySettings', newSettings);
    applySettings(newSettings);
  };

  const handleTextSizeIncrease = () => {
    const newSize = Math.min(settings.textSize + TEXT_SIZE_STEP, MAX_TEXT_SIZE);
    updateSettings({ ...settings, textSize: newSize });
  };

  const handleTextSizeDecrease = () => {
    const newSize = Math.max(settings.textSize - TEXT_SIZE_STEP, MIN_TEXT_SIZE);
    updateSettings({ ...settings, textSize: newSize });
  };

  const handleHighContrastToggle = () => {
    updateSettings({ ...settings, highContrast: !settings.highContrast });
  };

  const handleLargeCursorToggle = () => {
    updateSettings({ ...settings, largeCursor: !settings.largeCursor });
  };

  const handleReset = () => {
    const defaultSettings: AccessibilitySettings = {
      textSize: 100,
      highContrast: false,
      largeCursor: false,
    };
    updateSettings(defaultSettings);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.title} size="md">
      <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t.description}
        </p>

        {/* Text Size Control */}
        <div className="space-y-3">
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Type size={20} className="text-gray-600 dark:text-gray-400" />
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              {t.textSize}
            </label>
          </div>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleTextSizeDecrease}
              disabled={settings.textSize <= MIN_TEXT_SIZE}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease text size"
            >
              <Minus size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {settings.textSize}%
              </span>
            </div>
            <button
              onClick={handleTextSizeIncrease}
              disabled={settings.textSize >= MAX_TEXT_SIZE}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase text size"
            >
              <Plus size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* High Contrast Toggle */}
        <button
          onClick={handleHighContrastToggle}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
            isRTL ? 'flex-row-reverse' : ''
          } ${
            settings.highContrast
              ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/20 dark:border-primary-700'
              : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
          }`}
        >
          <Contrast size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
            {t.highContrast}
          </span>
        </button>

        {/* Large Cursor Toggle */}
        <button
          onClick={handleLargeCursorToggle}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
            isRTL ? 'flex-row-reverse' : ''
          } ${
            settings.largeCursor
              ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/20 dark:border-primary-700'
              : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
          }`}
        >
          <MousePointer size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
            {t.largeCursor}
          </span>
        </button>

        {/* Reset Button */}
        <Button
          onClick={handleReset}
          variant="outline"
          fullWidth
          icon={<RotateCcw size={18} />}
          className={isRTL ? 'flex-row-reverse' : ''}
        >
          {t.resetSettings}
        </Button>
      </div>
    </Modal>
  );
}

