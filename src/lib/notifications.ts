'use client';

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import type { Activity, NotificationPreferences, ScheduledNotification } from './types';

// Read VAPID key from environment for browser push (set NEXT_PUBLIC_FCM_VAPID_KEY)
const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || 'BHx-example-replace-with-real-vapid-key-from-firebase-console';

export class NotificationService {
  private messaging: Messaging | null = null;
  private fcmToken: string | null = null;
  private preferences: NotificationPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
    
  // Init FCM in browser environment
    if (typeof window !== 'undefined') {
      try {
        this.messaging = getMessaging(app);
        // Only initialize fully if permission already granted
        if (Notification.permission === 'granted') {
          this.initializeFCM();
        }
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
      // Double-check permission before proceeding
      if (Notification.permission !== 'granted') {
        console.log('Cannot initialize FCM: permission not granted');
        return;
      }

      // Register service worker (assumes permission already granted)
      if ('serviceWorker' in navigator) {
        // Check if SW is already registered
        let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        
        if (!registration) {
          console.log('Registering new service worker...');
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log('Service Worker registered:', registration);
        } else {
          console.log('Service Worker already registered:', registration);
        }
        
        // Wait for service worker to be active/ready
        if (registration.installing) {
          console.log('SW installing, waiting...');
          await new Promise((resolve) => {
            registration!.installing!.addEventListener('statechange', function() {
              if (this.state === 'activated') resolve(true);
            });
          });
        } else if (registration.waiting) {
          console.log('SW waiting, activating...');
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (registration.active) {
          console.log('SW already active');
        }
        
        // Ensure service worker is ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker ready');
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
      
      if (granted) {
        this.preferences.enabled = true;
        this.savePreferences(this.preferences);
        
        // Initialize FCM now that permission is granted
        console.log('Permission granted, initializing FCM...');
        try {
          await this.initializeFCM();
          console.log('FCM initialization complete, token:', this.fcmToken);
        } catch (err) {
          console.error('Failed to init FCM after permission:', err);
        }
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
  // Reminder: local scheduling using setTimeout; use cloud functions in prod
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

  // Show a missed-goal notification: e.g. weekly goal progress reminder
  public async showMissedGoalNotification(completedMinutes: number, goalMinutes: number): Promise<void> {
    if (!this.preferences.enabled) return;

    const pct = Math.round((completedMinutes / Math.max(goalMinutes, 1)) * 100);
    const title = '📅 Study Goal Reminder';
    const body = `You've completed ${completedMinutes} minutes (${pct}% of your ${Math.round(goalMinutes/60)}h goal). Keep going!`;

    await this.showNotification(title, body, 'missed-goal');
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