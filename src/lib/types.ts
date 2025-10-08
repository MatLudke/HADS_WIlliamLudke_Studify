export type Activity = {
  id: string;
  userId: string;
  title: string;
  subject: string;
  estimatedDuration: number; // in minutes
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
};

export type StudySession = {
  id: string;
  userId: string;
  activityId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  subject: string;
};

export type TimerSettings = {
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  playSound: boolean;
};
