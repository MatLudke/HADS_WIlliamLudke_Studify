# 🎯 Goal Tracking System - Implementation Summary

## ✅ Completed

### 1. FCM Cleanup

- ❌ **Removed** `src/lib/notifications.ts` (old FCM system)
- ❌ **Removed** `saveFCMToken()` and `getFCMToken()` from firestore.ts
- ❌ **Removed** `fcmToken` field from User type
- ✅ **Kept** Browser Notification API (simple-notifications.ts)
- ✅ **Kept** EmailJS for email notifications

### 2. Git Configuration

- ✅ Updated `SendStuffToGithub.ps1` to use `main` branch
- ✅ Committed and pushed to `feat/studify-core` branch
- 📝 Commit: `80f50a9` - "refactor(notifications): remove FCM, keep browser + email notifications only"

### 3. Goal Tracking - Activity Creation

- ✅ **Extended Activity type** with goal fields:

  ```typescript
  goalType?: 'daily' | 'weekly' | 'monthly' | 'none';
  goalTarget?: number; // target minutes
  goalStartDate?: Date; // when goal period started
  goalRemindersEnabled?: boolean; // email reminders
  ```

- ✅ **Updated activity-dialog.tsx**:

  - Added Goal Tracking section in form
  - Period selector: None / Daily / Weekly / Monthly
  - Target minutes input (shows only when goal type selected)
  - Email reminders checkbox
  - Validation with Zod schema
  - Conditional rendering with AnimatePresence

- ✅ **Form submission** includes goal data:
  - Sets `goalStartDate` to current date when creating goal
  - Saves all goal fields to Firestore
  - Success toast shows goal details

## 🚧 Next Steps

### 4. Goal Tracking Service (Todo ID: 4)

Create `src/lib/goal-tracking.ts` with:

- `calculateGoalProgress(activity, sessions)` - compute current vs target
- `isGoalBehind(activity, sessions)` - check if user is behind schedule
- `getGoalPeriodDates(goalType, startDate)` - calculate period boundaries
- `shouldSendReminder(activity, lastReminderSent)` - throttle email sends

### 5. Reports Page UI (Todo ID: 5)

Update `src/app/dashboard/reports/page.tsx`:

- Show activities with active goals
- Progress bars: `[====>    ] 45/60 min (75%)`
- Status badges: "On Track ✅" / "Behind ⚠️" / "Completed 🎉"
- Filter by goal type (daily/weekly/monthly)
- Time remaining in current period

### 6. Email Reminders (Todo ID: 6)

Implement automated reminder system:

- **Option A - Client Side (Simple)**:

  - Check goals on dashboard visit
  - If behind + 24h since last check → send email
  - Store `lastReminderSent` in Firestore

- **Option B - Cloud Function (Robust)**:
  - Scheduled function runs daily (Firebase Functions)
  - Query all activities with `goalRemindersEnabled: true`
  - Calculate progress for each
  - Send emails via EmailJS API (server-side)

## 📋 Implementation Guide

### Step 1: Goal Tracking Service

```typescript
// src/lib/goal-tracking.ts
import { Activity, StudySession } from "./types";
import { sendStudyReminder } from "./email-notifications";

export interface GoalProgress {
  currentMinutes: number;
  targetMinutes: number;
  percentComplete: number;
  isBehind: boolean;
  timeRemaining: string;
  periodEnd: Date;
}

export function calculateGoalProgress(
  activity: Activity,
  sessions: StudySession[]
): GoalProgress | null {
  if (
    !activity.goalType ||
    activity.goalType === "none" ||
    !activity.goalTarget ||
    !activity.goalStartDate
  ) {
    return null;
  }

  const { periodStart, periodEnd } = getGoalPeriodDates(
    activity.goalType,
    activity.goalStartDate
  );

  // Filter sessions within current goal period
  const periodSessions = sessions.filter(
    (s) =>
      s.activityId === activity.id &&
      s.startAt >= periodStart &&
      s.startAt <= periodEnd
  );

  const currentMinutes = periodSessions.reduce((sum, s) => sum + s.duration, 0);
  const targetMinutes = activity.goalTarget;
  const percentComplete = (currentMinutes / targetMinutes) * 100;

  // Calculate expected progress based on time elapsed
  const now = new Date();
  const periodDuration = periodEnd.getTime() - periodStart.getTime();
  const elapsed = now.getTime() - periodStart.getTime();
  const expectedPercent = (elapsed / periodDuration) * 100;

  const isBehind = percentComplete < expectedPercent * 0.9; // 10% tolerance

  return {
    currentMinutes,
    targetMinutes,
    percentComplete,
    isBehind,
    timeRemaining: formatTimeRemaining(periodEnd),
    periodEnd,
  };
}

export function getGoalPeriodDates(
  goalType: "daily" | "weekly" | "monthly",
  startDate: Date
): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  let periodStart = new Date(startDate);
  let periodEnd = new Date(periodStart);

  switch (goalType) {
    case "daily":
      // Start of today
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;

    case "weekly":
      // Start of current week (Monday)
      const daysSinceMonday = (now.getDay() + 6) % 7;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - daysSinceMonday);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;

    case "monthly":
      // Start of current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
  }

  return { periodStart, periodEnd };
}

function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 1) return `${days} days left`;
  if (hours > 1) return `${hours} hours left`;
  return "Less than 1 hour left";
}

export async function checkAndSendGoalReminders(
  activity: Activity,
  userEmail: string,
  userName: string,
  progress: GoalProgress | null,
  lastReminderSent?: Date
): Promise<boolean> {
  if (!activity.goalRemindersEnabled || !progress || !progress.isBehind) {
    return false;
  }

  // Don't spam - only send once per day
  if (lastReminderSent) {
    const hoursSinceLastReminder =
      (Date.now() - lastReminderSent.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastReminder < 24) {
      return false;
    }
  }

  const result = await sendStudyReminder(
    userEmail,
    userName,
    `${activity.title} (${activity.goalType} goal)`
  );

  return result.success;
}
```

