/**
 * Goal Tracking Service
 * Handles goal progress calculation and email reminders for study goals
 */

import { Activity, StudySession } from './types';
import { sendEmail } from './email-notifications';

export interface GoalProgress {
  activityId: string;
  activityTitle: string;
  goalType: 'weekly'; // Only weekly now (Duolingo-style)
  goalTarget: number; // target sessions per week (1-7)
  currentProgress: number; // sessions completed this week
  progressPercentage: number;
  isOnTrack: boolean;
  isBehind: boolean;
  periodStart: Date;
  periodEnd: Date;
  sessionsRemaining: number; // sessions remaining to reach goal
  streakWeeks: number; // consecutive weeks meeting goal
}

/**
 * Get the start and end dates for the current week (Monday to Sunday)
 */
export function getCurrentWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  
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

/**
 * Calculate progress for a single activity goal (weekly sessions)
 */
export function calculateGoalProgress(
  activity: Activity,
  studySessions: StudySession[]
): GoalProgress | null {
  if (!activity.goalType || activity.goalType === 'none' || !activity.goalTarget || !activity.goalStartDate) {
    return null;
  }

  const { start, end } = getCurrentWeekDates();
  
  // Filter sessions for this activity within the current week
  const relevantSessions = studySessions.filter(session => {
    if (session.activityId !== activity.id) return false;
    
    const sessionDate = session.endAt instanceof Date 
      ? session.endAt 
      : new Date(session.endAt);
    
    return sessionDate >= start && sessionDate <= end;
  });

  // Count completed sessions (not minutes!)
  const currentProgress = relevantSessions.length;

  const progressPercentage = activity.goalTarget > 0 
    ? Math.round((currentProgress / activity.goalTarget) * 100) 
    : 0;

  // Calculate expected progress based on day of week
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Monday=1, Sunday=7
  const expectedSessions = (activity.goalTarget / 7) * dayOfWeek;

  // Consider "on track" if current >= expected (or close)
  const isOnTrack = currentProgress >= Math.floor(expectedSessions);
  const isBehind = currentProgress < Math.floor(expectedSessions);

  // Calculate streak (consecutive weeks meeting goal)
  let streakWeeks = 0;
  if (activity.goalStartDate) {
    const goalStart = new Date(activity.goalStartDate);
    let checkWeekStart = new Date(start);
    
    // Go backwards week by week
    while (checkWeekStart >= goalStart) {
      const checkWeekEnd = new Date(checkWeekStart);
      checkWeekEnd.setDate(checkWeekStart.getDate() + 6);
      checkWeekEnd.setHours(23, 59, 59, 999);
      
      const weekSessions = studySessions.filter(session => {
        if (session.activityId !== activity.id) return false;
        const sessionDate = session.endAt instanceof Date 
          ? session.endAt 
          : new Date(session.endAt);
        return sessionDate >= checkWeekStart && sessionDate <= checkWeekEnd;
      });
      
      if (weekSessions.length >= activity.goalTarget) {
        streakWeeks++;
      } else {
        break; // Streak broken
      }
      
      // Move to previous week
      checkWeekStart.setDate(checkWeekStart.getDate() - 7);
    }
  }

  return {
    activityId: activity.id,
    activityTitle: activity.title,
    goalType: 'weekly',
    goalTarget: activity.goalTarget,
    currentProgress,
    progressPercentage,
    isOnTrack,
    isBehind,
    periodStart: start,
    periodEnd: end,
    sessionsRemaining: Math.max(0, activity.goalTarget - currentProgress),
    streakWeeks
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
 * Format goal progress message for email (weekly sessions)
 */
function formatGoalProgressMessage(progress: GoalProgress): string {
  const daysLeft = Math.ceil((progress.periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  let message = `You're behind on your weekly study goal for "${progress.activityTitle}".\n\n`;
  message += `📊 Progress: ${progress.currentProgress} / ${progress.goalTarget} sessions (${progress.progressPercentage}%)\n`;
  message += `🎯 Sessions remaining: ${progress.sessionsRemaining}\n`;
  
  if (progress.streakWeeks > 0) {
    message += `🔥 Current streak: ${progress.streakWeeks} week${progress.streakWeeks > 1 ? 's' : ''}!\n`;
  }
  
  message += `\n`;
  message += `You have ${daysLeft} day${daysLeft > 1 ? 's' : ''} left this week. `;
  message += `Each study session counts - keep your streak alive! 💪🔥`;

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
      // Already sent reminder within 24h
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
        markReminderSent(reminderKey);
        results.sent++;
      } else {
        results.errors.push(`${activity.title}: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
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
