import { format, isToday, isTomorrow, isYesterday, differenceInDays, isPast } from 'date-fns';
import { he, es, de, ptBR, fr } from 'date-fns/locale';
import type { Locale } from '../types';

const getDateFnsLocale = (locale: Locale) => {
  switch (locale) {
    case 'he': return he;
    case 'es': return es;
    case 'de': return de;
    case 'pt': return ptBR;
    case 'fr': return fr;
    default: return undefined;
  }
};

export const formatDate = (date: Date | string, locale: Locale = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateLocale = getDateFnsLocale(locale);
  
  if (isToday(d)) {
    if (locale === 'he') return 'היום';
    if (locale === 'es') return 'Hoy';
    if (locale === 'de') return 'Heute';
    if (locale === 'pt') return 'Hoje';
    if (locale === 'fr') return 'Aujourd\'hui';
    return 'Today';
  }
  if (isTomorrow(d)) {
    if (locale === 'he') return 'מחר';
    if (locale === 'es') return 'Mañana';
    if (locale === 'de') return 'Morgen';
    if (locale === 'pt') return 'Amanhã';
    if (locale === 'fr') return 'Demain';
    return 'Tomorrow';
  }
  if (isYesterday(d)) {
    if (locale === 'he') return 'אתמול';
    if (locale === 'es') return 'Ayer';
    if (locale === 'de') return 'Gestern';
    if (locale === 'pt') return 'Ontem';
    if (locale === 'fr') return 'Hier';
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