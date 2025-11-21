import OpenAI from 'openai';
import type { FlashcardQuestion } from '@/components/dashboard/flashcard';

export interface GenerateFlashcardsInput {
  subject: string;
  count?: number;
  difficulty?: number; // 1=Easy, 2=Medium, 3=Hard
  language?: string; // Browser/OS language code (e.g., 'en', 'es', 'pt', 'fr')
}

// Initialize OpenAI client with Poe API configuration
const poeClient = new OpenAI({
  apiKey: process.env.POE_API_KEY,
  baseURL: 'https://api.poe.com/v1',
});

/**
 * Generate a random gradient with pleasant colors and good contrast
 * Each gradient is designed to be visually distinct and readable
 */
function generateRandomGradient(): { color1: string; color2: string; color3: string } {
  const gradients = [
    // Sunset Orange to Pink
    { color1: 'rgba(255, 94, 77, 1)', color2: 'rgba(255, 154, 158, 1)', color3: 'rgba(250, 208, 196, 1)' },
    // Deep Purple to Lavender
    { color1: 'rgba(126, 87, 194, 1)', color2: 'rgba(171, 146, 234, 1)', color3: 'rgba(214, 202, 254, 1)' },
    // Ocean Blue to Turquoise
    { color1: 'rgba(34, 116, 165, 1)', color2: 'rgba(72, 187, 199, 1)', color3: 'rgba(165, 243, 252, 1)' },
    // Emerald to Mint
    { color1: 'rgba(5, 150, 105, 1)', color2: 'rgba(52, 211, 153, 1)', color3: 'rgba(167, 243, 208, 1)' },
    // Golden Yellow to Peach
    { color1: 'rgba(245, 158, 11, 1)', color2: 'rgba(251, 191, 36, 1)', color3: 'rgba(254, 240, 138, 1)' },
    // Rose Red to Coral
    { color1: 'rgba(225, 29, 72, 1)', color2: 'rgba(251, 113, 133, 1)', color3: 'rgba(254, 205, 211, 1)' },
    // Indigo to Sky Blue
    { color1: 'rgba(79, 70, 229, 1)', color2: 'rgba(129, 140, 248, 1)', color3: 'rgba(191, 219, 254, 1)' },
    // Lime to Yellow
    { color1: 'rgba(101, 163, 13, 1)', color2: 'rgba(163, 230, 53, 1)', color3: 'rgba(233, 250, 159, 1)' },
    // Magenta to Pink
    { color1: 'rgba(192, 38, 211, 1)', color2: 'rgba(232, 121, 249, 1)', color3: 'rgba(245, 208, 254, 1)' },
    // Teal to Cyan
    { color1: 'rgba(13, 148, 136, 1)', color2: 'rgba(45, 212, 191, 1)', color3: 'rgba(153, 246, 228, 1)' },
    // Amber to Orange
    { color1: 'rgba(217, 119, 6, 1)', color2: 'rgba(251, 146, 60, 1)', color3: 'rgba(253, 186, 116, 1)' },
    // Violet to Fuchsia
    { color1: 'rgba(139, 92, 246, 1)', color2: 'rgba(192, 132, 252, 1)', color3: 'rgba(232, 196, 253, 1)' },
    // Navy to Sky
    { color1: 'rgba(30, 58, 138, 1)', color2: 'rgba(59, 130, 246, 1)', color3: 'rgba(186, 230, 253, 1)' },
    // Forest Green to Lime
    { color1: 'rgba(21, 128, 61, 1)', color2: 'rgba(74, 222, 128, 1)', color3: 'rgba(187, 247, 208, 1)' },
    // Cherry to Rose
    { color1: 'rgba(190, 18, 60, 1)', color2: 'rgba(244, 63, 94, 1)', color3: 'rgba(251, 182, 206, 1)' },
    // Electric Blue to Cyan
    { color1: 'rgba(6, 182, 212, 1)', color2: 'rgba(34, 211, 238, 1)', color3: 'rgba(207, 250, 254, 1)' },
  ];
  
  return gradients[Math.floor(Math.random() * gradients.length)];
}

/**
 * Generate flashcards using Poe API (GPT-4o-mini model)
 */
