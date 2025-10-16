'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

type GoalItem = {
  id: string;
  title: string;
  targetMinutes: number;
  startAt: string;
  endAt: string;
  reminderEnabled?: boolean;
};

export default function GoalsManager() {
  const [title, setTitle] = React.useState('');
  const [hours, setHours] = React.useState(4);
  const [start, setStart] = React.useState(() => new Date().toISOString().slice(0,10));
  const [end, setEnd] = React.useState(() => new Date(Date.now()+7*24*60*60*1000).toISOString().slice(0,10));
  const [loading, setLoading] = React.useState(false);
  const [goals, setGoals] = React.useState<GoalItem[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const res = await fetch(`/api/goals?uid=${user.uid}`);
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate() {
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in' });
      return;
    }
    setLoading(true);
    try {
      const body = {
        userId: user.uid,
        title: title || 'Weekly Study Goal',
        targetMinutes: hours * 60,
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
      };
      const res = await fetch('/api/goals', { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (data.id) {
        toast({ title: 'Goal created' });
        setTitle('');
        fetchGoals();
      } else {
        toast({ variant: 'destructive', title: 'Failed to create goal' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly goal title" />
        </div>
        <div>
          <Label>Hours</Label>
          <Input type="number" value={hours} onChange={(e:any) => setHours(parseInt(e.target.value || '0'))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={start} onChange={(e:any) => setStart(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={end} onChange={(e:any) => setEnd(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={loading}>{loading ? 'Creating...' : 'Create Goal'}</Button>
        <Button variant="ghost" onClick={fetchGoals}>Refresh</Button>
      </div>

      <div className="space-y-2">
        {goals.length === 0 ? (
          <div className="text-sm text-muted-foreground">No goals yet.</div>
        ) : (
          goals.map(g => (
            <div key={g.id} className="p-3 border rounded"> 
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-muted-foreground">{g.startAt} → {g.endAt}</div>
                </div>
                <div className="text-sm">{Math.round(g.targetMinutes/60)}h</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
