// Notification Service for Push Notifications
import apiService from './api';

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  data?: any;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
    language: string;
  };
}

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || 'demo-key';

  async init(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported');
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return false;
      }

      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.swRegistration);

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  private handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data.type === 'NOTIFICATION_CLICK') {
      // Handle notification click - navigate to the specified URL
      const { url, data } = event.data;
      
      // Use React Router to navigate
      if (url && window.location.pathname !== url) {
        window.location.href = url;
      }

      // Fire custom event for components to listen to
      window.dispatchEvent(new CustomEvent('notificationClick', {
        detail: { url, data }
      }));
    }
  };

  async requestPermission(): Promise<NotificationPermission> {
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async subscribe(): Promise<SubscriptionData | null> {
    try {
      if (!this.swRegistration) {
        console.error('Service Worker not registered');
        return null;
      }

      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      // Subscribe to push notifications
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
      });

      const subscriptionData: SubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          language: navigator.language
        }
      };

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscriptionData);

      console.log('Push subscription successful:', subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        const success = await subscription.unsubscribe();
        
        if (success) {
          // Remove subscription from backend
          await this.removeSubscriptionFromBackend();
          console.log('Successfully unsubscribed from push notifications');
        }
        
        return success;
      }
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async sendTestNotification(data: NotificationData): Promise<boolean> {
    try {
      // For testing purposes - sends a local notification
      if (this.swRegistration) {
        return this.swRegistration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/favicon.ico',
          image: data.image,
          tag: data.tag,
          data: data.data,
          actions: data.actions,
          requireInteraction: data.requireInteraction,
          silent: data.silent,
          vibrate: data.vibrate
        }).then(() => true);
      }
      return false;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  private async sendSubscriptionToBackend(subscription: SubscriptionData): Promise<void> {
    try {
      const response = await apiService.request('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });

      if (!response.success) {
        throw new Error('Failed to save subscription to backend');
      }
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      // Don't throw - subscription can still work locally
    }
  }

  private async removeSubscriptionFromBackend(): Promise<void> {
    try {
      await apiService.request('/api/notifications/unsubscribe', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Predefined notification templates for common use cases
  static templates = {
    newBooking: (clientName: string, sessionType: string, dateTime: string): NotificationData => ({
      title: '📅 New Session Booking',
      body: `${clientName} booked a ${sessionType} session for ${dateTime}`,
      url: '/dashboard?tab=sessions',
      tag: 'booking',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }),

    newMessage: (senderName: string, preview: string): NotificationData => ({
      title: `💬 New message from ${senderName}`,
      body: preview,
      url: '/messages',
      tag: 'message',
      vibrate: [100, 50, 100],
      actions: [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View' }
      ]
    }),

    paymentReceived: (amount: string, clientName: string): NotificationData => ({
      title: '💰 Payment Received',
      body: `You received ${amount} from ${clientName}`,
      url: '/dashboard?tab=earnings',
      tag: 'payment',
      silent: false,
      actions: [
        { action: 'view', title: 'View Earnings' }
      ]
    }),

    sessionReminder: (sessionType: string, timeUntil: string): NotificationData => ({
      title: '⏰ Session Reminder',
      body: `Your ${sessionType} session starts in ${timeUntil}`,
      url: '/dashboard?tab=sessions',
      tag: 'reminder',
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300]
    }),

    reviewReceived: (rating: number, clientName: string): NotificationData => ({
      title: '⭐ New Review',
      body: `${clientName} left you a ${rating}-star review!`,
      url: '/my-profile',
      tag: 'review',
      actions: [
        { action: 'view', title: 'View Review' }
      ]
    })
  };
}

export default new NotificationService();