export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<FlashcardQuestion[]> {
  const { subject, count = 4, difficulty = 2, language = 'en' } = input;

  const difficultyDescriptions = {
    1: {
      level: "EASY",
      description: "Basic, introductory level questions that test fundamental knowledge and recall. Questions should be straightforward with clear, simple concepts.",
      example: "What is the capital of France?"
    },
    2: {
      level: "MEDIUM", 
      description: "Intermediate questions that require some understanding and application of concepts. Mix of recall and thinking.",
      example: "Which factor most influenced the French Revolution?"
    },
    3: {
      level: "HARD",
      description: "Advanced questions that test deep understanding, critical thinking, and analysis. Should challenge students and avoid simple memorization.",
      example: "How did Enlightenment philosophy fundamentally reshape European governance?"
    }
  };

  const difficultyInfo = difficultyDescriptions[difficulty as 1 | 2 | 3] || difficultyDescriptions[2];

  // Language instruction based on detected language
  const languageInstruction = language !== 'en' 
    ? `\n\nIMPORTANT: Generate ALL content (questions, options, answers) in the SAME LANGUAGE as the subject input. The user submitted the subject in ${language.toUpperCase()} language, so respond entirely in that language.`
    : '';

  const prompt = `Generate exactly ${count} ${difficultyInfo.level} educational flashcard questions about "${subject}".${languageInstruction}
  
DIFFICULTY: ${difficultyInfo.level}
${difficultyInfo.description}

Example ${difficultyInfo.level} question: "${difficultyInfo.example}"

Requirements:
- Mix of multiple-choice (with 4 options) and true/false questions
- For multiple-choice: provide exactly 4 options with plausible distractors
- IMPORTANT: Keep each option SHORT (max 4-6 words) for readability
- Make incorrect options believable and closely related to the correct answer
- Questions should match the ${difficultyInfo.level} difficulty level
- Keep questions clear (under 80 characters if possible)
- Mark the correct answer clearly

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, no extra text):
{
  "flashcards": [
    {
      "question": "What principle explains natural selection?",
      "type": "multiple-choice",
      "options": ["Genetic drift", "Survival advantage", "Random mutation", "Population size"],
      "correctAnswer": "Survival advantage"
    },
    {
      "question": "Does correlation always imply causation?",
      "type": "true-false",
      "correctAnswer": "False"
    }
  ]
}

Generate ${count} ${difficultyInfo.level} questions with SHORT options now:`;

  try {
    const response = await poeClient.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content || '';
    
    // Extract JSON from the response (handle potential markdown wrapping)
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response - no JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const flashcardsData = parsed.flashcards || [];

    if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
      throw new Error('Invalid flashcard data structure');
    }

    // Shuffle gradients to ensure variety
    const gradients = [
      { color1: 'rgba(255, 94, 77, 1)', color2: 'rgba(255, 154, 158, 1)', color3: 'rgba(250, 208, 196, 1)' },
      { color1: 'rgba(126, 87, 194, 1)', color2: 'rgba(171, 146, 234, 1)', color3: 'rgba(214, 202, 254, 1)' },
      { color1: 'rgba(34, 116, 165, 1)', color2: 'rgba(72, 187, 199, 1)', color3: 'rgba(165, 243, 252, 1)' },
      { color1: 'rgba(5, 150, 105, 1)', color2: 'rgba(52, 211, 153, 1)', color3: 'rgba(167, 243, 208, 1)' },
      { color1: 'rgba(245, 158, 11, 1)', color2: 'rgba(251, 191, 36, 1)', color3: 'rgba(254, 240, 138, 1)' },
      { color1: 'rgba(225, 29, 72, 1)', color2: 'rgba(251, 113, 133, 1)', color3: 'rgba(254, 205, 211, 1)' },
      { color1: 'rgba(79, 70, 229, 1)', color2: 'rgba(129, 140, 248, 1)', color3: 'rgba(191, 219, 254, 1)' },
      { color1: 'rgba(101, 163, 13, 1)', color2: 'rgba(163, 230, 53, 1)', color3: 'rgba(233, 250, 159, 1)' },
      { color1: 'rgba(192, 38, 211, 1)', color2: 'rgba(232, 121, 249, 1)', color3: 'rgba(245, 208, 254, 1)' },
      { color1: 'rgba(13, 148, 136, 1)', color2: 'rgba(45, 212, 191, 1)', color3: 'rgba(153, 246, 228, 1)' },
      { color1: 'rgba(217, 119, 6, 1)', color2: 'rgba(251, 146, 60, 1)', color3: 'rgba(253, 186, 116, 1)' },
      { color1: 'rgba(139, 92, 246, 1)', color2: 'rgba(192, 132, 252, 1)', color3: 'rgba(232, 196, 253, 1)' },
      { color1: 'rgba(30, 58, 138, 1)', color2: 'rgba(59, 130, 246, 1)', color3: 'rgba(186, 230, 253, 1)' },
      { color1: 'rgba(21, 128, 61, 1)', color2: 'rgba(74, 222, 128, 1)', color3: 'rgba(187, 247, 208, 1)' },
      { color1: 'rgba(190, 18, 60, 1)', color2: 'rgba(244, 63, 94, 1)', color3: 'rgba(251, 182, 206, 1)' },
      { color1: 'rgba(6, 182, 212, 1)', color2: 'rgba(34, 211, 238, 1)', color3: 'rgba(207, 250, 254, 1)' },
    ];
    
    // Shuffle gradients to ensure variety
    const shuffled = [...gradients].sort(() => Math.random() - 0.5);
    
    return flashcardsData.map((q: any, idx: number) => ({
      id: `${Date.now()}-${idx}`,
      question: q.question,
      type: q.type as 'multiple-choice' | 'true-false',
      options: q.options,
      correctAnswer: q.correctAnswer,
      gradient: shuffled[idx % shuffled.length],
    }));
  } catch (error) {
    console.error('Error generating flashcards with Poe API:', error);
    throw new Error('Failed to generate flashcards. Please try again.');
  }
}
