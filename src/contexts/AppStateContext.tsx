'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { getActivities, getStudySessions, getActiveSession } from '@/lib/firestore';
import type { User } from 'firebase/auth';
import type { Activity, StudySession, ActiveSession } from '@/lib/types';

interface AppState {
  user: User | null;
  activities: Activity[];
  studySessions: StudySession[];
  activeSession: ActiveSession | null;
  loading: boolean;
}

interface AppContextType extends AppState {
  refreshActivities: () => Promise<void>;
  refreshStudySessions: () => Promise<void>;
  refreshActiveSession: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addActivityToState: (activity: Activity) => void;
  updateActivityInState: (id: string, updates: Partial<Activity>) => void;
  removeActivityFromState: (id: string) => void;
  addSessionToState: (session: StudySession) => void;
  setActiveSessionInState: (session: ActiveSession | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    user: null,
    activities: [],
    studySessions: [],
    activeSession: null,
    loading: true,
  });

  // Initialize and listen for auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setState(prev => ({ ...prev, user, loading: true }));
      
      if (user) {
        await loadAllData(user.uid);
      } else {
        setState(prev => ({
          ...prev,
          activities: [],
          studySessions: [],
          activeSession: null,
          loading: false,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const loadAllData = async (userId: string) => {
    try {
      const [activities, studySessions, activeSession] = await Promise.all([
        getActivities(userId),
        getStudySessions(userId),
        getActiveSession(userId),
      ]);

      setState(prev => ({
        ...prev,
        activities,
        studySessions,
        activeSession,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading app data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshActivities = async () => {
    if (!state.user) return;
    try {
      const activities = await getActivities(state.user.uid);
      setState(prev => ({ ...prev, activities }));
    } catch (error) {
      console.error('Error refreshing activities:', error);
    }
  };

  const refreshStudySessions = async () => {
    if (!state.user) return;
    try {
      const studySessions = await getStudySessions(state.user.uid);
      setState(prev => ({ ...prev, studySessions }));
    } catch (error) {
      console.error('Error refreshing study sessions:', error);
    }
  };

  const refreshActiveSession = async () => {
    if (!state.user) return;
    try {
      const activeSession = await getActiveSession(state.user.uid);
      setState(prev => ({ ...prev, activeSession }));
    } catch (error) {
      console.error('Error refreshing active session:', error);
    }
  };

  const refreshAll = async () => {
    if (!state.user) return;
    await loadAllData(state.user.uid);
  };

  // Optimistic updates for better UX
  const addActivityToState = (activity: Activity) => {
    setState(prev => ({
      ...prev,
      activities: [...prev.activities, activity],
    }));
  };

  const updateActivityInState = (id: string, updates: Partial<Activity>) => {
    setState(prev => ({
      ...prev,
      activities: prev.activities.map(activity =>
        activity.id === id ? { ...activity, ...updates } : activity
      ),
    }));
  };

  const removeActivityFromState = (id: string) => {
    setState(prev => ({
      ...prev,
      activities: prev.activities.filter(activity => activity.id !== id),
      // Clear active session if it references the deleted activity
      activeSession: prev.activeSession?.activityId === id ? null : prev.activeSession,
    }));
  };

  const addSessionToState = (session: StudySession) => {
    setState(prev => ({
      ...prev,
      studySessions: [...prev.studySessions, session],
    }));
  };

  const setActiveSessionInState = (session: ActiveSession | null) => {
    setState(prev => ({ ...prev, activeSession: session }));
  };

  const contextValue: AppContextType = {
    ...state,
    refreshActivities,
    refreshStudySessions,
    refreshActiveSession,
    refreshAll,
    addActivityToState,
    updateActivityInState,
    removeActivityFromState,
    addSessionToState,
    setActiveSessionInState,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};