import { useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-user';

interface AdUnitProps {
  slot: string;
  format?: 'horizontal' | 'vertical' | 'responsive';
  className?: string;
}

/**
 * AdSense Ad Unit Component
 * Shows ads only to non-Pro users
 * Replace slot with actual AdSense slot ID after approval
 * 
 * Usage:
 * <AdUnit slot="XXXXXXXX" format="responsive" />
 */
export function AdUnit({ slot, format = 'responsive', className = '' }: AdUnitProps) {
  const { user } = useUser();
  const adRef = useRef<HTMLDivElement>(null);

  const adClientId =
    (import.meta as any)?.env?.VITE_ADSENSE_CLIENT_ID ||
    (import.meta as any)?.env?.ADSENSE_CLIENT_ID ||
    'PLACEHOLDER';

  useEffect(() => {
    // Push ads script only after component mounts
    if (adRef.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, []);

  const getAdDimensions = () => {
    switch (format) {
      case 'horizontal':
        return 'w-full h-24'; // 728x90 or 970x90
      case 'vertical':
        return 'w-72 h-96'; // 300x600
      case 'responsive':
      default:
        return 'w-full';
    }
  };

  // Hide ads for Pro users - MUST be after all hooks
  if (user?.isPro) return null;

  return (
    <div
      ref={adRef}
      className={`ad-container bg-muted/20 rounded-lg overflow-hidden ${getAdDimensions()} ${className}`}
    >
      <div className="text-xs text-muted-foreground p-2">
        Publicidade
      </div>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: format === 'vertical' ? '600px' : 'auto',
        }}
        data-ad-client={`ca-pub-${adClientId}`}
        data-ad-slot={slot}
        data-ad-format={format === 'responsive' ? 'auto' : 'rectangle'}
        data-full-width-responsive={format === 'responsive' ? 'true' : 'false'}
      />
    </div>
  );
}

// Ad Slot Management
// Replace these with actual slot IDs from AdSense after approval
export const AD_SLOTS = {
  // Banner ads (horizontal)
  HEADER_BANNER: '1234567890',      // Top banner 728x90
  HERO_SECTION: '1234567891',       // Below hero section 970x90
  
  // In-feed ads
  LESSON_FEED: '1234567892',        // Between lessons
  EXERCISE_FEED: '1234567893',      // Between exercises
  
  // Sidebar ads
  SIDEBAR_TOP: '1234567894',        // 300x250
  SIDEBAR_BOTTOM: '1234567895',     // 300x250 or 300x600
  
  // Mobile anchor
  MOBILE_ANCHOR: '1234567896',      // Sticky mobile 320x50
  
  // Specific page ads
  PRICING_PAGE: '1234567897',       // Pricing sidebar 300x250
  ROADMAP_PAGE: '1234567898',       // Roadmap sidebar 300x250
};

// Type declaration for window.adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}
