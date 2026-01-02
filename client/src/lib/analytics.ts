// Google Analytics 4 + Facebook Pixel Configuration
// This file handles all tracking for marketing and analytics

// Google Analytics 4
export const GA_TRACKING_ID = 'G-CYwCTCG1T7'; // ✅ Configurado!

// Facebook Pixel
export const FB_PIXEL_ID = '744651004832293'; // ✅ Configurado!

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;
  
  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_TRACKING_ID, {
    page_path: window.location.pathname,
  });
};

// Initialize Facebook Pixel
export const initFBPixel = () => {
  if (typeof window === 'undefined') return;
  
  !(function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  (window as any).fbq('init', FB_PIXEL_ID);
  (window as any).fbq('track', 'PageView');
};

// Track Events
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
  
  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, params);
  }
  
  console.log(`[Analytics] Event: ${eventName}`, params);
};

// Conversion Events
export const trackSignup = (userId: string, email: string) => {
  trackEvent('sign_up', {
    method: 'email',
    user_id: userId,
    value: 0,
  });
  
  // Facebook Pixel specific
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'CompleteRegistration', {
      content_name: 'User Signup',
      status: 'completed',
    });
  }
};

export const trackLogin = (userId: string) => {
  trackEvent('login', {
    method: 'email',
    user_id: userId,
  });
};

export const trackPurchase = (transactionId: string, value: number, currency: string, itemName: string) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: [{
      item_name: itemName,
    }],
  });
  
  // Facebook Pixel Purchase
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      content_type: 'product',
      content_name: itemName,
    });
  }
};

export const trackAddToCart = (itemName: string, value: number) => {
  trackEvent('add_to_cart', {
    item_name: itemName,
    value: value,
    currency: 'USD',
  });
  
  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'AddToCart', {
      content_name: itemName,
      value: value,
      currency: 'USD',
    });
  }
};

export const trackInitiateCheckout = (packageId: string, value: number) => {
  trackEvent('begin_checkout', {
    package_id: packageId,
    value: value,
    currency: 'USD',
  });
  
  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'InitiateCheckout', {
      content_name: packageId,
      value: value,
      currency: 'USD',
    });
  }
};

export const trackLessonComplete = (lessonId: string, language: string) => {
  trackEvent('lesson_complete', {
    lesson_id: lessonId,
    language: language,
    engagement_time_msec: 100,
  });
};

export const trackExerciseComplete = (exerciseId: string, score: number) => {
  trackEvent('exercise_complete', {
    exercise_id: exerciseId,
    score: score,
  });
};

export const trackProUpgrade = () => {
  trackEvent('view_promotion', {
    promotion_name: 'Pro Upgrade',
  });
};

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};
