/**
 * Goal Reminders Debug Panel
 * Test and trigger goal reminder emails manually
 */

"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppState } from '@/contexts/AppStateContext';
import { checkAndSendGoalReminders, calculateAllGoalsProgress } from '@/lib/goal-tracking';
import { AlertCircle, CheckCircle2, Mail, RefreshCw, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function GoalDebugPanel() {
  const { user, activities, studySessions } = useAppState();
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    skipped: number;
    errors: string[];
    timestamp: Date;
  } | null>(null);

  const handleCheckGoals = async () => {
    if (!user || !user.email) {
      return;
    }

    setIsChecking(true);
    try {
      const userName = user.displayName || user.email.split('@')[0] || 'there';
      const results = await checkAndSendGoalReminders(
        activities,
        studySessions,
        user.email,
        userName
      );

      setLastResult({
        ...results,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error checking goals:', error);
      setLastResult({
        sent: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearThrottle = () => {
    // Clear all goal reminder timestamps from localStorage
    const keys = Object.keys(localStorage);
    const reminderKeys = keys.filter(key => key.startsWith('goal_reminder_'));
    reminderKeys.forEach(key => localStorage.removeItem(key));
    
    alert(`Cleared ${reminderKeys.length} reminder throttle(s). You can now receive reminders again.`);
  };

  const goalsProgress = calculateAllGoalsProgress(activities, studySessions);
  const activitiesWithReminders = activities.filter(
    a => a.goalRemindersEnabled && a.goalType && a.goalType !== 'none'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Goal Reminders Debug
        </CardTitle>
        <CardDescription>
          Test and manually trigger goal reminder emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">User Email</span>
            <span className="text-sm text-muted-foreground">{user?.email || 'Not logged in'}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Activities with Reminders</span>
            <Badge variant={activitiesWithReminders.length > 0 ? "default" : "secondary"}>
              {activitiesWithReminders.length}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Total Goals Tracked</span>
            <Badge variant={goalsProgress.length > 0 ? "default" : "secondary"}>
              {goalsProgress.length}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Goals Behind Schedule</span>
            <Badge variant={goalsProgress.filter(g => g.isBehind).length > 0 ? "destructive" : "secondary"}>
              {goalsProgress.filter(g => g.isBehind).length}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={handleCheckGoals} 
            disabled={isChecking || !user || activitiesWithReminders.length === 0}
            className="w-full"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking Goals...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Check & Send Reminders Now
              </>
            )}
          </Button>

          <Button 
            onClick={handleClearThrottle} 
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Reminder Throttle
          </Button>
        </div>

        {/* Help Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>How it works:</strong>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Reminders are throttled to max 1 per goal per 24 hours</li>
              <li>Only sent for activities with "Email Reminders" enabled</li>
              <li>Only sent when you're behind schedule on your goal</li>
              <li>Throttle data is stored in browser localStorage</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Last Result */}
        {lastResult && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Last Check Result</h4>
              <div className="text-xs text-muted-foreground">
                {lastResult.timestamp.toLocaleString()}
              </div>

              {lastResult.sent > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    ✅ Sent {lastResult.sent} reminder email(s)
                  </AlertDescription>
                </Alert>
              )}

              {lastResult.skipped > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    ⏭️ Skipped {lastResult.skipped} reminder(s) (on track or recently sent)
                  </AlertDescription>
                </Alert>
              )}

              {lastResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">Errors:</div>
                    <ul className="list-disc ml-4 space-y-1">
                      {lastResult.errors.map((error, i) => (
                        <li key={i} className="text-xs">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {lastResult.sent === 0 && lastResult.skipped === 0 && lastResult.errors.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No reminders to send. All goals are on track! 🎉
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Current Goals Status */}
        {goalsProgress.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Current Goals Status</h4>
              <div className="space-y-2">
                {goalsProgress.map(goal => (
                  <div 
                    key={goal.activityId} 
                    className={`p-3 rounded-lg border ${goal.isBehind ? 'border-destructive/50 bg-destructive/5' : 'border-muted bg-muted/30'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{goal.activityTitle}</span>
                      <Badge variant={goal.isBehind ? "destructive" : "default"}>
                        {goal.isBehind ? "Behind" : "On Track"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Progress: {goal.currentProgress} / {goal.goalTarget} min ({goal.progressPercentage}%)</div>
                      <div>Period: {goal.goalType}</div>
                      <div>Reminders: {
                        activities.find(a => a.id === goal.activityId)?.goalRemindersEnabled 
                          ? '✅ Enabled' 
                          : '❌ Disabled'
                      }</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
