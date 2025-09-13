// Analytics and Performance Monitoring Service
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

class AnalyticsService {
  private isEnabled: boolean = false;
  private gaId: string = 'G-PLACEHOLDER'; // Replace with actual GA4 ID

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && !!window.gtag;
    this.initializePerformanceObserver();
  }

  // Initialize Google Analytics
  initialize(measurementId?: string) {
    if (measurementId) {
      this.gaId = measurementId;
    }
    
    if (this.isEnabled) {
      // Send initial page view
      this.trackPageView();
    }
  }

  // Track page views
  trackPageView(path?: string, title?: string) {
    if (!this.isEnabled) return;

    const page_location = path ? `${window.location.origin}${path}` : window.location.href;
    const page_title = title || document.title;

    window.gtag('config', this.gaId, {
      page_location,
      page_title,
      send_page_view: true
    });

    // Also send as event for better tracking
    window.gtag('event', 'page_view', {
      page_title,
      page_location,
      page_referrer: document.referrer
    });
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (!this.isEnabled) return;

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', event);
    }
  }

  // Track user interactions
  trackUserAction(action: string, details?: Record<string, any>) {
    this.trackEvent({
      action,
      category: 'user_interaction',
      custom_parameters: details
    });
  }

  // Track business events
  trackBusinessEvent(event: string, value?: number, details?: Record<string, any>) {
    this.trackEvent({
      action: event,
      category: 'business',
      value,
      custom_parameters: details
    });
  }

  // Track errors
  trackError(error: Error, context?: string) {
    this.trackEvent({
      action: 'error',
      category: 'exception',
      label: error.message,
      custom_parameters: {
        error_name: error.name,
        error_stack: error.stack?.substring(0, 500), // Truncate for GA limits
        context,
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    });

    // Log to console for debugging
    console.error('Tracked Error:', error, context);
  }

  // Track performance metrics
  trackPerformance(metrics: Partial<PerformanceMetrics>) {
    if (!this.isEnabled) return;

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== undefined && value > 0) {
        window.gtag('event', 'timing_complete', {
          name: metric,
          value: Math.round(value)
        });
      }
    });
  }

  // Track Core Web Vitals
  private initializePerformanceObserver() {
    if (typeof window === 'undefined') return;

    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.trackEvent({
            action: 'LCP',
            category: 'Web Vitals',
            value: Math.round(lastEntry.startTime),
            custom_parameters: {
              metric_rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs_improvement' : 'poor'
            }
          });
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Track First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.trackEvent({
              action: 'FID',
              category: 'Web Vitals',
              value: Math.round(entry.processingStart - entry.startTime),
              custom_parameters: {
                metric_rating: entry.processingStart - entry.startTime <= 100 ? 'good' : entry.processingStart - entry.startTime <= 300 ? 'needs_improvement' : 'poor'
              }
            });
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Track Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Send CLS when page becomes hidden
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            this.trackEvent({
              action: 'CLS',
              category: 'Web Vitals',
              value: Math.round(clsValue * 1000), // Convert to milliseconds
              custom_parameters: {
                metric_rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs_improvement' : 'poor'
              }
            });
          }
        });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.trackPerformance({
            pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
            firstContentfulPaint: this.getMetricByName('first-contentful-paint'),
            timeToInteractive: navigation.domInteractive - navigation.navigationStart
          });
        }
      }, 0);
    });
  }

  private getMetricByName(name: string): number {
    const entries = performance.getEntriesByName(name);
    return entries.length > 0 ? entries[0].startTime : 0;
  }

  // Track conversion events
  trackConversion(event: string, value?: number, currency: string = 'USD') {
    this.trackEvent({
      action: event,
      category: 'conversion',
      value,
      custom_parameters: {
        currency,
        timestamp: Date.now()
      }
    });
  }

  // Track user journey
  trackUserJourney(step: string, funnel: string, additionalData?: Record<string, any>) {
    this.trackEvent({
      action: 'funnel_step',
      category: 'user_journey',
      label: `${funnel}_${step}`,
      custom_parameters: {
        funnel_name: funnel,
        step_name: step,
        ...additionalData
      }
    });
  }

  // Session tracking
  trackSessionStart() {
    this.trackEvent({
      action: 'session_start',
      category: 'engagement',
      custom_parameters: {
        session_id: this.generateSessionId(),
        timestamp: Date.now()
      }
    });
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Predefined tracking functions for common actions
export const trackPageView = (path?: string, title?: string) => analytics.trackPageView(path, title);
export const trackUserAction = (action: string, details?: Record<string, any>) => analytics.trackUserAction(action, details);
export const trackError = (error: Error, context?: string) => analytics.trackError(error, context);
export const trackBusinessEvent = (event: string, value?: number, details?: Record<string, any>) => analytics.trackBusinessEvent(event, value, details);
export const trackConversion = (event: string, value?: number) => analytics.trackConversion(event, value);

// Common spiritual healing business events
export const spiritualAnalytics = {
  // Healer discovery
  searchHealers: (filters?: Record<string, any>) => 
    trackUserAction('search_healers', { filters }),
  
  viewHealerProfile: (healerId: string, healerName?: string) =>
    trackUserAction('view_healer_profile', { healer_id: healerId, healer_name: healerName }),
  
  // Booking flow
  startBooking: (healerId: string, serviceType?: string) =>
    trackUserJourney('start', 'booking', { healer_id: healerId, service_type: serviceType }),
  
  completeBooking: (bookingId: string, amount?: number, serviceType?: string) =>
    trackConversion('booking_completed', amount) && 
    trackUserJourney('complete', 'booking', { booking_id: bookingId, service_type: serviceType }),
  
  // User engagement
  joinCommunity: () => trackUserAction('join_community'),
  sendMessage: (recipientType: 'healer' | 'customer') =>
    trackUserAction('send_message', { recipient_type: recipientType }),
  
  // Healer actions
  healerSignup: () => trackConversion('healer_signup'),
  healerProfileComplete: () => trackUserJourney('complete', 'healer_onboarding'),
  
  // Payment events
  paymentSuccess: (amount: number, currency: string = 'USD') =>
    trackConversion('payment_success', amount) &&
    trackBusinessEvent('payment_completed', amount, { currency }),
  
  paymentFailed: (error?: string) =>
    trackUserAction('payment_failed', { error }),
};

export default analytics;