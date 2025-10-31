/**
 * Goal Tracking Service
 * Handles goal progress calculation and email reminders for study goals
 */

import { Activity, StudySession } from './types';
import { sendEmail } from './email-notifications';

export interface GoalProgress {
  activityId: string;
  activityTitle: string;
  goalType: 'daily' | 'weekly' | 'monthly';
  goalTarget: number; // target minutes
  currentProgress: number; // minutes completed in current period
  progressPercentage: number;
  isOnTrack: boolean;
  isBehind: boolean;
  periodStart: Date;
  periodEnd: Date;
  timeRemaining: number; // minutes remaining to reach goal
}

/**
 * Get the start and end dates for a goal period
 */
export function getGoalPeriodDates(goalType: 'daily' | 'weekly' | 'monthly', goalStartDate: Date): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(goalStartDate);
  
  switch (goalType) {
    case 'daily': {
      // Daily: Today from 00:00 to 23:59
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      return { start: todayStart, end: todayEnd };
    }
    
    case 'weekly': {
      // Weekly: Monday to Sunday
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return { start: weekStart, end: weekEnd };
    }
    
    case 'monthly': {
      // Monthly: First to last day of current month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      return { start: monthStart, end: monthEnd };
    }
  }
}

/**
 * Calculate progress for a single activity goal
 */
export function calculateGoalProgress(
  activity: Activity,
  studySessions: StudySession[]
): GoalProgress | null {
  if (!activity.goalType || activity.goalType === 'none' || !activity.goalTarget || !activity.goalStartDate) {
    return null;
  }

  const { start, end } = getGoalPeriodDates(activity.goalType, activity.goalStartDate);
  
  // Filter sessions for this activity within the current period
  const relevantSessions = studySessions.filter(session => {
    if (session.activityId !== activity.id) return false;
    
    // Use endAt instead of completedAt
    const sessionDate = session.endAt instanceof Date 
      ? session.endAt 
      : new Date(session.endAt);
    
    return sessionDate >= start && sessionDate <= end;
  });

  // Calculate total minutes studied for this activity in the current period
  const currentProgress = relevantSessions.reduce((total, session) => {
    return total + (session.duration || 0);
  }, 0);

  const progressPercentage = activity.goalTarget > 0 
    ? Math.round((currentProgress / activity.goalTarget) * 100) 
    : 0;

  // Calculate expected progress based on time elapsed in the period
  const now = new Date();
  const totalPeriodDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();
  const periodProgress = elapsedDuration / totalPeriodDuration;
  const expectedProgress = activity.goalTarget * periodProgress;

  // Consider "on track" if within 10% of expected progress or ahead
  const isOnTrack = currentProgress >= expectedProgress * 0.9;
  const isBehind = currentProgress < expectedProgress * 0.9;

  return {
    activityId: activity.id,
    activityTitle: activity.title,
    goalType: activity.goalType,
    goalTarget: activity.goalTarget,
    currentProgress,
    progressPercentage,
    isOnTrack,
    isBehind,
    periodStart: start,
    periodEnd: end,
    timeRemaining: Math.max(0, activity.goalTarget - currentProgress)
  };
}

/**
 * Calculate progress for all activities with goals
 */
export function calculateAllGoalsProgress(
  activities: Activity[],
  studySessions: StudySession[]
): GoalProgress[] {
  const progressList: GoalProgress[] = [];

  for (const activity of activities) {
    const progress = calculateGoalProgress(activity, studySessions);
    if (progress) {
      progressList.push(progress);
    }
  }

  return progressList;
}

/**
 * Format goal progress message for email
 */
function formatGoalProgressMessage(progress: GoalProgress): string {
  const percentBehind = Math.round(100 - progress.progressPercentage);
  const hoursRemaining = Math.floor(progress.timeRemaining / 60);
  const minutesRemaining = progress.timeRemaining % 60;
  
  let message = `You're behind on your ${progress.goalType} study goal for "${progress.activityTitle}".\n\n`;
  message += `📊 Progress: ${progress.currentProgress} / ${progress.goalTarget} minutes (${progress.progressPercentage}%)\n`;
  message += `⏰ Time remaining: ${hoursRemaining}h ${minutesRemaining}m\n\n`;
  
  if (progress.goalType === 'daily') {
    message += `Don't worry! There's still time today to catch up. Even 15 minutes of focused study makes a difference! 💪`;
  } else if (progress.goalType === 'weekly') {
    const daysLeft = Math.ceil((progress.periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    message += `You have ${daysLeft} days left this week. Break it down into smaller daily sessions to stay on track! 🎯`;
  } else {
    const daysLeft = Math.ceil((progress.periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    message += `You have ${daysLeft} days left this month. Small, consistent efforts lead to big results! 🚀`;
  }

  return message;
}

/**
 * Check if a reminder was recently sent (within last 24 hours)
 */
function wasRecentlyReminded(lastReminderKey: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const lastSent = localStorage.getItem(lastReminderKey);
  if (!lastSent) return false;
  
  const lastSentTime = new Date(lastSent).getTime();
  const now = new Date().getTime();
  const hoursSinceLastReminder = (now - lastSentTime) / (1000 * 60 * 60);
  
  // Don't send more than one reminder per 24 hours
  return hoursSinceLastReminder < 24;
}

/**
 * Mark that a reminder was sent
 */
function markReminderSent(lastReminderKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(lastReminderKey, new Date().toISOString());
}

/**
 * Check goals and send email reminders for activities that are behind
 */
export async function checkAndSendGoalReminders(
  activities: Activity[],
  studySessions: StudySession[],
  userEmail: string,
  userName: string
): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const results = {
    sent: 0,
    skipped: 0,
    errors: [] as string[]
  };

  // Only check activities that have reminders enabled
  const activitiesWithReminders = activities.filter(
    activity => activity.goalRemindersEnabled && 
                activity.goalType && 
                activity.goalType !== 'none'
  );

  for (const activity of activitiesWithReminders) {
    const progress = calculateGoalProgress(activity, studySessions);
    
    if (!progress || !progress.isBehind) {
      results.skipped++;
      continue;
    }

    // Check if we already sent a reminder recently
    const reminderKey = `goal_reminder_${activity.id}_${progress.goalType}_${progress.periodStart.toISOString()}`;
    
    if (wasRecentlyReminded(reminderKey)) {
      console.log(`⏭️ Skipping reminder for ${activity.title} - already sent within 24h`);
      results.skipped++;
      continue;
    }

    // Send the reminder email
    try {
      const message = formatGoalProgressMessage(progress);
      const result = await sendEmail({
        to_email: userEmail,
        to_name: userName,
        subject: `🎯 Goal Reminder: ${activity.title} - Studify`,
        message: message
      });

      if (result.success) {
        console.log(`✅ Sent goal reminder for ${activity.title}`);
        markReminderSent(reminderKey);
        results.sent++;
      } else {
        console.error(`❌ Failed to send reminder for ${activity.title}:`, result.error);
        results.errors.push(`${activity.title}: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error sending reminder for ${activity.title}:`, error);
      results.errors.push(`${activity.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}

/**
 * Get a summary of all goal statuses
 */
export function getGoalsSummary(progressList: GoalProgress[]): {
  total: number;
  onTrack: number;
  behind: number;
  completed: number;
} {
  return {
    total: progressList.length,
    onTrack: progressList.filter(p => p.isOnTrack && p.progressPercentage < 100).length,
    behind: progressList.filter(p => p.isBehind).length,
    completed: progressList.filter(p => p.progressPercentage >= 100).length
  };
}
