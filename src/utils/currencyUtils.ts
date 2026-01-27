import { Currency, Locale } from '../types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<Locale, Record<Currency, string>> = {
  en: {
    ILS: 'Israeli Shekel (₪)',
    USD: 'US Dollar ($)',
    EUR: 'Euro (€)',
  },
  he: {
    ILS: 'שקל ישראלי (₪)',
    USD: 'דולר אמריקאי ($)',
    EUR: 'אירו (€)',
  },
};

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

export function formatCurrency(amount: number, currency: Currency, locale: Locale): string {
  const symbol = getCurrencySymbol(currency);
  
  if (currency === 'ILS') {
    return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    }).format(amount);
  }
  
  if (currency === 'USD') {
    return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    }).format(amount);
  }
  
  if (currency === 'EUR') {
    return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    }).format(amount);
  }
  
  return `${symbol}${amount.toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
  })}`;
}
