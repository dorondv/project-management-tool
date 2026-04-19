export type ConsentState = {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
};

const CONSENT_KEY = 'sollo_consent';
const CONSENT_VERSION = 1;

export const DEFAULT_CONSENT_STATE: ConsentState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
};

const ALL_GRANTED: ConsentState = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getGtag(): (...args: unknown[]) => void {
  if (typeof window === 'undefined') return () => {};
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
  return window.gtag;
}

export function updateConsent(state: Partial<ConsentState>) {
  if (typeof window === 'undefined') return;
  const gtag = getGtag();
  gtag('consent', 'update', state);

  const w = window as Window & { fbq?: (...args: string[]) => void };
  if (typeof w.fbq === 'function' && state.ad_storage !== undefined) {
    const adGranted = state.ad_storage === 'granted';
    w.fbq('consent', adGranted ? 'grant' : 'revoke');
  }

  const stored = getStoredConsent();
  const merged: ConsentState = { ...DEFAULT_CONSENT_STATE, ...stored, ...state };
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ v: CONSENT_VERSION, ...merged })
    );
  } catch {
    // ignore
  }
}

export function grantAllConsent() {
  updateConsent(ALL_GRANTED);
}

export function denyAllConsent() {
  updateConsent(DEFAULT_CONSENT_STATE);
}

export function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number } & Partial<ConsentState>;
    if (parsed.v !== CONSENT_VERSION) return null;
    const state = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => k !== 'v')
    ) as Partial<ConsentState>;
    if (
      state.ad_storage &&
      state.ad_user_data &&
      state.ad_personalization &&
      state.analytics_storage
    ) {
      return state as ConsentState;
    }
    return null;
  } catch {
    return null;
  }
}

export function applyStoredConsent() {
  const stored = getStoredConsent();
  if (stored) {
    updateConsent(stored);
  }
}

export function hasConsentChoice(): boolean {
  return getStoredConsent() !== null;
}

const OPEN_CONSENT_EVENT = 'sollo:open-consent';

export function openConsentBanner() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
  }
}

export { OPEN_CONSENT_EVENT };
