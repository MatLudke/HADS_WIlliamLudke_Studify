'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TimerPresetsDialog } from './timer-presets';
import { motion, AnimatePresence } from 'framer-motion';

const timerSettingsSchema = z.object({
  pomodoroMinutes: z.number().min(5).max(120),
  shortBreakMinutes: z.number().min(1).max(30),
  longBreakMinutes: z.number().min(5).max(60),
  pomodorosBeforeLongBreak: z.number().min(2).max(8),
  autoStartBreaks: z.boolean(),
  autoStartPomodoros: z.boolean(),
  playSound: z.boolean(),
});

export type TimerSettings = z.infer<typeof timerSettingsSchema>;

interface TimerSettingsDialogProps {
  settings: TimerSettings;
  onSettingsChange: (settings: TimerSettings) => void;
}

export function TimerSettingsDialog({ settings, onSettingsChange }: TimerSettingsDialogProps) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<TimerSettings>({
    resolver: zodResolver(timerSettingsSchema),
    defaultValues: settings,
  });

  const onSubmit = (data: TimerSettings) => {
    onSettingsChange(data);
    setOpen(false);
  };

  const resetToDefaults = () => {
    const defaults: TimerSettings = {
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      pomodorosBeforeLongBreak: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      playSound: true,
    };
    form.reset(defaults);
  };

  const handlePresetSelect = (presetSettings: TimerSettings) => {
    form.reset(presetSettings);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ 
            scale: 1.05,
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.4 }
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Button variant="ghost" size="icon" className="relative overflow-hidden">
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Settings className="h-5 w-5" />
            </motion.div>
            <span className="sr-only">Timer Settings</span>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DialogHeader>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <DialogTitle className="text-xl font-bold">Timer Settings</DialogTitle>
                  <DialogDescription>
                    Customize your Pomodoro timer to fit your study preferences.
                  </DialogDescription>
                  <div className="flex justify-end pt-2">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <TimerPresetsDialog onPresetSelect={handlePresetSelect} />
                    </motion.div>
                  </div>
                </motion.div>
              </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pomodoroMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pomodoro (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shortBreakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Break (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longBreakMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Long Break (min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pomodorosBeforeLongBreak"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pomodoros until Long Break</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoStartBreaks"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-start breaks</FormLabel>
                      <FormDescription>
                        Automatically start break timers after completing a pomodoro
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoStartPomodoros"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-start pomodoros</FormLabel>
                      <FormDescription>
                        Automatically start pomodoro timers after completing a break
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="playSound"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Play notification sound</FormLabel>
                      <FormDescription>
                        Play a sound when timer completes
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
              <Button type="submit">Save Settings</Button>
            </DialogFooter>
          </form>
        </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
