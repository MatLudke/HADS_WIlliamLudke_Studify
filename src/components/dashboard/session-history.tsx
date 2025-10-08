"use client"

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Filter, Search } from 'lucide-react';
import { getStudySessions } from '@/lib/firestore';
import type { StudySession } from '@/lib/types';
import { useAppState } from '@/contexts/AppStateContext';
import { formatDuration as utilsFormatDuration } from '@/lib/utils';

interface SessionHistoryProps {
  user?: any; // Keep for compatibility but we'll use the context user
}

export function SessionHistory({ user: propUser }: SessionHistoryProps) {
  const { activities, user } = useAppState();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pomodoro' | 'shortBreak' | 'longBreak'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setSessions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userSessions = await getStudySessions(user.uid);
        setSessions(userSessions);
      } catch (error) {
        console.error('Error fetching session data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getActivityTitle = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    return activity?.title || 'Unknown Activity';
  };

  const filteredAndSortedSessions = React.useMemo(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getActivityTitle(session.activityId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.notes && session.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply mode filter
    if (filterMode !== 'all') {
      filtered = filtered.filter(session => session.mode === filterMode);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
        case 'oldest':
          return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        case 'longest':
          return b.duration - a.duration;
        case 'shortest':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sessions, activities, searchTerm, filterMode, sortOrder]);

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'pomodoro':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
      case 'shortBreak':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
      case 'longBreak':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    return utilsFormatDuration(minutes);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Sign in to view your session history
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMode} onValueChange={(value: any) => setFilterMode(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="pomodoro">Focus Only</SelectItem>
                <SelectItem value="shortBreak">Short Breaks</SelectItem>
                <SelectItem value="longBreak">Long Breaks</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="longest">Longest First</SelectItem>
                <SelectItem value="shortest">Shortest First</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Sessions List */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : filteredAndSortedSessions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  {sessions.length === 0 ? 'No study sessions yet' : 'No sessions match your filters'}
                </motion.div>
              ) : (
                filteredAndSortedSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      ease: "easeOut" 
                    }}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getModeColor(session.mode)}>
                          {session.mode === 'pomodoro' ? 'Focus' : 
                           session.mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.startAt)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(session.startAt)} - {formatTime(session.endAt)}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatDuration(session.duration)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {getActivityTitle(session.activityId)}
                      </div>
                      <div className="text-sm text-muted-foreground">{session.subject}</div>
                      {session.notes && (
                        <div className="text-sm text-muted-foreground italic">
                          "{session.notes}"
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Summary Statistics */}
          {!loading && filteredAndSortedSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-6 pt-6 border-t"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredAndSortedSessions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {formatDuration(filteredAndSortedSessions.reduce((sum, s) => sum + s.duration, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {formatDuration(Math.round(filteredAndSortedSessions.reduce((sum, s) => sum + s.duration, 0) / filteredAndSortedSessions.length))}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Duration</div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}