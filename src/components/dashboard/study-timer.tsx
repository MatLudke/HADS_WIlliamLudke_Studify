'use client';

import * as React from 'react';
import { Play, Pause, RefreshCw, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import type { Activity, TimerSettings } from '@/lib/types';
import { getActivities, addStudySession } from '@/lib/firestore';
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

export function StudyTimer() {
  const [settings, setSettings] = React.useState<TimerSettings>(DEFAULT_SETTINGS);
  const [timeLeft, setTimeLeft] = React.useState(DEFAULT_SETTINGS.pomodoroMinutes * 60);
  const [isActive, setIsActive] = React.useState(false);
  const [mode, setMode] = React.useState<TimerMode>('pomodoro');
  const [pomodoros, setPomodoros] = React.useState(0);
  const [sessionStartTime, setSessionStartTime] = React.useState<Date | null>(null);
  const { toast } = useToast();
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);

  // Load settings from localStorage
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

  // Save settings to localStorage
  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    
    // Update timer if not running
    if (!isActive) {
      const newTime = getTimerDuration(mode, newSettings);
      setTimeLeft(newTime);
    }
  };

  const getTimerDuration = (timerMode: TimerMode, timerSettings: TimerSettings) => {
    switch (timerMode) {
      case 'pomodoro': return timerSettings.pomodoroMinutes * 60;
      case 'shortBreak': return timerSettings.shortBreakMinutes * 60;
      case 'longBreak': return timerSettings.longBreakMinutes * 60;
    }
  };

  const playNotificationSound = () => {
    if (settings.playSound) {
      // Create a simple beep sound using Web Audio API
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

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userActivities = await getActivities(currentUser.uid);
        setActivities(userActivities);
      } else {
        setActivities([]);
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerEnd();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  const handleTimerEnd = async () => {
    setIsActive(false);
    playNotificationSound();
    
    const isPomodoro = mode === 'pomodoro';
    const isBreak = mode === 'shortBreak' || mode === 'longBreak';

    toast({
        title: "Session complete!",
        description: isPomodoro ? "Time for a break!" : "Break's over. Ready to focus?",
    });

    if (isPomodoro) {
      // Save study session
      if (user && selectedActivityId && sessionStartTime) {
        const activity = activities.find(a => a.id === selectedActivityId);
        if (activity) {
          try {
            await addStudySession(user.uid, {
              activityId: selectedActivityId,
              startTime: sessionStartTime,
              endTime: new Date(),
              duration: settings.pomodoroMinutes,
              subject: activity.subject,
            });
            toast({ title: "Study session saved!" });
          } catch (error) {
            toast({ variant: "destructive", title: "Error saving session" });
          }
        }
      }

      const newPomodoros = pomodoros + 1;
      setPomodoros(newPomodoros);
      
      // Determine next break type
      const isLongBreakTime = newPomodoros % settings.pomodorosBeforeLongBreak === 0;
      const nextMode = isLongBreakTime ? 'longBreak' : 'shortBreak';
      const nextDuration = getTimerDuration(nextMode, settings);
      
      setMode(nextMode);
      setTimeLeft(nextDuration);
      
      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setIsActive(true);
        setSessionStartTime(new Date());
      }
    } else {
      // Break ended, switch to pomodoro
      setMode('pomodoro');
      setTimeLeft(getTimerDuration('pomodoro', settings));
      
      // Auto-start pomodoro if enabled
      if (settings.autoStartPomodoros) {
        setIsActive(true);
        setSessionStartTime(new Date());
      }
    }
  };

  const toggleTimer = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "You are not logged in",
        description: "Log in to start a study session.",
      });
      return;
    }
     if (mode === 'pomodoro' && !selectedActivityId) {
      toast({
        variant: "destructive",
        title: "No activity selected",
        description: "Please select an activity to focus on.",
      });
      return;
    }
    
    if (!isActive) {
      setSessionStartTime(new Date());
    }
    
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('pomodoro');
    setTimeLeft(getTimerDuration('pomodoro', settings));
    setPomodoros(0);
    setSessionStartTime(null);
  };

  const skipTimer = () => {
    setIsActive(false);
    handleTimerEnd();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'pomodoro': return 'Focus';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  }

  const getModeColor = () => {
    switch (mode) {
      case 'pomodoro': return 'text-red-600 dark:text-red-400';
      case 'shortBreak': return 'text-green-600 dark:text-green-400';
      case 'longBreak': return 'text-blue-600 dark:text-blue-400';
    }
  }

  const getTimerStrokeColor = () => {
    switch (mode) {
      case 'pomodoro': return 'stroke-red-500';
      case 'shortBreak': return 'stroke-green-500';
      case 'longBreak': return 'stroke-blue-500';
    }
  }

  const getTotalTime = () => {
    return getTimerDuration(mode, settings);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1 
      }}
    >
      <Card className="flex flex-col border-none shadow-xl shadow-black/5 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Study Session</CardTitle>
              <motion.div
                key={`${mode}-${pomodoros}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <CardDescription className={getModeColor()}>
                  {getModeLabel()} • {pomodoros}/{settings.pomodorosBeforeLongBreak} completed
                </CardDescription>
              </motion.div>
            </div>
            <TimerSettingsDialog settings={settings} onSettingsChange={handleSettingsChange} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center flex-1 gap-8">
          <motion.div 
            className="relative h-56 w-56"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <svg className="absolute inset-0" viewBox="0 0 100 100">
              <circle className="stroke-current text-muted/50" strokeWidth="5" cx="50" cy="50" r="45" fill="transparent" />
              <motion.circle
                className={`stroke-current ${getTimerStrokeColor()}`}
                strokeWidth="5"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                initial={{ strokeDashoffset: `${2 * Math.PI * 45}` }}
                animate={{ 
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - (timeLeft / getTotalTime()))}` 
                }}
                transform="rotate(-90 50 50)"
                transition={{ 
                  duration: isActive ? 1 : 0.6, 
                  ease: "easeInOut",
                  type: "tween"
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span 
                className="text-6xl font-bold font-mono tracking-tighter text-foreground"
                key={timeLeft}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {formatTime(timeLeft)}
              </motion.span>
            </div>
          </motion.div>
          
          <div className="w-full space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'pomodoro' && (
                <motion.div
                  key="activity-select"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Select 
                    disabled={!user || isActive}
                    onValueChange={(value) => setSelectedActivityId(value)}
                    value={selectedActivityId ?? ""}
                  >
                    <SelectTrigger className="py-6 transition-all duration-300 hover:shadow-md">
                      <SelectValue placeholder="Select an activity to focus on" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities
                        .filter((a) => a.status !== 'done')
                        .map((activity) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
              
              {mode !== 'pomodoro' && (
                <motion.div 
                  key="break-badge"
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Badge variant="secondary" className="text-lg py-2 px-4 transition-all duration-300 hover:shadow-md">
                    {getModeLabel()} Time
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div 
              className="flex justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Button size="lg" onClick={toggleTimer} className="w-40 py-7 text-lg transition-all duration-300">
                  <motion.div
                    key={isActive ? 'pause' : 'play'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                    {isActive ? 'Pause' : 'Start'}
                  </motion.div>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Button size="lg" variant="outline" onClick={skipTimer} className="py-7 transition-all duration-300 hover:shadow-md">
                  <SkipForward className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Button size="lg" variant="outline" onClick={resetTimer} className="py-7 transition-all duration-300 hover:shadow-md">
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {[...Array(settings.pomodorosBeforeLongBreak)].map((_, i) => (
              <motion.div 
                key={i} 
                className={`h-3 w-3 rounded-full transition-all duration-500 ${i < pomodoros ? 'bg-primary shadow-lg' : 'bg-muted'}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.4 + (i * 0.1),
                  ease: "backOut"
                }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
