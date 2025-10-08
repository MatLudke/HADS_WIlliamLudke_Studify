'use client';

import * as React from 'react';
import { Play, Pause, Square, Settings, Clock, Target, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Activity, TimerSettings, ActiveSession } from '@/lib/types';
import { addStudySession, startActiveSession, updateActiveSession, completeActiveSession, getActiveSession } from '@/lib/firestore';
import { useAppState } from '@/contexts/AppStateContext';
import { notificationService } from '@/lib/notifications';
import { TimerSettingsDialog } from './timer-settings';

const DEFAULT_SETTINGS: TimerSettings = {
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  playSound: true,
};

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
type TimerState = 'idle' | 'running' | 'paused';

export function StudyTimerV2() {
  const [settings, setSettings] = React.useState<TimerSettings>(DEFAULT_SETTINGS);
  const [timeLeft, setTimeLeft] = React.useState(DEFAULT_SETTINGS.pomodoroMinutes * 60);
  const [timerState, setTimerState] = React.useState<TimerState>('idle');
  const [mode, setMode] = React.useState<TimerMode>('pomodoro');
  const [completedPomodoros, setCompletedPomodoros] = React.useState(0);
  const [sessionStartTime, setSessionStartTime] = React.useState<Date | null>(null);
  
  const { toast } = useToast();
  const { activities, user } = useAppState();
  const [selectedActivityId, setSelectedActivityId] = React.useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

  // Initialize settings and check for active session
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        setTimeLeft(parsedSettings.pomodoroMinutes * 60);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Check for existing active session when user is available
  React.useEffect(() => {
    if (user) {
      const checkActiveSession = async () => {
        try {
          const activeSession = await getActiveSession(user.uid);
          if (activeSession) {
            // Validate that the activity still exists
            const activityExists = activities.some(a => a.id === activeSession.activityId);
            
            if (!activityExists) {
              // Activity was deleted, complete the session
              await completeActiveSession(activeSession.id, user.uid, {
                activityId: activeSession.activityId,
                startAt: activeSession.startedAt,
                endAt: new Date(),
                duration: Math.floor((Date.now() - activeSession.startedAt.getTime()) / 1000 / 60),
                mode: activeSession.mode as TimerMode,
                notes: 'Activity deleted during session',
                subject: 'Deleted Activity'
              });
              
              toast({
                title: "Session Ended",
                description: "The activity for this session no longer exists.",
                variant: "destructive"
              });
              
              setTimerState('idle');
              setMode('pomodoro');
              setTimeLeft(settings.pomodoroMinutes * 60);
              setSelectedActivityId(null);
              setActiveSessionId(null);
              setSessionStartTime(null);
              return;
            }
            
            setActiveSessionId(activeSession.id);
            setSelectedActivityId(activeSession.activityId);
            setMode(activeSession.mode as TimerMode);
            
            const now = Date.now();
            const lastUpdate = activeSession.lastUpdated?.getTime() || now;
            const timeSinceUpdate = Math.floor((now - lastUpdate) / 1000);
            const newTimeLeft = Math.max(0, activeSession.currentTime - timeSinceUpdate);
            
            setTimeLeft(newTimeLeft);
            if (newTimeLeft > 0) {
              setTimerState('running');
              setSessionStartTime(activeSession.startedAt);
            }
          }
        } catch (error) {
          console.error('Error loading active session:', error);
        }
      };
      
      checkActiveSession();
    }
  }, [user, activities, settings.pomodoroMinutes, toast]);

  // Timer countdown
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerState === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, timeLeft]);

  // Separate effect for updating active session
  React.useEffect(() => {
    if (timerState === 'running' && activeSessionId && timeLeft % 10 === 0 && timeLeft > 0) {
      updateActiveSession(activeSessionId, {
        currentTime: timeLeft,
        duration: getTimerDuration(mode, settings),
        mode: mode
      }).catch(console.error);
    }
  }, [timeLeft, timerState, activeSessionId, mode, settings]);

  // Watch for activity deletion during active session
  React.useEffect(() => {
    if (selectedActivityId && timerState === 'running' && mode === 'pomodoro') {
      const activityExists = activities.some(a => a.id === selectedActivityId);
      if (!activityExists) {
        // Activity was deleted while timer was running
        toast({
          title: "Activity Deleted",
          description: "The activity you were working on was deleted. Timer stopped.",
          variant: "destructive"
        });
        handleStop();
      }
    }
  }, [activities, selectedActivityId, timerState, mode]);

  // Handle timer completion
  React.useEffect(() => {
    if (timeLeft === 0 && timerState === 'running') {
      handleTimerComplete();
    }
  }, [timeLeft, timerState]);

  const getTimerDuration = (timerMode: TimerMode, timerSettings: TimerSettings): number => {
    switch (timerMode) {
      case 'pomodoro': return timerSettings.pomodoroMinutes * 60;
      case 'shortBreak': return timerSettings.shortBreakMinutes * 60;
      case 'longBreak': return timerSettings.longBreakMinutes * 60;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    const totalTime = getTimerDuration(mode, settings);
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const playNotificationSound = () => {
    if (settings.playSound) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  };

  const handleTimerComplete = async () => {
    playNotificationSound();
    setTimerState('idle');

    if (mode === 'pomodoro') {
      setCompletedPomodoros(prev => prev + 1);
      
      // Save study session
      if (user && selectedActivityId && sessionStartTime) {
        const activity = activities.find(a => a.id === selectedActivityId);
        const actualDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60);
        
        await addStudySession(user.uid, {
          activityId: selectedActivityId,
          startAt: sessionStartTime,
          endAt: new Date(),
          duration: actualDuration,
          mode: 'pomodoro',
          notes: '',
          subject: activity?.subject || 'Unknown'
        });

        // Show completion notification
        if (activity) {
          await notificationService.showTimerCompleteNotification(activity, actualDuration);
        }
      }

      // Complete active session
      if (activeSessionId && user && sessionStartTime) {
        await completeActiveSession(activeSessionId, user.uid, {
          activityId: selectedActivityId || '',
          startAt: sessionStartTime,
          endAt: new Date(),
          duration: Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60),
          mode: 'pomodoro',
          notes: '',
          subject: activities.find(a => a.id === selectedActivityId)?.subject || 'Unknown'
        });
        setActiveSessionId(null);
      }

      toast({
        title: "Pomodoro Complete! 🍅",
        description: "Great work! Ready for the next session?",
      });

      // Reset to pomodoro mode - DON'T auto-start breaks
      setMode('pomodoro');
      setTimeLeft(getTimerDuration('pomodoro', settings));
      setSessionStartTime(null);
    } else {
      // Break completed - back to pomodoro
      toast({
        title: "Break Complete! ☕",
        description: "Time to focus again!",
      });

      // Show break completion notification
      await notificationService.showBreakNotification(
        mode === 'shortBreak' ? 'short' : 'long',
        getTimerDuration(mode, settings) / 60
      );

      setMode('pomodoro');
      setTimeLeft(getTimerDuration('pomodoro', settings));
      setSessionStartTime(null);
    }
  };

  const handleStart = async () => {
    if (!selectedActivityId && mode === 'pomodoro') {
      toast({
        title: "Select an Activity",
        description: "Please select what you'll be working on.",
        variant: "destructive"
      });
      return;
    }

    // Validate that the selected activity still exists
    if (selectedActivityId && mode === 'pomodoro') {
      const activityExists = activities.some(a => a.id === selectedActivityId);
      if (!activityExists) {
        toast({
          title: "Activity Not Found",
          description: "The selected activity no longer exists. Please choose another one.",
          variant: "destructive"
        });
        setSelectedActivityId(null);
        return;
      }
    }

    if (timerState === 'idle' && mode === 'pomodoro' && user) {
      try {
        const sessionId = await startActiveSession(user.uid, selectedActivityId || '', mode);
        setActiveSessionId(sessionId);
        setSessionStartTime(new Date());
      } catch (error) {
        console.error('Error starting session:', error);
      }
    }

    if (timerState === 'idle') {
      setSessionStartTime(new Date());
    }

    setTimerState('running');
    
    toast({
      title: `${mode === 'pomodoro' ? 'Focus' : 'Break'} Started`,
      description: `${formatTime(timeLeft)} of ${mode === 'pomodoro' ? 'focused work' : 'break time'}`,
    });
  };

  const handlePause = () => {
    setTimerState('paused');
  };

  const handleStop = async () => {
    // Clean up active session if it exists
    if (activeSessionId && user && sessionStartTime && mode === 'pomodoro') {
      const activity = activities.find(a => a.id === selectedActivityId);
      const actualDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60);
      
      if (actualDuration > 0) {
        await completeActiveSession(activeSessionId, user.uid, {
          activityId: selectedActivityId || '',
          startAt: sessionStartTime,
          endAt: new Date(),
          duration: actualDuration,
          mode: 'pomodoro',
          notes: '',
          subject: activity?.subject || 'Unknown'
        });
      }
      setActiveSessionId(null);
    }

    setTimerState('idle');
    setTimeLeft(getTimerDuration(mode, settings));
    setSessionStartTime(null);
  };

  const handleReset = () => {
    setTimerState('idle');
    setTimeLeft(getTimerDuration(mode, settings));
    setSessionStartTime(null);
  };

  const startBreak = (breakType: 'shortBreak' | 'longBreak') => {
    setMode(breakType);
    setTimeLeft(getTimerDuration(breakType, settings));
    setTimerState('idle');
    setSessionStartTime(null);
  };

  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    
    if (timerState === 'idle') {
      setTimeLeft(getTimerDuration(mode, newSettings));
    }
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge 
              variant={mode === 'pomodoro' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {mode === 'pomodoro' ? 'Focus Time' : 
               mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </Badge>
            <TimerSettingsDialog
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">
            Studify
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Activity Selection - Only for pomodoro */}
          {mode === 'pomodoro' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                What will you work on?
              </label>
              <Select value={selectedActivityId || ''} onValueChange={setSelectedActivityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an activity..." />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.priority === 'high' ? 'bg-red-500' :
                          activity.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <span className="truncate">{activity.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <motion.div
              className="text-5xl font-bold font-mono text-foreground"
              key={timeLeft}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatTime(timeLeft)}
            </motion.div>

            {/* Simple Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  mode === 'pomodoro' ? 'bg-primary' : 'bg-secondary'
                }`}
                style={{ width: `${getProgress()}%` }}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              {Math.round(getProgress())}% complete
            </div>
          </div>

          {/* Current Activity Display */}
          {selectedActivity && mode === 'pomodoro' && (
            <div className="flex items-center justify-center space-x-2 p-2 bg-muted/50 rounded-md">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium truncate">
                {selectedActivity.title}
              </span>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex justify-center space-x-2">
            <AnimatePresence mode="wait">
              {timerState === 'idle' ? (
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="px-8"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={timerState === 'running' ? handlePause : handleStart}
                    size="lg"
                  >
                    {timerState === 'running' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleStop}
                    size="lg"
                    variant="outline"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleReset}
                    size="lg"
                    variant="ghost"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Break Buttons - Only show when in pomodoro mode and idle */}
          {mode === 'pomodoro' && timerState === 'idle' && (
            <div className="flex justify-center space-x-2">
              <Button
                onClick={() => startBreak('shortBreak')}
                size="sm"
                variant="outline"
              >
                Short Break ({settings.shortBreakMinutes}m)
              </Button>
              <Button
                onClick={() => startBreak('longBreak')}
                size="sm"
                variant="outline"
              >
                Long Break ({settings.longBreakMinutes}m)
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-center space-x-6 text-center pt-2">
            <div>
              <div className="text-xl font-bold text-primary">
                {completedPomodoros}
              </div>
              <div className="text-xs text-muted-foreground">
                Today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}