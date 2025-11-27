
"use server";

import { collection, addDoc, getDocs, getDoc, setDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Activity, StudySession, ActiveSession } from "./types";
import { revalidatePath } from "next/cache";

const activitiesCollection = collection(db, "activities");
const studySessionsCollection = collection(db, "studySessions");

export const addActivity = async (userId: string, activity: Omit<Activity, 'id' | 'userId'>) => {
    if (!userId) throw new Error("User not authenticated");
    const docRef = await addDoc(activitiesCollection, { ...activity, userId });
    revalidatePath("/dashboard");
    return docRef.id;
};

export const getActivities = async (userId: string): Promise<Activity[]> => {
    if (!userId) return [];
    
    const q = query(activitiesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const activities = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            title: data.title,
            subject: data.subject,
            estimatedDuration: data.estimatedDuration,
            priority: data.priority,
            status: data.status,
            goalType: data.goalType,
            goalTarget: data.goalTarget,
            goalStartDate: data.goalStartDate instanceof Timestamp ? data.goalStartDate.toDate() : data.goalStartDate,
            goalRemindersEnabled: data.goalRemindersEnabled,
            savedTimerProgress: data.savedTimerProgress,
            savedTimerDuration: data.savedTimerDuration,
        } as Activity;
    });
    return activities;
};

export const updateActivity = async (id: string, activity: Partial<Omit<Activity, 'id' | 'userId'>>) => {
    const docRef = doc(db, "activities", id);
    await updateDoc(docRef, activity);
    revalidatePath("/dashboard");
};

export const updateActivityTimerProgress = async (id: string, savedTimerProgress: number | null, savedTimerDuration: number | null) => {
    const docRef = doc(db, "activities", id);
    await updateDoc(docRef, {
        savedTimerProgress: savedTimerProgress ?? null,
        savedTimerDuration: savedTimerDuration ?? null,
    });
};

export const deleteActivity = async (id: string) => {
    const docRef = doc(db, "activities", id);
    await deleteDoc(docRef);
    revalidatePath("/dashboard");
};

// Reminder: keep active session updates for background resilience
export const updateActiveSession = async (sessionId: string, progress: { currentTime: number, duration: number, mode: string }) => {
    const docRef = doc(db, "activeSessions", sessionId);
    await updateDoc(docRef, {
        ...progress,
        lastUpdated: serverTimestamp()
    });
};

export const startActiveSession = async (userId: string, activityId: string, mode: string) => {
    if (!userId) throw new Error("User not authenticated");
    const docRef = await addDoc(collection(db, "activeSessions"), {
        userId,
        activityId,
        mode,
        startedAt: serverTimestamp(),
        currentTime: 0,
        duration: 0,
        lastUpdated: serverTimestamp()
    });
    return docRef.id;
};

export const completeActiveSession = async (sessionId: string, userId: string, session: Omit<StudySession, 'id' | 'userId'>) => {
    // Add completed session
    await addStudySession(userId, session);
    // Remove from active sessions
    const docRef = doc(db, "activeSessions", sessionId);
    await deleteDoc(docRef);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
};

