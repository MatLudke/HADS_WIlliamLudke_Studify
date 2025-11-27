"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard, type FlashcardQuestion } from "./flashcard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, RefreshCw, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { addFlashcardSession } from "@/lib/firestore";
import { useAppState } from "@/contexts/AppStateContext";
import { getTranslations } from "@/lib/translations";
import { useToast } from "@/hooks/use-toast";

export function FlashcardGenerator() {
  const { user } = useAppState();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState(2); // 1=Easy, 2=Medium, 3=Hard
  const [flashcards, setFlashcards] = useState<FlashcardQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [sessionSaved, setSessionSaved] = useState(false);
  const [userLanguage, setUserLanguage] = useState('en');
  const [t, setT] = useState(getTranslations('en'));

  // Detect and persist user's language preference
  useEffect(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('userLanguage');
    const supportedLanguages = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'zh', 'ko', 'ru', 'ar', 'hi'];
    
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      setUserLanguage(savedLanguage);
      setT(getTranslations(savedLanguage));
    } else {
      // Fall back to browser detection
      const detectedLanguage = navigator.language.split('-')[0];
      setUserLanguage(detectedLanguage);
      setT(getTranslations(detectedLanguage));
      localStorage.setItem('userLanguage', detectedLanguage);
    }
  }, []);

  const difficultyLabels = [t.easy, t.medium, t.hard];
  const difficultyColors = [
    "text-green-600 dark:text-green-400",
    "text-yellow-600 dark:text-yellow-400", 
    "text-red-600 dark:text-red-400"
  ];

  const handleGenerate = async () => {
    if (!subject.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, count: 4, difficulty, language: userLanguage }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const data = await response.json();
      setFlashcards(data.flashcards);
      setStats({ correct: 0, incorrect: 0 });
    } catch (err) {
      setError(t.error);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  // Save session when all flashcards are answered
  useEffect(() => {
    const totalAnswered = stats.correct + stats.incorrect;
    const allAnswered = totalAnswered === flashcards.length && flashcards.length > 0;
    
    if (allAnswered && !sessionSaved && user) {
      const saveSession = async () => {
        try {
          await addFlashcardSession(user.uid, {
            subject,
            difficulty,
            totalCards: flashcards.length,
            correctAnswers: stats.correct,
            incorrectAnswers: stats.incorrect,
          });
          setSessionSaved(true);
          // Notify user of success
          toast({
            title: "Session Saved!",
            description: `Your ${subject} flashcard progress has been recorded.`,
          });
        } catch (error) {
          console.error('Failed to save flashcard session:', error);
          // Notify user of failure
          toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Your session couldn't be saved. Please check your connection.",
          });
        }
      };
      saveSession();
    }
  }, [stats, flashcards.length, sessionSaved, user, subject, difficulty, toast]);

  const handleReset = () => {
    setFlashcards([]);
    setSubject("");
    setStats({ correct: 0, incorrect: 0 });
    setError(null);
    setSessionSaved(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{t.title}</h2>
      </div>

      {/* Input Section */}
      {flashcards.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex gap-2">
            <Input
              placeholder={t.placeholder}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !subject.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.generating}...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t.generate}
                </>
              )}
            </Button>
          </div>

          {/* Difficulty Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t.difficulty}</label>
              <span className={cn("text-sm font-semibold", difficultyColors[difficulty - 1])}>
                {difficultyLabels[difficulty - 1]}
              </span>
            </div>
            <Slider
              value={[difficulty]}
              onValueChange={(value) => setDifficulty(value[0])}
              min={1}
              max={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.easy}</span>
              <span>{t.medium}</span>
              <span>{t.hard}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </motion.div>
      )}

      {/* Flashcards Grid */}
      {flashcards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Modern Scoreboard */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              {/* Correct Score */}
              <motion.div
                key={`correct-${stats.correct}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="flex items-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium opacity-90">{t.correct}</span>
                  <span className="text-2xl font-bold tabular-nums">{stats.correct}</span>
                </div>
              </motion.div>

              {/* Incorrect Score */}
              <motion.div
                key={`incorrect-${stats.incorrect}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="flex items-center gap-2 bg-gradient-to-br from-red-500 to-rose-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Target className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium opacity-90">{t.incorrect}</span>
                  <span className="text-2xl font-bold tabular-nums">{stats.incorrect}</span>
                </div>
              </motion.div>

              {/* Accuracy Percentage */}
              {(stats.correct + stats.incorrect) > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  className="flex items-center gap-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 cursor-default"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium opacity-90">{t.accuracy}</span>
                    <span className="text-2xl font-bold tabular-nums">
                      {Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)}%
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <Button 
              variant="outline" 
              size="lg"
              onClick={handleReset}
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-150 hover:scale-105 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              {t.newSet}
            </Button>
          </div>

          {/* Flashcards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 place-items-center"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            <AnimatePresence>
              {flashcards.map((card, index) => (
                <motion.div
                  key={card.id}
                  variants={{
                    hidden: { opacity: 0, y: 50, scale: 0.8 },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        duration: 0.3,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                >
                  <Flashcard 
                    question={card} 
                    onAnswer={handleAnswer}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
