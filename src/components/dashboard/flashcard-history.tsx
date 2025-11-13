"use client"

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getFlashcardSessions } from '@/lib/firestore';
import type { FlashcardSession } from '@/lib/types';
import { Brain, Trophy, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface FlashcardHistoryProps {
  userId: string | null;
}

export function FlashcardHistory({ userId }: FlashcardHistoryProps) {
  const [sessions, setSessions] = useState<FlashcardSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchSessions(userId);
    } else {
      setLoading(false);
      setSessions([]);
    }
  }, [userId]);

  const fetchSessions = async (uid: string) => {
    try {
      setLoading(true);
      const data = await getFlashcardSessions(uid);
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch flashcard sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 2: return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 3: return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const calculateAccuracy = (session: FlashcardSession) => {
    if (session.totalCards === 0) return 0;
    return Math.round((session.correctAnswers / session.totalCards) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Flashcard History
          </CardTitle>
          <CardDescription>Track your flashcard study sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Flashcard History
          </CardTitle>
          <CardDescription>Track your flashcard study sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please log in to view your flashcard history.</p>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Flashcard History
          </CardTitle>
          <CardDescription>Track your flashcard study sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">No flashcard sessions yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Start studying with AI flashcards to see your history here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Flashcard History
        </CardTitle>
        <CardDescription>
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const accuracy = calculateAccuracy(session);
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{session.subject}</h4>
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(session.difficulty)}
                    >
                      {getDifficultyLabel(session.difficulty)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {session.totalCards} cards
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {session.correctAnswers} correct
                    </span>
                    <span>
                      {format(session.createdAt, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`text-2xl font-bold ${getAccuracyColor(accuracy)}`}>
                    {accuracy}%
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Accuracy
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
