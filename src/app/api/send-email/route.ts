import { NextResponse } from 'next/server';
import { sendWeeklySummary, sendMissedGoalEmail, sendStudyReminder, sendGoalAchievement } from '@/lib/email-service';

// POST: send test or reminder email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, userEmail, userName, ...params } = body;

    if (!userEmail || !userName) {
      return NextResponse.json({ error: 'userEmail and userName required' }, { status: 400 });
    }

    let success = false;

    switch (type) {
      case 'test':
        // Send a simple test email
        success = await sendWeeklySummary(
          userEmail,
          userName,
          { totalSessions: 5, totalMinutes: 120, completedActivities: 3, efficiency: 85 }
        );
        break;

      case 'missed-goal':
        const { completedMinutes, goalMinutes } = params;
        if (completedMinutes === undefined || goalMinutes === undefined) {
          return NextResponse.json({ error: 'completedMinutes and goalMinutes required for missed-goal' }, { status: 400 });
        }
        success = await sendMissedGoalEmail(userEmail, userName, completedMinutes, goalMinutes);
        break;

      case 'study-reminder':
        const { activity, reminderTime } = params;
        if (!activity) {
          return NextResponse.json({ error: 'activity required for study-reminder' }, { status: 400 });
        }
        success = await sendStudyReminder(userEmail, userName, activity, reminderTime || 10);
        break;

      case 'achievement':
        const { achievementType, details } = params;
        if (!achievementType || !details) {
          return NextResponse.json({ error: 'achievementType and details required for achievement' }, { status: 400 });
        }
        success = await sendGoalAchievement(userEmail, userName, achievementType, details);
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
