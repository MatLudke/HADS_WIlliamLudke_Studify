import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/ai/flashcard-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, count = 5, difficulty = 2 } = body;

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    const flashcards = await generateFlashcards({ subject, count, difficulty });

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
