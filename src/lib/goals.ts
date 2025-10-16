"use server";

import { collection, addDoc, getDocs, query, where, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { StudySession } from "./types";

export type Goal = {
  id?: string;
  userId: string;
  title: string;
  targetMinutes: number; // total minutes to reach in window
  startAt: Date;
  endAt: Date;
  reminderEnabled?: boolean;
  lastReminderSentAt?: Date | null;
  createdAt?: Date;
};

const goalsCollection = collection(db, "goals");
const studySessionsCollection = collection(db, "studySessions");

export const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'lastReminderSentAt'>) => {
  const docRef = await addDoc(goalsCollection, {
    ...goal,
    startAt: Timestamp.fromDate(goal.startAt),
    endAt: Timestamp.fromDate(goal.endAt),
    reminderEnabled: goal.reminderEnabled ?? true,
    lastReminderSentAt: null,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export async function getActiveGoalsBetween(start: Date, end: Date) {
  // Returns goals that overlap with [start,end]
  const q = query(goalsCollection, where("endAt", ">=", Timestamp.fromDate(start)));
  const snapshot = await getDocs(q);
  const results: Goal[] = [];
  snapshot.forEach((d) => {
    const data = d.data() as any;
    const s = data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt);
    const e = data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt);
    // overlap check
    if (e >= start && s <= end) {
      results.push({
        id: d.id,
        userId: data.userId,
        title: data.title,
        targetMinutes: data.targetMinutes,
        startAt: s,
        endAt: e,
        reminderEnabled: data.reminderEnabled ?? true,
        lastReminderSentAt: data.lastReminderSentAt?.toDate ? data.lastReminderSentAt.toDate() : data.lastReminderSentAt || null,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      });
    }
  });
  return results;
}

export async function computeCompletedMinutesForGoal(userId: string, goalStart: Date, goalEnd: Date): Promise<number> {
  const q = query(studySessionsCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  let total = 0;
  snapshot.forEach((d) => {
    const data = d.data() as any;
    const startAt = data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt);
    const endAt = data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt);
    // if session overlaps goal window, count overlap portion (approx using whole session if inside)
    if (endAt >= goalStart && startAt <= goalEnd) {
      // approximate: use session.duration if present
      if (typeof data.duration === 'number') {
        total += data.duration;
      } else {
        const diff = Math.max(0, Math.min(endAt.getTime(), goalEnd.getTime()) - Math.max(startAt.getTime(), goalStart.getTime()));
        total += Math.round(diff / 60000);
      }
    }
  });
  return total;
}

export async function markGoalReminded(goalId: string) {
  const docRef = doc(goalsCollection, goalId);
  await updateDoc(docRef, {
    lastReminderSentAt: Timestamp.now(),
  });
}
