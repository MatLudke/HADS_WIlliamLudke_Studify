/**
 * Hook to automatically check and send goal reminders
 */

import { useEffect, useRef } from 'react';
import { useAppState } from '@/contexts/AppStateContext';
import { checkAndSendGoalReminders } from '@/lib/goal-tracking';

/**
 * Hook that checks goals and sends reminders once per session
 * Call this in your dashboard or main app component
 */
export function useGoalReminders() {
  const { user, activities, studySessions } = useAppState();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasChecked.current) return;
    
    // Wait for user and data to be loaded
    if (!user || activities.length === 0 || studySessions.length === 0) return;

    // Check if any activities have goal reminders enabled
    const hasGoalReminders = activities.some(
      activity => activity.goalRemindersEnabled && 
                  activity.goalType && 
                  activity.goalType !== 'none'
    );

    if (!hasGoalReminders) {
      console.log('📊 No activities with goal reminders enabled');
      return;
    }

    // Mark as checked to prevent duplicate runs
    hasChecked.current = true;

    // Run the check asynchronously
    const checkGoals = async () => {
      try {
        console.log('📊 Checking goals for reminders...');
        const userName = user.displayName || user.email?.split('@')[0] || 'there';
        const userEmail = user.email;

        if (!userEmail) {
          console.warn('⚠️ User email not available for goal reminders');
          return;
        }

        const results = await checkAndSendGoalReminders(
          activities,
          studySessions,
          userEmail,
          userName
        );

        if (results.sent > 0) {
          console.log(`✅ Sent ${results.sent} goal reminder(s)`);
        }
        
        if (results.skipped > 0) {
          console.log(`⏭️ Skipped ${results.skipped} reminder(s) (on track or recently sent)`);
        }

        if (results.errors.length > 0) {
          console.error('❌ Errors sending reminders:', results.errors);
        }
      } catch (error) {
        console.error('❌ Error checking goals:', error);
      }
    };

    // Small delay to ensure everything is loaded
    const timeoutId = setTimeout(checkGoals, 1000);

    return () => clearTimeout(timeoutId);
  }, [user, activities, studySessions]);
}
