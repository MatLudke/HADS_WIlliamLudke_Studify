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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function GoalProgressCards() {
  const { activities, studySessions } = useAppState();

  const goalsProgress = useMemo(() => {
    return calculateAllGoalsProgress(activities, studySessions);
  }, [activities, studySessions]);

  const summary = useMemo(() => {
    return getGoalsSummary(goalsProgress);
  }, [goalsProgress]);

  // Separate goals into behind and others
  const behindGoals = useMemo(() => {
    return goalsProgress.filter(p => p.isBehind);
  }, [goalsProgress]);

  const otherGoals = useMemo(() => {
    return goalsProgress.filter(p => !p.isBehind);
  }, [goalsProgress]);

  if (goalsProgress.length === 0) {
    return null;
  }

  const getGoalIcon = () => {
    return '📆'; // Weekly calendar
  };
  
  const getStreakIcon = (weeks: number) => {
    if (weeks === 0) return '';
    if (weeks >= 4) return '🔥🔥🔥'; // 4+ weeks = legendary
    if (weeks >= 2) return '🔥🔥'; // 2-3 weeks = hot
    return '🔥'; // 1 week = starting
  };

  const getStatusBadge = (progress: GoalProgress) => {
    if (progress.progressPercentage >= 100) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (progress.isOnTrack) {
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
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
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.onTrack}</div>
                <div className="text-xs text-muted-foreground">On Track</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.behind}</div>
                <div className="text-xs text-muted-foreground">Behind</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Behind Goals - Carousel */}
      {behindGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Behind Schedule
              </CardTitle>
              <CardDescription>
                {behindGoals.length} goal{behindGoals.length > 1 ? 's' : ''} need{behindGoals.length === 1 ? 's' : ''} your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Carousel className="w-full">
                <CarouselContent>
                  {behindGoals.map((progress) => (
                    <CarouselItem key={progress.activityId} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <Card className="border-destructive/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <span>{getGoalIcon()}</span>
                                  {progress.activityTitle}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  Weekly Goal
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
                                  {progress.currentProgress} / {progress.goalTarget} session{progress.goalTarget > 1 ? 's' : ''}
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(progress.progressPercentage, 100)} 
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{progress.progressPercentage}%</span>
                                {progress.sessionsRemaining > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {progress.sessionsRemaining} session{progress.sessionsRemaining > 1 ? 's' : ''} to go
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Streak Display */}
                            {progress.streakWeeks > 0 && (
                              <div className="flex items-center justify-center gap-2 p-2 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 dark:border-orange-500/40 rounded-md">
                                <span className="text-lg">{getStreakIcon(progress.streakWeeks)}</span>
                                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                  {progress.streakWeeks} week streak!
                                </span>
                              </div>
                            )}

                            {/* Period Info */}
                            <div className="pt-2 border-t text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Ends</span>
                                <span>{progress.periodEnd.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Other Goals - Grid */}
      {otherGoals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {otherGoals.map((progress, index) => (
            <motion.div
              key={progress.activityId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (behindGoals.length > 0 ? 0.3 : 0.2) + index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{getGoalIcon()}</span>
                        {progress.activityTitle}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Weekly Goal
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
                        {progress.currentProgress} / {progress.goalTarget} session{progress.goalTarget > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(progress.progressPercentage, 100)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.progressPercentage}%</span>
                      {progress.sessionsRemaining > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {progress.sessionsRemaining} session{progress.sessionsRemaining > 1 ? 's' : ''} to go
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Streak Display */}
                  {progress.streakWeeks > 0 && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 dark:border-orange-500/40 rounded-md">
                      <span className="text-lg">{getStreakIcon(progress.streakWeeks)}</span>
                      <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                        {progress.streakWeeks} week streak!
                      </span>
                    </div>
                  )}

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
      )}
    </div>
  );
}
