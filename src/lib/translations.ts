/**
 * UI Translations for Flashcard Generator
 * Automatically detects user's OS/browser language
 */

export interface Translations {
  title: string;
  placeholder: string;
  generate: string;
  generating: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  correct: string;
  incorrect: string;
  accuracy: string;
  newSet: string;
  error: string;
}

const translations: Record<string, Translations> = {
  // English
  en: {
    title: 'AI Flashcards',
    placeholder: 'What subject do you want to study?',
    generate: 'Generate',
    generating: 'Generating',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    correct: 'Correct',
    incorrect: 'Incorrect',
    accuracy: 'Accuracy',
    newSet: 'New Set',
    error: 'Failed to generate flashcards. Please try again.',
  },
  
  // Spanish
  es: {
    title: 'Tarjetas de Estudio IA',
    placeholder: '¿Qué tema quieres estudiar?',
    generate: 'Generar',
    generating: 'Generando',
    difficulty: 'Dificultad',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    correct: 'Correctas',
    incorrect: 'Incorrectas',
    accuracy: 'Precisión',
    newSet: 'Nuevo Grupo',
    error: 'Error al generar tarjetas. Por favor, inténtalo de nuevo.',
  },
  
  // Portuguese
  pt: {
    title: 'Flashcards IA',
    placeholder: 'Que assunto você quer estudar?',
    generate: 'Gerar',
    generating: 'Gerando',
    difficulty: 'Dificuldade',
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    correct: 'Corretas',
    incorrect: 'Incorretas',
    accuracy: 'Precisão',
    newSet: 'Novo Conjunto',
    error: 'Falha ao gerar flashcards. Por favor, tente novamente.',
  },
  
  // French
  fr: {
    title: 'Cartes Mémoire IA',
    placeholder: 'Quel sujet voulez-vous étudier?',
    generate: 'Générer',
    generating: 'Génération',
    difficulty: 'Difficulté',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    correct: 'Correctes',
    incorrect: 'Incorrectes',
    accuracy: 'Précision',
    newSet: 'Nouveau Groupe',
    error: 'Échec de la génération. Veuillez réessayer.',
  },
  
  // German
  de: {
    title: 'KI-Lernkarten',
    placeholder: 'Welches Thema möchten Sie lernen?',
    generate: 'Generieren',
    generating: 'Generiert',
    difficulty: 'Schwierigkeit',
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    correct: 'Richtig',
    incorrect: 'Falsch',
    accuracy: 'Genauigkeit',
    newSet: 'Neues Set',
    error: 'Fehler beim Generieren. Bitte versuchen Sie es erneut.',
  },
  
  // Italian
  it: {
    title: 'Flashcard IA',
    placeholder: 'Quale argomento vuoi studiare?',
    generate: 'Genera',
    generating: 'Generazione',
    difficulty: 'Difficoltà',
    easy: 'Facile',
    medium: 'Medio',
    hard: 'Difficile',
    correct: 'Corrette',
    incorrect: 'Errate',
    accuracy: 'Precisione',
    newSet: 'Nuovo Set',
    error: 'Errore nella generazione. Riprova.',
  },
  
  // Japanese
  ja: {
    title: 'AIフラッシュカード',
    placeholder: '何を勉強したいですか？',
    generate: '生成',
    generating: '生成中',
    difficulty: '難易度',
    easy: '簡単',
    medium: '普通',
    hard: '難しい',
    correct: '正解',
    incorrect: '不正解',
    accuracy: '正解率',
    newSet: '新しいセット',
    error: '生成に失敗しました。もう一度お試しください。',
  },
  
  // Chinese (Simplified)
  zh: {
    title: 'AI学习卡',
    placeholder: '你想学习什么主题？',
    generate: '生成',
    generating: '生成中',
    difficulty: '难度',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    correct: '正确',
    incorrect: '错误',
    accuracy: '准确率',
    newSet: '新套卡',
    error: '生成失败，请重试。',
  },
  
  // Korean
  ko: {
    title: 'AI 플래시카드',
    placeholder: '무엇을 공부하고 싶으세요?',
    generate: '생성',
    generating: '생성 중',
    difficulty: '난이도',
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
    correct: '정답',
    incorrect: '오답',
    accuracy: '정확도',
    newSet: '새 세트',
    error: '생성 실패. 다시 시도해주세요.',
  },
  
  // Russian
  ru: {
    title: 'ИИ Флэшкарты',
    placeholder: 'Какую тему вы хотите изучить?',
    generate: 'Создать',
    generating: 'Создание',
    difficulty: 'Сложность',
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
    correct: 'Правильно',
    incorrect: 'Неправильно',
    accuracy: 'Точность',
    newSet: 'Новый набор',
    error: 'Ошибка создания. Попробуйте еще раз.',
  },
  
  // Arabic
  ar: {
    title: 'بطاقات الذكاء الاصطناعي',
    placeholder: 'ما الموضوع الذي تريد دراسته؟',
    generate: 'إنشاء',
    generating: 'جاري الإنشاء',
    difficulty: 'الصعوبة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    correct: 'صحيح',
    incorrect: 'خاطئ',
    accuracy: 'الدقة',
    newSet: 'مجموعة جديدة',
    error: 'فشل في إنشاء البطاقات. حاول مرة أخرى.',
  },
  
  // Hindi
  hi: {
    title: 'AI फ्लैशकार्ड',
    placeholder: 'आप क्या विषय पढ़ना चाहते हैं?',
    generate: 'बनाएं',
    generating: 'बना रहे हैं',
    difficulty: 'कठिनाई',
    easy: 'आसान',
    medium: 'मध्यम',
    hard: 'कठिन',
    correct: 'सही',
    incorrect: 'गलत',
    accuracy: 'सटीकता',
    newSet: 'नया सेट',
    error: 'बनाने में विफल। कृपया पुनः प्रयास करें।',
  },
};

/**
 * Get translations for the detected language
 * Falls back to English if language not supported
 */
export function getTranslations(languageCode: string): Translations {
  const lang = languageCode.split('-')[0].toLowerCase();
  return translations[lang] || translations.en;
}

/**
 * Detect browser/OS language
 */
export function detectLanguage(): string {
  if (typeof window !== 'undefined') {
    return navigator.language.split('-')[0].toLowerCase();
  }
  return 'en';
}
