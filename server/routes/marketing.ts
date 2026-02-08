import { Router } from 'express';
import { prisma } from '../index.js';
import { getCountryFromIP } from '../utils/geoDetection.js';

const router = Router();

// POST /api/marketing/events - Track marketing events (public endpoint, no auth required)
router.post('/events', async (req, res) => {
  try {
    const {
      eventType,
      userId,
      url,
      referrer,
      utm,
      geo,
      business,
    } = req.body;

    // Validate event type
    const validEventTypes = ['pageview', 'signup_start', 'signup_complete', 'lead_submit', 'purchase_complete'];
    if (!eventType || !validEventTypes.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // Extract IP address
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || undefined;
    const ip = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;

    // Get country from IP address (IP-based geo detection)
    // This runs asynchronously and doesn't block the response
    let ipCountry: string | null = null;
    if (ip) {
      try {
        ipCountry = await getCountryFromIP(ip);
      } catch (error) {
        // Silently fail - don't block tracking
        console.warn('IP geo detection failed:', error);
      }
    }

    // Use IP-based country if available, otherwise fall back to client-side detection
    // IP-based is more accurate, but client-side (timezone/lang) is a good fallback
    const finalCountry = ipCountry || geo?.country?.slice(0, 2) || null;

    // Create marketing event
    const event = await prisma.marketingEvent.create({
      data: {
        eventType,
        userId: userId || null,
        url: url?.slice(0, 2048) || null,
        referrer: referrer?.slice(0, 2048) || null,
        userAgent: req.headers['user-agent']?.slice(0, 512) || null,
        ipAddress: ip?.slice(0, 64) || null,
        
        // UTM parameters
        utmSource: utm?.utm_source?.slice(0, 256) || null,
        utmMedium: utm?.utm_medium?.slice(0, 256) || null,
        utmCampaign: utm?.utm_campaign?.slice(0, 256) || null,
        utmTerm: utm?.utm_term?.slice(0, 256) || null,
        utmContent: utm?.utm_content?.slice(0, 256) || null,
        
        // Click IDs
        gclid: utm?.gclid?.slice(0, 256) || null,
        fbclid: utm?.fbclid?.slice(0, 256) || null,
        msclkid: utm?.msclkid?.slice(0, 256) || null,
        ttclid: utm?.ttclid?.slice(0, 256) || null,
        
        // Geo data - IP-based country takes priority, falls back to client-side detection
        timezone: geo?.timezone?.slice(0, 64) || null,
        language: geo?.language?.slice(0, 32) || null,
        country: finalCountry, // IP-based if available, otherwise client-side
        
        // Business fields
        purchaseAmount: business?.purchaseAmount || null,
        currency: business?.currency?.slice(0, 3) || null,
        revenueTotal: business?.revenueTotal || null,
      },
    });

    // Return 1x1 pixel GIF for tracking pixels (optional optimization)
    res.status(200).json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error('Error tracking marketing event:', error);
    // Don't fail the request - tracking should be non-blocking
    res.status(200).json({ success: false, error: 'Event tracking failed' });
  }
});

export { router as marketingRouter };