### Step 2: Reports Page Component

```typescript
// Add to src/app/dashboard/reports/page.tsx

import { calculateGoalProgress } from "@/lib/goal-tracking";

function GoalProgressCard({
  activity,
  sessions,
}: {
  activity: Activity;
  sessions: StudySession[];
}) {
  const progress = calculateGoalProgress(activity, sessions);

  if (!progress) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {activity.title}
          <Badge variant={progress.isBehind ? "destructive" : "default"}>
            {progress.isBehind ? "⚠️ Behind" : "✅ On Track"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {activity.goalType} goal • {progress.timeRemaining}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {progress.currentMinutes} / {progress.targetMinutes} min
            </span>
            <span>{Math.round(progress.percentComplete)}%</span>
          </div>
          <Progress value={progress.percentComplete} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 3: Client-Side Reminder Check

```typescript
// Add to dashboard page useEffect

import { checkAndSendGoalReminders } from "@/lib/goal-tracking";

useEffect(() => {
  async function checkGoals() {
    if (!user || !user.email) return;

    const activitiesWithGoals = activities.filter(
      (a) => a.goalType && a.goalType !== "none" && a.goalRemindersEnabled
    );

    for (const activity of activitiesWithGoals) {
      const progress = calculateGoalProgress(activity, sessions);
      await checkAndSendGoalReminders(
        activity,
        user.email,
        user.displayName?.split(" ")[0] || "Student",
        progress
      );
    }
  }

  // Check goals once when dashboard loads
  checkGoals();
}, [activities, sessions, user]);
```

## 📊 User Experience

### Creating Activity with Goal

1. Click "Add Activity"
2. Fill in title, subject, duration, priority
3. Scroll to "Goal Tracking" section
4. Select period: Daily / Weekly / Monthly
5. Enter target minutes (e.g., 60)
6. Enable "Email Reminders" checkbox
7. Save

### Viewing Progress

1. Go to Reports page
2. See all activities with active goals
3. Progress bars show current status
4. Badges indicate: On Track ✅ / Behind ⚠️
5. Time remaining displayed

### Receiving Reminders

- If behind on goal + 24h since last reminder
- Email sent automatically: "Don't forget to study [Activity]!"
- Includes current progress and encouragement
- Maximum 1 email per day per goal

## 🔍 Testing Guide

1. **Create test activity**:

   - Title: "Math Study"
   - Goal: Daily, 60 minutes
   - Email reminders: ON

2. **Add short session** (15 min):

   - Should show 25% progress
   - Status: Behind (if past halfway through day)

3. **Check email** (after 24h delay):

   - Should receive reminder email

4. **Complete goal**:

   - Add sessions totaling 60+ minutes
   - Status should change to "On Track ✅"

5. **New period**:
   - Daily: resets midnight
   - Weekly: resets Monday
   - Monthly: resets 1st of month

## 📝 Notes

- Goals are optional - users can still create activities without goals
- Goal progress resets automatically based on period type
- Email throttling prevents spam (max 1/day per goal)
- Progress calculation includes 10% tolerance (e.g., 45/60 min at 50% time = on track)
- All goal data stored in Firestore Activity documents
- No additional collections needed
