/**
 * Accessibility settings - shared constants and validation.
 * Validates on load to prevent corrupt/invalid values from breaking the UI
 * (e.g. textSize: 0 causing everything to collapse to a tiny dot).
 */

import { storage } from './localStorage';

export interface AccessibilitySettings {
  textSize: number;
  highContrast: boolean;
  largeCursor: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  textSize: 100,
  highContrast: false,
  largeCursor: false,
};

export const MIN_TEXT_SIZE = 75;
export const MAX_TEXT_SIZE = 200;

/**
 * Validates and sanitizes accessibility settings.
 * Returns defaults for any invalid or corrupt values.
 */
export function validateAccessibilitySettings(
  raw: Partial<AccessibilitySettings> | null | undefined
): AccessibilitySettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  }

  const textSize = typeof raw.textSize === 'number' && !Number.isNaN(raw.textSize)
    ? Math.max(MIN_TEXT_SIZE, Math.min(MAX_TEXT_SIZE, raw.textSize))
    : DEFAULT_ACCESSIBILITY_SETTINGS.textSize;

  const highContrast = typeof raw.highContrast === 'boolean'
    ? raw.highContrast
    : DEFAULT_ACCESSIBILITY_SETTINGS.highContrast;

  const largeCursor = typeof raw.largeCursor === 'boolean'
    ? raw.largeCursor
    : DEFAULT_ACCESSIBILITY_SETTINGS.largeCursor;

  return { textSize, highContrast, largeCursor };
}

/**
 * Resets accessibility to defaults and applies to DOM.
 * Call this when UI is broken (e.g. via Ctrl+Shift+0) - no modal needed.
 */
export function resetAccessibilityToDefault(): void {
  const validated = DEFAULT_ACCESSIBILITY_SETTINGS;
  storage.set('accessibilitySettings', validated);

  const root = document.documentElement;
  root.style.fontSize = `${validated.textSize}%`;
  root.classList.remove('high-contrast', 'large-cursor');
}
