
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { getStudySessions } from "@/lib/firestore"
import type { StudySession, Activity } from "@/lib/types"
import { useAppState } from "@/contexts/AppStateContext"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDuration } from "@/lib/utils"

interface ChartData {
  subject: string;
  studiedMinutes: number;
  goalMinutes: number;
  hasGoal: boolean;
}

export function ReportCharts() {
  const { user, activities } = useAppState();
  const [reportData, setReportData] = React.useState<ChartData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      fetchReportData(user.uid);
    } else {
      setLoading(false);
      setReportData([]);
    }
  }, [user, activities]);

  const fetchReportData = async (userId: string) => {
    try {
      setLoading(true);
      const sessions: StudySession[] = await getStudySessions(userId);
      
      // Get current activity IDs to filter out deleted activities
      const activeActivityIds = new Set(activities.map(a => a.id));
      
      // Filter sessions to only include existing activities
      const validSessions = sessions.filter(session => 
        activeActivityIds.has(session.activityId)
      );
      
      // Group sessions by activity ID first, then aggregate by subject
      const activityData: Record<string, { minutes: number; activity: Activity }> = {};
      
      validSessions.forEach(session => {
        const activity = activities.find(a => a.id === session.activityId);
        if (!activity) return;
        
        if (!activityData[activity.id]) {
          activityData[activity.id] = { minutes: 0, activity };
        }
        activityData[activity.id].minutes += session.duration;
      });
      
      // Aggregate by subject
      const subjectData: Record<string, { studiedMinutes: number; goalSessions: number }> = {};
      
      Object.values(activityData).forEach(({ minutes, activity }) => {
        if (!subjectData[activity.subject]) {
          subjectData[activity.subject] = { studiedMinutes: 0, goalSessions: 0 };
        }
        subjectData[activity.subject].studiedMinutes += minutes;
        
        // Add goal sessions (now it's sessions per week, not minutes)
        if (activity.goalType === 'weekly' && activity.goalTarget) {
          subjectData[activity.subject].goalSessions += activity.goalTarget;
        }
      });

      // Convert to chart data
      const processedData: ChartData[] = Object.entries(subjectData).map(([subject, data]) => {
        return {
          subject,
          studiedMinutes: data.studiedMinutes,
          goalMinutes: data.goalSessions * 25, // Convert sessions to approximate minutes (25 min/session)
          hasGoal: data.goalSessions > 0
        };
      });
      
      setReportData(processedData);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Time by Subject</CardTitle>
        <CardDescription>Compare your study time with your goals.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex flex-col space-y-3">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <div className="flex justify-around">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-10" />)}
              </div>
            </div>
        ) : reportData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No study sessions recorded yet.</p>
          </div>
        ) : (
          <ChartContainer 
            config={{
              studiedMinutes: {
                label: "Time Studied",
                color: "hsl(var(--primary))",
              },
              goalMinutes: {
                label: "Goal Target",
                color: "hsl(var(--chart-1))",
              },
            }} 
            className="min-h-[300px] w-full"
          >
            <BarChart 
              accessibilityLayer 
              data={reportData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="subject"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(value) => formatDuration(value)}
                domain={[0, (dataMax: number) => {
                  const maxValue = Math.max(...reportData.map(d => Math.max(d.studiedMinutes, d.goalMinutes)));
                  if (maxValue <= 5) return 5;
                  if (maxValue <= 30) return Math.ceil(maxValue / 5) * 5;
                  if (maxValue <= 120) return Math.ceil(maxValue / 15) * 15;
                  return Math.ceil(maxValue / 30) * 30;
                }]}
                tickCount={6}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = reportData.find(d => d.subject === label);
                    if (!data) return null;
                    
                    const studiedMinutes = data.studiedMinutes;
                    const goalMinutes = data.goalMinutes;
                    const hasGoal = data.hasGoal;
                    
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground font-semibold">
                              {label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ 
                              backgroundColor: hasGoal && studiedMinutes >= goalMinutes 
                                ? 'hsl(var(--success))' 
                                : 'hsl(var(--primary))' 
                            }} />
                            <span className="text-sm">
                              Studied: <span className="font-bold">{formatDuration(studiedMinutes)}</span>
                            </span>
                          </div>
                          {hasGoal && (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
                                <span className="text-sm text-muted-foreground">
                                  Goal: {formatDuration(goalMinutes)}
                                </span>
                              </div>
                              <div className="pt-1 border-t">
                                <span className="text-xs text-muted-foreground">
                                  {studiedMinutes >= goalMinutes 
                                    ? `🎉 Goal achieved! +${formatDuration(studiedMinutes - goalMinutes)}`
                                    : `📊 ${formatDuration(goalMinutes - studiedMinutes)} remaining`
                                  }
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Single bar showing actual time studied */}
              <Bar 
                dataKey="studiedMinutes" 
                radius={[8, 8, 8, 8]}
                maxBarSize={60}
                minPointSize={2}
              >
                {reportData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.hasGoal && entry.studiedMinutes >= entry.goalMinutes 
                      ? "hsl(var(--success))" 
                      : "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
