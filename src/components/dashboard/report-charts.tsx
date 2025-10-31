
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
      
      // Group sessions by subject
      const subjectData = sessions.reduce((acc, session) => {
        if (!acc[session.subject]) {
          acc[session.subject] = 0;
        }
        acc[session.subject] += session.duration;
        return acc;
      }, {} as Record<string, number>);

      // Match with activities and their goals
      const processedData: ChartData[] = Object.entries(subjectData).map(([subject, minutes]) => {
        // Find activities with this subject that have goals
        const activitiesForSubject = activities.filter(
          a => a.subject === subject && a.goalType && a.goalType !== 'none'
        );
        
        // Sum up all goal targets for this subject
        const totalGoal = activitiesForSubject.reduce((sum, activity) => {
          return sum + (activity.goalTarget || 0);
        }, 0);

        return {
          subject,
          studiedMinutes: minutes,
          goalMinutes: totalGoal,
          hasGoal: totalGoal > 0
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
                    // The order is: first bar (goalMinutes), second bar (studiedMinutes)
                    const goalMinutes = payload[0]?.value as number || 0;
                    const studiedMinutes = payload[1]?.value as number || 0;
                    const hasGoal = goalMinutes > 0;
                    
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground font-semibold">
                              {label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                            <span className="text-sm">
                              Studied: <span className="font-bold">{formatDuration(studiedMinutes)}</span>
                            </span>
                          </div>
                          {hasGoal && (
                            <>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                                <span className="text-sm">
                                  Goal: <span className="font-bold">{formatDuration(goalMinutes)}</span>
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
              <Legend 
                content={({ payload }) => (
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                      <span className="text-sm text-muted-foreground">Goal Target</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                      <span className="text-sm text-muted-foreground">Time Studied</span>
                    </div>
                  </div>
                )}
              />
              {/* Background bar (Goal) - Wider and semi-transparent, visible in dark mode */}
              <Bar 
                dataKey="goalMinutes" 
                fill="hsl(var(--chart-1))" 
                radius={[8, 8, 8, 8]}
                maxBarSize={70}
                minPointSize={2}
                opacity={0.4}
              />
              {/* Foreground bar (Actual time studied) - Narrower, overlays on top */}
              <Bar 
                dataKey="studiedMinutes" 
                radius={[8, 8, 8, 8]}
                maxBarSize={50}
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
