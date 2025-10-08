'use client';

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import type { Activity, NotificationPreferences, ScheduledNotification } from './types';

// VAPID key for web push (you'll need to generate this in Firebase Console)
// For now using a placeholder - in production you'll need to generate this
const VAPID_KEY = 'BHx-example-replace-with-real-vapid-key-from-firebase-console';

export class NotificationService {
  private messaging: Messaging | null = null;
  private fcmToken: string | null = null;
  private preferences: NotificationPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
    
    // Initialize Firebase Messaging if in browser environment
    if (typeof window !== 'undefined') {
      try {
        this.messaging = getMessaging(app);
        this.initializeFCM();
      } catch (error) {
        console.error('Failed to initialize Firebase Messaging:', error);
      }
    }
  }

  private loadPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    const saved = localStorage.getItem('studify-notification-preferences');
    if (saved) {
      try {
        return { ...this.getDefaultPreferences(), ...JSON.parse(saved) };
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
    return this.getDefaultPreferences();
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: false,
      timerCompletion: true,
      breakReminders: true,
      studyReminders: true,
      emailReminders: false,
      reminderTime: 10, // 10 minutes before
    };
  }

  public savePreferences(preferences: NotificationPreferences): void {
    this.preferences = preferences;
    if (typeof window !== 'undefined') {
      localStorage.setItem('studify-notification-preferences', JSON.stringify(preferences));
    }
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  private async initializeFCM(): Promise<void> {
    if (!this.messaging) return;

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        this.fcmToken = token;
        console.log('FCM Token:', token);
        
        // Save token to user's profile in Firestore
        await this.saveFCMToken(token);
      } else {
        console.log('No registration token available.');
      }

      // Handle foreground messages
      onMessage(this.messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        this.handleForegroundMessage(payload);
      });

    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  }

  private async saveFCMToken(token: string): Promise<void> {
    try {
      // Get current user from Firebase auth
      const { auth } = await import('./firebase');
      const user = auth.currentUser;
      
      if (user) {
        const { saveFCMToken } = await import('./firestore');
        await saveFCMToken(user.uid, token);
        console.log('FCM token saved to Firestore');
      }
    } catch (error) {
      console.error('Failed to save FCM token:', error);
    }
  }

  private handleForegroundMessage(payload: any): void {
    if (!this.preferences.enabled) return;

    const { notification, data } = payload;
    
    // Show browser notification for foreground messages
    if (Notification.permission === 'granted') {
      const notificationOptions: NotificationOptions = {
        body: notification?.body || 'Study reminder from Studify',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data?.type || 'studify-notification',
        data: data,
        requireInteraction: true
      };

      const notif = new Notification(
        notification?.title || 'Studify',
        notificationOptions
      );

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notif.close(), 10000);
    }
  }

  // Public notification methods
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      if (granted && !this.preferences.enabled) {
        this.preferences.enabled = true;
        this.savePreferences(this.preferences);
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  public async showTimerCompleteNotification(activity: Activity, duration: number): Promise<void> {
    if (!this.preferences.enabled || !this.preferences.timerCompletion) return;

    const title = '🍅 Pomodoro Complete!';
    const body = `Great work on "${activity.title}"! You studied for ${duration} minutes.`;
    
    await this.showNotification(title, body, 'timer', activity.id);
  }

  public async showBreakNotification(breakType: 'short' | 'long', duration: number): Promise<void> {
    if (!this.preferences.enabled || !this.preferences.breakReminders) return;

    const title = breakType === 'short' ? '☕ Short Break!' : '🌟 Long Break!';
    const body = `Time for a ${duration}-minute ${breakType} break. You've earned it!`;
    
    await this.showNotification(title, body, 'break');
  }

  public async showStudyReminderNotification(activity: Activity): Promise<void> {
    if (!this.preferences.enabled || !this.preferences.studyReminders) return;

    const title = '📚 Study Reminder';
    const body = `Time to work on "${activity.title}" (${activity.subject})`;
    
    await this.showNotification(title, body, 'reminder', activity.id);
  }

  private async showNotification(
    title: string, 
    body: string, 
    type: string, 
    activityId?: string
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    // Fallback to browser notification if FCM is not available
    if (Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `studify-${type}`,
        data: { type, activityId },
        requireInteraction: type !== 'break', // Breaks auto-dismiss
      };

      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to appropriate page based on type
        if (type === 'reminder' && activityId) {
          window.location.href = '/dashboard';
        }
      };

      // Auto-close break notifications after 5 seconds
      if (type === 'break') {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  public async scheduleStudyReminder(activity: Activity, scheduledFor: Date): Promise<void> {
    // For now, we'll use setTimeout for local scheduling
    // In production, this would be handled by Firebase Functions
    const now = new Date();
    const timeUntilReminder = scheduledFor.getTime() - now.getTime();

    if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) { // Within 24 hours
      setTimeout(() => {
        this.showStudyReminderNotification(activity);
      }, timeUntilReminder);
    }
  }

  public async testNotification(): Promise<void> {
    const title = '🧪 Test Notification';
    const body = 'Studify notifications are working correctly!';
    
    await this.showNotification(title, body, 'test');
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission | null {
    if (typeof window === 'undefined') return null;
    return Notification.permission;
  }

  public getFCMToken(): string | null {
    return this.fcmToken;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();