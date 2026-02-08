// Comprehensive timezone to country code mapping
// Based on IANA timezone database
// This provides "good enough" geo detection without requiring IP-based services

export const timezoneToCountry: Record<string, string> = {
  // Africa
  'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
  'Africa/Algiers': 'DZ',
  
  // Americas
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'America/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Caracas': 'VE',
  'America/Montevideo': 'UY',
  'America/Guatemala': 'GT',
  'America/Havana': 'CU',
  'America/Panama': 'PA',
  'America/Santo_Domingo': 'DO',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'America/Quito': 'EC',
  
  // Asia
  'Asia/Jerusalem': 'IL',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Kuwait': 'KW',
  'Asia/Bahrain': 'BH',
  'Asia/Qatar': 'QA',
  'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ',
  'Asia/Amman': 'JO',
  'Asia/Beirut': 'LB',
  'Asia/Damascus': 'SY',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Colombo': 'LK',
  'Asia/Kolkata': 'IN',
  'Asia/Kathmandu': 'NP',
  'Asia/Thimphu': 'BT',
  'Asia/Yangon': 'MM',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Phnom_Penh': 'KH',
  'Asia/Vientiane': 'LA',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Brunei': 'BN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Shanghai': 'CN',
  'Asia/Beijing': 'CN',
  'Asia/Taipei': 'TW',
  'Asia/Seoul': 'KR',
  'Asia/Tokyo': 'JP',
  'Asia/Ulaanbaatar': 'MN',
  'Asia/Almaty': 'KZ',
  'Asia/Tashkent': 'UZ',
  'Asia/Bishkek': 'KG',
  'Asia/Dushanbe': 'TJ',
  'Asia/Ashgabat': 'TM',
  'Asia/Yerevan': 'AM',
  'Asia/Tbilisi': 'GE',
  'Asia/Baku': 'AZ',
  'Asia/Yekaterinburg': 'RU',
  'Asia/Omsk': 'RU',
  'Asia/Krasnoyarsk': 'RU',
  'Asia/Irkutsk': 'RU',
  'Asia/Yakutsk': 'RU',
  'Asia/Vladivostok': 'RU',
  'Asia/Magadan': 'RU',
  'Asia/Kamchatka': 'RU',
  
  // Europe
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Sofia': 'BG',
  'Europe/Athens': 'GR',
  'Europe/Lisbon': 'PT',
  'Europe/Moscow': 'RU',
  'Europe/Kiev': 'UA',
  'Europe/Minsk': 'BY',
  'Europe/Riga': 'LV',
  'Europe/Tallinn': 'EE',
  'Europe/Vilnius': 'LT',
  'Europe/Belgrade': 'RS',
  'Europe/Zagreb': 'HR',
  'Europe/Sarajevo': 'BA',
  'Europe/Skopje': 'MK',
  'Europe/Tirane': 'AL',
  'Europe/Istanbul': 'TR',
  'Europe/Athens': 'GR',
  
  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Australia/Darwin': 'AU',
  'Pacific/Auckland': 'NZ',
  'Pacific/Honolulu': 'US',
  'Pacific/Fiji': 'FJ',
  'Pacific/Guam': 'GU',
  'Pacific/Port_Moresby': 'PG',
  
  // UTC and others
  'UTC': 'ZZ', // Unknown/International
  'GMT': 'GB',
};

/**
 * Get country code from timezone
 * Returns ISO 3166-1 alpha-2 country code (2 letters) or undefined
 */
export function getCountryFromTimezone(timezone: string): string | undefined {
  // Direct lookup
  if (timezoneToCountry[timezone]) {
    return timezoneToCountry[timezone];
  }
  
  // Try to match by region prefix (e.g., "America/" -> check all America/*)
  const parts = timezone.split('/');
  if (parts.length >= 2) {
    const region = parts[0];
    const city = parts.slice(1).join('/');
    
    // Try exact match first
    if (timezoneToCountry[timezone]) {
      return timezoneToCountry[timezone];
    }
    
    // For regions with many timezones, use common mappings
    if (region === 'America') {
      // Most American timezones are US unless specified otherwise
      if (city.includes('Canada') || city.includes('Toronto') || city.includes('Vancouver')) {
        return 'CA';
      }
      if (city.includes('Mexico')) {
        return 'MX';
      }
      // Default to US for other American timezones
      return 'US';
    }
    
    if (region === 'Europe') {
      // Most European timezones map to their respective countries
      // This is a simplified mapping - could be enhanced
      if (city.includes('London')) return 'GB';
      if (city.includes('Paris')) return 'FR';
      if (city.includes('Berlin') || city.includes('Frankfurt')) return 'DE';
      if (city.includes('Rome') || city.includes('Milan')) return 'IT';
      if (city.includes('Madrid') || city.includes('Barcelona')) return 'ES';
      // Default fallback - could return undefined for accuracy
    }
    
    if (region === 'Asia') {
      // Most Asian timezones are country-specific
      if (city.includes('Tokyo')) return 'JP';
      if (city.includes('Shanghai') || city.includes('Beijing')) return 'CN';
      if (city.includes('Singapore')) return 'SG';
      if (city.includes('Dubai')) return 'AE';
      if (city.includes('Riyadh')) return 'SA';
      if (city.includes('Jerusalem') || city.includes('Tel_Aviv')) return 'IL';
    }
    
    if (region === 'Australia') {
      return 'AU';
    }
    
    if (region === 'Pacific') {
      if (city.includes('Auckland')) return 'NZ';
      if (city.includes('Honolulu')) return 'US';
    }
  }
  
  return undefined;
}
