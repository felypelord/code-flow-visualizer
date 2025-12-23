/**
 * Google AdSense Integration
 * 
 * To use real ads:
 * 1. Sign up for Google AdSense: https://www.google.com/adsense/
 * 2. Get your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
 * 3. Create ad units and get slot IDs
 * 4. Update the constants below with your IDs
 * 5. Add AdSense script to client/index.html
 */

export const ADSENSE_CONFIG = {
  // AdSense Publisher ID
  publisherId: 'ca-pub-1873423099734846',
  
  // Ad slots for different placements
  slots: {
    rewardVideo: 'XXXXXXXXXX', // Video ad slot ID - Configure no AdSense dashboard
    displayAd: 'XXXXXXXXXX',   // Display ad slot ID - Configure no AdSense dashboard
    banner: 'XXXXXXXXXX',       // Banner ad slot ID - Configure no AdSense dashboard
  },
  
  // Testing mode (set to false in production after configuring slots)
  testMode: true,
};

// Initialize AdSense
export function initAdSense() {
  if (typeof window === 'undefined') return;

  // Check if already loaded
  if ((window as any).adsbygoogleLoaded) {
    return;
  }

  // Load AdSense script
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.publisherId}`;
  
  script.onerror = () => {
    console.warn('AdSense failed to load. Using fallback ads.');
  };

  document.head.appendChild(script);
  (window as any).adsbygoogleLoaded = true;
}

// Push ad to AdSense queue
export function pushAd(adElement: HTMLElement) {
  try {
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    }
  } catch (e) {
    console.error('Error pushing ad:', e);
  }
}

// Track ad impression
export async function trackAdImpression(adType: string, userId?: string) {
  try {
    await fetch('/api/analytics/ad-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ adType, userId }),
    });
  } catch (e) {
    console.error('Error tracking ad impression:', e);
  }
}

// Alternative: AdMob for mobile
export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
  adUnits: {
    rewardedVideo: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
};

// Alternative: Unity Ads
export const UNITY_ADS_CONFIG = {
  gameId: 'XXXXXXX',
  testMode: true,
  placementIds: {
    rewardedVideo: 'Rewarded_Android',
    banner: 'Banner_Android',
  },
};

/**
 * Setup Instructions:
 * 
 * 1. GOOGLE ADSENSE (Recommended for web):
 *    - Go to https://adsense.google.com
 *    - Create account and verify domain
 *    - Add site: codeflowbr.site
 *    - Create ad units (Rewarded Video + Display)
 *    - Copy Publisher ID and Slot IDs
 *    - Add to client/index.html:
 *      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID"
 *              crossorigin="anonymous"></script>
 * 
 * 2. GOOGLE ADMOB (For mobile apps):
 *    - Go to https://admob.google.com
 *    - Create app and ad units
 *    - Integrate AdMob SDK
 * 
 * 3. UNITY ADS (Gaming focused):
 *    - Go to https://unity.com/products/unity-ads
 *    - Create project and get Game ID
 *    - Configure placements
 * 
 * 4. ALTERNATIVE: PropellerAds, Adsterra (easier approval)
 *    - Lower requirements than AdSense
 *    - Quick approval process
 */

// PropellerAds configuration (alternative with easier approval)
export const PROPELLER_ADS_CONFIG = {
  publisherId: 'XXXXXXX',
  zoneIds: {
    rewardedVideo: 'XXXXXXX',
    interstitial: 'XXXXXXX',
    banner: 'XXXXXXX',
  },
};

export function initPropellerAds() {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.src = `//cdn.intergient.com/${PROPELLER_ADS_CONFIG.publisherId}/propeller-core.js`;
  document.head.appendChild(script);
}