export const getActiveSession = async (userId: string): Promise<ActiveSession | null> => {
    if (!userId) return null;
    const q = query(collection(db, "activeSessions"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    // Handle multiple sessions - clean up duplicates
    if (snapshot.docs.length > 1) {
        // Multiple sessions detected - clean up (logged in dev mode only)
        
        // Sort by lastUpdated to keep the most recent
        const sortedDocs = snapshot.docs.sort((a, b) => {
            const aTime = a.data().lastUpdated instanceof Timestamp 
                ? a.data().lastUpdated.toMillis() 
                : new Date(a.data().lastUpdated).getTime();
            const bTime = b.data().lastUpdated instanceof Timestamp 
                ? b.data().lastUpdated.toMillis() 
                : new Date(b.data().lastUpdated).getTime();
            return bTime - aTime;
        });
        
        // Delete older sessions
        const deletePromises = sortedDocs.slice(1).map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        // Use the most recent session
        const doc = sortedDocs[0];
        const data = doc.data();
        
        return {
            id: doc.id,
            userId: data.userId,
            activityId: data.activityId,
            mode: data.mode,
            currentTime: data.currentTime,
            duration: data.duration,
            startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
            lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
        };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Convert Firestore Timestamps to plain JavaScript objects to avoid Next.js serialization errors
    return {
        id: doc.id,
        userId: data.userId,
        activityId: data.activityId,
        mode: data.mode,
        currentTime: data.currentTime,
        duration: data.duration,
        startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
        lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
    };
};

// CSV Export functionality
export const exportStudySessionsCSV = async (userId: string, startDate?: Date, endDate?: Date): Promise<string> => {
    if (!userId) throw new Error("User not authenticated");
    
    let q = query(studySessionsCollection, where("userId", "==", userId));
    
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startAt: (data.startAt as Timestamp).toDate(),
            endAt: (data.endAt as Timestamp).toDate(),
        } as StudySession;
    });

    // Filter by date range if provided
    const filteredSessions = sessions.filter(session => {
        const sessionDate = session.startAt;
        if (startDate && sessionDate < startDate) return false;
        if (endDate && sessionDate > endDate) return false;
        return true;
    });

    // Generate CSV content
    const headers = ['Date', 'Activity ID', 'Subject', 'Mode', 'Duration (minutes)', 'Start Time', 'End Time', 'Notes'];
    const csvRows = [headers.join(',')];
    
    filteredSessions.forEach(session => {
        const row = [
            session.startAt.toLocaleDateString(),
            session.activityId,
            `"${session.subject}"`,
            session.mode,
            session.duration.toString(),
            session.startAt.toLocaleTimeString(),
            session.endAt.toLocaleTimeString(),
            `"${session.notes || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
};

export const exportActivitiesCSV = async (userId: string): Promise<string> => {
    if (!userId) throw new Error("User not authenticated");
    
    const activities = await getActivities(userId);
    
    const headers = ['Title', 'Subject', 'Priority', 'Status', 'Estimated Duration (minutes)'];
    const csvRows = [headers.join(',')];
    
    activities.forEach(activity => {
        const row = [
            `"${activity.title}"`,
            `"${activity.subject}"`,
            activity.priority,
            activity.status,
            activity.estimatedDuration.toString()
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
};

export const addStudySession = async (userId: string, session: Omit<StudySession, 'id' | 'userId'>) => {
    if (!userId) throw new Error("User not authenticated");
    await addDoc(studySessionsCollection, { ...session, userId });
    revalidatePath("/dashboard/reports");
};

export const getStudySessions = async (userId: string): Promise<StudySession[]> => {
    if (!userId) return [];
    
    const q = query(studySessionsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            // Convert Firestore Timestamps to JS Date objects
            startAt: data.startAt instanceof Timestamp ? data.startAt.toDate() : data.startAt,
            endAt: data.endAt instanceof Timestamp ? data.endAt.toDate() : data.endAt,
        } as StudySession;
    });
    return sessions;
};

// Delete session history - removes only study sessions, keeps activities
export const deleteSessionHistory = async (userId: string) => {
    if (!userId) throw new Error("User ID is required");
    
    try {
        // Delete all study sessions
        const sessionsQuery = query(studySessionsCollection, where("userId", "==", userId));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessionDeletions = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        
        // Delete any active sessions
        const activeSessionsQuery = query(collection(db, "activeSessions"), where("userId", "==", userId));
        const activeSessionsSnapshot = await getDocs(activeSessionsQuery);
        const activeSessionDeletions = activeSessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        
        // Execute all deletions in parallel
        await Promise.all([
            ...sessionDeletions,
            ...activeSessionDeletions
        ]);
        
        revalidatePath("/dashboard/reports");
    } catch (error) {
        console.error("Error deleting session history:", error);
        throw new Error("Failed to delete session history");
    }
};

// Notification Preferences
export const saveNotificationPreferences = async (userId: string, preferences: any) => {
    if (!userId) throw new Error("User ID is required");
    
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
        notificationPreferences: preferences,
        updatedAt: serverTimestamp()
    }, { merge: true });
    revalidatePath("/dashboard/settings");
};

export const getNotificationPreferences = async (userId: string): Promise<any | null> => {
    if (!userId) return null;
    
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
        return userDoc.data().notificationPreferences || null;
    }
    return null;
};

// Complete account deletion - removes ALL user data
export const deleteUserAccount = async (userId: string) => {
    if (!userId) throw new Error("User ID is required");
    
    try {
        // Delete all activities
        const activitiesQuery = query(activitiesCollection, where("userId", "==", userId));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activityDeletions = activitiesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        
        // Delete all study sessions
        const sessionsQuery = query(studySessionsCollection, where("userId", "==", userId));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessionDeletions = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        
        // Delete any active sessions
        const activeSessionsQuery = query(collection(db, "activeSessions"), where("userId", "==", userId));
        const activeSessionsSnapshot = await getDocs(activeSessionsQuery);
        const activeSessionDeletions = activeSessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        
        // Execute all deletions in parallel
        await Promise.all([
            ...activityDeletions,
            ...sessionDeletions,
            ...activeSessionDeletions
        ]);
        
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/reports");
    } catch (error) {
        console.error("Error deleting user account data:", error);
        throw new Error("Failed to delete user account data");
    }
};

// Flashcard Sessions
const flashcardSessionsCollection = collection(db, "flashcardSessions");

export const addFlashcardSession = async (
    userId: string, 
    session: Omit<import("./types").FlashcardSession, 'id' | 'userId' | 'createdAt'>
) => {
    if (!userId) throw new Error("User not authenticated");
    const docRef = await addDoc(flashcardSessionsCollection, { 
        ...session, 
        userId,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const getFlashcardSessions = async (userId: string): Promise<import("./types").FlashcardSession[]> => {
    if (!userId) return [];
    
    const q = query(flashcardSessionsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        } as import("./types").FlashcardSession;
    });
    
    // Sort by most recent first
    return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
