'use client';

import * as React from 'react';
import { Play, Pause, Square, Settings, Clock, Target } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { Activity, TimerSettings, ActiveSession } from '@/lib/types';
import { getActivities, addStudySession, startActiveSession, updateActiveSession, completeActiveSession, getActiveSession } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
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

interface TimerSession {
  startTime: number;
  totalTime: number;
  mode: TimerMode;
}

export function StudyTimerRedesigned() {
  const [settings, setSettings] = React.useState<TimerSettings>(DEFAULT_SETTINGS);
  const [timeLeft, setTimeLeft] = React.useState(DEFAULT_SETTINGS.pomodoroMinutes * 60);
  const [timerState, setTimerState] = React.useState<TimerState>('idle');
  const [mode, setMode] = React.useState<TimerMode>('pomodoro');
  const [completedPomodoros, setCompletedPomodoros] = React.useState(0);
  const [currentSession, setCurrentSession] = React.useState<TimerSession | null>(null);
  
  const { toast } = useToast();
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

  // Load settings and user data
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

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userActivities = await getActivities(currentUser.uid);
        setActivities(userActivities);
        
        // Check for existing active session
        try {
          const activeSession = await getActiveSession(currentUser.uid);
          if (activeSession) {
            setActiveSessionId(activeSession.id);
            setSelectedActivityId(activeSession.activityId);
            setMode(activeSession.mode as TimerMode);
            
            // Resume timer state
            const now = Date.now();
            const lastUpdate = activeSession.lastUpdated?.getTime() || now;
            const timeSinceUpdate = Math.floor((now - lastUpdate) / 1000);
            const newTimeLeft = Math.max(0, activeSession.currentTime - timeSinceUpdate);
            
            setTimeLeft(newTimeLeft);
            if (newTimeLeft > 0) {
              setTimerState('running');
              setCurrentSession({
                startTime: activeSession.startedAt.getTime(),
                totalTime: getTimerDuration(activeSession.mode as TimerMode, settings),
                mode: activeSession.mode as TimerMode
              });
            }
          }
        } catch (error) {
          console.error('Error loading active session:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Timer countdown effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerState === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Update active session every 10 seconds
          if (activeSessionId && newTime % 10 === 0) {
            updateActiveSession(activeSessionId, {
              currentTime: newTime,
              duration: getTimerDuration(mode, settings),
              mode: mode
            }).catch(console.error);
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, timeLeft, activeSessionId, mode, settings]);

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
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalTime = (): number => {
    return currentSession?.totalTime || getTimerDuration(mode, settings);
  };

  const getProgress = (): number => {
    const totalTime = getTotalTime();
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
        console.error('Error playing notification sound:', error);
      }
    }
  };

  const handleTimerComplete = async () => {
    playNotificationSound();
    setTimerState('idle');

    if (mode === 'pomodoro') {
      setCompletedPomodoros(prev => prev + 1);
      
      // Save study session
      if (user && selectedActivityId && currentSession) {
        const activity = activities.find(a => a.id === selectedActivityId);
        const actualDuration = Math.floor((Date.now() - currentSession.startTime) / 1000 / 60);
        
        await addStudySession(user.uid, {
          activityId: selectedActivityId,
          startAt: new Date(currentSession.startTime),
          endAt: new Date(),
          duration: actualDuration,
          mode: 'pomodoro',
          notes: '',
          subject: activity?.subject || 'Unknown'
        });
      }

      // Complete active session
      if (activeSessionId && user) {
        await completeActiveSession(activeSessionId, user.uid, {
          activityId: selectedActivityId || '',
          startAt: new Date(currentSession?.startTime || Date.now()),
          endAt: new Date(),
          duration: Math.floor((Date.now() - (currentSession?.startTime || Date.now())) / 1000 / 60),
          mode: 'pomodoro',
          notes: '',
          subject: activities.find(a => a.id === selectedActivityId)?.subject || 'Unknown'
        });
        setActiveSessionId(null);
      }

      toast({
        title: "Pomodoro Complete! 🍅",
        description: "Great job! Time for a break.",
      });

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        const nextMode = (completedPomodoros + 1) % settings.pomodorosBeforeLongBreak === 0 
          ? 'longBreak' 
          : 'shortBreak';
        setMode(nextMode);
        setTimeLeft(getTimerDuration(nextMode, settings));
        setTimerState('running');
      } else {
        const nextMode = (completedPomodoros + 1) % settings.pomodorosBeforeLongBreak === 0 
          ? 'longBreak' 
          : 'shortBreak';
        setMode(nextMode);
        setTimeLeft(getTimerDuration(nextMode, settings));
      }
    } else {
      // Break completed
      toast({
        title: "Break Complete! ☕",
        description: "Ready to get back to work?",
      });

      if (settings.autoStartPomodoros) {
        setMode('pomodoro');
        setTimeLeft(getTimerDuration('pomodoro', settings));
        setTimerState('running');
      } else {
        setMode('pomodoro');
        setTimeLeft(getTimerDuration('pomodoro', settings));
      }
    }

    setCurrentSession(null);
  };

  const handleStart = async () => {
    if (!selectedActivityId && mode === 'pomodoro') {
      toast({
        title: "Select an Activity",
        description: "Please select an activity before starting a pomodoro session.",
        variant: "destructive"
      });
      return;
    }

    if (timerState === 'idle' && mode === 'pomodoro' && user) {
      // Start new active session
      try {
        const sessionId = await startActiveSession(user.uid, selectedActivityId || '', mode);
        setActiveSessionId(sessionId);
      } catch (error) {
        console.error('Error starting active session:', error);
      }
    }

    setTimerState('running');
    setCurrentSession({
      startTime: Date.now(),
      totalTime: getTimerDuration(mode, settings),
      mode: mode
    });

    toast({
      title: `${mode === 'pomodoro' ? 'Focus' : 'Break'} Session Started`,
      description: `${formatTime(timeLeft)} of focused ${mode === 'pomodoro' ? 'work' : 'break'} time ahead!`,
    });
  };

  const handlePause = () => {
    setTimerState('paused');
    toast({
      title: "Timer Paused",
      description: "Take your time, the timer will wait for you.",
    });
  };

  const handleStop = async () => {
    if (activeSessionId && user && currentSession) {
      const activity = activities.find(a => a.id === selectedActivityId);
      const actualDuration = Math.floor((Date.now() - currentSession.startTime) / 1000 / 60);
      
      if (actualDuration > 0) {
        await completeActiveSession(activeSessionId, user.uid, {
          activityId: selectedActivityId || '',
          startAt: new Date(currentSession.startTime),
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
    setCurrentSession(null);
    
    toast({
      title: "Timer Stopped",
      description: "Session ended. Ready to start a new one?",
    });
  };

  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    
    if (timerState === 'idle') {
      setTimeLeft(getTimerDuration(mode, newSettings));
    }
  };

  const getModeDisplay = (timerMode: TimerMode): string => {
    switch (timerMode) {
      case 'pomodoro': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  const getModeColor = (timerMode: TimerMode): string => {
    switch (timerMode) {
      case 'pomodoro': return 'text-[#3F51B5]';
      case 'shortBreak': return 'text-[#8E24AA]';
      case 'longBreak': return 'text-[#8E24AA]';
    }
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-[#3F51B5]/20 shadow-lg bg-[#E8EAF6]/30">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`${getModeColor(mode)} border-current`}>
              {getModeDisplay(mode)}
            </Badge>
            <TimerSettingsDialog
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
          
          <CardTitle className="text-2xl font-semibold text-[#3F51B5] font-['PT_Sans']">
            Studify
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Activity Selection */}
          {mode === 'pomodoro' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3F51B5]">
                What are you working on?
              </label>
              <Select value={selectedActivityId || ''} onValueChange={setSelectedActivityId}>
                <SelectTrigger className="border-[#3F51B5]/30">
                  <SelectValue placeholder="Select an activity..." />
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
                        <span>{activity.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.subject}
                        </Badge>
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
              className="text-6xl font-bold text-[#3F51B5] font-mono"
              key={timeLeft}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatTime(timeLeft)}
            </motion.div>

            {/* Progress Ring */}
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#E8EAF6"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={mode === 'pomodoro' ? '#3F51B5' : '#8E24AA'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={351.86}
                  initial={{ strokeDashoffset: 351.86 }}
                  animate={{ strokeDashoffset: 351.86 - (getProgress() / 100) * 351.86 }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm text-[#3F51B5]/70">
                    {Math.round(getProgress())}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Activity Display */}
          {selectedActivity && mode === 'pomodoro' && (
            <div className="flex items-center justify-center space-x-2 p-3 bg-[#3F51B5]/10 rounded-lg">
              <Target className="w-4 h-4 text-[#3F51B5]" />
              <span className="text-sm font-medium text-[#3F51B5]">
                {selectedActivity.title}
              </span>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex justify-center space-x-4">
            <AnimatePresence mode="wait">
              {timerState === 'idle' ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={handleStart}
                    size="lg"
                    className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white px-8"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex space-x-3"
                >
                  <Button
                    onClick={timerState === 'running' ? handlePause : handleStart}
                    size="lg"
                    className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white"
                  >
                    {timerState === 'running' ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    onClick={handleStop}
                    size="lg"
                    variant="outline"
                    className="border-[#3F51B5] text-[#3F51B5] hover:bg-[#3F51B5]/10"
                  >
                    <Square className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Session Stats */}
          <div className="flex justify-center space-x-6 text-center">
            <div>
              <div className="text-2xl font-bold text-[#8E24AA]">
                {completedPomodoros}
              </div>
              <div className="text-xs text-[#3F51B5]/70">
                Completed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#8E24AA]">
                {settings.pomodorosBeforeLongBreak - (completedPomodoros % settings.pomodorosBeforeLongBreak)}
              </div>
              <div className="text-xs text-[#3F51B5]/70">
                Until Break
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}