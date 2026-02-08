// Marketing tracking utility for UTM and geo data capture
import { getCountryFromTimezone } from './timezoneToCountry';

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
}

interface TrackingData {
  eventType: 'pageview' | 'signup_start' | 'signup_complete' | 'lead_submit' | 'purchase_complete';
  url?: string;
  referrer?: string;
  utm?: UTMParams;
  geo?: {
    timezone?: string;
    language?: string;
    country?: string;
  };
  business?: {
    purchaseAmount?: number;
    currency?: string;
    revenueTotal?: number;
  };
}

const STORAGE_KEY = 'marketing_first_touch';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Extract UTM parameters from URL
function extractUTMParams(): UTMParams {
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};
  
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const clickIds = ['gclid', 'fbclid', 'msclkid', 'ttclid'];
  
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) utm[key as keyof UTMParams] = value;
  });
  
  clickIds.forEach(key => {
    const value = params.get(key);
    if (value) utm[key as keyof UTMParams] = value;
  });
  
  return Object.keys(utm).length > 0 ? utm : {};
}

// Get geo data from browser
function getGeoData(): { timezone?: string; language?: string; country?: string } {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    const language = navigator.language || undefined;
    
    // Country detection from timezone using comprehensive mapping
    let country: string | undefined;
    if (timezone) {
      country = getCountryFromTimezone(timezone);
      
      // Fallback: try to extract from language code (e.g., "he-IL" -> "IL")
      if (!country && language) {
        const langParts = language.split('-');
        if (langParts.length > 1) {
          const langCountry = langParts[1].toUpperCase();
          // Validate it's a reasonable country code (2 letters)
          if (langCountry.length === 2 && /^[A-Z]{2}$/.test(langCountry)) {
            country = langCountry;
          }
        }
      }
    }
    
    return { timezone, language, country };
  } catch (error) {
    console.warn('Failed to get geo data:', error);
    return {};
  }
}

// Store first touch data (UTM + geo) in localStorage
function storeFirstTouch(utm: UTMParams, geo: ReturnType<typeof getGeoData>) {
  try {
    const firstTouch = {
      utm,
      geo,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(firstTouch));
  } catch (error) {
    console.warn('Failed to store first touch data:', error);
  }
}

// Get stored first touch data
export function getFirstTouch(): { utm?: UTMParams; geo?: ReturnType<typeof getGeoData>; url?: string; referrer?: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        utm: parsed.utm,
        geo: parsed.geo,
        url: parsed.url,
        referrer: parsed.referrer,
      };
    }
  } catch (error) {
    console.warn('Failed to get first touch data:', error);
  }
  return null;
}

// Track marketing event
export async function trackEvent(
  eventType: TrackingData['eventType'],
  businessData?: TrackingData['business'],
  userId?: string
): Promise<void> {
  try {
    const utm = extractUTMParams();
    const geo = getGeoData();
    
    // Store first touch if we have UTM params and haven't stored yet
    if (Object.keys(utm).length > 0 && !localStorage.getItem(STORAGE_KEY)) {
      storeFirstTouch(utm, geo);
    }
    
    // Use stored first touch if no UTM in current URL
    const firstTouch = getFirstTouch();
    const finalUtm = Object.keys(utm).length > 0 ? utm : (firstTouch?.utm || {});
    const finalGeo = Object.keys(geo).length > 0 ? geo : (firstTouch?.geo || {});
    
    const trackingData: TrackingData & { userId?: string } = {
      eventType,
      url: window.location.href,
      referrer: document.referrer || firstTouch?.referrer,
      utm: finalUtm,
      geo: finalGeo,
      business: businessData,
      ...(userId && { userId }),
    };
    
    // Send to backend (fire and forget)
    fetch(`${API_URL}/api/marketing/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    }).catch(error => {
      // Silently fail - don't interrupt user flow
      console.warn('Failed to track event:', error);
    });
  } catch (error) {
    console.warn('Tracking error:', error);
  }
}

// Initialize tracking on page load (for pageview)
export function initTracking(): void {
  // Track pageview on landing
  if (window.location.pathname === '/landing' || window.location.pathname === '/') {
    trackEvent('pageview');
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
}
