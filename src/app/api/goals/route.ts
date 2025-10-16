import { NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST: create a new goal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, targetMinutes, startAt, endAt } = body;
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const docRef = await addDoc(collection(db, 'goals'), {
      userId,
      title,
      targetMinutes,
      startAt: Timestamp.fromDate(new Date(startAt)),
      endAt: Timestamp.fromDate(new Date(endAt)),
      reminderEnabled: true,
      lastReminderSentAt: null,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

// GET: list goals for a user (provide ?uid=...)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 });

    const q = query(collection(db, 'goals'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const goals = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: data.title,
        targetMinutes: data.targetMinutes,
        startAt: data.startAt?.toDate ? data.startAt.toDate().toISOString() : data.startAt,
        endAt: data.endAt?.toDate ? data.endAt.toDate().toISOString() : data.endAt,
        reminderEnabled: data.reminderEnabled ?? true,
        lastReminderSentAt: data.lastReminderSentAt?.toDate ? data.lastReminderSentAt.toDate().toISOString() : data.lastReminderSentAt,
      };
    });

    return NextResponse.json({ goals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
