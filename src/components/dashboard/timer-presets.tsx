'use client';

import * as React from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Coffee, Brain } from 'lucide-react';
import type { TimerSettings } from '@/lib/types';

interface TimerPreset {
  name: string;
  description: string;
  icon: React.ReactNode;
  settings: TimerSettings;
}

const TIMER_PRESETS: TimerPreset[] = [
  {
    name: 'Classic Pomodoro',
    description: 'Traditional 25/5/15 minute intervals',
    icon: <Clock className="h-5 w-5" />,
    settings: {
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      pomodorosBeforeLongBreak: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      playSound: true,
    },
  },
  {
    name: 'Power Focus',
    description: 'Longer focus periods for deep work',
    icon: <Zap className="h-5 w-5" />,
    settings: {
      pomodoroMinutes: 45,
      shortBreakMinutes: 10,
      longBreakMinutes: 30,
      pomodorosBeforeLongBreak: 3,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      playSound: true,
    },
  },
  {
    name: 'Quick Sprints',
    description: 'Short bursts for when time is limited',
    icon: <Coffee className="h-5 w-5" />,
    settings: {
      pomodoroMinutes: 15,
      shortBreakMinutes: 3,
      longBreakMinutes: 10,
      pomodorosBeforeLongBreak: 6,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      playSound: true,
    },
  },
  {
    name: 'Flow State',
    description: 'Extended sessions with automatic transitions',
    icon: <Brain className="h-5 w-5" />,
    settings: {
      pomodoroMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      pomodorosBeforeLongBreak: 3,
      autoStartBreaks: true,
      autoStartPomodoros: true,
      playSound: true,
    },
  },
];

interface TimerPresetsDialogProps {
  onPresetSelect: (settings: TimerSettings) => void;
}

export function TimerPresetsDialog({ onPresetSelect }: TimerPresetsDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handlePresetSelect = (preset: TimerPreset) => {
    onPresetSelect(preset.settings);
    setOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: { 
      y: 25, 
      opacity: 0, 
      scale: 0.92,
      rotateX: 10,
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 25,
        duration: 0.7,
      },
    },
  };

  const cardHoverVariants = {
    rest: { 
      scale: 1, 
      y: 0,
      rotateY: 0,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    hover: { 
      scale: 1.03, 
      y: -4,
      rotateY: 2,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.4,
      }
    },
    tap: { 
      scale: 0.97,
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.2,
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
          whileTap={{ 
            scale: 0.95,
            transition: { duration: 0.1 }
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            duration: 0.3,
          }}
        >
          <Button variant="outline" size="sm" className="overflow-hidden">
            <motion.div
              className="flex items-center"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Presets
            </motion.div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
          >
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Timer Presets
            </DialogTitle>
            <DialogDescription className="text-base">
              Choose from popular timer configurations or customize your own.
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        <AnimatePresence>
          {open && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {TIMER_PRESETS.map((preset, index) => (
                <motion.div
                  key={preset.name}
                  variants={itemVariants}
                  custom={index}
                  layout
                >
                  <motion.div
                    variants={cardHoverVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <Card className="cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <motion.div 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: 0.1 + index * 0.08,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 200,
                          }}
                        >
                          <motion.div
                            whileHover={{ 
                              rotate: [0, -10, 10, -5, 5, 0],
                              scale: 1.1,
                            }}
                            transition={{ 
                              duration: 0.6,
                              ease: "easeInOut",
                            }}
                          >
                            {preset.icon}
                          </motion.div>
                          <CardTitle className="text-lg">{preset.name}</CardTitle>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.2 + index * 0.08,
                            duration: 0.4,
                          }}
                        >
                          <CardDescription className="text-sm">
                            {preset.description}
                          </CardDescription>
                        </motion.div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <motion.div 
                          className="flex flex-wrap gap-2"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.3 + index * 0.08,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 200,
                          }}
                        >
                          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                            <Badge variant="secondary" className="text-xs">
                              {preset.settings.pomodoroMinutes}m focus
                            </Badge>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                            <Badge variant="secondary" className="text-xs">
                              {preset.settings.shortBreakMinutes}m break
                            </Badge>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                            <Badge variant="secondary" className="text-xs">
                              {preset.settings.longBreakMinutes}m long break
                            </Badge>
                          </motion.div>
                          {preset.settings.autoStartBreaks && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                delay: 0.4 + index * 0.08,
                                type: "spring",
                                stiffness: 300,
                                damping: 25
                              }}
                              whileHover={{ 
                                scale: 1.1,
                                rotate: [0, -5, 5, 0],
                                transition: { duration: 0.4 }
                              }}
                            >
                              <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                Auto-start
                              </Badge>
                            </motion.div>
                          )}
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
