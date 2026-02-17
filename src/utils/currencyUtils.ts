import { Currency, Locale } from '../types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<Locale, Record<Currency, string>> = {
  en: { ILS: 'Israeli Shekel (₪)', USD: 'US Dollar ($)', EUR: 'Euro (€)' },
  he: { ILS: 'שקל ישראלי (₪)', USD: 'דולר אמריקאי ($)', EUR: 'אירו (€)' },
  es: { ILS: 'Nuevo séquel (₪)', USD: 'Dólar estadounidense ($)', EUR: 'Euro (€)' },
  de: { ILS: 'Israelischer Schekel (₪)', USD: 'US-Dollar ($)', EUR: 'Euro (€)' },
  pt: { ILS: 'Novo shekel (₪)', USD: 'Dólar americano ($)', EUR: 'Euro (€)' },
  fr: { ILS: 'Nouveau shekel (₪)', USD: 'Dollar américain ($)', EUR: 'Euro (€)' },
};

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

const getIntlLocale = (locale: Locale, currency: Currency): string => {
  switch (locale) {
    case 'he': return 'he-IL';
    case 'es': return 'es-ES';
    case 'de': return 'de-DE';
    case 'pt': return 'pt-PT';
    case 'fr': return 'fr-FR';
    default:
      if (currency === 'ILS') return 'en-IL';
      return 'en-US';
  }
};

export function formatCurrency(amount: number, currency: Currency, locale: Locale): string {
  const symbol = getCurrencySymbol(currency);
  const intlLocale = getIntlLocale(locale, currency);
  
  if (currency === 'ILS') {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    }).format(amount);
  }
  
  if (currency === 'USD') {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    }).format(amount);
  }
  
  if (currency === 'EUR') {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    }).format(amount);
  }
  
  return `${symbol}${amount.toLocaleString(intlLocale, {
    maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
  })}`;
}
