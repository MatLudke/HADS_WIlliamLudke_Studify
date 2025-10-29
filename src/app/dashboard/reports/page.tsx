
"use client"

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from "@/components/dashboard/header";
import { ReportCharts } from "@/components/dashboard/report-charts";
import { SessionHistory } from "@/components/dashboard/session-history";
import { GoalProgressCards } from "@/components/dashboard/goal-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudySessions, exportStudySessionsCSV, exportActivitiesCSV } from '@/lib/firestore';
import type { StudySession } from '@/lib/types';
import { useAppState } from '@/contexts/AppStateContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { formatStudyTime } from '@/lib/utils';

interface ReportStats {
    sessionsCompleted: number;
    focusMinutes: number; // Changed from focusHours to focusMinutes
    efficiency: number;
}

export default function ReportsPage() {
    const { activities, user } = useAppState();
    const [stats, setStats] = useState<ReportStats>({
        sessionsCompleted: 0,
        focusMinutes: 0,
        efficiency: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchReportData(user.uid);
        } else {
            setLoading(false);
            setStats({ sessionsCompleted: 0, focusMinutes: 0, efficiency: 0 });
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

            setStats({
                sessionsCompleted: totalSessions,
                focusMinutes: totalMinutes,
                efficiency: efficiency,
            });

        } catch (error) {
            console.error("Failed to fetch report data:", error);
            setStats({ sessionsCompleted: 0, focusMinutes: 0, efficiency: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleExportSessions = async () => {
        if (!user) return;
        try {
            const csvContent = await exportStudySessionsCSV(user.uid);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `study-sessions-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export sessions:', error);
        }
    };

    const handleExportActivities = async () => {
        if (!user) return;
        try {
            const csvContent = await exportActivitiesCSV(user.uid);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Efficiency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className="h-10 w-20" />
                                ) : (
                                    <motion.div 
                                        className="text-4xl font-bold"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.7, ease: "backOut" }}
                                    >
                                        {stats.efficiency}%
                                    </motion.div>
                                )}
                                <p className="text-xs text-muted-foreground">Percentage of completed activities.</p>
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
            </motion.div>
        </main>
      </>
    );
}