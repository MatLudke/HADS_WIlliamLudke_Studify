import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/ai/flashcard-generator';
import { z } from 'zod';

// Input validation schema
const FlashcardGenerationSchema = z.object({
  subject: z.string()
    .min(2, 'Subject must be at least 2 characters')
    .max(100, 'Subject must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-.,!?À-ÿ]+$/, 'Subject contains invalid characters'),
  count: z.number().int().min(1).max(10).default(5),
  difficulty: z.number().int().min(1).max(3).default(2),
  language: z.string().length(2).regex(/^[a-z]{2}$/).default('en'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate and sanitize input
    const validationResult = FlashcardGenerationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { subject, count, difficulty, language } = validationResult.data;
    
    // Additional sanitization
    const sanitizedSubject = subject
      .trim()
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/[^\w\s\-.,!?À-ÿ]/g, ''); // Remove special chars

    const flashcards = await generateFlashcards({ 
      subject: sanitizedSubject, 
      count, 
      difficulty, 
      language 
    });

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
