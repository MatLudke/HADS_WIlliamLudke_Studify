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
  startAt: Date;
  endAt: Date;
  duration: number; // in minutes
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  notes?: string;
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

export type ActiveSession = {
  id: string;
  userId: string;
  activityId: string;
  mode: string;
  startedAt: Date;
  currentTime: number;
  duration: number;
  lastUpdated: Date;
};

export type NotificationPreferences = {
  enabled: boolean;
  timerCompletion: boolean;
  breakReminders: boolean;
  studyReminders: boolean;
  emailReminders: boolean;
  reminderTime: number; // minutes before activity
  fcmToken?: string;
};

export type ScheduledNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  scheduledFor: Date;
  type: 'timer' | 'break' | 'reminder' | 'activity';
  activityId?: string;
  sent: boolean;
};
