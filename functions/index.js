/**
 * Firebase Functions for Studify: scheduled job to check goals and send missed-goal reminders
 * Deploy with: firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

// Config: how many minutes before end to send reminder (e.g., mid-window)
// We'll simply run daily and send reminders for goals that are active and not yet met.

async function getActiveGoals() {
  const now = admin.firestore.Timestamp.now().toDate();
  const q = db
    .collection("goals")
    .where("endAt", ">=", admin.firestore.Timestamp.fromDate(now));
  const snap = await q.get();
  const goals = [];
  snap.forEach((doc) => {
    const data = doc.data();
    const startAt =
      data.startAt && data.startAt.toDate
        ? data.startAt.toDate()
        : new Date(data.startAt);
    const endAt =
      data.endAt && data.endAt.toDate
        ? data.endAt.toDate()
        : new Date(data.endAt);
    if (endAt >= now) {
      goals.push({ id: doc.id, ...data, startAt, endAt });
    }
  });
  return goals;
}

async function computeCompletedMinutes(userId, goalStart, goalEnd) {
  const sessionsSnap = await db
    .collection("studySessions")
    .where("userId", "==", userId)
    .get();
  let total = 0;
  sessionsSnap.forEach((s) => {
    const d = s.data();
    const startAt =
      d.startAt && d.startAt.toDate ? d.startAt.toDate() : new Date(d.startAt);
    const endAt =
      d.endAt && d.endAt.toDate ? d.endAt.toDate() : new Date(d.endAt);
    if (endAt >= goalStart && startAt <= goalEnd) {
      if (typeof d.duration === "number") total += d.duration;
      else {
        const diff = Math.max(
          0,
          Math.min(endAt.getTime(), goalEnd.getTime()) -
            Math.max(startAt.getTime(), goalStart.getTime())
        );
        total += Math.round(diff / 60000);
      }
    }
  });
  return total;
}

async function sendFCMToUser(userId, title, body, data = {}) {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) return false;
  const user = userDoc.data();
  const token = user?.fcmToken;
  if (!token) return false;

  const message = {
    token,
    notification: { title, body },
    data: { ...data, type: "missed-goal" },
  };

  try {
    const res = await admin.messaging().send(message);
    console.log("FCM sent:", res);
    return true;
  } catch (err) {
    console.error("FCM send error", err);
    return false;
  }
}

async function sendEmailViaResend(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("RESEND_API_KEY not configured. skipping email");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "Studify <notifications@studify.app>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend failed", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend error", err);
    return false;
  }
}

exports.scheduledGoalChecker = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("Running scheduledGoalChecker");
    const goals = await getActiveGoals();
    const now = new Date();

    for (const goal of goals) {
      if (!goal.reminderEnabled) continue;

      // skip if we recently reminded (24h)
      if (goal.lastReminderSentAt && goal.lastReminderSentAt.toDate) {
        const last = goal.lastReminderSentAt.toDate();
        if (now.getTime() - last.getTime() < 24 * 60 * 60 * 1000) continue;
      }

      const completed = await computeCompletedMinutes(
        goal.userId,
        goal.startAt,
        goal.endAt
      );
      const pct = Math.round(
        (completed / Math.max(goal.targetMinutes, 1)) * 100
      );
      if (pct < 50) {
        // threshold: less than 50% mid-way reminder heuristic
        const title = `Study goal progress: ${pct}%`;
        const body = `You completed ${completed} minutes of ${Math.round(
          goal.targetMinutes / 60
        )}h goal.`;

        // Send FCM to user (browser notification via token)
        await sendFCMToUser(goal.userId, title, body, {
          goalId: goal.id,
          pct: `${pct}`,
        });

        // Send email as backup if user opted-in for email reminders
        const userDoc = await db.collection("users").doc(goal.userId).get();
        const user = userDoc.data();
        if (user?.notificationPreferences?.emailReminders) {
          const subject = `You're ${pct}% to your study goal`;
          const html = `<p>Hi ${
            user.name || ""
          },</p><p>You completed ${completed} minutes (${pct}%) of your goal.</p>`;
          await sendEmailViaResend(user.email, subject, html);
        }

        // mark reminded
        await db
          .collection("goals")
          .doc(goal.id)
          .update({ lastReminderSentAt: admin.firestore.Timestamp.now() });
        console.log("Reminded user", goal.userId, "for goal", goal.id);
      }
    }

    return null;
  });
