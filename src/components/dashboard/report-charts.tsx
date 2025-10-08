
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import type { StudySession } from "@/lib/types"
import { useAppState } from "@/contexts/AppStateContext"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDuration } from "@/lib/utils"

export function ReportCharts() {
  const { user } = useAppState();
  const [reportData, setReportData] = React.useState<{ subject: string, minutes: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      fetchReportData(user.uid);
    } else {
      setLoading(false);
      setReportData([]);
    }
  }, [user]);

  const fetchReportData = async (userId: string) => {
    try {
      setLoading(true);
      const sessions: StudySession[] = await getStudySessions(userId);
      const processedData = sessions.reduce((acc, session) => {
        const existing = acc.find(item => item.subject === session.subject);
        if (existing) {
          existing.minutes += session.duration;
        } else {
          acc.push({ subject: session.subject, minutes: session.duration });
        }
        return acc;
      }, [] as { subject: string, minutes: number }[]);
      
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
        <CardDescription>Time dedicated to each subject.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-full rounded-xl" />
              <div className="flex justify-around">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-10" />)}
              </div>
            </div>
        ) : reportData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px]">
            <p className="text-muted-foreground">No study sessions recorded yet.</p>
          </div>
        ) : (
          <ChartContainer config={{}} className="min-h-[250px] w-full">
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
                  // Calculate a reasonable upper bound based on the data
                  const maxValue = Math.max(...reportData.map(d => d.minutes));
                  if (maxValue <= 5) return 5; // For very small values (≤5 min), cap at 5 min
                  if (maxValue <= 30) return Math.ceil(maxValue / 5) * 5; // Round up to nearest 5 min
                  if (maxValue <= 120) return Math.ceil(maxValue / 15) * 15; // Round up to nearest 15 min
                  return Math.ceil(maxValue / 30) * 30; // Round up to nearest 30 min for larger values
                }]}
                tickCount={6}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const minutes = payload[0].value as number;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {label}
                            </span>
                            <span className="font-bold">
                              {formatDuration(minutes)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="minutes" 
                fill="hsl(var(--primary))" 
                radius={4}
                minPointSize={2}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
