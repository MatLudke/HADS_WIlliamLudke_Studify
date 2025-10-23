'use client';

import emailjs from '@emailjs/browser';

export interface NotificationPreferences {
  enabled: boolean;
  timerCompletion: boolean;
  breakReminders: boolean;
  studyReminders: boolean;
  emailReminders: boolean;
  reminderTime: number;
}

class SimpleNotificationService {
  private preferences: NotificationPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
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
      reminderTime: 10,
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

  // Browser Notification Methods
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission | null {
    if (!this.isSupported()) return null;
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      if (granted) {
        this.preferences.enabled = true;
        this.savePreferences(this.preferences);
        console.log('✅ Browser notifications enabled');
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  public showNotification(title: string, options?: NotificationOptions): void {
    if (!this.preferences.enabled || !this.isSupported() || Notification.permission !== 'granted') {
      console.log('Notifications disabled or permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Specific notification types
  public showTimerCompleteNotification(activityTitle: string): void {
    if (!this.preferences.timerCompletion) return;
    
    this.showNotification('⏰ Timer Complete!', {
      body: `Great job! You completed: ${activityTitle}`,
      tag: 'timer-complete',
    });
  }

  public showBreakReminder(): void {
    if (!this.preferences.breakReminders) return;
    
    this.showNotification('☕ Break Time Over', {
      body: 'Time to get back to studying!',
      tag: 'break-reminder',
    });
  }

  public showStudyReminder(activityTitle: string, minutesUntil: number): void {
    if (!this.preferences.studyReminders) return;
    
    this.showNotification('📚 Study Reminder', {
      body: `In ${minutesUntil} minutes: ${activityTitle}`,
      tag: 'study-reminder',
    });
  }

  public showMissedGoalNotification(goalTitle: string, progress: number): void {
    this.showNotification('🎯 Goal Update', {
      body: `${goalTitle}: ${progress}% complete. Keep going!`,
      tag: 'goal-reminder',
    });
  }

  public testNotification(): void {
    this.showNotification('🧪 Test Notification', {
      body: 'Studify notifications are working perfectly!',
      tag: 'test',
    });
  }

  // Email Methods (using EmailJS)
  public async sendEmail(
    templateParams: {
      to_email: string;
      to_name: string;
      subject: string;
      message: string;
    }
  ): Promise<boolean> {
    if (!this.preferences.emailReminders) {
      console.log('Email reminders disabled');
      return false;
    }

    // EmailJS configuration
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS not configured. Please set environment variables.');
      return false;
    }

    try {
      console.log('Sending email with params:', { serviceId, templateId, to: templateParams.to_email });
      
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );
      
      console.log('✅ Email sent successfully:', response);
      return true;
    } catch (error: any) {
      console.error('❌ Email send failed:', {
        error,
        message: error?.message,
        text: error?.text,
        status: error?.status
      });
      return false;
    }
  }

  public async sendTestEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to_email: userEmail,
      to_name: userName,
      subject: '🧪 Studify Test Email',
      message: `This is a test email from Studify. Your email notifications are working correctly!\n\n📚 Happy studying!`
    });
  }

  public async sendMissedGoalEmail(
    userEmail: string,
    userName: string,
    goalTitle: string,
    progress: number,
    targetHours: number
  ): Promise<boolean> {
    return this.sendEmail({
      to_email: userEmail,
      to_name: userName,
      subject: `🎯 ${goalTitle} - ${progress}% Complete`,
      message: `Hi ${userName}!\n\nYou set a goal to study ${targetHours} hours this week.\n\nCurrent progress: ${progress}%\n\nThere's still time to reach your goal. Keep pushing forward!\n\n📚 Good luck!\n- Studify`
    });
  }

  public async sendWeeklySummary(
    userEmail: string,
    userName: string,
    stats: {
      totalSessions: number;
      totalMinutes: number;
      completedActivities: number;
    }
  ): Promise<boolean> {
    const hours = Math.floor(stats.totalMinutes / 60);
    const minutes = stats.totalMinutes % 60;
    
    return this.sendEmail({
      to_email: userEmail,
      to_name: userName,
      subject: '📊 Your Weekly Study Summary',
      message: `Hi ${userName}!\n\nHere's your study summary for this week:\n\n📚 Study Sessions: ${stats.totalSessions}\n⏱️  Total Time: ${hours}h ${minutes}m\n✅ Activities Completed: ${stats.completedActivities}\n\nKeep up the great work!\n\n- Studify`
    });
  }
}

// Export singleton instance
export const simpleNotificationService = new SimpleNotificationService();
