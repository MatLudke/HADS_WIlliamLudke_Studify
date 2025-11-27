
"use client"

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from "@/components/dashboard/header";
import { ReportCharts } from "@/components/dashboard/report-charts";
import { SessionHistory } from "@/components/dashboard/session-history";
import { GoalProgressCards } from "@/components/dashboard/goal-progress";
import { FlashcardHistory } from "@/components/dashboard/flashcard-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudySessions, exportStudySessionsCSV, exportActivitiesCSV } from '@/lib/firestore';
import { exportStudySessionsToExcel, exportActivitiesToExcel } from '@/lib/excel-export';
import type { StudySession } from '@/lib/types';
import { useAppState } from '@/contexts/AppStateContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { formatStudyTime } from '@/lib/utils';

interface ReportStats {
    sessionsCompleted: number;
    focusMinutes: number;
    efficiency: number;
    totalStreakWeeks: number;
    longestStreak: number;
}

export default function ReportsPage() {
    const { activities, user } = useAppState();
    const [stats, setStats] = useState<ReportStats>({
        sessionsCompleted: 0,
        focusMinutes: 0,
        efficiency: 0,
        totalStreakWeeks: 0,
        longestStreak: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchReportData(user.uid);
        } else {
            setLoading(false);
            setStats({ sessionsCompleted: 0, focusMinutes: 0, efficiency: 0, totalStreakWeeks: 0, longestStreak: 0 });
        }
    }, [user, activities]); // Recalculate when activities change

    const fetchReportData = async (userId: string) => {
        try {
            setLoading(true);
            const sessions: StudySession[] = await getStudySessions(userId);

            const totalSessions = sessions.length;
            const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
            
            let efficiency = 0;
            if (activities.length > 0) {
                const completedActivities = activities.filter(a => a.status === 'done').length;
                efficiency = Math.round((completedActivities / activities.length) * 100);
            }

            // Calculate streaks
            const { calculateAllGoalsProgress } = await import('@/lib/goal-tracking');
            const goalsProgress = calculateAllGoalsProgress(activities, sessions);
            
            const totalStreakWeeks = goalsProgress.reduce((sum, p) => sum + p.streakWeeks, 0);
            const longestStreak = Math.max(0, ...goalsProgress.map(p => p.streakWeeks));

            setStats({
                sessionsCompleted: totalSessions,
                focusMinutes: totalMinutes,
                efficiency: efficiency,
                totalStreakWeeks: totalStreakWeeks,
                longestStreak: longestStreak,
            });

        } catch (error) {
            console.error("Failed to fetch report data:", error);
            setStats({ sessionsCompleted: 0, focusMinutes: 0, efficiency: 0, totalStreakWeeks: 0, longestStreak: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleExportSessions = async () => {
        if (!user) return;
        try {
            const sessions = await getStudySessions(user.uid);
            exportStudySessionsToExcel(sessions);
        } catch (error) {
            console.error('Failed to export sessions:', error);
        }
    };

    const handleExportActivities = async () => {
        if (!user) return;
        try {
            exportActivitiesToExcel(activities);
        } catch (error) {
            console.error('Failed to export activities:', error);
        }
    };

    return (
      <>
        <Header title="Reports" />
        <main className="flex-1 overflow-auto p-6 md:p-8 pt-24 md:pt-32 lg:pt-40">
            <motion.div 
                className="grid gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <motion.div 
                    className="grid gap-6 md:grid-cols-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Sessions Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className="h-10 w-16" />
                                ) : (
                                    <motion.div 
                                        className="text-4xl font-bold"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.5, ease: "backOut" }}
                                    >
                                        {stats.sessionsCompleted}
                                    </motion.div>
                                )}
                                <p className="text-xs text-muted-foreground">Total study sessions logged.</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Focus Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className="h-10 w-24" />
                                ) : (
                                    <motion.div 
                                        className="text-4xl font-bold"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.6, ease: "backOut" }}
                                    >
                                        {formatStudyTime(stats.focusMinutes)}
                                    </motion.div>
                                )}
                                <p className="text-xs text-muted-foreground">Total time spent in focus sessions.</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                    >
                        <Card className="relative overflow-hidden">
                            {/* Duolingo-style gradient background - better dark mode opacity */}
                            {stats.longestStreak > 0 && (
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 dark:from-orange-500/20 dark:via-transparent dark:to-red-500/20" />
                            )}
                            <CardHeader className="relative">
                                <CardTitle className="flex items-center gap-2">
                                    {stats.longestStreak > 0 ? '🔥' : '📊'}
                                    {stats.longestStreak > 0 ? 'Streak Power' : 'Weekly Goals'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative">
                                {loading ? (
                                    <Skeleton className="h-10 w-20" />
                                ) : stats.longestStreak > 0 ? (
                                    <div className="space-y-3">
                                        <motion.div 
                                            className="text-4xl font-bold flex items-center gap-2"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.7, ease: "backOut" }}
                                        >
                                            <span className="text-orange-700 dark:text-orange-300">
                                                {stats.longestStreak}
                                            </span>
                                            <span className="text-2xl">🔥</span>
                                        </motion.div>
                                        <p className="text-xs text-muted-foreground">week streak (longest)</p>
                                        {stats.totalStreakWeeks > stats.longestStreak && (
                                            <div className="pt-2 border-t">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Total: {stats.totalStreakWeeks} weeks across all goals
                                                </p>
                                            </div>
                                        )}
                                        <div className="pt-2 flex gap-1">
                                            {[...Array(Math.min(stats.longestStreak, 7))].map((_, i) => (
                                                <motion.span
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.8 + (i * 0.1), duration: 0.3 }}
                                                    className="text-lg"
                                                >
                                                    🔥
                                                </motion.span>
                                            ))}
                                            {stats.longestStreak > 7 && (
                                                <span className="text-sm font-bold text-orange-700 dark:text-orange-300 self-end">
                                                    +{stats.longestStreak - 7}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <motion.div 
                                            className="text-4xl font-bold text-muted-foreground"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: 0.7, ease: "backOut" }}
                                        >
                                            0
                                        </motion.div>
                                        <p className="text-xs text-muted-foreground">Complete weekly goals to start a streak!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
                    className="flex gap-4 justify-center"
                >
                    <Button onClick={handleExportSessions} disabled={!user} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Sessions
                    </Button>
                    <Button onClick={handleExportActivities} disabled={!user} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Activities  
                    </Button>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
                >
                    <GoalProgressCards />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
                >
                    <ReportCharts />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
                >
                    <SessionHistory user={user} />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
                >
                    <FlashcardHistory userId={user?.uid || null} />
                </motion.div>
            </motion.div>
        </main>
      </>
    );
}