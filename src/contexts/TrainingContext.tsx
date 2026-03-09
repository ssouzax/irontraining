import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TrainingProgram, UserProfile, WorkoutLog, LoggedSet } from '@/types/training';
import { defaultProfile, getProfileForUser, emptyProgram, getProgramForUser } from '@/data/defaultProfile';
import { useAuth } from '@/contexts/AuthContext';

interface TrainingState {
  profile: UserProfile;
  program: TrainingProgram;
  currentWeek: number;
  currentDay: number;
  workoutLogs: WorkoutLog[];
  setCurrentWeek: (w: number) => void;
  setCurrentDay: (d: number) => void;
  logWorkout: (log: WorkoutLog) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
}

const TrainingContext = createContext<TrainingState | null>(null);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isOwner = user?.email?.toLowerCase() === 'samuelsouzapon@gmail.com';
  
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [program, setProgram] = useState<TrainingProgram>(emptyProgram);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  // Load data based on user - only owner gets pre-filled data, everyone else starts clean
  useEffect(() => {
    if (!user?.email) return;
    
    if (isOwner) {
      // Owner: load saved data or defaults
      const savedProfile = localStorage.getItem('pb_profile');
      const savedLogs = localStorage.getItem('pb_logs');
      setProfile(savedProfile ? JSON.parse(savedProfile) : getProfileForUser(user.email));
      setProgram(getProgramForUser(user.email));
      setWorkoutLogs(savedLogs ? JSON.parse(savedLogs) : []);
    } else {
      // Everyone else: completely clean - ignore any localStorage remnants
      const savedProfile = localStorage.getItem('pb_profile');
      const savedLogs = localStorage.getItem('pb_logs');
      // Only use saved data if user previously saved their own data (bodyWeight > 0 means they configured it)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.bodyWeight > 0 && parsed.email === user.email) {
          setProfile(parsed);
        } else {
          setProfile(defaultProfile);
          localStorage.removeItem('pb_profile');
        }
      }
      if (savedLogs) {
        // Keep user's own logs if they have any
        setWorkoutLogs(JSON.parse(savedLogs));
      }
      setProgram(emptyProgram);
    }
  }, [user?.email, isOwner]);

  useEffect(() => {
    localStorage.setItem('pb_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('pb_logs', JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  const logWorkout = (log: WorkoutLog) => {
    setWorkoutLogs(prev => [...prev.filter(l => l.dayId !== log.dayId || l.date !== log.date), log]);
  };

  const updateProfile = (p: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...p }));
  };

  return (
    <TrainingContext.Provider value={{
      profile, program, currentWeek, currentDay, workoutLogs,
      setCurrentWeek, setCurrentDay, logWorkout, updateProfile,
    }}>
      {children}
    </TrainingContext.Provider>
  );
}

export const useTraining = () => {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error('useTraining must be used within TrainingProvider');
  return ctx;
};
