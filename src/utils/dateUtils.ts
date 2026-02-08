import { format, isToday, isTomorrow, isYesterday, differenceInDays, isPast } from 'date-fns';
import { he } from 'date-fns/locale';
import { Locale } from '../types';

const getDateFnsLocale = (locale: Locale) => {
  switch (locale) {
    case 'he': return he;
    default: return undefined;
  }
};

export const formatDate = (date: Date | string, locale: Locale = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = getDateFnsLocale(locale);
  
  if (isToday(d)) {
    if (locale === 'he') return 'היום';
    return 'Today';
  }
  if (isTomorrow(d)) {
    if (locale === 'he') return 'מחר';
    return 'Tomorrow';
  }
  if (isYesterday(d)) {
    if (locale === 'he') return 'אתמול';
    return 'Yesterday';
  }
  
  return format(d, 'MMM d, yyyy', { locale: dateLocale });
};

export const formatDateTime = (date: Date | string, locale: Locale = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = getDateFnsLocale(locale);
  return format(d, 'MMM d, yyyy h:mm a', { locale: dateLocale });
};

export const isOverdue = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isPast(d) && !isToday(d);
};

export const getDaysUntilDue = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return differenceInDays(d, new Date());
};

export const getDeadlineStatus = (date: Date | string): 'overdue' | 'due-soon' | 'upcoming' => {
  const days = getDaysUntilDue(date);
  
  if (days < 0) return 'overdue';
  if (days <= 2) return 'due-soon';
  return 'upcoming';
};