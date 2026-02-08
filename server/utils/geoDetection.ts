// IP-based geo detection utility
// Uses free APIs for country detection from IP address

/**
 * Get country code from IP address using free API
 * Falls back gracefully if API fails (non-blocking)
 */
export async function getCountryFromIP(ipAddress: string | null | undefined): Promise<string | null> {
  if (!ipAddress) {
    return null;
  }

  // Skip localhost/private IPs
  if (
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.16.') ||
    ipAddress.startsWith('172.17.') ||
    ipAddress.startsWith('172.18.') ||
    ipAddress.startsWith('172.19.') ||
    ipAddress.startsWith('172.20.') ||
    ipAddress.startsWith('172.21.') ||
    ipAddress.startsWith('172.22.') ||
    ipAddress.startsWith('172.23.') ||
    ipAddress.startsWith('172.24.') ||
    ipAddress.startsWith('172.25.') ||
    ipAddress.startsWith('172.26.') ||
    ipAddress.startsWith('172.27.') ||
    ipAddress.startsWith('172.28.') ||
    ipAddress.startsWith('172.29.') ||
    ipAddress.startsWith('172.30.') ||
    ipAddress.startsWith('172.31.')
  ) {
    return null;
  }

  try {
    // Option 1: Use ip-api.com (free, 45 req/min, no API key needed)
    // Returns: { countryCode: "IL", country: "Israel", ... }
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,countryCode`, {
      headers: {
        'User-Agent': 'MarketingTracker/1.0',
      },
      // 2 second timeout to avoid blocking
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.countryCode) {
        return data.countryCode.toUpperCase(); // Return ISO country code (e.g., "IL")
      }
    }
  } catch (error) {
    // Silently fail - don't block tracking if geo API fails
    console.warn(`Geo detection failed for IP ${ipAddress}:`, error instanceof Error ? error.message : 'Unknown error');
  }

  // Fallback: Try ipapi.co (alternative free service)
  try {
    const response = await fetch(`https://ipapi.co/${ipAddress}/country_code/`, {
      headers: {
        'User-Agent': 'MarketingTracker/1.0',
      },
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      const countryCode = (await response.text()).trim();
      if (countryCode && countryCode.length === 2) {
        return countryCode.toUpperCase();
      }
    }
  } catch (error) {
    // Silently fail
    console.warn(`Geo detection fallback failed for IP ${ipAddress}`);
  }

  return null;
}

/**
 * Enhanced version: Get full geo data (country, city, region) from IP
 * Returns more detailed information if needed
 */
export async function getFullGeoFromIP(ipAddress: string | null | undefined): Promise<{
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  timezone?: string;
} | null> {
  if (!ipAddress) {
    return null;
  }

  // Skip private IPs
  if (
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.')
  ) {
    return null;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,city,regionName,timezone`, {
      headers: {
        'User-Agent': 'MarketingTracker/1.0',
      },
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country,
          countryCode: data.countryCode?.toUpperCase(),
          city: data.city,
          region: data.regionName,
          timezone: data.timezone,
        };
      }
    }
  } catch (error) {
    console.warn(`Full geo detection failed for IP ${ipAddress}`);
  }

  return null;
}
