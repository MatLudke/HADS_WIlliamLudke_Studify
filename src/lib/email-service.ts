'use server';

import { Resend } from 'resend';
import type { Activity } from './types';

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static fromEmail = process.env.RESEND_FROM_EMAIL || 'Studify <notifications@studify.app>';

  // Send study reminder email
  static async sendStudyReminder(
    userEmail: string,
    userName: string,
    activity: Activity,
    reminderTime: number
  ): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured - skipping email');
      return false;
    }

    try {
      const subject = `📚 Study Reminder: ${activity.title}`;
      const html = this.generateStudyReminderHTML(userName, activity, reminderTime);

      await resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject,
        html
      });

      console.log(`Study reminder email sent to ${userEmail} for activity: ${activity.title}`);
      return true;
    } catch (error) {
      console.error('Failed to send study reminder email:', error);
      return false;
    }
  }

  // Send weekly study summary email
  static async sendWeeklySummary(
    userEmail: string,
    userName: string,
    stats: {
      totalSessions: number;
      totalMinutes: number;
      completedActivities: number;
      efficiency: number;
    }
  ): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured - skipping email');
      return false;
    }

    try {
      const subject = `📊 Your Weekly Study Summary`;
      const html = this.generateWeeklySummaryHTML(userName, stats);

      await resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject,
        html
      });

      console.log(`Weekly summary email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send weekly summary email:', error);
      return false;
    }
  }

  // Send goal achievement email
  static async sendGoalAchievement(
    userEmail: string,
    userName: string,
    achievementType: 'streak' | 'milestone' | 'completion',
    details: string
  ): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured - skipping email');
      return false;
    }

    try {
      const subject = `🎉 Achievement Unlocked!`;
      const html = this.generateAchievementHTML(userName, achievementType, details);

      await resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject,
        html
      });

      console.log(`Achievement email sent to ${userEmail}: ${achievementType}`);
      return true;
    } catch (error) {
      console.error('Failed to send achievement email:', error);
      return false;
    }
  }

  // Generate HTML templates
  private static generateStudyReminderHTML(userName: string, activity: Activity, reminderTime: number): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Study Reminder</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            .activity-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
            .priority-high { border-left-color: #ef4444; }
            .priority-medium { border-left-color: #f59e0b; }
            .priority-low { border-left-color: #22c55e; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Study Reminder</h1>
              <p>It's time to focus, ${userName}!</p>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>This is your ${reminderTime}-minute reminder to start studying!</p>
              
              <div class="activity-card priority-${activity.priority}">
                <h3>${activity.title}</h3>
                <p><strong>Subject:</strong> ${activity.subject}</p>
                <p><strong>Priority:</strong> ${activity.priority.charAt(0).toUpperCase() + activity.priority.slice(1)}</p>
                <p><strong>Estimated Duration:</strong> ${activity.estimatedDuration} minutes</p>
              </div>
              
              <p>Ready to make progress on your studies? Open Studify and start your focused session!</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard" class="cta-button">
                Start Studying →
              </a>
              
              <p>Good luck with your session! 🍅</p>
            </div>
            <div class="footer">
              <p>You're receiving this because you have email reminders enabled in Studify.</p>
              <p>You can adjust your notification preferences in the app settings.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static generateWeeklySummaryHTML(userName: string, stats: any): string {
    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins}m`;
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Weekly Study Summary</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
            .stat-label { color: #64748b; font-size: 14px; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Study Summary</h1>
              <p>Great work this week, ${userName}!</p>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Here's a summary of your study progress this week:</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${stats.totalSessions}</div>
                  <div class="stat-label">Study Sessions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${formatTime(stats.totalMinutes)}</div>
                  <div class="stat-label">Total Focus Time</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.completedActivities}</div>
                  <div class="stat-label">Activities Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.efficiency}%</div>
                  <div class="stat-label">Efficiency</div>
                </div>
              </div>
              
              <p>Keep up the excellent work! Consistency is key to achieving your learning goals.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard/reports" class="cta-button">
                View Detailed Reports →
              </a>
            </div>
            <div class="footer">
              <p>You're receiving this weekly summary because you have email notifications enabled.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static generateAchievementHTML(userName: string, achievementType: string, details: string): string {
    const getEmoji = (type: string): string => {
      switch (type) {
        case 'streak': return '🔥';
        case 'milestone': return '🎯';
        case 'completion': return '✅';
        default: return '🎉';
      }
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Achievement Unlocked!</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; }
            .achievement-badge { background: white; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .achievement-emoji { font-size: 3em; margin-bottom: 10px; }
            .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Achievement Unlocked!</h1>
              <p>Congratulations, ${userName}!</p>
            </div>
            <div class="content">
              <div class="achievement-badge">
                <div class="achievement-emoji">${getEmoji(achievementType)}</div>
                <h2>${details}</h2>
                <p>You're making fantastic progress on your learning journey!</p>
              </div>
              
              <p>Keep up the amazing work and continue building your study habits.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/dashboard" class="cta-button">
                Continue Learning →
              </a>
            </div>
            <div class="footer">
              <p>Celebrating your progress with Studify!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Helper function to send scheduled reminders (could be called by a cron job)
export async function sendScheduledReminders() {
  // This would typically be called by a scheduled function or cron job
  // For now, it's a placeholder for the email reminder functionality
  console.log('Checking for scheduled email reminders...');
  
  // In a real implementation, this would:
  // 1. Query database for users with email reminders enabled
  // 2. Check their scheduled activities
  // 3. Send reminders for activities scheduled within the reminder window
  // 4. Mark reminders as sent to avoid duplicates
}