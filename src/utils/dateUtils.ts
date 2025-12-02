import { format, isToday, isTomorrow, isYesterday, differenceInDays, isPast } from 'date-fns';
import { he } from 'date-fns/locale';
import { Locale } from '../types';

export const formatDate = (date: Date | string, locale: Locale = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = locale === 'he' ? he : undefined;
  
  if (isToday(d)) return locale === 'he' ? 'היום' : 'Today';
  if (isTomorrow(d)) return locale === 'he' ? 'מחר' : 'Tomorrow';
  if (isYesterday(d)) return locale === 'he' ? 'אתמול' : 'Yesterday';
  
  return format(d, 'MMM d, yyyy', { locale: dateLocale });
};

export const formatDateTime = (date: Date | string, locale: Locale = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = locale === 'he' ? he : undefined;
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