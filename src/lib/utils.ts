import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Time formatting utilities
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

export function formatStudyTime(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes * 10) / 10}min`;
  }
  
  const hours = totalMinutes / 60;
  return `${Math.round(hours * 10) / 10}h`;
}

export function getActivityTitle(activities: any[], activityId: string): string {
  const activity = activities.find(a => a.id === activityId);
  return activity?.title || 'Unknown Activity';
}
