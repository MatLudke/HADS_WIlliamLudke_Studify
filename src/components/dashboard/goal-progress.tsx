/**
 * Goal Progress Cards Component
 * Shows progress towards daily/weekly/monthly goals
 */

"use client"

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/contexts/AppStateContext';
import { calculateAllGoalsProgress, getGoalsSummary, type GoalProgress } from '@/lib/goal-tracking';
import { Target, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export function GoalProgressCards() {
  const { activities, studySessions } = useAppState();

  const goalsProgress = useMemo(() => {
    return calculateAllGoalsProgress(activities, studySessions);
  }, [activities, studySessions]);

  const summary = useMemo(() => {
    return getGoalsSummary(goalsProgress);
  }, [goalsProgress]);

  if (goalsProgress.length === 0) {
    return null;
  }

  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'monthly':
        return '🗓️';
      default:
        return '🎯';
    }
  };

  const getStatusBadge = (progress: GoalProgress) => {
    if (progress.progressPercentage >= 100) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (progress.isOnTrack) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          On Track
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="w-3 h-3 mr-1" />
        Behind
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Goal Summary
            </CardTitle>
            <CardDescription>
              Overview of your active study goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.total}</div>
                <div className="text-xs text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{summary.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{summary.onTrack}</div>
                <div className="text-xs text-muted-foreground">On Track</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-destructive">{summary.behind}</div>
                <div className="text-xs text-muted-foreground">Behind</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Individual Goal Progress Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {goalsProgress.map((progress, index) => (
          <motion.div
            key={progress.activityId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={progress.isBehind ? 'border-destructive/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>{getGoalIcon(progress.goalType)}</span>
                      {progress.activityTitle}
                    </CardTitle>
                    <CardDescription className="capitalize mt-1">
                      {progress.goalType} Goal
                    </CardDescription>
                  </div>
                  {getStatusBadge(progress)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {progress.currentProgress} / {progress.goalTarget} min
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(progress.progressPercentage, 100)} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.progressPercentage}%</span>
                    {progress.timeRemaining > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeRemaining(progress.timeRemaining)} to go
                      </span>
                    )}
                  </div>
                </div>

                {/* Period Info */}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Started</span>
                    <span>{progress.periodStart.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Ends</span>
                    <span>{progress.periodEnd.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
